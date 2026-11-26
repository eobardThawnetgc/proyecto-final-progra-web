import bcrypt from 'bcryptjs';
import prisma from '../../../config/prisma.js';
import { createEmployeeSchema, employeeIdSchema, updateEmployeeSchema } from '../../utils/validators/employeesValidator.js';

const publicFields = {
    id: true,
    branchId: true,
    name: true,
    email: true,
    role: true,
    position: true,
    salary: true,
    hireDate: true,
    active: true,
    branch: { select: { id: true, name: true } },
};

const isAdmin = (employee) => employee.role === 'ADMIN';
const branchScope = (employee) => isAdmin(employee) ? {} : { branchId: employee.branchId };
const validationError = (res, parsed) => res.status(400).json({
    message: parsed.error.issues[0]?.message ?? 'Los datos enviados no son válidos',
    errors: parsed.error.flatten(),
});

export const getBranches = async (req, res) => {
    const branches = await prisma.branch.findMany({
        where: isAdmin(req.employee) ? {} : { id: req.employee.branchId },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
    });
    return res.json({ branches });
};

export const getEmployees = async (req, res) => {
    const active = req.query.active;
    const activeFilter = active === 'true' ? true : active === 'false' ? false : undefined;
    const employees = await prisma.employee.findMany({
        where: { ...branchScope(req.employee), ...(activeFilter === undefined ? {} : { active: activeFilter }) },
        select: publicFields,
        orderBy: [{ active: 'desc' }, { name: 'asc' }, { id: 'asc' }],
    });
    return res.json({ employees });
};

export const createEmployee = async (req, res, next) => {
    const parsed = createEmployeeSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed);

    const { password, branchId: requestedBranchId, hireDate, ...fields } = parsed.data;
    if (!isAdmin(req.employee) && fields.role === 'MANAGER') {
        return res.status(403).json({ message: 'Solo un administrador puede asignar el rol de gerente' });
    }
    const branchId = isAdmin(req.employee) ? requestedBranchId ?? req.employee.branchId : req.employee.branchId;
    try {
        const branch = await prisma.branch.findUnique({ where: { id: branchId }, select: { id: true } });
        if (!branch) return res.status(404).json({ message: 'La sucursal seleccionada no existe' });
        const employee = await prisma.employee.create({
            data: {
                ...fields,
                branchId,
                password: await bcrypt.hash(password, 12),
                ...(hireDate ? { hireDate: new Date(`${hireDate}T00:00:00.000Z`) } : {}),
            },
            select: publicFields,
        });
        return res.status(201).json({ message: 'Empleado registrado correctamente', employee });
    } catch (error) {
        if (error.code === 'P2002') return res.status(409).json({ message: 'Ya existe un empleado con ese correo' });
        next(error);
    }
};

export const updateEmployee = async (req, res, next) => {
    const parsedId = employeeIdSchema.safeParse(Number(req.params.id));
    if (!parsedId.success) return res.status(400).json({ message: 'ID de empleado inválido' });
    const parsed = updateEmployeeSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed);

    const id = parsedId.data;
    if (id === req.employee.id && parsed.data.active === false) {
        return res.status(400).json({ message: 'No puedes desactivar tu propio usuario' });
    }
    const current = await prisma.employee.findFirst({ where: { id, ...branchScope(req.employee) }, select: { id: true, branchId: true, role: true } });
    if (!current) return res.status(404).json({ message: 'Empleado no encontrado' });
    if (current.role === 'ADMIN') {
        return res.status(403).json({ message: 'Las cuentas de administrador no se modifican desde Recursos Humanos' });
    }

    const { password, branchId: requestedBranchId, hireDate, ...fields } = parsed.data;
    if (!isAdmin(req.employee) && fields.role === 'MANAGER' && current.role !== 'MANAGER') {
        return res.status(403).json({ message: 'Solo un administrador puede asignar el rol de gerente' });
    }
    const branchId = isAdmin(req.employee) ? requestedBranchId : undefined;
    try {
        if (branchId !== undefined) {
            const branch = await prisma.branch.findUnique({ where: { id: branchId }, select: { id: true } });
            if (!branch) return res.status(404).json({ message: 'La sucursal seleccionada no existe' });
        }
        const employee = await prisma.employee.update({
            where: { id },
            data: {
                ...fields,
                ...(branchId === undefined ? {} : { branchId }),
                ...(password ? { password: await bcrypt.hash(password, 12) } : {}),
                ...(hireDate ? { hireDate: new Date(`${hireDate}T00:00:00.000Z`) } : {}),
            },
            select: publicFields,
        });
        return res.json({ message: 'Empleado actualizado correctamente', employee });
    } catch (error) {
        if (error.code === 'P2002') return res.status(409).json({ message: 'Ya existe un empleado con ese correo' });
        next(error);
    }
};
