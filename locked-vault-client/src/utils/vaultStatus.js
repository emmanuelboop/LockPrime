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

    return Math.max(0, Math.ceil((unlock - today) / DAY_IN_MS));
};

const getVaultLockStatus = (vault) => {
    const hasBalance = Number(vault.balance) > 0;

    if (!vault.unlockDate) {
        return {
            isLocked: false,
            neverLocked: true,
            canLock: hasBalance,
            daysRemaining: null,
            unlockDateLabel: null,
            statusLabel: "Open",
            statusDescription: hasBalance
                ? "Withdraw anytime · Lock funds to commit"
                : "Add funds, then lock when you're ready",
            withdrawHelperText: null,
            lockButtonLabel: "Lock Funds",
        };
    }

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
            neverLocked: false,
            canLock: false,
            daysRemaining,
            unlockDateLabel,
            statusLabel: "Locked",
            statusDescription,
            withdrawHelperText: `Withdrawals available after ${unlockDateLabel}`,
            lockButtonLabel: null,
        };
    }

    return {
        isLocked: false,
        neverLocked: false,
        canLock: hasBalance,
        daysRemaining: 0,
        unlockDateLabel,
        statusLabel: "Unlocked",
        statusDescription: `Unlocked on ${unlockDateLabel} · Ready to withdraw`,
        withdrawHelperText: null,
        lockButtonLabel: "Lock Again",
    };
};

export default getVaultLockStatus;
