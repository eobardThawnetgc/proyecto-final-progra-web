import prisma from '../../../config/prisma.js';
import {
    consumeProductSchema, createProductSchema, listProductsSchema, updateProductSchema,
} from '../../utils/validators/productsValidator.js';

const isAdmin = (req) => req.employee.role === 'ADMIN';
const canManageAllBranches = (req) => isAdmin(req);
const branchScope = (req, branchId) => canManageAllBranches(req)
    ? (branchId ? { branchId } : {})
    : { branchId: req.employee.branchId };
const relations = {
    branch: { select: { name: true } },
    recipeItems: { include: { inventoryItem: { select: { id: true, name: true, unit: true, quantity: true, minimumStock: true } } } },
    inventoryItem: { select: { id: true, name: true, unit: true, quantity: true, minimumStock: true } },
};
const serialize = (product) => ({
    ...product,
    price: Number(product.price),
    recipe: product.recipeItems.map(({ inventoryItem, quantity }) => ({
        inventoryItemId: inventoryItem.id,
        name: inventoryItem.name,
        unit: inventoryItem.unit,
        quantity: Number(quantity),
        stock: Number(inventoryItem.quantity),
        minimumStock: Number(inventoryItem.minimumStock),
    })),
    inventoryItem: product.inventoryItem ? {
        ...product.inventoryItem,
        quantity: Number(product.inventoryItem.quantity),
        minimumStock: Number(product.inventoryItem.minimumStock),
    } : null,
});
const validationError = (res, error) => res.status(400).json({
    message: error.issues[0]?.message ?? 'Error de validación', errors: error.flatten(),
});
const parseId = (req) => {
    const id = Number(req.params.id);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
};
const findProduct = (client, req, id) => client.product.findFirst({
    where: { id, ...branchScope(req) }, include: relations,
});

const validateRecipe = async (client, branchId, recipe = []) => {
    if (!recipe.length) return null;
    const ids = [...new Set(recipe.map((line) => line.inventoryItemId))];
    const items = await client.inventoryItem.findMany({ where: { id: { in: ids }, branchId } });
    if (items.length !== ids.length) return 'Todos los ingredientes deben pertenecer a la sucursal del producto';
    if (items.some((item) => item.productId !== null || item.type === 'PACKAGED')) return 'Selecciona ingredientes o insumos, no productos empacados';
    return null;
};

export const getProducts = async (req, res, next) => {
    try {
        const parsed = listProductsSchema.safeParse(req.query);
        if (!parsed.success) return validationError(res, parsed.error);
        const { search, type, active, branchId } = parsed.data;
        const products = await prisma.product.findMany({
            where: {
                ...branchScope(req, branchId),
                ...(search && { name: { contains: search, mode: 'insensitive' } }),
                ...(type && { type }),
                ...(active !== undefined && { active: active === 'true' }),
            },
            include: relations,
            orderBy: [{ active: 'desc' }, { name: 'asc' }],
        });
        return res.json({ total: products.length, products: products.map(serialize) });
    } catch (error) { next(error); }
};

export const getProductOptions = async (req, res, next) => {
    try {
        const inventory = await prisma.inventoryItem.findMany({
            where: { ...branchScope(req), productId: null, type: { in: ['RAW_MATERIAL', 'SUPPLY'] } },
            select: { id: true, branchId: true, name: true, type: true, unit: true, quantity: true, minimumStock: true },
            orderBy: { name: 'asc' },
        });
        const packaged = await prisma.inventoryItem.findMany({
            where: { ...branchScope(req), productId: null, type: 'PACKAGED' },
            select: { id: true, branchId: true, productId: true, name: true, unit: true, quantity: true, minimumStock: true },
            orderBy: { name: 'asc' },
        });
        return res.json({ ingredients: inventory, packagedInventory: packaged });
    } catch (error) { next(error); }
};

export const getProductById = async (req, res, next) => {
    try {
        const id = parseId(req);
        if (!id) return res.status(400).json({ message: 'ID inválido' });
        const product = await findProduct(prisma, req, id);
        if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
        return res.json(serialize(product));
    } catch (error) { next(error); }
};

export const createProduct = async (req, res, next) => {
    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);
    try {
        const { recipe = [], inventoryItemId, branchId: requestedBranchId, ...data } = parsed.data;
        const branchId = isAdmin(req) ? requestedBranchId ?? req.employee.branchId : req.employee.branchId;
        const branch = await prisma.branch.findUnique({ where: { id: branchId }, select: { id: true } });
        if (!branch) return res.status(404).json({ message: 'La sucursal no existe' });
        const duplicate = await prisma.product.findFirst({ where: { branchId, name: { equals: data.name, mode: 'insensitive' } } });
        if (duplicate) return res.status(409).json({ message: 'Ya existe un producto con ese nombre en la sucursal' });
        const recipeError = await validateRecipe(prisma, branchId, recipe);
        if (recipeError) return res.status(400).json({ message: recipeError });
        if (inventoryItemId) {
            const item = await prisma.inventoryItem.findFirst({ where: { id: inventoryItemId, branchId, type: 'PACKAGED', productId: null } });
            if (!item) return res.status(400).json({ message: 'El inventario seleccionado no está disponible en esta sucursal' });
        }
        const product = await prisma.$transaction(async (tx) => {
            const created = await tx.product.create({
                data: {
                    ...data, branchId,
                    ...(data.type === 'PREPARED' && { recipeItems: { create: recipe } }),
                },
                include: relations,
            });
            if (data.type !== 'PACKAGED') return created;
            await tx.inventoryItem.update({
                where: { id: inventoryItemId, branchId, type: 'PACKAGED', AND: { productId: null } },
                data: { productId: created.id },
            });
            return tx.product.findUniqueOrThrow({ where: { id: created.id }, include: relations });
        });
        return res.status(201).json({ message: 'Producto creado correctamente', product: serialize(product) });
    } catch (error) {
        if (error.code === 'P2002' || error.code === 'P2025') return res.status(409).json({ message: 'El inventario ya está vinculado a otro producto' });
        next(error);
    }
};

export const updateProduct = async (req, res, next) => {
    const id = parseId(req);
    if (!id) return res.status(400).json({ message: 'ID inválido' });
    const parsed = updateProductSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);
    try {
        const current = await findProduct(prisma, req, id);
        if (!current) return res.status(404).json({ message: 'Producto no encontrado' });
        const data = parsed.data;
        if (data.name && await prisma.product.findFirst({
            where: { branchId: current.branchId, name: { equals: data.name, mode: 'insensitive' }, id: { not: id } },
        })) return res.status(409).json({ message: 'Ya existe un producto con ese nombre en la sucursal' });

        if (data.type === undefined && data.recipe === undefined && data.inventoryItemId === undefined) {
            const product = await prisma.product.update({ where: { id }, data, include: relations });
            return res.json({ message: 'Producto actualizado correctamente', product: serialize(product) });
        }
        const resultingType = data.type ?? current.type;
        const resultingRecipe = data.recipe ?? current.recipeItems.map((line) => ({
            inventoryItemId: line.inventoryItemId, quantity: Number(line.quantity),
        }));
        if (resultingType === 'PREPARED' && !resultingRecipe.length) return res.status(400).json({ message: 'Un producto preparado debe tener ingredientes' });
        const recipeError = await validateRecipe(prisma, current.branchId, resultingType === 'PREPARED' ? resultingRecipe : []);
        if (recipeError) return res.status(400).json({ message: recipeError });

        const inventoryItemId = data.inventoryItemId ?? (resultingType === 'PACKAGED' ? current.inventoryItem?.id : null);
        if (resultingType === 'PACKAGED' && !inventoryItemId) return res.status(400).json({ message: 'Vincula el producto con su existencia de inventario' });
        if (inventoryItemId) {
            const item = await prisma.inventoryItem.findFirst({ where: { id: inventoryItemId, branchId: current.branchId, type: 'PACKAGED', OR: [{ productId: null }, { productId: id }] } });
            if (!item) return res.status(400).json({ message: 'El inventario seleccionado no está disponible en esta sucursal' });
        }
        const { recipe, inventoryItemId: ignoredInventoryId, ...fields } = data;
        const product = await prisma.$transaction(async (tx) => {
            await tx.recipeItem.deleteMany({ where: { productId: id } });
            if (resultingType === 'PREPARED') await tx.recipeItem.createMany({ data: resultingRecipe.map((line) => ({ ...line, productId: id })) });
            if (resultingType === 'PACKAGED' && inventoryItemId !== current.inventoryItem?.id) {
                if (current.inventoryItem) await tx.inventoryItem.update({ where: { id: current.inventoryItem.id }, data: { productId: null } });
                await tx.inventoryItem.update({ where: { id: inventoryItemId, branchId: current.branchId, type: 'PACKAGED', AND: { productId: null } }, data: { productId: id } });
            } else if (resultingType === 'PREPARED' && current.inventoryItem) {
                await tx.inventoryItem.update({ where: { id: current.inventoryItem.id }, data: { productId: null } });
            }
            return tx.product.update({
                where: { id }, data: { ...fields, type: resultingType }, include: relations,
            });
        });
        return res.json({ message: 'Producto actualizado correctamente', product: serialize(product) });
    } catch (error) {
        if (error.code === 'P2002' || error.code === 'P2025') return res.status(409).json({ message: 'El inventario ya está vinculado a otro producto' });
        next(error);
    }
};

export const consumeProduct = async (req, res, next) => {
    const id = parseId(req);
    if (!id) return res.status(400).json({ message: 'ID inválido' });
    const parsed = consumeProductSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);
    try {
        const result = await prisma.$transaction(async (tx) => {
            const product = await tx.product.findFirst({ where: { id, active: true, ...branchScope(req) }, include: relations });
            if (!product) return { status: 404, message: 'Producto activo no encontrado en esta sucursal' };
            const { quantity } = parsed.data;
            const lines = product.type === 'PREPARED'
                ? product.recipeItems.map((line) => ({ item: line.inventoryItem, required: Number(line.quantity) * quantity }))
                : product.inventoryItem ? [{ item: product.inventoryItem, required: quantity }] : [];
            if (!lines.length) return { status: 409, message: 'El producto no tiene receta o inventario vinculado' };
            const shortages = lines.filter(({ item, required }) => Number(item.quantity) < required).map(({ item, required }) => ({
                id: item.id, name: item.name, available: Number(item.quantity), required, unit: item.unit,
            }));
            if (shortages.length) return { status: 409, message: 'Existencia insuficiente para completar el consumo', shortages };
            for (const { item, required } of lines) {
                const { count } = await tx.inventoryItem.updateMany({ where: { id: item.id, quantity: { gte: required } }, data: { quantity: { decrement: required } } });
                if (count !== 1) throw Object.assign(new Error('El stock cambió durante la operación; vuelve a intentarlo'), { status: 409 });
            }
            const remaining = await tx.inventoryItem.findMany({ where: { id: { in: lines.map(({ item }) => item.id) } } });
            return { status: 200, consumed: lines.map(({ item, required }) => {
                const updated = remaining.find((entry) => entry.id === item.id);
                return { inventoryItemId: item.id, name: item.name, quantity: required, unit: item.unit, remaining: Number(updated.quantity), lowStock: Number(updated.quantity) <= Number(updated.minimumStock) };
            }) };
        }, { isolationLevel: 'Serializable' });
        if (result.message) return res.status(result.status).json(result);
        return res.json({ message: 'Consumo registrado y existencias actualizadas', productId: id, quantity: parsed.data.quantity, consumed: result.consumed });
    } catch (error) {
        if (error.code === 'P2034' || error.status === 409) {
            return res.status(409).json({ message: 'El stock cambió durante la operación; actualiza e inténtalo de nuevo' });
        }
        next(error);
    }
};

export const deactivateProduct = async (req, res, next) => {
    const id = parseId(req);
    if (!id) return res.status(400).json({ message: 'ID inválido' });
    try {
        const current = await findProduct(prisma, req, id);
        if (!current) return res.status(404).json({ message: 'Producto no encontrado' });
        const product = await prisma.product.update({ where: { id }, data: { active: false }, include: relations });
        return res.json({ message: 'Producto retirado del menú', product: serialize(product) });
    } catch (error) { next(error); }
};
