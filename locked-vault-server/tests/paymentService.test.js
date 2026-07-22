require("./setup");

const { describe, it, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");

const {
    resetDatabase,
    disconnect,
    ensureDatabaseConnection,
    prisma,
} = require("./setup");
const {
    request,
    app,
    createUserAndToken,
    authHeader,
    createVault,
    createFundedVault,
} = require("./helpers");
const {
    PAYMENT_STATUS,
    PAYMENT_PROVIDER,
    PAYMENT_DIRECTION,
    LEDGER_ACCOUNT_TYPE,
    LEDGER_ENTRY_TYPE,
} = require("../payments/constants");
const { PROVIDER_EVENT_TYPE } = require("../payments/events/normalizedProviderEvents");
const paymentOrchestrationService = require("../payments/services/paymentOrchestrationService");
const ledgerService = require("../payments/services/ledgerService");
const webhookService = require("../payments/services/webhookService");
const {
    registerPaymentProvider,
} = require("../payments/providers/registry");
const {
    toMoneyDecimal,
    moneyEquals,
    serializeMoney,
} = require("../utils/money");

describe("payment foundation", () => {
    before(async () => {
        await ensureDatabaseConnection();
    });

    beforeEach(async () => {
        await resetDatabase();
    });

    after(async () => {
        await disconnect();
    });

    it("creates a completed payment record for simulated deposits", async () => {
        const { token } = await createUserAndToken();
        const vaultResponse = await createVault(token, {
            name: "Payment Vault",
            amount: 0,
        });

        const depositResponse = await request(app)
            .post(`/api/vaults/${vaultResponse.body.id}/deposit`)
            .set(authHeader(token))
            .send({ amount: 75 });

        assert.equal(depositResponse.status, 200);
        assert.equal(depositResponse.body.vault.balance, 75);
        assert.equal(depositResponse.body.payment.status, PAYMENT_STATUS.COMPLETED);
        assert.equal(
            depositResponse.body.payment.direction,
            PAYMENT_DIRECTION.DEPOSIT
        );

        const payments = await prisma.payment.findMany({
            where: {
                vaultId: vaultResponse.body.id,
            },
        });

        assert.equal(payments.length, 1);
        assert.equal(payments[0].status, PAYMENT_STATUS.COMPLETED);
        assert.equal(payments[0].provider, PAYMENT_PROVIDER.SIMULATED);
        assert.equal(Number(payments[0].amount), 75);
        assert.ok(payments[0].transactionId);
        assert.ok(payments[0].completedAt);
    });

    it("stores transaction status on completed deposits and withdrawals", async () => {
        const { token } = await createUserAndToken();
        const vaultResponse = await createVault(token, {
            name: "Status Vault",
            amount: 100,
        });

        await request(app)
            .post(`/api/vaults/${vaultResponse.body.id}/withdraw`)
            .set(authHeader(token))
            .send({ amount: 25 });

        const transactions = await prisma.transaction.findMany({
            where: {
                vaultId: vaultResponse.body.id,
            },
        });

        assert.equal(transactions.length, 2);
        assert.ok(
            transactions.every((transaction) => transaction.status === "COMPLETED")
        );
    });

    it("deduplicates deposits that reuse the same idempotency key", async () => {
        const { token } = await createUserAndToken();
        const vaultResponse = await createVault(token, {
            name: "Idempotent Vault",
            amount: 0,
        });

        const depositRequest = (amount) =>
            request(app)
                .post(`/api/vaults/${vaultResponse.body.id}/deposit`)
                .set(authHeader(token))
                .set("Idempotency-Key", "deposit-attempt-1")
                .send({ amount });

        const firstDeposit = await depositRequest(40);
        const secondDeposit = await depositRequest(40);

        assert.equal(firstDeposit.status, 200);
        assert.equal(secondDeposit.status, 200);
        assert.equal(firstDeposit.body.vault.balance, 40);
        assert.equal(secondDeposit.body.vault.balance, 40);

        const payments = await prisma.payment.findMany({
            where: {
                vaultId: vaultResponse.body.id,
            },
        });

        const transactions = await prisma.transaction.findMany({
            where: {
                vaultId: vaultResponse.body.id,
                type: "deposit",
            },
        });

        assert.equal(payments.length, 1);
        assert.equal(transactions.length, 1);
    });
});

describe("payment provider architecture", () => {
    before(async () => {
        await ensureDatabaseConnection();
    });

    beforeEach(async () => {
        await resetDatabase();
    });

    after(async () => {
        await disconnect();
    });

    it("backfills opening ledger balances for pre-existing vault funds", async () => {
        const user = await prisma.user.create({
            data: {
                name: "Legacy User",
                email: `legacy-${Date.now()}@test.com`,
                password: "hash",
            },
        });

        const vault = await createFundedVault(user.id, 250);

        const availableLedger = await ledgerService.sumAccountBalance(
            prisma,
            vault.id,
            LEDGER_ACCOUNT_TYPE.AVAILABLE
        );

        assert.ok(moneyEquals(vault.balance, availableLedger));
        assert.equal(serializeMoney(availableLedger), 250);

        const openingEntry = await prisma.ledgerEntry.findUnique({
            where: { id: `opening_${vault.id}` },
        });

        assert.equal(openingEntry.entryType, LEDGER_ENTRY_TYPE.OPENING_BALANCE);
    });

    it("prevents duplicate deposit settlement", async () => {
        const { token, user } = await createUserAndToken();
        const vaultResponse = await createVault(token, {
            name: "Duplicate Deposit",
            amount: 0,
        });

        const payment = await prisma.payment.create({
            data: {
                amount: toMoneyDecimal(50),
                direction: PAYMENT_DIRECTION.DEPOSIT,
                currency: "CAD",
                status: PAYMENT_STATUS.PENDING,
                provider: PAYMENT_PROVIDER.SIMULATED,
                userId: user.id,
                vaultId: vaultResponse.body.id,
            },
            include: { vault: true, transaction: true },
        });

        await prisma.$transaction(async (tx) => {
            const first = await paymentOrchestrationService.applyProviderEvent(tx, {
                providerEventId: "evt-deposit-1",
                providerPaymentId: "provider-deposit-1",
                eventType: PROVIDER_EVENT_TYPE.DEPOSIT_SETTLED,
                paymentId: payment.id,
                amount: 50,
                currency: "CAD",
            });

            const second = await paymentOrchestrationService.applyProviderEvent(tx, {
                providerEventId: "evt-deposit-2",
                providerPaymentId: "provider-deposit-1",
                eventType: PROVIDER_EVENT_TYPE.DEPOSIT_SETTLED,
                paymentId: payment.id,
                amount: 50,
                currency: "CAD",
            });

            assert.equal(first.alreadyCompleted, false);
            assert.equal(second.alreadyCompleted, true);
        });

        const updatedVault = await prisma.vault.findUnique({
            where: { id: vaultResponse.body.id },
        });

        assert.equal(serializeMoney(updatedVault.balance), 50);
    });

    it("deduplicates withdrawal requests with the same idempotency key", async () => {
        const { token } = await createUserAndToken();
        const vaultResponse = await createVault(token, {
            name: "Withdraw Idempotent",
            amount: 100,
        });

        const withdrawRequest = () =>
            request(app)
                .post(`/api/vaults/${vaultResponse.body.id}/withdraw`)
                .set(authHeader(token))
                .set("Idempotency-Key", "withdraw-attempt-1")
                .send({ amount: 30 });

        const first = await withdrawRequest();
        const second = await withdrawRequest();

        assert.equal(first.body.vault.balance, 70);
        assert.equal(second.body.vault.balance, 70);

        const payments = await prisma.payment.count({
            where: {
                vaultId: vaultResponse.body.id,
                direction: PAYMENT_DIRECTION.WITHDRAWAL,
            },
        });

        assert.equal(payments, 1);
    });

    it("releases reserved funds when a withdrawal fails", async () => {
        const user = await prisma.user.create({
            data: {
                name: "Fail Withdraw User",
                email: `fail-withdraw-${Date.now()}@test.com`,
                password: "hash",
            },
        });

        const vault = await createFundedVault(user.id, 100);
        const payment = await prisma.payment.create({
            data: {
                amount: toMoneyDecimal(40),
                direction: PAYMENT_DIRECTION.WITHDRAWAL,
                currency: "CAD",
                status: PAYMENT_STATUS.PENDING,
                provider: PAYMENT_PROVIDER.SIMULATED,
                userId: user.id,
                vaultId: vault.id,
            },
            include: { vault: true },
        });

        await prisma.$transaction(async (tx) => {
            await ledgerService.reserveWithdrawalFunds(tx, {
                vaultId: vault.id,
                paymentId: payment.id,
                amount: 40,
            });

            await paymentOrchestrationService.applyProviderEvent(tx, {
                providerEventId: "evt-withdraw-fail-1",
                eventType: PROVIDER_EVENT_TYPE.WITHDRAWAL_FAILED,
                paymentId: payment.id,
                amount: 40,
                currency: "CAD",
                failureReason: "Bank rejected payout",
            });
        });

        const updatedVault = await prisma.vault.findUnique({
            where: { id: vault.id },
        });
        const reserved = await ledgerService.sumAccountBalance(
            prisma,
            vault.id,
            LEDGER_ACCOUNT_TYPE.WITHDRAWAL_PENDING
        );

        assert.equal(serializeMoney(updatedVault.balance), 100);
        assert.ok(moneyEquals(reserved, 0));
    });

    it("ignores duplicate webhook delivery", async () => {
        const { token, user } = await createUserAndToken();
        const vaultResponse = await createVault(token, {
            name: "Webhook Vault",
            amount: 0,
        });

        const payment = await prisma.payment.create({
            data: {
                amount: toMoneyDecimal(20),
                direction: PAYMENT_DIRECTION.DEPOSIT,
                currency: "CAD",
                status: PAYMENT_STATUS.PENDING,
                provider: "test-provider",
                userId: user.id,
                vaultId: vaultResponse.body.id,
            },
        });

        const testProvider = {
            name: "test-provider",
            supportsAsyncSettlement: true,
            initiateDeposit: async () => ({ status: PAYMENT_STATUS.PENDING }),
            initiateWithdrawal: async () => ({ status: PAYMENT_STATUS.PENDING }),
            parseWebhook: async () => [
                {
                    providerEventId: "duplicate-event-1",
                    providerPaymentId: "provider-1",
                    eventType: PROVIDER_EVENT_TYPE.DEPOSIT_SETTLED,
                    paymentId: payment.id,
                    amount: 20,
                    currency: "CAD",
                },
            ],
            verifyWebhook: async () => true,
            fetchPaymentStatus: async () => null,
        };

        registerPaymentProvider("test-provider", testProvider);

        await webhookService.handleWebhook({
            providerName: "test-provider",
            rawBody: { id: "duplicate-event-1" },
            headers: {},
        });

        await webhookService.handleWebhook({
            providerName: "test-provider",
            rawBody: { id: "duplicate-event-1" },
            headers: {},
        });

        const events = await prisma.webhookEvent.count({
            where: {
                providerEventId: "duplicate-event-1",
            },
        });
        const updatedVault = await prisma.vault.findUnique({
            where: { id: vaultResponse.body.id },
        });

        assert.equal(events, 1);
        assert.equal(serializeMoney(updatedVault.balance), 20);
    });

    it("rejects invalid payment status transitions", async () => {
        const { token, user } = await createUserAndToken();
        const vaultResponse = await createVault(token, {
            name: "Invalid Transition",
            amount: 0,
        });

        const payment = await prisma.payment.create({
            data: {
                amount: toMoneyDecimal(15),
                direction: PAYMENT_DIRECTION.DEPOSIT,
                currency: "CAD",
                status: PAYMENT_STATUS.FAILED,
                provider: PAYMENT_PROVIDER.SIMULATED,
                userId: user.id,
                vaultId: vaultResponse.body.id,
            },
            include: { vault: true },
        });

        await assert.rejects(
            () =>
                prisma.$transaction((tx) =>
                    paymentOrchestrationService.applyProviderEvent(tx, {
                        providerEventId: "evt-invalid-1",
                        eventType: PROVIDER_EVENT_TYPE.DEPOSIT_SETTLED,
                        paymentId: payment.id,
                        amount: 15,
                        currency: "CAD",
                    })
                ),
            /Payment can no longer be completed/
        );
    });

    it("rejects out-of-order provider events after completion", async () => {
        const { token, user } = await createUserAndToken();
        const vaultResponse = await createVault(token, {
            name: "Out Of Order",
            amount: 0,
        });

        const payment = await prisma.payment.create({
            data: {
                amount: toMoneyDecimal(35),
                direction: PAYMENT_DIRECTION.DEPOSIT,
                currency: "CAD",
                status: PAYMENT_STATUS.COMPLETED,
                provider: PAYMENT_PROVIDER.SIMULATED,
                userId: user.id,
                vaultId: vaultResponse.body.id,
                completedAt: new Date(),
            },
            include: { vault: true },
        });

        await assert.rejects(
            () =>
                prisma.$transaction((tx) =>
                    paymentOrchestrationService.applyProviderEvent(tx, {
                        providerEventId: "evt-late-processing",
                        eventType: PROVIDER_EVENT_TYPE.DEPOSIT_ACCEPTED,
                        paymentId: payment.id,
                        amount: 35,
                        currency: "CAD",
                    })
                ),
            /Invalid payment status transition/
        );
    });

    it("maintains the available ledger invariant using decimal precision", async () => {
        const { token } = await createUserAndToken();
        const vaultResponse = await createVault(token, {
            name: "Decimal Vault",
            amount: 0,
        });

        await request(app)
            .post(`/api/vaults/${vaultResponse.body.id}/deposit`)
            .set(authHeader(token))
            .send({ amount: "10.25" });

        await request(app)
            .post(`/api/vaults/${vaultResponse.body.id}/deposit`)
            .set(authHeader(token))
            .send({ amount: "0.75" });

        const vault = await prisma.vault.findUnique({
            where: { id: vaultResponse.body.id },
        });
        const availableLedger = await ledgerService.sumAccountBalance(
            prisma,
            vaultResponse.body.id,
            LEDGER_ACCOUNT_TYPE.AVAILABLE
        );

        assert.ok(moneyEquals(vault.balance, availableLedger));
        assert.equal(serializeMoney(vault.balance), 11);
    });
});
