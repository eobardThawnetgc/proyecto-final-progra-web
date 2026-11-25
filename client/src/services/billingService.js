import { api } from './api.js';

export const billingService = {
    data: () => api('/billing'),
    create: (data) => api('/billing', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
};
