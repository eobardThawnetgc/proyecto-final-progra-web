import { api } from './api.js';

const write = (endpoint, method, data) => api(endpoint, {
    method,
    body: JSON.stringify(data),
});

export const employeesService = {
    list: () => api('/employees'),
    branches: () => api('/employees/branches'),
    create: (data) => write('/employees', 'POST', data),
    update: (id, data) => write(`/employees/${id}`, 'PATCH', data),
};
