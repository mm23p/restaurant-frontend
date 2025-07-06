import React, { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import axios from '../api/axios';
import { FaEdit, FaTrash, FaUserPlus,  FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AppLayout from '../components/AppLayout';

const WaitersPage = () => {
  const [waiters, setWaiters] = useState([]);
  const [selectedWaiter, setSelectedWaiter] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ username: '', full_name: '', password: '', is_active: true });

  useEffect(() => {
    fetchWaiters();
  }, []);

  const fetchWaiters = async () => {
    try {
      const res = await axios.get('/users');
      setWaiters(res.data);
    } catch (err) {
      toast.error('Failed to load waiters');
    }
  };

  const openModal = (waiter = null) => {
    if (waiter) {
      setSelectedWaiter(waiter);
      setForm({
        username: waiter.username,
        full_name: waiter.full_name,
        password: '',
        is_active: waiter.is_active,
      });
    } else {
      setSelectedWaiter(null);
      setForm({ username: '', full_name: '', password: '', is_active: true });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedWaiter(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedWaiter) {
        await axios.put(`/users/${selectedWaiter.id}`, form);
        toast.success('Waiter updated successfully');
      } else {
        await axios.post('/users', { ...form, role: 'waiter' });
        toast.success('Waiter added successfully');
      }
      fetchWaiters();
      closeModal();
    } catch (err) {
      toast.error('Failed to save waiter');
    }
  };

  const deleteWaiter = async (id) => {
    if (!window.confirm('Are you sure you want to delete this waiter?')) return;
    try {
      await axios.delete(`/users/${id}`);
      toast.success('Waiter deleted');
      fetchWaiters();
    } catch (err) {
      toast.error('Failed to delete waiter');
    }
  };

   return (
    <AppLayout sidebar={<AdminSidebar />}>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* --- Responsive Page Header --- */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Manage Waiters</h1>
          <button
            onClick={() => openModal()}
            className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 flex items-center justify-center gap-2"
          >
            <FaUserPlus /> <span>Add Waiter</span>
          </button>
        </div>

        {/* --- Responsive Waiter List --- */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Desktop Table Header (hidden on mobile) */}
          <div className="hidden md:grid grid-cols-4 gap-4 bg-gray-50 p-4 border-b">
            <div className="font-bold text-xs text-gray-500 uppercase">Full Name</div>
            <div className="font-bold text-xs text-gray-500 uppercase">Username</div>
            <div className="font-bold text-xs text-gray-500 uppercase">Status</div>
            <div className="font-bold text-xs text-gray-500 uppercase text-center">Actions</div>
          </div>

          {/* List of Waiters (renders as cards on mobile, rows on desktop) */}
          <div className="divide-y divide-gray-200">
            {waiters.map(w => (
              <div key={w.id} className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 items-center hover:bg-gray-50">
                
                {/* Full Name */}
                <div className="md:col-span-1">
                    <div className="font-bold text-xs text-gray-500 md:hidden">Full Name</div>
                    <div className="text-gray-900">{w.full_name}</div>
                </div>

                {/* Username */}
                <div className="md:col-span-1">
                    <div className="font-bold text-xs text-gray-500 md:hidden">Username</div>
                    <div className="text-gray-600">{w.username}</div>
                </div>

                {/* Status */}
                <div className="md:col-span-1">
                    <div className="font-bold text-xs text-gray-500 md:hidden">Status</div>
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${w.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {w.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>
                
                {/* Actions */}
                <div className="col-span-2 md:col-span-1 flex justify-end md:justify-center items-center gap-4">
                  <button onClick={() => openModal(w)} className="text-indigo-600 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-100" title="Edit">
                    <FaEdit />
                  </button>
                  <button onClick={() => deleteWaiter(w.id)} className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-100" title="Delete">
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- Responsive Modal --- */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{selectedWaiter ? 'Edit Waiter' : 'Add Waiter'}</h2>
                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
                </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">Full Name</label>
                  <input name="full_name" type="text" value={form.full_name} onChange={handleChange} required className="mt-1 w-full border border-gray-300 rounded p-2 shadow-sm"/>
                </div>
                <div>
                  <label className="block text-sm font-medium">Username</label>
                  <input name="username" type="text" value={form.username} onChange={handleChange} required className="mt-1 w-full border border-gray-300 rounded p-2 shadow-sm"/>
                </div>
                {!selectedWaiter && (
                  <div>
                    <label className="block text-sm font-medium">Password</label>
                    <input name="password" type="password" value={form.password} onChange={handleChange} required={!selectedWaiter} className="mt-1 w-full border border-gray-300 rounded p-2 shadow-sm"/>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input id="is_active_check" name="is_active" type="checkbox" checked={form.is_active} onChange={handleChange} className="h-4 w-4 rounded text-indigo-600"/>
                  <label htmlFor="is_active_check">Is Active</label>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={closeModal} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">
                    Cancel
                  </button>
                  <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default WaitersPage;
