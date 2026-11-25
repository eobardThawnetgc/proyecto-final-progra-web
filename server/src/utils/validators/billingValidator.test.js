import assert from 'node:assert/strict';
import { test } from 'node:test';
import { invoiceSchema } from './billingValidator.js';

const invoice = {
    documentType: 'CONSUMER',
    details: [{ productId: 1, quantity: '2' }],
    paymentMethod: 'CASH',
};

test('consumer invoice accepts omitted buyer details', () => {
    const result = invoiceSchema.safeParse(invoice);

    assert.equal(result.success, true);
    assert.equal(result.data.customerName, null);
});

test('CCF requires customer name, NIT, and NRC', () => {
    const result = invoiceSchema.safeParse({ ...invoice, documentType: 'CCF' });

    assert.equal(result.success, false);
    assert.deepEqual(
        result.error.issues.map((issue) => issue.path[0]).sort(),
        ['customerName', 'customerNit', 'customerNrc'],
    );
});

test('CCF accepts complete customer details', () => {
    const result = invoiceSchema.safeParse({
        ...invoice,
        documentType: 'CCF',
        customerName: 'Cliente de prueba',
        customerNit: '0614-000000-000-0',
        customerNrc: '123456-7',
    });

    assert.equal(result.success, true);
});
