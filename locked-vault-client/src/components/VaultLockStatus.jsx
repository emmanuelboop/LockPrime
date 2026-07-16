import getVaultLockStatus from "@/utils/vaultStatus";

function VaultLockStatus({ vault, variant = "detail" }) {
    const lockStatus = getVaultLockStatus(vault);

    const badgeClassName = lockStatus.isLocked
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-green-200 bg-green-50 text-green-900";

    if (variant === "badge") {
        return (
            <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClassName}`}
            >
                {lockStatus.statusLabel}
            </span>
        );
    }

    if (variant === "compact") {
        return (
            <p className="text-sm text-muted-foreground">
                {lockStatus.statusDescription}
            </p>
        );
    }

    return (
        <div className="space-y-2">
            <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClassName}`}
            >
                {lockStatus.statusLabel}
            </span>

            <p className="text-sm text-muted-foreground">
                {lockStatus.statusDescription}
            </p>

            {lockStatus.isLocked && (
                <p className="text-sm text-muted-foreground">
                    You can deposit while locked, but withdrawals are blocked
                    until the unlock date.
                </p>
            )}
        </div>
    );
}

export default VaultLockStatus;
