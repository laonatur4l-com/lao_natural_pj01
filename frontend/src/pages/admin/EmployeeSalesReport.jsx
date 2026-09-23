import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { Users, Search, Calendar, Trophy, ShoppingBag, TrendingUp, RefreshCw, ArrowUpRight, LayoutGrid, List, Eye } from 'lucide-react';
import { formatCurrency, formatId } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';
import AutoTranslate from '../../components/AutoTranslate';

function EmployeeSalesReport() {
  const { t, language } = useLanguage();
  const [employeeSales, setEmployeeSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all'); // 'day', 'week', 'month', 'year', 'all', 'custom'
  const [selectedYear, setSelectedYear] = useState('all'); // 'all', '2026', '2025'...
  const [selectedMonth, setSelectedMonth] = useState('all'); // 'all', '1', '2'...'12'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/analytics.php');
      if (res.data?.data?.employee_sales) {
        setEmployeeSales(res.data.data.employee_sales);
      }
    } catch (err) {
      console.error("Failed to load employee sales analytics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Extract list of unique available years from employee sales
  const availableYears = Array.from(new Set([
    new Date().getFullYear(),
    ...employeeSales.flatMap(emp => 
      emp.orders.map(o => o.processed_at ? new Date(o.processed_at).getFullYear() : null)
    ).filter(Boolean)
  ])).sort((a, b) => b - a);

  const monthsList = [
    { value: '1', label: language === 'la' ? 'ມັງກອນ (Jan)' : language === 'th' ? 'มกราคม (Jan)' : 'January' },
    { value: '2', label: language === 'la' ? 'ກຸມພາ (Feb)' : language === 'th' ? 'กุมภาพันธ์ (Feb)' : 'February' },
    { value: '3', label: language === 'la' ? 'ມີນາ (Mar)' : language === 'th' ? 'มีนาคม (Mar)' : 'March' },
    { value: '4', label: language === 'la' ? 'ເມສາ (Apr)' : language === 'th' ? 'เมษายน (Apr)' : 'April' },
    { value: '5', label: language === 'la' ? 'ພຶດສະພາ (May)' : language === 'th' ? 'พฤษภาคม (May)' : 'May' },
    { value: '6', label: language === 'la' ? 'ມິຖຸນາ (Jun)' : language === 'th' ? 'มิถุนายน (Jun)' : 'June' },
    { value: '7', label: language === 'la' ? 'ກໍລະກົດ (Jul)' : language === 'th' ? 'กรกฎาคม (Jul)' : 'July' },
    { value: '8', label: language === 'la' ? 'ສິງຫາ (Aug)' : language === 'th' ? 'สิงหาคม (Aug)' : 'August' },
    { value: '9', label: language === 'la' ? 'ກັນຍາ (Sep)' : language === 'th' ? 'กันยายน (Sep)' : 'September' },
    { value: '10', label: language === 'la' ? 'ຕຸລາ (Oct)' : language === 'th' ? 'ตุลาคม (Oct)' : 'October' },
    { value: '11', label: language === 'la' ? 'ພະຈິກ (Nov)' : language === 'th' ? 'พฤศจິກายน (Nov)' : 'November' },
    { value: '12', label: language === 'la' ? 'ທັນວາ (Dec)' : language === 'th' ? 'ธันวาคม (Dec)' : 'December' },
  ];

  // Multi-year aware order date filter
  const isOrderInPeriod = (processedAt) => {
    if (!processedAt) return false;
    const orderDate = new Date(processedAt);
    const now = new Date();

    if (period === 'day') {
      return orderDate.toDateString() === now.toDateString();
    }
    if (period === 'week') {
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(now.getDate() - 7);
      return orderDate >= oneWeekAgo && orderDate <= now;
    }
    if (period === 'month') {
      return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
    }
    if (period === 'year') {
      return orderDate.getFullYear() === now.getFullYear();
    }
    if (period === 'custom') {
      if (startDate && new Date(orderDate.toDateString()) < new Date(startDate)) return false;
      if (endDate && new Date(orderDate.toDateString()) > new Date(endDate)) return false;
      return true;
    }

    if (selectedYear !== 'all' && orderDate.getFullYear() !== Number(selectedYear)) {
      return false;
    }
    if (selectedMonth !== 'all' && (orderDate.getMonth() + 1) !== Number(selectedMonth)) {
      return false;
    }

    return true;
  };

  // Handle Preset Button Clicks
  const handlePresetClick = (pId) => {
    setPeriod(pId);
    if (pId !== 'all' && pId !== 'custom') {
      setSelectedYear('all');
      setSelectedMonth('all');
    }
  };

  // Handle Year Change
  const handleYearChange = (yr) => {
    setSelectedYear(yr);
    setPeriod('all');
  };

  // Handle Month Change
  const handleMonthChange = (mo) => {
    setSelectedMonth(mo);
    setPeriod('all');
  };

  // Process employee sales with selected filter
  const filteredEmployeeSales = employeeSales.map(emp => {
    const periodOrders = emp.orders.filter(order => isOrderInPeriod(order.processed_at));
    const totalRev = periodOrders.reduce((sum, o) => sum + Number(o.total_price || 0), 0);
    return {
      ...emp,
      orders: periodOrders,
      total_orders: periodOrders.length,
      total_revenue: totalRev
    };
  }).filter(emp => 
    emp.employee_name.toLowerCase().includes(search.toLowerCase()) ||
    formatId('EMP', emp.employee_id).toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => b.total_orders - a.total_orders);

  // Flat list of all orders for Table View
  const allFilteredOrders = filteredEmployeeSales.flatMap(emp => 
    emp.orders.map(order => ({
      ...order,
      employee_id: emp.employee_id,
      employee_name: emp.employee_name
    }))
  ).sort((a, b) => new Date(b.processed_at) - new Date(a.processed_at));

  // Overall Team Summary stats for selected period
  const totalTeamOrders = filteredEmployeeSales.reduce((sum, e) => sum + e.total_orders, 0);
  const totalTeamRevenue = filteredEmployeeSales.reduce((sum, e) => sum + e.total_revenue, 0);
  const activeEmployeesCount = filteredEmployeeSales.filter(e => e.total_orders > 0).length;
  
  // Top Performing Employee for selected period
  const topEmployee = [...filteredEmployeeSales].sort((a, b) => b.total_revenue - a.total_revenue)[0];

  const getStatusText = (status) => {
    if (status === 'received') return language === 'la' ? 'ໄດ້ຮັບແລ້ວ' : language === 'th' ? 'ได้รับแล้ว' : 'Received';
    if (status === 'sending') return language === 'la' ? 'ຈັດສົ່ງແລ້ວ' : language === 'th' ? 'จัดส่งแล้ว' : 'Shipping';
    if (status === 'prepare') return language === 'la' ? 'ກຳລັງກຽມຈັດສົ່ງ' : language === 'th' ? 'กำลังเตรียมจัดส่ง' : 'Preparing';
    if (status === 'pending_payment') return language === 'la' ? 'ລໍຖ້າການຊຳລະເງິນ' : language === 'th' ? 'รอการชำระเงิน' : 'Pending Payment';
    if (status === 'payment_rejected') return language === 'la' ? 'ການຊຳລະເງິນຖືກປະຕິເສດ' : language === 'th' ? 'การชำระเงินถูกปฏิเสธ' : 'Payment Rejected';
    return status.replace('_', ' ');
  };

  const periodOptions = [
    { id: 'day', label: language === 'la' ? 'ມື້ນີ້ (Day)' : language === 'th' ? 'วันนี้ (Day)' : 'Today' },
    { id: 'week', label: language === 'la' ? 'ອາທິດນີ້ (Week)' : language === 'th' ? 'สัปดาห์นี้ (Week)' : 'This Week' },
    { id: 'month', label: language === 'la' ? 'ເດືອນນີ້ (Month)' : language === 'th' ? 'เดือนนี้ (Month)' : 'This Month' },
    { id: 'year', label: language === 'la' ? 'ປີນີ້ (Year)' : language === 'th' ? 'ปีนี้ (Year)' : 'This Year' },
    { id: 'all', label: language === 'la' ? 'ທັງໝົດ (All)' : language === 'th' ? 'ทั้งหมด (All)' : 'All Time' },
    { id: 'custom', label: language === 'la' ? 'ກຳນົດເອງ' : language === 'th' ? 'กำหนดเอง' : 'Custom Range' }
  ];

  return (
    <AutoTranslate>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header Title & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif text-dark mb-1 font-bold">
              {language === 'la' ? 'ລາຍງານການຂາຍຂອງພະນັກງານ' : language === 'th' ? 'รายงานการขายของพนักงาน' : 'Employee Sales Report'}
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              {language === 'la' ? 'ຕິດຕາມຜົນງານການຂາຍຂອງພະນັກງານແຍກຕາມ ມື້, ອາທິດ, ເດືອນ, ປີ ແລະ ຊ່ວງເວລາ' : language === 'th' ? 'ติดตามผลงานการขายของพนักงานแยกตาม วัน, สัปดาห์, เดือน, ปี และ ช่วงเวลา' : 'Track sales performance & detailed order logs per employee'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* View Mode Toggle Switch */}
            <div className="bg-white border border-gray-200 p-1 rounded-xl flex items-center shadow-sm">
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-[#2C2C2C] text-white shadow-sm'
                    : 'text-gray-500 hover:text-dark'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid size={15} />
                {language === 'la' ? 'ແບບກາດ' : language === 'th' ? 'แบบการ์ด' : 'Cards'}
              </button>

              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-[#2C2C2C] text-white shadow-sm'
                    : 'text-gray-500 hover:text-dark'
                }`}
                title="Detailed Table View"
              >
                <List size={15} />
                {language === 'la' ? 'ແບບຕາຕະລາງ' : language === 'th' ? 'แบบตาราง' : 'Table'}
              </button>
            </div>

            <button
              onClick={fetchStats}
              className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-dark hover:border-gray-300 transition-colors shadow-sm cursor-pointer"
              title="Refresh Sales Data"
            >
              <RefreshCw size={18} className={loading ? "animate-spin text-[#8A9A5B]" : ""} />
            </button>

            <div className="relative">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={language === 'la' ? 'ຄົ້ນຫາພະນັກງານ...' : language === 'th' ? 'ค้นหาพนักงาน...' : 'Search employee...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8A9A5B] bg-white w-48 md:w-60 shadow-sm font-medium"
              />
            </div>
          </div>
        </div>

        {/* Multi-Year & Date Period Filter Toolbar */}
        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
            {/* Preset Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-widest font-bold text-gray-400 px-2 py-1 flex items-center gap-1.5 shrink-0">
                <Calendar size={16} className="text-[#8A9A5B]" />
                {language === 'la' ? 'ຊ່ວງເວລາ:' : language === 'th' ? 'ช่วงเวลา:' : 'Presets:'}
              </span>
              {periodOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handlePresetClick(opt.id)}
                  className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold tracking-wide transition-all cursor-pointer ${
                    period === opt.id && selectedYear === 'all' && selectedMonth === 'all'
                      ? 'bg-[#2C2C2C] text-white shadow-md scale-105'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-dark border border-gray-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Dropdown Filters for Specific Year & Month */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3.5 py-2 rounded-xl">
                <span className="text-xs text-gray-500 font-bold">
                  {language === 'la' ? 'ເລືອກປີ:' : language === 'th' ? 'เลือกปี:' : 'Year:'}
                </span>
                <select
                  value={selectedYear}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="bg-transparent text-xs md:text-sm font-bold text-dark border-none cursor-pointer focus:outline-none"
                >
                  <option value="all">{language === 'la' ? 'ທຸກໆປີ (All Years)' : language === 'th' ? 'ทุกปี (All Years)' : 'All Years'}</option>
                  {availableYears.map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3.5 py-2 rounded-xl">
                <span className="text-xs text-gray-500 font-bold">
                  {language === 'la' ? 'ເລືອກເດືອນ:' : language === 'th' ? 'เลือกเดือน:' : 'Month:'}
                </span>
                <select
                  value={selectedMonth}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="bg-transparent text-xs md:text-sm font-bold text-dark border-none cursor-pointer focus:outline-none"
                >
                  <option value="all">{language === 'la' ? 'ທຸກໆເດືອນ (All Months)' : language === 'th' ? 'ทุกเดือน (All Months)' : 'All Months'}</option>
                  {monthsList.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Custom Date Range Picker */}
          {period === 'custom' && (
            <div className="flex flex-wrap items-center gap-4 pt-1 animate-in fade-in duration-200 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
              <span className="text-xs text-gray-600 font-bold">
                {language === 'la' ? 'ຕັ້ງແຕ່ວັນທີ:' : language === 'th' ? 'ตั้งแต่วันที่:' : 'From:'}
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs md:text-sm font-semibold text-dark focus:outline-none focus:border-[#8A9A5B] shadow-sm"
              />

              <span className="text-xs text-gray-600 font-bold">
                {language === 'la' ? 'ຫາວັນທີ:' : language === 'th' ? 'ถึงวันที่:' : 'To:'}
              </span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs md:text-sm font-semibold text-dark focus:outline-none focus:border-[#8A9A5B] shadow-sm"
              />

              {(startDate || endDate) && (
                <button
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  className="text-xs text-rose-600 font-bold hover:underline ml-2"
                >
                  {language === 'la' ? 'ລ້າງຄ່າ' : language === 'th' ? 'ล้างค่า' : 'Clear Dates'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Overview KPI Cards for Selected Period */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">
                {language === 'la' ? 'ຍອດຂາຍລວມ (ເລືອກ)' : language === 'th' ? 'ยอดขายรวม (เลือก)' : 'Total Period Revenue'}
              </span>
              <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-2xl">
                <TrendingUp size={22} />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-dark">{formatCurrency(totalTeamRevenue)}</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">
                {language === 'la' ? 'ຈຳນວນອໍເດີ (ເລືອກ)' : language === 'th' ? 'จำนวนออเดอร์ (เลือก)' : 'Total Period Orders'}
              </span>
              <div className="bg-blue-50 text-blue-600 p-2.5 rounded-2xl">
                <ShoppingBag size={22} />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-dark">{totalTeamOrders} <span className="text-sm text-gray-400 font-medium">orders</span></p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">
                {language === 'la' ? 'ພະນັກງານຂາຍດີສຸດ' : language === 'th' ? 'พนักงานขายดีสุด' : 'Top Sales Member'}
              </span>
              <div className="bg-amber-50 text-amber-600 p-2.5 rounded-2xl">
                <Trophy size={22} />
              </div>
            </div>
            <p className="text-xl font-bold text-dark truncate">
              {topEmployee && topEmployee.total_orders > 0 ? topEmployee.employee_name : 'N/A'}
            </p>
            {topEmployee && topEmployee.total_orders > 0 && (
              <p className="text-sm text-[#8A9A5B] font-bold mt-1">{formatCurrency(topEmployee.total_revenue)}</p>
            )}
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">
                {language === 'la' ? 'ພະນັກງານທີ່ມີຍອດຂາຍ' : language === 'th' ? 'พนักงานที่มียอดขาย' : 'Active Sales Staff'}
              </span>
              <div className="bg-violet-50 text-violet-600 p-2.5 rounded-2xl">
                <Users size={22} />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-dark">{activeEmployeesCount} <span className="text-sm text-gray-400 font-medium">/ {filteredEmployeeSales.length} staff</span></p>
          </div>
        </div>

        {/* Content Section: Cards View vs Detailed Table View */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-20 text-center shadow-sm">
            <div className="w-10 h-10 border-3 border-[#8A9A5B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm font-semibold tracking-widest uppercase text-gray-400">Loading employee sales history...</p>
          </div>
        ) : viewMode === 'cards' ? (
          /* Cards View — Bigger & Spacious Cards */
          filteredEmployeeSales.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredEmployeeSales.map(emp => (
                <div key={emp.employee_id} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all flex flex-col h-[520px]">
                  {/* Employee Card Header */}
                  <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                    <div>
                      <h3 className="font-bold text-dark text-lg md:text-xl">{emp.employee_name}</h3>
                      <p className="text-xs text-gray-400 font-mono tracking-widest font-medium mt-0.5">
                        {formatId('EMP', emp.employee_id)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-baseline justify-end gap-1.5">
                        <span className="text-3xl font-black text-[#8A9A5B]">{emp.total_orders}</span>
                        <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">
                          {language === 'la' ? 'ອໍເດີ' : language === 'th' ? 'ออเดอร์' : 'orders'}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-dark mt-0.5">{formatCurrency(emp.total_revenue)}</p>
                    </div>
                  </div>

                  {/* Orders Scrollable List */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {emp.orders.length > 0 ? (
                      emp.orders.map(order => (
                        <div key={order.order_id} className="bg-gray-50/80 hover:bg-white p-4 rounded-2xl border border-gray-100 hover:border-[#8A9A5B]/40 hover:shadow-md transition-all flex justify-between items-start group">
                          <div className="space-y-1.5">
                            <Link to={`/order/${order.order_id}`} className="font-bold text-[#8A9A5B] hover:text-dark text-sm md:text-base flex items-center gap-1.5 group-hover:underline">
                              {formatId('ORD', order.order_id)}
                              <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                            <p className="text-dark font-semibold text-sm">{order.customer_name}</p>
                            <p className="text-xs text-gray-400 font-medium">{new Date(order.processed_at).toLocaleString()}</p>
                          </div>
                          <div className="text-right space-y-1.5">
                            <p className="font-extrabold text-dark text-sm md:text-base">{formatCurrency(order.total_price)}</p>
                            <span className={`inline-block px-3 py-1 text-xs rounded-full font-bold shadow-2xs ${
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
                      <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm py-16 space-y-1">
                        <p className="font-medium">{language === 'la' ? 'ບໍ່ມີອໍເດີໃນຊ່ວງເວລານີ້' : language === 'th' ? 'ไม่มีออเดอร์ในช่วงเวลานี้' : 'No orders sold in this period'}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center text-gray-400 text-base shadow-sm">
              {language === 'la' ? 'ບໍ່ພົບຂໍ້ມູນການຂາຍຂອງພະນັກງານ' : language === 'th' ? 'ไม่พบข้อมูลการขายของพนักงาน' : 'No employee sales records found'}
            </div>
          )
        ) : (
          /* Table View — Full Width Detailed Table */
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs uppercase tracking-widest text-gray-400 bg-gray-50/80 border-b border-gray-100 font-bold">
                    <th className="p-5 pl-7">Order ID</th>
                    <th className="p-5">Employee</th>
                    <th className="p-5">Customer Name</th>
                    <th className="p-5">Processed Date & Time</th>
                    <th className="p-5">Status</th>
                    <th className="p-5 text-right">Total Price</th>
                    <th className="p-5 pr-7 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm md:text-base">
                  {allFilteredOrders.length > 0 ? (
                    allFilteredOrders.map((order, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                        <td className="p-5 pl-7 font-bold text-[#8A9A5B] font-mono">
                          {formatId('ORD', order.order_id)}
                        </td>
                        <td className="p-5 font-bold text-dark">
                          {order.employee_name}
                          <span className="block text-xs font-normal text-gray-400 font-mono">
                            {formatId('EMP', order.employee_id)}
                          </span>
                        </td>
                        <td className="p-5 font-semibold text-gray-800">
                          {order.customer_name}
                        </td>
                        <td className="p-5 text-xs md:text-sm text-gray-500 font-medium">
                          {new Date(order.processed_at).toLocaleString()}
                        </td>
                        <td className="p-5">
                          <span className={`inline-block px-3 py-1 text-xs rounded-full font-bold ${
                            order.order_status === 'received' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            order.order_status === 'sending' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                            order.order_status === 'prepare' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}>
                            {getStatusText(order.order_status)}
                          </span>
                        </td>
                        <td className="p-5 text-right font-extrabold text-dark">
                          {formatCurrency(order.total_price)}
                        </td>
                        <td className="p-5 pr-7 text-center">
                          <Link
                            to={`/order/${order.order_id}`}
                            className="p-2.5 inline-flex items-center justify-center text-gray-400 hover:text-[#8A9A5B] hover:bg-[#8A9A5B]/10 rounded-xl transition cursor-pointer"
                            title="View Order Details"
                          >
                            <Eye size={20} />
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="p-16 text-center text-gray-400 font-medium">
                        {language === 'la' ? 'ບໍ່ພົບຂໍ້ມູນການຂາຍ' : language === 'th' ? 'ไม่พบข้อมูลการขาย' : 'No sales transactions found for this period'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AutoTranslate>
  );
}

export default EmployeeSalesReport;
