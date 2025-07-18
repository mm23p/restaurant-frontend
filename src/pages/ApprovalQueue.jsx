// src/pages/ApprovalQueue.jsx

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '../components/AppLayout';
import axios from '../api/axios';
import { FaCheck, FaTimes, FaPlus, FaTrashAlt, FaPen } from 'react-icons/fa';
import AppSidebar from '../components/AppSidebar';

// Helper component to format the details in a user-friendly way
const RequestDetails = ({ type, payload }) => {
  const formatKey = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  if (type === 'MENU_ITEM_ADD' || type === 'MENU_ITEM_DELETE') {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        {Object.entries(payload).map(([key, value]) => {
          if (['name', 'price', 'category'].includes(key)) {
            return (
              <React.Fragment key={key}>
                <dt className="font-semibold text-gray-600">{formatKey(key)}:</dt>
                <dd className="text-gray-800">{value?.toString() || '-'}</dd>
              </React.Fragment>
            );
          }
          return null;
        })}
      </div>
    );
  }

  if (type === 'MENU_ITEM_EDIT') {
     return (
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Proposed Changes:</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {Object.entries(payload).map(([key, value]) => {
            if (['requesterNotes', 'id', 'createdAt', 'updatedAt', 'approval_status'].includes(key)) return null;
            return (
              <React.Fragment key={key}>
                <dt className="font-semibold text-gray-600">{formatKey(key)}:</dt>
                <dd className="text-indigo-700 font-semibold">{value?.toString() || 'Not Set'}</dd>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }

  return <pre className="bg-gray-100 p-2 rounded-md text-xs mt-1 whitespace-pre-wrap">{JSON.stringify(payload, null, 2)}</pre>;
};

// The card component to display a single request
const RequestCard = ({ req, onApprove, onDeny, isProcessing }) => {
  let title, icon, notes;

  switch (req.type) {
    case 'MENU_ITEM_ADD':
      title = `Add Request: "${req.payload.name}"`;
      icon = <FaPlus className="text-green-500" />;
      notes = req.notes;
      break;
    case 'MENU_ITEM_EDIT':
      title = "Edit Request";
      icon = <FaPen className="text-blue-500" />;
      notes = req.notes;
      break;
    case 'MENU_ITEM_DELETE':
      title = `Delete Request: "${req.payload.name}"`;
      icon = <FaTrashAlt className="text-red-500" />;
      notes = req.notes;
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
            <button onClick={onApprove} disabled={isProcessing} className="flex items-center gap-2 bg-green-500 text-white px-3 py-1.5 rounded-md hover:bg-green-600">
              <FaCheck /> Approve
            </button>
            <button onClick={onDeny} disabled={isProcessing} className="flex items-center gap-2 bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600">
              <FaTimes /> Deny
            </button>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-500">Requested by <strong className="text-gray-800">{req.requester?.full_name || 'Manager'}</strong></p>
      </div>
      <div className="bg-gray-50 p-4 border-t border-gray-200 space-y-2">
        <div>
          <p className="text-sm font-bold text-gray-700">Details:</p>
          <div className="mt-2">
            <RequestDetails type={req.type} payload={req.payload} />
          </div>
        </div>
        {notes && (
          <div className="mt-3 pt-3 border-t">
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
      const [menuDraftsRes, changeRequestsRes] = await Promise.all([
        axios.get('/menu?approval_status=pending_approval'),
        axios.get('/requests')
      ]);

      const formattedAddRequests = menuDraftsRes.data.map(item => ({
        id: `menu-add-${item.id}`,
        approveEndpoint: `/menu/${item.id}/approve`,
        denyEndpoint: `/menu/${item.id}`,
        type: 'MENU_ITEM_ADD',
        payload: item,
        notes: 'Manager has submitted a new item for approval.',
        createdAt: item.createdAt,
      }));

      const formattedEditDeleteRequests = changeRequestsRes.data.map(req => ({
        id: `changereq-${req.id}`,
        approveEndpoint: `/requests/${req.id}/approve`,
        denyEndpoint: `/requests/${req.id}/deny`,
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

  const handleApprove = async (endpoint, requestId) => {
    setProcessingId(requestId);
    try {
      await axios.post(endpoint, {});
      setRequests(prevRequests => prevRequests.filter(req => req.id !== requestId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to approve request.');
      fetchRequests();
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeny = async (endpoint, type, requestId) => {
    setProcessingId(requestId);
    try {
      if (type === 'MENU_ITEM_ADD') {
        if (!window.confirm("Denying this will permanently delete the draft item. Are you sure?")) {
          setProcessingId(null);
          return;
        }
        await axios.delete(endpoint);
      } else {
        const reason = window.prompt("Please provide a reason for denying this request:");
        if (!reason || !reason.trim()) {
            alert("A reason is required.");
            setProcessingId(null);
            return;
        }
        await axios.post(endpoint, { adminNotes: reason });
      }
      setRequests(prevRequests => prevRequests.filter(req => req.id !== requestId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to deny request.');
      fetchRequests();
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
                key={req.id}
                req={req}
                onApprove={() => handleApprove(req.approveEndpoint, req.id)}
                onDeny={() => handleDeny(req.denyEndpoint, req.type, req.id)}
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