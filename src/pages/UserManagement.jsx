// src/pages/UserManagement.jsx

import React, { useState, useEffect, useMemo } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import axios from '../api/axios';
import { FaEdit, FaTrash, FaUserPlus, FaTimes, FaShieldAlt, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AppLayout from '../components/AppLayout';
import ConfirmationModal from '../components/ConfirmationModal'; // Make sure this component exists from the Menu Management feature
import AppSidebar from '../components/AppSidebar';

const capitalizeFirstLetter = (string) => (string ? string.charAt(0).toUpperCase() + string.slice(1) : '');

const UserManagement = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ username: '', full_name: '', password: '', role: 'waiter', is_active: true });
  const [activeTab, setActiveTab] = useState('waiter');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/users');
      setAllUsers(res.data);
    } catch (err) {
      toast.error('Failed to load user data');
    }
  };

  const filteredUsers = useMemo(() => {
    return allUsers.filter(user => user.role === activeTab);
  }, [allUsers, activeTab]);

  const openModal = (user = null) => {
    if (user) {
      setSelectedUser(user);
      setForm({
        username: user.username,
        full_name: user.full_name,
        password: '',
        role: user.role,
        is_active: user.is_active,
      });
    } else {
      setSelectedUser(null);
      setForm({ username: '', full_name: '', password: '', role: activeTab, is_active: true });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = selectedUser ? `/users/${selectedUser.id}` : '/users';
      const method = selectedUser ? 'put' : 'post';
      
      await axios[method](endpoint, form);
      toast.success(`${capitalizeFirstLetter(form.role)} saved successfully!`);

      fetchUsers();
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to save ${form.role}`);
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/users/${userToDelete.id}`);
      toast.success(`${capitalizeFirstLetter(userToDelete.role)} deleted successfully.`);
      fetchUsers();
    } catch (err) {
      toast.error(`Failed to delete ${userToDelete.role}.`);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  return (
    <AppLayout sidebar={<AppSidebar />}>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <button onClick={() => openModal()} className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 flex items-center justify-center gap-2">
            <FaUserPlus /> <span>Add New {capitalizeFirstLetter(activeTab)}</span>
          </button>
        </div>

        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-6">
            <button onClick={() => setActiveTab('waiter')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'waiter' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              Waiters
            </button>
            <button onClick={() => setActiveTab('manager')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'manager' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              Managers
            </button>
            <button onClick={() => setActiveTab('admin')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'admin' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              <span className="flex items-center gap-1.5"><FaShieldAlt /> Admins</span>
            </button>
          </nav>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
           <div className="hidden md:grid grid-cols-4 gap-4 bg-gray-50 p-4 border-b">
            <div className="font-bold text-xs text-gray-500 uppercase">Full Name</div>
            <div className="font-bold text-xs text-gray-500 uppercase">Username</div>
            <div className="font-bold text-xs text-gray-500 uppercase">Status</div>
            <div className="font-bold text-xs text-gray-500 uppercase text-center">Actions</div>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredUsers.map(user => (
              <div key={user.id} className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 items-center hover:bg-gray-50">
                <div className="md:col-span-1"><div className="font-bold text-xs text-gray-500 md:hidden">Full Name</div><div className="text-gray-900">{user.full_name}</div></div>
                <div className="md:col-span-1"><div className="font-bold text-xs text-gray-500 md:hidden">Username</div><div className="text-gray-600">{user.username}</div></div>
                <div className="md:col-span-1"><div className="font-bold text-xs text-gray-500 md:hidden">Status</div><span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{user.is_active ? 'Active' : 'Inactive'}</span></div>
                <div className="col-span-2 md:col-span-1 flex justify-end md:justify-center items-center gap-4">
                  <button onClick={() => openModal(user)} className="text-indigo-600 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-100" title="Edit"><FaEdit /></button>
                  <button onClick={() => handleDeleteClick(user)} className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-100" title="Delete"><FaTrash /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {modalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
              <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">{selectedUser ? 'Edit User' : 'Add New User'}</h2><button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><FaTimes /></button></div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="role" className="block text-sm font-medium">Role</label>
                  <select id="role" name="role" value={form.role} onChange={handleChange} className="mt-1 w-full border border-gray-300 rounded p-2 shadow-sm bg-white">
                    <option value="waiter">Waiter</option><option value="manager">Manager</option><option value="admin">Admin</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium">Full Name</label><input name="full_name" type="text" value={form.full_name} onChange={handleChange} required className="mt-1 w-full border border-gray-300 rounded p-2 shadow-sm" /></div>
                <div><label className="block text-sm font-medium">Username</label><input name="username" type="text" value={form.username} onChange={handleChange} required className="mt-1 w-full border border-gray-300 rounded p-2 shadow-sm" /></div>
                <div><label className="block text-sm font-medium">Password</label><input name="password" type="password" value={form.password} onChange={handleChange} required={!selectedUser} className="mt-1 w-full border border-gray-300 rounded p-2 shadow-sm" placeholder={selectedUser ? "Leave blank to keep unchanged" : ""}/></div>
                <div className="flex items-center gap-2"><input id="is_active_check" name="is_active" type="checkbox" checked={form.is_active} onChange={handleChange} className="h-4 w-4 rounded text-indigo-600" /><label htmlFor="is_active_check">Is Active</label></div>
                <div className="flex justify-end gap-3 pt-4 border-t"><button type="button" onClick={closeModal} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button><button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Save Changes</button></div>
              </form>
            </div>
          </div>
        )}

        <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleConfirmDelete} title={`Delete ${capitalizeFirstLetter(userToDelete?.role)}`} confirmText="Yes, Delete" isLoading={isDeleting} confirmButtonClass="bg-red-600 hover:bg-red-700">
          {userToDelete?.role === 'admin' ? (
            <div className='text-center'><FaExclamationTriangle className="mx-auto text-red-500 text-4xl mb-4" /><p className="text-lg font-bold text-red-800">EXTREME CAUTION</p><p className="mt-2">You are about to permanently delete the <strong className="font-bold">ADMIN</strong> account for<strong className="font-bold text-gray-800"> "{userToDelete?.username}"</strong>.</p><p className="mt-2 text-sm text-red-600">This action is irreversible and will remove all their administrative privileges immediately.</p></div>
          ) : (<p>Are you sure you want to permanently delete the account for<strong className="font-bold text-gray-800"> "{userToDelete?.username}"</strong>?</p>)}
        </ConfirmationModal>
      </div>
    </AppLayout>
  );
};

export default UserManagement;