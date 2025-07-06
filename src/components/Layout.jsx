
// src/components/Layout.jsx

import React from 'react';
import { useAuth } from '../context/AuthContext';
import AdminSidebar from './AdminSidebar';
import WaiterSidebar from './WaiterSidebar';

const Layout = ({ children }) => {
  const { user } = useAuth();

  // Determine which sidebar to show. Default to null if no user.
  const SidebarComponent = user?.role === 'admin' ? AdminSidebar : WaiterSidebar;

  return (
    <div className="flex min-h-screen bg-gray-100">
      {user && <SidebarComponent />}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default Layout;