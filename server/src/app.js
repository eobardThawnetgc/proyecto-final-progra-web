
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Routers
import authRouter from "./routes/authRouter.js";
import inventoryRouter from "./routes/inventoryRouter.js";
import purchasesRouter from "./routes/purchasesRouter.js";
import employeesRouter from "./routes/employeesRouter.js";
import salesRouter from "./routes/salesRouter.js";
import cashRouter from "./routes/cashRouter.js";
import billingRouter from "./routes/billingRouter.js";
import productsRouter from "./routes/productsRouter.js";
import payrollRouter from "./routes/payrollRouter.js";

// Middlewares
import { errorMiddleware } from "./middleware/errorMiddleware.js";

const app = express();

// Middlewares globales
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Rutas de la API
app.use("/api/auth", authRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/employees", employeesRouter);
app.use("/api/purchases", purchasesRouter);
app.use("/api/sales", salesRouter);
app.use("/api/cash", cashRouter);
app.use("/api/billing", billingRouter);
app.use("/api/products", productsRouter);
app.use("/api/payroll", payrollRouter);

// Health check
app.get("/api/health", (_req, res) =>
    res.status(200).json({
        success: true,
        message: "Servidor funcionando correctamente",
    })
);

// Middleware centralizado de errores
app.use(errorMiddleware);

export default app;
