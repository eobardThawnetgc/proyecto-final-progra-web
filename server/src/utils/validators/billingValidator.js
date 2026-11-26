import { z } from 'zod';

const quantity = z.string().trim()
    .regex(/^\d{1,9}$/, 'Ingresa una cantidad entera de hasta 9 dígitos')
    .refine((value) => Number(value) > 0, 'La cantidad debe ser mayor que cero');

const customerField = (max) => z.string().trim().max(max).nullable().default(null);

export const invoiceSchema = z.strictObject({
    documentType: z.enum(['CONSUMER', 'CCF']),
    customerName: customerField(160),
    customerNit: customerField(30),
    customerNrc: customerField(30),
    details: z.array(z.strictObject({
        productId: z.number().int().positive().max(2147483647),
        quantity,
    })).min(1, 'Agrega al menos un producto').max(100, 'No puedes agregar más de 100 productos'),
    paymentMethod: z.enum(['CASH', 'CARD', 'DIGITAL', 'BITCOIN', 'CHIVO_WALLET']),
}).superRefine((invoice, context) => {
    if (invoice.documentType === 'CCF') {
        for (const field of ['customerName', 'customerNit', 'customerNrc']) {
            if (!invoice[field]) {
                context.addIssue({
                    code: 'custom',
                    path: [field],
                    message: 'Este dato es obligatorio para emitir un CCF',
                });
            }
        }
    }
});
