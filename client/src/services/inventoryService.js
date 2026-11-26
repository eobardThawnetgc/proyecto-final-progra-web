import { api } from './api.js'

const write = (endpoint, method, data) => api(endpoint, {
  method,
  ...(data === undefined ? {} : { body: JSON.stringify(data) }),
})

export const inventoryService = {
  list: (filters = {}) => {
    const query = new URLSearchParams(
      Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined && value !== null)
        .map(([key, value]) => [key, String(value)]),
    )
    const suffix = query.size ? `?${query}` : ''
    return api(`/inventory${suffix}`)
  },
  getAlerts: () => api('/inventory/alerts'),
  create: (data) => write('/inventory', 'POST', data),
  update: (id, data) => write(`/inventory/${id}`, 'PATCH', data),
  adjustStock: (id, data) => write(`/inventory/${id}/stock`, 'PATCH', data),
  remove: (id) => write(`/inventory/${id}`, 'DELETE'),
}
