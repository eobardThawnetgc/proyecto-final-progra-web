import prisma from '../../../config/prisma.js';
import { Prisma } from '../../../prisma/generated/client.ts';
import { idSchema, supplierSchema, purchaseSchema, paymentSchema } from '../../utils/validators/purchasesValidator.js';

const maxTotal = new Prisma.Decimal('9999999999.99');
const maxStock = new Prisma.Decimal('999999999.999');
const purchaseRelations = {
    supplier: { select: { id: true, name: true } },
    branch: { select: { id: true, name: true } },
    details: { orderBy: { id: 'asc' } },
};

const validationError = (res, parsed) => res.status(400).json({
    message: parsed.error.issues[0].message,
    errors: parsed.error.flatten(),
});

const branchScope = (employee) => employee.role === 'ADMIN' ? {} : { branchId: employee.branchId };

const paymentStatus = (paidAmount, total) => {
    if (paidAmount.equals(total)) return 'PAID';
    return paidAmount.isZero() ? 'PENDING' : 'PARTIAL';
};

const withBalance = (purchase) => ({
    ...purchase,
    balance: purchase.total.minus(purchase.paidAmount).toFixed(2),
});

export const getBranches = async (req, res) => {
    const branches = await prisma.branch.findMany({
        where: { id: branchScope(req.employee).branchId },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
    });
    res.json({ branches });
};

export const getSuppliers = async (req, res) => {
    const suppliers = await prisma.supplier.findMany({ orderBy: [{ name: 'asc' }, { id: 'asc' }] });
    res.json({ suppliers });
};

export const createSupplier = async (req, res) => {
    const parsed = supplierSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed);

    const supplier = await prisma.supplier.create({ data: parsed.data });
    res.status(201).json({ supplier });
};

export const updateSupplier = async (req, res, next) => {
    const id = idSchema.safeParse(Number(req.params.id));
    if (!id.success) return res.status(400).json({ message: 'Proveedor inválido' });
    const parsed = supplierSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed);

    try {
        const supplier = await prisma.supplier.update({ where: { id: id.data }, data: parsed.data });
        return res.json({ supplier });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ message: 'Proveedor no encontrado' });
        next(error);
    }
};

export const getPurchases = async (req, res) => {
    const purchases = await prisma.purchase.findMany({
        where: branchScope(req.employee),
        include: purchaseRelations,
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
    });
    res.json({ purchases: purchases.map(withBalance) });
};

export const createPurchase = async (req, res) => {
    const parsed = purchaseSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed);

    const { supplierId, invoiceNumber, date, details } = parsed.data;
    const branchId = parsed.data.branchId ?? req.employee.branchId;
    const scope = branchScope(req.employee);
    if (scope.branchId && branchId !== scope.branchId) {
        return res.status(403).json({ message: 'Solo puedes registrar compras de tu sucursal' });
    }

    const lines = details.map((line) => ({
        ...line,
        subtotal: new Prisma.Decimal(line.quantity).times(line.unitCost).toDecimalPlaces(2),
    }));
    const total = lines.reduce((sum, line) => sum.plus(line.subtotal), new Prisma.Decimal(0));
    const paidAmount = new Prisma.Decimal(parsed.data.paidAmount);
    if (total.isZero() || total.greaterThan(maxTotal)) {
        return res.status(400).json({ message: 'El total de la factura debe ser mayor que cero y no exceder $9,999,999,999.99' });
    }
    if (paidAmount.greaterThan(total)) {
        return res.status(400).json({ message: 'El total abonado no puede exceder el total de la factura' });
    }

    const result = await prisma.$transaction(async (tx) => {
        // Serializa los registros de una sucursal para detectar facturas repetidas antes de incrementar el stock.
        const branches = await tx.$queryRaw`SELECT id FROM "Branch" WHERE id = ${branchId} FOR NO KEY UPDATE`;
        if (!branches.length) return { status: 404, message: 'Sucursal no encontrada' };

        const supplier = await tx.supplier.findUnique({ where: { id: supplierId } });
        if (!supplier) return { status: 404, message: 'Proveedor no encontrado' };

        const existing = await tx.purchase.findFirst({ where: { branchId, supplierId, invoiceNumber } });
        if (existing) return { status: 409, message: 'La factura ya fue registrada para este proveedor y sucursal' };

        const itemIds = [...new Set(lines.map((line) => line.inventoryItemId).filter(Boolean))];
        const items = await tx.inventoryItem.findMany({
            where: { branchId, id: { in: itemIds } },
            select: { id: true, name: true, unit: true },
        });
        if (items.length !== itemIds.length) {
            return { status: 400, message: 'Todos los insumos deben pertenecer al inventario de la sucursal' };
        }

        const itemsById = new Map(items.map((item) => [item.id, item]));
        const stockEntries = new Map();
        const purchaseDetails = lines.map(({ inventoryItemId, description, quantity, ...amounts }) => {
            const item = itemsById.get(inventoryItemId);
            if (item) {
                const current = stockEntries.get(item.id) ?? new Prisma.Decimal(0);
                stockEntries.set(item.id, current.plus(quantity));
            }
            return { inventoryItemId, description: item ? `${item.name} (${item.unit})` : description, quantity, ...amounts };
        });

        const purchase = await tx.purchase.create({
            data: {
                branchId, supplierId, invoiceNumber, total, paidAmount,
                status: paymentStatus(paidAmount, total),
                ...(date && { date: new Date(`${date}T00:00:00.000Z`) }),
                details: { create: purchaseDetails },
            },
            include: purchaseRelations,
        });
        for (const [id, increment] of stockEntries) {
            await tx.inventoryItem.update({
                where: { id, branchId, quantity: { lte: maxStock.minus(increment) } },
                data: { quantity: { increment } },
            });
        }
        return { status: 201, purchase: withBalance(purchase) };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted }).catch((error) => {
        if (error.code === 'P2025' || error.code === 'P2003') {
            return { status: 409, message: 'Un insumo ya no está disponible o la entrada supera el límite de existencias' };
        }
        throw error;
    });

    const { status, ...body } = result;
    return res.status(status).json(body);
};

export const updatePaidAmount = async (req, res, next) => {
    const id = idSchema.safeParse(Number(req.params.id));
    if (!id.success) return res.status(400).json({ message: 'Compra inválida' });
    const parsed = paymentSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed);

    const where = { id: id.data, ...branchScope(req.employee) };
    const purchase = await prisma.purchase.findUnique({ where, include: purchaseRelations });
    if (!purchase) return res.status(404).json({ message: 'Compra no encontrada' });

    const paidAmount = new Prisma.Decimal(parsed.data.paidAmount);
    if (paidAmount.lessThan(purchase.paidAmount) || paidAmount.greaterThan(purchase.total)) {
        return res.status(400).json({ message: 'El nuevo total abonado debe estar entre el monto ya pagado y el total de la factura' });
    }
    if (paidAmount.equals(purchase.paidAmount)) return res.json({ purchase: withBalance(purchase) });

    try {
        const updated = await prisma.purchase.update({
            where: { ...where, paidAmount: purchase.paidAmount },
            data: { paidAmount, status: paymentStatus(paidAmount, purchase.total) },
            include: purchaseRelations,
        });
        return res.json({ purchase: withBalance(updated) });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(409).json({ message: 'La compra cambió. Actualiza el historial antes de registrar el pago' });
        }
        next(error);
    }
};
