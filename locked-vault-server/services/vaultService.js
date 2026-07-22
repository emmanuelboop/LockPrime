const prisma = require("../config/prisma");

const {

    validatePositiveAmount,

    validateNonNegativeAmount,

    validateLockDays,

    validateVaultName,

} = require("../utils/amountValidation");

const {

    serializeVault,

    serializeTransaction,

    serializeMoney,

    moneyEquals,

    toMoneyDecimal,

    ZERO,

} = require("../utils/money");

const notificationService = require("./notificationService");

const paymentService = require("./paymentService");

const {

    TRANSACTION_STATUS,

    TRANSACTION_TYPE,

    PAYMENT_STATUS,

} = require("../payments/constants");

const ledgerService = require("../payments/services/ledgerService");

const { LEDGER_ACCOUNT_TYPE } = require("../payments/constants");



const ACTIVE_PAYMENT_STATUSES = new Set([

    PAYMENT_STATUS.INITIATED,

    PAYMENT_STATUS.PENDING,

    PAYMENT_STATUS.PROCESSING,

]);



const createBusinessError = (message, statusCode) => {

    const error = new Error(message);

    error.statusCode = statusCode;

    return error;

};



const isVaultLocked = (vault) => {

    if (!vault.unlockDate) {

        return false;

    }



    return new Date() < new Date(vault.unlockDate);

};



const getDaysRemaining = (unlockDate) => {

    const today = new Date();



    return Math.max(

        0,

        Math.ceil(

            (new Date(unlockDate) - today) / (1000 * 60 * 60 * 24)

        )

    );

};



const createVault = async (vaultData, userId) => {

    const { name, amount } = vaultData;



    const validatedName = validateVaultName(name);

    const validatedAmount = validateNonNegativeAmount(amount ?? 0);



    const vault = await prisma.$transaction(async (tx) => {

        const createdVault = await tx.vault.create({

            data: {

                name: validatedName,

                balance: 0,

                userId,

            },

        });



        if (validatedAmount > 0) {

            await paymentService.processSimulatedDeposit({

                userId,

                vaultId: createdVault.id,

                amount: validatedAmount,

                client: tx,

            });

        }



        return tx.vault.findUnique({

            where: {

                id: createdVault.id,

            },

        });

    });



    const serializedVault = serializeVault(vault);



    if (validatedAmount > 0) {

        notificationService.notifyDeposit({

            userId,

            vaultName: serializedVault.name,

            amount: validatedAmount,

            vaultBalance: serializedVault.balance,

        });

    }



    return serializedVault;

};



const lockVault = async (vaultId, lockDays, userId) => {

    const validatedLockDays = validateLockDays(lockDays);



    const vault = await prisma.vault.findFirst({

        where: {

            id: vaultId,

            userId,

        },

    });



    if (!vault) {

        throw createBusinessError("Vault not found", 404);

    }



    if (moneyEquals(vault.balance, ZERO)) {

        throw createBusinessError(

            "Vault must have funds before it can be locked",

            400

        );

    }



    if (isVaultLocked(vault)) {

        throw createBusinessError("Vault is already locked", 400);

    }



    const unlockDate = new Date();

    unlockDate.setDate(unlockDate.getDate() + validatedLockDays);



    const updatedVault = await prisma.vault.update({

        where: {

            id: vaultId,

        },

        data: {

            unlockDate,

            unlockNotifiedAt: null,

        },

    });



    const serializedVault = serializeVault(updatedVault);



    notificationService.notifyVaultLocked({

        userId,

        vaultName: serializedVault.name,

        lockDays: validatedLockDays,

        unlockDate: updatedVault.unlockDate,

    });



    return serializedVault;

};



const getVaults = async (userId) => {

    await notificationService.processVaultUnlockNotifications(userId);



    const vaults = await prisma.vault.findMany({

        where: {

            userId,

        },

    });



    return vaults.map((vault) =>

        serializeVault({

            ...vault,

            daysRemaining: vault.unlockDate

                ? getDaysRemaining(vault.unlockDate)

                : null,

        })

    );

};



const depositMoney = async (vaultId, amount, userId, options = {}) => {

    const validatedAmount = validatePositiveAmount(amount);

    const { idempotencyKey } = options;



    const result = await paymentService.initiateDeposit({

        userId,

        vaultId,

        amount: validatedAmount,

        idempotencyKey,

    });



    if (!result.alreadyCompleted) {

        notificationService.notifyDeposit({

            userId,

            vaultName: result.vault.name,

            amount: validatedAmount,

            vaultBalance: result.vault.balance,

        });

    }



    return result;

};



const withdrawMoney = async (vaultId, amount, userId, options = {}) => {

    const validatedAmount = validatePositiveAmount(amount);

    const { idempotencyKey } = options;



    const vault = await prisma.vault.findFirst({

        where: {

            id: vaultId,

            userId,

        },

    });



    if (!vault) {

        throw createBusinessError("Vault not found", 404);

    }



    if (isVaultLocked(vault)) {

        throw createBusinessError("Vault is still locked", 403);

    }



    const result = await paymentService.initiateWithdrawal({

        userId,

        vaultId,

        amount: validatedAmount,

        idempotencyKey,

    });



    if (!result.alreadyCompleted) {

        notificationService.notifyWithdrawal({

            userId,

            vaultName: result.vault.name,

            amount: validatedAmount,

            vaultBalance: result.vault.balance,

        });

    }



    return result;

};



const getTransactions = async (vaultId, userId) => {

    const vault = await prisma.vault.findFirst({

        where: {

            id: vaultId,

            userId,

        },

    });



    if (!vault) {

        throw createBusinessError("Vault not found", 404);

    }



    const transactions = await prisma.transaction.findMany({

        where: {

            vaultId,

            status: {

                in: [

                    TRANSACTION_STATUS.PENDING,

                    TRANSACTION_STATUS.PROCESSING,

                    TRANSACTION_STATUS.COMPLETED,

                    TRANSACTION_STATUS.FAILED,

                    TRANSACTION_STATUS.CANCELLED,

                    TRANSACTION_STATUS.REVERSED,

                ],

            },

        },

        orderBy: {

            createdAt: "desc",

        },

    });



    return transactions.map(serializeTransaction);

};



const deleteVault = async (vaultId, userId) => {

    const vault = await prisma.vault.findFirst({

        where: {

            id: vaultId,

            userId,

        },

    });



    if (!vault) {

        throw createBusinessError("Vault not found", 404);

    }



    const activePaymentCount = await prisma.payment.count({

        where: {

            vaultId,

            status: {

                in: Array.from(ACTIVE_PAYMENT_STATUSES),

            },

        },

    });



    if (activePaymentCount > 0) {

        throw createBusinessError(

            "Vault cannot be deleted while payments are pending",

            400

        );

    }



    const reservedBalance = await ledgerService.sumAccountBalance(

        prisma,

        vaultId,

        LEDGER_ACCOUNT_TYPE.WITHDRAWAL_PENDING

    );



    if (!moneyEquals(reservedBalance, ZERO)) {

        throw createBusinessError(

            "Vault cannot be deleted while withdrawal funds are reserved",

            400

        );

    }



    if (!moneyEquals(vault.balance, ZERO)) {

        throw createBusinessError(

            "Vault must have a zero balance before it can be deleted",

            400

        );

    }



    await prisma.$transaction(async (tx) => {

        await tx.payment.deleteMany({

            where: {

                vaultId,

            },

        });



        await tx.ledgerEntry.deleteMany({

            where: {

                vaultId,

            },

        });



        await tx.transaction.deleteMany({

            where: {

                vaultId,

            },

        });



        await tx.vault.delete({

            where: {

                id: vaultId,

            },

        });

    });

};



const renameVault = async (vaultId, name, userId) => {

    const validatedName = validateVaultName(name);



    const vault = await prisma.vault.findFirst({

        where: {

            id: vaultId,

            userId,

        },

    });



    if (!vault) {

        throw createBusinessError("Vault not found", 404);

    }



    const updatedVault = await prisma.vault.update({

        where: {

            id: vaultId,

        },

        data: {

            name: validatedName,

        },

    });



    return serializeVault(updatedVault);

};



module.exports = {

    createVault,

    lockVault,

    getVaults,

    depositMoney,

    withdrawMoney,

    getTransactions,

    deleteVault,

    renameVault,

    isVaultLocked,

};


