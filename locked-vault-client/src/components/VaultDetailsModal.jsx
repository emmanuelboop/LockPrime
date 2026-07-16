import {

    Dialog,

    DialogContent,

    DialogHeader,

    DialogTitle,

    DialogTrigger,

} from "@/components/ui/dialog";



import { useCallback, useEffect, useState } from "react";
import { Pencil } from "lucide-react";



import VaultCard from "./VaultCard";

import AddMoneyModal from "./AddMoneyModal";

import WithdrawMoneyModal from "./WithdrawMoneyModal";

import VaultLockStatus from "./VaultLockStatus";

import InlineFormError from "./InlineFormError";

import { Button } from "./ui/button";

import { Input } from "./ui/input";



import { getTransactions } from "../services/transactionService";

import { deleteVault, renameVault } from "@/services/vaultService";

import getErrorMessage from "@/utils/getErrorMessage";

import formatMoney from "@/utils/formatMoney";



function TransactionSkeleton() {

    return (

        <div className="rounded-lg border p-3 animate-pulse">

            <div className="flex justify-between items-center">

                <div className="space-y-2">

                    <div className="h-3 w-16 rounded bg-muted" />

                    <div className="h-3 w-28 rounded bg-muted" />

                </div>

                <div className="h-4 w-14 rounded bg-muted" />

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

    const [isEditingName, setIsEditingName] = useState(false);

    const [vaultName, setVaultName] = useState(vault.name);

    const [renameError, setRenameError] = useState("");

    const [isSavingName, setIsSavingName] = useState(false);



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

            setIsEditingName(false);

            setRenameError("");

            setVaultName(vault.name);

        }

    };



    const handleStartEditingName = () => {

        setVaultName(vault.name);

        setRenameError("");

        setIsEditingName(true);

    };



    const handleCancelNameEdit = () => {

        setVaultName(vault.name);

        setRenameError("");

        setIsEditingName(false);

    };



    const handleSaveVaultName = async () => {

        try {

            setIsSavingName(true);

            setRenameError("");



            await renameVault(vault.id, vaultName);

            setIsEditingName(false);

            await refreshVaults();

        } catch (error) {

            setRenameError(

                getErrorMessage(error, "Failed to rename vault.")

            );

        } finally {

            setIsSavingName(false);

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



    useEffect(() => {

        setVaultName(vault.name);

    }, [vault.name]);



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



            <DialogContent className="flex max-h-[85vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">

                <DialogHeader className="shrink-0 space-y-2 border-b px-6 py-4 pr-12">

                    {isEditingName ? (

                        <>

                            <DialogTitle className="text-lg">

                                Rename vault

                            </DialogTitle>



                            <Input

                                value={vaultName}

                                disabled={isSavingName}

                                onChange={(event) => {

                                    setVaultName(event.target.value);

                                    setRenameError("");

                                }}

                            />



                            <InlineFormError message={renameError} />



                            <div className="flex gap-2">

                                <Button

                                    size="sm"

                                    disabled={isSavingName}

                                    onClick={handleSaveVaultName}

                                >

                                    {isSavingName ? "Saving..." : "Save"}

                                </Button>



                                <Button

                                    size="sm"

                                    variant="outline"

                                    disabled={isSavingName}

                                    onClick={handleCancelNameEdit}

                                >

                                    Cancel

                                </Button>

                            </div>

                        </>

                    ) : (
                        <div className="flex items-center gap-1">
                            <DialogTitle className="text-xl font-semibold leading-tight">
                                {vault.name}
                            </DialogTitle>

                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="shrink-0 text-muted-foreground"
                                onClick={handleStartEditingName}
                                aria-label="Rename vault"
                            >
                                <Pencil className="size-4" />
                            </Button>
                        </div>
                    )}

                </DialogHeader>



                <div className="flex-1 overflow-y-auto px-6 py-4">

                    <div className="rounded-lg border bg-muted/30 p-4">

                        <div className="flex items-start justify-between gap-4">

                            <div>

                                <p className="text-sm text-muted-foreground">

                                    Balance

                                </p>



                                <p className="text-3xl font-bold tracking-tight">

                                    ${formatMoney(vault.balance)}

                                </p>

                            </div>



                            <VaultLockStatus vault={vault} variant="badge" />

                        </div>



                        <div className="mt-3">

                            <VaultLockStatus vault={vault} variant="compact" />

                        </div>

                    </div>



                    <div className="mt-6">

                        <h3 className="text-sm font-medium text-muted-foreground mb-3">

                            Transaction history

                        </h3>



                        {isLoadingTransactions && (

                            <div className="space-y-2">

                                <TransactionSkeleton />

                                <TransactionSkeleton />

                            </div>

                        )}



                        {!isLoadingTransactions && transactionError && (

                            <div className="space-y-2">

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

                                <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">

                                    No transactions yet.

                                </p>

                            )}



                        {!isLoadingTransactions &&

                            !transactionError &&

                            transactions.length > 0 && (

                                <div className="space-y-2">

                                    {transactions.map((transaction) => (

                                        <div

                                            key={transaction.id}

                                            className="flex items-center justify-between rounded-lg border px-3 py-2.5"

                                        >

                                            <div>

                                                <p className="font-medium capitalize">

                                                    {transaction.type}

                                                </p>



                                                <p className="text-xs text-muted-foreground">

                                                    {new Date(

                                                        transaction.createdAt

                                                    ).toLocaleString()}

                                                </p>

                                            </div>



                                            <p

                                                className={`font-semibold ${transaction.type === "deposit"

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

                                    ))}

                                </div>

                            )}

                    </div>

                </div>



                <div className="shrink-0 space-y-3 border-t bg-muted/20 px-6 py-4">

                    <div className="grid grid-cols-2 gap-2">

                        <AddMoneyModal

                            vault={vault}

                            refreshVaults={handleVaultRefresh}

                        />



                        <WithdrawMoneyModal

                            vault={vault}

                            refreshVaults={handleVaultRefresh}

                            showLockHelper={false}

                        />

                    </div>



                    {showDeleteConfirm ? (

                        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 space-y-2">

                            <p className="text-sm">

                                Delete "{vault.name}" permanently?

                            </p>



                            <InlineFormError message={deleteError} />



                            <div className="flex gap-2">

                                <Button

                                    size="sm"

                                    variant="destructive"

                                    disabled={isDeleting}

                                    onClick={handleDeleteVault}

                                >

                                    {isDeleting ? "Deleting..." : "Confirm"}

                                </Button>



                                <Button

                                    size="sm"

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

                        <Button

                            variant="ghost"

                            size="sm"

                            className="w-full text-destructive hover:text-destructive"

                            disabled={!canDelete}

                            onClick={() => setShowDeleteConfirm(true)}

                        >

                            Delete vault

                        </Button>

                    )}



                    {!canDelete && !showDeleteConfirm && (

                        <p className="text-center text-xs text-muted-foreground">

                            Withdraw all funds to enable deletion.

                        </p>

                    )}

                </div>

            </DialogContent>

        </Dialog>

    );

}



export default VaultDetailsModal;


