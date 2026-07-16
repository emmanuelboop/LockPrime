const formatMoney = (value) => {
    const amount = Number(value);

    if (Number.isNaN(amount)) {
        return "0.00";
    }

    return amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

export default formatMoney;
