import { z } from 'zod';

export const idSchema = z.number().int().positive().max(2147483647);
const money = z.string().trim().regex(/^\d{1,10}(\.\d{1,2})?$/, 'Ingresa un monto válido en dólares');
const quantity = z.string().trim()
    .regex(/^\d{1,9}(?:\.0{1,3})?$/, 'Ingresa una cantidad entera de hasta nueve dígitos')
    .refine((value) => Number(value) > 0, 'La cantidad debe ser mayor que cero');
const contact = (max) => z.string().trim().max(max).nullable().default(null);

export const supplierSchema = z.strictObject({
    name: z.string().trim().min(2, 'Ingresa el nombre del proveedor').max(120),
    phone: contact(40),
    email: z.email('Ingresa un correo válido').max(254).nullable().default(null),
    address: contact(250),
});

const lineFields = {
    quantity,
    unitCost: z.string().trim().regex(/^\d{1,8}(\.\d{1,6})?$/, 'Ingresa un costo unitario con hasta seis decimales'),
};

export const purchaseSchema = z.strictObject({
    branchId: idSchema.optional(),
    supplierId: idSchema,
    invoiceNumber: z.string().trim().min(1, 'Ingresa el número de factura').max(100),
    date: z.iso.date('Ingresa una fecha válida').optional(),
    paidAmount: money.default('0'),
    details: z.array(z.union([
        z.strictObject({ ...lineFields, inventoryItemId: idSchema, expectedUnit: z.string().min(1).max(20).optional() }),
        z.strictObject({ ...lineFields, description: z.string().trim().min(1, 'Describe el gasto').max(200) }),
    ])).min(1, 'Agrega al menos un renglón').max(100),
});

export const paymentSchema = z.strictObject({ paidAmount: money });
export const expectedPaidAmountSchema = money.optional();
export const reversalSchema = z.strictObject({ reason: z.string().trim().min(1, 'Escribe el motivo de la reversión').max(250) });
