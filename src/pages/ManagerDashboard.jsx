// src/pages/ManagerDashboard.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import AppSidebar from '../components/AppSidebar';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { FaUtensils, FaChartBar, FaPlusCircle, FaHourglass, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMyRequests = async () => {
      try {
        const res = await axios.get('/requests/my-requests');
        setRequests(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Could not fetch request history.');
      } finally {
        setLoading(false);
      }
    };
    fetchMyRequests();
  }, []);

  const getStatusPill = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="flex items-center gap-1.5 text-xs font-semibold text-yellow-800 bg-yellow-100 px-2 py-1 rounded-full"><FaHourglass /> PENDING</span>;
      case 'APPROVED':
        return <span className="flex items-center gap-1.5 text-xs font-semibold text-green-800 bg-green-100 px-2 py-1 rounded-full"><FaCheckCircle /> APPROVED</span>;
      case 'DENIED':
        return <span className="flex items-center gap-1.5 text-xs font-semibold text-red-800 bg-red-100 px-2 py-1 rounded-full"><FaTimesCircle /> DENIED</span>;
      default:
        return null;
    }
  };

  return (
    <AppLayout sidebar={<AppSidebar />}>
      <main className="flex-1 p-6 bg-gray-50">
        <h1 className="text-3xl font-bold text-gray-800">Manager Dashboard</h1>
        <p className="text-lg text-gray-600 mt-1">Welcome back, {user?.full_name || user?.username}!</p>
        
        {/* Quick Actions Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
          <Link to="/order/create" className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow text-center">
            <FaPlusCircle className="text-indigo-500 text-4xl mx-auto mb-3" />
            <h3 className="font-bold text-lg">Create New Order</h3>
            <p className="text-sm text-gray-500">Start a new customer order.</p>
          </Link>
          <Link to="/admin/menu" className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow text-center">
            <FaUtensils className="text-indigo-500 text-4xl mx-auto mb-3" />
            <h3 className="font-bold text-lg">Manage Menu</h3>
            <p className="text-sm text-gray-500">Request edits to menu items.</p>
          </Link>
          <Link to="/admin/reports" className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow text-center">
            <FaChartBar className="text-indigo-500 text-4xl mx-auto mb-3" />
            <h3 className="font-bold text-lg">View Reports</h3>
            <p className="text-sm text-gray-500">Analyze sales and performance.</p>
          </Link>
        </div>

        {/* Change Request History Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Change Request History</h2>
          {loading && <p>Loading your requests...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && !error && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {requests.length === 0 ? (
                <p className="p-6 text-gray-500">You have not submitted any change requests yet.</p>
              ) : (
                <div className="divide-y divide-gray-200">
                  {requests.map(req => (
                    <div key={req.id} className="p-4">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {req.requestType === 'MENU_ITEM_EDIT' ? 'Menu Item Edit' : 'Inventory Update'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Submitted on: {new Date(req.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {getStatusPill(req.status)}
                      </div>
                      {req.status !== 'PENDING' && (
                        <div className="mt-3 pt-3 border-t border-gray-100 text-sm">
                          <p className="text-gray-600">
                            Resolved by <strong className="font-semibold">{req.approver?.full_name || 'Admin'}</strong> on {new Date(req.resolvedAt).toLocaleString()}
                          </p>
                          <p className="mt-2 font-semibold">Admin Notes:</p>
                          <p className="p-2 bg-gray-100 rounded-md mt-1">{req.adminNotes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </AppLayout>
  );
};

export default ManagerDashboard;