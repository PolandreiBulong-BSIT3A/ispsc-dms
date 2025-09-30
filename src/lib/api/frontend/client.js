// Unified API client for frontend requests (project_19)
// Reads base URL from Vite env with sensible fallback
import { fetchWithRetry } from './http.js';

export const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL)
  ? import.meta.env.VITE_API_BASE_URL
  : 'http://localhost:5000/api';

export const buildUrl = (path) => {
  if (!path) return API_BASE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  const sep = path.startsWith('/') ? '' : '/';
  return `${API_BASE_URL}${sep}${path}`;
};

// Re-export for convenience so callers can import from a single module
export { fetchWithRetry };

export const fetchJson = async (input, options = {}) => {
  const url = typeof input === 'string' ? input : input?.toString?.() ?? '';
  const mergedOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  };

  const res = await fetchWithRetry(url, mergedOptions);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.message || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
};
