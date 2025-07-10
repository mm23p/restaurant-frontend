// src/App.js

import React, { useEffect, useState, useCallback } from 'react';
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

  // Effect to listen for online/offline status changes
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

  // The single, reliable function to sync pending orders
  const syncPendingOrders = useCallback(async () => {
    const pendingOrders = await db.pendingOrders.toArray();
    if (pendingOrders.length === 0) {
      console.log("[SYNC] No pending orders to sync.");
      return;
    }
    
    console.log(`[SYNC] Found ${pendingOrders.length} pending orders. Attempting to sync...`);
    
    let successfulSyncs = 0;
    for (const order of pendingOrders) {
      try {
        // --- THIS IS THE CRITICAL LOGIC ---
        // We use the specific token stored WITH the offline order for authentication.
        // This ensures the order is attributed to the correct waiter.
        await axios.post('/orders', order.data, {
          headers: { Authorization: `Bearer ${order.token}` }
        });
        // If the server call succeeds, delete the order from the local queue.
        await db.pendingOrders.delete(order.id);
        console.log(`[SYNC] Successfully synced offline order #${order.id}`);
        successfulSyncs++;
      } catch (error) {
        // If the token is expired or invalid, the server will return an error.
        // We log it and continue to the next order.
        console.error(`[SYNC] Failed to sync offline order #${order.id}. Server responded:`, error.response?.data || error.message);
      }
    }
    console.log(`[SYNC] Sync process finished. ${successfulSyncs} orders synced.`);
  }, []);

  // This master effect runs all sync tasks when the app comes online with a logged-in user.
  useEffect(() => {
    const runAllSyncTasks = async () => {
      if (isOnline && user) {
        console.log("[SYNC] App is online. Running all sync tasks...");
        
        // 1. Sync Staff List
        try {
          const staffRes = await axios.get('/users/staff');
          await db.users.bulkPut(staffRes.data);
          console.log(`[SYNC] Cached ${staffRes.data.length} staff members.`);
        } catch (error) { console.error("[SYNC] Failed to sync staff list:", error); }

        // 2. Sync Menu Items
        try {
          const menuRes = await axios.get('/menu'); 
          await db.menuItems.clear();
          await db.menuItems.bulkPut(menuRes.data);
          console.log(`[SYNC] Cached ${menuRes.data.length} menu items.`);
        } catch (error) { console.error("[SYNC] Failed to sync menu items:", error); }

        // 3. Sync Pending Orders
        await syncPendingOrders();
      }
    };

    runAllSyncTasks();

  }, [isOnline, user, syncPendingOrders]);

  return null; // This component renders no UI.
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