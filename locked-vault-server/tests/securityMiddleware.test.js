require("./setup");

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

describe("security middleware", () => {
    it("rejects disallowed browser origins", async () => {
        process.env.RATE_LIMIT_ENABLED = "false";
        process.env.CLIENT_APP_URL = "http://localhost:5173";
        delete process.env.CORS_ORIGINS;

        delete require.cache[require.resolve("../config/security")];
        delete require.cache[require.resolve("../middleware/corsMiddleware")];
        delete require.cache[require.resolve("../app")];

        const app = require("../app");

        const response = await request(app)
            .get("/")
            .set("Origin", "https://evil.example.com");

        assert.equal(response.status, 200);
        assert.equal(
            response.headers["access-control-allow-origin"],
            undefined
        );
    });

    it("allows configured browser origins", async () => {
        process.env.RATE_LIMIT_ENABLED = "false";
        process.env.CLIENT_APP_URL = "http://localhost:5173";
        delete process.env.CORS_ORIGINS;

        delete require.cache[require.resolve("../config/security")];
        delete require.cache[require.resolve("../middleware/corsMiddleware")];
        delete require.cache[require.resolve("../app")];

        const app = require("../app");

        const response = await request(app)
            .get("/")
            .set("Origin", "http://localhost:5173");

        assert.equal(response.status, 200);
        assert.equal(
            response.headers["access-control-allow-origin"],
            "http://localhost:5173"
        );
    });

    it("blocks non-HTTPS API requests in production", async () => {
        process.env.NODE_ENV = "production";
        process.env.ENFORCE_HTTPS = "true";
        process.env.RATE_LIMIT_ENABLED = "false";

        delete require.cache[require.resolve("../config/security")];
        delete require.cache[require.resolve("../middleware/httpsOnly")];
        delete require.cache[require.resolve("../app")];

        const app = require("../app");

        const response = await request(app).post("/api/auth/login").send({
            email: "user@test.com",
            password: "password123",
        });

        assert.equal(response.status, 403);
        assert.equal(response.body.message, "HTTPS required");

        delete process.env.NODE_ENV;
        delete process.env.ENFORCE_HTTPS;
        delete require.cache[require.resolve("../config/security")];
        delete require.cache[require.resolve("../middleware/httpsOnly")];
        delete require.cache[require.resolve("../app")];
    });
});
