const prisma = require("../../config/prisma");
const { PAYMENT_STATUS } = require("../constants");
const { STALE_PAYMENT_THRESHOLD_MS } = require("../config");

const reconcileStalePayments = async () => {
    const cutoff = new Date(Date.now() - STALE_PAYMENT_THRESHOLD_MS);
    const stalePayments = await prisma.payment.findMany({
        where: {
            status: {
                in: [
                    PAYMENT_STATUS.PENDING,
                    PAYMENT_STATUS.PROCESSING,
                    PAYMENT_STATUS.INITIATED,
                ],
            },
            updatedAt: {
                lt: cutoff,
            },
        },
        select: {
            id: true,
            provider: true,
            providerPaymentId: true,
            status: true,
            updatedAt: true,
        },
    });

    return {
        checkedAt: new Date(),
        staleCount: stalePayments.length,
        stalePayments,
    };
};

module.exports = {
    reconcileStalePayments,
};
