// src/pages/ApprovalQueue.jsx

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '../components/AppLayout';
import axios from '../api/axios';
import { FaHourglassHalf, FaCheck, FaTimes } from 'react-icons/fa';
import AppSidebar from '../components/AppSidebar';

const ApprovalQueue = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null); // To disable buttons on a specific card during an action

  const fetchRequests = useCallback(async () => {
    try {
      setError(null);
      const res = await axios.get('/requests');
      setRequests(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch approval requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  /* const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      await axios.post(`/requests/${id}/approve`);
      fetchRequests(); // Refresh the list after success
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to approve request.');
    } finally {
      setProcessingId(null);
    }
  }; */

   const handleApprove = async (id) => {
        setProcessingId(id);
        try {
            // --- THIS IS THE FIX ---
            // We now send an empty object {} as the request body.
            // This ensures req.body will be defined on the backend.
            await axios.post(`/requests/${id}/approve`, {});
            fetchRequests();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to approve request.');
        } finally {
            setProcessingId(null);
        }
    };

  const handleDeny = async (id) => {
    const reason = window.prompt("Please provide a reason for denying this request:");
    if (reason === null) return; // User cancelled the prompt
    if (!reason.trim()) {
      alert("A reason is required to deny a request.");
      return;
    }

    setProcessingId(id);
    try {
      await axios.post(`/requests/${id}/deny`, { adminNotes: reason });
      fetchRequests(); // Refresh the list after success
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to deny request.');
    } finally {
      setProcessingId(null);
    }
  };

  const renderChanges = (payload) => {
    return Object.entries(payload).map(([key, value]) => {
      // Don't show requesterNotes in the payload view
      if (key === 'requesterNotes') return null;
      return (
        <div key={key} className="text-sm">
          <span className="font-semibold capitalize text-gray-600">{key.replace(/_/g, ' ')}:</span>
          <span className="ml-2 text-indigo-700">{JSON.stringify(value)}</span>
        </div>
      );
    });
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
              <div key={req.id} className="bg-white rounded-lg shadow-md border-l-4 border-yellow-400 overflow-hidden">
                <div className="p-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                    <div>
                      <span className="text-xs font-semibold uppercase text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                        {req.requestType.replace(/_/g, ' ')}
                      </span>
                      <p className="mt-2 text-sm text-gray-500">
                        Request from <strong className="text-gray-800">{req.requester.full_name || req.requester.username}</strong>
                      </p>
                    </div>
                    <div className="flex gap-2 mt-4 sm:mt-0">
                      <button onClick={() => handleApprove(req.id)} disabled={processingId === req.id} className="flex items-center gap-2 bg-green-500 text-white px-3 py-1.5 rounded-md hover:bg-green-600 text-sm font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed">
                        <FaCheck /> Approve
                      </button>
                      <button onClick={() => handleDeny(req.id)} disabled={processingId === req.id} className="flex items-center gap-2 bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 text-sm font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed">
                        <FaTimes /> Deny
                      </button>
                    </div>
                  </div>

                  {req.requesterNotes && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm font-bold text-blue-800">Manager's Notes:</p>
                      <p className="text-sm text-blue-700 mt-1">{req.requesterNotes}</p>
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 p-4 border-t border-gray-200">
                  <p className="text-sm font-bold text-gray-700 mb-2">Proposed Changes:</p>
                  <div className="space-y-1">{renderChanges(req.payload)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </AppLayout>
  );
};

export default ApprovalQueue;