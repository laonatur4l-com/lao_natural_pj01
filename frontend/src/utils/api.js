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

// Interceptor to add Authorization JWT header & translate legacy PHP script paths to RESTful Express paths
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

  // Seamless Legacy PHP Path Rewriter for Frontend Backwards Compatibility
  if (config.url) {
    let url = config.url;

    // Remove query params for path matching, keep query params after transformation
    const queryIdx = url.indexOf('?');
    const queryString = queryIdx !== -1 ? url.substring(queryIdx) : '';
    const cleanPath = queryIdx !== -1 ? url.substring(0, queryIdx) : url;

    // Special handling for read_single.php with query parameter id
    if (cleanPath === '/products/read_single.php') {
      const params = new URLSearchParams(queryString);
      const prodId = params.get('id');
      if (prodId) {
        config.url = `/products/${prodId}`;
        return config;
      }
    }

    // Special handling for /orders/update_status.php?id=... -> /orders/:id/status
    if (cleanPath === '/orders/update_status.php') {
      const params = new URLSearchParams(queryString);
      const orderId = params.get('id') || (config.data ? JSON.parse(typeof config.data === 'string' ? config.data : '{}').id : null);
      if (orderId) {
        config.url = `/orders/${orderId}/status`;
        return config;
      }
    }

    // Special handling for /orders/update_address.php?id=... -> /orders/:id/address
    if (cleanPath === '/orders/update_address.php') {
      const params = new URLSearchParams(queryString);
      const orderId = params.get('id') || (config.data ? JSON.parse(typeof config.data === 'string' ? config.data : '{}').id : null);
      if (orderId) {
        config.url = `/orders/${orderId}/address`;
        return config;
      }
    }

    const pathRewrites = {
      '/auth/login.php': '/auth/login',
      '/auth/register.php': '/auth/register',
      '/products/read.php': '/products',
      '/products/read_popular.php': '/products/popular',
      '/products/read_single.php': '/products',
      '/products/create.php': '/products',
      '/products/update.php': '/products',
      '/products/delete.php': '/products',
      '/products/upload_image.php': '/products/upload-image',
      '/orders/create.php': '/orders',
      '/orders/read.php': '/orders',
      '/orders/update_status.php': '/orders/status',
      '/orders/update_address.php': '/orders/address',
      '/orders/upload_screenshot.php': '/orders/upload-screenshot',
      '/orders/reupload_payment.php': '/orders/reupload-payment',
      '/categories/read.php': '/categories',
      '/categories/create.php': '/categories',
      '/categories/update.php': '/categories',
      '/categories/delete.php': '/categories',
      '/banners/read.php': '/banners',
      '/banners/upload.php': '/banners/upload',
      '/banners/delete.php': '/banners',
      '/distributors/read.php': '/distributors',
      '/distributors/create.php': '/distributors',
      '/distributors/update.php': '/distributors',
      '/distributors/delete.php': '/distributors',
      '/promotions/read.php': '/promotions',
      '/promotions/create.php': '/promotions',
      '/promotions/update.php': '/promotions',
      '/promotions/delete.php': '/promotions',
      '/exchange_rates/read.php': '/exchange-rates',
      '/exchange_rates/update.php': '/exchange-rates',
      '/admin/analytics.php': '/admin/analytics',
      '/admin/employee_analytics.php': '/admin/employee-analytics',
      '/admin/employees.php': '/admin/employees',
      '/admin/users.php': '/admin/users',
      '/admin/activity_log.php': '/admin/activity-log',
      '/admin/import_product.php': '/admin/import-product',
      '/admin/read_product_imports.php': '/admin/product-imports',
      '/user/profile.php': '/user/profile',
    };

    if (pathRewrites[cleanPath]) {
      config.url = pathRewrites[cleanPath] + queryString;
    }
  }

  return config;
});

export default api;
