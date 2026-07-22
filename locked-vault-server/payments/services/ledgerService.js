const {
    LEDGER_ACCOUNT_TYPE,
    LEDGER_ENTRY_TYPE,
} = require("../constants");
const {
    toMoneyDecimal,
    addMoney,
    subtractMoney,
    moneyGreaterThan,
    moneyEquals,
    MAX_MONEY_AMOUNT,
} = require("../../utils/money");
const { createBusinessError } = require("../providers/PaymentProvider");

const appendLedgerEntry = async (
    client,
    {
        vaultId,
        paymentId = null,
        accountType,
        entryType,
        amount,
        availableBalanceAfter = null,
    }
) =>
    client.ledgerEntry.create({
        data: {
            vaultId,
            paymentId,
            accountType,
            entryType,
            amount: toMoneyDecimal(amount),
            availableBalanceAfter:
                availableBalanceAfter === null
                    ? null
                    : toMoneyDecimal(availableBalanceAfter),
        },
    });

const sumAccountBalance = async (client, vaultId, accountType) => {
    const aggregate = await client.ledgerEntry.aggregate({
        where: {
            vaultId,
            accountType,
        },
        _sum: {
            amount: true,
        },
    });

    return toMoneyDecimal(aggregate._sum.amount || 0);
};

const assertAvailableBalanceInvariant = async (client, vaultId, expectedBalance) => {
    const ledgerAvailable = await sumAccountBalance(
        client,
        vaultId,
        LEDGER_ACCOUNT_TYPE.AVAILABLE
    );

    if (!moneyEquals(ledgerAvailable, expectedBalance)) {
        throw createBusinessError(
            "Ledger available balance does not match vault balance",
            500
        );
    }
};

const assertMaxBalanceNotExceeded = (nextBalance) => {
    if (moneyGreaterThan(toMoneyDecimal(nextBalance), MAX_MONEY_AMOUNT)) {
        throw createBusinessError(
            "Vault balance cannot exceed the maximum allowed amount",
            400
        );
    }
};

const creditAvailableBalance = async (
    client,
    { vaultId, paymentId, amount, entryType }
) => {
    const decimalAmount = toMoneyDecimal(amount);
    const vault = await client.vault.findUnique({
        where: { id: vaultId },
    });

    if (!vault) {
        throw createBusinessError("Vault not found", 404);
    }

    const nextBalance = addMoney(vault.balance, decimalAmount);
    assertMaxBalanceNotExceeded(nextBalance);

    const updatedVault = await client.vault.update({
        where: { id: vaultId },
        data: {
            balance: nextBalance,
        },
    });

    await appendLedgerEntry(client, {
        vaultId,
        paymentId,
        accountType: LEDGER_ACCOUNT_TYPE.AVAILABLE,
        entryType,
        amount: decimalAmount,
        availableBalanceAfter: updatedVault.balance,
    });

    return updatedVault;
};

const debitAvailableBalance = async (
    client,
    { vaultId, paymentId, amount, entryType }
) => {
    const decimalAmount = toMoneyDecimal(amount);

    const updateResult = await client.vault.updateMany({
        where: {
            id: vaultId,
            balance: {
                gte: decimalAmount,
            },
        },
        data: {
            balance: {
                decrement: decimalAmount,
            },
        },
    });

    if (updateResult.count === 0) {
        throw createBusinessError("Insufficient funds", 400);
    }

    const updatedVault = await client.vault.findUnique({
        where: { id: vaultId },
    });

    await appendLedgerEntry(client, {
        vaultId,
        paymentId,
        accountType: LEDGER_ACCOUNT_TYPE.AVAILABLE,
        entryType,
        amount: subtractMoney(0, decimalAmount),
        availableBalanceAfter: updatedVault.balance,
    });

    return updatedVault;
};

const reserveWithdrawalFunds = async (client, { vaultId, paymentId, amount }) => {
    const decimalAmount = toMoneyDecimal(amount);
    const updatedVault = await debitAvailableBalance(client, {
        vaultId,
        paymentId,
        amount: decimalAmount,
        entryType: LEDGER_ENTRY_TYPE.WITHDRAWAL_RESERVE,
    });

    await appendLedgerEntry(client, {
        vaultId,
        paymentId,
        accountType: LEDGER_ACCOUNT_TYPE.WITHDRAWAL_PENDING,
        entryType: LEDGER_ENTRY_TYPE.WITHDRAWAL_RESERVE,
        amount: decimalAmount,
    });

    return updatedVault;
};

const releaseWithdrawalReservation = async (
    client,
    { vaultId, paymentId, amount }
) => {
    const decimalAmount = toMoneyDecimal(amount);

    await appendLedgerEntry(client, {
        vaultId,
        paymentId,
        accountType: LEDGER_ACCOUNT_TYPE.WITHDRAWAL_PENDING,
        entryType: LEDGER_ENTRY_TYPE.WITHDRAWAL_RELEASE,
        amount: subtractMoney(0, decimalAmount),
    });

    return creditAvailableBalance(client, {
        vaultId,
        paymentId,
        amount: decimalAmount,
        entryType: LEDGER_ENTRY_TYPE.WITHDRAWAL_RELEASE,
    });
};

const settleWithdrawalReservation = async (
    client,
    { vaultId, paymentId, amount }
) => {
    const decimalAmount = toMoneyDecimal(amount);

    await appendLedgerEntry(client, {
        vaultId,
        paymentId,
        accountType: LEDGER_ACCOUNT_TYPE.WITHDRAWAL_PENDING,
        entryType: LEDGER_ENTRY_TYPE.WITHDRAWAL_SETTLE,
        amount: subtractMoney(0, decimalAmount),
    });

    return client.vault.findUnique({
        where: { id: vaultId },
    });
};

const reverseDepositCredit = async (client, { vaultId, paymentId, amount }) =>
    debitAvailableBalance(client, {
        vaultId,
        paymentId,
        amount,
        entryType: LEDGER_ENTRY_TYPE.DEPOSIT_REVERSAL,
    });

module.exports = {
    appendLedgerEntry,
    sumAccountBalance,
    assertAvailableBalanceInvariant,
    creditAvailableBalance,
    debitAvailableBalance,
    reserveWithdrawalFunds,
    releaseWithdrawalReservation,
    settleWithdrawalReservation,
    reverseDepositCredit,
};
