import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { FaEye, FaRegFrown, FaCalendarDay, FaSearch } from 'react-icons/fa';
import AppLayout from '../components/AppLayout';
import AppSidebar from '../components/AppSidebar';

const AdminOrderView = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const [waiterList, setWaiterList] = useState([]);
    const [waiterSearch, setWaiterSearch] = useState('');
    
    const [dateRange, setDateRange] = useState({
        start: new Date().toISOString().slice(0, 10),
        end: new Date().toISOString().slice(0, 10),
        startTime: '00:00', // Default to start of day
        endTime: '23:59',   // Default to end of day
    });
    
    const [activeFilter, setActiveFilter] = useState('Today');

    const combineDateTime = (date, time) => {
        return new Date(`${date}T${time}:00`).toISOString();
    }


     const fetchOrdersAndWaiters = async (params) => {
        setLoading(true);
        setError(null);
        try {
            // --- 2. FETCH USERS AND ORDERS CONCURRENTLY ---
            const [ordersResponse, usersResponse] = await Promise.all([
                axios.get('/orders', { params }),
                axios.get('/users') // Assumes this endpoint exists and returns all users
            ]);
            
            setOrders(ordersResponse.data);
            // Filter for users with the 'waiter' role and store them for the combo box
            setWaiterList(usersResponse.data.filter(user => user.role === 'waiter'));
            
        } catch (err) {
            setError('Failed to fetch data. Please try again later.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };


     useEffect(() => {
        fetchOrdersAndWaiters({
            startDate: combineDateTime(dateRange.start, dateRange.startTime),
            endDate: combineDateTime(dateRange.end, dateRange.endTime),
        });
    }, []);

  
     const groupedOrders = useMemo(() => {
        return orders.reduce((acc, order) => {
            const date = new Date(order.createdAt).toLocaleDateString('en-CA');
            if (!acc[date]) acc[date] = [];
            acc[date].push(order);
            return acc;
        }, {});
    }, [orders]);


 const handleApplyFilters = () => {
        setActiveFilter('Custom');
        fetchOrdersAndWaiters({ // Use the new concurrent fetch function
            waiter: waiterSearch,
            startDate: combineDateTime(dateRange.start, dateRange.startTime),
            endDate: combineDateTime(dateRange.end, dateRange.endTime),
        });
    };

       const handleQuickFilterClick = (filter) => {
        setActiveFilter(filter);
        const today = new Date();
        let start = new Date();
        let end = new Date();

        switch (filter) {
            case 'Today':
                // Handled by default state
                break;
            case 'Yesterday':
                start.setDate(today.getDate() - 1);
                end.setDate(today.getDate() - 1);
                break;
            case 'Last 7 Days':
                start.setDate(today.getDate() - 6);
                break;
            case 'This Month':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                break;
            default:
                return;
        }

        const newStartDate = start.toISOString().slice(0, 10);
        const newEndDate = end.toISOString().slice(0, 10);

        const newStartTime = '00:00';
        const newEndTime = '23:59';

        // Update the UI state
        //setDateRange({ start: newStartDate, end: newEndDate });

         setDateRange({ start: newStartDate, end: newEndDate, startTime: newStartTime, endTime: newEndTime });

         fetchOrdersAndWaiters({ // <-- Use the correct function name
    waiter: waiterSearch,
    startDate: combineDateTime(newStartDate, newStartTime),
    endDate: combineDateTime(newEndDate, newEndTime),
});
    };

   
    const renderContent = () => {
        if (loading) {
            return <p className="text-center text-gray-500 py-10">Loading orders...</p>;
        }
        if (error) {
            return <p className="text-center text-red-500 py-10">{error}</p>;
        }
        if (Object.keys(groupedOrders).length > 0) {
            return Object.keys(groupedOrders).map(date => (
                <div key={date} className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <FaCalendarDay className="text-indigo-600" />
                        <h2 className="text-xl font-semibold text-gray-700">
                            {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </h2>
                    </div>
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {groupedOrders[date].map(order => (
                                        <tr key={order.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">MM-{order.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(order.createdAt).toLocaleTimeString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{order.user?.full_name || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right font-semibold">{parseFloat(order.total_price).toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                                <button onClick={() => navigate(`/receipt/${order.id}`)} className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1 mx-auto">
                                                    <FaEye /> View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ));
        }
        return (
            <div className="text-center py-10 bg-white rounded-lg shadow-md">
                <FaRegFrown className="mx-auto text-gray-400 text-5xl mb-4" />
                <h3 className="text-xl font-semibold text-gray-700">No Matching Orders Found</h3>
                <p className="text-gray-500 mt-2">Adjust your filters or wait for new orders to appear.</p>
            </div>
        );
    };

    return (
        <AppLayout sidebar={<AppSidebar />}>
            <div className="p-4 sm:p-6 lg:p-10">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Order History</h1>

                <div className="bg-white p-4 rounded-lg shadow-sm mb-8 space-y-4">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-700">Quick Filters:</span>
                        {['Today', 'Yesterday', 'Last 7 Days', 'This Month'].map(filter => (
                            <button key={filter} onClick={() => handleQuickFilterClick(filter)}
                                className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${activeFilter === filter ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                                {filter}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-end gap-4 pt-4 border-t">
                        <div className="flex-1 min-w-0">
                            <label className="text-sm font-medium text-gray-700">Filter by Waiter</label>
                            <input
                                type="text"
                                list="waiter-suggestions" // Connects to the datalist below
                                placeholder="Select or type a name..."
                                value={waiterSearch}
                                onChange={(e) => setWaiterSearch(e.target.value)}
                                className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                            />
                            <datalist id="waiter-suggestions">
                                {waiterList.map(waiter => (
                                    <option key={waiter.id} value={waiter.full_name} />
                                ))}
                            </datalist>
                        </div>

                        <div className="flex-1 min-w-0">
                             <label className="text-sm font-medium text-gray-700">Start Date & Time</label>
                             <div className="flex gap-2 mt-1">
                                <input type="date" value={dateRange.start} onChange={(e) => { setDateRange(prev => ({ ...prev, start: e.target.value })); setActiveFilter('Custom'); }} className="w-full border border-gray-300 p-2 rounded-lg text-sm"/>
                                <input type="time" value={dateRange.startTime} onChange={(e) => { setDateRange(prev => ({ ...prev, startTime: e.target.value })); setActiveFilter('Custom'); }} className="w-full border border-gray-300 p-2 rounded-lg text-sm"/>
                             </div>
                        </div>

                        {/* End Date & Time */}
                       <div className="flex-1 min-w-0">
                             <label className="text-sm font-medium text-gray-700">End Date & Time</label>
                             <div className="flex gap-2 mt-1">
                                <input type="date" value={dateRange.end} onChange={(e) => { setDateRange(prev => ({ ...prev, end: e.target.value })); setActiveFilter('Custom'); }} className="w-full border border-gray-300 p-2 rounded-lg text-sm"/>
                                <input type="time" value={dateRange.endTime} onChange={(e) => { setDateRange(prev => ({ ...prev, endTime: e.target.value })); setActiveFilter('Custom'); }} className="w-full border border-gray-300 p-2 rounded-lg text-sm"/>
                             </div>
                        </div>

                        <button onClick={handleApplyFilters} className="w-full sm:w-auto bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 shrink-0">
                           <FaSearch className="inline sm:mr-2" />
                           <span className="hidden sm:inline">Apply Filters</span>
                        </button>
                    </div>
                </div>

                {renderContent()}
            </div>
        </AppLayout>
    );
};

export default AdminOrderView;