import { z } from 'zod';

const recipeLine = z.object({
    inventoryItemId: z.number().int().positive(),
    quantity: z.number().int('La cantidad debe ser un número entero').positive('La cantidad debe ser mayor que cero').max(100000),
}).strict();

export const listProductsSchema = z.object({
    search: z.string().trim().max(100).optional(),
    type: z.enum(['PREPARED', 'PACKAGED']).optional(),
    active: z.enum(['true', 'false']).optional(),
    branchId: z.coerce.number().int().positive().optional(),
});

const productFields = {
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(500).nullable().optional(),
    type: z.enum(['PREPARED', 'PACKAGED']),
    price: z.number().positive('El precio debe ser mayor que cero').max(100000),
    active: z.boolean().optional(),
    recipe: z.array(recipeLine).max(50).optional().refine(
        (recipe) => !recipe || new Set(recipe.map((line) => line.inventoryItemId)).size === recipe.length,
        { message: 'No repitas el mismo ingrediente en la receta' },
    ),
    inventoryItemId: z.number().int().positive().nullable().optional(),
};

export const createProductSchema = z.object({ ...productFields, branchId: z.number().int().positive().optional() }).strict()
    .refine((data) => data.type !== 'PREPARED' || (data.recipe?.length ?? 0) > 0, {
        message: 'Un producto preparado debe tener al menos un ingrediente', path: ['recipe'],
    })
    .refine((data) => data.type !== 'PACKAGED' || Boolean(data.inventoryItemId), {
        message: 'Vincula el producto con su existencia de inventario', path: ['inventoryItemId'],
    });

export const updateProductSchema = z.object(productFields).strict().refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Envía al menos un campo para actualizar' },
).refine((data) => data.type !== 'PREPARED' || !('inventoryItemId' in data), {
    message: 'Los productos preparados usan receta, no inventario vinculado', path: ['inventoryItemId'],
});

export const consumeProductSchema = z.object({ quantity: z.number().int('La cantidad debe ser un número entero').positive().max(10000) }).strict();
