const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
    validatePositiveAmount,
    validateNonNegativeAmount,
    validateLockDays,
    validateVaultName,
} = require("../utils/amountValidation");

const expectValidationError = (fn) => {
    assert.throws(fn, (error) => {
        assert.equal(error.statusCode, 400);
        return true;
    });
};

describe("amountValidation", () => {
    describe("validatePositiveAmount", () => {
        it("accepts a positive number", () => {
            assert.equal(validatePositiveAmount(100), 100);
            assert.equal(validatePositiveAmount("25.5"), 25.5);
            assert.equal(validatePositiveAmount("10.25"), 10.25);
        });

        it("rejects zero", () => {
            expectValidationError(() => validatePositiveAmount(0));
        });

        it("rejects negative amounts", () => {
            expectValidationError(() => validatePositiveAmount(-10));
        });

        it("rejects empty, null, and non-numeric values", () => {
            expectValidationError(() => validatePositiveAmount(""));
            expectValidationError(() => validatePositiveAmount(null));
            expectValidationError(() => validatePositiveAmount("abc"));
        });

        it("rejects amounts with more than 2 decimal places", () => {
            expectValidationError(() => validatePositiveAmount(10.999));
            expectValidationError(() => validatePositiveAmount("1.234"));
        });
    });

    describe("validateNonNegativeAmount", () => {
        it("accepts zero", () => {
            assert.equal(validateNonNegativeAmount(0), 0);
        });

        it("accepts positive amounts", () => {
            assert.equal(validateNonNegativeAmount(50), 50);
        });

        it("rejects negative amounts", () => {
            expectValidationError(() => validateNonNegativeAmount(-1));
        });
    });

    describe("validateLockDays", () => {
        it("accepts positive whole numbers", () => {
            assert.equal(validateLockDays(30), 30);
            assert.equal(validateLockDays("7"), 7);
        });

        it("rejects zero, negative, and decimal values", () => {
            expectValidationError(() => validateLockDays(0));
            expectValidationError(() => validateLockDays(-5));
            expectValidationError(() => validateLockDays(1.5));
        });
    });

    describe("validateVaultName", () => {
        it("returns a trimmed vault name", () => {
            assert.equal(validateVaultName("  Emergency Fund  "), "Emergency Fund");
        });

        it("rejects empty and whitespace-only names", () => {
            expectValidationError(() => validateVaultName(""));
            expectValidationError(() => validateVaultName("   "));
        });
    });
});
