import { registerSchema, loginSchema } from "../../utils/validators/authValidator.js";
import bcrypt from "bcryptjs";
import prisma from "../../../config/prisma.js";
import { generateToken, verifyToken } from "../../utils/jwt.js";
import { createEmployee } from "../employees/employeesControllers.js";

export const register = async (req, res, next) => {
    try {
        const result = registerSchema.safeParse({
            body: req.body
        });

        if (!result.success) {
            return res.status(400).json({
                message: 'Error de validación',
                errors: result.error.flatten()
            });
        }

        const { confirmPassword, ...employee } = result.data.body;
        req.body = employee;
        return createEmployee(req, res, next);

    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const result = loginSchema.safeParse({
            body: req.body
        });

        if (!result.success) {
            return res.status(400).json({
                message: 'Error de validación',
                errors: result.error.flatten()
            });
        }

        const { email, password } = result.data.body;

        const employee = await prisma.employee.findUnique({
            where: {
                email
            }
        });

        if (!employee || !employee.active) {
            return res.status(401).json({
                message: 'Las credenciales ingresadas no son correctas'
            });
        }

        const isValidPassword = await bcrypt.compare(
            password,
            employee.password
        );

        if (!isValidPassword) {
            return res.status(401).json({
                message: 'Las credenciales ingresadas no son correctas'
            });
        }

        const token = generateToken(employee.id);
        const decodedToken = verifyToken(token);
        const sessionExpiresAt = decodedToken.exp * 1000;

        res.cookie('accessToken', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: Math.max(0, sessionExpiresAt - Date.now()),
            path: '/'
        });

        return res.status(200).json({
            message: 'Inicio de sesión exitoso',
            sessionExpiresAt,
            employee: {
                name: employee.name,
                email: employee.email,
                role: employee.role,
                branchId: employee.branchId
            }
        });

    } catch (error) {
        next(error);
    }
};

export const logout = async (req, res, next) => {
    try {
        res.clearCookie("accessToken", {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            path: "/"
        });

        return res.status(200).json({
            message: "Sesión cerrada correctamente"
        });

    } catch (error) {
        next(error);
    }
};
