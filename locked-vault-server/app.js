const authRoutes = require("./routes/authRoutes");
const vaultRoutes = require("./routes/vaultRoutes");
const webhookRoutes = require("./routes/webhookRoutes");

const express = require("express");
const { shouldTrustProxy } = require("./config/security");
const corsMiddleware = require("./middleware/corsMiddleware");
const httpsOnly = require("./middleware/httpsOnly");
const { apiLimiter } = require("./middleware/rateLimiters");

const app = express();

if (shouldTrustProxy()) {
    app.set("trust proxy", 1);
}

app.use(httpsOnly);
app.use(corsMiddleware);
app.use(express.json());
app.use(apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/vaults", vaultRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Locked Vault API Running",
    });
});

module.exports = app;
