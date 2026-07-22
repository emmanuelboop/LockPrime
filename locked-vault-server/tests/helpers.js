const request = require("supertest");
const app = require("../app");
const { prisma } = require("./setup");
const { toMoneyDecimal } = require("../utils/money");
const {
    LEDGER_ACCOUNT_TYPE,
    LEDGER_ENTRY_TYPE,
} = require("../payments/constants");

const createUserAndToken = async (overrides = {}) => {
    const email =
        overrides.email ||
        `user-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`;
    const password = overrides.password || "password123";

    await request(app).post("/api/auth/register").send({
        name: overrides.name || "Test User",
        email,
        password,
    });

    const loginResponse = await request(app).post("/api/auth/login").send({
        email,
        password,
    });

    return {
        email,
        password,
        user: loginResponse.body.user,
        token: loginResponse.body.token,
    };
};

const authHeader = (token) => ({
    Authorization: `Bearer ${token}`,
});

const createVault = async (token, vaultData) => {
    const { lockDays, ...payload } = vaultData;

    const response = await request(app)
        .post("/api/vaults")
        .set(authHeader(token))
        .send(payload);

    if (lockDays && response.status === 201 && response.body.balance > 0) {
        const lockResponse = await request(app)
            .post(`/api/vaults/${response.body.id}/lock`)
            .set(authHeader(token))
            .send({ lockDays });

        return lockResponse.status === 200
            ? lockResponse
            : response;
    }

    return response;
};

const lockVault = async (token, vaultId, lockDays = 30) =>
    request(app)
        .post(`/api/vaults/${vaultId}/lock`)
        .set(authHeader(token))
        .send({ lockDays });

const setVaultUnlocked = async (vaultId) => {
    return prisma.vault.update({
        where: { id: vaultId },
        data: {
            unlockDate: new Date(Date.now() - 86400000),
        },
    });
};

const seedVaultLedgerBalance = async (vaultId, balance) => {
    const decimalBalance = toMoneyDecimal(balance);

    await prisma.ledgerEntry.upsert({
        where: { id: `opening_${vaultId}` },
        create: {
            id: `opening_${vaultId}`,
            vaultId,
            accountType: LEDGER_ACCOUNT_TYPE.AVAILABLE,
            entryType: LEDGER_ENTRY_TYPE.OPENING_BALANCE,
            amount: decimalBalance,
            availableBalanceAfter: decimalBalance,
        },
        update: {
            amount: decimalBalance,
            availableBalanceAfter: decimalBalance,
        },
    });
};

const createFundedVault = async (userId, balance, overrides = {}) => {
    const vault = await prisma.vault.create({
        data: {
            name: overrides.name || "Funded Vault",
            balance: toMoneyDecimal(balance),
            unlockDate: overrides.unlockDate ?? new Date(Date.now() - 86400000),
            userId,
        },
    });

    await seedVaultLedgerBalance(vault.id, balance);

    return vault;
};

module.exports = {
    request,
    app,
    createUserAndToken,
    authHeader,
    createVault,
    lockVault,
    setVaultUnlocked,
    seedVaultLedgerBalance,
    createFundedVault,
};
