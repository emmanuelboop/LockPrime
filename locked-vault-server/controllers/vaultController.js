const vaultService = require("../services/vaultService");

const sendError = (error, res) => {
    console.log(error);

    const status = error.statusCode || 500;
    const message = status === 500 ? "Server error" : error.message;

    res.status(status).json({
        message,
    });
};

const createVault = async (req, res) => {
  try {

    const vault =
      await vaultService.createVault(
        req.body,
        req.user.userId
      );

    res.status(201).json(vault);

  } catch (error) {

    sendError(error, res);

  }
};

const getVaults = async (req, res) => {
  try {
    const vaults = await vaultService.getVaults(
      req.user.userId
    );

    res.json(vaults);
  } catch (error) {
    sendError(error, res);
  }
};

const depositMoney = async (req, res) => {
    try {

        const updatedVault =
            await vaultService.depositMoney(
                req.params.vaultId,
                req.body.amount,
                req.user.userId
            );

        res.json(updatedVault);

    } catch (error) {

        sendError(error, res);

    }
};

const withdrawMoney = async (req, res) => {
    try {

        const updatedVault =
            await vaultService.withdrawMoney(
                req.params.vaultId,
                req.body.amount,
                req.user.userId
            );

        res.json(updatedVault);

    } catch (error) {

        sendError(error, res);

    }
};

const getTransactions = async (req, res) => {
    try {

        const transactions =
            await vaultService.getTransactions(
                req.params.vaultId,
                req.user.userId
            );

        res.json(transactions);

    } catch (error) {

        sendError(error, res);

    }
};

const deleteVault = async (req, res) => {
    try {
        await vaultService.deleteVault(
            req.params.vaultId,
            req.user.userId
        );

        res.status(204).send();
    } catch (error) {
        sendError(error, res);
    }
};

const renameVault = async (req, res) => {
    try {
        const vault = await vaultService.renameVault(
            req.params.vaultId,
            req.body.name,
            req.user.userId
        );

        res.json(vault);
    } catch (error) {
        sendError(error, res);
    }
};

module.exports = {
  createVault,
  getVaults,
  depositMoney,
  withdrawMoney,
  getTransactions,
  deleteVault,
  renameVault,
};
