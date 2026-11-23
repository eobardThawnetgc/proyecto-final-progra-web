import { api } from './api.js';

const write = (endpoint, method, data) => api(endpoint, {
    method,
    body: JSON.stringify(data),
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
    updatePayment: (id, paidAmount) => write(`/purchases/${id}/payment`, 'PATCH', { paidAmount }),
};
