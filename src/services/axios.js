import axios from 'axios';
import { message } from 'antd';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor for injecting JWT tokens
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('skr_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Session-style RBAC: send the logged-in user's id so the backend can resolve
    // their role and enforce per-module permissions.
    try {
      const rawUser = localStorage.getItem('skr_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u && u.id) config.headers['X-User-Id'] = u.id;
      }
    } catch { /* ignore malformed user */ }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling global errors (e.g., 401 Unauthenticated)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : null;
    
    if (status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('skr_token');
      localStorage.removeItem('skr_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.replace('/login');
      }
    }

    // Extract server-side message if available
    const serverMessage = error.response?.data?.message || error.response?.data?.error;

    if (status === 403) {
      // Permission denied — keep the user logged in. Staff hit incidental 403s from
      // cross-module widgets they can't access; hide those silently. Admins should never
      // get a 403 (they pass everything), so if one occurs, surface it to help debugging.
      let role = null;
      try { role = JSON.parse(localStorage.getItem('skr_user') || '{}')?.role; } catch { /* ignore */ }
      if (role === 'ADMIN') {
        try { message.error(serverMessage || 'You do not have permission to do that'); } catch { /* noop */ }
      }
    }

    const clientMessage = error.message || 'An unexpected connection error occurred';
    const message = serverMessage || clientMessage;
    
    // Create custom error object
    const customError = new Error(message);
    customError.status = status;
    customError.response = error.response;
    
    return Promise.reject(customError);
  }
);

export default axiosInstance;
