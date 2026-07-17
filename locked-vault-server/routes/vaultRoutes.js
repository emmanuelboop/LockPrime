const express = require("express");
const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

const {
  createVault,
  getVaults,
  depositMoney,
  withdrawMoney,
  getTransactions,
  deleteVault,
  renameVault,
  lockVault,
} = require("../controllers/vaultController");

router.post("/", authenticate, createVault);
router.get("/", authenticate, getVaults);
router.patch("/:vaultId", authenticate, renameVault);
router.post("/:vaultId/lock", authenticate, lockVault);
router.post("/:vaultId/deposit", authenticate, depositMoney);
router.post("/:vaultId/withdraw", authenticate, withdrawMoney);
router.get("/:vaultId/transactions", authenticate, getTransactions);
router.delete("/:vaultId", authenticate, deleteVault);

module.exports = router;