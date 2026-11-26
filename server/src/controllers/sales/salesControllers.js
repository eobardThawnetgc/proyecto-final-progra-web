import prisma from '../../../config/prisma.js';

export const getPosProducts = async (req, res, next) => {
    try {
        const products = await prisma.product.findMany({
            where: { branchId: req.employee.branchId, active: true },
            select: { id: true, name: true, description: true, type: true, price: true },
            orderBy: { name: 'asc' },
        });
        return res.json({ data: products.map((product) => ({ ...product, price: product.price.toFixed(2) })) });
    } catch (error) { next(error); }
};

export const getSales = async (req, res, next) => {
    try {
        const sales = await prisma.sale.findMany({
            where: { branchId: req.employee.branchId },
            include: {
                employee: { select: { id: true, name: true } },
                details: { include: { product: { select: { id: true, name: true } } } },
                payments: true,
            },
            orderBy: [{ date: 'desc' }, { id: 'desc' }],
            take: 100,
        });
        return res.json({ data: sales });
    } catch (error) { next(error); }
};
