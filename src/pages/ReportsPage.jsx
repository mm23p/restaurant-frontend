// src/pages/ReportsPage.jsx

import React, { useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import axios from '../api/axios';
import { FaTimes } from 'react-icons/fa';
import AppLayout from '../components/AppLayout';
import AppSidebar from '../components/AppSidebar';

const ReportsPage = () => {
    const [activeReport, setActiveReport] = useState('user'); // 'waiter' or 'menu'
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedWaiter, setSelectedWaiter] = useState(null); // e.g., { waiterId: 2, waiterName: 'John Doe' }
    const [waiterOrderDetails, setWaiterOrderDetails] = useState([]);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const today = new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD
    const [waiterDate, setWaiterDate] = useState(today);
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);

    const handleGenerateReport = async () => {
        setLoading(true);
        setError(null);
        setReportData([]);

        try {
            let response;
            if (activeReport === 'waiter') {
                response = await axios.get('/reports/waiter-performance', {
                    params: { date: waiterDate }
                });
            } else {
                response = await axios.get('/reports/menu-item-sales', {
                    params: { startDate, endDate }
                });
            }
            setReportData(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to generate report. Please try again.');
        } finally {
            setLoading(false);
        }
    };
     const handleWaiterClick = async (waiter) => {
        setSelectedWaiter(waiter);
        setIsModalOpen(true);
        setDetailsLoading(true);
        setWaiterOrderDetails([]); // Clear previous details
        try {
            const response = await axios.get('/reports/waiter-orders', {
                params: {
                    waiterId: waiter.waiterId,
                    date: waiterDate
                }
            });
            setWaiterOrderDetails(response.data);
        } catch (err) {
            // Display an error inside the modal
            console.error(err);
        } finally {
            setDetailsLoading(false);
        }
    };

 /*    const renderControls = () => {
        if (activeReport === 'waiter') {
            return (
                <div className="flex items-center gap-4">
                    <label htmlFor="waiter-date" className="font-medium">Select Date:</label>
                    <input
                        id="waiter-date"
                        type="date"
                        value={waiterDate}
                        onChange={(e) => setWaiterDate(e.target.value)}
                        className="border border-gray-300 p-2 rounded-md"
                    />
                </div>
            );
        }
        if (activeReport === 'menu') {
            return (
                <div className="flex items-center gap-4 flex-wrap">
                    <label className="font-medium">Date Range:</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-gray-300 p-2 rounded-md" />
                    <span>to</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-gray-300 p-2 rounded-md" />
                </div>
            );
        }
    }; */

    const renderControls = () => {
        if (activeReport === 'waiter') {
            return (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label htmlFor="waiter-date" className="font-medium shrink-0">Select Date:</label>
                    <input id="waiter-date" type="date" value={waiterDate} onChange={(e) => setWaiterDate(e.target.value)} className="w-full sm:w-auto border border-gray-300 p-2 rounded-md"/>
                </div>
            );
        }
        if (activeReport === 'menu') {
            return (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap">
                    <label className="font-medium shrink-0">Date Range:</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full sm:w-auto border border-gray-300 p-2 rounded-md" />
                    <span className="hidden sm:inline">to</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full sm:w-auto border border-gray-300 p-2 rounded-md" />
                </div>
            );
        }
    };

   return (
        // --- 2. The entire page is wrapped in our responsive AppLayout ---
        <AppLayout sidebar={<AppSidebar />}>
            <div className="p-4 sm:p-6 lg:p-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Business Reports</h1>
                
                {/* --- The modal is already responsive, no changes needed --- */}
                {isModalOpen && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl">
            <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">
                    Order Details for {selectedWaiter?.waiterName} on {waiterDate}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-800 transition-colors">
                    <FaTimes size={20} />
                </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
                {detailsLoading ? (
                    <p className="text-center text-gray-500">Loading details...</p>
                ) : waiterOrderDetails.length === 0 ? (
                    <p className="text-center text-gray-500">No orders found for this waiter on the selected date.</p>
                ) : (
                    <WaiterOrdersDetailTable data={waiterOrderDetails} />
                )}
            </div>
        </div>
    </div>
)}
                {/* Tab Navigation */}
                <div className="mb-6 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button onClick={() => setActiveReport('waiter')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeReport === 'waiter' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                            Waiter Performance
                        </button>
                        <button onClick={() => setActiveReport('menu')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeReport === 'menu' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                            Menu Item Sales
                        </button>
                    </nav>
                </div>

                {/* --- 3. Responsive Controls Area --- */}
                <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col sm:flex-row justify-between items-center flex-wrap gap-4">
                    {renderControls()}
                    <button onClick={handleGenerateReport} disabled={loading} className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400">
                        {loading ? 'Generating...' : 'Generate Report'}
                    </button>
                </div>

                {/* Results Display Area */}
                <div className="bg-white rounded-lg shadow-sm p-4 min-h-[300px]">
                    {error && <p className="text-center text-red-500 py-10">{error}</p>}
                    {!error && reportData.length === 0 && !loading && <p className="text-center text-gray-500 py-10">No data to display. Please generate a report.</p>}
                    {reportData.length > 0 && activeReport === 'waiter' && <WaiterReportTable data={reportData} onWaiterClick={handleWaiterClick} />}
                    {reportData.length > 0 && activeReport === 'menu' && <MenuItemReportTable data={reportData} />}
                </div>
            </div>
        </AppLayout>
    );
};

// --- 4. Responsive Tables (wrapped in a div with overflow-x-auto) and currency fix ---
const WaiterReportTable = ({ data, onWaiterClick }) => (
    <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Waiter</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Orders</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg. Order Value</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Sales</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {data.map(row => (
                    <tr key={row.waiterId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                            <button onClick={() => onWaiterClick(row)} className="text-indigo-600 hover:text-indigo-800 hover:underline">
                                {row.waiterName}
                            </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">{row.totalOrders}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">{row.averageOrderValue}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-bold">{row.totalSales}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const MenuItemReportTable = ({ data }) => (
    <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity Sold</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Revenue</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {data.map(row => (
                    <tr key={row.menuItemId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{row.itemName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{row.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">{row.totalQuantitySold}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-bold">{row.totalRevenue}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

// The modal component remains the same, but we make sure to remove the dollar sign.
const WaiterOrdersDetailTable = ({ data }) => (
    <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {data.map(order => (
                    <tr key={order.id}>
                        <td className="px-4 py-3 font-mono text-sm">#{order.id}</td>
                        <td className="px-4 py-3 text-sm">{new Date(order.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-4 py-3 text-sm">{order.items}</td>
                        <td className="px-4 py-3 text-right font-semibold">{order.total}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);
export default ReportsPage;