const { Prisma } = require("@prisma/client");

const MONEY_SCALE = 2;
const MAX_MONEY_AMOUNT = 9999999999.99;

const hasValidMoneyPrecision = (value) => {
    const scaled = Math.round(value * 100);

    return Math.abs(value * 100 - scaled) < 1e-8;
};

const toMoneyDecimal = (value) =>
    new Prisma.Decimal(value).toDecimalPlaces(MONEY_SCALE);

const serializeMoney = (value) => {
    if (value === null || value === undefined) {
        return 0;
    }

    return Number(toMoneyDecimal(value).toString());
};

const serializeVault = (vault) => ({
    ...vault,
    balance: serializeMoney(vault.balance),
});

const serializeTransaction = (transaction) => ({
    ...transaction,
    amount: serializeMoney(transaction.amount),
});

const formatMoney = (value) => {
    const amount = serializeMoney(value);

    return amount.toLocaleString("en-CA", {
        minimumFractionDigits: MONEY_SCALE,
        maximumFractionDigits: MONEY_SCALE,
    });
};

module.exports = {
    MONEY_SCALE,
    MAX_MONEY_AMOUNT,
    hasValidMoneyPrecision,
    toMoneyDecimal,
    serializeMoney,
    serializeVault,
    serializeTransaction,
    formatMoney,
};
