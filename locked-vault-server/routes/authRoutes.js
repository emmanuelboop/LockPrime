const express = require("express");
const authenticate = require("../middleware/authMiddleware");
const {
    authLimiter,
    passwordResetLimiter,
} = require("../middleware/rateLimiters");

const router = express.Router();

const {
    register,
    login,
    getMe,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
} = require("../controllers/authController");

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/reset-password", passwordResetLimiter, resetPassword);
router.get("/me", authenticate, getMe);
router.patch("/me", authenticate, updateProfile);
router.patch("/me/password", authenticate, changePassword);

module.exports = router;
