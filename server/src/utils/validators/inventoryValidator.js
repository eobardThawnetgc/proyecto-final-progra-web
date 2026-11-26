import { z } from 'zod';

const typeEnum = z.enum(['RAW_MATERIAL', 'SUPPLY', 'PACKAGED'], {
    error: 'El tipo de inventario no es válido'
});

export const listQuerySchema = z.object({
    search: z.string().trim().max(100).optional(),
    type: typeEnum.optional(),
    lowStock: z.enum(['true', 'false']).optional(),
    branchId: z.coerce.number().int().positive().max(2147483647).optional()
});

export const createItemSchema = z.object({
    body: z.object({
        name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
        type: typeEnum,
        unit: z.string().trim().min(1, 'La unidad es obligatoria').max(20),
        quantity: z.number('La cantidad debe ser un número').int('La existencia debe ser un número entero').min(0, 'La cantidad no puede ser negativa').max(999999999).default(0),
        minimumStock: z.number('El stock mínimo debe ser un número').int('El stock mínimo debe ser un número entero').min(0, 'El stock mínimo no puede ser negativo').max(999999999).default(0),
        productId: z.number().int().positive().max(2147483647).nullable().optional(),
        branchId: z.number().int().positive().max(2147483647).optional()
    }).strict()
});

// La cantidad NO se edita aquí: se cambia solo con el ajuste de stock.
export const updateItemSchema = z.object({
    body: z.object({
        name: z.string().trim().min(2).max(100),
        type: typeEnum,
        unit: z.string().trim().min(1).max(20),
        minimumStock: z.number().int('El stock mínimo debe ser un número entero').min(0).max(999999999),
        productId: z.number().int().positive().max(2147483647).nullable()
    }).partial().strict().refine(
        (data) => Object.keys(data).length > 0,
        { message: 'Debe enviar al menos un campo para actualizar' }
    )
});

export const adjustStockSchema = z.object({
    body: z.object({
        operation: z.enum(['INCREMENT', 'DECREMENT', 'SET'], {
            error: 'La operación debe ser INCREMENT, DECREMENT o SET'
        }),
        amount: z.number('La cantidad debe ser un número').int('La cantidad debe ser un número entero').min(0, 'La cantidad no puede ser negativa').max(999999999)
    }).strict().refine(
        (data) => data.operation === 'SET' || data.amount > 0,
        { message: 'La cantidad debe ser mayor que cero', path: ['amount'] }
    )
});
