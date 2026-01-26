import express from "express";
import isAuth from "../middleware/isAuth";
import {
    setup2FA,
    verify2FA,
    disable2FA,
    get2FAStatus,
    validate2FAToken,
} from "../controllers/twoFactorController";

const router = express.Router();

// Protected routes (require auth)
router.get("/status", isAuth, get2FAStatus);
router.post("/setup", isAuth, setup2FA);
router.post("/verify", isAuth, verify2FA);
router.post("/disable", isAuth, disable2FA);

// Public route for login 2FA verification
router.post("/validate", validate2FAToken);

export default router;
