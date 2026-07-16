import { Card, CardContent } from "@/components/ui/card";
import VaultLockStatus from "@/components/VaultLockStatus";
import formatMoney from "@/utils/formatMoney";

function VaultCard({ vault }) {
    return (
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                    <h2 className="text-xl font-semibold">
                        {vault.name}
                    </h2>

                    <VaultLockStatus vault={vault} variant="badge" />
                </div>

                <p className="text-3xl font-bold mt-4">
                    ${formatMoney(vault.balance)}
                </p>

                <div className="mt-2">
                    <VaultLockStatus vault={vault} variant="compact" />
                </div>
            </CardContent>
        </Card>
    );
}

export default VaultCard;
