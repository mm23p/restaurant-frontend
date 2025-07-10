// src/App.js

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from './api/axios'; 
import { AuthProvider, useAuth } from './context/AuthContext';
import { db } from './db';

// --- Import Pages ---
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import WaiterDashboard from './pages/WaiterDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import MyPastOrders from './pages/MyPastOrders';
import MenuManagement from './pages/MenuManagement';
import OrderCreation from './pages/OrderCreation';
import Receipt from './pages/Receipt';
import AdminOrderView from './pages/AdminOrderView';
import UserManagement from './pages/UserManagement';
import ReportsPage from './pages/ReportsPage';
import ApprovalQueue from './pages/ApprovalQueue'; // The new page for admins

// --- Import THE CORRECT Component for protecting routes ---
import ProtectedRoute from './components/ProtectedRoute';


const AppSync = () => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // This function will sync the staff list.
    const syncStaffList = async () => {
      if (isOnline && user) {
        console.log("Proactively syncing staff list...");
        try {
          const response = await axios.get('/users/staff');
          await db.users.bulkPut(response.data);
          console.log(`Successfully cached ${response.data.length} staff members.`);
        } catch (error) {
          console.error("Failed to sync staff list:", error);
        }
      }
    };

    // --- NEW FUNCTION TO SYNC THE MENU ---
    const syncMenuItems = async () => {
      if (isOnline && user) {
        console.log("Proactively syncing menu items...");
        try {
          // We fetch from the generic /menu endpoint. The backend will provide
          // the correct list based on the user's role.
          const response = await axios.get('/menu'); 
          // Clear the old menu and add the fresh one.
          await db.menuItems.clear();
          await db.menuItems.bulkPut(response.data);
          console.log(`Successfully cached ${response.data.length} menu items.`);
        } catch (error) {
          console.error("Failed to sync menu items:", error);
        }
      }
    };

    // Run both sync functions when the app goes online or the user logs in.
    syncStaffList();
    syncMenuItems(); 

  }, [isOnline, user]);

  return null;
};

function App() {
  return (
    <AuthProvider>
      <AppSync />
      <Router>
        <Routes>
          {/* =================================================================
           * PUBLIC ROUTES
           * ================================================================= */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />


          {/* =================================================================
           * ADMIN & MANAGER SHARED ROUTES
           * ================================================================= */}
          <Route path="/admin/menu" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><MenuManagement /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><ReportsPage /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><AdminOrderView /></ProtectedRoute>} />

          {/* =================================================================
           * ADMIN-ONLY ROUTES
           * ================================================================= */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
{/*           <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={['admin']}><AdminOrderView /></ProtectedRoute>} />
 */}          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
          
          {/* --- The new Approval Queue route, for Admins only --- */}
          <Route path="/admin/requests" element={<ProtectedRoute allowedRoles={['admin']}><ApprovalQueue /></ProtectedRoute>} />


          {/* =================================================================
           * WAITER & MANAGER SHARED ROUTES
           * (A manager should be able to do everything a waiter can)
           * ================================================================= */}
          <Route path="/orders" element={<ProtectedRoute allowedRoles={['waiter', 'manager']}><WaiterDashboard /></ProtectedRoute>} />
          <Route path="/my-orders" element={<ProtectedRoute allowedRoles={['waiter', 'manager']}><MyPastOrders /></ProtectedRoute>} />


          {/* =================================================================
           * SHARED ROUTES FOR ALL LOGGED-IN ROLES
           * ================================================================= */}
          <Route path="/order/create" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'waiter']}><OrderCreation /></ProtectedRoute>} />
          <Route path="/receipt/:id" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'waiter']}><Receipt /></ProtectedRoute>} />


          
          <Route path="/manager" element={<ProtectedRoute allowedRoles={['manager']}><ManagerDashboard /></ProtectedRoute>} /> {/* <-- ADD THIS LINE */}
          
          {/* =================================================================
           * CATCH-ALL 404
           * ================================================================= */}
          <Route path="*" element={<div className="p-10 text-center text-xl text-red-500">404 - Page Not Found</div>} />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;