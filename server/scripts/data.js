import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';

const supplies = [
    { name: 'Café de especialidad', type: 'RAW_MATERIAL', unit: 'g', quantity: 5000, minimumStock: 500 },
    { name: 'Leche entera', type: 'RAW_MATERIAL', unit: 'ml', quantity: 20000, minimumStock: 3000 },
    { name: 'Leche de avena', type: 'RAW_MATERIAL', unit: 'ml', quantity: 10000, minimumStock: 1500 },
    { name: 'Azúcar', type: 'RAW_MATERIAL', unit: 'g', quantity: 3000, minimumStock: 500 },
    { name: 'Chocolate en polvo', type: 'RAW_MATERIAL', unit: 'g', quantity: 1500, minimumStock: 300 },
    { name: 'Canela molida', type: 'RAW_MATERIAL', unit: 'g', quantity: 500, minimumStock: 100 },
    { name: 'Jarabe de vainilla', type: 'RAW_MATERIAL', unit: 'ml', quantity: 2000, minimumStock: 300 },
    { name: 'Té chai', type: 'RAW_MATERIAL', unit: 'g', quantity: 1000, minimumStock: 200 },
    { name: 'Vaso 16oz', type: 'SUPPLY', unit: 'unidad', quantity: 200, minimumStock: 50 },
    { name: 'Tapadera 16oz', type: 'SUPPLY', unit: 'unidad', quantity: 200, minimumStock: 50 },
    { name: 'Vaso 12oz', type: 'SUPPLY', unit: 'unidad', quantity: 200, minimumStock: 50 },
    { name: 'Tapadera 12oz', type: 'SUPPLY', unit: 'unidad', quantity: 200, minimumStock: 50 },
    { name: 'Agua embotellada 600 ml', type: 'PACKAGED', unit: 'unidad', quantity: 120, minimumStock: 24 },
    { name: 'Viñeta', type: 'SUPPLY', unit: 'unidad', quantity: 200, minimumStock: 50 },
];

const preparedMenu = [
    { name: 'Latte clásico', description: 'Espresso suave con leche vaporizada.', price: 3.75, recipe: [['Café de especialidad', 18], ['Leche entera', 250], ['Vaso 16oz', 1], ['Tapadera 16oz', 1], ['Viñeta', 1]] },
    { name: 'Cappuccino', description: 'Espresso, leche y espuma cremosa.', price: 3.5, recipe: [['Café de especialidad', 18], ['Leche entera', 180], ['Vaso 16oz', 1], ['Tapadera 16oz', 1], ['Viñeta', 1]] },
    { name: 'Americano', description: 'Espresso alargado con agua caliente.', price: 2.5, recipe: [['Café de especialidad', 18], ['Vaso 16oz', 1], ['Tapadera 16oz', 1], ['Viñeta', 1]] },
    { name: 'Moka', description: 'Chocolate, espresso y leche vaporizada.', price: 4, recipe: [['Café de especialidad', 18], ['Leche entera', 220], ['Chocolate en polvo', 15], ['Vaso 16oz', 1], ['Tapadera 16oz', 1], ['Viñeta', 1]] },
    { name: 'Chocolate caliente', description: 'Chocolate preparado con leche.', price: 3.25, recipe: [['Leche entera', 250], ['Chocolate en polvo', 25], ['Vaso 16oz', 1], ['Tapadera 16oz', 1], ['Viñeta', 1]] },
    { name: 'Café con leche', description: 'Café de especialidad con leche.', price: 3, recipe: [['Café de especialidad', 18], ['Leche entera', 180], ['Vaso 16oz', 1], ['Tapadera 16oz', 1], ['Viñeta', 1]] },
    { name: 'Latte vainilla', description: 'Latte con un toque dulce.', price: 4, recipe: [['Café de especialidad', 18], ['Leche entera', 250], ['Azúcar', 10], ['Vaso 16oz', 1], ['Tapadera 16oz', 1], ['Viñeta', 1]] },
    { name: 'Latte de chocolate', description: 'Latte con chocolate de la casa.', price: 4.25, recipe: [['Café de especialidad', 18], ['Leche entera', 240], ['Chocolate en polvo', 12], ['Vaso 16oz', 1], ['Tapadera 16oz', 1], ['Viñeta', 1]] },
    { name: 'Doble espresso', description: 'Doble extracción de café de especialidad.', price: 2.75, recipe: [['Café de especialidad', 36], ['Vaso 16oz', 1], ['Tapadera 16oz', 1], ['Viñeta', 1]] },
    { name: 'Café dulce', description: 'Café con leche y azúcar.', price: 3.25, recipe: [['Café de especialidad', 18], ['Leche entera', 150], ['Azúcar', 12], ['Vaso 16oz', 1], ['Tapadera 16oz', 1], ['Viñeta', 1]] },
    { name: 'Moka blanco', description: 'Leche cremosa con espresso y chocolate.', price: 4.25, recipe: [['Café de especialidad', 18], ['Leche entera', 230], ['Chocolate en polvo', 20], ['Vaso 16oz', 1], ['Tapadera 16oz', 1], ['Viñeta', 1]] },
    { name: 'Latte ligero', description: 'Latte con una porción equilibrada de leche.', price: 3.5, recipe: [['Café de especialidad', 18], ['Leche entera', 200], ['Vaso 16oz', 1], ['Tapadera 16oz', 1], ['Viñeta', 1]] },
];

const main = async () => {
    const ensureBranch = async (name, address) => {
        const existing = await prisma.branch.findFirst({ where: { name } });
        return existing ?? prisma.branch.create({ data: { name, address } });
    };

    const branch = await ensureBranch('Sucursal Central', 'San Salvador');
    await ensureBranch('Sucursal San Miguel', 'San Miguel');

    const branches = await prisma.branch.findMany({ orderBy: { id: 'asc' } });

    await prisma.employee.upsert({
        where: { email: 'admin@origenes.sv' },
        update: {},
        create: {
            name: 'Administrador',
            email: 'admin@origenes.sv',
            password: await bcrypt.hash('Admin1234!', 12),
            role: 'ADMIN',
            position: 'Administrador',
            salary: 1000,
            branchId: branch.id
        }
    });

    let insertedSupplyCount = 0;
    for (const currentBranch of branches) {
        for (const item of supplies) {
            const existing = await prisma.inventoryItem.findFirst({
                where: { branchId: currentBranch.id, name: { equals: item.name, mode: 'insensitive' } },
                select: { id: true },
            });
            if (!existing) {
                await prisma.inventoryItem.create({ data: { ...item, branchId: currentBranch.id } });
                insertedSupplyCount += 1;
            }
        }
    }

    for (const currentBranch of branches) {
        const inventory = await prisma.inventoryItem.findMany({ where: { branchId: currentBranch.id } });
        const byName = new Map(inventory.map((item) => [item.name.toLowerCase(), item]));

        for (const menuItem of preparedMenu) {
            const existingProduct = await prisma.product.findFirst({
                where: { branchId: currentBranch.id, name: menuItem.name },
            });
            const product = existingProduct
                ? await prisma.product.update({
                    where: { id: existingProduct.id },
                    data: { description: menuItem.description, type: 'PREPARED', price: menuItem.price, active: true },
                })
                : await prisma.product.create({
                    data: {
                        branchId: currentBranch.id,
                        name: menuItem.name,
                        description: menuItem.description,
                        type: 'PREPARED',
                        price: menuItem.price,
                    },
                });

            await prisma.recipeItem.deleteMany({ where: { productId: product.id } });
            await prisma.recipeItem.createMany({
                data: menuItem.recipe.map(([name, quantity]) => {
                    const ingredient = byName.get(name.toLowerCase());
                    if (!ingredient) throw new Error(`Falta el insumo "${name}" en ${currentBranch.name}`);
                    return { productId: product.id, inventoryItemId: ingredient.id, quantity };
                }),
            });
        }

        const packagedInventory = byName.get('agua embotellada 600 ml');
        if (!packagedInventory) {
            throw new Error(`Falta el inventario de agua embotellada en ${currentBranch.name}`);
        }

        const packagedProduct = await prisma.product.findFirst({
            where: { branchId: currentBranch.id, name: 'Agua embotellada 600 ml' },
        });

        if (!packagedProduct) {
            await prisma.product.create({
                data: {
                    branchId: currentBranch.id,
                    name: 'Agua embotellada 600 ml',
                    description: 'Agua embotellada para reventa.',
                    type: 'PACKAGED',
                    price: 1.25,
                    inventoryItem: { connect: { id: packagedInventory.id } },
                },
            });
        } else {
            const linkedInventory = await prisma.inventoryItem.findFirst({
                where: { productId: packagedProduct.id },
                select: { id: true },
            });

            if (linkedInventory && linkedInventory.id !== packagedInventory.id) {
                await prisma.inventoryItem.update({
                    where: { id: linkedInventory.id },
                    data: { productId: null },
                });
            }

            await prisma.product.update({
                where: { id: packagedProduct.id },
                data: {
                    description: 'Agua embotellada para reventa.',
                    type: 'PACKAGED',
                    price: 1.25,
                    active: true,
                },
            });

            if (packagedInventory.productId !== packagedProduct.id) {
                await prisma.inventoryItem.update({
                    where: { id: packagedInventory.id },
                    data: { productId: packagedProduct.id },
                });
            }
        }
    }

    console.log(`Seed listo: ${insertedSupplyCount} ingredientes/insumos agregados; menú y producto empacado preparados para ${branches.length} sucursal(es).`);
};

main()
    .catch((error) => { console.error(error); process.exit(1); })
    .finally(() => prisma.$disconnect());
