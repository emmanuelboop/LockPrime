const prisma = require("../config/prisma");
const { formatMoney } = require("../utils/money");
const {
    sendDepositConfirmationEmail,
    sendWithdrawalConfirmationEmail,
    sendVaultUnlockedEmail,
    sendVaultLockedEmail,
} = require("./emailService");

const isNotificationsEnabled = () =>
    process.env.NOTIFICATIONS_ENABLED !== "false";

const formatUnlockDate = (unlockDate) =>
    new Date(unlockDate).toLocaleDateString("en-CA", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

const getUserContact = async (userId) =>
    prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            email: true,
            name: true,
        },
    });

const runNotification = async (task) => {
    if (!isNotificationsEnabled()) {
        return;
    }

    try {
        await task();
    } catch (error) {
        console.error("[LockPrime] Notification failed:", error);
    }
};

const notifyDeposit = async ({
    userId,
    vaultName,
    amount,
    vaultBalance,
}) => {
    await runNotification(async () => {
        const user = await getUserContact(userId);

        if (!user) {
            return;
        }

        await sendDepositConfirmationEmail({
            to: user.email,
            userName: user.name,
            vaultName,
            amount: formatMoney(amount),
            vaultBalance: formatMoney(vaultBalance),
        });
    });
};

const notifyWithdrawal = async ({
    userId,
    vaultName,
    amount,
    vaultBalance,
}) => {
    await runNotification(async () => {
        const user = await getUserContact(userId);

        if (!user) {
            return;
        }

        await sendWithdrawalConfirmationEmail({
            to: user.email,
            userName: user.name,
            vaultName,
            amount: formatMoney(amount),
            vaultBalance: formatMoney(vaultBalance),
        });
    });
};

const notifyVaultUnlocked = async ({ userId, vaultName, unlockDate }) => {
    await runNotification(async () => {
        const user = await getUserContact(userId);

        if (!user) {
            return;
        }

        await sendVaultUnlockedEmail({
            to: user.email,
            userName: user.name,
            vaultName,
            unlockDate: formatUnlockDate(unlockDate),
        });
    });
};

const notifyVaultLocked = async ({
    userId,
    vaultName,
    lockDays,
    unlockDate,
}) => {
    await runNotification(async () => {
        const user = await getUserContact(userId);

        if (!user) {
            return;
        }

        await sendVaultLockedEmail({
            to: user.email,
            userName: user.name,
            vaultName,
            lockDays,
            unlockDate: formatUnlockDate(unlockDate),
        });
    });
};

const processVaultUnlockNotifications = async (userId) => {
    if (!isNotificationsEnabled()) {
        return;
    }

    const now = new Date();

    const unlockedVaults = await prisma.vault.findMany({
        where: {
            userId,
            unlockNotifiedAt: null,
            unlockDate: {
                not: null,
                lte: now,
            },
        },
    });

    for (const vault of unlockedVaults) {
        const claimed = await prisma.vault.updateMany({
            where: {
                id: vault.id,
                unlockNotifiedAt: null,
            },
            data: {
                unlockNotifiedAt: now,
            },
        });

        if (claimed.count === 0) {
            continue;
        }

        await notifyVaultUnlocked({
            userId,
            vaultName: vault.name,
            unlockDate: vault.unlockDate,
        });
    }
};

module.exports = {
    notifyDeposit,
    notifyWithdrawal,
    notifyVaultUnlocked,
    notifyVaultLocked,
    processVaultUnlockNotifications,
    formatUnlockDate,
};
