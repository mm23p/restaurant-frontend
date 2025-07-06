import React, { useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';

// This component takes the correct sidebar (Admin or Waiter) and the page content (children) as props.
const AppLayout = ({ sidebar, children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="relative min-h-screen lg:flex">
      {/* --- Sidebar for both Mobile and Desktop --- */}
      {/* The 'transform' classes handle the sliding behavior */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* We render the specific sidebar passed in as a prop */}
        {sidebar}
      </aside>

      {/* --- Main Content Area --- */}
      <div className="flex-1 flex flex-col">
        {/* --- Top Bar for Mobile with Hamburger Menu --- */}
        <header className="sticky top-0 bg-white shadow-md z-30 lg:hidden flex items-center justify-between p-4">
            <h1 className="text-xl font-bold text-indigo-600">🍽️ MenuMaster</h1>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-700">
                {isSidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
        </header>

        {/* The actual page content is rendered here */}
        <main className="flex-1 overflow-y-auto">
            {children}
        </main>
      </div>

      {/* --- Overlay for Mobile when Sidebar is Open --- */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
        ></div>
      )}
    </div>
  );
};

export default AppLayout;