// src/pages/Receipt.jsx

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout'; // Use the smart Layout component
import axios from '../api/axios';
import { useReactToPrint } from 'react-to-print';
//import AppLayout from '../components/AppLayout';
const Receipt = () => {
    const { id } = useParams();
    const [receiptData, setReceiptData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const printRef = useRef();
   
    useEffect(() => {
        const fetchReceipt = async () => {
            try {
                setLoading(true);
                // The API call is the same for both admin and waiter
                const response = await axios.get(`/receipts/${id}`);
                setReceiptData(response.data);
                setError(null);
            } catch (err) {
                setError('Failed to fetch receipt data.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchReceipt();
    }, [id]);
    
    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: `Receipt-Order-${id}`,
    });


return (
        // The Layout component will automatically render the correct sidebar (Admin or Waiter)
        <Layout>
            <div className="p-4 sm:p-6 lg:p-10 flex flex-col items-center bg-gray-100 min-h-full">
                {loading && <div className="flex justify-center items-center h-full">Loading receipt...</div>}
                {error && <div className="flex justify-center items-center h-full text-red-500 font-semibold">{error}</div>}
                
                {receiptData && (
                    <>
                        {/* This is the printable area */}
                        <div ref={printRef} className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-gray-800">
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold">MenuMaster</h1>
                                <p className="text-gray-500">Official Receipt</p>
                            </div>
                            <div className="flex justify-between text-sm mb-6 pb-4 border-b">
                                <div>
                                    <p><span className="font-semibold">Order ID:</span> MM-{receiptData.orderId}</p>
                                    <p><span className="font-semibold">Date:</span> {new Date(receiptData.date).toLocaleDateString()}</p>
                                    <p><span className="font-semibold">Time:</span> {new Date(receiptData.date).toLocaleTimeString()}</p>
                                </div>
                                <div>
                                    <p><span className="font-semibold">Customer:</span> {receiptData.customerName}</p>
                                    <p><span className="font-semibold">Server:</span> {receiptData.waiterName}</p>
                                    <p><span className="font-semibold">Table:</span> {receiptData.table || 'N/A'}</p>
                                </div>
                            </div>
                            <table className="w-full mb-6">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left font-semibold pb-2">Item</th>
                                        <th className="text-center font-semibold pb-2">Qty</th>
                                        <th className="text-right font-semibold pb-2">Price</th>
                                        <th className="text-right font-semibold pb-2">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {receiptData.items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="py-2">{item.name}</td>
                                            <td className="text-center py-2">{item.qty}</td>
                                            {/* --- CHANGE: Removed '$' --- */}
                                            <td className="text-right py-2">{item.price.toFixed(2)}</td>
                                            {/* --- CHANGE: Removed '$' --- */}
                                            <td className="text-right py-2">{item.total.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="border-t pt-4">
                                <div className="flex justify-between font-bold text-2xl mt-2">
                                    <span>TOTAL:</span>
                                    {/* --- CHANGE: Removed '$' --- */}
                                    <span>{receiptData.total.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="text-center mt-8 text-gray-600">
                                <p>Thank you for your order!</p>
                            </div>
                        </div>

                        <button
                            onClick={handlePrint}
                            className="mt-8 bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
                        >
                            Print Receipt
                        </button>
                    </>
                )}
            </div>
        </Layout>
    );
};
export default Receipt;