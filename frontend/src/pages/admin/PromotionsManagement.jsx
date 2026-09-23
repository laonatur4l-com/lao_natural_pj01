import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatCurrency, formatId } from '../../utils/formatters';
import { Tag, Plus, Pencil, Trash2, X, Gift, Percent, Calendar, Package, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import AutoTranslate from '../../components/AutoTranslate';

function PromotionsManagement() {
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterTab, setFilterTab] = useState('all');

  const [formData, setFormData] = useState({
    product_id: '',
    title: '',
    type: 'discount',
    discount_percent: '',
    promo_price_lak: '',
    promo_price_thb: '',
    promo_price_usd: '',
    promo_stock: '10',
    start_date: new Date().toISOString().slice(0, 16),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    status: 'active'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [promoRes, prodRes] = await Promise.all([
        api.get('/promotions/read.php'),
        api.get('/products/read.php')
      ]);
      if (promoRes.data?.data) {
        setPromotions(promoRes.data.data);
      }
      if (prodRes.data?.data) {
        setProducts(prodRes.data.data);
      }
    } catch (err) {
      console.error("Failed to load promotions", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingPromo(null);
    setFormData({
      product_id: products.length > 0 ? products[0].id : '',
      title: '',
      type: 'discount',
      discount_percent: '10',
      promo_price_lak: '',
      promo_price_thb: '',
      promo_price_usd: '',
      promo_stock: '10',
      buy_qty: '1',
      get_qty: '1',
      start_date: new Date().toISOString().slice(0, 16),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      status: 'active'
    });
  };

  const handleOpenEdit = (promo) => {
    setEditingPromo(promo);
    setFormData({
      product_id: promo.product_id,
      title: promo.title || '',
      type: promo.type || 'discount',
      discount_percent: promo.discount_percent || '0',
      promo_price_lak: promo.promo_price_lak || '',
      promo_price_thb: promo.promo_price_thb || '',
      promo_price_usd: promo.promo_price_usd || '',
      promo_stock: promo.promo_stock || '0',
      buy_qty: promo.buy_qty || '1',
      get_qty: promo.get_qty || '1',
      start_date: promo.start_date ? promo.start_date.replace(' ', 'T').slice(0, 16) : new Date().toISOString().slice(0, 16),
      end_date: promo.end_date ? promo.end_date.replace(' ', 'T').slice(0, 16) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      status: promo.status || 'active'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Find selected product main stock
    const selectedProd = products.find(p => String(p.id) === String(formData.product_id));
    if (selectedProd) {
      const mainStock = parseInt(selectedProd.stock) || 0;
      const requestedPromoStock = parseInt(formData.promo_stock) || 0;

      if (mainStock <= 0) {
        alert(`Cannot create promotion. "${selectedProd.name}" is out of stock (Available stock: 0).`);
        return;
      }

      if (requestedPromoStock > mainStock) {
        alert(`Dedicated promotion stock (${requestedPromoStock}) cannot exceed available product stock (${mainStock}).`);
        return;
      }

      if (formData.type === 'b1g1') {
        const buyQty = parseInt(formData.buy_qty) || 1;
        const getQty = parseInt(formData.get_qty) || 1;
        const minSetSize = buyQty + getQty;

        if (mainStock < minSetSize) {
          alert(`Cannot create Buy ${buyQty} Get ${getQty} promotion. Product stock (${mainStock}) is less than the required set size (${minSetSize}).`);
          return;
        }

        if (requestedPromoStock < minSetSize) {
          alert(`Dedicated promotion stock (${requestedPromoStock}) must be at least ${minSetSize} to fulfill at least 1 set of Buy ${buyQty} Get ${getQty}.`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      if (editingPromo) {
        await api.put('/promotions/update.php', { ...formData, id: editingPromo.id });
      } else {
        await api.post('/promotions/create.php', formData);
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving promotion');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this promotion?")) return;
    try {
      await api.delete('/promotions/delete.php', { data: { id } });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete promotion');
    }
  };

  const handleToggleStatus = async (promo) => {
    const newStatus = promo.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put('/promotions/update.php', { ...promo, status: newStatus });
      fetchData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  // Filter promotions
  const filteredPromotions = promotions.filter(p => {
    if (filterTab === 'active') return p.computed_status === 'active';
    if (filterTab === 'discount') return p.type === 'discount';
    if (filterTab === 'b1g1') return p.type === 'b1g1';
    if (filterTab === 'exhausted') return p.computed_status === 'exhausted';
    if (filterTab === 'expired') return p.computed_status === 'expired';
    return true;
  });

  return (
    <AutoTranslate>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-serif text-dark mb-1 flex items-center gap-3">
              <Tag className="text-[#8A9A5B]" size={32} /> Product Promotions
            </h1>
            <p className="text-gray-400 text-sm">Create discounts, Buy 1 Get 1 offers, dedicated promo stock & end dates</p>
          </div>

          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 bg-[#2C2C2C] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-black transition-all shadow-sm cursor-pointer"
          >
            <Plus size={18} /> Add Promotion
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Tag size={24} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400">Total Offers</p>
              <p className="text-2xl font-bold text-dark">{promotions.length}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400">Active Now</p>
              <p className="text-2xl font-bold text-dark">{promotions.filter(p => p.computed_status === 'active').length}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Gift size={24} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400">Buy 1 Get 1</p>
              <p className="text-2xl font-bold text-dark">{promotions.filter(p => p.type === 'b1g1').length}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400">Sold Out / Expired</p>
              <p className="text-2xl font-bold text-dark">{promotions.filter(p => p.computed_status === 'exhausted' || p.computed_status === 'expired').length}</p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 pb-3 overflow-x-auto">
          {[
            { id: 'all', label: 'All Promotions' },
            { id: 'active', label: 'Active Offers' },
            { id: 'b1g1', label: 'Buy 1 Get 1 (B1G1)' },
            { id: 'discount', label: 'Discount %' },
            { id: 'exhausted', label: 'Sold Out' },
            { id: 'expired', label: 'Expired' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                filterTab === tab.id
                  ? 'bg-[#8A9A5B] text-white shadow-sm'
                  : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List of Promotions */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
            <div className="w-8 h-8 border-3 border-[#8A9A5B] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-400 text-xs tracking-widest uppercase">Loading promotion catalog...</p>
          </div>
        ) : filteredPromotions.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-16 text-center">
            <Tag className="mx-auto text-gray-300 mb-3" size={48} />
            <h3 className="text-lg font-serif text-dark mb-1">No promotions found</h3>
            <p className="text-gray-400 text-xs mb-4">Click "Add Promotion" above to set up discounts or Buy 1 Get 1 deals.</p>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="inline-flex items-center gap-2 bg-[#8A9A5B] text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-dark transition-all"
            >
              <Plus size={16} /> Create First Promotion
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPromotions.map(promo => {
              const isB1G1 = promo.type === 'b1g1';
              const isExpired = promo.computed_status === 'expired';
              const isUpcoming = promo.computed_status === 'upcoming';
              const isExhausted = promo.computed_status === 'exhausted';
              const isActive = promo.computed_status === 'active';

              return (
                <div 
                  key={promo.id} 
                  className={`bg-white border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col relative overflow-hidden ${
                    !isActive ? 'opacity-85 border-gray-200 bg-gray-50/40' : 'border-gray-100'
                  }`}
                >
                  {/* Top Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1 shadow-sm ${
                      isB1G1 ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {isB1G1 ? <Gift size={12} /> : <Percent size={12} />}
                      {isB1G1 ? `BUY ${promo.buy_qty || 1} GET ${promo.get_qty || 1} FREE` : `${promo.discount_percent}% OFF`}
                    </span>

                    {/* Status Badge */}
                    <span className={`px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest rounded-full ${
                      isActive ? 'bg-emerald-100 text-emerald-700' :
                      isExhausted ? 'bg-red-100 text-red-700 border border-red-200' :
                      isExpired ? 'bg-rose-100 text-rose-700' :
                      isUpcoming ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {isActive ? 'Active' : isExhausted ? 'Sold Out' : isExpired ? 'Expired' : isUpcoming ? 'Upcoming' : 'Inactive'}
                    </span>
                  </div>

                  {/* Product Info */}
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-100 overflow-hidden shrink-0">
                      {promo.product_image ? (
                        <img src={promo.product_image} alt={promo.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Package size={24} />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-serif text-lg text-dark line-clamp-1">{promo.title || promo.product_name}</h3>
                      <p className="text-xs text-gray-400">{promo.product_name} ({formatId('PRD', promo.product_id)})</p>
                      <p className="text-[11px] font-medium text-[#8A9A5B] mt-0.5">Size: {promo.product_size || 'Standard'}</p>
                    </div>
                  </div>

                  {/* Promo Stock & Details */}
                  <div className="space-y-3 mb-6 flex-1">
                    <div className="bg-gray-50 p-3 rounded-xl text-xs space-y-1.5 border border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-medium">Dedicated Promo Limit:</span>
                        <span className="font-bold text-dark bg-white px-2.5 py-0.5 rounded-lg border border-gray-200">
                          {promo.promo_stock} units
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-gray-200/60">
                        <span className="text-gray-500 font-medium">Promo Items Sold:</span>
                        <span className={`font-extrabold ${isExhausted ? 'text-red-600' : 'text-emerald-700'}`}>
                          {promo.promo_sold || 0} / {promo.promo_stock} {isExhausted ? '(Sold Out)' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Expiration Date Display */}
                    <div className="bg-amber-50/60 border border-amber-100 p-3 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between text-amber-900 font-medium">
                        <span className="flex items-center gap-1.5"><Calendar size={13} className="text-amber-600" /> Ends On:</span>
                        <span className="font-mono font-bold text-amber-950">
                          {new Date(promo.end_date).toLocaleDateString()} {new Date(promo.end_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleStatus(promo)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        promo.status === 'active' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {promo.status === 'active' ? 'Enabled' : 'Disabled'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(promo)}
                        className="p-2 text-gray-400 hover:text-dark hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(promo.id)}
                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create / Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
              
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-[#F8F6F1]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white rounded-xl text-[#8A9A5B] shadow-sm">
                    <Tag size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-serif text-dark">{editingPromo ? 'Edit Promotion' : 'Create New Promotion'}</h2>
                    <p className="text-xs text-gray-400">Select product, set discount type, stock & end date</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-dark rounded-full transition-all hover:rotate-90">
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Select Product */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5 font-bold">Target Product *</label>
                  <select
                    required
                    disabled={!!editingPromo}
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8A9A5B] bg-white disabled:bg-gray-100"
                  >
                    <option value="">-- Choose Product to Promote --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatId('PRD', p.id)}) - Main Stock: {p.stock} units
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5 font-bold">Promotion Title *</label>
                  <input
                    required
                    type="text"
                    placeholder="E.g. Summer Special 15% OFF or Buy 2 Get 1 Free"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8A9A5B]"
                  />
                </div>

                {/* Promotion Type Selector */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div
                    onClick={() => setFormData({ ...formData, type: 'discount' })}
                    className={`border-2 rounded-2xl p-4 cursor-pointer transition-all flex items-center gap-3 ${
                      formData.type === 'discount' ? 'border-[#8A9A5B] bg-[#8A9A5B]/5 shadow-sm' : 'border-gray-100 bg-white'
                    }`}
                  >
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Percent size={20} /></div>
                    <div>
                      <p className="text-xs font-bold text-dark uppercase tracking-wider">Discount %</p>
                      <p className="text-[10px] text-gray-400">Percentage off regular price</p>
                    </div>
                  </div>

                  <div
                    onClick={() => setFormData({ ...formData, type: 'b1g1' })}
                    className={`border-2 rounded-2xl p-4 cursor-pointer transition-all flex items-center gap-3 ${
                      formData.type === 'b1g1' ? 'border-purple-500 bg-purple-50/20 shadow-sm' : 'border-gray-100 bg-white'
                    }`}
                  >
                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><Gift size={20} /></div>
                    <div>
                      <p className="text-xs font-bold text-dark uppercase tracking-wider">Buy X Get Y Free</p>
                      <p className="text-[10px] text-gray-400">B1G1 / B2G1 / Custom free deals</p>
                    </div>
                  </div>
                </div>

                {/* Discount % Input if discount type */}
                {formData.type === 'discount' && (
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5 font-bold">Discount Percentage (%) *</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      required={formData.type === 'discount'}
                      value={formData.discount_percent}
                      onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                      placeholder="E.g. 15 for 15% off"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8A9A5B]"
                    />
                  </div>
                )}

                {/* Buy X Get Y Inputs if b1g1 type */}
                {formData.type === 'b1g1' && (
                  <div className="grid grid-cols-2 gap-4 bg-purple-50/40 p-4 rounded-2xl border border-purple-100">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-purple-900 mb-1 font-bold">
                        Buy Quantity (Buy X) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formData.buy_qty}
                        onChange={(e) => setFormData({ ...formData, buy_qty: e.target.value })}
                        placeholder="E.g. 2 for Buy 2"
                        className="w-full px-4 py-2.5 border border-purple-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 bg-white"
                      />
                      <p className="text-[10px] text-purple-600 mt-1">Number of paid items required</p>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-widest text-purple-900 mb-1 font-bold">
                        Get Free Quantity (Get Y) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formData.get_qty}
                        onChange={(e) => setFormData({ ...formData, get_qty: e.target.value })}
                        placeholder="E.g. 1 for Get 1 Free"
                        className="w-full px-4 py-2.5 border border-purple-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 bg-white"
                      />
                      <p className="text-[10px] text-purple-600 mt-1">Number of free items given</p>
                    </div>
                  </div>
                )}

                {/* Separate Promo Stock */}
                {(() => {
                  const selProd = products.find(p => String(p.id) === String(formData.product_id));
                  const mainStock = selProd ? parseInt(selProd.stock) : undefined;
                  const isOverLimit = selProd && parseInt(formData.promo_stock) > mainStock;
                  const isOut = selProd && mainStock <= 0;

                  return (
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs uppercase tracking-widest text-gray-400 font-bold">
                          Dedicated Promotion Stock (Quantity Limit) *
                        </label>
                        {selProd && (
                          <span className={`text-xs font-bold ${isOut ? 'text-red-600' : isOverLimit ? 'text-rose-600' : 'text-[#8A9A5B]'}`}>
                            Available Inventory: {mainStock} units
                          </span>
                        )}
                      </div>
                      <input
                        type="number"
                        min="1"
                        max={mainStock}
                        required
                        value={formData.promo_stock}
                        onChange={(e) => setFormData({ ...formData, promo_stock: e.target.value })}
                        placeholder={mainStock ? `Max ${mainStock}` : "E.g. 10"}
                        className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none ${
                          isOverLimit || isOut ? 'border-rose-500 bg-rose-50/20 text-rose-900' : 'border-gray-200 focus:border-[#8A9A5B]'
                        }`}
                      />
                      {isOverLimit && (
                        <p className="text-[11px] text-rose-600 font-bold mt-1">
                          ⚠️ Promotion stock ({formData.promo_stock}) cannot exceed available inventory ({mainStock}).
                        </p>
                      )}
                      {isOut && (
                        <p className="text-[11px] text-red-600 font-bold mt-1">
                          🚫 Product is currently out of stock. Cannot assign promotion stock.
                        </p>
                      )}
                      {!isOverLimit && !isOut && (
                        <p className="text-[10px] text-gray-400 mt-1">
                          This sets a dedicated stock reserved for this promotion (capped at available inventory stock).
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Date Pickers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5 font-bold">Start Date & Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8A9A5B] bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5 font-bold">Promotion End Date *</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8A9A5B] bg-white"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 text-xs font-semibold text-gray-500 hover:text-dark transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-[#8A9A5B] text-white text-xs font-semibold rounded-xl hover:bg-dark transition-all shadow-md disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingPromo ? 'Update Promotion' : 'Create Promotion'}
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

export default PromotionsManagement;
