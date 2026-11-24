import { Router } from "express";
import { createSale, getSales } from "../controllers/sales/salesControllers.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getSales);
router.post("/", createSale);

export default router;