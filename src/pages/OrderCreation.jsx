// src/pages/OrderCreation.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUtensils, FaTrash, FaPlus, FaMinus, FaPrint, FaWifi, FaCloudUploadAlt } from 'react-icons/fa';
import axios from '../api/axios';
import { db } from '../db';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/AppLayout';
import AppSidebar from '../components/AppSidebar';
import ConfirmationModal from '../components/ConfirmationModal';

// Custom hook to track online/offline status
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

const OrderCreation = () => {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const { user, token, logout } = useAuth();

  // Component State
  const [menuItems, setMenuItems] = useState([]);
  const [currentOrder, setCurrentOrder] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [status, setStatus] = useState({ loading: true, error: null, success: false, orderId: null });
  //const [syncing, setSyncing] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // --- NEW, SIMPLER fetchMenuItems function ---
  // This function now ONLY loads from the local cache.
  const fetchMenuItems = useCallback(async () => {
    setStatus(prev => ({ ...prev, loading: true, error: null }));
    try {
      console.log("Loading menu from local cache...");
      const localItems = await db.menuItems.toArray();
      
      if (localItems.length === 0) {
        console.warn("Local menu cache is empty.");
        setStatus(prev => ({...prev, error: "Menu not downloaded. Please connect to the internet to sync."}));
      }

      setMenuItems(localItems);
    } catch (error) {
      console.error("Failed to load menu from local cache:", error);
      setStatus(prev => ({...prev, error: "Could not load menu data."}));
    } finally {
      setStatus(prev => ({ ...prev, loading: false }));
    }
  }, []); // This no longer needs `isOnline` as a dependency

  // Function to sync orders created while offline (unchanged)
  /* const syncPendingOrders = useCallback(async () => {
    const pendingOrders = await db.pendingOrders.toArray();
    if (pendingOrders.length === 0) return;
    
    setSyncing(true);
    console.log(`Syncing ${pendingOrders.length} pending orders...`);
    
    for (const order of pendingOrders) {
        try {
            await axios.post('/orders', order.data, {
                headers: { Authorization: `Bearer ${order.token}` }
            });
            await db.pendingOrders.delete(order.id);
            console.log(`Successfully synced offline order #${order.id}`);
        } catch (error) {
            console.error(`Failed to sync offline order #${order.id}. Will try again later.`, error);
        }
    }
    setSyncing(false);
  }, []); */

  // --- Main effect hook ---
  // Now simpler: it fetches the local menu and syncs orders if online.
  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  // --- Core Business Logic (unchanged) ---
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

  const handlePlaceOrder = () => {
    if (currentOrder.length === 0) return;
    if (user.role === 'waiter') {
      setIsConfirmModalOpen(true);
    } else {
      handleConfirmOrder();
    }
  };

  const handleConfirmOrder = async () => {
    setIsConfirmModalOpen(false);
    if (currentOrder.length === 0 || !user) {
      alert("Please add items to the order and ensure you are logged in.");
      return;
    }
    const orderData = {
      items: currentOrder.map(i => ({ menu_item_id: i.menu_item_id, quantity: i.quantity, price: i.price }))
    };
    setStatus({ loading: true, error: null, success: false, orderId: null });
    try {
      let response;
      if (isOnline) {
        response = await axios.post('/orders', orderData);
      } else {
        await db.pendingOrders.add({ createdAt: new Date(), token: token, data: orderData });
        response = { data: { orderId: 'local' } };
      }
      if (user.role === 'waiter') {
        logout();
        navigate('/login');
      } else {
        setStatus({ loading: false, error: null, success: true, orderId: response.data.orderId });
        setCurrentOrder([]);
      }
    } catch (error) {
      const errorMessage = isOnline ? (error.response?.data?.error || 'Failed to place order.') : "Failed to save order locally.";
      setStatus({ loading: false, error: errorMessage, success: false, orderId: null });
    }
  };

  const handleClearOrder = () => {
    setCurrentOrder([]);
    setStatus({ loading: false, error: null, success: false, orderId: null });
  };

  const handlePrintOrder = () => {
    if (status.orderId && status.orderId !== 'local') {
        navigate(`/receipt/${status.orderId}`);
    } else if (status.orderId === 'local') {
        alert("This order was saved locally and will be synced when you are back online. It cannot be printed yet.");
    }
  };

  // --- Memoized Calculations for UI (unchanged) ---
  const categories = useMemo(() => ['All', ...new Set(menuItems.map(item => item.category))], [menuItems]);
  const filteredMenuItems = useMemo(() => {
    return menuItems
      .filter(item => selectedCategory === 'All' || item.category === selectedCategory)
      .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [menuItems, selectedCategory, searchTerm]);
  const subtotal = useMemo(() => currentOrder.reduce((acc, item) => acc + item.price * item.quantity, 0), [currentOrder]);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

return (
    <AppLayout sidebar={<AppSidebar />}>
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmOrder}
        title="Confirm Order"
        confirmText="Yes, Place Order & Log Out"
        cancelText="No, Cancel"
        confirmButtonClass="bg-green-600 hover:bg-green-700 text-lg px-6 py-3"
        cancelButtonClass="bg-gray-200 hover:bg-gray-300 text-gray-800"
      >
        <p className="text-lg text-gray-700">Are you sure you want to place this order?</p>
        <p className="mt-2 text-sm text-red-600">This will also end your current session.</p>
      </ConfirmationModal>

      <div className="flex flex-col h-full bg-gray-100">
        
        <div className="p-2 bg-gray-800 text-white text-center text-sm flex items-center justify-center gap-4 shrink-0">
          {isOnline ? ( <span className="flex items-center gap-2 text-green-400"><FaWifi /> Online</span> ) : ( <span className="flex items-center gap-2 text-yellow-400"><FaWifi /> OFFLINE MODE</span> )}
          {/* The 'syncing' indicator is removed from here. It could be moved to a global header if desired. */}
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 overflow-hidden">
          
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 shrink-0">
              <input type="text" placeholder="Search menu items..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md"/>
            </div>
            <div className="px-4 py-2 border-b border-gray-200 flex gap-2 overflow-x-auto whitespace-nowrap shrink-0">
              {categories.map(category => (
                <button key={category} onClick={() => setSelectedCategory(category)} className={`px-4 py-1.5 text-sm rounded-full transition ${selectedCategory === category ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                  {category}
                </button>
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
                      className={`flex flex-col border rounded-lg shadow-sm transition duration-200 ${isItemDisabled ? 'bg-gray-100 opacity-70 cursor-not-allowed' : 'bg-white cursor-pointer hover:shadow-lg hover:border-indigo-500'}`}
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

          <div className="bg-white rounded-lg shadow-md flex flex-col overflow-hidden">
            <h2 className="text-xl font-bold text-gray-800 p-4 border-b border-gray-200 shrink-0">Current Order</h2>
            <div className="flex-1 overflow-y-auto p-4">
              {currentOrder.length === 0 ? (
                <div className="text-center text-gray-500 mt-10 flex flex-col items-center">
                  <FaUtensils size={40} className="mb-2 text-gray-300" />
                  <p>No items in order yet.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {currentOrder.map(item => (
                    <li key={item.menu_item_id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md shadow-sm">
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-gray-600">{item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleUpdateQuantity(item.menu_item_id, -1)} className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"><FaMinus size={10} /></button>
                        <span className="font-bold w-6 text-center">{item.quantity}</span>
                        <button onClick={() => handleUpdateQuantity(item.menu_item_id, 1)} className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"><FaPlus size={10} /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="border-t border-gray-200 p-4 space-y-3 shrink-0">
              <div className="text-sm text-gray-700 space-y-1">
                <div className="flex justify-between"><span>Subtotal:</span><span>{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Tax (8%):</span><span>{tax.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-lg"><span>Total:</span><span>{total.toFixed(2)}</span></div>
              </div>
              <button onClick={handlePlaceOrder} disabled={status.loading || status.success || currentOrder.length === 0} className="w-full bg-indigo-600 text-white py-3 text-lg font-semibold rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition">
                {status.loading ? 'Placing...' : 'Place Order'}
              </button>
              <button onClick={handleClearOrder} className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 flex items-center justify-center gap-2">
                <FaTrash /> Clear Order
              </button>
              <button onClick={handlePrintOrder} disabled={!status.success || !status.orderId || status.orderId === 'local'} className="w-full bg-gray-700 text-white py-2 rounded-md hover:bg-gray-800 flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed">
                <FaPrint /> Print Order
              </button>
              {status.error && <p className="text-red-500 text-center text-sm">{status.error}</p>}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
export default OrderCreation;