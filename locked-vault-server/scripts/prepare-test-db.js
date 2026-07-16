const path = require("path");
const { execSync } = require("child_process");
const dotenv = require("dotenv");

dotenv.config({
    path: path.join(__dirname, "..", ".env.test"),
});

dotenv.config({
    path: path.join(__dirname, "..", ".env"),
});

if (!process.env.TEST_DATABASE_URL) {
    console.error(
        [
            "TEST_DATABASE_URL is required.",
            "",
            "Setup:",
            "  cp .env.test.example .env.test",
            "  # edit .env.test and set TEST_DATABASE_URL",
        ].join("\n")
    );
    process.exit(1);
}

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

execSync("npx prisma migrate deploy", {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
    env: process.env,
});

console.log("Test database migrations applied successfully.");
