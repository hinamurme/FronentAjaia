import { apiRequest } from './api'

export const documentService = {
  list: () => apiRequest('/documents'),
  get: (id) => apiRequest(`/documents/${id}`),
  create: (document) =>
    apiRequest('/documents', { method: 'POST', body: JSON.stringify(document) }),
  update: (id, updates) =>
    apiRequest(`/documents/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
  remove: (id) => apiRequest(`/documents/${id}`, { method: 'DELETE' }),
  share: (id, email) =>
    apiRequest(`/documents/${id}/share`, {
      method: 'PUT',
      body: JSON.stringify({ email }),
    }),
  revoke: (id, userId) =>
    apiRequest(`/documents/${id}/share/${userId}`, { method: 'DELETE' }),
}
