import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { TryCatch } from "../utils/tryCatch";

const isAuth = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

        req.user = {
            userId: decoded.userId,
            role: decoded.role,
            orgId: decoded.orgId
        };

        next();
    } catch {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
});

export default isAuth;