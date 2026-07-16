require("./setup");

const { describe, it, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");

const { prisma, resetDatabase, disconnect, ensureDatabaseConnection } = require("./setup");
const vaultService = require("../services/vaultService");
const { serializeMoney } = require("../utils/money");

describe("withdrawMoney concurrency", () => {
    before(async () => {
        await ensureDatabaseConnection();
    });

    beforeEach(async () => {
        await resetDatabase();
    });

    after(async () => {
        await disconnect();
    });

    it("allows only one concurrent withdrawal to succeed", async () => {
        const user = await prisma.user.create({
            data: {
                name: "Concurrency User",
                email: `concurrency-${Date.now()}@test.com`,
                password: "hash",
            },
        });

        const vault = await prisma.vault.create({
            data: {
                name: "Concurrency Vault",
                balance: 100,
                unlockDate: new Date(Date.now() - 86400000),
                userId: user.id,
            },
        });

        const amount = 80;
        const attempts = await Promise.allSettled([
            vaultService.withdrawMoney(vault.id, amount, user.id),
            vaultService.withdrawMoney(vault.id, amount, user.id),
        ]);

        const fulfilled = attempts.filter(
            (attempt) => attempt.status === "fulfilled"
        );
        const rejected = attempts.filter(
            (attempt) => attempt.status === "rejected"
        );

        const finalVault = await prisma.vault.findUnique({
            where: { id: vault.id },
        });
        const withdrawalCount = await prisma.transaction.count({
            where: {
                vaultId: vault.id,
                type: "withdrawal",
            },
        });

        assert.equal(fulfilled.length, 1);
        assert.equal(rejected.length, 1);
        assert.equal(rejected[0].reason.message, "Insufficient funds");
        assert.equal(serializeMoney(finalVault.balance), 20);
        assert.equal(withdrawalCount, 1);
    });
});
