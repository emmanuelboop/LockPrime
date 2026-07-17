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
    MAX_MONEY_AMOUNT,
} = require("../utils/money");
const notificationService = require("./notificationService");

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
                balance: validatedAmount,
                userId,
            },
        });

        if (validatedAmount > 0) {
            await tx.transaction.create({
                data: {
                    vaultId: createdVault.id,
                    amount: validatedAmount,
                    type: "deposit",
                },
            });
        }

        return createdVault;
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

    if (serializeMoney(vault.balance) <= 0) {
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

const depositMoney = async (vaultId, amount, userId) => {
    const validatedAmount = validatePositiveAmount(amount);

    const vault = await prisma.vault.findFirst({
        where: {
            id: vaultId,
            userId,
        },
    });

    if (!vault) {
        throw createBusinessError("Vault not found", 404);
    }

    const nextBalance = serializeMoney(vault.balance) + validatedAmount;

    if (nextBalance > MAX_MONEY_AMOUNT) {
        throw createBusinessError(
            "Vault balance cannot exceed the maximum allowed amount",
            400
        );
    }

    const updatedVault = await prisma.$transaction(async (tx) => {
        const updatedVault = await tx.vault.update({
            where: {
                id: vaultId,
            },
            data: {
                balance: {
                    increment: validatedAmount,
                },
            },
        });

        await tx.transaction.create({
            data: {
                vaultId,
                amount: validatedAmount,
                type: "deposit",
            },
        });

        return updatedVault;
    });

    const serializedVault = serializeVault(updatedVault);

    notificationService.notifyDeposit({
        userId,
        vaultName: serializedVault.name,
        amount: validatedAmount,
        vaultBalance: serializedVault.balance,
    });

    return serializedVault;
};

const withdrawMoney = async (vaultId, amount, userId) => {
    const validatedAmount = validatePositiveAmount(amount);

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

    const updatedVault = await prisma.$transaction(async (tx) => {
        const updateResult = await tx.vault.updateMany({
            where: {
                id: vaultId,
                userId,
                balance: {
                    gte: validatedAmount,
                },
            },
            data: {
                balance: {
                    decrement: validatedAmount,
                },
            },
        });

        if (updateResult.count === 0) {
            throw createBusinessError("Insufficient funds", 400);
        }

        await tx.transaction.create({
            data: {
                vaultId,
                amount: validatedAmount,
                type: "withdrawal",
            },
        });

        return tx.vault.findUnique({
            where: {
                id: vaultId,
            },
        });
    });

    const serializedVault = serializeVault(updatedVault);

    notificationService.notifyWithdrawal({
        userId,
        vaultName: serializedVault.name,
        amount: validatedAmount,
        vaultBalance: serializedVault.balance,
    });

    return serializedVault;
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

    if (serializeMoney(vault.balance) !== 0) {
        throw createBusinessError(
            "Vault must have a zero balance before it can be deleted",
            400
        );
    }

    await prisma.$transaction(async (tx) => {
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
