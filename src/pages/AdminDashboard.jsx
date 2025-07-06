// src/pages/AdminDashboard.jsx

import React, { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { FaPlus, FaExclamationTriangle, FaTimesCircle, FaClipboardList, FaUsers, FaShoppingCart,FaHistory, FaCalendarDay } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import AppLayout from '../components/AppLayout'; 
import AppSidebar from '../components/AppSidebar';
const AdminDashboard = () => {
  const navigate = useNavigate();
  
  // State for all dynamic parts of the dashboard
  const [stats, setStats] = useState({ totalOrders: 0, ordersToday: 0, activeWaiters: 0 });
  const [inventoryAlerts, setInventoryAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Use Promise.all to fetch everything concurrently for speed
        const [statsResponse, alertsResponse] = await Promise.all([
          axios.get('/dashboard/stats'),
          axios.get('/dashboard/low-stock')
        ]);
        
        setStats(statsResponse.data);
        setInventoryAlerts(alertsResponse.data);

      } catch (err) {
        // A single error message for the whole dashboard
        setError('Could not load all dashboard data.');
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Data for the summary cards, derived from the 'stats' state
  const summaryCards = [
    { 
      label: 'Orders Today', 
      value: stats.ordersToday, 
      icon: <FaCalendarDay className="text-green-500" /> 
    },
    { 
      label: "Yesterday's Orders", 
      value: stats.ordersYesterday, 
      icon: <FaHistory className="text-blue-500" />
    },
    { 
      label: 'Active Waiters', 
      value: stats.activeWaiters, 
      icon: <FaUsers className="text-orange-500" /> 
    },
  ];


  return (
    <AppLayout sidebar={<AppSidebar />}>
      <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto">
        
        {/* --- Header Section (with responsive text size) --- */}
         <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Admin Dashboard</h1>
          {/* --- 3. Corrected navigation path for consistency --- */}
          <button
            onClick={() => navigate('/order/create')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-lg shadow-md transition"
          >
            <FaPlus size={18} /> Add New Order
          </button>
        </div>

        {/* --- Summary Cards Section (already responsive) --- */}
        {loading ? (
            <p className="text-center text-gray-500">Loading dashboard stats...</p>
        ) : error ? (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-8" role="alert">
                <p className="font-bold">Error</p>
                <p>{error}</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {summaryCards.map(({ label, value, icon }) => (
                    <div key={label} className="bg-white rounded-xl shadow-md p-6 flex items-center gap-6 hover:shadow-lg transition">
                        <div className="bg-gray-100 p-4 rounded-full">
                            {React.cloneElement(icon, { size: 28 })}
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">{label}</p>
                            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">{value}</h2>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* --- Quick Access Section (already responsive) --- */}
        <section className="bg-white rounded-xl shadow-md p-6 sm:p-8 mb-8">
          <h3 className="text-xl font-semibold mb-4">Quick Access</h3>
          <p className="text-gray-600 mb-6">Jump directly to common tasks.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/admin/menu')}
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-lg shadow hover:bg-indigo-700 transition"
            >
              <FaPlus /> Add New Item
            </button>
            <button onClick={() => navigate('/admin/menu')} className="border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition">View All Menu</button>
            <button onClick={() => navigate('/admin/orders')} className="flex items-center justify-center gap-2 bg-blue-500 text-white py-3 rounded-lg shadow hover:bg-blue-600 transition"><FaClipboardList /> View All Orders</button>
            <button onClick={() => navigate('/admin/waiters')} className="flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-lg shadow hover:bg-green-600 transition"><FaUsers /> Manage Waiters</button>
          </div>
        </section>

        {/* --- Inventory Alerts Section --- */}
        <section className="bg-white rounded-xl shadow-md p-6 sm:p-8">
            <h3 className="text-xl font-semibold mb-2">Inventory Alerts</h3>
            <p className="text-gray-600 mb-6">Items that are currently low in stock.</p>
            {loading ? (
                <p className="text-center text-gray-500">Loading alerts...</p>
            ) : inventoryAlerts.length > 0 ? (
                <ul className="space-y-4">
                    {inventoryAlerts.map((item) => {
                        const isCritical = item.quantity <= Math.ceil(item.low_stock_threshold / 2);
                        const level = isCritical ? 'Critical' : 'Low';
                        const colorClasses = isCritical ? 'text-red-700 bg-red-100' : 'text-orange-600 bg-orange-100';
                        const icon = isCritical ? <FaTimesCircle /> : <FaExclamationTriangle />;

                        return (
                            <li key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-50 p-4 rounded-md shadow-sm">
                                <div className="flex items-center gap-3">
                                    <span className={`p-2 rounded-full ${colorClasses} flex items-center justify-center`}>{icon}</span>
                                    <span className="font-medium text-gray-900">{item.name}</span>
                                </div>
                                <div className='text-left sm:text-right mt-2 sm:mt-0'>
                                    <span className={`font-semibold px-3 py-1 text-xs rounded-full ${colorClasses}`}>{level}</span>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Stock: {item.quantity} (Threshold: {item.low_stock_threshold})
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="text-center text-gray-500 py-4">✅ No low stock alerts. Everything looks good!</p>
            )}
            <div className="mt-6">
                <a href="/admin/menu" className="text-indigo-600 hover:underline font-semibold">
                    Manage Full Inventory →
                </a>
            </div>
        </section>

      </div>
    </AppLayout>
  );
};
export default AdminDashboard;