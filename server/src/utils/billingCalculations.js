import { Prisma } from '../../prisma/generated/client.ts';

const taxRate = new Prisma.Decimal('0.13');

export const calculateInvoiceAmounts = (requestedDetails, productsById) => {
    const details = requestedDetails.map(({ productId, quantity }) => {
        const unitPrice = productsById.get(productId).price;
        const subtotal = unitPrice.times(quantity).toDecimalPlaces(2);
        return { productId, quantity, unitPrice, subtotal };
    });
    const subtotal = details.reduce(
        (sum, detail) => sum.plus(detail.subtotal),
        new Prisma.Decimal(0),
    );
    const tax = subtotal.times(taxRate).toDecimalPlaces(2);

    return { details, subtotal, tax, total: subtotal.plus(tax) };
};
