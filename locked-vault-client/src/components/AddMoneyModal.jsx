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
import { depositMoney } from "@/services/vaultService";
import getErrorMessage from "@/utils/getErrorMessage";

function AddMoneyModal({ vault, refreshVaults }) {
    const [amount, setAmount] = useState("");
    const [open, setOpen] = useState(false);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleOpenChange = (nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) {
            setError("");
            setAmount("");
        }
    };

    const handleDeposit = async () => {
        try {
            setIsSubmitting(true);
            setError("");

            await depositMoney(vault.id, amount);

            setAmount("");
            await refreshVaults();
            setOpen(false);
        } catch (submitError) {
            setError(
                getErrorMessage(submitError, "Failed to deposit money.")
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                    Add Money
                </Button>
            </DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Deposit into {vault.name}
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
                        onClick={handleDeposit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Depositing..." : "Deposit"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default AddMoneyModal;
