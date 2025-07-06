// src/components/ProtectedRoute.jsx

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // While the auth context is figuring out if a user is logged in
  // (e.g., checking localStorage on initial load), show a loading indicator.
  if (loading) {
    return <div>Loading session...</div>;
  }

  // If there's no user, they are not authenticated.
  // Redirect them to the login page.
  // We also pass the page they were trying to access in `state`
  // so we can redirect them back after they log in.
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // This is an optional but powerful addition for role-based access.
  // If the route requires a specific role (e.g., 'admin') and the user's role doesn't match,
  // we can redirect them or show an "Access Denied" page.
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // You could redirect them to a specific "unauthorized" page
    // or back to their respective dashboard.
    // For simplicity, we'll just show a message.
    return (
        <div style={{ padding: '50px', textAlign: 'center' }}>
            <h1>Access Denied</h1>
            <p>You do not have permission to view this page.</p>
        </div>
    );
  }

  // If the user is authenticated (and has the right role, if specified),
  // render the child component (the actual page).
  return children;
};

export default ProtectedRoute;