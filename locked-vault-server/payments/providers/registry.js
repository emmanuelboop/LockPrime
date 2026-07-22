const { PAYMENT_PROVIDER } = require("../constants");
const { assertImplementsProvider } = require("./PaymentProvider");
const simulatedProvider = require("./simulatedProvider");
const { getDefaultPaymentProviderName } = require("../config");

const providers = new Map([
    [PAYMENT_PROVIDER.SIMULATED, simulatedProvider],
]);

const registerPaymentProvider = (name, provider) => {
    assertImplementsProvider(provider);
    providers.set(name, provider);
};

const getPaymentProvider = (name = getDefaultPaymentProviderName()) => {
    const provider = providers.get(name);

    if (!provider) {
        const error = new Error(`Unknown payment provider: ${name}`);
        error.statusCode = 500;
        throw error;
    }

    return provider;
};

module.exports = {
    registerPaymentProvider,
    getPaymentProvider,
};
