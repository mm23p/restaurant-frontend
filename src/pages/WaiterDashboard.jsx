import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { FaUtensils, FaTrash, FaPlus, FaMinus, FaWifi, FaCloudUploadAlt } from 'react-icons/fa';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ConfirmationModal from '../components/ConfirmationModal';
import { db } from '../db';
import AppSidebar from '../components/AppSidebar';

const useOnlineStatus = () => {
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
    return isOnline;
};

const WaiterDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const isOnline = useOnlineStatus();

    const [menuItems, setMenuItems] = useState([]);
    const [currentOrder, setCurrentOrder] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [status, setStatus] = useState({ loading: false, error: null });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [syncing, setSyncing] = useState(false);

    const fetchMenuItems = useCallback(async () => {
        if (isOnline) {
            try {
                const response = await axios.get('/menu');
                const availableItems = response.data.filter(item => item.is_available);
                await db.menuItems.clear();
                await db.menuItems.bulkAdd(availableItems);
                setMenuItems(availableItems);
            } catch (error) {
                console.error("Server fetch failed, falling back to local DB...", error);
                const localItems = await db.menuItems.toArray();
                setMenuItems(localItems);
            }
        } else {
            console.log("OFFLINE: Fetching menu from local database...");
            const localItems = await db.menuItems.toArray();
            setMenuItems(localItems);
        }
    }, [isOnline]);

    const syncPendingOrders = useCallback(async () => {
        const pendingOrders = await db.pendingOrders.toArray();
        if (pendingOrders.length === 0) return;

        setSyncing(true);
        let successCount = 0;

        for (const order of pendingOrders) {
            try {
                const response = await axios.post('/orders', {
                    ...order.data,
                    offlineId: order.id
                });
                if (response.status === 201) {
                    await db.pendingOrders.delete(order.id);
                    successCount++;
                }
            } catch (error) {
                console.error(`Failed to sync offline order #${order.id}.`, error.response?.data?.error || error.message);
            }
        }
        setSyncing(false);
        if (successCount > 0) {
            alert(`${successCount} offline order(s) synced successfully!`);
        }
    }, []);

    useEffect(() => {
        fetchMenuItems();
        if (isOnline) {
            syncPendingOrders();
        }
    }, [fetchMenuItems, isOnline, syncPendingOrders]);

    const handleAddItem = (item) => {
        setCurrentOrder(prev => {
            const exists = prev.find(i => i.menu_item_id === item.id);
            if (exists) {
                return prev.map(i => i.menu_item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { menu_item_id: item.id, name: item.name, price: parseFloat(item.price), quantity: 1 }];
        });
    };

    const handleUpdateQuantity = (id, amount) => {
        setCurrentOrder(prev =>
            prev.map(item => item.menu_item_id === id ? { ...item, quantity: Math.max(0, item.quantity + amount) } : item)
                .filter(item => item.quantity > 0)
        );
    };
    
    const handleClearOrder = () => setCurrentOrder([]);

    const handleConfirmOrder = async () => {
        if (currentOrder.length === 0) {
            setIsModalOpen(false);
            return;
        }
        setStatus({ loading: true, error: null });

        const orderData = {
            items: currentOrder.map(i => ({
                menu_item_id: i.menu_item_id,
                quantity: i.quantity,
                price: i.price,
            })),
        };

        if (isOnline) {
            try {
                await axios.post('/orders', orderData);
                alert('Order placed successfully! You will now be logged out.');
                logout();
                navigate('/login');
            } catch (error) {
                const msg = error.response?.data?.error || 'Failed to place order.';
                setStatus({ loading: false, error: msg });
                setIsModalOpen(false);
            }
        } else { // OFFLINE
            try {
                await db.pendingOrders.add({
                    createdAt: new Date(),
                    data: {
                        ...orderData,
                        userId: user.id // The user ID is now saved inside the 'data' object
                    }
                });
                alert('You are offline. Order saved locally and will sync later. You will now be logged out.');
                logout();
                navigate('/login');
            } catch (error) {
                setStatus({ loading: false, error: 'Failed to save order locally.' });
                setIsModalOpen(false);
            }
        }
    };

    const categories = useMemo(() => ['All', ...new Set(menuItems.map(item => item.category || 'Uncategorized'))], [menuItems]);
    
    const filteredMenuItems = useMemo(() => {
        return menuItems
            .filter(item => selectedCategory === 'All' || item.category === selectedCategory)
            .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [menuItems, selectedCategory, searchTerm]);
    
    const subtotal = useMemo(() => currentOrder.reduce((acc, item) => acc + item.price * item.quantity, 0), [currentOrder]);
    const tax = useMemo(() => subtotal * 0.08, [subtotal]);
    const total = useMemo(() => subtotal + tax, [subtotal, tax]);
  return (
    <>
      <AppLayout sidebar={<AppSidebar />}>
        <div className="flex flex-col h-full">
            <div className="p-2 bg-gray-800 text-white text-center text-sm flex items-center justify-center gap-4 shrink-0">
                {isOnline ? ( <span className="flex items-center gap-2 text-green-400"><FaWifi /> Online</span> ) : ( <span className="flex items-center gap-2 text-yellow-400"><FaWifi /> OFFLINE MODE</span> )}
                {syncing && <span className="flex items-center gap-2 text-blue-400"><FaCloudUploadAlt className="animate-pulse"/> Syncing...</span>}
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 p-2 sm:p-4 md:p-6 h-full overflow-hidden">
                
                <div className="lg:col-span-3 bg-white rounded-lg shadow-md flex flex-col h-full overflow-hidden">
                    <div className="p-4 border-b">
                        <input type="text" placeholder="Search menu items..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div className="px-4 py-2 border-b flex items-center gap-2 overflow-x-auto whitespace-nowrap">
                        {categories.map(category => (
                            <button key={category} onClick={() => setSelectedCategory(category)} className={`px-4 py-1.5 text-sm rounded-full transition ${selectedCategory === category ? 'bg-indigo-600 text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{category}</button>
                        ))}
                    </div>
                    <div className="p-4 overflow-y-auto flex-1">
                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredMenuItems.map(item => {
                            const isItemDisabled = !item.is_available || (item.track_quantity && item.quantity <= 0);
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => !isItemDisabled && handleAddItem(item)}
                                    className={`flex flex-col justify-between border rounded-lg shadow-sm transition duration-200 ${isItemDisabled ? 'bg-gray-100 opacity-70 cursor-not-allowed' : 'bg-white cursor-pointer hover:shadow-lg hover:border-indigo-500'}`}
                                >
                                    <div className="p-4 flex-grow">
                                        <p className="font-semibold text-gray-800 break-words" title={item.name}>{item.name}</p>
                                        <p className="text-sm text-gray-500 mt-1">{parseFloat(item.price).toFixed(2)}</p>
                                    </div>
                                    {isItemDisabled && (
                                    <div className="p-2 border-t border-red-200 bg-red-50 w-full rounded-b-lg mt-auto">
                                        <p className="text-red-600 text-xs font-bold text-center uppercase">
                                            {item.track_quantity && item.quantity <= 0 ? 'Out of Stock' : 'Unavailable'}
                                        </p>
                                    </div>
                                    )}
                                </div>
                            );
                        })}
                        </div>
                    </div>
                </div>
                
                <div className="lg:col-span-2 bg-white rounded-lg shadow-md flex flex-col h-full overflow-hidden">
                    <h2 className="text-xl font-bold text-gray-800 p-4 border-b">Current Order</h2>
                    <div className="flex-1 overflow-y-auto p-4">
                        {currentOrder.length === 0 ? (
                            <div className="text-center text-gray-500 mt-10 flex flex-col items-center h-full justify-center">
                                <FaUtensils size={40} className="mb-4 text-gray-300" />
                                <p>No items in order yet.</p>
                            </div>
                        ) : (
                            <ul className="space-y-3">
                            {currentOrder.map(item => (
                                <li key={item.menu_item_id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                                <div>
                                    <p className="font-semibold">{item.name}</p>
                                    <p className="text-sm text-gray-600">{item.price.toFixed(2)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleUpdateQuantity(item.menu_item_id, -1)} className="p-2 rounded-full bg-gray-200 hover:bg-red-200 transition"><FaMinus size={10} /></button>
                                    <span className="font-bold w-6 text-center">{item.quantity}</span>
                                    <button onClick={() => handleUpdateQuantity(item.menu_item_id, 1)} className="p-2 rounded-full bg-gray-200 hover:bg-green-200 transition"><FaPlus size={10} /></button>
                                </div>
                                </li>
                            ))}
                            </ul>
                        )}
                    </div>
                    <div className="border-t p-4 space-y-3 bg-gray-50">
                        <div className="text-sm text-gray-700 space-y-1">
                            <div className="flex justify-between"><span>Subtotal:</span><span>{subtotal.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Tax (8%):</span><span>{tax.toFixed(2)}</span></div>
                            <div className="flex justify-between font-bold text-lg text-gray-900"><span>Total:</span><span>{total.toFixed(2)}</span></div>
                        </div>
                        <button onClick={() => setIsModalOpen(true)} disabled={status.loading || currentOrder.length === 0} className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition font-semibold">
                            Place Order
                        </button>
                        <button onClick={handleClearOrder} className="w-full bg-red-100 text-red-700 py-2 rounded-lg hover:bg-red-200 flex items-center justify-center gap-2">
                            <FaTrash size={12} /> Clear Order
                        </button>
                        {status.error && <p className="text-red-500 text-center text-sm pt-2">{status.error}</p>}
                    </div>
                </div>
            </div>
        </div>
      </AppLayout>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmOrder}
        title="Confirm Order & Logout"
        confirmText="Yes, Place Order"
        isLoading={status.loading}
      >
        Are you sure you want to place this order?
        <br />
        <span className="font-semibold">This action will complete the order and log you out.</span>
      </ConfirmationModal>
    </>
  );
};

export default WaiterDashboard;