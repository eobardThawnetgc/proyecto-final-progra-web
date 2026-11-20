import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';

const supplies = [
    { name: 'Café de especialidad', type: 'RAW_MATERIAL', unit: 'g', quantity: 5000, minimumStock: 500 },
    { name: 'Leche entera', type: 'RAW_MATERIAL', unit: 'ml', quantity: 20000, minimumStock: 3000 },
    { name: 'Azúcar', type: 'RAW_MATERIAL', unit: 'g', quantity: 3000, minimumStock: 500 },
    { name: 'Chocolate en polvo', type: 'RAW_MATERIAL', unit: 'g', quantity: 400, minimumStock: 500 },
    { name: 'Vaso 16oz', type: 'SUPPLY', unit: 'unidad', quantity: 200, minimumStock: 50 },
    { name: 'Tapadera 16oz', type: 'SUPPLY', unit: 'unidad', quantity: 200, minimumStock: 50 },
    { name: 'Viñeta', type: 'SUPPLY', unit: 'unidad', quantity: 200, minimumStock: 50 }
];

const main = async () => {
    let branch = await prisma.branch.findFirst({ where: { name: 'Sucursal Central' } });
    if (!branch) {
        branch = await prisma.branch.create({ data: { name: 'Sucursal Central', address: 'San Salvador' } });
    }

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

    const count = await prisma.inventoryItem.count({ where: { branchId: branch.id } });
    if (count === 0) {
        await prisma.inventoryItem.createMany({
            data: supplies.map((item) => ({ ...item, branchId: branch.id }))
        });
    }

    console.log('Seed listo → admin@origenes.sv / Admin1234!');
};

main()
    .catch((error) => { console.error(error); process.exit(1); })
    .finally(() => prisma.$disconnect());