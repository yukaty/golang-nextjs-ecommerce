'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

// Order item data type definition
interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
}

// Final response type definition (order data with item details array)
// NOTE: Status values must match backend API responses - requires backend translation
interface OrderData {
  id: number;
  totalPrice: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Completed' | 'Canceled' | 'Refunded';
  paymentStatus: 'Unpaid' | 'Payment Processing' | 'Payment Successful' | 'Payment Failed' | 'Refund Processing' | 'Refunded';
  createdAt: string;
  items: OrderItem[]; // Array of item details
}

// Order history page
export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch order data on initial load
  useEffect(() => {
    const getOrders = async () => {
      try {
        const res = await fetch('/api/orders');
        const data = await res.json();
        if (!res.ok) {
          setErrorMessage(data.error || 'Failed to load order history.');
          setLoading(false); // End loading
          return;
        }
        setOrders(data.orders); // Update order history data
      } catch (err) {
        console.error(err);
        setErrorMessage('A connection error occurred.');
      } finally {
        setLoading(false); // End loading
      }
    };

    // Fetch order history data
    getOrders();
  }, []);

  if (loading) return <div className="text-center py-12 text-stone-600 text-lg">Loading order history...</div>;
  if (errorMessage) return <p className="text-center py-12 text-red-600">{errorMessage}</p>;
  if (orders.length === 0) return <p className="text-center py-12 text-stone-500">No order history found.</p>;

  // Determine display style based on status
  const getStatusStyle = (status: OrderData['status'] | OrderData['paymentStatus']) => {
    switch (status) {
      case 'Pending':
      case 'Processing':
      case 'Unpaid':
      case 'Payment Processing':
      case 'Refund Processing': // In progress or requires attention
        return 'text-yellow-500';
      case 'Shipped':
      case 'Completed':
      case 'Payment Successful': // Positive completion status
        return 'text-green-500';
      case 'Canceled':
      case 'Payment Failed':
      case 'Refunded': // Negative final status
        return 'text-red-500';
      default:
        return 'text-stone-500'; // Default color
    }
  };

  // Common table styles
  const tableStyle = 'px-3 py-2 border-b';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="my-4">
        <Link href="/account" className="text-forest-600 hover:underline">
          ← Back to My Account
        </Link>
      </div>
      <h1 className="text-center mb-8">Order History</h1>
      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="border rounded-lg shadow-sm p-4">
            <div className="flex justify-between mb-4">
              <div>
                <p className="text-lg font-semibold">Order ID: {order.id}</p>
                <p>Order Date: {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}</p>
              </div>
              <div className="text-right font-semibold">
                <p className="text-blue-600 text-xl">Total: ${order.totalPrice.toLocaleString()} (incl. shipping)</p>
                <p className={getStatusStyle(order.status)}>Order Status: {order.status}</p>
                <p className={getStatusStyle(order.paymentStatus)}>Payment Status: {order.paymentStatus}</p>
              </div>
            </div>

            <table className="w-full text-left border-t border-stone-200 shadow-lg rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-stone-100 text-stone-700">
                  <th className={tableStyle}>Product Name</th>
                  <th className={tableStyle}>Quantity</th>
                  <th className={tableStyle}>Unit Price (incl. tax)</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr key={index} className="hover:bg-stone-50">
                    <td className={tableStyle}>{item.productName}</td>
                    <td className={tableStyle}>{item.quantity}</td>
                    <td className={tableStyle}>${item.unitPrice.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}