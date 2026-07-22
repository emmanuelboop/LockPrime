const { Prisma } = require("@prisma/client");

const MONEY_SCALE = 2;
const MAX_MONEY_AMOUNT = new Prisma.Decimal("9999999999.99");
const ZERO = new Prisma.Decimal(0);

const hasValidMoneyPrecision = (value) => {
    if (value instanceof Prisma.Decimal) {
        return value.equals(value.toDecimalPlaces(MONEY_SCALE));
    }

    const stringValue = String(value).trim();

    if (!/^-?\d+(\.\d+)?$/.test(stringValue)) {
        return false;
    }

    const fraction = stringValue.includes(".")
        ? stringValue.split(".")[1]
        : "";

    if (fraction.length > MONEY_SCALE) {
        return false;
    }

    const decimal = new Prisma.Decimal(stringValue);

    return decimal.equals(decimal.toDecimalPlaces(MONEY_SCALE));
};

const toMoneyDecimal = (value) => {
    if (value instanceof Prisma.Decimal) {
        return value.toDecimalPlaces(MONEY_SCALE);
    }

    if (value === null || value === undefined) {
        return ZERO;
    }

    return new Prisma.Decimal(value).toDecimalPlaces(MONEY_SCALE);
};

const compareMoney = (left, right) => {
    const a = toMoneyDecimal(left);
    const b = toMoneyDecimal(right);

    if (a.lessThan(b)) {
        return -1;
    }

    if (a.greaterThan(b)) {
        return 1;
    }

    return 0;
};

const moneyEquals = (left, right) => compareMoney(left, right) === 0;

const moneyGreaterThan = (left, right) => compareMoney(left, right) > 0;

const moneyGreaterThanOrEqual = (left, right) => compareMoney(left, right) >= 0;

const addMoney = (left, right) =>
    toMoneyDecimal(toMoneyDecimal(left).add(toMoneyDecimal(right)));

const subtractMoney = (left, right) =>
    toMoneyDecimal(toMoneyDecimal(left).sub(toMoneyDecimal(right)));

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
    status: transaction.status,
});

const serializePayment = (payment) => ({
    id: payment.id,
    status: payment.status,
    direction: payment.direction,
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
    ZERO,
    hasValidMoneyPrecision,
    toMoneyDecimal,
    compareMoney,
    moneyEquals,
    moneyGreaterThan,
    moneyGreaterThanOrEqual,
    addMoney,
    subtractMoney,
    serializeMoney,
    serializeVault,
    serializeTransaction,
    serializePayment,
    formatMoney,
};
