const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
    buildPasswordResetEmail,
    sendPasswordResetEmail,
} = require("../services/emailService");

describe("emailService", () => {
    describe("buildPasswordResetEmail", () => {
        it("builds a reset email with a greeting and link", () => {
            const email = buildPasswordResetEmail({
                resetUrl: "http://localhost:5173/reset-password?token=abc123",
                userName: "Alex",
            });

            assert.equal(email.subject, "Reset your LockPrime password");
            assert.match(email.text, /Hi Alex,/);
            assert.match(
                email.text,
                /http:\/\/localhost:5173\/reset-password\?token=abc123/
            );
            assert.match(email.html, /Hi Alex,/);
            assert.match(
                email.html,
                /http:\/\/localhost:5173\/reset-password\?token=abc123/
            );
        });

        it("escapes HTML in user-provided values", () => {
            const email = buildPasswordResetEmail({
                resetUrl: "http://localhost:5173/reset-password?token=safe",
                userName: '<script>alert("xss")</script>',
            });

            assert.doesNotMatch(email.html, /<script>/);
            assert.match(
                email.html,
                /&lt;script&gt;alert\(&quot;xss&quot;\)&lt;\/script&gt;/
            );
        });
    });

    describe("sendPasswordResetEmail", () => {
        it("falls back to console mode when RESEND_API_KEY is not set", async () => {
            const originalApiKey = process.env.RESEND_API_KEY;

            delete process.env.RESEND_API_KEY;

            const result = await sendPasswordResetEmail({
                to: "user@test.com",
                resetUrl: "http://localhost:5173/reset-password?token=test-token",
                userName: "Test User",
            });

            assert.deepEqual(result, {
                delivered: false,
                mode: "console",
            });

            if (originalApiKey) {
                process.env.RESEND_API_KEY = originalApiKey;
            }
        });
    });
});
