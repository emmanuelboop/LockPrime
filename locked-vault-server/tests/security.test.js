const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
    getAllowedOrigins,
    normalizeOrigin,
    shouldEnforceHttps,
    isRateLimitEnabled,
} = require("../config/security");

describe("security config", () => {
    it("normalizes origins by trimming and removing trailing slashes", () => {
        assert.equal(
            normalizeOrigin(" https://lockprime.ca/ "),
            "https://lockprime.ca"
        );
    });

    it("includes CLIENT_APP_URL in allowed origins", () => {
        const originalClientAppUrl = process.env.CLIENT_APP_URL;

        process.env.CLIENT_APP_URL = "https://lockprime.ca/";
        delete process.env.CORS_ORIGINS;

        assert.deepEqual(getAllowedOrigins(), ["https://lockprime.ca"]);

        if (originalClientAppUrl) {
            process.env.CLIENT_APP_URL = originalClientAppUrl;
        } else {
            delete process.env.CLIENT_APP_URL;
        }
    });

    it("parses comma-separated CORS_ORIGINS", () => {
        const originalCorsOrigins = process.env.CORS_ORIGINS;
        const originalClientAppUrl = process.env.CLIENT_APP_URL;

        process.env.CORS_ORIGINS =
            "http://localhost:5173, https://lockprime.ca";
        delete process.env.CLIENT_APP_URL;

        assert.deepEqual(getAllowedOrigins(), [
            "http://localhost:5173",
            "https://lockprime.ca",
        ]);

        if (originalCorsOrigins) {
            process.env.CORS_ORIGINS = originalCorsOrigins;
        } else {
            delete process.env.CORS_ORIGINS;
        }

        if (originalClientAppUrl) {
            process.env.CLIENT_APP_URL = originalClientAppUrl;
        }
    });

    it("enforces HTTPS in production by default", () => {
        const originalNodeEnv = process.env.NODE_ENV;
        const originalEnforceHttps = process.env.ENFORCE_HTTPS;

        process.env.NODE_ENV = "production";
        delete process.env.ENFORCE_HTTPS;
        assert.equal(shouldEnforceHttps(), true);

        process.env.ENFORCE_HTTPS = "false";
        assert.equal(shouldEnforceHttps(), false);

        process.env.NODE_ENV = originalNodeEnv;

        if (originalEnforceHttps) {
            process.env.ENFORCE_HTTPS = originalEnforceHttps;
        } else {
            delete process.env.ENFORCE_HTTPS;
        }
    });

    it("disables rate limiting when RATE_LIMIT_ENABLED is false", () => {
        const originalRateLimitEnabled = process.env.RATE_LIMIT_ENABLED;

        process.env.RATE_LIMIT_ENABLED = "false";
        assert.equal(isRateLimitEnabled(), false);

        delete process.env.RATE_LIMIT_ENABLED;
        assert.equal(isRateLimitEnabled(), true);

        if (originalRateLimitEnabled) {
            process.env.RATE_LIMIT_ENABLED = originalRateLimitEnabled;
        }
    });
});
