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