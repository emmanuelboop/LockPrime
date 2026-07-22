const prisma = require("../config/prisma");
const paymentOrchestrationService = require("../payments/services/paymentOrchestrationService");
const {
    PAYMENT_STATUS,
    PAYMENT_PROVIDER,
} = require("../payments/constants");

const processSimulatedDeposit = async ({
    userId,
    vaultId,
    amount,
    idempotencyKey,
    client = prisma,
}) =>
    paymentOrchestrationService.initiateDeposit({
        userId,
        vaultId,
        amount,
        idempotencyKey,
        providerName: PAYMENT_PROVIDER.SIMULATED,
        client,
    });

const failPaymentById = async (paymentId, failureReason) => {
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { vault: true, transaction: true },
    });

    if (!payment) {
        const error = new Error("Payment not found");
        error.statusCode = 404;
        throw error;
    }

    return prisma.$transaction((tx) =>
        paymentOrchestrationService.failPayment(tx, payment, failureReason)
    );
};

module.exports = {
    processSimulatedDeposit,
    failPaymentById,
    initiateDeposit: paymentOrchestrationService.initiateDeposit,
    initiateWithdrawal: paymentOrchestrationService.initiateWithdrawal,
    applyProviderEvent: paymentOrchestrationService.applyProviderEvent,
    PAYMENT_STATUS,
    PAYMENT_PROVIDER,
};
