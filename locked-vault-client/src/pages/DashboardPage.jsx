import { useEffect, useState } from "react";

import DashboardLayout from "@/layouts/DashboardLayout";
import VaultDetailsModal from "../components/VaultDetailsModal";
import CreateVaultModal from "@/components/CreateVaultModal";
import InlineFormError from "@/components/InlineFormError";
import { Button } from "@/components/ui/button";

import { getVaults } from "@/services/vaultService";
import getErrorMessage from "@/utils/getErrorMessage";

function VaultCardSkeleton() {
    return (
        <div className="rounded-xl border bg-card p-6 animate-pulse">
            <div className="h-5 w-32 rounded bg-muted" />
            <div className="mt-4 h-9 w-24 rounded bg-muted" />
            <div className="mt-2 h-4 w-28 rounded bg-muted" />
        </div>
    );
}

function DashboardPage() {
    const [vaults, setVaults] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const loadVaults = async () => {
        setIsLoading(true);
        setError("");

        try {
            const data = await getVaults();
            setVaults(data);
        } catch (loadError) {
            setVaults([]);
            setError(getErrorMessage(loadError, "Failed to load vaults."));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadVaults();
    }, []);

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">
                    My Vaults
                </h1>

                <CreateVaultModal refreshVaults={loadVaults} />
            </div>

            {error && !isLoading && (
                <div className="mb-6 space-y-3">
                    <InlineFormError message={error} />

                    <Button variant="outline" onClick={loadVaults}>
                        Retry
                    </Button>
                </div>
            )}

            {isLoading && (
                <div className="space-y-4">
                    <p className="text-muted-foreground">
                        Loading vaults...
                    </p>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <VaultCardSkeleton />
                        <VaultCardSkeleton />
                        <VaultCardSkeleton />
                    </div>
                </div>
            )}

            {!isLoading && !error && vaults.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
                    <h2 className="text-xl font-semibold">
                        No vaults yet
                    </h2>

                    <p className="mt-2 text-muted-foreground">
                        Create your first vault to start saving.
                    </p>

                    <div className="mt-6">
                        <CreateVaultModal refreshVaults={loadVaults} />
                    </div>
                </div>
            )}

            {!isLoading && !error && vaults.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {vaults.map((vault) => (
                        <VaultDetailsModal
                            key={vault.id}
                            vault={vault}
                            refreshVaults={loadVaults}
                        />
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}

export default DashboardPage;
