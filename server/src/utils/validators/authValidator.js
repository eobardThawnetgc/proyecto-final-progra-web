
import { z } from 'zod';

export const registerSchema = z.object({
    body: z.object({
        name: z
            .string()
            .trim()
            .min(3, 'El nombre debe tener al menos 3 caracteres')
            .max(100, 'El nombre no puede superar los 100 caracteres'),

        email: z
            .string()
            .trim()
            .email('Ingrese un correo electrónico válido')
            .max(255, 'El correo no puede superar los 255 caracteres')
            .transform((email) => email.toLowerCase()),

        password: z
            .string()
            .min(8, 'La contraseña debe tener al menos 8 caracteres')
            .max(72, 'La contraseña no puede superar los 72 caracteres'),

        confirmPassword: z
            .string()
            .min(1, 'Debe confirmar su contraseña'),

        branchId: z
            .number()
            .int('El ID de sucursal debe ser un número entero')
            .positive('El ID de sucursal debe ser positivo'),

        role: z
            .enum(['MANAGER', 'CASHIER', 'EMPLOYEE'], {
                error: 'El rol seleccionado no es válido'
            }),

        position: z
            .string()
            .trim()
            .min(2, 'El cargo debe tener al menos 2 caracteres')
            .max(100, 'El cargo no puede superar los 100 caracteres'),

        salary: z
            .number()
            .positive('El salario debe ser mayor que cero')
    }).strict().refine(
        (data) => data.password === data.confirmPassword,
        {
            message: 'Las contraseñas no coinciden',
            path: ['confirmPassword']
        }
    )
});

export const loginSchema = z.object({
    body: z.object({
        email: z
            .string()
            .trim()
            .email('Ingrese un correo electrónico válido')
            .transform((email) => email.toLowerCase()),

        password: z
            .string()
            .min(1, 'La contraseña es obligatoria')
            .max(72, 'La contraseña no puede superar los 72 caracteres')
    }).strict()
});
