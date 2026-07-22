const express = require("express");
const webhookController = require("../controllers/webhookController");

const router = express.Router();

router.post(
    "/payments/:provider",
    express.json(),
    webhookController.handlePaymentWebhook
);

module.exports = router;
