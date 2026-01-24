import jwt from "jsonwebtoken";
import { Response } from "express";
import prisma from "../config/client";
import crypto from "crypto";

const generateToken = async ( userId:string,role:string,res:Response, orgId:string ) => {
    const accessToken = jwt.sign(
        {userId,role,orgId},
        process.env.JWT_SECRET as string,
        {expiresIn: "7d"});
    const refreshToken = jwt.sign(
        {userId, orgId},
        process.env.REFRESH_TOKEN as string,
        {expiresIn: "7d"});
    
    
    const hashToken = crypto.
                    createHash("sha256").
                    update(refreshToken).
                    digest("hex");
    await prisma.refreshToken.create({
        data:{
            userId,
            tokenHash: hashToken,
            expiresAt: new Date(Date.now() + 7*24*60*60*1000) // 7 days
        }
    });
    res.cookie("refreshToken",refreshToken,{
        httpOnly:true,
        sameSite:"strict",
        maxAge:7*24*60*60*1000
    })
    return accessToken;
}

export default generateToken;