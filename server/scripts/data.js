import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
import { prepararPlanillaQuincenal } from '../src/services/payroll/payrollService.js';

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

const seedOperationalData = async (branch) => {
    const password = await bcrypt.hash('Demo1234!', 12);
    const employees = {};
    const isCentral = branch.name === 'Sucursal Central';
    const staff = [
        { key: 'manager', name: 'María Fernanda López', email: isCentral ? 'gerente@origenes.sv' : `gerente.sucursal${branch.id}@origenes.sv`, role: 'MANAGER', position: 'Gerente de sucursal', salary: 1200 },
        { key: 'cashier', name: 'Carlos Mejía', email: isCentral ? 'caja@origenes.sv' : `caja.sucursal${branch.id}@origenes.sv`, role: 'CASHIER', position: 'Cajero', salary: 650 },
        { key: 'barista', name: 'Ana Sofía Reyes', email: isCentral ? 'barista@origenes.sv' : `barista.sucursal${branch.id}@origenes.sv`, role: 'EMPLOYEE', position: 'Barista', salary: 550 },
    ];
    for (const person of staff) {
        employees[person.key] = await prisma.employee.upsert({
            where: { email: person.email },
            update: {},
            create: {
                name: person.name,
                email: person.email,
                password,
                role: person.role,
                position: person.position,
                salary: person.salary,
                branchId: branch.id,
                hireDate: new Date('2025-01-15T12:00:00.000Z'),
            },
        });
    }

    const supplierData = [
        { name: 'Café de Altura SV', phone: '2222-4100', email: 'ventas@cafedealtura.sv', address: 'Santa Ana, El Salvador' },
        { name: 'Lácteos La Vaquita', phone: '2222-5200', email: 'pedidos@lacteosvaquita.sv', address: 'La Libertad, El Salvador' },
        { name: 'Empaques del Centro', phone: '2222-6300', email: 'ventas@empaquescentro.sv', address: 'San Salvador, El Salvador' },
    ];
    const suppliers = {};
    for (const supplier of supplierData) {
        suppliers[supplier.name] = await prisma.supplier.findFirst({ where: { name: supplier.name } })
            ?? await prisma.supplier.create({ data: supplier });
    }

    const inventory = await prisma.inventoryItem.findMany({ where: { branchId: branch.id } });
    const stockByName = new Map(inventory.map((item) => [item.name.toLocaleLowerCase(), item]));
    const purchaseExamples = [
        { invoiceNumber: 'DEMO-CAF-001', supplier: 'Café de Altura SV', date: '2026-11-03', paidAmount: 0, items: [['Café de especialidad', 5000, 0.0185]] },
        { invoiceNumber: 'DEMO-LAC-002', supplier: 'Lácteos La Vaquita', date: '2026-11-07', paidAmount: 5, items: [['Leche entera', 5000, 0.0013], ['Leche de avena', 2500, 0.0028]] },
        { invoiceNumber: 'DEMO-EMP-003', supplier: 'Empaques del Centro', date: '2026-11-10', paidAmount: 18, items: [['Vaso 16oz', 100, 0.12], ['Tapadera 16oz', 100, 0.06]] },
    ];
    for (const example of purchaseExamples) {
        const invoiceNumber = branch.name === 'Sucursal Central'
            ? example.invoiceNumber
            : `${example.invoiceNumber}-B${branch.id}`;
        const exists = await prisma.purchase.findFirst({
            where: { branchId: branch.id, supplierId: suppliers[example.supplier].id, invoiceNumber },
        });
        const lines = example.items.map(([name, quantity, unitCost]) => {
            const item = stockByName.get(name.toLocaleLowerCase());
            if (!item) throw new Error(`No se encontró el insumo demo "${name}" en ${branch.name}`);
            const subtotal = Math.round(quantity * unitCost * 100) / 100;
            return { inventoryItemId: item.id, description: `${item.name} (${item.unit})`, quantity, unitCost, subtotal };
        });
        const total = Math.round(lines.reduce((sum, line) => sum + line.subtotal, 0) * 100) / 100;
        const status = example.paidAmount === 0 ? 'PENDING' : example.paidAmount === total ? 'PAID' : 'PARTIAL';
        if (exists) {
            await prisma.purchase.update({
                where: { id: exists.id },
                data: { total, paidAmount: example.paidAmount, status },
            });
            if (example.paidAmount > 0) {
                const payment = await prisma.purchasePayment.findFirst({
                    where: { purchaseId: exists.id, imported: false },
                    orderBy: { id: 'asc' },
                });
                if (payment) {
                    await prisma.purchasePayment.update({
                        where: { id: payment.id },
                        data: { amount: example.paidAmount, employeeId: employees.manager.id },
                    });
                } else {
                    await prisma.purchasePayment.create({
                        data: { purchaseId: exists.id, amount: example.paidAmount, employeeId: employees.manager.id },
                    });
                }
            }
            continue;
        }
        await prisma.purchase.create({
            data: {
                branchId: branch.id,
                supplierId: suppliers[example.supplier].id,
                invoiceNumber,
                date: new Date(`${example.date}T12:00:00.000Z`),
                total,
                paidAmount: example.paidAmount,
                status,
                details: { create: lines },
                ...(example.paidAmount > 0 && {
                    payments: { create: { amount: example.paidAmount, employeeId: employees.manager.id } },
                }),
            },
        });
    }

    const cashier = employees.cashier;
    const openedAt = new Date('2026-11-11T14:00:00.000Z');
    let cashSession = await prisma.cashSession.findFirst({
        where: { employeeId: cashier.id, branchId: branch.id, openedAt, openingAmount: 50 },
    });
    if (!cashSession) {
        cashSession = await prisma.cashSession.create({
            data: {
                employeeId: cashier.id,
                branchId: branch.id,
                openingAmount: 50,
                closingAmount: 55,
                closingCardAmount: 3.48,
                closingDigitalAmount: 5.37,
                closingBitcoinAmount: 0,
                closingChivoWalletAmount: 0,
                openedAt,
                closedAt: new Date('2026-11-11T22:00:00.000Z'),
                status: 'CLOSED',
            },
        });
    }

    const latte = await prisma.product.findFirst({ where: { branchId: branch.id, name: 'Latte clásico' } });
    const cappuccino = await prisma.product.findFirst({ where: { branchId: branch.id, name: 'Cappuccino' } });
    const water = await prisma.product.findFirst({ where: { branchId: branch.id, name: 'Agua embotellada 600 ml' } });
    const saleExamples = [
        {
            marker: 'CLIENTE DEMO CONSUMIDOR', documentType: 'CONSUMER', customerName: 'Cliente demo consumidor',
            customerNit: null, customerNrc: null, productLines: [[latte, 2]], payments: [['CASH', 5], ['CARD', 3.48]],
            subtotal: 7.50, tax: 0.98, total: 8.48,
        },
        {
            marker: 'CLIENTE DEMO EMPRESA', documentType: 'CCF', customerName: 'Comercial Demo SV',
            customerNit: '0614-261126-101-1', customerNrc: '123456-7', productLines: [[cappuccino, 1], [water, 1]],
            payments: [['DIGITAL', 5.37]], subtotal: 4.75, tax: 0.62, total: 5.37,
        },
    ];
    for (const example of saleExamples) {
        const exists = await prisma.sale.findFirst({
            where: { branchId: branch.id, customerName: example.customerName, documentType: example.documentType },
        });
        if (exists) continue;
        if (example.productLines.some(([product]) => !product)) throw new Error('Falta un producto necesario para las ventas demo');
        const currentBranch = await prisma.branch.findUnique({ where: { id: branch.id } });
        const field = example.documentType === 'CCF' ? 'lastCcf' : 'lastConsumerInvoice';
        const documentNumber = currentBranch[field] + 1;
        await prisma.sale.create({
            data: {
                branchId: branch.id,
                employeeId: cashier.id,
                cashSessionId: cashSession.id,
                documentType: example.documentType,
                documentNumber,
                customerName: example.customerName,
                customerNit: example.customerNit,
                customerNrc: example.customerNrc,
                date: new Date('2026-11-11T17:00:00.000Z'),
                subtotal: example.subtotal,
                tax: example.tax,
                total: example.total,
                details: { create: example.productLines.map(([product, quantity]) => ({
                    productId: product.id,
                    quantity,
                    unitPrice: product.price,
                    subtotal: Number(product.price) * quantity,
                })) },
                payments: { create: example.payments.map(([method, amount]) => ({ method, amount })) },
            },
        });
        await prisma.branch.update({ where: { id: branch.id }, data: { [field]: documentNumber } });
    }

    const payrollEmployee = await prisma.employee.findMany({ where: { branchId: branch.id, active: true } });
    for (const employee of payrollEmployee) {
        const period = prepararPlanillaQuincenal(employee, 2026, 11, 1);
        const exists = await prisma.payroll.findFirst({
            where: { employeeId: employee.id, periodStart: period.periodStart, periodEnd: period.periodEnd },
        });
        if (!exists) await prisma.payroll.create({ data: period });
    }

    console.log(`Datos operativos listos para ${branch.name}: empleados, compras, pagos, ventas, caja e historial de nómina.`);
};

const main = async () => {
    const ensureBranch = async (name, address) => {
        const existing = await prisma.branch.findFirst({ where: { name } });
        return existing ?? prisma.branch.create({ data: { name, address } });
    };

    // Repara la sucursal heredada sin nombre para que aparezca en formularios y listados.
    await prisma.branch.updateMany({
        where: { name: '', address: { contains: 'Avenida La Revolución' } },
        data: { name: 'Sucursal Avenida La Revolución' },
    });

    const branch = await ensureBranch('Sucursal Central', 'San Salvador, El Salvador');
    await ensureBranch('Sucursal San Miguel', 'San Miguel, El Salvador');
    await ensureBranch('Sucursal Santa Tecla', 'Santa Tecla, La Libertad, El Salvador');
    await ensureBranch('Sucursal Santa Ana', 'Santa Ana, El Salvador');

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

    for (const currentBranch of branches) {
        await seedOperationalData(currentBranch);
    }

    console.log(`Seed listo: ${insertedSupplyCount} ingredientes/insumos agregados; menú y producto empacado preparados para ${branches.length} sucursal(es).`);
};

main()
    .catch((error) => { console.error(error); process.exit(1); })
    .finally(() => prisma.$disconnect());
