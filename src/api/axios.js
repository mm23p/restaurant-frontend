// src/api/axios.js
import axios from 'axios';

// This is the global instance that will have the interceptor.
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// The interceptor attaches the token of the currently logged-in user.
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- NEW EXPORT ---
// We also export the original, unmodified axios object.
// We will use this to create a temporary, "clean" instance for syncing.
export { axios as axiosBase };

// The default export is still our global, header-injecting instance.
export default axiosInstance;