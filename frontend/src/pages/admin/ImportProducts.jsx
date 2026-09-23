import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { Plus, Pencil, Trash2, X, Package, Upload, Image as ImageIcon, History, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatId, getThbPrice, getUsdPrice } from '../../utils/formatters';
import AutoTranslate from '../../components/AutoTranslate';
import { useCart } from '../../context/CartContext';

// CATEGORIES now fetched from database

function ImportProducts() {
  const { exchangeRates, refreshExchangeRates } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [ratesForm, setRatesForm] = useState({ THB: 650, USD: 20000 });
  const [savingRates, setSavingRates] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

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
  const [importHistory, setImportHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const fileInputRef = useRef(null);
  const categoryRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    ingredients: '',
    image_url: ''
  });
  const [sizes, setSizes] = useState([
    { id: '', size: '', price_lak: '', price_thb: '', price_usd: '', stock: '' }
  ]);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Category logic removed, as owner no longer sets category

  useEffect(() => { 
    fetchProducts();
    fetchCategories();
  }, []);

  // Handled click outside removed since category combobox is gone

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

      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost/lao_natural_pj01/backend/api/products/upload_image.php', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: uploadForm
      });
      const data = await res.json();

      if (res.ok && data.image_url) {
        setFormData(prev => ({ ...prev, image_url: data.image_url }));
      } else {
        alert(data.message || 'Upload failed');
        setImagePreview(null);
      }
    } catch (err) {
      alert('Upload failed: ' + err.message);
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      for (const sizeEntry of sizes) {
        const parsedId = String(sizeEntry.id || '').trim();
        const lakVal = parseFloat(sizeEntry.price_lak || 0);
        const thbVal = (sizeEntry.price_thb && parseFloat(sizeEntry.price_thb) > 0) 
          ? parseFloat(sizeEntry.price_thb) 
          : 0;
        const usdVal = (sizeEntry.price_usd && parseFloat(sizeEntry.price_usd) > 0) 
          ? parseFloat(sizeEntry.price_usd) 
          : 0;

        const payload = {
          ...formData,
          id: parsedId,
          size: sizeEntry.size,
          price: sizeEntry.price_lak,
          price_lak: sizeEntry.price_lak,
          price_thb: thbVal,
          price_usd: usdVal,
          stock: sizeEntry.stock,
          import_price: 0,
          import_price_lak: 0,
          import_price_thb: 0,
          import_price_usd: 0
        };
        if (editingProduct && sizeEntry.isOriginal) {
          await api.put('/products/update.php', { ...payload, old_id: editingProduct.id });
        } else {
          await api.post('/admin/import_product.php', payload);
        }
      }
      setShowModal(false);
      resetForm();
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving product');
    } finally {
      setSaving(false);
    }
  };

  const handleSizeIdChange = (index, idValue) => {
    const updatedSizes = [...sizes];
    updatedSizes[index] = { ...updatedSizes[index], id: idValue };

    const numericId = idValue.replace(/\D/g, '');
    const cleanStr = idValue.trim().toLowerCase();

    if (!editingProduct && (numericId || cleanStr)) {
      const found = products.find(p => 
        (numericId && String(p.id) === String(numericId)) ||
        (cleanStr && formatId('PRD', p.id).toLowerCase() === cleanStr) ||
        (cleanStr && String(p.id).toLowerCase() === cleanStr)
      );
      if (found) {
        setFormData({
          name: found.name || '',
          category: found.category || '',
          description: found.description || '',
          ingredients: found.ingredients || '',
          image_url: found.image_url || ''
        });
        setImagePreview(found.image_url || null);

        updatedSizes[index].size = found.size || '';
        updatedSizes[index].price_lak = found.price_lak || found.price || '';
        updatedSizes[index].price_thb = found.price_thb || '';
        updatedSizes[index].price_usd = found.price_usd || '';
        updatedSizes[index].stock = found.stock || '';
      }
    }
    setSizes(updatedSizes);
  };

  const handleEdit = (p) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      category: p.category || '',
      description: p.description || '',
      ingredients: p.ingredients || '',
      image_url: p.image_url || ''
    });
    setSizes([
      {
        id: formatId('PRD', p.id) || p.id,
        size: p.size || '',
        price_lak: p.price_lak || p.price || '',
        price_thb: p.price_thb || '',
        price_usd: p.price_usd || '',
        stock: p.stock || 0,
        isOriginal: true
      }
    ]);
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
      name: '',
      category: '',
      description: '',
      ingredients: '',
      image_url: ''
    });
    setSizes([
      { id: '', size: '', price_lak: '', price_thb: '', price_usd: '', stock: '' }
    ]);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleViewHistory = async (id) => {
    setHistoryLoading(true);
    setShowHistoryModal(true);
    try {
      const res = await api.get(`/admin/read_product_imports.php?product_id=${id}`);
      if (res.data?.data) setImportHistory(res.data.data);
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    if (filterType === 'low' && !(p.stock > 0 && p.stock < 30)) return false;
    if (filterType === 'out' && p.stock != 0) return false;

    // Category / Product Type Filter
    if (selectedCategory !== 'all') {
      if (!p.category || p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      const rawId = String(p.id || '').toLowerCase();
      const formattedId = formatId('PRD', p.id || 0).toLowerCase(); // e.g. "prd-126"
      const name = (p.name || '').toLowerCase();
      const category = (p.category || '').toLowerCase();
      const size = (p.size || '').toLowerCase();
      const description = (p.description || '').toLowerCase();

      const matchesName = name.includes(q);
      const matchesId = rawId.includes(q) || formattedId.includes(q) || `prd-${rawId}`.includes(q) || `prd${rawId}`.includes(q);
      const matchesCategory = category.includes(q);
      const matchesSize = size.includes(q);
      const matchesDesc = description.includes(q);

      return matchesName || matchesId || matchesCategory || matchesSize || matchesDesc;
    }

    return true;
  });

  return (
    <AutoTranslate>
      <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-serif text-dark mb-1">Product Management & Pricing</h1>
          <p className="text-gray-400 text-sm">Add products and set daily foreign exchange rates (THB & USD)</p>
        </div>

        {/* Exchange Rate Badge & Edit Button */}
        <div className="bg-[#FDFBF7] border border-[#8A9A5B]/30 px-4 py-2.5 rounded-xl flex items-center gap-4 shadow-sm shrink-0">
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

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
          {/* Product Type / Category Filter Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-dark focus:outline-none focus:border-[#8A9A5B] shadow-sm cursor-pointer"
          >
            <option value="all">All Product Types</option>
            {categories.map(cat => (
              <option key={cat.id || cat.name} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Search Input Bar */}
          <div className="relative flex-1 sm:w-72">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, ID (e.g. PRD-126)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8A9A5B] bg-white shadow-sm transition"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Import Product Button */}
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center justify-center gap-2 bg-[#2C2C2C] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-black transition-colors shadow-sm shrink-0 cursor-pointer"
          >
            <Plus size={16} /> Import Product
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div 
          onClick={() => setFilterType('all')}
          className={`border rounded-xl p-4 flex items-center gap-3 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-sm ${
            filterType === 'all' ? 'border-[#8A9A5B] bg-[#8A9A5B]/5 shadow-sm' : 'bg-white border-gray-100'
          }`}
        >
          <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-lg"><Package size={18} /></div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest">Total Products</p>
            <p className="text-xl font-semibold text-dark">{products.length}</p>
          </div>
        </div>
        <div 
          onClick={() => setFilterType('low')}
          className={`border rounded-xl p-4 flex items-center gap-3 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-sm ${
            filterType === 'low' ? 'border-amber-500 bg-amber-50/30 shadow-sm' : 'bg-white border-gray-100'
          }`}
        >
          <div className="bg-amber-50 text-amber-600 p-2.5 rounded-lg"><Package size={18} /></div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest">Low Stock</p>
            <p className="text-xl font-semibold text-dark">{products.filter(p => p.stock > 0 && p.stock < 30).length}</p>
          </div>
        </div>
        <div 
          onClick={() => setFilterType('out')}
          className={`border rounded-xl p-4 flex items-center gap-3 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-sm ${
            filterType === 'out' ? 'border-red-500 bg-red-50/30 shadow-sm' : 'bg-white border-gray-100'
          }`}
        >
          <div className="bg-red-50 text-red-600 p-2.5 rounded-lg"><Package size={18} /></div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest">Out of Stock</p>
            <p className="text-xl font-semibold text-dark">{products.filter(p => p.stock == 0).length}</p>
          </div>
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
              {filteredProducts.map(p => (
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
                          <span className="block text-xs text-gray-400 font-light">{p.size}</span>
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
                      <button onClick={() => handleViewHistory(p.id)} className="p-2 text-gray-400 hover:text-blue-500 transition rounded-lg hover:bg-blue-50" title="Import History">
                        <History size={14} />
                      </button>
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
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-400">
                    {filterType === 'low' ? 'No low stock products found' :
                     filterType === 'out' ? 'No out of stock products found' :
                     'No products imported yet'}
                  </td>
                </tr>
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
              <h2 className="text-xl font-serif text-dark">{editingProduct ? 'Edit Product' : 'Import New Product'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-dark transition"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">

              {/* Image Upload Section */}
              <div className="mb-6">
                <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">Product Image</label>
                <div className="flex items-start gap-4">
                  {/* Preview */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-[#8A9A5B] transition-colors overflow-hidden bg-gray-50 shrink-0 group"
                  >
                    {imagePreview || formData.image_url ? (
                      <img src={imagePreview || formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <Upload size={24} className="mx-auto text-gray-300 group-hover:text-[#8A9A5B] transition-colors" />
                        <p className="text-xs text-gray-400 mt-1">Upload</p>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark hover:bg-gray-100 transition disabled:opacity-50"
                    >
                      <Upload size={14} />
                      {uploading ? 'Uploading...' : 'Choose Image'}
                    </button>
                    <p className="text-xs text-gray-400">JPEG, PNG, GIF, WebP • Max 5MB</p>
                    {/* OR use URL */}
                    <div className="pt-1">
                      <p className="text-xs text-gray-400 mb-1">Or paste image URL:</p>
                      <input
                        value={formData.image_url}
                        onChange={e => {
                          setFormData({...formData, image_url: e.target.value});
                          setImagePreview(e.target.value || null);
                        }}
                        placeholder="https://..."
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#8A9A5B]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5">Product Name *</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#8A9A5B]" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5">Category *</label>
                  <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#8A9A5B] bg-white">
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-2">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs uppercase tracking-widest text-[#8A9A5B] font-semibold">Sizes, Prices & Stock *</span>
                      <button
                        type="button"
                        onClick={() => setSizes([...sizes, { id: '', size: '', price_lak: '', price_thb: '', price_usd: '', stock: '' }])}
                        className="text-xs font-semibold text-[#8A9A5B] hover:text-dark uppercase tracking-wider flex items-center gap-1.5"
                      >
                        + Add Size Variation
                      </button>
                  </div>
                  
                  <div className="space-y-4">
                    {sizes.map((sizeEntry, index) => (
                      <div key={index} className="p-4 bg-[#FDFBF7] rounded-xl border border-[#E8DCC4] space-y-3 relative">
                        {sizes.length > 1 && (!editingProduct || !sizeEntry.isOriginal) && (
                          <button
                            type="button"
                            onClick={() => setSizes(sizes.filter((_, idx) => idx !== index))}
                            className="absolute top-3 right-3 text-xs text-red-500 hover:text-red-700 uppercase tracking-widest font-semibold"
                          >
                            Remove
                          </button>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Product ID *</label>
                            <input 
                              required 
                              type="text" 
                              placeholder="E.g. PRD-998 or 998"
                              value={sizeEntry.id} 
                              onChange={e => handleSizeIdChange(index, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#8A9A5B] bg-white text-dark font-sans" 
                            />
                            {!editingProduct && sizeEntry.id && products.some(p => {
                              const targetNum = String(sizeEntry.id).replace(/\D/g, '');
                              const targetStr = String(sizeEntry.id).trim().toLowerCase();
                              return (targetNum && String(p.id) === targetNum) || (targetStr && formatId('PRD', p.id).toLowerCase() === targetStr) || String(p.id).toLowerCase() === targetStr;
                            }) && (
                              <span className="text-[9px] text-emerald-600 font-semibold block mt-0.5 uppercase tracking-wider">
                                ✓ Existing
                              </span>
                            )}
                            {editingProduct && sizeEntry.id && String(sizeEntry.id) !== String(editingProduct.id) && products.some(p => String(p.id) === String(sizeEntry.id)) && (
                              <span className="text-[9px] text-rose-600 font-semibold block mt-0.5 uppercase tracking-wider">
                                ⚠ Conflict
                              </span>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Size *</label>
                            <input 
                              required 
                              type="text" 
                              placeholder="E.g. 50ml, 100g"
                              value={sizeEntry.size} 
                              onChange={e => {
                                const updated = [...sizes];
                                updated[index].size = e.target.value;
                                setSizes(updated);
                              }}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#8A9A5B] bg-white text-dark" 
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Initial Stock *</label>
                            <input 
                              required 
                              type="number" 
                              placeholder="Stock"
                              value={sizeEntry.stock} 
                              onChange={e => {
                                const updated = [...sizes];
                                updated[index].stock = e.target.value;
                                setSizes(updated);
                              }}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#8A9A5B] bg-white text-dark" 
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                          <div>
                            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Sell Price LAK (₭) *</label>
                            <input 
                              required 
                              type="number" 
                              step="0.01" 
                              placeholder="LAK Price"
                              value={sizeEntry.price_lak} 
                              onChange={e => {
                                const updated = [...sizes];
                                updated[index].price_lak = e.target.value;
                                setSizes(updated);
                              }}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#8A9A5B] bg-white text-dark" 
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Sell Price THB (฿)</label>
                            <input 
                              type="number" 
                              step="0.01" 
                              placeholder="THB Price"
                              value={sizeEntry.price_thb} 
                              onChange={e => {
                                const updated = [...sizes];
                                updated[index].price_thb = e.target.value;
                                setSizes(updated);
                              }}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#8A9A5B] bg-white text-dark" 
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Sell Price USD ($)</label>
                            <input 
                              type="number" 
                              step="0.01" 
                              placeholder="USD Price"
                              value={sizeEntry.price_usd} 
                              onChange={e => {
                                const updated = [...sizes];
                                updated[index].price_usd = e.target.value;
                                setSizes(updated);
                              }}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#8A9A5B] bg-white text-dark" 
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-2">
                  <span className="text-xs uppercase tracking-widest text-[#8A9A5B] font-semibold block mb-3">Product Description & Ingredients</span>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5">Description</label>
                      <textarea 
                        value={formData.description} 
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        placeholder="Provide details about the product..."
                        rows={3}
                        className="w-full px-4 py-2.5 border border-[#E8DCC4] rounded-lg text-sm focus:outline-none focus:border-[#8A9A5B] bg-[#FDFBF7] text-dark font-sans resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5">Ingredients</label>
                      <textarea 
                        value={formData.ingredients} 
                        onChange={e => setFormData({...formData, ingredients: e.target.value})}
                        placeholder="E.g. Saponified Coconut Oil, Mountain Honey..."
                        rows={2}
                        className="w-full px-4 py-2.5 border border-[#E8DCC4] rounded-lg text-sm focus:outline-none focus:border-[#8A9A5B] bg-[#FDFBF7] text-dark font-sans resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-sm text-gray-500 hover:text-dark transition">Cancel</button>
                <button type="submit" disabled={saving || uploading}
                  className="px-6 py-2.5 bg-[#2C2C2C] text-white rounded-lg text-sm hover:bg-black transition disabled:opacity-50">
                  {saving ? 'Saving...' : (editingProduct ? 'Save Changes' : 'Import Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowHistoryModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-serif text-dark">Import History</h2>
              <button onClick={() => setShowHistoryModal(false)} className="p-1 text-gray-400 hover:text-dark transition"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto">
              {historyLoading ? (
                <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-[#8A9A5B] border-t-transparent rounded-full animate-spin"></div></div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                      <th className="text-left p-3 font-medium">Import ID</th>
                      <th className="text-left p-3 font-medium">Product ID</th>
                      <th className="text-left p-3 font-medium">Date & Time</th>
                      <th className="text-left p-3 font-medium">Supplier</th>
                      <th className="text-left p-3 font-medium">Qty</th>
                      <th className="text-left p-3 font-medium">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {importHistory.length > 0 ? importHistory.map(h => (
                      <tr key={h.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                        <td className="p-3 font-mono text-xs">{formatId('IMP', h.id)}</td>
                        <td className="p-3 font-mono text-xs">{formatId('PRD', h.product_id)}</td>
                        <td className="p-3">{new Date(h.import_date).toLocaleString()}</td>
                        <td className="p-3">{h.supplier_name}</td>
                        <td className="p-3">{h.quantity}</td>
                        <td className="p-3 text-xs">
                          <div className="font-medium">{formatCurrency(h.import_price_lak || h.import_price, 'LAK')}</div>
                          {h.import_price_thb > 0 && <div className="text-gray-400">{formatCurrency(h.import_price_thb, 'THB')}</div>}
                          {h.import_price_usd > 0 && <div className="text-gray-400">{formatCurrency(h.import_price_usd, 'USD')}</div>}
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={6} className="p-8 text-center text-gray-400">No import records found.</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
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

export default ImportProducts;
