import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import api from '../../utils/api';
import { ShoppingCart, Package, Truck, Clock, ArrowRight, PackagePlus, DollarSign, X } from 'lucide-react';
import { formatCurrency, formatId } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';
import AutoTranslate from '../../components/AutoTranslate';

function EmployeeDashboard() {
  const { user } = useAuth();
  const { exchangeRates, refreshExchangeRates } = useCart();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRateModal, setShowRateModal] = useState(false);
  const [ratesForm, setRatesForm] = useState({ THB: 700, USD: 22000 });
  const [savingRates, setSavingRates] = useState(false);

  const handleOpenRateModal = () => {
    setRatesForm({
      THB: exchangeRates?.THB || ratesForm.THB || 700,
      USD: exchangeRates?.USD || ratesForm.USD || 22000
    });
    setShowRateModal(true);
  };

  const handleSaveExchangeRates = async (e) => {
    e.preventDefault();
    setSavingRates(true);
    try {
      const payloadRates = {
        THB: parseFloat(String(ratesForm.THB).replace(/,/g, '')),
        USD: parseFloat(String(ratesForm.USD).replace(/,/g, ''))
      };
      await api.post('/exchange_rates/update.php', { rates: payloadRates });
      if (refreshExchangeRates) refreshExchangeRates();
      alert('Exchange rates updated successfully!');
      setShowRateModal(false);
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || 'Failed to update exchange rates');
    } finally {
      setSavingRates(false);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/employee_analytics.php');
        if (res.data?.data) setStats(res.data.data);
      } catch (err) {
        console.error("Failed to load stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const getStatusText = (status) => {
    if (status === 'received') return t('status_received');
    if (status === 'sending') return t('status_sending');
    if (status === 'prepare') return t('status_prepare');
    if (status === 'pending_payment') return t('status_pending');
    if (status === 'payment_rejected') return language === 'la' ? 'ການຊຳລະເງິນຖືກປະຕິເສດ' : language === 'th' ? 'การชำระเงินถูกปฏิเสธ' : 'Payment Rejected';
    return status.replace('_', ' ');
  };

  if (loading) {
    return (
      <AutoTranslate>
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#8A9A5B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm tracking-widest uppercase">Loading dashboard</p>
        </div>
      </div>
      </AutoTranslate>
    );
  }

  const kpiCards = [
    { label: 'New Orders', value: stats?.new_orders || 0, icon: ShoppingCart, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Pending Orders', value: stats?.pending_orders || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Products', value: stats?.total_products || 0, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Shipped Today', value: stats?.shipped_today || 0, icon: Truck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <AutoTranslate>
    <div className="p-8 max-w-7xl">
      {/* Header with Exchange Rate Widget */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif text-dark mb-1">
            Employee Dashboard
          </h1>
          <p className="text-gray-400 text-sm">
            Welcome, {user?.name}. Here's today's overview.
          </p>
        </div>

        {/* Exchange Rates Widget */}
        <div className="bg-white border border-[#8A9A5B]/30 px-4 py-2.5 rounded-2xl flex items-center gap-4 shadow-sm shrink-0">
          <div className="text-xs">
            <span className="font-semibold text-gray-500 block text-[11px] uppercase tracking-wider">Exchange Rates:</span>
            <div className="flex gap-3 text-dark font-bold font-mono text-sm mt-0.5">
              <span>🇹🇭 1 THB = ₭{Number(exchangeRates?.THB || 700).toLocaleString()}</span>
              <span>🇺🇸 1 USD = ₭{Number(exchangeRates?.USD || 22000).toLocaleString()}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenRateModal}
            className="bg-[#8A9A5B] text-white px-3 py-1.5 text-xs font-bold rounded-xl hover:bg-[#7A8A4B] transition shadow-sm cursor-pointer"
          >
            ✏️ Edit Rates
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {kpiCards.map((card, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-[0.15em] text-gray-400 font-medium">{card.label}</span>
              <div className={`${card.bg} ${card.color} p-2 rounded-lg`}>
                <card.icon size={16} />
              </div>
            </div>
            <p className="text-2xl font-semibold text-dark">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-50">
            <h2 className="font-serif text-lg text-dark">
              Recent Orders
            </h2>
            <button onClick={() => navigate('/employee/orders')} className="text-xs text-[#8A9A5B] hover:text-dark transition uppercase tracking-widest flex items-center gap-1 cursor-pointer">
              View All <ArrowRight size={12} />
            </button>
          </div>
          <div className="p-2">
            {stats?.recent_orders?.length > 0 ? (
              <ul>
                {stats.recent_orders.map(order => (
                  <li key={order.id} className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-gray-50 transition text-sm">
                    <div>
                      <Link to={`/order/${order.id}`} className="font-medium text-[#8A9A5B] hover:text-dark hover:underline transition">{formatId('ORD', order.id)}</Link>
                      <span className="text-gray-400 ml-2">{order.customer_name}</span>
                      {order.status === 'pending_payment' && (
                        <span className="text-red-500 font-semibold ml-2 text-xs px-1.5 py-0.5 bg-red-50 rounded border border-red-100 animate-pulse">
                          {t('New')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-dark">{formatCurrency(order.total_price)}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        order.status === 'received' ? 'bg-emerald-50 text-emerald-700' :
                        order.status === 'sending' ? 'bg-blue-50 text-blue-700' :
                        order.status === 'prepare' ? 'bg-amber-50 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-3 py-8 text-center text-gray-400 text-sm">
                No recent orders
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <h2 className="font-serif text-lg text-dark mb-4">
            Quick Actions
          </h2>
          <div className="space-y-2">
            <button onClick={() => navigate('/employee/import-products')} className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-[#8A9A5B]/10 text-sm text-dark transition flex items-center gap-3 cursor-pointer">
              <PackagePlus size={16} className="text-[#8A9A5B]" /> Import Products
            </button>
            <button onClick={() => navigate('/employee/orders')} className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-[#8A9A5B]/10 text-sm text-dark transition flex items-center gap-3 cursor-pointer">
              <Truck size={16} className="text-[#8A9A5B]" /> Manage Orders & Shipping
            </button>
            <button onClick={() => navigate('/products')} className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-[#8A9A5B]/10 text-sm text-dark transition flex items-center gap-3 cursor-pointer">
              <ShoppingCart size={16} className="text-[#8A9A5B]" /> View Storefront
            </button>
          </div>

          {/* Orders by Status */}
          {stats?.orders_by_status?.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <h3 className="text-xs uppercase tracking-widest text-gray-400 mb-3">
                Orders by Status
              </h3>
              <div className="space-y-2">
                {stats.orders_by_status.map((s, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 capitalize">{getStatusText(s.status)}</span>
                    <span className="font-medium text-dark">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Exchange Rates Modal */}
      {showRateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-6">
              <div>
                <h3 className="text-xl font-serif text-dark font-bold">Update Foreign Exchange Rates</h3>
                <p className="text-xs text-gray-400 mt-0.5">Set current LAK base rates for Thai Baht (THB) & US Dollar (USD)</p>
              </div>
              <button onClick={() => setShowRateModal(false)} className="text-gray-400 hover:text-dark p-1 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveExchangeRates} className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 font-semibold mb-2">
                  🇹🇭 Thai Baht (1 THB = LAK)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₭</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={ratesForm.THB}
                    onChange={(e) => setRatesForm({ ...ratesForm, THB: e.target.value })}
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono font-bold text-dark focus:outline-none focus:border-[#8A9A5B] bg-white"
                    placeholder="e.g. 700"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Example: If 1 THB = 700 LAK, type 700</p>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 font-semibold mb-2">
                  🇺🇸 US Dollar (1 USD = LAK)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₭</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={ratesForm.USD}
                    onChange={(e) => setRatesForm({ ...ratesForm, USD: e.target.value })}
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono font-bold text-dark focus:outline-none focus:border-[#8A9A5B] bg-white"
                    placeholder="e.g. 22000"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Example: If 1 USD = 22,000 LAK, type 22000</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowRateModal(false)}
                  className="px-5 py-2.5 text-sm text-gray-500 hover:text-dark transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRates}
                  className="px-6 py-2.5 bg-[#8A9A5B] text-white font-bold rounded-xl text-sm hover:bg-[#7A8A4B] transition shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {savingRates ? 'Saving...' : 'Save Rates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </AutoTranslate>
  );
}

export default EmployeeDashboard;
