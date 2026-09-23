import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatId, formatCurrency } from '../../utils/formatters';
import { Search, Calendar, Package, ArrowUpRight, DollarSign, Archive, Truck, Clock } from 'lucide-react';
import AutoTranslate from '../../components/AutoTranslate';

function ImportRevenue() {
  const [imports, setImports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month

  useEffect(() => {
    fetchImports();
  }, []);

  const fetchImports = async () => {
    try {
      const res = await api.get('/admin/read_product_imports.php');
      if (res.data?.data) {
        setImports(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch product imports", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter imports based on search term and date
  const getFilteredImports = () => {
    let filtered = imports;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatId('IMP', item.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatId('PRD', item.product_id).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date range filter
    const now = new Date();
    if (dateFilter === 'today') {
      filtered = filtered.filter(item => {
        const importDate = new Date(item.import_date);
        return importDate.toDateString() === now.toDateString();
      });
    } else if (dateFilter === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      filtered = filtered.filter(item => new Date(item.import_date) >= oneWeekAgo);
    } else if (dateFilter === 'month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(now.getMonth() - 1);
      filtered = filtered.filter(item => new Date(item.import_date) >= oneMonthAgo);
    }

    return filtered;
  };

  const filteredImports = getFilteredImports();

  // Metrics
  const totalCost = filteredImports.reduce((sum, item) => sum + (Number(item.import_price) * Number(item.quantity)), 0);
  const totalQuantity = filteredImports.reduce((sum, item) => sum + Number(item.quantity), 0);
  const avgCostPerTransaction = filteredImports.length > 0 ? totalCost / filteredImports.length : 0;
  const uniqueProductsCount = new Set(filteredImports.map(item => item.product_id)).size;

  return (
    <AutoTranslate>
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif text-dark mb-1">Import Revenue</h1>
          <p className="text-gray-400 text-sm">Detailed overview of product import history, suppliers, and procurement expenses</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
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
              placeholder="Search product or supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8A9A5B] transition"
            />
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Cost / Procurement spent */}
        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.1em] text-gray-400 font-medium">Procurement Spent</p>
            <p className="text-2xl font-serif font-semibold text-dark mt-0.5">{formatCurrency(totalCost)}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Total import cost value</p>
          </div>
        </div>

        {/* Total Qty Imported */}
        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <Archive size={24} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.1em] text-gray-400 font-medium">Total Qty Imported</p>
            <p className="text-2xl font-serif font-semibold text-dark mt-0.5">{totalQuantity.toLocaleString()} pcs</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Total items in stock intake</p>
          </div>
        </div>

        {/* Average Cost per Import */}
        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.1em] text-gray-400 font-medium">Avg Procurement Cost</p>
            <p className="text-2xl font-serif font-semibold text-dark mt-0.5">{formatCurrency(avgCostPerTransaction)}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Per import batch ticket</p>
          </div>
        </div>

        {/* Unique Products Imported */}
        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Package size={24} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.1em] text-gray-400 font-medium">Unique Items</p>
            <p className="text-2xl font-serif font-semibold text-dark mt-0.5">{uniqueProductsCount}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Distinct products stocked</p>
          </div>
        </div>
      </div>

      {/* Imports Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center justify-center shadow-sm">
          <div className="w-8 h-8 border-2 border-[#8A9A5B] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400 text-sm tracking-widest uppercase">Fetching import records...</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-[0.15em] border-b border-gray-50 bg-gray-50/50">
                  <th className="p-6 font-medium">Import ID</th>
                  <th className="p-6 font-medium">Product Details</th>
                  <th className="p-6 font-medium">Supplier</th>
                  <th className="p-6 font-medium">Date & Time</th>
                  <th className="p-6 font-medium">Quantity</th>
                  <th className="p-6 font-medium">Unit Cost</th>
                  <th className="p-6 font-medium text-right">Total Expense</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-50">
                {filteredImports.length > 0 ? (
                  filteredImports.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-6 font-mono font-medium text-dark">{formatId('IMP', item.id)}</td>
                      <td className="p-6 text-dark font-medium">
                        <div className="flex flex-col">
                          <span className="text-dark font-medium">{item.product_name || 'Product'}</span>
                          <span className="text-xs text-gray-400 font-mono tracking-widest mt-0.5">{formatId('PRD', item.product_id)}</span>
                        </div>
                      </td>
                      <td className="p-6 text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Truck size={14} className="text-gray-400" />
                          <span>{item.supplier_name || 'General Supplier'}</span>
                        </div>
                      </td>
                      <td className="p-6 text-gray-500">
                        <div className="flex flex-col">
                          <span>{new Date(item.import_date).toLocaleDateString()}</span>
                          <span className="text-xs text-gray-400">{new Date(item.import_date).toLocaleTimeString()}</span>
                        </div>
                      </td>
                      <td className="p-6 text-dark font-medium">{item.quantity} pcs</td>
                      <td className="p-6 text-gray-600">{formatCurrency(item.import_price)}</td>
                      <td className="p-6 text-right text-dark font-semibold">
                        {formatCurrency(Number(item.import_price) * Number(item.quantity))}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="p-12 text-center text-gray-400">
                      No matching import records found.
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

export default ImportRevenue;
