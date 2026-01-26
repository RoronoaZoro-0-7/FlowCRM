import { Router } from "express";
import { createDeal, getDeals, getDealById, updateDeal, deleteDeal } from "../controllers/dealController";
import isAuth from "../middleware/isAuth";

const router = Router();

router.use(isAuth);

router.post("/", createDeal);
router.get("/", getDeals);
router.get("/:id", getDealById);
router.put("/:id", updateDeal);
router.delete("/:id", deleteDeal);

export default router;
