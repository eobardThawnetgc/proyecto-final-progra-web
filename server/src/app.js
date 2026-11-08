import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

// Ruta de comprobación
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Servidor funcionando correctamente",
    });
});

export default app;