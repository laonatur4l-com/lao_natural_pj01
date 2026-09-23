import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatId, formatCurrency } from '../../utils/formatters';
import { Search, Eye, X, Calendar, User, Phone, MapPin, Package, Clock, TrendingUp, ShoppingBag, Landmark, ArrowUpRight } from 'lucide-react';
import AutoTranslate from '../../components/AutoTranslate';

function TotalRevenue() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending_payment, prepare, sending, received
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/read.php');
      if (res.data?.data) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter orders based on search term, date, and status
  const getFilteredOrders = () => {
    let filtered = orders;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.shipping_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatId('ORD', order.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shipping_phone?.includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Date range filter
    const now = new Date();
    if (dateFilter === 'today') {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate.toDateString() === now.toDateString();
      });
    } else if (dateFilter === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      filtered = filtered.filter(order => new Date(order.created_at) >= oneWeekAgo);
    } else if (dateFilter === 'month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(now.getMonth() - 1);
      filtered = filtered.filter(order => new Date(order.created_at) >= oneMonthAgo);
    }

    return filtered;
  };

  const filteredOrders = getFilteredOrders();

  // Metrics (based on filtered orders where status is NOT pending_payment and NOT payment_rejected)
  const paidOrders = filteredOrders.filter(o => o.status !== 'pending_payment' && o.status !== 'payment_rejected');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total_price), 0);
  const totalOrdersCount = paidOrders.length;
  const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;
  
  // Pending Revenue (awaiting payment verification)
  const pendingOrders = filteredOrders.filter(o => o.status === 'pending_payment');
  const totalPendingRevenue = pendingOrders.reduce((sum, o) => sum + Number(o.total_price), 0);

  const handleViewDetail = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  return (
    <AutoTranslate>
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif text-dark mb-1">Total Revenue</h1>
          <p className="text-gray-400 text-sm">Detailed overview of store sales, income, and customer orders</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8A9A5B] font-medium text-gray-700 transition cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="pending_payment">Awaiting Payment</option>
            <option value="prepare">Preparing</option>
            <option value="sending">Sending</option>
            <option value="received">Received</option>
          </select>

          {/* Date filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8A9A5B] font-medium text-gray-700 transition cursor-pointer"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Past 7 Days</option>
            <option value="month">Past 30 Days</option>
          </select>

          {/* Search Input */}
          <div className="relative flex-1 md:w-64 md:flex-none">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8A9A5B] transition"
            />
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Revenue */}
        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.1em] text-gray-400 font-medium">Total Earned</p>
            <p className="text-2xl font-serif font-semibold text-dark mt-0.5">{formatCurrency(totalRevenue)}</p>
            <p className="text-[10px] text-emerald-600 mt-0.5 flex items-center gap-0.5">
              Exclude pending <ArrowUpRight size={10} />
            </p>
          </div>
        </div>

        {/* Total Sales Count */}
        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.1em] text-gray-400 font-medium">Orders Completed</p>
            <p className="text-2xl font-serif font-semibold text-dark mt-0.5">{totalOrdersCount}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Paid/received items</p>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
            <Landmark size={24} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.1em] text-gray-400 font-medium">Avg Order Value</p>
            <p className="text-2xl font-serif font-semibold text-dark mt-0.5">{formatCurrency(avgOrderValue)}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Per paid transaction</p>
          </div>
        </div>

        {/* Pending Revenue */}
        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.1em] text-gray-400 font-medium">Pending Income</p>
            <p className="text-2xl font-serif font-semibold text-dark mt-0.5">{formatCurrency(totalPendingRevenue)}</p>
            <p className="text-[10px] text-rose-600 mt-0.5">{pendingOrders.length} orders awaiting proof</p>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center justify-center shadow-sm">
          <div className="w-8 h-8 border-2 border-[#8A9A5B] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400 text-sm tracking-widest uppercase">Analyzing sales history...</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-[0.15em] border-b border-gray-50 bg-gray-50/50">
                  <th className="p-6 font-medium">Order ID</th>
                  <th className="p-6 font-medium">Customer Info</th>
                  <th className="p-6 font-medium">Date Issued</th>
                  <th className="p-6 font-medium">Status</th>
                  <th className="p-6 font-medium">Revenue Amount</th>
                  <th className="p-6 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-50">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-6 font-mono font-medium text-dark">{formatId('ORD', order.id)}</td>
                      <td className="p-6 text-gray-600">
                        <div className="flex flex-col">
                          <span className="font-medium text-dark">{order.shipping_name || 'Customer'}</span>
                          <span className="text-xs text-gray-400">{order.shipping_phone}</span>
                        </div>
                      </td>
                      <td className="p-6 text-gray-500">
                        <div className="flex flex-col">
                          <span>{new Date(order.created_at).toLocaleDateString()}</span>
                          <span className="text-xs text-gray-400">{new Date(order.created_at).toLocaleTimeString()}</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className={`px-2.5 py-1 text-[10px] uppercase tracking-widest rounded-full font-medium ${
                          order.status === 'received' ? 'bg-emerald-50 text-emerald-600' :
                          order.status === 'sending' ? 'bg-blue-50 text-blue-600' :
                          order.status === 'prepare' ? 'bg-amber-50 text-amber-600' :
                          'bg-rose-50 text-rose-600'
                        }`}>
                          {order.status === 'pending_payment' ? 'Awaiting Payment' : order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-6 text-dark font-semibold">
                        {formatCurrency(order.total_price)}
                      </td>
                      <td className="p-6 text-right">
                        <button
                          onClick={() => handleViewDetail(order)}
                          className="p-2.5 text-gray-400 hover:text-[#8A9A5B] hover:bg-[#8A9A5B]/10 rounded-xl transition"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-12 text-center text-gray-400">
                      No matching sales or orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-[#F8F6F1]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#8A9A5B]/20 text-[#8A9A5B] rounded-xl">
                  <Package size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-serif text-dark">Order Breakdown</h2>
                  <p className="text-xs text-gray-400 uppercase tracking-widest">{formatId('ORD', selectedOrder.id)}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-dark transition bg-white rounded-full shadow-sm">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Customer Info */}
                <div className="space-y-4">
                  <h3 className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-4">Customer Details</h3>
                  <div className="flex items-start gap-3">
                    <User className="text-[#8A9A5B] shrink-0" size={18} />
                    <div>
                      <p className="text-sm font-medium text-dark">{selectedOrder.shipping_name}</p>
                      <p className="text-xs text-gray-400">Recipient Name</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="text-[#8A9A5B] shrink-0" size={18} />
                    <div>
                      <p className="text-sm font-medium text-dark">{selectedOrder.shipping_phone}</p>
                      <p className="text-xs text-gray-400">Contact Number</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="text-[#8A9A5B] shrink-0" size={18} />
                    <div>
                      <p className="text-sm font-medium text-dark leading-relaxed">{selectedOrder.shipping_address}</p>
                      <p className="text-xs text-gray-400">Shipping Address</p>
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="space-y-4">
                  <h3 className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-4">Order Summary</h3>
                  <div className="flex items-start gap-3">
                    <Calendar className="text-[#8A9A5B] shrink-0" size={18} />
                    <div>
                      <p className="text-sm font-medium text-dark">{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-400">Order Date</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="text-[#8A9A5B] shrink-0" size={18} />
                    <div>
                      <p className="text-sm font-medium text-dark">{new Date(selectedOrder.created_at).toLocaleTimeString()}</p>
                      <p className="text-xs text-gray-400">Order Time</p>
                    </div>
                  </div>
                  <div className="pt-4 mt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Total Paid</p>
                    <p className="text-3xl font-serif text-[#8A9A5B]">{formatCurrency(selectedOrder.total_price)}</p>
                  </div>
                </div>
              </div>

              {/* QR Receipt Proof */}
              {selectedOrder.payment_screenshot && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-3">BCEL One QR Receipt</h3>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <a 
                      href={selectedOrder.payment_screenshot} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="block w-48 h-32 border border-gray-200 rounded-xl overflow-hidden shadow-sm group hover:border-[#8A9A5B] transition relative shrink-0"
                    >
                      <img 
                        src={selectedOrder.payment_screenshot} 
                        alt="Payment Proof Receipt" 
                        className="w-full h-full object-cover group-hover:scale-105 transition" 
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <span className="text-white text-[10px] font-semibold uppercase tracking-widest">Open Slip</span>
                      </div>
                    </a>
                    
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Verify BCEL One transaction amount with the customer slip.
                      </p>
                      {selectedOrder.status === 'pending_payment' && (
                        <button
                          onClick={async () => {
                            try {
                              await api.put('/orders/update_status.php', { id: selectedOrder.id, status: 'prepare' });
                              selectedOrder.status = 'prepare';
                              setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status: 'prepare' } : o));
                              alert("Payment verified!");
                            } catch (err) {
                              alert("Failed to verify status.");
                            }
                          }}
                          className="px-4 py-2 bg-[#8A9A5B] hover:bg-dark text-white rounded-lg text-xs uppercase tracking-widest transition font-medium shadow-sm"
                        >
                          Verify & Approve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Items Ordered Table */}
              <div className="mt-8 pt-8 border-t border-gray-100">
                <h3 className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-4">Purchased Items</h3>
                <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-widest text-gray-400 bg-white border-b border-gray-100">
                        <th className="p-4 text-left font-medium">Product</th>
                        <th className="p-4 text-center font-medium">Qty</th>
                        <th className="p-4 text-right font-medium">Price</th>
                        <th className="p-4 text-right font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedOrder.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-4 font-medium text-dark">{item.name}</td>
                          <td className="p-4 text-center text-gray-600">{item.quantity}</td>
                          <td className="p-4 text-right text-gray-500">{formatCurrency(item.price)}</td>
                          <td className="p-4 text-right font-semibold text-dark">{formatCurrency(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 bg-dark text-white rounded-xl text-sm hover:bg-black transition shadow-lg shadow-dark/20"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AutoTranslate>
  );
}

export default TotalRevenue;
