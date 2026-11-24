import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/authRouter.js";
import inventoryRouter from "./routes/inventoryRouter.js";
import purchasesRouter from "./routes/purchasesRouter.js";
import employeesRouter from "./routes/employeesRouter.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";

const app = express();

// Configuración de CORS
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));

// Middlewares globales
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/purchases", purchasesRouter);
app.use("/api/employees", employeesRouter);

// Ruta de comprobación
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Servidor funcionando correctamente",
    });
});

app.use(errorMiddleware);

export default app;
