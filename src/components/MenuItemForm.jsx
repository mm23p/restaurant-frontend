import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
// This component is "dumb". It just displays a form and calls onSubmit.
// It receives initial data, a list of categories, and a submit handler.
const MenuItemForm = ({ initialData = {}, categories = [], onSubmit , error}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    is_available: true,
    track_quantity: false,
    quantity: '0',
    low_stock_threshold: '10',
    requesterNotes: '',
  });

 
  useEffect(() => {
    if (initialData.id) { 
      setFormData({
        name: initialData.name || '',
        price: initialData.price?.toString() || '',
        category: initialData.category || '',
        is_available: initialData.is_available ?? true,
        track_quantity: initialData.track_quantity || false,
        quantity: initialData.quantity?.toString() || '0',
        low_stock_threshold: initialData.low_stock_threshold?.toString() || '10',
        requesterNotes: '',
      });
    } else {
        // If we are adding a new item, reset the form to its default state
         setFormData({
            name: '', price: '', category: '', is_available: true,
            track_quantity: false, quantity: '0', low_stock_threshold: '10',  requesterNotes: ''
        });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData); // Pass the form data up to the parent component
  };

 // const isEditing = !!initialData.id;
  const isEditing = !!initialData.id;
  const isManagerEditing = isEditing && user.role === 'manager';

    return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm font-semibold">
          {error}
        </div>
      )}

      {/* --- Item Name, Price, Category (Unchanged) --- */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Item Name</label>
        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
      </div>
      <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price</label>
        <input type="number" id="price" name="price" step="0.01" min="0" value={formData.price} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
      </div>
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
        <input type="text" id="category" name="category" list="category-suggestions" value={formData.category} onChange={handleChange} placeholder="e.g., Appetizer, or type a new one" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
        <datalist id="category-suggestions">
          {categories.map((cat) => (<option key={cat} value={cat} />))}
        </datalist>
      </div>

      {/* --- Toggles and Inventory Inputs (Unchanged) --- */}
      <div className="space-y-3 pt-4 border-t">
        <div className="flex items-center gap-3">
          <input type="checkbox" id="is_available" name="is_available" checked={formData.is_available} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
          <label htmlFor="is_available" className="font-medium text-gray-700">Item is Available for Purchase</label>
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="track_quantity" name="track_quantity" checked={formData.track_quantity} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
          <label htmlFor="track_quantity" className="font-medium text-gray-700">Track Inventory Stock</label>
        </div>
      </div>
      {formData.track_quantity && (
        <div className="pl-7 pt-3 border-l-2 border-indigo-200 space-y-4">
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Current Quantity in Stock</label>
            <input type="number" id="quantity" name="quantity" min="0" value={formData.quantity} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
          </div>
          <div>
            <label htmlFor="low_stock_threshold" className="block text-sm font-medium text-gray-700">Low Stock Threshold</label>
            <input type="number" id="low_stock_threshold" name="low_stock_threshold" min="0" value={formData.low_stock_threshold} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
          </div>
        </div>
      )}

      {/* --- 5. NEW: CONDITIONAL FIELD for Manager's Notes --- */}
      {isManagerEditing && (
        <div className="pt-4 border-t">
          <label htmlFor="requesterNotes" className="block text-sm font-medium text-gray-700">Notes for Admin <span className="text-gray-500">(Optional)</span></label>
          <textarea
            id="requesterNotes"
            name="requesterNotes"
            value={formData.requesterNotes}
            onChange={handleChange}
            rows="2"
            placeholder="e.g., Price increased due to new supplier cost."
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          ></textarea>
        </div>
      )}

      {/* --- 6. DYNAMIC BUTTON TEXT --- */}
      <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-md hover:bg-indigo-700 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        {isManagerEditing ? 'Submit for Approval' : (isEditing ? 'Save Changes' : 'Add New Menu Item')}
      </button>
    </form>
  );
};
export default MenuItemForm;