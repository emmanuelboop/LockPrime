const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");
const jwt = require("jsonwebtoken");
const {
    hashResetToken,
    generateResetToken,
    buildResetUrl,
    getResetTokenExpiry,
} = require("../utils/passwordReset");
const { sendPasswordResetEmail } = require("../services/emailService");

const PASSWORD_RESET_RESPONSE =
    "If an account exists for that email, a reset link has been sent.";

const MIN_PASSWORD_LENGTH = 6;

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await prisma.user.findUnique({
            where: {
                email,
            },
        });

        if (existingUser) {
            return res.status(400).json({
                message: "Email already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        res.status(201).json({
            message: "User created successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Server error",
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({
            where: {
                email,
            },
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid credentials",
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid credentials",
            });
        }

        const token = jwt.sign(
            {
                userId: user.id,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Server error",
        });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: req.user.userId,
            },
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Server error",
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { name, email } = req.body;

        if (typeof name !== "string" || name.trim() === "") {
            return res.status(400).json({
                message: "Name is required",
            });
        }

        if (typeof email !== "string" || email.trim() === "") {
            return res.status(400).json({
                message: "Email is required",
            });
        }

        const trimmedName = name.trim();
        const trimmedEmail = email.trim().toLowerCase();

        const existingUser = await prisma.user.findUnique({
            where: {
                email: trimmedEmail,
            },
        });

        if (existingUser && existingUser.id !== req.user.userId) {
            return res.status(400).json({
                message: "Email already exists",
            });
        }

        const user = await prisma.user.update({
            where: {
                id: req.user.userId,
            },
            data: {
                name: trimmedName,
                email: trimmedEmail,
            },
        });

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Server error",
        });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: "Current and new password are required",
            });
        }

        if (newPassword.length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json({
                message: "New password must be at least 6 characters",
            });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: req.user.userId,
            },
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        const isMatch = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!isMatch) {
            return res.status(400).json({
                message: "Current password is incorrect",
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                password: hashedPassword,
            },
        });

        res.json({
            message: "Password updated successfully",
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Server error",
        });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (typeof email !== "string" || email.trim() === "") {
            return res.status(400).json({
                message: "Email is required",
            });
        }

        const trimmedEmail = email.trim().toLowerCase();

        const user = await prisma.user.findFirst({
            where: {
                email: {
                    equals: trimmedEmail,
                    mode: "insensitive",
                },
            },
        });

        if (user) {
            const rawToken = generateResetToken();
            const tokenHash = hashResetToken(rawToken);

            await prisma.passwordResetToken.deleteMany({
                where: {
                    userId: user.id,
                },
            });

            await prisma.passwordResetToken.create({
                data: {
                    tokenHash,
                    expiresAt: getResetTokenExpiry(),
                    userId: user.id,
                },
            });

            const resetUrl = buildResetUrl(rawToken);

            try {
                await sendPasswordResetEmail({
                    to: user.email,
                    resetUrl,
                    userName: user.name,
                });
            } catch (emailError) {
                console.error(
                    "[LockPrime] Failed to send password reset email:",
                    emailError
                );
            }

            const responseBody = {
                message: PASSWORD_RESET_RESPONSE,
            };

            if (process.env.RETURN_PASSWORD_RESET_TOKEN === "true") {
                responseBody.resetToken = rawToken;
            }

            return res.json(responseBody);
        }

        res.json({
            message: PASSWORD_RESET_RESPONSE,
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Server error",
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({
                message: "Token and password are required",
            });
        }

        if (password.length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json({
                message: "Password must be at least 6 characters",
            });
        }

        const tokenHash = hashResetToken(token);

        const resetToken = await prisma.passwordResetToken.findUnique({
            where: {
                tokenHash,
            },
            include: {
                user: true,
            },
        });

        if (!resetToken || resetToken.expiresAt <= new Date()) {
            return res.status(400).json({
                message: "Invalid or expired reset link",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.$transaction([
            prisma.user.update({
                where: {
                    id: resetToken.userId,
                },
                data: {
                    password: hashedPassword,
                },
            }),
            prisma.passwordResetToken.deleteMany({
                where: {
                    userId: resetToken.userId,
                },
            }),
        ]);

        res.json({
            message: "Password reset successfully",
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Server error",
        });
    }
};

module.exports = {
    register,
    login,
    getMe,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
};