const crypto = require("crypto");

const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

const hashResetToken = (token) =>
    crypto.createHash("sha256").update(token).digest("hex");

const generateResetToken = () =>
    crypto.randomBytes(RESET_TOKEN_BYTES).toString("hex");

const buildResetUrl = (token) => {
    const clientAppUrl =
        process.env.CLIENT_APP_URL || "http://localhost:5173";

    return `${clientAppUrl.replace(/\/$/, "")}/reset-password?token=${token}`;
};

const getResetTokenExpiry = () =>
    new Date(Date.now() + RESET_TOKEN_TTL_MS);

module.exports = {
    RESET_TOKEN_TTL_MS,
    hashResetToken,
    generateResetToken,
    buildResetUrl,
    getResetTokenExpiry,
};
