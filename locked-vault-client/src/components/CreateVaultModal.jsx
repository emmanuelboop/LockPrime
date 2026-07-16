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
import { createVault } from "@/services/vaultService";
import getErrorMessage from "@/utils/getErrorMessage";

function CreateVaultModal({ refreshVaults }) {
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [lockDays, setLockDays] = useState("");
    const [open, setOpen] = useState(false);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleOpenChange = (nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) {
            setError("");
            setName("");
            setAmount("");
            setLockDays("");
        }
    };

    const clearError = () => {
        if (error) {
            setError("");
        }
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            setError("");

            await createVault({
                name,
                amount,
                lockDays,
            });

            setName("");
            setAmount("");
            setLockDays("");
            await refreshVaults();
            setOpen(false);
        } catch (submitError) {
            setError(
                getErrorMessage(submitError, "Failed to create vault.")
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button>Create Vault</Button>
            </DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Create Vault
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <Input
                        placeholder="Vault Name"
                        value={name}
                        disabled={isSubmitting}
                        onChange={(event) => {
                            setName(event.target.value);
                            clearError();
                        }}
                    />

                    <Input
                        type="number"
                        placeholder="Initial Amount"
                        value={amount}
                        disabled={isSubmitting}
                        onChange={(event) => {
                            setAmount(event.target.value);
                            clearError();
                        }}
                    />

                    <Input
                        type="number"
                        placeholder="Lock Days"
                        value={lockDays}
                        disabled={isSubmitting}
                        onChange={(event) => {
                            setLockDays(event.target.value);
                            clearError();
                        }}
                    />

                    <InlineFormError message={error} />

                    <Button
                        className="w-full"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Creating..." : "Create"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default CreateVaultModal;
