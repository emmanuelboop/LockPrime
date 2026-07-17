const { Resend } = require("resend");

const DEFAULT_FROM = "LockPrime <onboarding@resend.dev>";

const escapeHtml = (value = "") =>
    String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

const buildPasswordResetEmail = ({ resetUrl, userName }) => {
    const greetingName = userName?.trim() || "there";
    const safeName = escapeHtml(greetingName);
    const safeResetUrl = escapeHtml(resetUrl);

    const subject = "Reset your LockPrime password";

    const text = [
        `Hi ${greetingName},`,
        "",
        "We received a request to reset your LockPrime password.",
        `Reset your password: ${resetUrl}`,
        "",
        "This link expires in 1 hour. If you did not request a reset, you can ignore this email.",
    ].join("\n");

    const html = `
        <p>Hi ${safeName},</p>
        <p>We received a request to reset your LockPrime password.</p>
        <p>
            <a href="${safeResetUrl}" style="display:inline-block;padding:12px 20px;background:#111827;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">
                Reset password
            </a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p><a href="${safeResetUrl}">${safeResetUrl}</a></p>
        <p>This link expires in 1 hour. If you did not request a reset, you can ignore this email.</p>
    `.trim();

    return { subject, text, html };
};

const logPasswordResetLink = (resetUrl) => {
    console.log(`[LockPrime] Password reset link: ${resetUrl}`);
};

const sendPasswordResetEmail = async ({ to, resetUrl, userName }) => {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from = process.env.EMAIL_FROM?.trim() || DEFAULT_FROM;
    const { subject, text, html } = buildPasswordResetEmail({
        resetUrl,
        userName,
    });

    if (!apiKey) {
        logPasswordResetLink(resetUrl);
        return { delivered: false, mode: "console" };
    }

    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
        from,
        to,
        subject,
        text,
        html,
    });

    if (error) {
        console.error("[LockPrime] Resend failed:", error.message);

        if (process.env.NODE_ENV !== "production") {
            console.warn(
                "[LockPrime] Dev fallback: copy the reset link from the server terminal below."
            );
            logPasswordResetLink(resetUrl);
        }

        return {
            delivered: false,
            mode: "resend",
            reason: error.message,
        };
    }

    console.log(
        `[LockPrime] Password reset email sent to ${to} (id: ${data.id})`
    );

    return { delivered: true, mode: "resend", id: data.id };
};

module.exports = {
    buildPasswordResetEmail,
    sendPasswordResetEmail,
    logPasswordResetLink,
};
