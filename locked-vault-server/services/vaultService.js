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

const createBusinessError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const createVault = async (vaultData, userId) => {
    const {
        name,
        amount,
        lockDays,
    } = vaultData;

    const validatedName = validateVaultName(name);
    const validatedAmount = validateNonNegativeAmount(amount ?? 0);
    const validatedLockDays = validateLockDays(lockDays);

    const unlockDate = new Date();

    unlockDate.setDate(
        unlockDate.getDate() + validatedLockDays
    );

    const vault = await prisma.$transaction(async (tx) => {
        const createdVault = await tx.vault.create({
            data: {
                name: validatedName,
                balance: validatedAmount,
                unlockDate,
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

    return serializeVault(vault);
};

const getVaults = async (userId) => {

    const vaults = await prisma.vault.findMany({
        where: {
            userId,
        },
    });

    const updatedVaults = vaults.map((vault) => {

        const today = new Date();

        const unlockDate = new Date(vault.unlockDate);

        const daysRemaining = Math.ceil(
            (unlockDate - today) / (1000 * 60 * 60 * 24)
        );

        return serializeVault({
            ...vault,
            daysRemaining,
        });

    });

    return updatedVaults;

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

    const updatedVault = await prisma.$transaction(
        async (tx) => {
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

        }
    );

    return serializeVault(updatedVault);

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

    const today = new Date();

    if (today < vault.unlockDate) {
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

    return serializeVault(updatedVault);

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
    getVaults,
    depositMoney,
    withdrawMoney,
    getTransactions,
    deleteVault,
    renameVault,
};
