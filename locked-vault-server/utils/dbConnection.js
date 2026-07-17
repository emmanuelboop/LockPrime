const sleep = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds));

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

const ensureDatabaseConnection = async (prisma, retries = 3) => {
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

    throw lastError;
};

module.exports = {
    ensureDatabaseConnection,
    maskDatabaseTarget,
};
