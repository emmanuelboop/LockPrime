require("./setup");

const { describe, it, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");

const { resetDatabase, disconnect, ensureDatabaseConnection } = require("./setup");
const {
    request,
    app,
    createUserAndToken,
    authHeader,
} = require("./helpers");

describe("auth API", () => {
    before(async () => {
        await ensureDatabaseConnection();
    });

    beforeEach(async () => {
        await resetDatabase();
    });

    after(async () => {
        await disconnect();
    });

    describe("register and login", () => {
        it("registers a new user", async () => {
            const response = await request(app).post("/api/auth/register").send({
                name: "New User",
                email: "new-user@test.com",
                password: "password123",
            });

            assert.equal(response.status, 201);
            assert.equal(response.body.user.email, "new-user@test.com");
        });

        it("rejects duplicate email on register", async () => {
            await request(app).post("/api/auth/register").send({
                name: "First User",
                email: "duplicate@test.com",
                password: "password123",
            });

            const response = await request(app).post("/api/auth/register").send({
                name: "Second User",
                email: "duplicate@test.com",
                password: "password123",
            });

            assert.equal(response.status, 400);
            assert.equal(response.body.message, "Email already exists");
        });

        it("logs in with valid credentials", async () => {
            await request(app).post("/api/auth/register").send({
                name: "Login User",
                email: "login-user@test.com",
                password: "password123",
            });

            const response = await request(app).post("/api/auth/login").send({
                email: "login-user@test.com",
                password: "password123",
            });

            assert.equal(response.status, 200);
            assert.ok(response.body.token);
            assert.equal(response.body.user.email, "login-user@test.com");
        });

        it("rejects invalid login credentials", async () => {
            await request(app).post("/api/auth/register").send({
                name: "Bad Login User",
                email: "bad-login@test.com",
                password: "password123",
            });

            const response = await request(app).post("/api/auth/login").send({
                email: "bad-login@test.com",
                password: "wrong-password",
            });

            assert.equal(response.status, 401);
            assert.equal(response.body.message, "Invalid credentials");
        });
    });

    describe("GET /api/auth/me", () => {
        it("rejects unauthenticated requests", async () => {
            const response = await request(app).get("/api/auth/me");

            assert.equal(response.status, 401);
        });

        it("rejects invalid tokens", async () => {
            const response = await request(app)
                .get("/api/auth/me")
                .set(authHeader("invalid-token"));

            assert.equal(response.status, 401);
        });

        it("returns the authenticated user profile", async () => {
            const { token, user } = await createUserAndToken({
                name: "Profile User",
                email: "profile-user@test.com",
            });

            const response = await request(app)
                .get("/api/auth/me")
                .set(authHeader(token));

            assert.equal(response.status, 200);
            assert.equal(response.body.id, user.id);
            assert.equal(response.body.name, "Profile User");
            assert.equal(response.body.email, "profile-user@test.com");
            assert.ok(response.body.createdAt);
        });
    });

    describe("PATCH /api/auth/me", () => {
        it("rejects unauthenticated profile updates", async () => {
            const response = await request(app).patch("/api/auth/me").send({
                name: "Updated Name",
                email: "updated@test.com",
            });

            assert.equal(response.status, 401);
        });

        it("updates the authenticated user profile", async () => {
            const { token } = await createUserAndToken({
                name: "Original Name",
                email: "original@test.com",
            });

            const response = await request(app)
                .patch("/api/auth/me")
                .set(authHeader(token))
                .send({
                    name: "Updated Name",
                    email: "updated@test.com",
                });

            assert.equal(response.status, 200);
            assert.equal(response.body.name, "Updated Name");
            assert.equal(response.body.email, "updated@test.com");
        });

        it("rejects empty name", async () => {
            const { token } = await createUserAndToken();

            const response = await request(app)
                .patch("/api/auth/me")
                .set(authHeader(token))
                .send({
                    name: "   ",
                    email: "valid@test.com",
                });

            assert.equal(response.status, 400);
            assert.equal(response.body.message, "Name is required");
        });

        it("rejects duplicate email from another user", async () => {
            await createUserAndToken({
                name: "Existing User",
                email: "taken@test.com",
            });

            const { token } = await createUserAndToken({
                name: "Other User",
                email: "other-user@test.com",
            });

            const response = await request(app)
                .patch("/api/auth/me")
                .set(authHeader(token))
                .send({
                    name: "Other User",
                    email: "taken@test.com",
                });

            assert.equal(response.status, 400);
            assert.equal(response.body.message, "Email already exists");
        });

        it("only updates the authenticated user", async () => {
            const userA = await createUserAndToken({
                name: "User A",
                email: "user-a@test.com",
            });

            const userB = await createUserAndToken({
                name: "User B",
                email: "user-b@test.com",
            });

            await request(app)
                .patch("/api/auth/me")
                .set(authHeader(userA.token))
                .send({
                    name: "Updated User A",
                    email: "updated-a@test.com",
                });

            const userBProfile = await request(app)
                .get("/api/auth/me")
                .set(authHeader(userB.token));

            assert.equal(userBProfile.body.name, "User B");
            assert.equal(userBProfile.body.email, "user-b@test.com");
        });
    });

    describe("PATCH /api/auth/me/password", () => {
        it("rejects unauthenticated password changes", async () => {
            const response = await request(app)
                .patch("/api/auth/me/password")
                .send({
                    currentPassword: "password123",
                    newPassword: "newpassword456",
                });

            assert.equal(response.status, 401);
        });

        it("rejects incorrect current password", async () => {
            const { token, email } = await createUserAndToken({
                email: "password-user@test.com",
            });

            const response = await request(app)
                .patch("/api/auth/me/password")
                .set(authHeader(token))
                .send({
                    currentPassword: "wrong-password",
                    newPassword: "newpassword456",
                });

            assert.equal(response.status, 400);
            assert.equal(response.body.message, "Current password is incorrect");

            const loginResponse = await request(app).post("/api/auth/login").send({
                email,
                password: "password123",
            });

            assert.equal(loginResponse.status, 200);
        });

        it("rejects passwords shorter than 6 characters", async () => {
            const { token } = await createUserAndToken();

            const response = await request(app)
                .patch("/api/auth/me/password")
                .set(authHeader(token))
                .send({
                    currentPassword: "password123",
                    newPassword: "12345",
                });

            assert.equal(response.status, 400);
            assert.equal(
                response.body.message,
                "New password must be at least 6 characters"
            );
        });

        it("updates password and allows login with the new password", async () => {
            const { token, email } = await createUserAndToken({
                email: "change-password@test.com",
            });

            const response = await request(app)
                .patch("/api/auth/me/password")
                .set(authHeader(token))
                .send({
                    currentPassword: "password123",
                    newPassword: "newpassword456",
                });

            assert.equal(response.status, 200);
            assert.equal(response.body.message, "Password updated successfully");

            const oldPasswordLogin = await request(app).post("/api/auth/login").send({
                email,
                password: "password123",
            });

            assert.equal(oldPasswordLogin.status, 401);

            const newPasswordLogin = await request(app).post("/api/auth/login").send({
                email,
                password: "newpassword456",
            });

            assert.equal(newPasswordLogin.status, 200);
        });
    });
});
