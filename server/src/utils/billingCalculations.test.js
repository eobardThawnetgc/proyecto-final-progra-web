import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Prisma } from '../../prisma/generated/client.ts';
import { calculateInvoiceAmounts } from './billingCalculations.js';

test('calculates 13% IVA over the rounded line subtotals', () => {
    const products = new Map([
        [1, { price: new Prisma.Decimal('10.00') }],
        [2, { price: new Prisma.Decimal('0.01') }],
    ]);
    const invoice = calculateInvoiceAmounts([
        { productId: 1, quantity: '2' },
        { productId: 2, quantity: '1' },
    ], products);

    assert.equal(invoice.subtotal.toFixed(2), '20.01');
    assert.equal(invoice.tax.toFixed(2), '2.60');
    assert.equal(invoice.total.toFixed(2), '22.61');
});

test('rounds fractional-cent IVA to two decimal places', () => {
    const invoice = calculateInvoiceAmounts(
        [{ productId: 1, quantity: '1' }],
        new Map([[1, { price: new Prisma.Decimal('0.05') }]]),
    );

    assert.equal(invoice.tax.toFixed(2), '0.01');
});
