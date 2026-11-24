import { z } from 'zod';

const id = z.number().int().positive().max(2147483647);
const name = z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres').max(100);
const email = z.email('Ingresa un correo válido').max(254).transform((value) => value.toLowerCase());
const position = z.string().trim().min(2, 'Ingresa el cargo del empleado').max(100);
const salary = z.number().finite()
    .positive('El salario debe ser mayor que cero')
    .max(99999999.99)
    .refine((value) => Number(value.toFixed(2)) === value, 'El salario debe tener como máximo dos decimales');
const role = z.enum(['MANAGER', 'CASHIER', 'EMPLOYEE']);
const hireDate = z.iso.date('Ingresa una fecha de contratación válida');
const password = z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(72);

export const employeeIdSchema = id;

export const createEmployeeSchema = z.strictObject({
    name,
    email,
    position,
    salary,
    role: role.default('EMPLOYEE'),
    branchId: id.optional(),
    hireDate: hireDate.optional(),
    password,
});

export const updateEmployeeSchema = z.strictObject({
    name: name.optional(),
    email: email.optional(),
    position: position.optional(),
    salary: salary.optional(),
    role: role.optional(),
    branchId: id.optional(),
    hireDate: hireDate.optional(),
    password: password.optional(),
    active: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, 'Debes enviar al menos un campo para actualizar');
