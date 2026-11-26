import assert from 'node:assert/strict';
import test from 'node:test';
import { purchaseSchema, reversalSchema } from './purchasesValidator.js';

const invoice = (detail) => purchaseSchema.safeParse({
    supplierId: 1,
    invoiceNumber: 'DEMO-001',
    details: [{ inventoryItemId: 1, expectedUnit: 'g', quantity: '1000', unitCost: '0.005', ...detail }],
});

test('acepta cantidades enteras y costos unitarios de hasta seis decimales', () => {
    assert.equal(invoice().success, true);
    assert.equal(invoice({ unitCost: '0.000001' }).success, true);
    assert.equal(invoice({ unitCost: '0.0000001' }).success, false);
    assert.equal(invoice({ quantity: '1.001' }).success, false);
    assert.equal(invoice({ quantity: '0' }).success, false);
});

test('acepta la unidad que vio el usuario y conserva el formato de los clientes anteriores', () => {
    assert.equal(invoice().data.details[0].expectedUnit, 'g');
    assert.equal(invoice({ expectedUnit: undefined }).success, true);
    assert.equal(invoice({ expectedUnit: '' }).success, false);
});

test('exige un motivo para cada reversión de abono', () => {
    assert.equal(reversalSchema.safeParse({ reason: '   ' }).success, false);
    assert.deepEqual(reversalSchema.parse({ reason: ' Duplicado ' }), { reason: 'Duplicado' });
});
