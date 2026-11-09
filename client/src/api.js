const TOKEN_KEY = 'sweety_token';
const USER_KEY = 'sweety_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function getUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
}
export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.errors = data.errors;
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  signup: (body) => request('/api/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  listReadings: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/api/readings${q ? `?${q}` : ''}`);
  },
  createReading: (body) => request('/api/readings', { method: 'POST', body: JSON.stringify(body) }),
  updateReading: (id, body) => request(`/api/readings/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteReading: (id) => request(`/api/readings/${id}`, { method: 'DELETE' }),
  report: (params) => request(`/api/reports?${new URLSearchParams(params)}`),
};
