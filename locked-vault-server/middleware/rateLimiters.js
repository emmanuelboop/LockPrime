const rateLimit = require("express-rate-limit");
const { isRateLimitEnabled } = require("../config/security");

const rateLimitResponse = {
    message: "Too many requests. Please try again later.",
};

const createLimiter = ({ windowMs, max, message = rateLimitResponse }) =>
    rateLimit({
        windowMs,
        max,
        message,
        standardHeaders: true,
        legacyHeaders: false,
        skip: () => !isRateLimitEnabled(),
    });

const authLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        message: "Too many authentication attempts. Please try again later.",
    },
});

const passwordResetLimiter = createLimiter({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: {
        message: "Too many password reset attempts. Please try again later.",
    },
});

const apiLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 200,
});

module.exports = {
    authLimiter,
    passwordResetLimiter,
    apiLimiter,
};
