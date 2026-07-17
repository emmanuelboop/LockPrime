const cors = require("cors");
const { getAllowedOrigins } = require("../config/security");

const corsMiddleware = cors({
    origin(origin, callback) {
        const allowedOrigins = getAllowedOrigins();

        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }

        callback(null, false);
    },
});

module.exports = corsMiddleware;
