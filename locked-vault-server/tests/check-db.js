require("./setup");

const { prisma, disconnect } = require("./setup");

prisma
    .$queryRaw`SELECT 1`
    .then(() => {
        console.log("Database is reachable.");
        return disconnect();
    })
    .catch((error) => {
        console.log("Database is unreachable.");
        console.log(error.message.split("\n").slice(0, 3).join("\n"));
        process.exit(1);
    });
