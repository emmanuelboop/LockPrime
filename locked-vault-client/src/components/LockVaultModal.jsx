import { useState } from "react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import InlineFormError from "@/components/InlineFormError";
import { lockVault } from "@/services/vaultService";
import getErrorMessage from "@/utils/getErrorMessage";
import getVaultLockStatus from "@/utils/vaultStatus";

function LockVaultModal({ vault, refreshVaults }) {
    const [lockDays, setLockDays] = useState("");
    const [open, setOpen] = useState(false);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const lockStatus = getVaultLockStatus(vault);

    if (!lockStatus.canLock) {
        return null;
    }

    const handleOpenChange = (nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) {
            setError("");
            setLockDays("");
        }
    };

    const handleLock = async () => {
        try {
            setIsSubmitting(true);
            setError("");

            await lockVault(vault.id, lockDays);

            setLockDays("");
            await refreshVaults();
            setOpen(false);
        } catch (submitError) {
            setError(getErrorMessage(submitError, "Failed to lock vault."));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button className="w-full">
                    {lockStatus.lockButtonLabel}
                </Button>
            </DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {lockStatus.lockButtonLabel} — {vault.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        You won&apos;t be able to withdraw until the lock period
                        ends. You can still add money while locked.
                    </p>

                    <Input
                        type="number"
                        placeholder="Lock days"
                        value={lockDays}
                        disabled={isSubmitting}
                        onChange={(event) => {
                            setLockDays(event.target.value);
                            setError("");
                        }}
                    />

                    <InlineFormError message={error} />

                    <Button
                        className="w-full"
                        onClick={handleLock}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Locking..." : lockStatus.lockButtonLabel}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default LockVaultModal;
