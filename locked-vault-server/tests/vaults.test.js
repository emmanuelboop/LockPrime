require("./setup");

const { describe, it, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");

const { resetDatabase, disconnect, ensureDatabaseConnection } = require("./setup");
const {
    request,
    app,
    createUserAndToken,
    authHeader,
    createVault,
    setVaultUnlocked,
} = require("./helpers");

describe("vault API", () => {
    before(async () => {
        await ensureDatabaseConnection();
    });

    beforeEach(async () => {
        await resetDatabase();
    });

    after(async () => {
        await disconnect();
    });

    describe("authentication and authorization", () => {
        it("rejects unauthenticated vault requests", async () => {
            const response = await request(app).get("/api/vaults");

            assert.equal(response.status, 401);
        });

        it("prevents another user from depositing into a vault", async () => {
            const owner = await createUserAndToken();
            const otherUser = await createUserAndToken();

            const vaultResponse = await createVault(owner.token, {
                name: "Owner Vault",
                amount: 100,
                lockDays: 30,
            });

            const response = await request(app)
                .post(`/api/vaults/${vaultResponse.body.id}/deposit`)
                .set(authHeader(otherUser.token))
                .send({ amount: 10 });

            assert.equal(response.status, 404);
        });

        it("prevents another user from withdrawing from a vault", async () => {
            const owner = await createUserAndToken();
            const otherUser = await createUserAndToken();

            const vaultResponse = await createVault(owner.token, {
                name: "Owner Vault",
                amount: 100,
                lockDays: 30,
            });

            await setVaultUnlocked(vaultResponse.body.id);

            const response = await request(app)
                .post(`/api/vaults/${vaultResponse.body.id}/withdraw`)
                .set(authHeader(otherUser.token))
                .send({ amount: 10 });

            assert.equal(response.status, 404);
        });

        it("prevents another user from viewing transactions", async () => {
            const owner = await createUserAndToken();
            const otherUser = await createUserAndToken();

            const vaultResponse = await createVault(owner.token, {
                name: "Owner Vault",
                amount: 100,
                lockDays: 30,
            });

            const response = await request(app)
                .get(`/api/vaults/${vaultResponse.body.id}/transactions`)
                .set(authHeader(otherUser.token));

            assert.equal(response.status, 404);
        });
    });

    describe("amount validation", () => {
        it("rejects invalid deposit amounts", async () => {
            const { token } = await createUserAndToken();
            const vaultResponse = await createVault(token, {
                name: "Deposit Validation",
                amount: 100,
                lockDays: 30,
            });

            for (const amount of [0, -10, "abc"]) {
                const response = await request(app)
                    .post(`/api/vaults/${vaultResponse.body.id}/deposit`)
                    .set(authHeader(token))
                    .send({ amount });

                assert.equal(response.status, 400);
            }
        });

        it("rejects invalid withdrawal amounts", async () => {
            const { token } = await createUserAndToken();
            const vaultResponse = await createVault(token, {
                name: "Withdraw Validation",
                amount: 100,
                lockDays: 30,
            });

            await setVaultUnlocked(vaultResponse.body.id);

            for (const amount of [0, -10, "abc"]) {
                const response = await request(app)
                    .post(`/api/vaults/${vaultResponse.body.id}/withdraw`)
                    .set(authHeader(token))
                    .send({ amount });

                assert.equal(response.status, 400);
            }
        });

        it("rejects invalid vault creation input", async () => {
            const { token } = await createUserAndToken();

            const negativeAmount = await createVault(token, {
                name: "Bad Vault",
                amount: -5,
                lockDays: 10,
            });

            const invalidLockDays = await createVault(token, {
                name: "Bad Vault",
                amount: 10,
                lockDays: 0,
            });

            assert.equal(negativeAmount.status, 400);
            assert.equal(invalidLockDays.status, 400);
        });
    });

    describe("vault locking", () => {
        it("rejects withdrawals from locked vaults", async () => {
            const { token } = await createUserAndToken();
            const vaultResponse = await createVault(token, {
                name: "Locked Vault",
                amount: 100,
                lockDays: 30,
            });

            const response = await request(app)
                .post(`/api/vaults/${vaultResponse.body.id}/withdraw`)
                .set(authHeader(token))
                .send({ amount: 10 });

            assert.equal(response.status, 403);
            assert.equal(response.body.message, "Vault is still locked");
        });

        it("allows deposits into locked vaults", async () => {
            const { token } = await createUserAndToken();
            const vaultResponse = await createVault(token, {
                name: "Locked Vault",
                amount: 100,
                lockDays: 30,
            });

            const response = await request(app)
                .post(`/api/vaults/${vaultResponse.body.id}/deposit`)
                .set(authHeader(token))
                .send({ amount: 25 });

            assert.equal(response.status, 200);
            assert.equal(response.body.balance, 125);
        });
    });

    describe("transaction integrity", () => {
        it("records an initial deposit when a vault is created with funds", async () => {
            const { token } = await createUserAndToken();
            const vaultResponse = await createVault(token, {
                name: "Funded Vault",
                amount: 100,
                lockDays: 30,
            });

            const transactionsResponse = await request(app)
                .get(`/api/vaults/${vaultResponse.body.id}/transactions`)
                .set(authHeader(token));

            assert.equal(vaultResponse.body.balance, 100);
            assert.equal(transactionsResponse.body.length, 1);
            assert.equal(transactionsResponse.body[0].type, "deposit");
            assert.equal(transactionsResponse.body[0].amount, 100);
        });

        it("creates no transaction when a vault starts at zero", async () => {
            const { token } = await createUserAndToken();
            const vaultResponse = await createVault(token, {
                name: "Empty Vault",
                amount: 0,
                lockDays: 30,
            });

            const transactionsResponse = await request(app)
                .get(`/api/vaults/${vaultResponse.body.id}/transactions`)
                .set(authHeader(token));

            assert.equal(vaultResponse.body.balance, 0);
            assert.equal(transactionsResponse.body.length, 0);
        });

        it("records a deposit transaction when money is added", async () => {
            const { token } = await createUserAndToken();
            const vaultResponse = await createVault(token, {
                name: "Deposit Vault",
                amount: 50,
                lockDays: 30,
            });

            await request(app)
                .post(`/api/vaults/${vaultResponse.body.id}/deposit`)
                .set(authHeader(token))
                .send({ amount: 25 });

            const transactionsResponse = await request(app)
                .get(`/api/vaults/${vaultResponse.body.id}/transactions`)
                .set(authHeader(token));

            assert.equal(transactionsResponse.body.length, 2);
            assert.equal(transactionsResponse.body[0].type, "deposit");
            assert.equal(transactionsResponse.body[0].amount, 25);
        });

        it("records a withdrawal transaction when money is withdrawn", async () => {
            const { token } = await createUserAndToken();
            const vaultResponse = await createVault(token, {
                name: "Withdraw Vault",
                amount: 100,
                lockDays: 30,
            });

            await setVaultUnlocked(vaultResponse.body.id);

            const withdrawResponse = await request(app)
                .post(`/api/vaults/${vaultResponse.body.id}/withdraw`)
                .set(authHeader(token))
                .send({ amount: 40 });

            const transactionsResponse = await request(app)
                .get(`/api/vaults/${vaultResponse.body.id}/transactions`)
                .set(authHeader(token));

            assert.equal(withdrawResponse.body.balance, 60);
            assert.equal(transactionsResponse.body[0].type, "withdrawal");
            assert.equal(transactionsResponse.body[0].amount, 40);
        });

        it("preserves cent precision for decimal amounts", async () => {
            const { token } = await createUserAndToken();
            const vaultResponse = await createVault(token, {
                name: "Cents Vault",
                amount: 10.25,
                lockDays: 30,
            });

            await request(app)
                .post(`/api/vaults/${vaultResponse.body.id}/deposit`)
                .set(authHeader(token))
                .send({ amount: 0.75 });

            const vaultsResponse = await request(app)
                .get("/api/vaults")
                .set(authHeader(token));

            const vault = vaultsResponse.body.find(
                (entry) => entry.id === vaultResponse.body.id
            );

            assert.equal(vault.balance, 11);

            const transactionsResponse = await request(app)
                .get(`/api/vaults/${vaultResponse.body.id}/transactions`)
                .set(authHeader(token));

            const depositAmounts = transactionsResponse.body
                .filter((entry) => entry.type === "deposit")
                .map((entry) => entry.amount);

            assert.deepEqual(depositAmounts.sort((a, b) => a - b), [0.75, 10.25]);
        });

        it("rejects withdrawals greater than the available balance", async () => {
            const { token } = await createUserAndToken();
            const vaultResponse = await createVault(token, {
                name: "Balance Vault",
                amount: 100,
                lockDays: 30,
            });

            await setVaultUnlocked(vaultResponse.body.id);

            const response = await request(app)
                .post(`/api/vaults/${vaultResponse.body.id}/withdraw`)
                .set(authHeader(token))
                .send({ amount: 150 });

            assert.equal(response.status, 400);
            assert.equal(response.body.message, "Insufficient funds");
        });
    });
});
