const prisma = require("../../config/prisma");
const {
    PAYMENT_STATUS,
    PAYMENT_DIRECTION,
    LEDGER_ENTRY_TYPE,
    TRANSACTION_STATUS,
    TRANSACTION_TYPE,
} = require("../constants");
const { PROVIDER_EVENT_TYPE } = require("../events/normalizedProviderEvents");
const {
    assertValidPaymentTransition,
    mapEventToPaymentStatus,
    isTerminalPaymentStatus,
} = require("../events/normalizedProviderEvents");
const { createBusinessError, buildProviderContext } = require("../providers/PaymentProvider");
const { getPaymentProvider } = require("../providers/registry");
const { getDefaultPaymentProviderName } = require("../config");
const ledgerService = require("./ledgerService");
const {
    toMoneyDecimal,
    serializeVault,
    serializePayment,
    moneyEquals,
} = require("../../utils/money");

const paymentInclude = {
    vault: true,
    transaction: true,
};

const buildPaymentResult = (payment, vault) => ({
    vault: serializeVault(vault || payment.vault),
    payment: serializePayment(payment),
});

const getExistingIdempotentPayment = async (client, idempotencyKey, userId) => {
    if (!idempotencyKey) {
        return null;
    }

    const existingPayment = await client.payment.findUnique({
        where: { idempotencyKey },
        include: paymentInclude,
    });

    if (!existingPayment) {
        return null;
    }

    if (existingPayment.userId !== userId) {
        throw createBusinessError("Invalid idempotency key", 409);
    }

    return existingPayment;
};

const syncTransactionStatus = async (client, payment, status) => {
    if (!payment.transactionId) {
        return;
    }

    await client.transaction.update({
        where: { id: payment.transactionId },
        data: { status },
    });
};

const updatePaymentStatus = async (
    client,
    payment,
    nextStatus,
    extraData = {}
) => {
    assertValidPaymentTransition(payment.status, nextStatus);

    const updatedPayment = await client.payment.update({
        where: { id: payment.id },
        data: {
            status: nextStatus,
            ...extraData,
        },
        include: paymentInclude,
    });

    await syncTransactionStatus(client, updatedPayment, nextStatus);

    return updatedPayment;
};

const linkPaymentToTransaction = async (client, payment, transaction) => {
    await client.transaction.update({
        where: { id: transaction.id },
        data: { paymentId: payment.id },
    });

    return client.payment.update({
        where: { id: payment.id },
        data: { transactionId: transaction.id },
        include: paymentInclude,
    });
};

const createPendingPaymentRecords = async (
    client,
    { userId, vaultId, amount, direction, idempotencyKey, provider }
) => {
    const transaction = await client.transaction.create({
        data: {
            vaultId,
            amount: toMoneyDecimal(amount),
            type:
                direction === PAYMENT_DIRECTION.DEPOSIT
                    ? TRANSACTION_TYPE.DEPOSIT
                    : TRANSACTION_TYPE.WITHDRAWAL,
            status: TRANSACTION_STATUS.PENDING,
        },
    });

    let payment = await client.payment.create({
        data: {
            amount: toMoneyDecimal(amount),
            direction,
            currency: "CAD",
            status: PAYMENT_STATUS.INITIATED,
            provider,
            idempotencyKey: idempotencyKey || null,
            userId,
            vaultId,
            transactionId: transaction.id,
        },
        include: paymentInclude,
    });

    payment = await linkPaymentToTransaction(client, payment, transaction);
    payment = await updatePaymentStatus(client, payment, PAYMENT_STATUS.PENDING);

    return payment;
};

const settleDeposit = async (client, payment, { providerPaymentId = null } = {}) => {
    if (payment.status === PAYMENT_STATUS.COMPLETED) {
        return {
            payment,
            vault: payment.vault,
            alreadyCompleted: true,
        };
    }

    if (isTerminalPaymentStatus(payment.status)) {
        throw createBusinessError("Payment can no longer be completed", 400);
    }

    const updatedVault = await ledgerService.creditAvailableBalance(client, {
        vaultId: payment.vaultId,
        paymentId: payment.id,
        amount: payment.amount,
        entryType: LEDGER_ENTRY_TYPE.DEPOSIT_CREDIT,
    });

    const updatedPayment = await updatePaymentStatus(
        client,
        payment,
        PAYMENT_STATUS.COMPLETED,
        {
            providerPaymentId: providerPaymentId || payment.providerPaymentId,
            completedAt: new Date(),
        }
    );

    await ledgerService.assertAvailableBalanceInvariant(
        client,
        payment.vaultId,
        updatedVault.balance
    );

    return {
        payment: { ...updatedPayment, vault: updatedVault },
        vault: updatedVault,
        alreadyCompleted: false,
    };
};

const settleWithdrawal = async (
    client,
    payment,
    { providerPaymentId = null } = {}
) => {
    if (payment.status === PAYMENT_STATUS.COMPLETED) {
        return {
            payment,
            vault: payment.vault,
            alreadyCompleted: true,
        };
    }

    if (isTerminalPaymentStatus(payment.status)) {
        throw createBusinessError("Payment can no longer be completed", 400);
    }

    const updatedVault = await ledgerService.settleWithdrawalReservation(client, {
        vaultId: payment.vaultId,
        paymentId: payment.id,
        amount: payment.amount,
    });

    const updatedPayment = await updatePaymentStatus(
        client,
        payment,
        PAYMENT_STATUS.COMPLETED,
        {
            providerPaymentId: providerPaymentId || payment.providerPaymentId,
            completedAt: new Date(),
        }
    );

    await ledgerService.assertAvailableBalanceInvariant(
        client,
        payment.vaultId,
        updatedVault.balance
    );

    return {
        payment: { ...updatedPayment, vault: updatedVault },
        vault: updatedVault,
        alreadyCompleted: false,
    };
};

const failPayment = async (client, payment, failureReason) => {
    if (payment.status === PAYMENT_STATUS.FAILED) {
        return { ...payment, vault: payment.vault };
    }

    if (isTerminalPaymentStatus(payment.status)) {
        return { ...payment, vault: payment.vault };
    }

    let vault = payment.vault;

    if (payment.direction === PAYMENT_DIRECTION.WITHDRAWAL) {
        vault = await ledgerService.releaseWithdrawalReservation(client, {
            vaultId: payment.vaultId,
            paymentId: payment.id,
            amount: payment.amount,
        });
    }

    const updatedPayment = await updatePaymentStatus(
        client,
        payment,
        PAYMENT_STATUS.FAILED,
        { failureReason }
    );

    return { ...updatedPayment, vault };
};

const cancelPayment = async (client, payment, failureReason = null) => {
    if (payment.status === PAYMENT_STATUS.CANCELLED) {
        return { ...payment, vault: payment.vault };
    }

    if (isTerminalPaymentStatus(payment.status)) {
        return { ...payment, vault: payment.vault };
    }

    let vault = payment.vault;

    if (payment.direction === PAYMENT_DIRECTION.WITHDRAWAL) {
        vault = await ledgerService.releaseWithdrawalReservation(client, {
            vaultId: payment.vaultId,
            paymentId: payment.id,
            amount: payment.amount,
        });
    }

    const updatedPayment = await updatePaymentStatus(
        client,
        payment,
        PAYMENT_STATUS.CANCELLED,
        { failureReason }
    );

    return { ...updatedPayment, vault };
};

const reversePayment = async (client, payment, failureReason = null) => {
    if (payment.status === PAYMENT_STATUS.REVERSED) {
        return { ...payment, vault: payment.vault };
    }

    if (payment.status !== PAYMENT_STATUS.COMPLETED) {
        throw createBusinessError("Only completed payments can be reversed", 409);
    }

    let vault = payment.vault;

    if (payment.direction === PAYMENT_DIRECTION.DEPOSIT) {
        vault = await ledgerService.reverseDepositCredit(client, {
            vaultId: payment.vaultId,
            paymentId: payment.id,
            amount: payment.amount,
        });
    } else {
        throw createBusinessError(
            "Withdrawal reversals are not supported yet",
            409
        );
    }

    const updatedPayment = await updatePaymentStatus(
        client,
        payment,
        PAYMENT_STATUS.REVERSED,
        { failureReason }
    );

    return { ...updatedPayment, vault };
};

const applyProviderEvent = async (client, event) => {
    const payment = await client.payment.findUnique({
        where: { id: event.paymentId },
        include: paymentInclude,
    });

    if (!payment) {
        throw createBusinessError("Payment not found", 404);
    }

    if (
        event.amount !== undefined &&
        !moneyEquals(payment.amount, toMoneyDecimal(event.amount))
    ) {
        throw createBusinessError("Provider event amount mismatch", 409);
    }

    switch (event.eventType) {
        case PROVIDER_EVENT_TYPE.DEPOSIT_ACCEPTED:
        case PROVIDER_EVENT_TYPE.WITHDRAWAL_ACCEPTED: {
            const updatedPayment = await updatePaymentStatus(
                client,
                payment,
                PAYMENT_STATUS.PROCESSING,
                {
                    providerPaymentId:
                        event.providerPaymentId || payment.providerPaymentId,
                }
            );
            return { payment: updatedPayment, vault: updatedPayment.vault };
        }
        case PROVIDER_EVENT_TYPE.DEPOSIT_SETTLED: {
            return settleDeposit(client, payment, {
                providerPaymentId: event.providerPaymentId,
            });
        }
        case PROVIDER_EVENT_TYPE.WITHDRAWAL_SETTLED: {
            return settleWithdrawal(client, payment, {
                providerPaymentId: event.providerPaymentId,
            });
        }
        case PROVIDER_EVENT_TYPE.DEPOSIT_FAILED:
        case PROVIDER_EVENT_TYPE.WITHDRAWAL_FAILED: {
            const updatedPayment = await failPayment(
                client,
                payment,
                event.failureReason || "Payment failed"
            );
            return { payment: updatedPayment, vault: updatedPayment.vault };
        }
        case PROVIDER_EVENT_TYPE.DEPOSIT_CANCELLED: {
            const updatedPayment = await cancelPayment(
                client,
                payment,
                event.failureReason || "Payment cancelled"
            );
            return { payment: updatedPayment, vault: updatedPayment.vault };
        }
        case PROVIDER_EVENT_TYPE.PAYMENT_REVERSED: {
            const updatedPayment = await reversePayment(
                client,
                payment,
                event.failureReason || "Payment reversed"
            );
            return { payment: updatedPayment, vault: updatedPayment.vault };
        }
        default:
            throw createBusinessError("Unsupported provider event type", 400);
    }
};

const applyProviderEvents = async (client, events) => {
    let lastResult = null;

    for (const event of events) {
        lastResult = await applyProviderEvent(client, event);
    }

    return lastResult;
};

const runWithTransaction = async (client, handler) => {
    if (client.$transaction) {
        return client.$transaction(handler);
    }

    return handler(client);
};

const initiateDeposit = async ({
    userId,
    vaultId,
    amount,
    idempotencyKey,
    providerName = getDefaultPaymentProviderName(),
    client = prisma,
}) =>
    runWithTransaction(client, async (tx) => {
        const existingPayment = await getExistingIdempotentPayment(
            tx,
            idempotencyKey,
            userId
        );

        if (existingPayment) {
            return {
                ...buildPaymentResult(existingPayment, existingPayment.vault),
                alreadyCompleted:
                    existingPayment.status === PAYMENT_STATUS.COMPLETED,
            };
        }

        const vault = await tx.vault.findFirst({
            where: { id: vaultId, userId },
        });

        if (!vault) {
            throw createBusinessError("Vault not found", 404);
        }

        const provider = getPaymentProvider(providerName);
        let payment = await createPendingPaymentRecords(tx, {
            userId,
            vaultId,
            amount,
            direction: PAYMENT_DIRECTION.DEPOSIT,
            idempotencyKey,
            provider: provider.name,
        });

        const providerContext = buildProviderContext({
            paymentId: payment.id,
            userId,
            vaultId,
            amount: toMoneyDecimal(amount),
            currency: payment.currency,
            idempotencyKey,
            direction: PAYMENT_DIRECTION.DEPOSIT,
        });

        const providerResult = await provider.initiateDeposit(providerContext);

        if (providerResult.providerPaymentId) {
            payment = await tx.payment.update({
                where: { id: payment.id },
                data: {
                    providerPaymentId: providerResult.providerPaymentId,
                },
                include: paymentInclude,
            });
        }

        const targetStatus =
            providerResult.status ||
            mapEventToPaymentStatus(
                providerResult.normalizedEvents?.[0]?.eventType
            );

        if (
            targetStatus &&
            targetStatus !== PAYMENT_STATUS.PENDING &&
            targetStatus !== PAYMENT_STATUS.COMPLETED
        ) {
            payment = await updatePaymentStatus(tx, payment, targetStatus);
        }

        let settleResult = null;

        if (providerResult.normalizedEvents?.length) {
            settleResult = await applyProviderEvents(
                tx,
                providerResult.normalizedEvents
            );
        } else if (targetStatus === PAYMENT_STATUS.COMPLETED) {
            settleResult = await settleDeposit(tx, payment, {
                providerPaymentId: providerResult.providerPaymentId,
            });
        }

        const finalPayment =
            settleResult?.payment ||
            (await tx.payment.findUnique({
                where: { id: payment.id },
                include: paymentInclude,
            }));
        const finalVault = settleResult?.vault || finalPayment.vault;

        return {
            ...buildPaymentResult(finalPayment, finalVault),
            alreadyCompleted: Boolean(settleResult?.alreadyCompleted),
        };
    });

const initiateWithdrawal = async ({
    userId,
    vaultId,
    amount,
    idempotencyKey,
    providerName = getDefaultPaymentProviderName(),
    client = prisma,
}) =>
    runWithTransaction(client, async (tx) => {
        const existingPayment = await getExistingIdempotentPayment(
            tx,
            idempotencyKey,
            userId
        );

        if (existingPayment) {
            return {
                ...buildPaymentResult(existingPayment, existingPayment.vault),
                alreadyCompleted:
                    existingPayment.status === PAYMENT_STATUS.COMPLETED,
            };
        }

        const vault = await tx.vault.findFirst({
            where: { id: vaultId, userId },
        });

        if (!vault) {
            throw createBusinessError("Vault not found", 404);
        }

        const provider = getPaymentProvider(providerName);
        let payment = await createPendingPaymentRecords(tx, {
            userId,
            vaultId,
            amount,
            direction: PAYMENT_DIRECTION.WITHDRAWAL,
            idempotencyKey,
            provider: provider.name,
        });

        const updatedVault = await ledgerService.reserveWithdrawalFunds(tx, {
            vaultId,
            paymentId: payment.id,
            amount,
        });

        payment = { ...payment, vault: updatedVault };

        const providerContext = buildProviderContext({
            paymentId: payment.id,
            userId,
            vaultId,
            amount: toMoneyDecimal(amount),
            currency: payment.currency,
            idempotencyKey,
            direction: PAYMENT_DIRECTION.WITHDRAWAL,
        });

        const providerResult = await provider.initiateWithdrawal(
            providerContext
        );

        if (providerResult.providerPaymentId) {
            payment = await tx.payment.update({
                where: { id: payment.id },
                data: {
                    providerPaymentId: providerResult.providerPaymentId,
                },
                include: paymentInclude,
            });
        }

        let settleResult = null;

        if (providerResult.normalizedEvents?.length) {
            settleResult = await applyProviderEvents(
                tx,
                providerResult.normalizedEvents
            );
        } else if (providerResult.status === PAYMENT_STATUS.COMPLETED) {
            settleResult = await settleWithdrawal(tx, payment, {
                providerPaymentId: providerResult.providerPaymentId,
            });
        }

        const finalPayment =
            settleResult?.payment ||
            (await tx.payment.findUnique({
                where: { id: payment.id },
                include: paymentInclude,
            }));
        const finalVault = settleResult?.vault || finalPayment.vault;

        await ledgerService.assertAvailableBalanceInvariant(
            tx,
            vaultId,
            finalVault.balance
        );

        return {
            ...buildPaymentResult(finalPayment, finalVault),
            alreadyCompleted: Boolean(settleResult?.alreadyCompleted),
        };
    });

module.exports = {
    initiateDeposit,
    initiateWithdrawal,
    applyProviderEvent,
    applyProviderEvents,
    settleDeposit,
    settleWithdrawal,
    failPayment,
    cancelPayment,
    reversePayment,
    buildPaymentResult,
    getExistingIdempotentPayment,
};
