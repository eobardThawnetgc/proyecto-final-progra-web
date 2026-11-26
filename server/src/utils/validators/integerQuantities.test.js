import test from 'node:test';
import assert from 'node:assert/strict';
import { createProductSchema, consumeProductSchema } from './productsValidator.js';
import { createItemSchema, adjustStockSchema } from './inventoryValidator.js';
import { purchaseSchema } from './purchasesValidator.js';

test('product recipe and consumption quantities accept integers and reject fractions', () => {
    assert.equal(createProductSchema.safeParse({ name: 'Latte', type: 'PREPARED', price: 3.5, recipe: [{ inventoryItemId: 1, quantity: 2 }] }).success, true);
    assert.equal(createProductSchema.safeParse({ name: 'Latte', type: 'PREPARED', price: 3.5, recipe: [{ inventoryItemId: 1, quantity: 0.5 }] }).success, false);
    assert.equal(consumeProductSchema.safeParse({ quantity: 2 }).success, true);
    assert.equal(consumeProductSchema.safeParse({ quantity: 1.5 }).success, false);
});

test('inventory stock, minimum and adjustments accept integers and reject fractions', () => {
    const item = { name: 'Café', type: 'RAW_MATERIAL', unit: 'g', quantity: 10, minimumStock: 2 };
    assert.equal(createItemSchema.safeParse({ body: item }).success, true);
    assert.equal(createItemSchema.safeParse({ body: { ...item, quantity: 10.5 } }).success, false);
    assert.equal(createItemSchema.safeParse({ body: { ...item, minimumStock: 2.5 } }).success, false);
    assert.equal(adjustStockSchema.safeParse({ body: { operation: 'INCREMENT', amount: 1 } }).success, true);
    assert.equal(adjustStockSchema.safeParse({ body: { operation: 'INCREMENT', amount: 0.5 } }).success, false);
});

test('purchase invoice quantities accept integers and reject fractions', () => {
    const purchase = { supplierId: 1, invoiceNumber: 'A-1', details: [{ quantity: '2', unitCost: '1.25', inventoryItemId: 1 }] };
    assert.equal(purchaseSchema.safeParse(purchase).success, true);
    assert.equal(purchaseSchema.safeParse({ ...purchase, details: [{ ...purchase.details[0], quantity: '1.5' }] }).success, false);
});
