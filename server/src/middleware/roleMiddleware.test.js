import test from 'node:test';
import assert from 'node:assert/strict';
import { authorize } from './roleMiddleware.js';

const response = () => ({
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
});

test('employee role is authorized for POS, billing, and cash operations', () => {
    for (const allowedRoles of [['ADMIN', 'MANAGER', 'CASHIER', 'EMPLOYEE']]) {
        const res = response();
        let nextCalled = false;
        authorize(...allowedRoles)({ employee: { role: 'EMPLOYEE' } }, res, () => { nextCalled = true; });
        assert.equal(nextCalled, true);
        assert.equal(res.statusCode, 200);
    }
});

test('employee role remains unauthorized for restricted management routes', () => {
    const res = response();
    let nextCalled = false;
    authorize('ADMIN', 'MANAGER')({ employee: { role: 'EMPLOYEE' } }, res, () => { nextCalled = true; });
    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
});
