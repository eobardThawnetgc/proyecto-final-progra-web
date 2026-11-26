import { api } from './api.js';

const write = (endpoint, method, data, headers) => api(endpoint, {
    method,
    body: JSON.stringify(data),
    headers,
});

export const purchasesService = {
    list: () => api('/purchases'),
    branches: () => api('/purchases/branches'),
    suppliers: () => api('/purchases/suppliers'),
    inventory: (branchId, signal) => api(`/inventory?branchId=${branchId}`, { signal }),
    create: (data) => write('/purchases', 'POST', data),
    saveSupplier: (id, data) => id
        ? write(`/purchases/suppliers/${id}`, 'PUT', data)
        : write('/purchases/suppliers', 'POST', data),
    updatePayment: (id, { paidAmount, expectedPaidAmount }) => write(
        `/purchases/${id}/payment`, 'PATCH', { paidAmount },
        { 'X-Expected-Paid-Amount': expectedPaidAmount },
    ),
    reversePayment: (id, paymentId, reason) => write(`/purchases/${id}/payments/${paymentId}/reversal`, 'POST', { reason }),
};
