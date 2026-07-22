const { getDefaultPaymentProviderName } = require("../config");

const createBusinessError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const assertImplementsProvider = (provider) => {
    const requiredMethods = [
        "initiateDeposit",
        "initiateWithdrawal",
        "parseWebhook",
        "verifyWebhook",
        "fetchPaymentStatus",
    ];

    for (const method of requiredMethods) {
        if (typeof provider[method] !== "function") {
            throw new Error(
                `Payment provider "${provider.name}" must implement ${method}()`
            );
        }
    }

    if (!provider.name) {
        throw new Error("Payment provider must define a name");
    }
};

const buildProviderContext = ({
    paymentId,
    userId,
    vaultId,
    amount,
    currency,
    idempotencyKey,
    direction,
    metadata,
}) => ({
    paymentId,
    userId,
    vaultId,
    amount,
    currency: currency || "CAD",
    idempotencyKey,
    direction,
    metadata: metadata || null,
});

module.exports = {
    createBusinessError,
    assertImplementsProvider,
    buildProviderContext,
    getDefaultPaymentProviderName,
};
