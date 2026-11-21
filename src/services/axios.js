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
    // Every API call names the signed-in user and portfolio. The backend trusts only the session
    // token and refuses the call if these don't match it (so editing localStorage gains nothing).
    try {
      const u = JSON.parse(localStorage.getItem('skr_user') || 'null');
      if (u && u.id) {
        config.params = { ...(config.params || {}), userId: u.id };
        if (u.portfolioId) config.params.portfolioId = u.portfolioId;
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
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
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
