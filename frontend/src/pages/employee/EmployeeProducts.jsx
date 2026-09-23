import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Pencil, Trash2, X, Search, Image as ImageIcon, Upload } from 'lucide-react';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatId } from '../../utils/formatters';
import AutoTranslate from '../../components/AutoTranslate';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
// CATEGORIES now fetched from database

function EmployeeProducts() {
  const { user } = useAuth();
  const { exchangeRates, refreshExchangeRates } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [ratesForm, setRatesForm] = useState({ THB: 650, USD: 20000 });
  const [savingRates, setSavingRates] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadRates = async () => {
    try {
      const res = await api.get('/exchange_rates/read.php?t=' + Date.now());
      if (res.data?.rates) {
        setRatesForm({
          THB: res.data.rates.THB || 650,
          USD: res.data.rates.USD || 20000
        });
        if (refreshExchangeRates) refreshExchangeRates();
      }
    } catch (err) {}
  };

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
      await loadRates();
      if (refreshExchangeRates) refreshExchangeRates();
      alert('Exchange rates updated successfully!');
      setShowRateModal(false);
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || 'Failed to update exchange rates');
    } finally {
      setSavingRates(false);
    }
  };
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categoryRef = useRef(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    size: '',
    price: '',
    price_lak: '',
    price_thb: '',
    price_usd: '',
    stock: '',
    ingredients: '',
    image_url: ''
  });

  const [categories, setCategories] = useState([]);

  // Close category dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => { 
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products/read.php');
      if (res.data?.data) setProducts(res.data.data);
    } catch (err) {
      console.error("Failed to load products", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories/read.php');
      if (res.data?.data) setCategories(res.data.data);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const uploadForm = new FormData();
      uploadForm.append('image', file);

      const res = await api.post('/products/upload_image.php', uploadForm, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data && res.data.image_url) {
        setFormData(prev => ({ ...prev, image_url: res.data.image_url }));
      } else {
        alert(res.data?.message || 'Upload failed');
        setImagePreview(null);
      }
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.message || err.message));
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSaving(true);
    try {
      const lakVal = parseFloat(formData.price_lak || formData.price || 0);
      const thbVal = (formData.price_thb && parseFloat(formData.price_thb) > 0)
        ? parseFloat(formData.price_thb)
        : 0;
      const usdVal = (formData.price_usd && parseFloat(formData.price_usd) > 0)
        ? parseFloat(formData.price_usd)
        : 0;

      const payload = {
        ...formData,
        price: formData.price_lak,
        price_thb: thbVal,
        price_usd: usdVal
      };
      await api.put('/products/update.php', { ...payload, id: editingProduct.id });
      setShowModal(false);
      resetForm();
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving product');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (p) => {
    setEditingProduct(p);
    setFormData({
      description: p.description || '',
      category: p.category || '',
      size: p.size || '',
      price: p.price || 0,
      price_lak: p.price_lak || 0,
      price_thb: p.price_thb || 0,
      price_usd: p.price_usd || 0,
      stock: p.stock || 0,
      ingredients: p.ingredients || '',
      image_url: p.image_url || ''
    });
    setImagePreview(p.image_url || null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete('/products/delete.php', { data: { id } });
      fetchProducts();
    } catch (err) {
      alert('Error deleting product: ' + (err.response?.data?.message || err.message));
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      description: '',
      category: '',
      size: '',
      price: '',
      price_lak: '',
      price_thb: '',
      price_usd: '',
      stock: '',
      ingredients: '',
      image_url: ''
    });
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filtered = products.filter(p => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const rawId = String(p.id || '').toLowerCase();
    const formattedId = formatId('PRD', p.id || 0).toLowerCase();
    const name = (p.name || '').toLowerCase();
    const category = (p.category || '').toLowerCase();
    const size = (p.size || '').toLowerCase();

    return name.includes(q) || rawId.includes(q) || formattedId.includes(q) || category.includes(q) || size.includes(q);
  });

  return (
    <AutoTranslate>
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-serif text-dark mb-1">Products & Pricing</h1>
          <p className="text-gray-400 text-sm">Manage products and daily foreign exchange rates (THB & USD)</p>
        </div>

        {/* Exchange Rate Badge & Edit Button */}
        <div className="bg-[#FDFBF7] border border-[#8A9A5B]/30 px-4 py-2.5 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="text-xs">
            <span className="font-semibold text-gray-500 block text-[11px] uppercase tracking-wider">Exchange Rates:</span>
            <div className="flex gap-3 text-dark font-bold font-mono text-sm mt-0.5">
              <span>🇹🇭 1 THB = ₭{Number(exchangeRates?.THB || 650).toLocaleString()}</span>
              <span>🇺🇸 1 USD = ₭{Number(exchangeRates?.USD || 20000).toLocaleString()}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenRateModal}
            className="bg-[#8A9A5B] text-white px-3.5 py-2 text-xs font-bold rounded-lg hover:bg-[#7A8A4B] transition-all shadow-sm cursor-pointer"
          >
            ✏️ Edit Rates
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#8A9A5B] bg-white"
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
                <th className="text-left p-4 font-medium">Product</th>
                <th className="text-left p-4 font-medium">Category</th>
                <th className="text-left p-4 font-medium">Price</th>
                <th className="text-left p-4 font-medium">Stock</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <ImageIcon size={16} className="text-gray-300" />
                        </div>
                      )}
                      <div>
                        <Link to={`/product/${p.id}`} className="font-medium text-dark hover:text-[#8A9A5B] hover:underline transition">{p.name}</Link>
                        <p className="text-[10px] text-gray-400 font-mono tracking-widest">{formatId('PRD', p.id)}</p>
                        {p.size && (
                          <span className="block text-xs text-gray-400">{p.size}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-500 text-xs uppercase tracking-wider">{p.category || '—'}</td>
                  <td className="p-4 text-dark text-xs">
                    <div className="font-medium text-sm">{formatCurrency(p.price_lak || p.price, 'LAK')}</div>
                    <div className="text-gray-400">{formatCurrency(getThbPrice(p.price_lak || p.price), 'THB')}</div>
                    <div className="text-gray-400">{formatCurrency(getUsdPrice(p.price_lak || p.price), 'USD')}</div>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        p.stock == 0 ? 'bg-red-100 text-red-700' :
                        p.stock < 30 ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-50 text-emerald-700'
                      }`}>{p.stock}</span>
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(p)} className="p-2 text-gray-400 hover:text-[#8A9A5B] transition rounded-lg hover:bg-gray-50">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-400 hover:text-red-500 transition rounded-lg hover:bg-red-50">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="p-12 text-center text-gray-400">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-xl font-serif text-dark">Add Product Details</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-dark transition"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              
              <div className="mb-6">
                <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">Product Image & Name</label>
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-[#8A9A5B] transition-colors overflow-hidden bg-white shrink-0 group relative"
                  >
                    {imagePreview || formData.image_url ? (
                      <>
                        <img src={imagePreview || formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Upload size={16} className="text-white" />
                        </div>
                      </>
                    ) : (
                      <Upload size={20} className="text-gray-300 group-hover:text-[#8A9A5B] transition-colors" />
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div>
                    <p className="text-lg font-medium text-dark">{editingProduct?.name}</p>
                    <p className="text-xs text-[#8A9A5B] cursor-pointer hover:underline" onClick={() => fileInputRef.current?.click()}>
                      {uploading ? 'Uploading...' : 'Click image to edit'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5">Category</label>
                  <select 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#8A9A5B] bg-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-2">
                  <span className="text-xs uppercase tracking-widest text-[#8A9A5B] font-semibold block mb-3">Size & Stock</span>

                  <div className="flex flex-wrap md:flex-nowrap gap-3 items-end bg-[#FDFBF7] p-3 rounded-lg border border-[#E8DCC4]">
                    <div className="w-full md:w-1/2">
                      <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Size *</label>
                      <input 
                        type="text"
                        list="employee-size-options"
                        required
                        value={formData.size}
                        onChange={e => setFormData({ ...formData, size: e.target.value })}
                        placeholder="E.g. 50ml, 100g, 1 pc"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#8A9A5B] bg-white text-dark" 
                      />
                    </div>

                    <div className="w-full md:w-1/2">
                      <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Stock *</label>
                      <input 
                        type="number"
                        required
                        value={formData.stock}
                        onChange={e => setFormData({ ...formData, stock: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#8A9A5B] bg-white text-dark" 
                      />
                  </div>
                </div>

                <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-2">
                  <span className="text-xs uppercase tracking-widest text-[#8A9A5B] font-semibold block mb-3 font-serif">Sell Prices</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">LAK (₭) *</label>
                      <input 
                        required 
                        type="number" 
                        step="0.01" 
                        value={formData.price_lak} 
                        onChange={e => setFormData({...formData, price_lak: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#8A9A5B] text-dark bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">THB (฿)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={formData.price_thb} 
                        onChange={e => setFormData({...formData, price_thb: e.target.value})}
                        placeholder="Auto / Manual THB"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#8A9A5B] text-dark bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">USD ($)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={formData.price_usd} 
                        onChange={e => setFormData({...formData, price_usd: e.target.value})}
                        placeholder="Auto / Manual USD"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#8A9A5B] text-dark bg-white"
                      />
                    </div>
                  </div>
                </div>

                <datalist id="employee-size-options">
                    {/* Millilitres */}
                    <option value="50ml" />
                    <option value="100ml" />
                    <option value="250ml" />
                    <option value="500ml" />
                    <option value="1000ml" />
                    {/* Grams */}
                    <option value="50g" />
                    <option value="100g" />
                    <option value="250g" />
                    <option value="500g" />
                    <option value="1000g" />
                    {/* Pieces */}
                    <option value="1 pc" />
                    <option value="5 pcs" />
                    <option value="10 pcs" />
                    {/* Boxes */}
                    <option value="1 box" />
                    <option value="12 pcs/box" />
                    <option value="Standard" />
                  </datalist>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5">Description</label>
                  <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#8A9A5B] resize-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5">Ingredients</label>
                  <textarea rows={2} value={formData.ingredients} onChange={e => setFormData({...formData, ingredients: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#8A9A5B] resize-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-sm text-gray-500 hover:text-dark transition">Cancel</button>
                <button type="submit" disabled={saving || uploading}
                  className="px-6 py-2.5 bg-[#1a3a2a] text-white rounded-lg text-sm hover:bg-[#0f2a1c] transition disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exchange Rates Modal */}
      {showRateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-6">
              <div>
                <h3 className="text-xl font-serif text-dark font-bold">Update Foreign Exchange Rates</h3>
                <p className="text-xs text-gray-400 mt-0.5">Set current LAK base rates for Thai Baht (THB) & US Dollar (USD)</p>
              </div>
              <button onClick={() => setShowRateModal(false)} className="text-gray-400 hover:text-dark p-1">
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

export default EmployeeProducts;
