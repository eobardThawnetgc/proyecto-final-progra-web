import prisma from '../../../config/prisma.js';
import {
    listQuerySchema,
    createItemSchema,
    updateItemSchema,
    adjustStockSchema
} from '../../utils/validators/inventoryValidator.js';

const isAdmin = (req) => req.employee.role === 'ADMIN';

// ADMIN ve todas las sucursales (o filtra por una); el resto solo la suya.
const branchScope = (req, requestedBranchId) => {
    if (!isAdmin(req)) return { branchId: req.employee.branchId };
    return requestedBranchId ? { branchId: requestedBranchId } : {};
};

const validationError = (res, error) =>
    res.status(400).json({ message: 'Error de validación', errors: error.flatten() });

const parseId = (req) => {
    const id = Number(req.params.id);
    return Number.isInteger(id) && id > 0 ? id : null;
};

// Convierte Decimal a number y calcula el estado del stock.
const serialize = (item) => {
    const quantity = Number(item.quantity);
    const minimumStock = Number(item.minimumStock);

    let status = 'OK';
    if (quantity <= 0) status = 'OUT';
    else if (quantity <= minimumStock) status = 'LOW';

    return { ...item, quantity, minimumStock, status };
};

const findScopedItem = (req, id) =>
    prisma.inventoryItem.findFirst({ where: { id, ...branchScope(req) } });

const nameExists = (branchId, name, excludeId) =>
    prisma.inventoryItem.findFirst({
        where: {
            branchId,
            name: { equals: name, mode: 'insensitive' },
            ...(excludeId && { id: { not: excludeId } })
        }
    });

// GET /api/inventory?search=&type=&lowStock=true
export const getItems = async (req, res, next) => {
    try {
        const parsed = listQuerySchema.safeParse(req.query);
        if (!parsed.success) return validationError(res, parsed.error);

        const { search, type, lowStock, branchId } = parsed.data;

        const items = await prisma.inventoryItem.findMany({
            where: {
                ...branchScope(req, branchId),
                ...(search && { name: { contains: search, mode: 'insensitive' } }),
                ...(type && { type })
            },
            orderBy: { name: 'asc' }
        });

        let result = items.map(serialize);
        if (lowStock === 'true') {
            result = result.filter((item) => item.status !== 'OK');
        }

        return res.status(200).json({ total: result.length, items: result });
    } catch (error) {
        next(error);
    }
};

// GET /api/inventory/alerts
export const getStockAlerts = async (req, res, next) => {
    try {
        const items = await prisma.inventoryItem.findMany({
            where: branchScope(req),
            orderBy: { name: 'asc' }
        });

        const alerts = items.map(serialize).filter((item) => item.status !== 'OK');

        return res.status(200).json({ total: alerts.length, items: alerts });
    } catch (error) {
        next(error);
    }
};

// GET /api/inventory/:id
export const getItemById = async (req, res, next) => {
    try {
        const id = parseId(req);
        if (!id) return res.status(400).json({ message: 'ID inválido' });

        const item = await findScopedItem(req, id);
        if (!item) return res.status(404).json({ message: 'Insumo no encontrado' });

        return res.status(200).json(serialize(item));
    } catch (error) {
        next(error);
    }
};

// POST /api/inventory
export const createItem = async (req, res, next) => {
    try {
        const parsed = createItemSchema.safeParse({ body: req.body });
        if (!parsed.success) return validationError(res, parsed.error);

        const { branchId: requestedBranchId, ...data } = parsed.data.body;
        const branchId = isAdmin(req)
            ? requestedBranchId ?? req.employee.branchId
            : req.employee.branchId;

        const branch = await prisma.branch.findUnique({ where: { id: branchId } });
        if (!branch) return res.status(404).json({ message: 'La sucursal no existe' });

        if (await nameExists(branchId, data.name)) {
            return res.status(409).json({ message: 'Ya existe un insumo con ese nombre en la sucursal' });
        }

        const item = await prisma.inventoryItem.create({ data: { ...data, branchId } });

        return res.status(201).json({
            message: 'Insumo registrado correctamente',
            item: serialize(item)
        });
    } catch (error) {
        // P2002: productId ya vinculado a otro insumo (campo @unique)
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'Ese producto ya está vinculado a otro insumo' });
        }
        next(error);
    }
};

// PATCH /api/inventory/:id
export const updateItem = async (req, res, next) => {
    try {
        const id = parseId(req);
        if (!id) return res.status(400).json({ message: 'ID inválido' });

        const parsed = updateItemSchema.safeParse({ body: req.body });
        if (!parsed.success) return validationError(res, parsed.error);

        const current = await findScopedItem(req, id);
        if (!current) return res.status(404).json({ message: 'Insumo no encontrado' });

        const data = parsed.data.body;

        if (data.name && await nameExists(current.branchId, data.name, id)) {
            return res.status(409).json({ message: 'Ya existe un insumo con ese nombre en la sucursal' });
        }

        const item = await prisma.inventoryItem.update({ where: { id }, data });

        return res.status(200).json({
            message: 'Insumo actualizado correctamente',
            item: serialize(item)
        });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'Ese producto ya está vinculado a otro insumo' });
        }
        next(error);
    }
};

// PATCH /api/inventory/:id/stock  { operation, amount }
export const adjustStock = async (req, res, next) => {
    try {
        const id = parseId(req);
        if (!id) return res.status(400).json({ message: 'ID inválido' });

        const parsed = adjustStockSchema.safeParse({ body: req.body });
        if (!parsed.success) return validationError(res, parsed.error);

        const current = await findScopedItem(req, id);
        if (!current) return res.status(404).json({ message: 'Insumo no encontrado' });

        const { operation, amount } = parsed.data.body;
        let updated;

        if (operation === 'SET') {
            updated = await prisma.inventoryItem.update({
                where: { id },
                data: { quantity: amount }
            });
        } else if (operation === 'INCREMENT') {
            updated = await prisma.inventoryItem.update({
                where: { id },
                data: { quantity: { increment: amount } }
            });
        } else {
            // Descuento atómico: solo se aplica si alcanza el stock.
            const { count } = await prisma.inventoryItem.updateMany({
                where: { id, quantity: { gte: amount } },
                data: { quantity: { decrement: amount } }
            });

            if (count === 0) {
                return res.status(409).json({ message: 'Stock insuficiente para realizar la salida' });
            }
            updated = await prisma.inventoryItem.findUnique({ where: { id } });
        }

        const item = serialize(updated);

        return res.status(200).json({
            message: 'Stock actualizado correctamente',
            alert: item.status !== 'OK',
            item
        });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/inventory/:id
export const deleteItem = async (req, res, next) => {
    try {
        const id = parseId(req);
        if (!id) return res.status(400).json({ message: 'ID inválido' });

        const current = await findScopedItem(req, id);
        if (!current) return res.status(404).json({ message: 'Insumo no encontrado' });

        const recipes = await prisma.recipeItem.count({ where: { inventoryItemId: id } });
        if (recipes > 0) {
            return res.status(409).json({
                message: `No se puede eliminar: el insumo se usa en ${recipes} receta(s)`
            });
        }

        await prisma.inventoryItem.delete({ where: { id } });

        return res.status(200).json({ message: 'Insumo eliminado correctamente' });
    } catch (error) {
        next(error);
    }
};