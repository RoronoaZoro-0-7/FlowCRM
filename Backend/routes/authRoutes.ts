import { Router } from "express";
import { register, login, logout, refreshToken, deleteAll } from "../controllers/authController";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.delete("/delete-all", deleteAll);

export default router;  