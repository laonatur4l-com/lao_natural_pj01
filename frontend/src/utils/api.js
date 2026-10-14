import axios from 'axios';
import { supabase } from './supabase';

// Node.js Express Backend API URL
let rawApiUrl = import.meta.env.VITE_API_URL || '';
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  if (!rawApiUrl || rawApiUrl.includes('localhost')) {
    rawApiUrl = 'https://lao-natural-backend.onrender.com/api';
  }
}
if (!rawApiUrl) {
  rawApiUrl = 'http://localhost:3001/api';
}
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

// Interceptor to add Authorization JWT header (auto-refreshes Supabase token)
api.interceptors.request.use(async config => {
  let token = null;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.access_token) {
      token = sessionData.session.access_token;
      localStorage.setItem('token', token);
    }
  } catch (e) {
    // fallback if supabase client fails
  }

  if (!token) {
    token = localStorage.getItem('token');
  }

  if (!token) {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        if (u?.id) {
          token = `mock-jwt-token-user-${u.id}`;
          localStorage.setItem('token', token);
        } else if (u?.role) {
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
