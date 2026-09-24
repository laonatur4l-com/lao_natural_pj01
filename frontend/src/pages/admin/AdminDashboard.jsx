import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import { TrendingUp, ShoppingCart, Users, Package, PackagePlus, AlertTriangle, ArrowRight, Wallet } from 'lucide-react';
import { formatCurrency, formatId } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';
import AutoTranslate from '../../components/AutoTranslate';

function AdminDashboard() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [empPeriod, setEmpPeriod] = useState('all');
  const [empYear, setEmpYear] = useState('all');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/analytics.php');
        if (res.data && res.data.data) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const isOrderInPeriod = (processedAt, periodType) => {
    if (!processedAt) return false;
    const orderDate = new Date(processedAt);
    const now = new Date();

    if (periodType === 'day') return orderDate.toDateString() === now.toDateString();
    if (periodType === 'week') {
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(now.getDate() - 7);
      return orderDate >= oneWeekAgo && orderDate <= now;
    }
    if (periodType === 'month') return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
    if (periodType === 'year') return orderDate.getFullYear() === now.getFullYear();

    if (empYear !== 'all' && orderDate.getFullYear() !== Number(empYear)) {
      return false;
    }
    return true;
  };

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
          <p className="text-gray-400 text-sm tracking-widest uppercase">Loading analytics</p>
        </div>
      </div>
      </AutoTranslate>
    );
  }

  const [kpiPeriod, setKpiPeriod] = useState('all');

  const ordersList = stats?.orders_list || [];
  const filteredOrders = kpiPeriod === 'all'
    ? ordersList
    : ordersList.filter(o => isOrderInPeriod(o.created_at, kpiPeriod));

  const periodRevenue = kpiPeriod === 'all'
    ? (stats?.total_revenue || 0)
    : filteredOrders.reduce((sum, o) => sum + Number(o.total_price || 0), 0);

  const periodOrdersCount = kpiPeriod === 'all'
    ? (stats?.total_orders || 0)
    : filteredOrders.length;

  const todayOrders = ordersList.filter(o => isOrderInPeriod(o.created_at, 'day'));
  const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.total_price || 0), 0);

  const periodLabelText = 
    kpiPeriod === 'day' ? (language === 'la' ? 'ມື້ນີ້' : language === 'th' ? 'วันนี้' : 'Today') :
    kpiPeriod === 'week' ? (language === 'la' ? 'ອາທິດນີ້' : language === 'th' ? 'สัปดาห์นี้' : 'This Week') :
    kpiPeriod === 'month' ? (language === 'la' ? 'ເດືອນນີ້' : language === 'th' ? 'เดือนนี้' : 'This Month') :
    kpiPeriod === 'year' ? (language === 'la' ? 'ປີນີ້' : language === 'th' ? 'ปีนี้' : 'This Year') :
    (language === 'la' ? 'ທັງໝົດ' : language === 'th' ? 'ทั้งหมด' : 'All Time');

  const kpiCards = [
    { 
      label: `${language === 'la' ? 'ລາຍຮັບ' : language === 'th' ? 'รายได้' : 'Revenue'} (${periodLabelText})`, 
      value: `${formatCurrency(periodRevenue)}`, 
      subtext: kpiPeriod !== 'day' ? `${language === 'la' ? 'ມື້ນີ້' : language === 'th' ? 'วันนี้' : 'Today'}: ${formatCurrency(todayRevenue)}` : null,
      icon: TrendingUp, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50', 
      link: '/admin/total-revenue' 
    },
    { 
      label: `${language === 'la' ? 'ລາຍການສັ່ງຊື້' : language === 'th' ? 'รายการสั่งซื้อ' : 'Orders'} (${periodLabelText})`, 
      value: periodOrdersCount, 
      subtext: kpiPeriod !== 'day' ? `${language === 'la' ? 'ມື້ນີ້' : language === 'th' ? 'วันนี้' : 'Today'}: ${todayOrders.length} ${language === 'la' ? 'ລາຍການ' : language === 'th' ? 'รายการ' : 'orders'}` : null,
      icon: ShoppingCart, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50', 
      link: '/admin/sell-history' 
    },
    { label: language === 'la' ? 'ລູກຄ້າ' : language === 'th' ? 'ลูกค้า' : 'Customers', value: stats?.total_users || 0, icon: Users, color: 'text-violet-600', bg: 'bg-violet-50', link: '/admin/users/customers' },
    { label: language === 'la' ? 'ສິນຄ້າ' : language === 'th' ? 'สินค้า' : 'Products', value: stats?.total_products || 0, icon: Package, color: 'text-amber-600', bg: 'bg-amber-50', link: '/admin/product-catalog' },
  ];

  return (
    <AutoTranslate>
    <div className="p-8 max-w-7xl">
      {/* Header with KPI Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif text-dark mb-1">
            Dashboard
          </h1>
          <p className="text-gray-400 text-sm">
            Welcome back, {user?.name}. Here's your store overview.
          </p>
        </div>

        {/* Period Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-white border border-gray-200 p-1.5 rounded-xl shadow-sm self-start sm:self-auto">
          {[
            { id: 'day', label: language === 'la' ? 'ມື້ນີ້' : language === 'th' ? 'วันนี้' : 'Today' },
            { id: 'week', label: language === 'la' ? 'ອາທິດນີ້' : language === 'th' ? 'สัปดาห์นี้' : 'Week' },
            { id: 'month', label: language === 'la' ? 'ເດືອນນີ້' : language === 'th' ? 'เดือนนี้' : 'Month' },
            { id: 'year', label: language === 'la' ? 'ປີນີ້' : language === 'th' ? 'ปีนี้' : 'Year' },
            { id: 'all', label: language === 'la' ? 'ທັງໝົດ' : language === 'th' ? 'ทั้งหมด' : 'All Time' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setKpiPeriod(p.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                kpiPeriod === p.id
                  ? 'bg-[#8A9A5B] text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-dark'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {kpiCards.map((card, i) => (
          <div
            key={i}
            onClick={() => card.link && navigate(card.link)}
            className={`bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-[#8A9A5B]/40 hover:-translate-y-0.5 transition-all duration-200 ${
              card.link ? 'cursor-pointer' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] uppercase tracking-[0.12em] text-gray-400 font-semibold">{card.label}</span>
              <div className={`${card.bg} ${card.color} p-2 rounded-lg`}>
                <card.icon size={16} />
              </div>
            </div>
            <p className="text-2xl font-semibold text-dark">{card.value}</p>
            {card.subtext && (
              <p className="text-[11px] text-gray-400 font-medium mt-1">{card.subtext}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-50">
            <h2 className="font-serif text-lg text-dark">
              Recent Orders
            </h2>
            <button onClick={() => navigate('/admin/sell-history')} className="text-xs text-[#8A9A5B] hover:text-dark transition uppercase tracking-widest flex items-center gap-1 cursor-pointer">
              View All <ArrowRight size={12} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-50">
                  <th className="text-left p-4 font-medium">Order</th>
                  <th className="text-left p-4 font-medium">Customer</th>
                  <th className="text-left p-4 font-medium">Amount</th>
                  <th className="text-left p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {stats?.recent_orders?.length > 0 ? stats.recent_orders.map(order => (
                  <tr key={order.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition">
                    <td className="p-4 font-medium">
                      <Link to={`/order/${order.id}`} className="text-[#8A9A5B] hover:text-dark hover:underline transition">
                        {formatId('ORD', order.id)}
                      </Link>
                    </td>
                    <td className="p-4 text-gray-500">{order.customer_name}</td>
                    <td className="p-4 text-dark">{formatCurrency(order.total_price)}</td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-1 text-xs rounded-full font-medium ${
                        order.status === 'received' ? 'bg-emerald-50 text-emerald-700' :
                        order.status === 'sending' ? 'bg-blue-50 text-blue-700' :
                        order.status === 'prepare' ? 'bg-amber-50 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-400">
                      No orders yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Low Stock Alerts */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 p-5 border-b border-gray-50">
              <AlertTriangle size={16} className="text-amber-500" />
              <h2 className="font-serif text-lg text-dark">
                Low Stock
              </h2>
            </div>
            <div className="p-2">
              {stats?.low_stock?.length > 0 ? (
                <ul>
                  {stats.low_stock.slice(0, 5).map(item => (
                    <li key={item.id} className="flex justify-between items-center px-3 py-2.5 rounded-lg hover:bg-gray-50 transition text-sm">
                      <span className="text-dark">{item.name}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        item.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {language === 'la' ? `ເຫຼືອ ${item.stock}` : language === 'th' ? `เหลือ ${item.stock}` : `${item.stock} left`}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-3 py-6 text-center text-gray-400 text-sm">
                  All stocked up ✓
                </div>
              )}
            </div>
          </div>

          {/* Top Selling Products */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 p-5 border-b border-gray-50">
              <TrendingUp size={16} className="text-emerald-500" />
              <h2 className="font-serif text-lg text-dark">
                Top Selling Products
              </h2>
            </div>
            <div className="p-2">
              {stats?.popular_products?.length > 0 ? (
                <ul className="divide-y divide-gray-50">
                  {stats.popular_products.map((item, i) => (
                    <li key={item.id} className="flex justify-between items-center px-3 py-3 text-sm">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xs font-mono font-bold text-gray-400 bg-gray-50 w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-dark font-medium truncate">{item.name}</span>
                      </div>
                      <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full shrink-0">
                        {language === 'la' ? `ຂາຍແລ້ວ ${item.total_sold}` : language === 'th' ? `ขายแล้ว ${item.total_sold}` : `${item.total_sold} sold`}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-3 py-6 text-center text-gray-400 text-sm">
                  No sales yet
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
              <button onClick={() => navigate('/admin/users')} className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-[#8A9A5B]/10 text-sm text-dark transition flex items-center gap-3 cursor-pointer">
                <Users size={16} className="text-[#8A9A5B]" /> Manage Users
              </button>
              <button onClick={() => navigate('/employee')} className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-[#8A9A5B]/10 text-sm text-dark transition flex items-center gap-3 cursor-pointer">
                <ShoppingCart size={16} className="text-[#8A9A5B]" /> Employee Portal
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Sales Log Section */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm mt-8">
        <div className="p-5 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-[#8A9A5B]" />
            <h2 className="font-serif text-lg text-dark">
              {t('Employee Sales Log')}
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Period selector buttons */}
            {[
              { id: 'day', label: language === 'la' ? 'ມື້ນີ້' : language === 'th' ? 'วันนี้' : 'Day' },
              { id: 'week', label: language === 'la' ? 'ອາທິດນີ້' : language === 'th' ? 'สัปดาห์นี้' : 'Week' },
              { id: 'month', label: language === 'la' ? 'ເດືອນນີ້' : language === 'th' ? 'เดือนนี้' : 'Month' },
              { id: 'year', label: language === 'la' ? 'ປີນີ້' : language === 'th' ? 'ปีนี้' : 'Year' },
              { id: 'all', label: language === 'la' ? 'ທັງໝົດ' : language === 'th' ? 'ทั้งหมด' : 'All' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => { setEmpPeriod(p.id); if (p.id !== 'all') setEmpYear('all'); }}
                className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                  empPeriod === p.id && empYear === 'all'
                    ? 'bg-[#2C2C2C] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-dark'
                }`}
              >
                {p.label}
              </button>
            ))}

            {/* Year selector dropdown */}
            <select
              value={empYear}
              onChange={(e) => { setEmpYear(e.target.value); setEmpPeriod('all'); }}
              className="bg-gray-100 border border-gray-200 text-xs font-semibold px-2 py-1 rounded-lg text-dark cursor-pointer focus:outline-none"
            >
              <option value="all">{language === 'la' ? 'ທຸກໆປີ' : language === 'th' ? 'ทุกปี' : 'All Years'}</option>
              {Array.from(new Set([
                new Date().getFullYear(),
                ...(stats?.employee_sales || []).flatMap(e => e.orders.map(o => o.processed_at ? new Date(o.processed_at).getFullYear() : null)).filter(Boolean)
              ])).sort((a, b) => b - a).map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>

            <Link
              to="/admin/employee-sales"
              className="text-xs text-[#8A9A5B] font-semibold hover:underline flex items-center gap-1 ml-2"
            >
              {language === 'la' ? 'ເບິ່ງທັງໝົດ' : language === 'th' ? 'ดูทั้งหมด' : 'View Full Report'} →
            </Link>
          </div>
        </div>

        <div className="p-5">
          {stats?.employee_sales?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats.employee_sales.map(emp => {
                const periodOrders = emp.orders.filter(o => isOrderInPeriod(o.processed_at, empPeriod));
                const totalRev = periodOrders.reduce((sum, o) => sum + Number(o.total_price || 0), 0);
                return (
                  <div key={emp.employee_id} className="border border-gray-100 rounded-2xl p-5 bg-white shadow-sm flex flex-col h-[440px] hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                      <div>
                        <h3 className="font-bold text-dark text-base">{emp.employee_name}</h3>
                        <p className="text-xs text-gray-400 font-mono tracking-widest mt-0.5">
                          {formatId('EMP', emp.employee_id)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-baseline justify-end gap-1">
                          <span className="text-2xl font-black text-[#8A9A5B]">{periodOrders.length}</span>
                          <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">
                            {t('Orders')}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-dark">{formatCurrency(totalRev)}</p>
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
                      {periodOrders.length > 0 ? (
                        periodOrders.map(order => (
                          <div key={order.order_id} className="bg-gray-50/80 hover:bg-white p-3 rounded-xl border border-gray-100 hover:border-[#8A9A5B]/40 transition text-xs flex justify-between items-start">
                            <div className="space-y-1">
                              <Link to={`/order/${order.order_id}`} className="font-bold text-[#8A9A5B] hover:text-dark hover:underline block text-sm">
                                {formatId('ORD', order.order_id)}
                              </Link>
                              <p className="text-dark font-semibold text-xs">{order.customer_name}</p>
                              <p className="text-[10px] text-gray-400 font-medium">{new Date(order.processed_at).toLocaleString()}</p>
                            </div>
                            <div className="text-right space-y-1">
                              <p className="font-bold text-dark text-sm">{formatCurrency(order.total_price)}</p>
                              <span className={`inline-block px-2 py-0.5 text-[10px] rounded-full font-bold ${
                                order.order_status === 'received' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                order.order_status === 'sending' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                order.order_status === 'prepare' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                'bg-gray-100 text-gray-700 border border-gray-200'
                              }`}>
                                {getStatusText(order.order_status)}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 text-xs py-12">
                          {t('No orders sold yet')}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-12 text-sm">
              {t('No employee sales records found')}
            </div>
          )}
        </div>
      </div>
    </div>
    </AutoTranslate>
  );
}

export default AdminDashboard;
