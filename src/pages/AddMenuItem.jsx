import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
//import Sidebar from '../components/AdminSidebar';
import AdminSidebar from '../components/AdminSidebar';
import axios from '../api/axios';

const AddMenuItem = () => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState(''); 
  const [isAvailable, setIsAvailable] = useState(true);
  const [trackQuantity, setTrackQuantity] = useState(false); 
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [availableCategories, setAvailableCategories] = useState([]);
  const navigate = useNavigate();

   useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('/menu/categories');
        setAvailableCategories(response.data);
      } catch (err) {
        console.error("Could not fetch categories", err);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);



    // --- CHANGE 3: Validate and prepare data ---
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setError('Please enter a valid positive price.');
      return;
    }

   let finalQuantity = 0;
   let finalThreshold = null;

    if (trackQuantity) {
      if (quantity.trim() === '') {
        setError('Initial quantity is required when tracking stock.');
        return;
      }
      finalQuantity = parseInt(quantity, 10);
      if (isNaN(finalQuantity) || finalQuantity < 0) {
        setError('Quantity must be a valid non-negative number.');
        return;
      }

      finalThreshold = lowStockThreshold.trim() === '' ? 10 : parseInt(lowStockThreshold, 10);
      if (isNaN(finalThreshold) || finalThreshold < 0) {
        setError('Low stock threshold must be a valid non-negative number.');
        return;
      }
    
    }
      

   /*  try {
      await axios.post('/menu', {
        name,
        price: numericPrice,
        is_available: isAvailable,
        category,
        quantity: finalQuantity,
        track_quantity: trackQuantity,
        low_stock_threshold: finalThreshold,
      });

      setSuccess(true);
      setTimeout(() => navigate('/admin/menu'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add menu item');
    }
  }; */

     try {
      // --- 3. SEND THE NEW FIELD TO THE BACKEND ---
      await axios.post('/menu', {
        name,
        price: numericPrice,
        quantity: finalQuantity,
        is_available: isAvailable,
        track_quantity: trackQuantity,
        low_stock_threshold: finalThreshold,
        category: category.trim() || 'Uncategorized',
      });

      setSuccess(true);
      setTimeout(() => navigate('/admin/menu'), 1500);

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add menu item');
    }
  };
    return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-semibold mb-6">Add New Menu Item</h1>
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md max-w-xl space-y-6">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
          {success && <div className="p-3 bg-green-100 text-green-700 rounded-md">Menu item added successfully! Redirecting...</div>}

          <div>
            <label className="block text-sm font-medium mb-1">Item Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Price ($)</label>
            <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm" required />
          </div>

          {/* Category Combobox Input */}
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <input
              type="text"
              list="category-suggestions"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Appetizer, or type a new one"
              className="w-full border-gray-300 rounded-md shadow-sm"
            />
            <datalist id="category-suggestions">
              {availableCategories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input id="track_quantity" type="checkbox" checked={trackQuantity} onChange={(e) => setTrackQuantity(e.target.checked)} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="track_quantity" className="font-medium text-gray-700">Track Inventory</label>
                <p className="text-gray-500">Enable to manage stock levels for this item.</p>
              </div>
            </div>

            {/* Conditionally render the quantity and threshold inputs */}
            {trackQuantity && (
              <div className="pl-8 mt-4 space-y-4 animate-fade-in-up">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Initial Quantity In Stock</label>
                  <input type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm" placeholder="e.g., 50" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Low Stock Threshold</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Defaults to 10"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Get an alert when stock falls to this level.</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input id="available" type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} className="form-checkbox h-5 w-5" />
            <label htmlFor="available" className="text-sm font-medium">Item is Available for Purchase</label>
          </div>

          <button type="submit" className="w-full bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 font-semibold shadow-md">
            Save Item
          </button>
        </form>
      </main>
    </div>
  );
};

export default AddMenuItem;