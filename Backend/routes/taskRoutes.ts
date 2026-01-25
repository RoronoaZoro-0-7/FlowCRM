import { Router } from "express";
import isAuth from "../middleware/isAuth";
import {
  createTask,
  getTasks,
  updateTask,
  deleteTask
} from "../controllers/taskController";
import requireRole from "../middleware/isRole";

const router = Router();

router.use(isAuth);

router.use(requireRole("ADMIN","MANAGER"));
router.post("/", createTask);
router.get("/", getTasks);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

export default router;``