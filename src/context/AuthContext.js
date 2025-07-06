// src/context/AuthContext.js

import React, { createContext, useState, useContext, useEffect } from 'react';
import axiosInstance from '../api/axios'; // Use your custom instance

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Initialize state from localStorage to persist login across page refreshes
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  
  const [token, setToken] = useState(localStorage.getItem('token'));

  // This effect runs whenever the token changes to update axios headers
  useEffect(() => {
    if (token) {
      // Set the token on the custom axios instance for all future requests
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axiosInstance.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // This function's only job is to receive the successful auth data and save it.
  const login = (authData) => {
    const { user, token } = authData;
    setUser(user);
    setToken(token);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
  };

  const authContextValue = {
    user,
    token,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// This is the custom hook to use the context in other components
export const useAuth = () => {
  return useContext(AuthContext);
};