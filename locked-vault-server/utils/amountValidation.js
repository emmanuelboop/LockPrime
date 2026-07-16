const createValidationError = (message) => {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
};

const { hasValidMoneyPrecision, serializeMoney } = require("./money");

const parseAmount = (amount) => {
    if (amount === undefined || amount === null || amount === "") {
        return null;
    }

    const parsed = Number(amount);

    if (!Number.isFinite(parsed)) {
        return null;
    }

    return parsed;
};

const normalizeMoneyAmount = (parsed) => {
    if (!hasValidMoneyPrecision(parsed)) {
        throw createValidationError(
            "Amount must have at most 2 decimal places"
        );
    }

    return serializeMoney(parsed);
};

const validatePositiveAmount = (amount) => {
    const parsed = parseAmount(amount);

    if (parsed === null || parsed <= 0) {
        throw createValidationError("Amount must be a positive number");
    }

    return normalizeMoneyAmount(parsed);
};

const validateNonNegativeAmount = (amount) => {
    const parsed = parseAmount(amount);

    if (parsed === null || parsed < 0) {
        throw createValidationError("Amount must be zero or a positive number");
    }

    return normalizeMoneyAmount(parsed);
};

const validateLockDays = (lockDays) => {
    const parsed = parseAmount(lockDays);

    if (parsed === null || !Number.isInteger(parsed) || parsed <= 0) {
        throw createValidationError("Lock days must be a positive whole number");
    }

    return parsed;
};

const validateVaultName = (name) => {
    if (typeof name !== "string" || name.trim() === "") {
        throw createValidationError("Vault name is required");
    }

    return name.trim();
};

module.exports = {
    validatePositiveAmount,
    validateNonNegativeAmount,
    validateLockDays,
    validateVaultName,
};
