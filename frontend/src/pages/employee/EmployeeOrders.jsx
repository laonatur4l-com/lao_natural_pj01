import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Search, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatId } from '../../utils/formatters';
import AutoTranslate from '../../components/AutoTranslate';

function EmployeeOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/read.php');
      if (res.data?.data) setOrders(res.data.data);
    } catch (err) {
      console.error("Failed to load orders", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    let rejectionReason = null;
    if (newStatus === 'payment_rejected') {
      rejectionReason = prompt("Please enter the reason for rejecting payment:");
      if (rejectionReason === null) {
        return;
      }
      if (!rejectionReason.trim()) {
        alert("Rejection reason is required.");
        return;
      }
      rejectionReason = rejectionReason.trim();
    }
    try {
      await api.put('/orders/update_status.php', { id, status: newStatus, rejection_reason: rejectionReason });
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus, rejection_reason: rejectionReason } : o));
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'pending_payment', label: 'Pending' },
    { key: 'payment_rejected', label: 'Rejected' },
    { key: 'prepare', label: 'Preparing' },
    { key: 'sending', label: 'Shipping' },
    { key: 'received', label: 'Received' },
  ];

  const filtered = orders
    .filter(o => filter === 'all' || o.status === filter)
    .filter(o =>
      o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_email?.toLowerCase().includes(search.toLowerCase()) ||
      String(o.id).includes(search)
    );

  const statusColors = {
    pending_payment: 'bg-gray-100 text-gray-600',
    payment_rejected: 'bg-red-50 text-red-600 border border-red-100',
    prepare: 'bg-amber-50 text-amber-700',
    sending: 'bg-blue-50 text-blue-700',
    received: 'bg-emerald-50 text-emerald-700',
  };

  return (
    <AutoTranslate>
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-serif text-dark mb-1">Orders & Shipping</h1>
        <p className="text-gray-400 text-sm">Manage order statuses and shipping</p>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-2 rounded-md text-xs sm:text-sm transition-all ${
                filter === tab.key ? 'bg-white shadow-sm text-dark font-medium' : 'text-gray-400 hover:text-dark'
              }`}
            >
              {tab.label}
              {tab.key !== 'all' && (
                <span className="ml-1 text-xs text-gray-400">
                  ({orders.filter(o => o.status === tab.key).length})
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#8A9A5B] bg-white w-64"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <div className="w-6 h-6 border-2 border-[#8A9A5B] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="text-left p-4 font-medium">Order #</th>
                <th className="text-left p-4 font-medium">Customer</th>
                <th className="text-left p-4 font-medium">Date</th>
                <th className="text-left p-4 font-medium">Total</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Update Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filtered.map(order => (
                <tr key={order.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition">
                  <td className="p-4 font-medium">
                    <Link to={`/order/${order.id}`} className="text-[#8A9A5B] hover:text-dark hover:underline transition">
                      {formatId('ORD', order.id)}
                    </Link>
                  </td>
                  <td className="p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-dark">{order.customer_name}</span>
                        {order.status === 'pending_payment' && (
                          <span className="text-red-500 font-semibold text-xs px-1.5 py-0.5 bg-red-50 rounded border border-red-100 animate-pulse">
                            New
                          </span>
                        )}
                      </div>
                      <span className="block text-xs text-gray-400">{order.customer_email}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-500 text-xs">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="p-4 text-dark font-medium">{formatCurrency(order.total_price)}</td>
                  <td className="p-4">
                    <span className={`inline-block px-2.5 py-1 text-xs rounded-full font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className="bg-white border border-gray-200 text-xs p-2 rounded-lg focus:outline-none focus:border-[#8A9A5B] cursor-pointer"
                    >
                      <option value="pending_payment">Pending Payment</option>
                      <option value="payment_rejected">Payment Rejected</option>
                      <option value="prepare">Prepare</option>
                      <option value="sending">Sending</option>
                      <option value="received">Received</option>
                    </select>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="p-12 text-center text-gray-400">No orders found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </AutoTranslate>
  );
}

export default EmployeeOrders;
