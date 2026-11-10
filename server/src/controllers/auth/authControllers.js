import { registerSchema, loginSchema } from "../../utils/validators/authValidator.js";
import bcrypt from "bcryptjs";
import prisma from "../../../config/prisma.js";
import { generateToken } from "../../utils/jwt.js";

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

        const { name, email, password, branchId, role, position, salary } = result.data.body;

        const validateEmail = await prisma.employee.findUnique({
            where: { email: email }
        });

        if (validateEmail) return res.status(409).json({ message: "El correo ingresado ya existe" });

        const SALT_ROUNDS = 12;
        const hashPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const createEmployee = await prisma.employee.create({
            data: {
                name,
                email,
                password: hashPassword,
                branchId,
                role,
                position,
                salary
            }
        })

        return res.status(201).json({
            message: 'Empleado registrado correctamente',
            employee: {
                name: createEmployee.name,
                email: createEmployee.email,
                role: createEmployee.role,
                branchId: createEmployee.branchId
            }
        });

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

        res.cookie('accessToken', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 60 * 60 * 1000,
            path: '/'
        });

        return res.status(200).json({
            message: 'Inicio de sesión exitoso',
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
