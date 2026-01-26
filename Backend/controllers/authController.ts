import generateToken from "../utils/generateToken";
import { Request, Response } from "express";
import { TryCatch } from "../utils/tryCatch";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import prisma from "../config/client";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/sendEmail";
import { welcomeEmail } from "../utils/emailTemplate";

const register = TryCatch(async (req: Request, res: Response) => {
    const { name, email, password, orgName } = req.body;

    if (!name || !email || !password || !orgName) {
        return res.status(400).json({ message: "All fields are required" });
    }

    // Check existing user
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        return res.status(409).json({ message: "Email already registered" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const org = await prisma.organization.create({
        data: { name: orgName },
    });

    // Create admin user
    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: "ADMIN",
            orgId: org.id,
        },
    });

    // send welcome email
    const emailResult = await sendEmail(
        email,
        "Welcome to FlowCRM",
        welcomeEmail(name, orgName)
    );

    if (!emailResult.success) {
        console.error("Failed to send welcome email:", emailResult.error);
    }

    const accessToken = await generateToken(user.id, user.role, res, org.id);
    res.status(201).json({
        accessToken,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
});

const login = TryCatch(async (req: Request, res: Response) => {
    const { email, password, twoFactorToken } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        return res.status(401).json({ message: "Invalid Credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ message: "Invalid Credentials" });
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
        if (!twoFactorToken) {
            // Return requires2FA flag so frontend can show 2FA input
            return res.status(200).json({
                requires2FA: true,
                userId: user.id,
                message: "2FA verification required"
            });
        }

        // Verify 2FA token
        const speakeasy = require("speakeasy");
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: "base32",
            token: twoFactorToken,
            window: 1,
        });

        if (!verified) {
            return res.status(401).json({ message: "Invalid 2FA code" });
        }
    }

    const accessToken = await generateToken(user.id, user.role, res, user.orgId);
    res.status(200).json({
        accessToken,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
});

const logout = TryCatch(async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ message: "No active session" });
    }

    const tokenHash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

    const session = await prisma.refreshToken.findFirst({
        where: {
            tokenHash,
            userId: req.user.userId,
            revoked: false,
            expiresAt: { gt: new Date() },
        },
    });

    if (!session) {
        return res.status(401).json({ message: "Session already expired" });
    }

    await prisma.refreshToken.update({
        where: { id: session.id },
        data: { revoked: true },
    });

    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });

    res.status(200).json({ message: "Logged out successfully" });
});

const deleteAll = TryCatch(async (req: Request, res: Response) => {
    // Delete all data in proper order to respect foreign key constraints
    await prisma.auditLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.event.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.task.deleteMany();
    await prisma.activity.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();

    res.status(200).json({ message: "All data deleted successfully" });
});

const refreshToken = TryCatch(async (req: Request, res: Response) => {
    const token = req.cookies.refreshToken;
    if (!token) {
        res.status(401).json({ message: "No refresh token found" });
        return;
    }
    let payload: any;
    try {
        payload = jwt.verify(token, process.env.REFRESH_TOKEN as string) as any;
    } catch (error: any) {
        console.log(error.message);
        res.status(401).json({ message: "Invalid refresh Token" });
        return;
    }
    const hash = crypto.createHash("sha256").update(token).digest("hex");

    const session = await prisma.refreshToken.findFirst({
        where: {
            tokenHash: hash,
            revoked: false,
            expiresAt: { gt: new Date() },
        },
    });
    if (!session) {
        res.status(401).json({ message: "Invalid refresh token session" });
        return;
    }

    const user = await prisma.user.findUnique({
        where: { id: payload.userId },
    });

    if (!user) return res.status(401).json({ message: "User not found" });

    const accessToken = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: "15m" }
    );

    res.json({ accessToken });
});



export { register, login, logout, refreshToken, deleteAll };