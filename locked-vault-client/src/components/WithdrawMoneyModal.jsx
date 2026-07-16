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
import { withdrawMoney } from "@/services/vaultService";
import getErrorMessage from "@/utils/getErrorMessage";
import getVaultLockStatus from "@/utils/vaultStatus";

function WithdrawMoneyModal({ vault, refreshVaults }) {
    const [amount, setAmount] = useState("");
    const [open, setOpen] = useState(false);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const lockStatus = getVaultLockStatus(vault);

    const handleOpenChange = (nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) {
            setError("");
            setAmount("");
        }
    };

    const handleWithdraw = async () => {
        if (lockStatus.isLocked) {
            return;
        }

        try {
            setIsSubmitting(true);
            setError("");

            await withdrawMoney(vault.id, amount);

            setAmount("");
            await refreshVaults();
            setOpen(false);
        } catch (submitError) {
            setError(
                getErrorMessage(submitError, "Failed to withdraw money.")
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="w-full"
                    disabled={lockStatus.isLocked}
                >
                    Withdraw
                </Button>
            </DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Withdraw Money
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <Input
                        type="number"
                        placeholder="Amount"
                        value={amount}
                        disabled={isSubmitting}
                        onChange={(event) => {
                            setAmount(event.target.value);
                            setError("");
                        }}
                    />

                    <InlineFormError message={error} />

                    <Button
                        className="w-full"
                        onClick={handleWithdraw}
                        disabled={isSubmitting || lockStatus.isLocked}
                    >
                        {isSubmitting ? "Withdrawing..." : "Withdraw"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default WithdrawMoneyModal;
