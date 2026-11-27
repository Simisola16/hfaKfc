const DEFAULT_BACKEND_URL = 'https://hfakfc-backend.onrender.com';

function resolveApiBase() {
  const configured = (import.meta.env.VITE_API_URL || '').trim();
  if (configured === '/api') return '/api';
  const base = (configured || DEFAULT_BACKEND_URL).replace(/\/+$/, '');
  return base.endsWith('/api') ? base : `${base}/api`;
}

export const API_BASE = resolveApiBase();

async function fetchJson(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn(`API call ${endpoint} failed, falling back to local state:`, err.message);
    return null;
  }
}

export const api = {
  // Dashboard
  getDashboardStats: () => fetchJson('/dashboard/stats'),

  // Stores
  getStores: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/stores?${query}`);
  },
  getStore: (id) => fetchJson(`/stores/${id}`),
  createStore: (data) => fetchJson('/stores', { method: 'POST', body: JSON.stringify(data) }),
  updateStore: (id, data) => fetchJson(`/stores/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStore: (id) => fetchJson(`/stores/${id}`, { method: 'DELETE' }),

  // Franchisees
  getFranchisees: () => fetchJson('/franchisees'),
  createFranchisee: (data) => fetchJson('/franchisees', { method: 'POST', body: JSON.stringify(data) }),
  updateFranchisee: (id, data) => fetchJson(`/franchisees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Audits
  getAudits: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/audits?${query}`);
  },
  getAudit: (id) => fetchJson(`/audits/${id}`),
  createAudit: (data) => fetchJson('/audits', { method: 'POST', body: JSON.stringify(data) }),
  updateAudit: (id, data) => fetchJson(`/audits/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),
  updateAuditCategory: (id, category) => fetchJson(`/audits/${id}/category`, {
    method: 'PATCH',
    body: JSON.stringify({ category })
  }),
  deleteAudit: (id) => fetchJson(`/audits/${id}`, { method: 'DELETE' }),

  // Products
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/products?${query}`);
  },
  createProduct: (data) => fetchJson('/products', { method: 'POST', body: JSON.stringify(data) }),

  // Assignments
  getAssignments: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/assignments?${query}`);
  },
  createAssignment: (data) => fetchJson('/assignments', { method: 'POST', body: JSON.stringify(data) }),

  // Requests
  getRequests: () => fetchJson('/requests'),
  updateRequestStatus: (id, status) => fetchJson(`/requests/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),

  // Feedback
  getFeedback: () => fetchJson('/feedback'),
  createFeedback: (data) => fetchJson('/feedback', { method: 'POST', body: JSON.stringify(data) }),

  // Appeals
  getAppeals: () => fetchJson('/appeals'),
  createAppeal: (data) => fetchJson('/appeals', { method: 'POST', body: JSON.stringify(data) }),
  updateAppealStatus: (id, status) => fetchJson(`/appeals/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),

  // Users (HFA Staff & Auditors)
  getUsers: () => fetchJson('/users'),
  createUser: (data) => fetchJson('/users', { method: 'POST', body: JSON.stringify(data) }),
  toggleUser: (id) => fetchJson(`/users/${id}/toggle`, { method: 'PATCH' }),

  // KFC Headquarters Users (managed exclusively by HFA Admin)
  getKfcUsers: () => fetchJson('/kfc-users'),
  createKfcUser: (data) => fetchJson('/kfc-users', { method: 'POST', body: JSON.stringify(data) }),
  toggleKfcUser: (id) => fetchJson(`/kfc-users/${id}/toggle`, { method: 'PATCH' }),
  deleteKfcUser: (id) => fetchJson(`/kfc-users/${id}`, { method: 'DELETE' }),

  // Auth
  login: (username, password) => fetchJson('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  }),

  // Map
  getMapStores: () => fetchJson('/map/stores'),
  getMapLogs: () => fetchJson('/map/logs'),
  createMapLog: (data) => fetchJson('/map/logs', { method: 'POST', body: JSON.stringify(data) })
};

export default api;

