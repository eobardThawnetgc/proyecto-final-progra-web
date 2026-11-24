
import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

import {
  getPayrollEmployees
} from "../controllers/payroll/payrollControllers.js";

const payrollRouter = express.Router();

// Todas las rutas de nómina requieren iniciar sesión.
payrollRouter.use(authenticate);

// Solo administradores y gerentes pueden consultar la planilla.
payrollRouter.get(
  "/employees",
  authorize("ADMIN", "MANAGER"),
  getPayrollEmployees
);

export default payrollRouter;
