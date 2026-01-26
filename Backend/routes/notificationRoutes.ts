import { Router } from "express";
import { getNotifications, createNotification, markAsRead, markAllAsRead } from "../controllers/notificationController";
import isAuth from "../middleware/isAuth";

const router = Router();

router.use(isAuth);

router.get("/", getNotifications);
router.post("/", createNotification);
router.post("/:id/read", markAsRead);
router.post("/mark-all-read", markAllAsRead);

export default router;
