
import prisma from "../../config/prisma.js";
import { verifyToken } from "../utils/jwt.js";
import jwt from "jsonwebtoken";

export const authenticate = async (req, res, next) => {
    try {
        // Obtener el token desde la cookie
        const token = req.cookies?.accessToken;

        if (!token) {
            return res.status(401).json({
                message: "No has iniciado sesión"
            });
        }

        // Verificar la validez del JWT
        let decoded;

        try {
            decoded = verifyToken(token);
        } catch (error) {
            if (
                error instanceof jwt.JsonWebTokenError ||
                error instanceof jwt.TokenExpiredError
            ) {
                return res.status(401).json({
                    message: "La sesión no es válida o ha expirado"
                });
            }

            throw error;
        }

        // Obtener el ID del empleado desde el subject del JWT
        const employeeId = Number(decoded.sub);

        if (!Number.isSafeInteger(employeeId) || employeeId <= 0) {
            return res.status(401).json({
                message: "Token inválido"
            });
        }

        // Consultar al empleado
        const employee = await prisma.employee.findUnique({
            where: {
                id: employeeId
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                branchId: true,
                active: true
            }
        });

        if (!employee || !employee.active) {
            return res.status(401).json({
                message: "El usuario no existe o está inactivo"
            });
        }

        // Guardar los datos del empleado para los siguientes middlewares
        req.employee = employee;

        next();

    } catch (error) {
        next(error);
    }
};
