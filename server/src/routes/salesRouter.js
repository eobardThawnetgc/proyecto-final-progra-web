import { Router } from "express";
import { createSale, getPosProducts, getSales } from "../controllers/sales/salesControllers.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticate);

router.get("/products", getPosProducts);
router.get("/", getSales);
router.post("/", createSale);

export default router;