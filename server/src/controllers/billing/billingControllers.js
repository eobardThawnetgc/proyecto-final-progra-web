import prisma from '../../../config/prisma.js';
import { Prisma } from '../../../prisma/generated/client.ts';
import { calculateInvoiceAmounts } from '../../utils/billingCalculations.js';
import { invoiceSchema } from '../../utils/validators/billingValidator.js';

const maxTotal = new Prisma.Decimal('9999999999.99');
const invoiceRelations = {
    employee: { select: { id: true, name: true } },
    details: {
        orderBy: { id: 'asc' },
        include: { product: { select: { id: true, name: true } } },
    },
    payments: { orderBy: { id: 'asc' } },
};

const validationError = (res, parsed) => res.status(400).json({
    message: parsed.error.issues[0].message,
    errors: parsed.error.flatten(),
});

const serializeInvoice = (sale) => ({
    ...sale,
    subtotal: sale.subtotal.toFixed(2),
    tax: sale.tax.toFixed(2),
    total: sale.total.toFixed(2),
    details: sale.details.map((detail) => ({
        ...detail,
        quantity: detail.quantity.toString(),
        unitPrice: detail.unitPrice.toFixed(2),
        subtotal: detail.subtotal.toFixed(2),
    })),
    payments: sale.payments.map((payment) => ({
        ...payment,
        amount: payment.amount.toFixed(2),
    })),
});

// GET /api/billing
export const getBillingData = async (req, res, next) => {
    try {
        const [products, sales, branch, cashSession] = await Promise.all([
            prisma.product.findMany({
                where: { branchId: req.employee.branchId, active: true },
                select: { id: true, name: true, price: true },
                orderBy: [{ name: 'asc' }, { id: 'asc' }],
            }),
            prisma.sale.findMany({
                where: { branchId: req.employee.branchId },
                include: invoiceRelations,
                orderBy: [{ date: 'desc' }, { id: 'desc' }],
                take: 100,
            }),
            prisma.branch.findUnique({
                where: { id: req.employee.branchId },
                select: { lastConsumerInvoice: true, lastCcf: true },
            }),
            prisma.cashSession.findFirst({
                where: {
                    employeeId: req.employee.id,
                    branchId: req.employee.branchId,
                    status: 'OPEN',
                },
                select: { id: true },
            }),
        ]);

        return res.json({
            products: products.map((product) => ({ ...product, price: product.price.toFixed(2) })),
            sales: sales.map(serializeInvoice),
            nextNumbers: {
                CONSUMER: (branch?.lastConsumerInvoice ?? 0) + 1,
                CCF: (branch?.lastCcf ?? 0) + 1,
            },
            hasOpenCashSession: Boolean(cashSession),
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/billing
export const createInvoice = async (req, res, next) => {
    const parsed = invoiceSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed);

    try {
        const result = await prisma.$transaction(async (tx) => {
            const branches = await tx.$queryRaw`
                SELECT id, "lastConsumerInvoice", "lastCcf"
                FROM "Branch"
                WHERE id = ${req.employee.branchId}
                FOR NO KEY UPDATE
            `;
            if (!branches.length) return { status: 404, message: 'La sucursal no existe' };

            const cashSession = await tx.cashSession.findFirst({
                where: {
                    employeeId: req.employee.id,
                    branchId: req.employee.branchId,
                    status: 'OPEN',
                },
                select: { id: true },
            });
            if (!cashSession) {
                return { status: 409, message: 'Abre un turno de caja antes de emitir una factura' };
            }
            const activeCashSessions = await tx.$queryRaw`
                SELECT id
                FROM "CashSession"
                WHERE id = ${cashSession.id} AND status = 'OPEN'
                FOR UPDATE
            `;
            if (!activeCashSessions.length) {
                return { status: 409, message: 'El turno de caja ya no está abierto. Actualiza la página' };
            }

            const productIds = [...new Set(parsed.data.details.map((detail) => detail.productId))];
            const products = await tx.product.findMany({
                where: {
                    id: { in: productIds },
                    branchId: req.employee.branchId,
                    active: true,
                },
                include: {
                    recipeItems: { select: { inventoryItemId: true, quantity: true } },
                    inventoryItem: { select: { id: true, name: true, unit: true, quantity: true } },
                },
            });
            if (products.length !== productIds.length) {
                return { status: 400, message: 'Uno o más productos no están disponibles en esta sucursal' };
            }

            const productsById = new Map(products.map((product) => [product.id, product]));
            const { details, subtotal, tax, total } = calculateInvoiceAmounts(parsed.data.details, productsById);
            if (subtotal.isZero() || total.greaterThan(maxTotal)) {
                return { status: 400, message: 'El total debe ser mayor que cero y no exceder $9,999,999,999.99' };
            }

            const branch = branches[0];
            const currentNumber = parsed.data.documentType === 'CCF'
                ? branch.lastCcf
                : branch.lastConsumerInvoice;
            if (currentNumber >= 2147483647) {
                return { status: 409, message: 'Se agotaron los correlativos para este tipo de documento' };
            }
            const documentNumber = currentNumber + 1;
            const counterField = parsed.data.documentType === 'CCF' ? 'lastCcf' : 'lastConsumerInvoice';

            // Agrupa las necesidades para validar y descontar existencias en la misma transacción.
            const requiredStock = new Map();
            for (const requested of parsed.data.details) {
                const product = productsById.get(requested.productId);
                const quantity = new Prisma.Decimal(requested.quantity);
                const lines = product.type === 'PREPARED'
                    ? product.recipeItems.map((line) => ({ id: line.inventoryItemId, quantity: new Prisma.Decimal(line.quantity).times(quantity) }))
                    : product.inventoryItem ? [{ id: product.inventoryItem.id, quantity }] : [];
                if (!lines.length) return { status: 409, message: `El producto ${product.id} no tiene receta o existencia vinculada` };
                for (const line of lines) {
                    const previous = requiredStock.get(line.id);
                    requiredStock.set(line.id, previous ? previous.plus(line.quantity) : line.quantity);
                }
            }

            const inventoryIds = [...requiredStock.keys()].sort((a, b) => a - b);
            if (inventoryIds.length) {
                await tx.$queryRaw`SELECT id FROM "InventoryItem" WHERE id IN (${Prisma.join(inventoryIds)}) ORDER BY id FOR UPDATE`;
            }
            const inventoryItems = await tx.inventoryItem.findMany({
                where: { id: { in: inventoryIds }, branchId: req.employee.branchId },
                select: { id: true, name: true, unit: true, quantity: true },
            });
            const inventoryById = new Map(inventoryItems.map((item) => [item.id, item]));
            const shortages = inventoryIds.filter((id) => !inventoryById.has(id)
                || inventoryById.get(id).quantity.lessThan(requiredStock.get(id))).map((id) => ({
                id,
                name: inventoryById.get(id)?.name ?? 'Insumo no disponible',
                available: inventoryById.get(id)?.quantity.toString() ?? '0',
                required: requiredStock.get(id).toString(),
                unit: inventoryById.get(id)?.unit ?? '',
            }));
            if (shortages.length) return { status: 409, message: 'Existencia insuficiente para completar la venta', shortages };

            const updated = await tx.branch.updateMany({
                where: { id: req.employee.branchId, [counterField]: currentNumber },
                data: { [counterField]: documentNumber },
            });
            if (updated.count !== 1) {
                return { status: 409, message: 'El correlativo cambió. Intenta emitir la factura de nuevo' };
            }

            for (const id of inventoryIds) {
                const { count } = await tx.inventoryItem.updateMany({
                    where: { id, branchId: req.employee.branchId, quantity: { gte: requiredStock.get(id) } },
                    data: { quantity: { decrement: requiredStock.get(id) } },
                });
                if (count !== 1) throw Object.assign(new Error('El inventario cambió durante la venta'), { code: 'STOCK_CHANGED' });
            }

            const sale = await tx.sale.create({
                data: {
                    branchId: req.employee.branchId,
                    employeeId: req.employee.id,
                    cashSessionId: cashSession.id,
                    documentType: parsed.data.documentType,
                    documentNumber,
                    customerName: parsed.data.customerName,
                    customerNit: parsed.data.customerNit,
                    customerNrc: parsed.data.customerNrc,
                    subtotal,
                    tax,
                    total,
                    details: { create: details },
                    payments: {
                        create: { method: parsed.data.paymentMethod, amount: total },
                    },
                },
                include: invoiceRelations,
            });
            return { status: 201, sale };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });

        if (result.message) return res.status(result.status).json({ message: result.message });
        return res.status(result.status).json({
            message: 'Documento emitido correctamente',
            sale: serializeInvoice(result.sale),
        });
    } catch (error) {
        if (error.code === 'P2034' || error.code === 'STOCK_CHANGED') {
            return res.status(409).json({ message: 'El inventario cambió durante la operación. Actualiza e inténtalo de nuevo' });
        }
        next(error);
    }
};
