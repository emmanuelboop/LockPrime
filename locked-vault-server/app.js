const authRoutes = require("./routes/authRoutes");
const vaultRoutes = require("./routes/vaultRoutes");

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/vaults", vaultRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Locked Vault API Running",
    });
});

module.exports = app;
