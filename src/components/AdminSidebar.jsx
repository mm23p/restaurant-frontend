// src/components/AdminSidebar.jsx

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
//import { FaChartBar, FaUtensils, FaClipboardList, FaUsers, FaCog, FaSignOutAlt, FaPlusCircle, FaHistory } from 'react-icons/fa';
import { FaChartBar, FaUtensils, FaClipboardList, FaUsers, FaCog, FaSignOutAlt, FaPlusCircle, FaHistory, FaBell } from 'react-icons/fa';


const AdminSidebar = () => {

  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // This clears the user state and localStorage token
    navigate('/login'); // This redirects the user to the login page
  };

  const linkClasses = ({ isActive }) =>
    `flex items-center gap-3 py-2.5 px-4 rounded-lg transition ${
      isActive ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'hover:bg-gray-100 text-gray-600'
    }`;

  return (
    <aside className="w-64 bg-white shadow-md flex flex-col justify-between min-h-screen">
      <div>
        <div className="p-6 font-bold text-indigo-600 text-2xl">🍽️ MenuMaster</div>
        <nav className="px-4 space-y-2">
          <NavLink to="/admin" end className={linkClasses}>
            <FaChartBar /> Dashboard
          </NavLink>
          <NavLink to="/order/create" className={linkClasses}>
            <FaPlusCircle /> Order Creation
          </NavLink>
          <NavLink to="/admin/menu" className={linkClasses}>
            <FaUtensils /> Menu
          </NavLink>
          <NavLink to="/admin/requests" className={linkClasses}>
            <FaBell /> Approval Requests
          </NavLink>
          <NavLink to="/admin/orders" className={linkClasses}>
            <FaHistory /> Orders History
          </NavLink>
          {/* <NavLink to="/admin/waiters" className={linkClasses}>
            <FaUsers /> Waiters
          </NavLink> */}
          <NavLink to="/admin/users" className={linkClasses}>
           <FaUsers /> User Management
          </NavLink>
          <NavLink to="/admin/reports" className={linkClasses}>
            <FaChartBar /> Reports
          </NavLink>
        </nav>
      </div>
      <div className="px-4 mb-4 text-sm space-y-2">
        <NavLink to="/admin/settings" className={linkClasses}>
          <FaCog /> Settings
        </NavLink>
        
        {/* --- 3. CHANGE THE NAVLINK TO A BUTTON WITH AN ONCLICK HANDLER --- */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 py-2.5 px-4 rounded-lg text-red-600 hover:bg-red-50 text-left"
        >
          <FaSignOutAlt /> Logout
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;