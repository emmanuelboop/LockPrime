const DAY_IN_MS = 1000 * 60 * 60 * 24;

const formatUnlockDate = (unlockDate) =>
    new Date(unlockDate).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
    });

const getDaysRemaining = (unlockDate) => {
    const today = new Date();
    const unlock = new Date(unlockDate);

    return Math.max(
        0,
        Math.ceil((unlock - today) / DAY_IN_MS)
    );
};

const getVaultLockStatus = (vault) => {
    const unlockDate = new Date(vault.unlockDate);
    const isLocked = new Date() < unlockDate;
    const daysRemaining = getDaysRemaining(vault.unlockDate);
    const unlockDateLabel = formatUnlockDate(vault.unlockDate);

    if (isLocked) {
        const statusDescription =
            daysRemaining === 0
                ? `Unlocks today · ${unlockDateLabel}`
                : `Unlocks on ${unlockDateLabel} · ${daysRemaining} day${
                    daysRemaining === 1 ? "" : "s"
                } remaining`;

        return {
            isLocked: true,
            daysRemaining,
            unlockDateLabel,
            statusLabel: "Locked",
            statusDescription,
            withdrawHelperText: `Withdrawals available after ${unlockDateLabel}`,
        };
    }

    return {
        isLocked: false,
        daysRemaining: 0,
        unlockDateLabel,
        statusLabel: "Unlocked",
        statusDescription: `Unlocked on ${unlockDateLabel} · Ready to withdraw`,
        withdrawHelperText: null,
    };
};

export default getVaultLockStatus;
