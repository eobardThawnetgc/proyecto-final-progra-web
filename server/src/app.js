import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/authRouter.js";

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

// Ruta de comprobación
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Servidor funcionando correctamente",
    });
});

export default app;
