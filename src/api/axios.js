/* import axios from 'axios';

// Create a new instance of axios with a custom configuration
const axiosInstance = axios.create({
  // This sets the base URL for all API calls
  baseURL: 'http://localhost:5000/api', 
});

// This is the "interceptor". It's a special function that runs
// BEFORE every single request is sent.
axiosInstance.interceptors.request.use(
  (config) => {
    // Get the token that was saved in localStorage during login
    const token = localStorage.getItem('token');
    
    if (token) {
      // If a token exists, add it to the 'Authorization' header
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Do something with request error
    return Promise.reject(error);
  }
);

export default axiosInstance; */

// In src/api/axios.js

import axios from 'axios';

// Get the backend API URL from the environment variable.
// Note the required 'REACT_APP_' prefix for Create React App.
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const instance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// This part adds the auth token to every request if it exists
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Or wherever you store your token
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance;