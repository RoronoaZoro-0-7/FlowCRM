import { Request, Response } from "express";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import prisma from "../config/client";
import { TryCatch } from "../utils/tryCatch";

// Generate 2FA secret and QR code
const setup2FA = TryCatch(async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { email: true, twoFactorEnabled: true },
    });

    if (!user) return res.status(404).json({ message: "User not found" });
    
    if (user.twoFactorEnabled) {
        return res.status(400).json({ message: "2FA is already enabled" });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
        name: `FlowCRM (${user.email})`,
        length: 20,
    });

    // Store secret temporarily (not enabled yet until verified)
    await prisma.user.update({
        where: { id: req.user.userId },
        data: { twoFactorSecret: secret.base32 },
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    res.json({
        secret: secret.base32,
        qrCode: qrCodeUrl,
    });
});

// Verify and enable 2FA
const verify2FA = TryCatch(async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ message: "Verification token is required" });
    }

    const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user) return res.status(404).json({ message: "User not found" });
    
    if (!user.twoFactorSecret) {
        return res.status(400).json({ message: "Please setup 2FA first" });
    }

    if (user.twoFactorEnabled) {
        return res.status(400).json({ message: "2FA is already enabled" });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token,
        window: 1, // Allow 1 step before/after for clock drift
    });

    if (!verified) {
        return res.status(400).json({ message: "Invalid verification code" });
    }

    // Enable 2FA
    await prisma.user.update({
        where: { id: req.user.userId },
        data: { twoFactorEnabled: true },
    });

    res.json({ message: "2FA enabled successfully" });
});

// Disable 2FA
const disable2FA = TryCatch(async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
    }

    const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
    });

    if (!user) return res.status(404).json({ message: "User not found" });
    
    if (!user.twoFactorEnabled) {
        return res.status(400).json({ message: "2FA is not enabled" });
    }

    // Verify password
    const bcrypt = require("bcrypt");
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
        return res.status(400).json({ message: "Invalid password" });
    }

    // Verify 2FA token
    const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret!,
        encoding: "base32",
        token,
        window: 1,
    });

    if (!verified) {
        return res.status(400).json({ message: "Invalid 2FA code" });
    }

    // Disable 2FA
    await prisma.user.update({
        where: { id: req.user.userId },
        data: {
            twoFactorEnabled: false,
            twoFactorSecret: null,
        },
    });

    res.json({ message: "2FA disabled successfully" });
});

// Get 2FA status
const get2FAStatus = TryCatch(async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { twoFactorEnabled: true },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ enabled: user.twoFactorEnabled });
});

// Validate 2FA token during login
const validate2FAToken = TryCatch(async (req: Request, res: Response) => {
    const { userId, token } = req.body;

    if (!userId || !token) {
        return res.status(400).json({ message: "UserId and token are required" });
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user) return res.status(404).json({ message: "User not found" });
    
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
        return res.status(400).json({ message: "2FA is not enabled for this user" });
    }

    const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token,
        window: 1,
    });

    if (!verified) {
        return res.status(400).json({ message: "Invalid 2FA code" });
    }

    res.json({ valid: true });
});

export { setup2FA, verify2FA, disable2FA, get2FAStatus, validate2FAToken };
