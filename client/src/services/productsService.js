import { api } from './api.js';

const queryString = (params = {}) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null));
    return query.size ? `?${query}` : '';
};

export const productsService = {
    list: (params) => api(`/products${queryString(params)}`),
    options: () => api('/products/options'),
    create: (data) => api('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => api(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deactivate: (id) => api(`/products/${id}`, { method: 'DELETE' }),
    consume: (id, quantity) => api(`/products/${id}/consume`, { method: 'POST', body: JSON.stringify({ quantity }) }),
};
