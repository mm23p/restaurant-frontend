import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { FaUtensils, FaTrash, FaPlus, FaMinus, FaPrint } from 'react-icons/fa';
import axios from 'axios';

// Replace with your actual authentication hook/context
const useAuth = () => ({ user: { id: 1 } });

const OrderCreation = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // --- STATE MANAGEMENT ---
    const [menuItems, setMenuItems] = useState([]);
    const [currentOrder, setCurrentOrder] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [status, setStatus] = useState({ loading: false, error: null, success: false, orderId: null });

    // --- DATA FETCHING ---
    useEffect(() => {
        const fetchMenuItems = async () => {
            try {
                // Using the /api/menu endpoint from your backend setup
                const response = await axios.get('/api/menu');
                const availableItems = response.data.filter(item => item.is_available);
                setMenuItems(availableItems);
            } catch (error) {
                console.error("Failed to fetch menu items:", error);
                setStatus(prev => ({ ...prev, error: 'Could not load menu.' }));
            }
        };
        fetchMenuItems();
    }, []);

    // --- DERIVED STATE & MEMOIZATION ---
    const categories = useMemo(() => {
        const allCategories = menuItems.map(item => item.category);
        return ['All', ...new Set(allCategories)];
    }, [menuItems]);

    const filteredMenuItems = useMemo(() => {
        return menuItems
            .filter(item => selectedCategory === 'All' || item.category === selectedCategory)
            .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [menuItems, selectedCategory, searchTerm]);

    const subtotal = useMemo(() => currentOrder.reduce((acc, item) => acc + item.price * item.quantity, 0), [currentOrder]);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    // --- EVENT HANDLERS ---
    const handleAddItem = (item) => {
        setCurrentOrder(prevOrder => {
            const existingItem = prevOrder.find(orderItem => orderItem.menu_item_id === item.id);
            if (existingItem) {
                return prevOrder.map(orderItem =>
                    orderItem.menu_item_id === item.id ? { ...orderItem, quantity: orderItem.quantity + 1 } : orderItem
                );
            }
            return [...prevOrder, { menu_item_id: item.id, name: item.name, price: parseFloat(item.price), quantity: 1 }];
        });
    };

    const handleUpdateQuantity = (itemId, amount) => {
        setCurrentOrder(prevOrder =>
            prevOrder.map(item =>
                item.menu_item_id === itemId ? { ...item, quantity: Math.max(0, item.quantity + amount) } : item
            ).filter(item => item.quantity > 0)
        );
    };

    const handlePlaceOrder = async () => {
        if (currentOrder.length === 0) return;
        setStatus({ loading: true, error: null, success: false, orderId: null });
        try {
            const response = await axios.post('/api/orders', {
                user_id: user.id,
                items: currentOrder.map(item => ({ menu_item_id: item.menu_item_id, quantity: item.quantity, price: item.price }))
            });
            setStatus({ loading: false, error: null, success: true, orderId: response.data.orderId });
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Failed to place order.';
            setStatus({ loading: false, error: errorMessage, success: false, orderId: null });
        }
    };

    const handleClearOrder = () => {
        setCurrentOrder([]);
        setStatus({ loading: false, error: null, success: false, orderId: null });
    };

    const handlePrintOrder = () => {
        if (status.orderId) navigate(`/admin/receipts/${status.orderId}`);
    };

    // --- JSX RENDER ---
    return (
        <div className="flex h-screen bg-gray-100">
            {/* --- COLUMN 1: SIDEBAR --- */}
            <Sidebar />

            <main className="flex-1 flex overflow-hidden">
                <div className="flex-1 grid lg:grid-cols-5 gap-6 p-6 overflow-hidden">
                    {/* --- COLUMN 2: MENU ITEMS (Wider Column) --- */}
                    <div className="lg:col-span-3 bg-white rounded-lg shadow-md flex flex-col overflow-hidden">
                        <div className="p-4 border-b">
                            <input type="text" placeholder="Search menu items..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
                        </div>
                        <div className="p-4 border-b flex-wrap flex gap-2">
                            {categories.map(category => (
                                <button key={category} onClick={() => setSelectedCategory(category)} className={`px-4 py-2 text-sm font-semibold rounded-full transition ${selectedCategory === category ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                                    {category}
                                </button>
                            ))}
                        </div>
                        
                        {/* THIS IS THE NEW, CORRECTED GRID THAT FOLLOWS YOUR INSTRUCTIONS */}
                        <div className="flex-1 p-4 overflow-y-auto">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {filteredMenuItems.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleAddItem(item)}
                                        className="w-full text-left p-3 bg-white border-2 border-gray-200 rounded-md shadow-sm transition-all duration-150 hover:border-indigo-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        <p className="font-bold text-gray-800 truncate">{item.name}</p>
                                        <p className="text-sm text-gray-500">${parseFloat(item.price).toFixed(2)}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* --- COLUMN 3: CURRENT ORDER --- */}
                    <div className="lg:col-span-2 bg-white rounded-lg shadow-md flex flex-col">
                        <h2 className="text-2xl font-bold text-gray-800 p-4 border-b">Current Order</h2>
                        <div className="flex-grow p-4 overflow-y-auto">
                            {currentOrder.length === 0 ? (
                                <div className="text-center text-gray-500 mt-10 flex flex-col items-center">
                                    <FaUtensils size={40} className="mb-2" />
                                    <p>Click an item to start an order.</p>
                                </div>
                            ) : (
                                <ul className="space-y-3">
                                    {currentOrder.map(item => (
                                        <li key={item.menu_item_id} className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold">{item.name}</p>
                                                <p className="text-sm text-gray-600">${item.price.toFixed(2)}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleUpdateQuantity(item.menu_item_id, -1)} className="p-1.5 rounded-full bg-gray-200 hover:bg-gray-300"><FaMinus size={10} /></button>
                                                <span className="font-bold w-6 text-center">{item.quantity}</span>
                                                <button onClick={() => handleUpdateQuantity(item.menu_item_id, 1)} className="p-1.5 rounded-full bg-gray-200 hover:bg-gray-300"><FaPlus size={10} /></button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="p-4 border-t space-y-2 text-gray-700">
                            <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Tax (8%)</span><span>${tax.toFixed(2)}</span></div>
                            <div className="flex justify-between font-bold text-xl"><span>Total</span><span>${total.toFixed(2)}</span></div>
                        </div>
                        <div className="p-4 border-t space-y-3">
                            <button onClick={handlePlaceOrder} disabled={status.loading || status.success || currentOrder.length === 0} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition">
                                {status.loading ? 'Placing...' : status.success ? 'Order Placed!' : 'Place Order'}
                            </button>
                            <button onClick={handleClearOrder} className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition flex items-center justify-center gap-2">
                                <FaTrash /> Clear Order
                            </button>
                            <button onClick={handlePrintOrder} disabled={!status.success || !status.orderId} className="w-full bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-800 transition flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed">
                                <FaPrint /> Print Order
                            </button>
                            {status.error && <p className="text-red-500 text-sm mt-2 text-center">{status.error}</p>}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default OrderCreation;