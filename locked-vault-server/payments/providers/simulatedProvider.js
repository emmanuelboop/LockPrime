const { PAYMENT_PROVIDER, PAYMENT_STATUS } = require("../constants");
const { PROVIDER_EVENT_TYPE } = require("../events/normalizedProviderEvents");

const simulatedProvider = {
    name: PAYMENT_PROVIDER.SIMULATED,
    supportsAsyncSettlement: false,

    async initiateDeposit(context) {
        return {
            providerPaymentId: `simulated_deposit_${context.paymentId}`,
            status: PAYMENT_STATUS.COMPLETED,
            clientAction: { type: "none" },
            normalizedEvents: [
                {
                    providerEventId: `simulated_deposit_settled_${context.paymentId}`,
                    providerPaymentId: `simulated_deposit_${context.paymentId}`,
                    eventType: PROVIDER_EVENT_TYPE.DEPOSIT_SETTLED,
                    paymentId: context.paymentId,
                    amount: context.amount,
                    currency: context.currency,
                    occurredAt: new Date(),
                },
            ],
        };
    },

    async initiateWithdrawal(context) {
        return {
            providerPaymentId: `simulated_withdrawal_${context.paymentId}`,
            status: PAYMENT_STATUS.COMPLETED,
            clientAction: { type: "none" },
            normalizedEvents: [
                {
                    providerEventId: `simulated_withdrawal_settled_${context.paymentId}`,
                    providerPaymentId: `simulated_withdrawal_${context.paymentId}`,
                    eventType: PROVIDER_EVENT_TYPE.WITHDRAWAL_SETTLED,
                    paymentId: context.paymentId,
                    amount: context.amount,
                    currency: context.currency,
                    occurredAt: new Date(),
                },
            ],
        };
    },

    async parseWebhook() {
        return [];
    },

    async verifyWebhook() {
        return true;
    },

    async fetchPaymentStatus() {
        return null;
    },
};

module.exports = simulatedProvider;
