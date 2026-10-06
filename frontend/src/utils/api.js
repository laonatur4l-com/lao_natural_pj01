import axios from 'axios';

// Node.js Express Backend API URL (default: http://localhost:3001/api)
let rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
if (rawApiUrl && !rawApiUrl.endsWith('/api') && !rawApiUrl.endsWith('/api/')) {
  rawApiUrl = rawApiUrl.replace(/\/+$/, '') + '/api';
}
const API_URL = rawApiUrl;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add Authorization JWT header
api.interceptors.request.use(config => {
  let token = localStorage.getItem('token');
  if (!token) {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        if (u?.role) {
          token = `mock-jwt-token-${u.role}`;
          localStorage.setItem('token', token);
        }
      } catch (e) { }
    }
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
