// src/pages/MyPastOrders.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { FaRegClock, FaHashtag } from 'react-icons/fa';
import AppLayout from '../components/AppLayout';
import AppSidebar from '../components/AppSidebar';



const MyPastOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMyOrders = async () => {
            try {
                const response = await axios.get('/orders/my-orders');
                setOrders(response.data); // Backend already sends them sorted
            } catch (err) {
                setError('Failed to fetch your orders.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchMyOrders();
    }, []);

    const handleViewReceipt = (orderId) => {
        navigate(`/receipt/${orderId}`);
    };

    const renderContent = () => {
        if (loading) return <p className="text-center text-gray-500 py-10">Loading your orders...</p>;
        if (error) return <p className="text-center text-red-500 py-10">{error}</p>;
        if (orders.length === 0) return <p className="text-center text-gray-500 py-10">You have no past orders.</p>;

        return (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {orders.map((order) => {
                                const orderDate = new Date(order.createdAt);
                                return (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-700">#{order.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{orderDate.toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-gray-800">
                                            {parseFloat(order.total_price ||0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            <button 
                                                onClick={() => handleViewReceipt(order.id)} 
                                                className="text-indigo-600 hover:text-indigo-900 hover:underline"
                                            >
                                                View Receipt
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <AppLayout sidebar={<AppSidebar />}>
            <div className="p-4 sm:p-6 lg:p-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">My Order History</h1>
                {renderContent()}
            </div>
        </AppLayout>
    );
};

export default MyPastOrders;