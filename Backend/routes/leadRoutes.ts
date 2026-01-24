import { Router } from "express";
import { createLead, getLeads, getLeadById, updateLead, deleteLead } from "../controllers/leadController";
import isAuth from "../middleware/isAuth";

const router = Router();

// All lead routes require authentication
router.use(isAuth);

router.post("/", createLead);
router.get("/", getLeads);
router.get("/:id", getLeadById);
router.put("/:id", updateLead);
router.delete("/:id", deleteLead);

export default router;
