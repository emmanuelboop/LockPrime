require("dotenv").config();

const app = require("./app");
const prisma = require("./config/prisma");
const {
    ensureDatabaseConnection,
    maskDatabaseTarget,
} = require("./utils/dbConnection");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await ensureDatabaseConnection(prisma);
        console.log(
            `Database connected: ${maskDatabaseTarget(process.env.DATABASE_URL)}`
        );
    } catch (error) {
        console.warn("Database is unreachable on startup.");
        console.warn(
            error.message.split("\n").slice(0, 2).join("\n")
        );
        console.warn(
            "If you use Neon, open the Neon console and resume the database, then retry."
        );
    }

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();
