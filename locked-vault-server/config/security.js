const DEFAULT_DEV_ORIGIN = "http://localhost:5173";

const isProduction = () => process.env.NODE_ENV === "production";

const isTruthy = (value) =>
    value === "true" || value === "1" || value === "yes";

const isRateLimitEnabled = () =>
    process.env.RATE_LIMIT_ENABLED !== "false";

const shouldEnforceHttps = () =>
    isProduction() && process.env.ENFORCE_HTTPS !== "false";

const shouldTrustProxy = () =>
    isProduction() || isTruthy(process.env.TRUST_PROXY);

const normalizeOrigin = (origin) => origin.trim().replace(/\/$/, "");

const getAllowedOrigins = () => {
    const origins = new Set();

    if (process.env.CORS_ORIGINS) {
        process.env.CORS_ORIGINS.split(",")
            .map(normalizeOrigin)
            .filter(Boolean)
            .forEach((origin) => origins.add(origin));
    }

    if (process.env.CLIENT_APP_URL) {
        origins.add(normalizeOrigin(process.env.CLIENT_APP_URL));
    }

    if (origins.size === 0) {
        origins.add(DEFAULT_DEV_ORIGIN);
    }

    return [...origins];
};

module.exports = {
    DEFAULT_DEV_ORIGIN,
    isProduction,
    isRateLimitEnabled,
    shouldEnforceHttps,
    shouldTrustProxy,
    getAllowedOrigins,
    normalizeOrigin,
};
