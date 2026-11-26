import { api } from './api.js';

const write = (endpoint, data) => api(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
});

export const cashService = {
    current: () => api('/cash/current'),
    sessions: () => api('/cash/sessions'),
    open: (data) => write('/cash/sessions', data),
    close: (id, data) => write(`/cash/sessions/${id}/close`, data),
};
