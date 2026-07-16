import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { useCallback, useEffect, useState } from "react";

import VaultCard from "./VaultCard";
import AddMoneyModal from "./AddMoneyModal";
import WithdrawMoneyModal from "./WithdrawMoneyModal";
import VaultLockStatus from "./VaultLockStatus";
import InlineFormError from "./InlineFormError";
import { Button } from "./ui/button";

import { getTransactions } from "../services/transactionService";
import { deleteVault } from "@/services/vaultService";
import getErrorMessage from "@/utils/getErrorMessage";
import formatMoney from "@/utils/formatMoney";

function TransactionSkeleton() {
    return (
        <div className="border rounded-lg p-4 animate-pulse">
            <div className="flex justify-between items-start">
                <div className="space-y-2">
                    <div className="h-4 w-20 rounded bg-muted" />
                    <div className="h-3 w-32 rounded bg-muted" />
                </div>
                <div className="h-5 w-16 rounded bg-muted" />
            </div>
        </div>
    );
}

function VaultDetailsModal({ vault, refreshVaults }) {
    const [open, setOpen] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
    const [transactionError, setTransactionError] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    const canDelete = Number(vault.balance) === 0;

    const loadTransactions = useCallback(async () => {
        setIsLoadingTransactions(true);
        setTransactionError("");

        try {
            const data = await getTransactions(vault.id);
            setTransactions(data);
        } catch (error) {
            setTransactions([]);
            setTransactionError(
                getErrorMessage(error, "Failed to load transactions.")
            );
        } finally {
            setIsLoadingTransactions(false);
        }
    }, [vault.id]);

    const handleVaultRefresh = async () => {
        await refreshVaults();

        if (open) {
            await loadTransactions();
        }
    };

    const handleOpenChange = (nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) {
            setShowDeleteConfirm(false);
            setDeleteError("");
        }
    };

    const handleDeleteVault = async () => {
        try {
            setIsDeleting(true);
            setDeleteError("");

            await deleteVault(vault.id);
            setOpen(false);
            setShowDeleteConfirm(false);
            await refreshVaults();
        } catch (error) {
            setDeleteError(
                getErrorMessage(error, "Failed to delete vault.")
            );
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        if (open) {
            loadTransactions();
        }
    }, [open, loadTransactions]);

    return (
        <Dialog
            open={open}
            onOpenChange={handleOpenChange}
        >
            <DialogTrigger asChild>
                <div>
                    <VaultCard vault={vault} />
                </div>
            </DialogTrigger>

            <DialogContent className="max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>
                        {vault.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col flex-1 min-h-0">

                    <div className="flex-1 overflow-y-auto pr-2">

                        <div className="space-y-6">

                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Current Balance
                                </p>

                                <h2 className="text-4xl font-bold">
                                    ${formatMoney(vault.balance)}
                                </h2>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground mb-2">
                                    Lock Status
                                </p>

                                <VaultLockStatus vault={vault} variant="detail" />
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-3">
                                    Transaction History
                                </h3>

                                {isLoadingTransactions && (
                                    <div className="space-y-3">
                                        <p className="text-sm text-muted-foreground">
                                            Loading transactions...
                                        </p>
                                        <TransactionSkeleton />
                                        <TransactionSkeleton />
                                        <TransactionSkeleton />
                                    </div>
                                )}

                                {!isLoadingTransactions && transactionError && (
                                    <div className="space-y-3">
                                        <InlineFormError message={transactionError} />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={loadTransactions}
                                        >
                                            Retry
                                        </Button>
                                    </div>
                                )}

                                {!isLoadingTransactions &&
                                    !transactionError &&
                                    transactions.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <p className="font-medium">
                                                No transactions yet
                                            </p>

                                            <p className="text-sm">
                                                Deposits and withdrawals will appear here.
                                            </p>
                                        </div>
                                    )}

                                {!isLoadingTransactions &&
                                    !transactionError &&
                                    transactions.length > 0 && (
                                        <div className="space-y-3">
                                            {transactions.map((transaction) => (
                                                <div
                                                    key={transaction.id}
                                                    className="border rounded-lg p-4"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-semibold capitalize">
                                                                {transaction.type}
                                                            </p>

                                                            <p className="text-sm text-muted-foreground">
                                                                {new Date(
                                                                    transaction.createdAt
                                                                ).toLocaleString()}
                                                            </p>
                                                        </div>

                                                        <p
                                                            className={`text-lg font-bold ${transaction.type === "deposit"
                                                                ? "text-green-600"
                                                                : "text-red-600"
                                                                }`}
                                                        >
                                                            {transaction.type === "deposit"
                                                                ? "+"
                                                                : "-"}
                                                            ${formatMoney(transaction.amount)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                            </div>

                        </div>
                    </div>

                    <div className="flex gap-2 pt-4 mt-4 border-t">
                        <AddMoneyModal
                            vault={vault}
                            refreshVaults={handleVaultRefresh}
                        />

                        <WithdrawMoneyModal
                            vault={vault}
                            refreshVaults={handleVaultRefresh}
                        />
                    </div>

                    <div className="pt-4 mt-4 border-t">
                        {showDeleteConfirm ? (
                            <div className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    Delete "{vault.name}" permanently? This cannot
                                    be undone.
                                </p>

                                <InlineFormError message={deleteError} />

                                <div className="flex gap-2">
                                    <Button
                                        variant="destructive"
                                        disabled={isDeleting}
                                        onClick={handleDeleteVault}
                                    >
                                        {isDeleting
                                            ? "Deleting..."
                                            : "Confirm Delete"}
                                    </Button>

                                    <Button
                                        variant="outline"
                                        disabled={isDeleting}
                                        onClick={() => {
                                            setShowDeleteConfirm(false);
                                            setDeleteError("");
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Button
                                    variant="destructive"
                                    className="w-full"
                                    disabled={!canDelete}
                                    onClick={() => setShowDeleteConfirm(true)}
                                >
                                    Delete Vault
                                </Button>

                                {!canDelete && (
                                    <p className="text-xs text-muted-foreground text-center">
                                        Withdraw all funds before deleting this
                                        vault.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
}

export default VaultDetailsModal;
