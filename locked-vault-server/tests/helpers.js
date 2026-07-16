const request = require("supertest");
const app = require("../app");
const { prisma } = require("./setup");

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
    const response = await request(app)
        .post("/api/vaults")
        .set(authHeader(token))
        .send(vaultData);

    return response;
};

const setVaultUnlocked = async (vaultId) => {
    return prisma.vault.update({
        where: { id: vaultId },
        data: {
            unlockDate: new Date(Date.now() - 86400000),
        },
    });
};

module.exports = {
    request,
    app,
    createUserAndToken,
    authHeader,
    createVault,
    setVaultUnlocked,
};
