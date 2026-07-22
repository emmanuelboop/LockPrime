-- AlterTable: Payment additions
ALTER TABLE "Payment" ADD COLUMN "direction" TEXT;
ALTER TABLE "Payment" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'CAD';
ALTER TABLE "Payment" ADD COLUMN "metadata" JSONB;

-- Existing payments are all simulated deposits
UPDATE "Payment" SET "direction" = 'DEPOSIT' WHERE "direction" IS NULL;
ALTER TABLE "Payment" ALTER COLUMN "direction" SET NOT NULL;

-- AlterTable: Transaction payment link
ALTER TABLE "Transaction" ADD COLUMN "paymentId" TEXT;

-- Backfill Transaction.paymentId from Payment.transactionId
UPDATE "Transaction" AS t
SET "paymentId" = p."id"
FROM "Payment" AS p
WHERE p."transactionId" = t."id" AND t."paymentId" IS NULL;

CREATE INDEX "Transaction_vaultId_status_idx" ON "Transaction"("vaultId", "status");
CREATE INDEX "Transaction_paymentId_idx" ON "Transaction"("paymentId");
CREATE INDEX "Payment_direction_status_idx" ON "Payment"("direction", "status");

ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: LedgerEntry
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "vaultId" TEXT NOT NULL,
    "paymentId" TEXT,
    "accountType" TEXT NOT NULL,
    "entryType" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "availableBalanceAfter" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LedgerEntry_vaultId_accountType_idx" ON "LedgerEntry"("vaultId", "accountType");
CREATE INDEX "LedgerEntry_paymentId_idx" ON "LedgerEntry"("paymentId");

ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_vaultId_fkey"
  FOREIGN KEY ("vaultId") REFERENCES "Vault"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill opening ledger balances for existing vaults so AVAILABLE sum matches Vault.balance
INSERT INTO "LedgerEntry" ("id", "vaultId", "paymentId", "accountType", "entryType", "amount", "availableBalanceAfter", "createdAt")
SELECT
    'opening_' || v."id",
    v."id",
    NULL,
    'AVAILABLE',
    'OPENING_BALANCE',
    v."balance",
    v."balance",
    NOW()
FROM "Vault" AS v
WHERE v."balance" > 0;

-- CreateTable: WebhookEvent
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "paymentId" TEXT,
    "processedAt" TIMESTAMP(3),
    "processingError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WebhookEvent_provider_providerEventId_key" ON "WebhookEvent"("provider", "providerEventId");
CREATE INDEX "WebhookEvent_paymentId_idx" ON "WebhookEvent"("paymentId");

ALTER TABLE "WebhookEvent" ADD CONSTRAINT "WebhookEvent_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
