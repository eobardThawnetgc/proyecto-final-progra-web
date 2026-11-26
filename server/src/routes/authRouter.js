import express from "express";
import { register, login, logout } from "../controllers/auth/authControllers.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const authRouter = express.Router();

//ruta protegida de prueba usando el middleware
authRouter.get("/me", authenticate, (req, res) => {
    return res.status(200).json({
        message: "Usuario autenticado correctamente",
        employee: req.employee,
        sessionExpiresAt: req.sessionExpiresAt
    });
});

authRouter.post("/register", authenticate, authorize("ADMIN", "MANAGER"), register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);



export default authRouter;
