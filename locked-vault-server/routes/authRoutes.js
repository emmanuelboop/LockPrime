const express = require("express");
const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

const {
    register,
    login,
    getMe,
    updateProfile,
    changePassword,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getMe);
router.patch("/me", authenticate, updateProfile);
router.patch("/me/password", authenticate, changePassword);

module.exports = router;
