const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
    buildDepositConfirmationEmail,
    buildWithdrawalConfirmationEmail,
    buildVaultUnlockedEmail,
    buildVaultLockedEmail,
    sendDepositConfirmationEmail,
} = require("../services/emailService");

describe("notification emails", () => {
    describe("buildDepositConfirmationEmail", () => {
        it("includes the deposit amount and vault balance", () => {
            const email = buildDepositConfirmationEmail({
                userName: "Alex",
                vaultName: "Emergency Fund",
                amount: "100.00",
                vaultBalance: "350.00",
            });

            assert.equal(email.subject, "Deposit confirmed — Emergency Fund");
            assert.match(email.text, /\$100\.00/);
            assert.match(email.text, /Emergency Fund/);
            assert.match(email.text, /\$350\.00/);
        });
    });

    describe("buildWithdrawalConfirmationEmail", () => {
        it("includes the withdrawal amount and remaining balance", () => {
            const email = buildWithdrawalConfirmationEmail({
                userName: "Alex",
                vaultName: "Vacation",
                amount: "50.00",
                vaultBalance: "150.00",
            });

            assert.equal(email.subject, "Withdrawal confirmed — Vacation");
            assert.match(email.text, /\$50\.00/);
            assert.match(email.text, /Remaining vault balance: \$150\.00/);
        });
    });

    describe("buildVaultUnlockedEmail", () => {
        it("includes the vault name and unlock date", () => {
            const email = buildVaultUnlockedEmail({
                userName: "Alex",
                vaultName: "Car Fund",
                unlockDate: "July 17, 2026",
            });

            assert.equal(email.subject, "Your vault is unlocked — Car Fund");
            assert.match(email.text, /Car Fund/);
            assert.match(email.text, /July 17, 2026/);
        });

        it("escapes HTML in user-provided values", () => {
            const email = buildVaultUnlockedEmail({
                userName: "<b>Bad</b>",
                vaultName: "<script>x</script>",
                unlockDate: "July 17, 2026",
            });

            assert.doesNotMatch(email.html, /<script>/);
            assert.match(email.html, /&lt;script&gt;x&lt;\/script&gt;/);
        });
    });

    describe("buildVaultLockedEmail", () => {
        it("includes the lock period and unlock date", () => {
            const email = buildVaultLockedEmail({
                userName: "Alex",
                vaultName: "Emergency Fund",
                lockDays: 30,
                unlockDate: "August 16, 2026",
            });

            assert.equal(email.subject, "Funds locked — Emergency Fund");
            assert.match(email.text, /locked "Emergency Fund" for 30 days/);
            assert.match(email.text, /August 16, 2026/);
        });
    });

    describe("sendDepositConfirmationEmail", () => {
        it("falls back to console mode when RESEND_API_KEY is not set", async () => {
            const originalApiKey = process.env.RESEND_API_KEY;

            delete process.env.RESEND_API_KEY;

            const result = await sendDepositConfirmationEmail({
                to: "user@test.com",
                userName: "Test User",
                vaultName: "Savings",
                amount: "25.00",
                vaultBalance: "125.00",
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
