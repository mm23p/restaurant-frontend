import React, { useEffect, useState, useMemo } from 'react';
import AppLayout from '../components/AppLayout';
import axios from '../api/axios';
import { FaPlus, FaToggleOn, FaToggleOff, FaTimes } from 'react-icons/fa';
import MenuItemForm from '../components/MenuItemForm'; 
import ConfirmationModal from '../components/ConfirmationModal';
import { useAuth } from '../context/AuthContext';
import AppSidebar from '../components/AppSidebar';

const MenuManagement = () => {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); 
  const [formError, setFormError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

   const fetchData = async () => {
    try {
      const [itemsRes, categoriesRes] = await Promise.all([
        axios.get('/menu'),
        axios.get('/menu/categories')
      ]);
      setMenuItems(itemsRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch menu data');
    } finally {
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredItems = useMemo(() => {
    return menuItems
      .filter(item => selectedCategory === 'All' || item.category === selectedCategory)
      .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(item => !showAvailableOnly || item.is_available);
  }, [menuItems, selectedCategory, searchTerm, showAvailableOnly]);

  const uniqueCategories = useMemo(() => ['All', ...categories], [categories]);

  const handleAddItem = () => {
    setEditingItem(null); 
    setFormError(null); 
    setIsFormOpen(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setFormError(null);
    setIsFormOpen(true);
  };


  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };


const handleConfirmDelete = async () => {
  if (!itemToDelete) return;

  setIsDeleting(true);
  try {
    // For a manager, we need to send some data (notes).
    // For an admin, we don't.
    const isManagerRequest = user && user.role && user.role.toLowerCase() === 'manager';
    
    // axios.delete can send a body, but it must be wrapped in a `data` object within the config.
    const axiosConfig = isManagerRequest 
      ? { data: { requesterNotes: `Manager requesting deletion of item: ${itemToDelete.name}` } }
      : {};

    // The frontend always sends a DELETE request.
    // The backend knows how to handle it based on the user's role and the data sent.
    await axios.delete(`/menu/${itemToDelete.id}`, axiosConfig);
    
    // We show a different success message based on the role.
    if (user && user.role && user.role.toLowerCase() === 'admin') {
      setSuccessMessage('Item deleted successfully!');
    } else {
      setSuccessMessage('Deletion request has been submitted for approval.');
    }

    setIsDeleteModalOpen(false);
    setTimeout(() => setSuccessMessage(null), 5000);
    fetchData(); // Refresh the data list
  } catch (err) {
    // This will now show a more useful error message from the backend if something fails.
    console.error("Failed to delete/request deletion:", err);
    alert(err.response?.data?.error || 'An error occurred during the request.');
  } finally {
    setIsDeleting(false);
    setItemToDelete(null);
  }
};

     const handleFormSubmit = async (formData) => {
    setFormError(null);

    const dataToSubmit = {
      ...formData,
      price: parseFloat(formData.price),
      quantity: formData.track_quantity ? parseInt(formData.quantity, 10) : 0,
      low_stock_threshold: formData.track_quantity ? parseInt(formData.low_stock_threshold, 10) : null,
      category: formData.category.trim() || 'Uncategorized',
    };

    try {
      let responseMessage = '';
      const isManager = user && user.role && user.role.toLowerCase() === 'manager';

      if (editingItem) {
        // --- EDITING AN ITEM ---
        await axios.put(`/menu/${editingItem.id}`, dataToSubmit);
        responseMessage = isManager 
          ? 'Your edit request has been submitted for approval!' 
          : 'Item updated successfully!';
      } else {
        // --- ADDING A NEW ITEM ---
        await axios.post('/menu', dataToSubmit);
        responseMessage = isManager
          ? 'Request to add item has been submitted for approval.'
          : 'Item added successfully!';
      }

      setIsFormOpen(false);
      setSuccessMessage(responseMessage);
      setTimeout(() => setSuccessMessage(null), 5000);
      fetchData(); // Refresh the data list
    } catch (err) {
      const message = err.response?.data?.error || 'An unexpected error occurred.';
      setFormError(message);
    }
  };

 if (loading || !user) return <AppLayout sidebar={<AppSidebar />}><div className="p-8">Loading...</div></AppLayout>;
  if (error) return <AppLayout sidebar={<AppSidebar />}><div className="p-8 text-red-500">Error: {error}</div></AppLayout>;


  const isManager = user.role.toLowerCase() === 'manager';
  
  const modalTitle = isManager ? "Request Item Deletion" : "Delete Menu Item";
  const modalConfirmText = isManager ? "Yes, Send Request" : "Yes, Delete";
  const modalBody = isManager ? (
    <p>Are you sure you want to request the permanent deletion of <strong className="font-bold text-gray-800">"{itemToDelete?.name}"</strong>? This will be sent to an admin for approval.</p>
  ) : (
    <>
      <p>Are you sure you want to permanently delete the item <strong className="font-bold text-gray-800">"{itemToDelete?.name}"</strong>?</p>
      <p className="mt-2 text-sm text-red-600">This action cannot be undone.</p>
    </>
  );

   return (
    <AppLayout sidebar={<AppSidebar />}>
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md relative">
            <button onClick={() => setIsFormOpen(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700">
              <FaTimes size={20} />
            </button>
            <h2 className="text-2xl font-bold mb-4">{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
            <MenuItemForm
              initialData={editingItem || {}}
              categories={categories}
              onSubmit={handleFormSubmit}
              error={formError}
            />
          </div>
        </div>
      )}

                   <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={modalTitle}
        confirmText={modalConfirmText}
        isLoading={isDeleting}
        confirmButtonClass={isManager ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"}
      >
        {modalBody}
      </ConfirmationModal>



      <main className="flex-1 p-6">
        {/* --- 5. RENDER THE SUCCESS MESSAGE --- */}
        {successMessage && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md shadow-sm" role="alert">
            <p className="font-bold">Success</p>
            <p>{successMessage}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">  
          <h1 className="text-3xl font-bold text-gray-800">Menu Management</h1>
          <button onClick={handleAddItem} className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 flex items-center justify-center gap-2">
            <FaPlus /> Add x items...
          </button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 space-y-4">
          <div>
            <input type="text" placeholder="Search items by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 w-full" />
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-gray-600 mr-2">Category:</span>
              {uniqueCategories.map((cat) => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${selectedCategory === cat ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white hover:bg-gray-100'}`}>
                  {cat}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm whitespace-nowrap pt-2 sm:pt-0">
              <input type="checkbox" checked={showAvailableOnly} onChange={(e) => setShowAvailableOnly(e.target.checked)} className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500" />
              Show Available Only
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white shadow-lg rounded-lg p-4 flex flex-col">
              <div className="flex-grow">
                <h3 className="text-lg font-semibold text-gray-800">{item.name}</h3>
                <p className="text-sm text-gray-500">{item.category}</p>
                <p className="font-bold text-gray-700 my-2">{parseFloat(item.price).toFixed(2)}</p>
                <div className="flex items-center gap-2 text-sm">
                  {item.is_available ? <FaToggleOn className="text-green-500 text-xl" /> : <FaToggleOff className="text-gray-400 text-xl" />}
                  <span>{item.is_available ? 'Available' : 'Unavailable'}</span>
                </div>
                {item.track_quantity && <p className="text-sm text-gray-600 mt-2">Stock: <span className="font-semibold">{item.quantity}</span></p>}
              </div>
              <div className="flex gap-4 mt-4 pt-4 border-t border-gray-200">
                <button onClick={() => handleEditItem(item)} className="text-indigo-600 hover:underline text-sm font-medium">Edit</button>
                <button onClick={() => handleDeleteClick(item)} className="text-red-600 hover:underline text-sm font-medium">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </AppLayout>
  );
};
export default MenuManagement;