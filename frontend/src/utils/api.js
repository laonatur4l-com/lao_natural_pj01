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

// Interceptor to add Authorization JWT header
api.interceptors.request.use(async config => {
  let token = localStorage.getItem('token');
  let storedUser = null;

  try {
    const storedUserStr = localStorage.getItem('user');
    if (storedUserStr) storedUser = JSON.parse(storedUserStr);
  } catch (e) {}

  // If user is staff/employee/owner with password or mock token, preserve their token!
  const isStaff = storedUser && (storedUser.role === 'owner' || storedUser.role === 'employee');

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;
    // Only use Supabase session if it matches the current logged-in user's email
    if (session?.access_token && session.user?.email && storedUser?.email && session.user.email.toLowerCase() === storedUser.email.toLowerCase()) {
      token = session.access_token;
      localStorage.setItem('token', token);
    } else if (isStaff && token && (token.startsWith('mock-jwt-token-') || token.startsWith('user-'))) {
      // Keep existing employee/owner token; do NOT overwrite with customer Google session
    }
  } catch (e) {
    // fallback if supabase client fails
  }

  if (!token) {
    token = localStorage.getItem('token');
  }

  // Fallback for staff or mock login if token is missing
  if (!token && storedUser) {
    if (storedUser.role === 'owner' || storedUser.role === 'employee') {
      token = `mock-jwt-token-${storedUser.role}`;
      localStorage.setItem('token', token);
    } else if (storedUser.id) {
      token = `mock-jwt-token-user-${storedUser.id}`;
      localStorage.setItem('token', token);
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
