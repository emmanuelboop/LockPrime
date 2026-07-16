-- AlterTable
ALTER TABLE "Vault" ALTER COLUMN "balance" SET DATA TYPE DECIMAL(12,2) USING ROUND("balance"::numeric, 2);

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2) USING ROUND("amount"::numeric, 2);
