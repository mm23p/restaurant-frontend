// src/components/AppSidebar.jsx

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FaChartBar, FaUtensils, FaUsers, FaCog, FaSignOutAlt,
  FaPlusCircle, FaHistory, FaBell
} from 'react-icons/fa';

const AppSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Using a consistent style for all roles, based on your WaiterSidebar
  const linkClasses = ({ isActive }) =>
    `flex items-center gap-3 py-3 px-4 rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-indigo-600 text-white font-semibold shadow-inner'
        : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
    }`;

  const renderNavLinks = () => {
    if (!user) return null;

    switch (user.role) {
      // --- ADMIN ---
      case 'admin':
        return (
          <>
            <NavLink to="/admin" end className={linkClasses}><FaChartBar /> Dashboard</NavLink>
            <NavLink to="/admin/menu" className={linkClasses}><FaUtensils /> Menu</NavLink>
            <NavLink to="/admin/requests" className={linkClasses}><FaBell /> Approval Requests</NavLink>
            <NavLink to="/admin/orders" className={linkClasses}><FaHistory /> Orders History</NavLink>
            <NavLink to="/admin/users" className={linkClasses}><FaUsers /> User Management</NavLink>
            <NavLink to="/admin/reports" className={linkClasses}><FaChartBar /> Reports</NavLink>
            <NavLink to="/order/create" className={linkClasses}><FaPlusCircle /> Create Order</NavLink>
            {/* You can add a settings link later if needed */}
            {/* <NavLink to="/admin/settings" className={linkClasses}><FaCog /> Settings</NavLink> */}
          </>
        );

      // --- MANAGER ---
      case 'manager':
        return (
          <>
            {/* Manager-specific links */}
            <NavLink to="/manager" end className={linkClasses}><FaChartBar /> Dashboard</NavLink>
            <NavLink to="/admin/menu" className={linkClasses}><FaUtensils /> Menu Management</NavLink>
            <NavLink to="/admin/orders" className={linkClasses}><FaHistory /> All Order History</NavLink>
            <NavLink to="/admin/reports" className={linkClasses}><FaChartBar /> View Reports</NavLink>
            
            <div className="pt-4 mt-4 border-t border-gray-200">
              <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">Waiter Actions</p>
              {/* Links inherited from Waiter */}
              <NavLink to="/order/create" className={linkClasses}><FaPlusCircle /> Create New Order</NavLink>
              <NavLink to="/my-orders" className={linkClasses}><FaHistory /> My Past Orders</NavLink>
            </div>
          </>
        );

      // --- WAITER ---
      case 'waiter':
        return (
          <>
            <NavLink to="/order/create" end className={linkClasses}><FaPlusCircle /> Create New Order</NavLink>
            <NavLink to="/my-orders" className={linkClasses}><FaHistory /> My Past Orders</NavLink>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <aside className="w-64 bg-white shadow-lg flex flex-col justify-between min-h-screen p-4">
      <div>
        <div className="p-4 mb-4 font-bold text-indigo-600 text-2xl text-center border-b">
          🍽️ MenuMaster
        </div>
        <nav className="space-y-2">
          {renderNavLinks()}
        </nav>
      </div>
      <div className="border-t pt-4">
        {user && (
          <div className="p-4 text-center">
              <p className="font-semibold text-gray-800">{user.full_name || user.username}</p>
              <p className="text-sm text-gray-500 capitalize">{user.role}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg text-red-600 hover:bg-red-50"
        >
          <FaSignOutAlt />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;