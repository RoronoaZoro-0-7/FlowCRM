import { Router } from "express";
import isAuth from "../middleware/isAuth";
import {
    addEmployee, updateEmployee,
    deleteEmployee, getEmployees,
    getEmployeeById
} from "../controllers/userController";
import requireRole from "../middleware/isRole";

const router = Router();

router.use(isAuth);

// Only ADMIN users can access these routes
router.use(requireRole("ADMIN", "MANAGER"));
router.get("/", getEmployees);
router.post("/add", addEmployee);
router.get("/:id", getEmployeeById);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

export default router;