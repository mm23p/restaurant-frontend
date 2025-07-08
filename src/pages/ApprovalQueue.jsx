// src/pages/ApprovalQueue.jsx

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '../components/AppLayout';
import axios from '../api/axios';
import { FaHourglassHalf, FaCheck, FaTimes, FaPlus, FaTrashAlt, FaPen } from 'react-icons/fa';
import AppSidebar from '../components/AppSidebar';

// A helper component to render the details of a specific request type
const RequestCard = ({ req, onApprove, onDeny, isProcessing }) => {
    let title, icon, payload, notes;

    switch (req.type) {
        case 'MENU_ITEM_ADD':
            title = "New Item for Approval";
            icon = <FaPlus className="text-green-500" />;
            payload = req.payload; // For ADD, the payload is the full item
            notes = req.notes;
            break;
        case 'MENU_ITEM_EDIT':
            title = "Edit Request";
            icon = <FaPen className="text-blue-500" />;
            payload = req.payload;
            notes = req.notes;
            break;
        case 'MENU_ITEM_DELETE':
            title = "Delete Request";
            icon = <FaTrashAlt className="text-red-500" />;
            payload = req.payload;
            notes = req.notes;
            break;
        default:
            return null; // Or some fallback UI
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
                        <button onClick={() => onApprove(req.id)} disabled={isProcessing} className="flex items-center gap-2 bg-green-500 text-white px-3 py-1.5 rounded-md hover:bg-green-600 text-sm font-semibold disabled:bg-gray-400">
                            <FaCheck /> Approve
                        </button>
                        <button onClick={() => onDeny(req.id, req.type)} disabled={isProcessing} className="flex items-center gap-2 bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 text-sm font-semibold disabled:bg-gray-400">
                            <FaTimes /> Deny
                        </button>
                    </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                    Requested by <strong className="text-gray-800">{req.requester?.full_name || 'Manager'}</strong>
                </p>
            </div>
            <div className="bg-gray-50 p-4 border-t border-gray-200 space-y-2">
                <div>
                    <p className="text-sm font-bold text-gray-700">Details:</p>
                    <pre className="bg-gray-100 p-2 rounded-md text-xs mt-1 whitespace-pre-wrap">
                        {JSON.stringify(payload, null, 2)}
                    </pre>
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
            setError(null);
            // --- FIX 1: Fetch from the new unified endpoint ---
            const res = await axios.get('/api/approvals/pending');
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

    const handleApprove = async (id) => {
        setProcessingId(id);
        try {
            // --- FIX 2: Send approval to the new unified endpoint ---
            await axios.post(`/api/approvals/${id}/approve`, {});
            fetchRequests(); // Refresh the list
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to approve request.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleDeny = async (id, type) => {
        let reason;
        // For MENU_ITEM_ADD, denying means deleting the draft, which is a big step.
        // For other types, it's just rejecting a change.
        if (type === 'MENU_ITEM_ADD') {
            if (!window.confirm("Denying this will permanently delete the draft menu item. Are you sure?")) return;
            reason = "Draft item rejected by admin."; // A default reason
        } else {
            reason = window.prompt("Please provide a reason for denying this request:");
            if (reason === null) return;
            if (!reason.trim()) {
                alert("A reason is required to deny.");
                return;
            }
        }
        
        setProcessingId(id);
        try {
            // --- FIX 3: Send denial to a new unified endpoint ---
            // Note: You will need to create this /deny route in approvalRoutes.js as well.
            await axios.post(`/api/approvals/${id}/deny`, { adminNotes: reason });
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
                        {/* --- FIX 4: Use the new RequestCard component to render each item --- */}
                        {requests.map(req => (
                            <RequestCard
                                key={req.id}
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