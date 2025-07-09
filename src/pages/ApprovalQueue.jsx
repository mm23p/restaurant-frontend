// src/pages/ApprovalQueue.jsx

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '../components/AppLayout';
import axios from '../api/axios';
import { FaCheck, FaTimes, FaPlus, FaTrashAlt, FaPen } from 'react-icons/fa';
import AppSidebar from '../components/AppSidebar';

// A helper component to render the cards consistently
const RequestCard = ({ req, onApprove, onDeny, isProcessing }) => {
  let title, icon, payload, notes, approveEndpoint, denyEndpoint, id;

  // This logic determines how to display each type of request
  switch (req.type) {
    case 'MENU_ITEM_ADD':
      id = req.id; // For drafts, the ID is the menu item ID
      title = "New Item for Approval";
      icon = <FaPlus className="text-green-500" />;
      payload = req.payload;
      notes = req.notes;
      approveEndpoint = `/api/menu/${id}/approve`;
      denyEndpoint = `/api/menu/${id}`; // Denying a draft means deleting it
      break;
    case 'MENU_ITEM_EDIT':
    case 'MENU_ITEM_DELETE':
      id = req.id; // For change requests, ID is the request ID
      title = req.type === 'MENU_ITEM_EDIT' ? "Edit Request" : "Delete Request";
      icon = req.type === 'MENU_ITEM_EDIT' ? <FaPen className="text-blue-500" /> : <FaTrashAlt className="text-red-500" />;
      payload = req.payload;
      notes = req.notes;
      approveEndpoint = `/api/requests/${id}/approve`;
      denyEndpoint = `/api/requests/${id}/deny`;
      break;
    default:
      return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md border-l-4 border-yellow-400 overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            {icon}
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onApprove(approveEndpoint)} disabled={isProcessing} className="flex items-center gap-2 bg-green-500 text-white px-3 py-1.5 rounded-md hover:bg-green-600">
              <FaCheck /> Approve
            </button>
            <button onClick={() => onDeny(denyEndpoint, req.type)} disabled={isProcessing} className="flex items-center gap-2 bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600">
              <FaTimes /> Deny
            </button>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-500">Requested by <strong className="text-gray-800">{req.requester?.full_name || 'Manager'}</strong></p>
      </div>
      <div className="bg-gray-50 p-4 border-t border-gray-200 space-y-2">
        <div>
          <p className="text-sm font-bold text-gray-700">Details:</p>
          <pre className="bg-gray-100 p-2 rounded-md text-xs mt-1 whitespace-pre-wrap">{JSON.stringify(payload, null, 2)}</pre>
        </div>
        {notes && (
          <div>
            <p className="text-sm font-bold text-gray-700">Notes:</p>
            <p className="text-sm bg-blue-50 p-2 rounded-md mt-1">{notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ApprovalQueue = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch both types of pending actions in parallel
      const [menuDraftsRes, changeRequestsRes] = await Promise.all([
        axios.get('/menu?approval_status=pending_approval'), // A special query to get drafts
        axios.get('/requests') // The existing endpoint for edit/delete requests
      ]);

      // Format both lists into a unified structure
      const formattedAddRequests = menuDraftsRes.data.map(item => ({
        id: item.id, // The ID is the menu item ID itself
        type: 'MENU_ITEM_ADD',
        payload: item,
        notes: 'Manager has submitted a new item for approval.',
        createdAt: item.createdAt,
      }));

      const formattedEditDeleteRequests = changeRequestsRes.data.map(req => ({
        id: req.id, // The ID is the change_request ID
        type: req.requestType,
        payload: req.payload,
        requester: req.requester,
        notes: req.requesterNotes,
        createdAt: req.createdAt
      }));
      
      const allPendingRequests = [...formattedAddRequests, ...formattedEditDeleteRequests];
      allPendingRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setRequests(allPendingRequests);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch approval requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (endpoint) => {
    setProcessingId(endpoint);
    try {
      await axios.post(endpoint, {});
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to approve request.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeny = async (endpoint, type) => {
    setProcessingId(endpoint);
    try {
      if (type === 'MENU_ITEM_ADD') {
        if (!window.confirm("Denying this will permanently delete the draft item. Are you sure?")) {
          setProcessingId(null);
          return;
        }
        await axios.delete(endpoint); // Denying a draft is a DELETE call
      } else {
        const reason = window.prompt("Please provide a reason for denying this request:");
        if (!reason || !reason.trim()) {
            alert("A reason is required.");
            setProcessingId(null);
            return;
        }
        await axios.post(endpoint, { adminNotes: reason });
      }
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to deny request.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <AppLayout sidebar={<AppSidebar />}><div className="p-8">Loading requests...</div></AppLayout>;
  if (error) return <AppLayout sidebar={<AppSidebar />}><div className="p-8 text-red-500 font-semibold">{error}</div></AppLayout>;

  return (
    <AppLayout sidebar={<AppSidebar />}>
      <main className="flex-1 p-6 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Pending Approval Requests</h1>
        {requests.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center text-gray-500">
            <FaCheck className="mx-auto text-green-500 text-4xl mb-4" />
            <h2 className="text-xl font-semibold">All caught up!</h2>
            <p className="mt-1">There are no pending requests to review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(req => (
              <RequestCard
                key={`${req.type}-${req.id}`} // A more unique key
                req={req}
                onApprove={handleApprove}
                onDeny={handleDeny}
                isProcessing={processingId === req.id}
              />
            ))}
          </div>
        )}
      </main>
    </AppLayout>
  );
};

export default ApprovalQueue;