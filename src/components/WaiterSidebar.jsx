// src/components/WaiterSidebar.jsx

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaPlusCircle, FaHistory, FaSignOutAlt } from 'react-icons/fa';

const WaiterSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClasses = ({ isActive }) =>
    `flex items-center gap-3 py-3 px-4 rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-indigo-600 text-white font-semibold shadow-inner'
        : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
    }`;

  return (
    <aside className="w-64 bg-white shadow-lg flex flex-col justify-between min-h-screen p-4">
      <div>
        <div className="p-4 mb-4 font-bold text-indigo-600 text-2xl text-center border-b">
          🍽️ MenuMaster
        </div>
        <nav className="space-y-2">
          <NavLink to="/orders" end className={linkClasses}>
            <FaPlusCircle />
            New Order
          </NavLink>
          <NavLink to="/my-orders" className={linkClasses}>
            <FaHistory />
            My Past Orders
          </NavLink>
        </nav>
      </div>
      <div className="border-t pt-4">
        <div className="p-4 text-center">
            <p className="font-semibold text-gray-800">{user?.fullName || user?.username}</p>
            <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg text-red-600 hover:bg-red-50"
        >
          <FaSignOutAlt />
          End Shift (Logout)
        </button>
      </div>
    </aside>
  );
};

export default WaiterSidebar;