const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
    path: path.join(__dirname, "..", ".env.test"),
});

dotenv.config({
    path: path.join(__dirname, "..", ".env"),
});

const maskDatabaseTarget = (databaseUrl) => {
    if (!databaseUrl) {
        return "not configured";
    }

    try {
        const parsed = new URL(databaseUrl);

        return `${parsed.hostname}${parsed.pathname}`;
    } catch {
        return "configured database";
    }
};

const isTruthy = (value) =>
    value === "true" || value === "1" || value === "yes";

const usingDedicatedTestDatabase = Boolean(process.env.TEST_DATABASE_URL);
const runningInCi = isTruthy(process.env.CI);
const allowDevDatabaseTests = isTruthy(process.env.ALLOW_DEV_DATABASE_TESTS);

if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

if (!process.env.DATABASE_URL) {
    throw new Error(
        [
            "DATABASE_URL is required to run integration tests.",
            "",
            "Set up a dedicated test database:",
            "  1. cp .env.test.example .env.test",
            "  2. Add TEST_DATABASE_URL (Neon branch or local Postgres)",
            "  3. npm run test:prepare",
            "",
            "Run `npm run test:unit` for tests that do not need a database.",
        ].join("\n")
    );
}

if (
    !usingDedicatedTestDatabase &&
    !runningInCi &&
    !allowDevDatabaseTests
) {
    throw new Error(
        [
            "Integration tests must use a dedicated test database.",
            "",
            "Your .env DATABASE_URL points at your development database.",
            "Running tests would delete all users, vaults, and transactions there.",
            "",
            "Fix:",
            "  1. cp .env.test.example .env.test",
            "  2. Create a separate Neon branch/database for tests",
            "  3. Set TEST_DATABASE_URL in .env.test",
            "  4. npm run test:prepare",
            "",
            "Emergency override (not recommended):",
            "  ALLOW_DEV_DATABASE_TESTS=true in .env.test",
        ].join("\n")
    );
}

if (
    !usingDedicatedTestDatabase &&
    !runningInCi &&
    allowDevDatabaseTests
) {
    console.warn(
        [
            "",
            "WARNING: Integration tests are using DATABASE_URL from .env.",
            "All users, vaults, and transactions in that database will be deleted.",
            `Target: ${maskDatabaseTarget(process.env.DATABASE_URL)}`,
            "",
        ].join("\n")
    );
}

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";

const prisma = require("../config/prisma");

const sleep = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds));

const buildConnectionHelpMessage = (error) => {
    const target = maskDatabaseTarget(process.env.DATABASE_URL);

    return [
        "Integration tests require a reachable PostgreSQL database.",
        "",
        `Could not connect to: ${target}`,
        error.message.split("\n")[0],
        "",
        "Common fixes:",
        "- If you use Neon, open the Neon console and resume/wake the database.",
        "- Wait a few seconds after waking Neon, then run `npm test` again.",
        "- Confirm TEST_DATABASE_URL in .env.test is current.",
        "- Run `npm run test:prepare` after changing test database credentials.",
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
    testDatabaseTarget: maskDatabaseTarget(process.env.DATABASE_URL),
    usingDedicatedTestDatabase,
};
