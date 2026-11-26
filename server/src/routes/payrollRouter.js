
import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

import {
  getPayrollEmployees,
  createPayroll,
  getPayrolls
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

// Solo administradores y gerentes pueden generar planillas.
payrollRouter.post(
  "/",
  authorize("ADMIN", "MANAGER"),
  createPayroll
);

// Permite consultar las planillas registradas.
payrollRouter.get(
  "/",
  authorize("ADMIN", "MANAGER"),
  getPayrolls
);


export default payrollRouter;
