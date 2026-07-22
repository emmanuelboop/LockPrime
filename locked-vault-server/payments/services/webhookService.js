const prisma = require("../../config/prisma");
const { getPaymentProvider } = require("../providers/registry");
const paymentOrchestrationService = require("./paymentOrchestrationService");

const recordWebhookEvent = async (client, { provider, event, rawPayload }) => {
    try {
        return await client.webhookEvent.create({
            data: {
                provider,
                providerEventId: event.providerEventId,
                eventType: event.eventType,
                payload: rawPayload,
                paymentId: event.paymentId || null,
            },
        });
    } catch (error) {
        if (error.code === "P2002") {
            return null;
        }

        throw error;
    }
};

const handleWebhook = async ({
    providerName,
    rawBody,
    headers,
    parsedPayload = null,
}) => {
    const provider = getPaymentProvider(providerName);

    const verified = await provider.verifyWebhook(rawBody, headers);

    if (!verified) {
        const error = new Error("Webhook verification failed");
        error.statusCode = 401;
        throw error;
    }

    const payload =
        parsedPayload ||
        (typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody);
    const events = await provider.parseWebhook(payload, headers);

    const results = [];

    for (const event of events) {
        const webhookEvent = await prisma.$transaction(async (tx) => {
            const createdEvent = await recordWebhookEvent(tx, {
                provider: providerName,
                event,
                rawPayload: payload,
            });

            if (!createdEvent) {
                return { duplicate: true, event };
            }

            try {
                const result = await paymentOrchestrationService.applyProviderEvent(
                    tx,
                    event
                );

                await tx.webhookEvent.update({
                    where: { id: createdEvent.id },
                    data: {
                        processedAt: new Date(),
                        paymentId: event.paymentId || null,
                    },
                });

                return { duplicate: false, event, result };
            } catch (processingError) {
                await tx.webhookEvent.update({
                    where: { id: createdEvent.id },
                    data: {
                        processingError: processingError.message,
                    },
                });

                throw processingError;
            }
        });

        results.push(webhookEvent);
    }

    return results;
};

module.exports = {
    handleWebhook,
    recordWebhookEvent,
};
