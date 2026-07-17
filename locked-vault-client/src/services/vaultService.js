import api from "./api";

export const getVaults = async () => {
  const response = await api.get(
    "/api/vaults"
  );

  return response.data;
};

export const createVault = async (vaultData) => {
  const response = await api.post(
    "/api/vaults",
    vaultData
  );

  return response.data;
};

export const depositMoney = async (vaultId, amount) => {
  const response = await api.post(
    `/api/vaults/${vaultId}/deposit`,
    {
      amount,
    }
  );

  return response.data;
};

export const withdrawMoney = async (vaultId, amount) => {
  const response = await api.post(
    `/api/vaults/${vaultId}/withdraw`,
    {
      amount,
    }
  );

  return response.data;
};

export const deleteVault = async (vaultId) => {
  await api.delete(`/api/vaults/${vaultId}`);
};

export const renameVault = async (vaultId, name) => {
  const response = await api.patch(`/api/vaults/${vaultId}`, { name });

  return response.data;
};

export const lockVault = async (vaultId, lockDays) => {
  const response = await api.post(`/api/vaults/${vaultId}/lock`, {
    lockDays,
  });

  return response.data;
};
