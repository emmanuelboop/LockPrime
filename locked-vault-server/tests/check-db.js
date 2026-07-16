require("./setup");

const {
    disconnect,
    testDatabaseTarget,
    usingDedicatedTestDatabase,
} = require("./setup");

const prisma = require("../config/prisma");

prisma
    .$queryRaw`SELECT 1`
    .then(() => {
        console.log("Database is reachable.");
        console.log(`Target: ${testDatabaseTarget}`);
        console.log(
            usingDedicatedTestDatabase
                ? "Using dedicated test database (TEST_DATABASE_URL)."
                : "Using CI/shared test database (DATABASE_URL)."
        );
        return disconnect();
    })
    .catch((error) => {
        console.log("Database is unreachable.");
        console.log(`Target: ${testDatabaseTarget}`);
        console.log(error.message.split("\n").slice(0, 3).join("\n"));
        process.exit(1);
    });
