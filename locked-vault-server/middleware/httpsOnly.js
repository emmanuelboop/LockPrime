const { shouldEnforceHttps } = require("../config/security");

const getRequestProtocol = (req) => {
    const forwardedProto = req.get("x-forwarded-proto");

    if (forwardedProto) {
        return forwardedProto.split(",")[0].trim();
    }

    return req.secure ? "https" : "http";
};

const httpsOnly = (req, res, next) => {
    if (!shouldEnforceHttps()) {
        return next();
    }

    const protocol = getRequestProtocol(req);

    if (protocol === "https") {
        res.setHeader(
            "Strict-Transport-Security",
            "max-age=31536000; includeSubDomains"
        );
        return next();
    }

    if (req.method === "GET" || req.method === "HEAD") {
        const host = req.get("host");

        if (!host) {
            return res.status(403).json({
                message: "HTTPS required",
            });
        }

        return res.redirect(301, `https://${host}${req.originalUrl}`);
    }

    return res.status(403).json({
        message: "HTTPS required",
    });
};

module.exports = httpsOnly;
