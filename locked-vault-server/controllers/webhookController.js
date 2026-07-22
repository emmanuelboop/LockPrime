const webhookService = require("../payments/services/webhookService");
const { getPaymentProvider } = require("../payments/providers/registry");

const sendError = (error, res) => {
    console.log(error);

    const status = error.statusCode || 500;
    const message = status === 500 ? "Server error" : error.message;

    res.status(status).json({
        message,
    });
};

const handlePaymentWebhook = async (req, res) => {
    try {
        const providerName = req.params.provider;
        const provider = getPaymentProvider(providerName);

        if (!provider.supportsAsyncSettlement && providerName === "simulated") {
            return res.status(501).json({
                message: "Simulated provider does not accept webhooks",
            });
        }

        const results = await webhookService.handleWebhook({
            providerName,
            rawBody: req.body,
            headers: req.headers,
        });

        res.json({
            received: true,
            results,
        });
    } catch (error) {
        sendError(error, res);
    }
};

module.exports = {
    handlePaymentWebhook,
};
