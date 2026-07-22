const getDefaultPaymentProviderName = () =>
    process.env.PAYMENT_PROVIDER || "simulated";

const STALE_PAYMENT_THRESHOLD_MS = Number(
    process.env.STALE_PAYMENT_THRESHOLD_MS || 1000 * 60 * 60 * 24
);

module.exports = {
    getDefaultPaymentProviderName,
    STALE_PAYMENT_THRESHOLD_MS,
};
