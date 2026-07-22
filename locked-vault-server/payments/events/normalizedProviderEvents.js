const {
    PAYMENT_STATUS,
    PAYMENT_STATUS_TRANSITIONS,
    TERMINAL_PAYMENT_STATUSES,
} = require("../constants");

const PROVIDER_EVENT_TYPE = {
    DEPOSIT_ACCEPTED: "DEPOSIT_ACCEPTED",
    DEPOSIT_SETTLED: "DEPOSIT_SETTLED",
    DEPOSIT_FAILED: "DEPOSIT_FAILED",
    DEPOSIT_CANCELLED: "DEPOSIT_CANCELLED",
    WITHDRAWAL_ACCEPTED: "WITHDRAWAL_ACCEPTED",
    WITHDRAWAL_SETTLED: "WITHDRAWAL_SETTLED",
    WITHDRAWAL_FAILED: "WITHDRAWAL_FAILED",
    PAYMENT_REVERSED: "PAYMENT_REVERSED",
};

const isTerminalPaymentStatus = (status) => TERMINAL_PAYMENT_STATUSES.has(status);

const canTransitionPaymentStatus = (fromStatus, toStatus) => {
    if (fromStatus === toStatus) {
        return true;
    }

    const allowed = PAYMENT_STATUS_TRANSITIONS[fromStatus];

    return Boolean(allowed && allowed.has(toStatus));
};

const assertValidPaymentTransition = (fromStatus, toStatus) => {
    if (!canTransitionPaymentStatus(fromStatus, toStatus)) {
        const error = new Error(
            `Invalid payment status transition from ${fromStatus} to ${toStatus}`
        );
        error.statusCode = 409;
        throw error;
    }
};

const mapEventToPaymentStatus = (eventType) => {
    switch (eventType) {
        case PROVIDER_EVENT_TYPE.DEPOSIT_ACCEPTED:
        case PROVIDER_EVENT_TYPE.WITHDRAWAL_ACCEPTED:
            return PAYMENT_STATUS.PROCESSING;
        case PROVIDER_EVENT_TYPE.DEPOSIT_SETTLED:
        case PROVIDER_EVENT_TYPE.WITHDRAWAL_SETTLED:
            return PAYMENT_STATUS.COMPLETED;
        case PROVIDER_EVENT_TYPE.DEPOSIT_FAILED:
        case PROVIDER_EVENT_TYPE.WITHDRAWAL_FAILED:
            return PAYMENT_STATUS.FAILED;
        case PROVIDER_EVENT_TYPE.DEPOSIT_CANCELLED:
            return PAYMENT_STATUS.CANCELLED;
        case PROVIDER_EVENT_TYPE.PAYMENT_REVERSED:
            return PAYMENT_STATUS.REVERSED;
        default:
            return null;
    }
};

module.exports = {
    PROVIDER_EVENT_TYPE,
    isTerminalPaymentStatus,
    canTransitionPaymentStatus,
    assertValidPaymentTransition,
    mapEventToPaymentStatus,
};
