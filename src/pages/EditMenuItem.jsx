import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import axios from '../api/axios';

const EditMenuItem = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState(''); 
  const [isAvailable, setIsAvailable] = useState(true);
  const [trackQuantity, setTrackQuantity] = useState(false); 
  const [lowStockThreshold, setLowStockThreshold] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

   const [availableCategories, setAvailableCategories] = useState([]);
   /* 
   useEffect(() => {
    const fetchMenuItem = async () => {
      try {
        const { data } = await axios.get(`/menu/${id}`);
        setName(data.name || '');
        setPrice(data.price?.toString() || '');
        setQuantity(data.quantity?.toString() ?? '0');
        setIsAvailable(data.is_available ?? true);
        setCategory(data.category || '');
        setTrackQuantity(data.track_quantity || false);
        setLowStockThreshold(data.low_stock_threshold?.toString() ?? '10'); 
      } catch (err) {
        setError('Failed to load menu item data.');
        console.error("Fetch item error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenuItem();
  }, [id]); */


/*    useEffect(() => {
    // --- THIS IS THE FIX: Fetch data separately for resilience ---
    const fetchItemData = async () => {
      try {
        const { data } = await axios.get(`/menu/${id}`);
        setName(data.name || '');
        setPrice(data.price?.toString() || '');
        setQuantity(data.quantity?.toString() ?? '0');
        setIsAvailable(data.is_available ?? true);
        setCategory(data.category || '');
        setTrackQuantity(data.track_quantity || false);
        setLowStockThreshold(data.low_stock_threshold?.toString() ?? '10');
      } catch (err) {
        setError('Failed to load menu item data.');
        console.error("Fetch item error:", err);
      } finally {
        setLoading(false); // Stop loading after the main data is fetched
      }
    };
     const fetchCategories = async () => {
      try {
        const { data } = await axios.get('/menu/categories');
        setAvailableCategories(data);
      } catch (err) {
        console.error("Could not fetch categories, but form is still usable.", err);
      }
    };

    fetchItemData();
    fetchCategories();
  }, [id]);
 */

  
  useEffect(() => {
    // --- THIS IS THE FIX: We fetch data separately for resilience ---

    // Function to get the primary data for the item being edited
    const fetchItemData = async () => {
      try {
        const { data } = await axios.get(`/menu/${id}`);
        setName(data.name || '');
        setPrice(data.price?.toString() || '');
        setQuantity(data.quantity?.toString() ?? '0');
        setIsAvailable(data.is_available ?? true);
        setCategory(data.category || '');
        setTrackQuantity(data.track_quantity || false);
        setLowStockThreshold(data.low_stock_threshold?.toString() ?? '10');
      } catch (err) {
        setError('Failed to load this menu item\'s data.');
        console.error("Fetch item error:", err);
      } finally {
        // IMPORTANT: The page is considered "loaded" after the main data is fetched.
        setLoading(false);
      }
    };

    // Function to get the category suggestions (non-critical)
    const fetchCategories = async () => {
      try {
        const { data } = await axios.get('/menu/categories');
        setAvailableCategories(data);
      } catch (err) {
        // If this fails, it's okay. The user can still type. Just log the error.
        console.error("Could not fetch category suggestions:", err);
      }
    };

    // Call both functions when the component mounts. They will run in parallel.
    fetchItemData();
    fetchCategories();
  }, [id]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setError('Please enter a valid positive price.');
      return;
    }

  let finalQuantity = 0;
  let finalThreshold = null;
    if (trackQuantity) {
      if (quantity === '') {
          setError('Please provide a quantity for a tracked item.');
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

   try {
      await axios.put(`/menu/${id}`, {
        name,
        price: numericPrice,
        is_available: isAvailable,
        category: category.trim() || 'Uncategorized', // Use the typed/selected category
        quantity: finalQuantity, 
        track_quantity: trackQuantity,
        low_stock_threshold: finalThreshold,     
      });
      navigate('/admin/menu');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update menu item');
    }
  };

 if (loading) return <div className="flex h-screen"><AdminSidebar /><main className="flex-1 p-8">Loading Item...</main></div>;
   
 return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-semibold mb-6">Edit Menu Item</h1>
        
        {error && <div className="p-3 bg-red-100 text-red-700 rounded-md mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md max-w-xl space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Item Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Price ($)</label>
            <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm" required />
          </div>
          
          {/* --- 3. REPLACED TEXT INPUT WITH A DATALIST INPUT --- */}
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <input
              type="text"
              list="category-suggestions"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Appetizer, Main Course, or a new one"
              className="w-full border-gray-300 rounded-md shadow-sm"
            />
            <datalist id="category-suggestions">
              {availableCategories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          {/* ... (rest of the form for track quantity, etc. is the same) ... */}
           <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} id="isAvailable" className="h-4 w-4 rounded border-gray-300 text-indigo-600"/>
              <label htmlFor="isAvailable" className="text-sm font-medium text-gray-900">Item is Available</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={trackQuantity} onChange={(e) => setTrackQuantity(e.target.checked)} id="trackQuantity" className="h-4 w-4 rounded border-gray-300 text-indigo-600"/>
              <label htmlFor="trackQuantity" className="text-sm font-medium text-gray-900">Track Stock Quantity</label>
            </div>
            
            {trackQuantity && (
              <div className="pl-7 mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Current Quantity (In Stock)</label>
                  <input
                    type="number"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Low Stock Threshold</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g., 10"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm"
                  />
                   <p className="text-xs text-gray-500 mt-1">Get an alert when stock falls to this level.</p>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 font-semibold shadow"
          >
            Update Item
          </button>
        </form>
      </main>
    </div>
  );
};

export default EditMenuItem;