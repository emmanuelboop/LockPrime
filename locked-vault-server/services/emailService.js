const { Resend } = require("resend");

const DEFAULT_FROM = "LockPrime <onboarding@resend.dev>";

const escapeHtml = (value = "") =>
    String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

const deliverEmail = async ({ to, subject, text, html, consolePreview }) => {
    const apiKey =
        process.env.NODE_ENV === "test"
            ? ""
            : process.env.RESEND_API_KEY?.trim();
    const from = process.env.EMAIL_FROM?.trim() || DEFAULT_FROM;

    if (!apiKey) {
        if (consolePreview) {
            console.log(`[LockPrime] ${consolePreview}`);
        }

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

        if (process.env.NODE_ENV !== "production" && consolePreview) {
            console.warn(
                "[LockPrime] Dev fallback: notification details logged below."
            );
            console.log(`[LockPrime] ${consolePreview}`);
        }

        return {
            delivered: false,
            mode: "resend",
            reason: error.message,
        };
    }

    console.log(`[LockPrime] Email sent to ${to} (id: ${data.id})`);

    return { delivered: true, mode: "resend", id: data.id };
};

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

const buildDepositConfirmationEmail = ({
    userName,
    vaultName,
    amount,
    vaultBalance,
}) => {
    const greetingName = userName?.trim() || "there";
    const safeName = escapeHtml(greetingName);
    const safeVaultName = escapeHtml(vaultName);
    const safeAmount = escapeHtml(amount);
    const safeBalance = escapeHtml(vaultBalance);

    const subject = `Deposit confirmed — ${vaultName}`;

    const text = [
        `Hi ${greetingName},`,
        "",
        `Your deposit of $${amount} to "${vaultName}" was successful.`,
        `New vault balance: $${vaultBalance}.`,
        "",
        "Thanks for saving with LockPrime.",
    ].join("\n");

    const html = `
        <p>Hi ${safeName},</p>
        <p>Your deposit of <strong>$${safeAmount}</strong> to <strong>${safeVaultName}</strong> was successful.</p>
        <p>New vault balance: <strong>$${safeBalance}</strong></p>
        <p>Thanks for saving with LockPrime.</p>
    `.trim();

    return { subject, text, html };
};

const buildWithdrawalConfirmationEmail = ({
    userName,
    vaultName,
    amount,
    vaultBalance,
}) => {
    const greetingName = userName?.trim() || "there";
    const safeName = escapeHtml(greetingName);
    const safeVaultName = escapeHtml(vaultName);
    const safeAmount = escapeHtml(amount);
    const safeBalance = escapeHtml(vaultBalance);

    const subject = `Withdrawal confirmed — ${vaultName}`;

    const text = [
        `Hi ${greetingName},`,
        "",
        `You withdrew $${amount} from "${vaultName}".`,
        `Remaining vault balance: $${vaultBalance}.`,
        "",
        "Thanks for using LockPrime.",
    ].join("\n");

    const html = `
        <p>Hi ${safeName},</p>
        <p>You withdrew <strong>$${safeAmount}</strong> from <strong>${safeVaultName}</strong>.</p>
        <p>Remaining vault balance: <strong>$${safeBalance}</strong></p>
        <p>Thanks for using LockPrime.</p>
    `.trim();

    return { subject, text, html };
};

const buildVaultLockedEmail = ({
    userName,
    vaultName,
    lockDays,
    unlockDate,
}) => {
    const greetingName = userName?.trim() || "there";
    const safeName = escapeHtml(greetingName);
    const safeVaultName = escapeHtml(vaultName);
    const safeLockDays = escapeHtml(String(lockDays));
    const safeUnlockDate = escapeHtml(unlockDate);
    const dayLabel = lockDays === 1 ? "day" : "days";

    const subject = `Funds locked — ${vaultName}`;

    const text = [
        `Hi ${greetingName},`,
        "",
        `You locked "${vaultName}" for ${lockDays} ${dayLabel}.`,
        `Withdrawals will be available on ${unlockDate}.`,
        "",
        "You can still add money while the vault is locked.",
        "",
        "Thanks for staying committed to your goals.",
    ].join("\n");

    const html = `
        <p>Hi ${safeName},</p>
        <p>You locked <strong>${safeVaultName}</strong> for <strong>${safeLockDays} ${dayLabel}</strong>.</p>
        <p>Withdrawals will be available on <strong>${safeUnlockDate}</strong>.</p>
        <p>You can still add money while the vault is locked.</p>
        <p>Thanks for staying committed to your goals.</p>
    `.trim();

    return { subject, text, html };
};

const buildVaultUnlockedEmail = ({ userName, vaultName, unlockDate }) => {
    const greetingName = userName?.trim() || "there";
    const safeName = escapeHtml(greetingName);
    const safeVaultName = escapeHtml(vaultName);
    const safeUnlockDate = escapeHtml(unlockDate);

    const subject = `Your vault is unlocked — ${vaultName}`;

    const text = [
        `Hi ${greetingName},`,
        "",
        `Good news — your vault "${vaultName}" unlocked on ${unlockDate}.`,
        "You can now withdraw your savings from the LockPrime dashboard.",
        "",
        "Thanks for staying committed to your goals.",
    ].join("\n");

    const html = `
        <p>Hi ${safeName},</p>
        <p>Good news — your vault <strong>${safeVaultName}</strong> unlocked on <strong>${safeUnlockDate}</strong>.</p>
        <p>You can now withdraw your savings from the LockPrime dashboard.</p>
        <p>Thanks for staying committed to your goals.</p>
    `.trim();

    return { subject, text, html };
};

const logPasswordResetLink = (resetUrl) => {
    console.log(`[LockPrime] Password reset link: ${resetUrl}`);
};

const sendPasswordResetEmail = async ({ to, resetUrl, userName }) => {
    const { subject, text, html } = buildPasswordResetEmail({
        resetUrl,
        userName,
    });

    return deliverEmail({
        to,
        subject,
        text,
        html,
        consolePreview: `Password reset link: ${resetUrl}`,
    });
};

const sendDepositConfirmationEmail = async ({
    to,
    userName,
    vaultName,
    amount,
    vaultBalance,
}) => {
    const { subject, text, html } = buildDepositConfirmationEmail({
        userName,
        vaultName,
        amount,
        vaultBalance,
    });

    return deliverEmail({
        to,
        subject,
        text,
        html,
        consolePreview: `Deposit confirmation: $${amount} to "${vaultName}" (balance: $${vaultBalance})`,
    });
};

const sendWithdrawalConfirmationEmail = async ({
    to,
    userName,
    vaultName,
    amount,
    vaultBalance,
}) => {
    const { subject, text, html } = buildWithdrawalConfirmationEmail({
        userName,
        vaultName,
        amount,
        vaultBalance,
    });

    return deliverEmail({
        to,
        subject,
        text,
        html,
        consolePreview: `Withdrawal confirmation: $${amount} from "${vaultName}" (balance: $${vaultBalance})`,
    });
};

const sendVaultUnlockedEmail = async ({
    to,
    userName,
    vaultName,
    unlockDate,
}) => {
    const { subject, text, html } = buildVaultUnlockedEmail({
        userName,
        vaultName,
        unlockDate,
    });

    return deliverEmail({
        to,
        subject,
        text,
        html,
        consolePreview: `Vault unlocked: "${vaultName}" on ${unlockDate}`,
    });
};

const sendVaultLockedEmail = async ({
    to,
    userName,
    vaultName,
    lockDays,
    unlockDate,
}) => {
    const { subject, text, html } = buildVaultLockedEmail({
        userName,
        vaultName,
        lockDays,
        unlockDate,
    });

    return deliverEmail({
        to,
        subject,
        text,
        html,
        consolePreview: `Vault locked: "${vaultName}" until ${unlockDate}`,
    });
};

module.exports = {
    buildPasswordResetEmail,
    buildDepositConfirmationEmail,
    buildWithdrawalConfirmationEmail,
    buildVaultLockedEmail,
    buildVaultUnlockedEmail,
    sendPasswordResetEmail,
    sendDepositConfirmationEmail,
    sendWithdrawalConfirmationEmail,
    sendVaultUnlockedEmail,
    sendVaultLockedEmail,
    logPasswordResetLink,
};
