import api from "./api";

const getTransactions = async (vaultId) => {
    const response = await api.get(
        `/api/vaults/${vaultId}/transactions`
    );
    return response.data;
};

export {
    getTransactions,
};