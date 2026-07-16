const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
    path: path.join(__dirname, "..", ".env.test"),
});

dotenv.config({
    path: path.join(__dirname, "..", ".env"),
});

if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

if (!process.env.DATABASE_URL) {
    throw new Error(
        "DATABASE_URL is required to run tests. Set TEST_DATABASE_URL or DATABASE_URL in .env.test or .env."
    );
}

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";

const prisma = require("../config/prisma");

const sleep = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds));

const buildConnectionHelpMessage = (error) => {
    const hostMatch = process.env.DATABASE_URL.match(/@([^/]+)/);
    const host = hostMatch ? hostMatch[1] : "configured host";

    return [
        "Integration tests require a reachable PostgreSQL database.",
        "",
        `Could not connect to: ${host}`,
        error.message.split("\n")[0],
        "",
        "Common fixes:",
        "- If you use Neon, open the Neon console and resume/wake the database.",
        "- Wait a few seconds after waking Neon, then run `npm test` again.",
        "- Confirm DATABASE_URL in .env is current.",
        "- Optional: set TEST_DATABASE_URL in .env.test for a dedicated test database.",
        "",
        "Run `npm run test:unit` to run validation tests without a database.",
    ].join("\n");
};

const ensureDatabaseConnection = async (retries = 3) => {
    let lastError;

    for (let attempt = 1; attempt <= retries; attempt += 1) {
        try {
            await prisma.$queryRaw`SELECT 1`;
            return;
        } catch (error) {
            lastError = error;

            if (attempt < retries) {
                await sleep(2000 * attempt);
            }
        }
    }

    throw new Error(buildConnectionHelpMessage(lastError));
};

const resetDatabase = async () => {
    await prisma.transaction.deleteMany();
    await prisma.vault.deleteMany();
    await prisma.user.deleteMany();
};

const disconnect = async () => {
    await prisma.$disconnect();
};

module.exports = {
    prisma,
    ensureDatabaseConnection,
    resetDatabase,
    disconnect,
};
