import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/AdminSidebar';
import axios from '../api/axios';
import { FaSearch, FaCalendarAlt } from 'react-icons/fa';

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for our search inputs
  const [waiterSearch, setWaiterSearch] = useState('');
  const [dateSearch, setDateSearch] = useState('');

  // Use useCallback to memoize the fetch function
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (waiterSearch) params.waiter = waiterSearch;
      if (dateSearch) params.date = dateSearch;

      const response = await axios.get('/api/orders', { params });
      setOrders(response.data);
    } catch (err) {
      setError('Failed to fetch orders. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [waiterSearch, dateSearch]); // Re-create the function only when search terms change

  // useEffect to call fetchOrders when the component mounts or search terms change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleClearFilters = () => {
    setWaiterSearch('');
    setDateSearch('');
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Orders History</h1>

          {/* Search and Filter Bar */}
          <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex flex-wrap items-center gap-4">
            <div className="relative flex-grow">
              <FaSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Waiter Name..."
                value={waiterSearch}
                onChange={(e) => setWaiterSearch(e.target.value)}
                className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="relative flex-grow">
              <FaCalendarAlt className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={dateSearch}
                onChange={(e) => setDateSearch(e.target.value)}
                className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
                onClick={handleClearFilters}
                className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition"
            >
                Clear
            </button>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <p className="text-center p-10">Loading orders...</p>
            ) : error ? (
              <p className="text-center p-10 text-red-500">{error}</p>
            ) : orders.length === 0 ? (
                <p className="text-center p-10 text-gray-500">No orders found matching your criteria.</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waiter</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{order.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.waiter?.full_name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.OrderItems.map(item => item.MenuItem?.name || 'Unknown Item').join(', ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-bold text-right">${parseFloat(order.total_amount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrdersList;