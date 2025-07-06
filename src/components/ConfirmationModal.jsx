// src/components/ConfirmationModal.jsx

import React from 'react';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false
}) => {
  // If the modal isn't open, render nothing.
  if (!isOpen) {
    return null;
  }

  return (
    // Backdrop: A semi-transparent overlay that covers the entire screen.
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center"
      onClick={onClose} // Clicking the backdrop will close the modal
    >
      {/* Modal Content */}
      <div
        className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-sm z-50 animate-fade-in-up"
        onClick={e => e.stopPropagation()} // Prevents clicks inside the modal from closing it
      >
        <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
        <div className="text-gray-600 mb-6">
          {children}
        </div>
        <div className="flex justify-end gap-4">
          {/* Cancel Button */}
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition"
          >
            {cancelText}
          </button>
          {/* Confirm Button */}
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-5 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-wait transition font-semibold"
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

// Note: For the 'animate-fade-in-up' class, you can add this to your index.css for a nice effect:
/*
@keyframes fadeInUp {
  from { opacity: 0; transform: translate3d(0, 20px, 0); }
  to { opacity: 1; transform: translate3d(0, 0, 0); }
}
.animate-fade-in-up {
  animation: fadeInUp 0.3s ease-out forwards;
}
*/