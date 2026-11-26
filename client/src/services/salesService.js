import { api } from './api.js';

export const fetchPosProducts = async () => {
    const result = await api('/sales/products');
    return result.data ?? [];
};

export const createPosSale = async (salePayload) => api('/sales', {
    method: 'POST',
    body: JSON.stringify(salePayload),
});
