import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { formatId, formatCurrency, getThbPrice, getUsdPrice } from '../../utils/formatters';
import { Search, Eye, X, Calendar, User, Phone, MapPin, Package, Clock, Printer, FileText, ChevronDown, CheckCircle, AlertCircle, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AutoTranslate from '../../components/AutoTranslate';

function Reports() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const printAreaRef = useRef();

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

  // Date filtering logic
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

  // Metric calculations based on filtered completed/verified orders (status is not pending_payment and not payment_rejected)
  const paidOrders = filteredOrders.filter(o => o.status !== 'pending_payment' && o.status !== 'payment_rejected');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total_price), 0);
  const totalShipping = paidOrders.reduce((sum, o) => sum + Number(o.shipping_cost || 0), 0);
  const totalSalesCount = paidOrders.length;
  const totalItemsSold = paidOrders.reduce((sum, o) => {
    return sum + (o.items?.reduce((iSum, item) => iSum + Number(item.quantity), 0) || 0);
  }, 0);

  const handlePrint = () => {
    const originalTitle = document.title;
    const invNo = selectedOrder ? formatId('LN-2026/T', selectedOrder.id) : 'Invoice';
    document.title = `Invoice_${invNo.replace(/\//g, '-')}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const openInvoice = (order) => {
    setSelectedOrder(order);
    setShowInvoice(true);
  };

  const itemsSubtotal = selectedOrder?.items?.reduce((sum, item) => sum + Number(item.price * item.quantity), 0) || 0;
  const itemsSubtotalThb = selectedOrder?.items?.reduce((sum, item) => {
    return sum + (getThbPrice(item.price_lak || item.price) * item.quantity);
  }, 0) || getThbPrice(itemsSubtotal);
  const itemsSubtotalUsd = selectedOrder?.items?.reduce((sum, item) => {
    return sum + (getUsdPrice(item.price_lak || item.price) * item.quantity);
  }, 0) || getUsdPrice(itemsSubtotal);

  const vatAmount = itemsSubtotal * 0.10;
  const vatAmountThb = itemsSubtotalThb * 0.10;
  const vatAmountUsd = itemsSubtotalUsd * 0.10;

  const shippingCostLAK = Number(selectedOrder?.shipping_cost || 0);
  const shippingCostThb = getThbPrice(shippingCostLAK);
  const shippingCostUsd = getUsdPrice(shippingCostLAK);

  const grandTotal = itemsSubtotal + vatAmount + shippingCostLAK;
  const grandTotalThb = itemsSubtotalThb + vatAmountThb + shippingCostThb;
  const grandTotalUsd = itemsSubtotalUsd + vatAmountUsd + shippingCostUsd;
  const itemsCount = selectedOrder?.items?.length || 0;
  const isCompact = itemsCount < 5;

  return (
    <AutoTranslate>
      <div className="p-8 max-w-7xl mx-auto print:p-0 print:bg-white">
      {/* Web Only Heading */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 print:hidden">
        <div>
          <h1 className="text-3xl font-serif text-dark mb-1">Reports & Invoices</h1>
          <p className="text-gray-400 text-sm font-light">Generate and print authentic Lao Natural Sole Co. invoices and track transactions</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Date Filter Dropdown */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#8A9A5B] font-medium text-gray-700 transition-colors cursor-pointer"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Past 7 Days</option>
            <option value="month">Past 30 Days</option>
          </select>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#8A9A5B] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Web Only Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 print:hidden">
        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400">Total Revenue</p>
            <p className="text-2xl font-serif font-semibold text-dark mt-0.5">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400">Invoices Paid</p>
            <p className="text-2xl font-serif font-semibold text-dark mt-0.5">{totalSalesCount}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl">
            <Package size={24} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400">Products Sold</p>
            <p className="text-2xl font-serif font-semibold text-dark mt-0.5">{totalItemsSold} pcs</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400">Shipping Collected</p>
            <p className="text-2xl font-serif font-semibold text-dark mt-0.5">{formatCurrency(totalShipping)}</p>
          </div>
        </div>
      </div>

      {/* Web Only Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center justify-center shadow-sm print:hidden">
          <div className="w-8 h-8 border-2 border-[#8A9A5B] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400 text-sm tracking-widest uppercase">Compiling sales reports...</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden print:hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-[0.15em] border-b border-gray-50 bg-gray-50/50">
                  <th className="p-6 font-medium">Invoice No</th>
                  <th className="p-6 font-medium">Customer Name</th>
                  <th className="p-6 font-medium">Date Issued</th>
                  <th className="p-6 font-medium">Total Paid</th>
                  <th className="p-6 font-medium">Status</th>
                  <th className="p-6 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-50">
                {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-6 font-mono font-medium text-dark">LN-2026/T{order.id.toString().padStart(3, '0')}</td>
                    <td className="p-6 text-gray-600">
                      <div className="flex flex-col">
                        <span className="font-medium text-dark">{order.shipping_name || 'Customer'}</span>
                        <span className="text-xs text-gray-400">{order.province || 'Luang Prabang'}</span>
                      </div>
                    </td>
                    <td className="p-6 text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-6 text-dark font-semibold">{formatCurrency(order.total_price)}</td>
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
                    <td className="p-6 text-right">
                      <button
                        onClick={() => openInvoice(order)}
                        className="px-4 py-2 bg-[#8A9A5B] hover:bg-dark text-white rounded-lg text-xs uppercase tracking-widest transition-colors font-medium shadow-sm flex items-center gap-1.5 ml-auto"
                      >
                        <Printer size={12} />
                        Invoice
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="p-12 text-center text-gray-400">
                      No invoices found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* High-Fidelity Printable Invoice Modal */}
      {showInvoice && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 bg-black/40 backdrop-blur-sm print:relative print:inset-auto print:bg-white print:p-0 print:z-auto" onClick={() => setShowInvoice(false)}>
          <div 
            className="bg-white rounded-none md:rounded-3xl w-full max-w-4xl shadow-2xl h-full md:h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 print:shadow-none print:h-auto print:w-full print:max-w-none print:static" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header — Web Only */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50 print:hidden shrink-0">
              <div className="flex items-center gap-3">
                <FileText className="text-[#8A9A5B]" size={24} />
                <div>
                  <h2 className="text-lg font-serif text-dark">Invoice Preview</h2>
                  <p className="text-xs text-gray-400">Preview and print official commercial sales receipt</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="px-5 py-2.5 bg-[#8A9A5B] hover:bg-dark text-white rounded-xl text-xs uppercase tracking-widest font-medium transition-colors shadow-md flex items-center gap-1.5"
                >
                  <Printer size={14} />
                  Print / Save PDF
                </button>
                <button onClick={() => setShowInvoice(false)} className="p-2 text-gray-400 hover:text-dark transition-colors bg-white rounded-full border border-gray-100 shadow-sm">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body — The actual A4 Print Sheet */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#fdfdfd] print:overflow-visible print:p-0 print:bg-white">
              {/* Printable Invoice Page Container */}
              <div id="print-area" ref={printAreaRef} className={`bg-white text-black font-sans max-w-4xl mx-auto select-text print:text-black print:p-0 leading-normal text-xs ${isCompact ? 'print-compact' : ''}`}>
                
                {/* 1. Centered Header & Logo */}
                <div className="border border-black p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <img src="/lao_logo_transparent.png" alt="Lao Natural Logo" className="h-16 w-auto object-contain shrink-0" />
                    <div className="text-center flex-1 pr-16">
                      <h1 className="text-xl font-bold tracking-tight text-black font-sans uppercase">Lao Natural Sole Co.,Ltd</h1>
                      <p className="text-[10px] text-black mt-1 leading-relaxed">
                        #18 Ban Phasouk Village, Ket Visoun Area, Luangprabang district, Luangprabang province, Laos PDR<br />
                        Tel: +856 30 9904 780, M: +856 20 76 184 544
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#7CB942] text-white font-bold text-sm py-1.5 mt-2 uppercase tracking-widest text-center">
                    INVOICE
                  </div>
                </div>

                {/* 2. Customer & Invoice Info Double Column Grid Table */}
                <table className="w-full border-collapse border border-black mb-4 text-xs font-sans">
                  <tbody>
                    <tr className="divide-x divide-black border-b border-black">
                      <td className="w-1/2 p-1.5">
                        <div className="flex">
                          <span className="font-bold w-32 shrink-0">Customer Name:</span>
                          <span className="text-black font-medium">{selectedOrder.shipping_name || 'Customer'}</span>
                        </div>
                      </td>
                      <td className="w-1/2 p-1.5">
                        <div className="flex">
                          <span className="font-bold w-28 shrink-0">Invoice No.:</span>
                          <span className="text-black font-mono font-bold">LN-2026/T{selectedOrder.id.toString().padStart(3, '0')}</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="divide-x divide-black border-b border-black">
                      <td className="p-1.5">
                        <div className="flex">
                          <span className="font-bold w-32 shrink-0">Customer Address:</span>
                          <span className="text-black">{selectedOrder.shipping_address || selectedOrder.province || '-'}</span>
                        </div>
                      </td>
                      <td className="p-1.5">
                        <div className="flex">
                          <span className="font-bold w-28 shrink-0">Invoice Date:</span>
                          <span className="text-black">{new Date(selectedOrder.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="divide-x divide-black border-b border-black">
                      <td className="p-1.5">
                        <div className="flex">
                          <span className="font-bold w-32 shrink-0">Attention:</span>
                          <span className="text-black">{selectedOrder.shipping_name || 'Casey Tolzman'}</span>
                        </div>
                      </td>
                      <td className="p-1.5">
                        <div className="flex">
                          <span className="font-bold w-28 shrink-0">Sales Person:</span>
                          <span className="text-black font-semibold">{user?.name || 'Ms Kop'}</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="divide-x divide-black border-b border-black">
                      <td className="p-1.5">
                        <div className="flex">
                          <span className="font-bold w-32 shrink-0">E-mail:</span>
                          <span className="text-black">{selectedOrder.customer_email || '-'}</span>
                        </div>
                      </td>
                      <td className="p-1.5">
                        <div className="flex">
                          <span className="font-bold w-28 shrink-0">E-mail:</span>
                          <span className="text-black">-</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="divide-x divide-black">
                      <td className="p-1.5">
                        <div className="flex">
                          <span className="font-bold w-32 shrink-0">Contact Detail:</span>
                          <span className="text-black font-medium">{selectedOrder.shipping_phone || '-'}</span>
                        </div>
                      </td>
                      <td className="p-1.5">
                        <div className="flex">
                          <span className="font-bold w-28 shrink-0">Contact Detail:</span>
                          <span className="text-black font-medium">+856 20 78 706 840</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* 3. Items Ordered Table */}
                <table className="w-full border-collapse border border-black mb-4 text-xs font-sans">
                  <thead>
                    <tr className="bg-[#7CB942] text-black font-bold divide-x divide-black border-b border-black text-center">
                      <th className="p-1 w-12">Item</th>
                      <th className="p-1 w-24">Picture</th>
                      <th className="p-1">Description</th>
                      <th className="p-1 w-14">Qty</th>
                      <th className="p-1 w-14">Unit</th>
                      <th className="p-1 w-28">Unit price</th>
                      <th className="p-1 w-36">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    {selectedOrder.items?.map((item, index) => {
                      const itemThb = getThbPrice(item.price_lak || item.price);
                      const itemUsd = getUsdPrice(item.price_lak || item.price);
                      return (
                        <tr key={index} className="divide-x divide-black text-center align-middle">
                          <td className="p-2 font-bold">{index + 1}</td>
                          <td className="p-1">
                            <div className="w-16 h-16 bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto overflow-hidden">
                              {item.image_url ? (
                                <img 
                                  src={item.image_url} 
                                  alt={item.name} 
                                  className="w-full h-full object-cover" 
                                  onError={(e) => { 
                                    e.target.onerror = null; 
                                    e.target.src = '/lao_logo_transparent.png'; 
                                  }} 
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center text-[9px] text-gray-400 font-light leading-none">
                                  <span>Lao</span>
                                  <span>Natural</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-2 text-left font-medium">
                            {item.name} {item.size || item.selectedSize ? `( ${item.size || item.selectedSize} )` : ''}
                          </td>
                          <td className="p-2 font-semibold">{item.quantity}</td>
                          <td className="p-2">pcs</td>
                          <td className="p-1.5 text-right font-mono text-[11px] leading-tight">
                            <div>LAK {formatCurrency(item.price).replace('₭', '').trim()}</div>
                            <div className="text-[10px] text-gray-500 font-normal">฿ {formatCurrency(itemThb, 'THB').replace('฿', '').trim()}</div>
                            <div className="text-[10px] text-gray-500 font-normal">$ {formatCurrency(itemUsd, 'USD').replace('$', '').trim()}</div>
                          </td>
                          <td className="p-1.5 text-right font-mono text-[11px] leading-tight">
                            <div className="font-bold">LAK {formatCurrency(item.price * item.quantity).replace('₭', '').trim()}</div>
                            <div className="text-[10px] text-gray-500 font-normal">฿ {formatCurrency(itemThb * item.quantity, 'THB').replace('฿', '').trim()}</div>
                            <div className="text-[10px] text-gray-500 font-normal">$ {formatCurrency(itemUsd * item.quantity, 'USD').replace('$', '').trim()}</div>
                          </td>
                        </tr>
                      );
                    })}
                    
                    {/* Optional Shipping Row */}
                    {Number(selectedOrder.shipping_cost) > 0 && (
                      <tr className="divide-x divide-black text-center align-middle">
                        <td className="p-2 font-bold">#</td>
                        <td className="p-1">
                          <div className="w-16 h-16 bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto overflow-hidden text-xl">
                            🚚
                          </div>
                        </td>
                        <td className="p-2 text-left font-medium">
                          Provincial Shipping Fee ({selectedOrder.province})
                        </td>
                        <td className="p-2 font-semibold">1</td>
                        <td className="p-2">trip</td>
                        <td className="p-1.5 text-right font-mono text-[11px] leading-tight">
                          <div>LAK {formatCurrency(selectedOrder.shipping_cost).replace('₭', '').trim()}</div>
                          <div className="text-[10px] text-gray-500">฿ {formatCurrency(shippingCostThb, 'THB').replace('฿', '').trim()}</div>
                          <div className="text-[10px] text-gray-500">$ {formatCurrency(shippingCostUsd, 'USD').replace('$', '').trim()}</div>
                        </td>
                        <td className="p-1.5 text-right font-mono text-[11px] leading-tight">
                          <div>LAK {formatCurrency(selectedOrder.shipping_cost).replace('₭', '').trim()}</div>
                          <div className="text-[10px] text-gray-500">฿ {formatCurrency(shippingCostThb, 'THB').replace('฿', '').trim()}</div>
                          <div className="text-[10px] text-gray-500">$ {formatCurrency(shippingCostUsd, 'USD').replace('$', '').trim()}</div>
                        </td>
                      </tr>
                    )}

                    {/* Subtotal Row */}
                    <tr className="divide-x divide-black font-bold">
                      <td colSpan="5" className="p-1.5 text-center uppercase tracking-wider bg-[#E7F5D9] align-middle">ຍອດລວມ / Subtotal</td>
                      <td className="p-1.5 text-right bg-[#E7F5D9] text-[10px] leading-tight align-middle">
                        <div>LAK</div>
                        <div className="text-gray-600 font-normal">THB</div>
                        <div className="text-gray-600 font-normal">USD</div>
                      </td>
                      <td className="p-1.5 text-right bg-[#7CB942] text-black font-mono leading-tight align-middle">
                        <div>{formatCurrency(itemsSubtotal).replace('₭', '').trim()}</div>
                        <div className="text-[10px] font-normal">฿ {formatCurrency(itemsSubtotalThb, 'THB').replace('฿', '').trim()}</div>
                        <div className="text-[10px] font-normal">$ {formatCurrency(itemsSubtotalUsd, 'USD').replace('$', '').trim()}</div>
                      </td>
                    </tr>
                    {/* VAT Row */}
                    <tr className="divide-x divide-black font-bold text-red-600">
                      <td colSpan="5" className="p-1.5 text-center uppercase tracking-wider bg-[#E7F5D9] align-middle">VAT 10%</td>
                      <td className="p-1.5 text-right bg-[#E7F5D9] text-[10px] leading-tight align-middle">
                        <div>LAK</div>
                        <div className="text-red-500 font-normal">THB</div>
                        <div className="text-red-500 font-normal">USD</div>
                      </td>
                      <td className="p-1.5 text-right bg-[#E7F5D9] font-mono leading-tight align-middle">
                        <div>{formatCurrency(vatAmount).replace('₭', '').trim()}</div>
                        <div className="text-[10px] font-normal">฿ {formatCurrency(vatAmountThb, 'THB').replace('฿', '').trim()}</div>
                        <div className="text-[10px] font-normal">$ {formatCurrency(vatAmountUsd, 'USD').replace('$', '').trim()}</div>
                      </td>
                    </tr>
                    {/* Grand Total Row */}
                    <tr className="divide-x divide-black font-bold">
                      <td colSpan="5" className="p-1.5 text-center uppercase tracking-wider bg-[#E7F5D9] align-middle">ຍອດລວມ / Grand Total</td>
                      <td className="p-1.5 text-right bg-[#E7F5D9] text-[10px] leading-tight align-middle">
                        <div>LAK</div>
                        <div className="text-gray-600 font-normal">THB</div>
                        <div className="text-gray-600 font-normal">USD</div>
                      </td>
                      <td className="p-1.5 text-right bg-[#7CB942] text-black font-mono leading-tight align-middle">
                        <div>{formatCurrency(grandTotal).replace('₭', '').trim()}</div>
                        <div className="text-[10px] font-bold">฿ {formatCurrency(grandTotalThb, 'THB').replace('฿', '').trim()}</div>
                        <div className="text-[10px] font-bold">$ {formatCurrency(grandTotalUsd, 'USD').replace('$', '').trim()}</div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* 4. Terms and Payment splits Grid */}
                <table className="w-full border-collapse border border-black mb-4 text-xs font-sans print-avoid-break">
                  <thead>
                    <tr className="border-b border-black">
                      <th colSpan="4" className="text-left p-1 bg-gray-50 font-bold uppercase tracking-wider">Terms & Conditions:</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-black">
                      <td className="p-1.5 font-bold w-48 border-r border-black">Remarks:</td>
                      <td colSpan="3" className="p-1.5">Photo for reference only; Price is exclusive of VAT</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="p-1.5 font-bold border-r border-black">Validity period:</td>
                      <td colSpan="3" className="p-1.5">30 days only</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="p-1.5 font-bold border-r border-black">Estimated delivery:</td>
                      <td colSpan="3" className="p-1.5">10-15 days working days</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="p-1.5 font-bold border-r border-black">Payment Term:</td>
                      <td colSpan="3" className="p-1.5 bg-gray-50 font-bold">Breakdown</td>
                    </tr>
                    <tr className="border-b border-black divide-x divide-black text-center align-middle">
                      <td className="p-1.5 text-left font-semibold">Deposit payment before start production</td>
                      <td className="p-1.5 w-24">100%</td>
                      <td className="p-1.5 w-44 font-mono text-right text-[10px] leading-tight">
                        <div>LAK {formatCurrency(grandTotal).replace('₭', '').trim()}</div>
                        <div className="text-gray-600">฿ {formatCurrency(grandTotalThb, 'THB').replace('฿', '').trim()}</div>
                        <div className="text-gray-600">$ {formatCurrency(grandTotalUsd, 'USD').replace('$', '').trim()}</div>
                      </td>
                      <td className="p-1.5 text-left text-gray-500">Due Date: ...../...../.....</td>
                    </tr>
                    <tr className="divide-x divide-black text-center">
                      <td className="p-1.5 text-left font-semibold">Balance payment after Received Goods</td>
                      <td className="p-1.5">0%</td>
                      <td className="p-1.5">LAK -</td>
                      <td className="p-1.5 text-left text-gray-500">Due Date: ...../...../.....</td>
                    </tr>
                  </tbody>
                </table>

                {/* 5. BCEL One Bank Details & QR */}
                <div className="flex gap-4 mb-4 text-xs font-sans print-avoid-break">
                  {/* Bank Details Table Box */}
                  <div className="flex-1 border border-black p-3 space-y-1">
                    <div className="font-bold border-b border-black pb-1 uppercase tracking-wider mb-2">BENEFICIARY BANK DETAILS:</div>
                    <div className="grid grid-cols-4 gap-1">
                      <span className="font-bold col-span-1">Beneficiary Bank:</span>
                      <span className="col-span-3 font-bold">BANQUE POUR LE COMMERCE EXTERIEUR LAO PUBLIC (BCEL)</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      <span className="font-bold col-span-1">Bank Address:</span>
                      <span className="col-span-3 text-gray-700">Kaisone Road, PhonPheang Village, Luangprabang District, Luangprabang Province</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      <span className="font-bold col-span-1">Swift Code:</span>
                      <span className="col-span-3 font-semibold">COEBLALA</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      <span className="font-bold col-span-1">VAT Status:</span>
                      <span className="col-span-3 text-gray-700">Taxable account VAT %</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      <span className="font-bold col-span-1">Beneficiary:</span>
                      <span className="col-span-3 font-bold">LAO NATURAL AND ORGANIC CO.,LTD</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 pt-1 border-t border-dashed border-gray-300">
                      <span className="font-bold col-span-1">Account No.:</span>
                      <div className="col-span-3 font-mono font-bold space-y-0.5">
                        <div>050-12-36219162 LAK</div>
                        <div>050-12-36219461 USD</div>
                        <div>050-12-36219313 THB</div>
                      </div>
                    </div>
                  </div>

                  {/* QR Codes Box — Enlarged for A4 Scanning */}
                  <div className="w-[360px] border border-black p-2.5 flex flex-col justify-center items-center gap-1.5 shrink-0 bg-white">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-black mb-0.5">BCEL ONE QR PAYMENT</div>
                    <div className="flex gap-2 justify-between items-center w-full">
                      <div className="flex flex-col items-center flex-1">
                        <div className="w-24 h-24 border border-gray-400 p-1 bg-white flex items-center justify-center shadow-sm">
                          <img src="/lao_lak_qr.png" alt="LAK QR Code" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-[9.5px] font-extrabold mt-1 text-center text-black">LAK QR</span>
                      </div>
                      <div className="flex flex-col items-center flex-1">
                        <div className="w-24 h-24 border border-gray-400 p-1 bg-white flex items-center justify-center shadow-sm">
                          <img src="/lao_thb_qr.png" alt="THB QR Code" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-[9.5px] font-extrabold mt-1 text-center text-black">THB QR</span>
                      </div>
                      <div className="flex flex-col items-center flex-1">
                        <div className="w-24 h-24 border border-gray-400 p-1 bg-white flex items-center justify-center shadow-sm">
                          <img src="/lao_usd_qr.png" alt="USD QR Code" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-[9.5px] font-extrabold mt-1 text-center text-black">USD QR</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. Signature Footer Block & Footnote Grouped together */}
                <div className="print-avoid-break mt-6 pt-4 border-t border-black">
                  <div className="grid grid-cols-5 gap-2 text-[10px] text-center text-black font-bold font-sans">
                    <div>
                      <p className="uppercase text-[8px] tracking-tight leading-tight">Invoice Prepared by:</p>
                      <div className="signature-space h-20 my-2"></div>
                      <div className="border-b-2 border-black w-11/12 mx-auto"></div>
                      <p className="text-gray-600 mt-1.5 font-medium">Date:...../...../.....</p>
                    </div>
                    <div>
                      <p className="uppercase text-[8px] tracking-tight leading-tight">Invoice checked By:</p>
                      <div className="signature-space h-20 my-2"></div>
                      <div className="border-b-2 border-black w-11/12 mx-auto"></div>
                      <p className="text-gray-600 mt-1.5 font-medium">Date:...../...../.....</p>
                    </div>
                    <div>
                      <p className="uppercase text-[8px] tracking-tight leading-tight">Production Checking by:</p>
                      <div className="signature-space h-20 my-2"></div>
                      <div className="border-b-2 border-black w-11/12 mx-auto"></div>
                      <p className="text-gray-600 mt-1.5 font-medium">Date:...../...../.....</p>
                    </div>
                    <div>
                      <p className="uppercase text-[8px] tracking-tight leading-tight">Delivered By:</p>
                      <div className="signature-space h-20 my-2"></div>
                      <div className="border-b-2 border-black w-11/12 mx-auto"></div>
                      <p className="text-gray-600 mt-1.5 font-medium">Date:...../...../.....</p>
                    </div>
                    <div>
                      <p className="uppercase text-[8px] tracking-tight leading-tight">Received By:</p>
                      <div className="signature-space h-20 my-2"></div>
                      <div className="border-b-2 border-black w-11/12 mx-auto"></div>
                      <p className="text-gray-600 mt-1.5 font-medium">Date:...../...../.....</p>
                    </div>
                  </div>

                  {/* Footnote - Directly under signature dates in a small font */}
                  <p className="text-center text-[7.5px] text-gray-500 mt-4 pt-2 border-t border-dashed border-gray-300 font-sans">
                    https://www.facebook.com/thegmschoice/, Email: asia1info@gmail.com, Tel +856 30 990 4780
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS Inject to customize printing page layouts */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 5mm 8mm;
        }
        @media print {
          /* Allow natural page overflow and print breaks without browser default headers/footers */
          html, body {
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide all screen interface elements during print */
          body * {
            visibility: hidden !important;
          }
          /* Expose only the invoice sheet container and its components */
          #print-area, #print-area * {
            visibility: visible !important;
            color: #000000 !important;
          }
          /* Let print area lay out statically and stretch to cover A4 */
          #print-area {
            position: static !important;
            width: 100% !important;
            box-shadow: none !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            font-size: 10.5px !important;
            line-height: 1.25 !important;
          }
          /* Compact print styles for when there are few products */
          #print-area.print-compact {
            font-size: 9.5px !important;
            line-height: 1.2 !important;
          }
          #print-area.print-compact table {
            margin-bottom: 6px !important;
          }
          #print-area.print-compact th, #print-area.print-compact td {
            padding: 2.5px 3.5px !important;
            font-size: 8.5px !important;
          }
          #print-area.print-compact .mb-4 {
            margin-bottom: 6px !important;
          }
          #print-area.print-compact .p-3 {
            padding: 4px !important;
          }
          #print-area.print-compact .p-1.5 {
            padding: 3px !important;
          }
          #print-area.print-compact .mt-6 {
            margin-top: 6px !important;
          }
          #print-area.print-compact .pt-6 {
            padding-top: 6px !important;
          }
          /* Compact signature space size */
          #print-area.print-compact .signature-space {
            height: 35px !important;
          }
          /* Clean pagination page break rules */
          .print-avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          /* Ensure specific item rows do not split mid-row */
          #print-area tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          #print-area, #print-area * {
            font-family: "Noto Sans Lao", "Noto Sans", "Inter", sans-serif !important;
          }
          /* Repeat header columns automatically on subsequent pages */
          #print-area thead {
            display: table-header-group !important;
          }
          /* Beautiful table styling for print */
          #print-area table {
            width: 100% !important;
            margin-bottom: 8px !important;
            border-collapse: collapse !important;
          }
          #print-area th, #print-area td {
            padding: 4px 5px !important;
            font-size: 9.5px !important;
            font-family: "Noto Sans Lao", "Noto Sans", "Inter", sans-serif !important;
          }
          #print-area .mb-4 {
            margin-bottom: 8px !important;
          }
          #print-area .p-3 {
            padding: 6px !important;
          }
          #print-area .p-1.5 {
            padding: 4px !important;
          }
          #print-area .mt-6 {
            margin-top: 8px !important;
          }
          #print-area .pt-6 {
            padding-top: 8px !important;
          }
          /* Ensure signature boxes are comfortable for hand signing */
          #print-area .signature-space {
            height: 42px !important;
            display: block !important;
          }
          /* Retain background colors and borders in print dialog */
          tr {
            background-color: transparent !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .bg-\\[\\#7CB942\\] {
            background-color: #7CB942 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .bg-\\[\\#E7F5D9\\] {
            background-color: #E7F5D9 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .text-white {
            color: #ffffff !important;
          }
          .print\\:hidden {
            display: none !important;
          }
      `}</style>
      </div>
    </AutoTranslate>
  );
}

export default Reports;
