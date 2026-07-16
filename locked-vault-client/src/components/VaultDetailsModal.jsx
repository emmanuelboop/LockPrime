import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { useEffect, useState } from "react";

import VaultCard from "./VaultCard";
import AddMoneyModal from "./AddMoneyModal";
import WithdrawMoneyModal from "./WithdrawMoneyModal";
import VaultLockStatus from "./VaultLockStatus";

import { getTransactions } from "../services/transactionService";

function VaultDetailsModal({ vault, refreshVaults }) {
    const [open, setOpen] = useState(false);
    const [transactions, setTransactions] = useState([]);

    const loadTransactions = async () => {
        try {
            const data = await getTransactions(vault.id);
            setTransactions(data);
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (open) {
            loadTransactions();
        }
    }, [open]);

    return (
        <Dialog
            open={open}
            onOpenChange={setOpen}
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

                    {/* Scrollable Section */}
                    <div className="flex-1 overflow-y-auto pr-2">

                        <div className="space-y-6">

                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Current Balance
                                </p>

                                <h2 className="text-4xl font-bold">
                                    ${Number(vault.balance).toLocaleString()}
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

                                {transactions.length === 0 ? (

                                    <div className="text-center py-8 text-muted-foreground">
                                        <p className="font-medium">
                                            No transactions yet
                                        </p>

                                        <p className="text-sm">
                                            Deposits and withdrawals will appear here.
                                        </p>
                                    </div>

                                ) : (

                                    transactions.map((transaction) => (

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
                                                    $
                                                    {Number(
                                                        transaction.amount
                                                    ).toLocaleString()}
                                                </p>
                                                
                                            </div>

                                        </div>

                                    ))

                                )}

                            </div>

                        </div>
                    </div>

                    {/* Fixed Bottom Buttons */}
                    <div className="flex gap-2 pt-4 mt-4 border-t">
                        <AddMoneyModal
                            vault={vault}
                            refreshVaults={refreshVaults}
                        />

                        <WithdrawMoneyModal
                            vault={vault}
                            refreshVaults={refreshVaults}
                        />
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
}

export default VaultDetailsModal;