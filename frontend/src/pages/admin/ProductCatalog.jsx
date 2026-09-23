import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatCurrency, formatId } from '../../utils/formatters';
import { Search, Eye, X, Package, Info, User, Tag, Layers, Clipboard, Pencil } from 'lucide-react';
import AutoTranslate from '../../components/AutoTranslate';

function ProductCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Quick Edit State
  const [editingProduct, setEditingProduct] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ price: '', stock: '', description: '', ingredients: '', category: '', name: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products/read.php');
      if (res.data?.data) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load products", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formatId('PRD', p.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetail = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const handleStartEdit = (product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name || '',
      price: product.price_lak || product.price || '',
      stock: product.stock || 0,
      description: product.description || '',
      ingredients: product.ingredients || '',
      category: product.category || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const numPrice = parseFloat(editForm.price);
      const numStock = parseInt(editForm.stock, 10);
      await api.put('/products/update.php', {
        id: editingProduct.id,
        name: editForm.name,
        price: numPrice,
        price_lak: numPrice,
        stock: numStock,
        description: editForm.description,
        ingredients: editForm.ingredients,
        category: editForm.category
      });
      alert('Product price & details updated successfully!');
      setShowEditModal(false);
      if (showModal && selectedProduct?.id === editingProduct.id) {
        setSelectedProduct({
          ...selectedProduct,
          name: editForm.name,
          price: numPrice,
          price_lak: numPrice,
          stock: numStock,
          description: editForm.description,
          ingredients: editForm.ingredients,
          category: editForm.category
        });
      }
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || 'Failed to update product');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <AutoTranslate>
      <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif text-dark mb-1">Product Catalog</h1>
          <p className="text-gray-400 text-sm">Detailed inventory and product pricing management</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, ID, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8A9A5B] shadow-sm transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-20 flex flex-col items-center justify-center shadow-sm">
          <div className="w-10 h-10 border-3 border-[#8A9A5B] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400 text-sm tracking-widest uppercase">Loading botanicals...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div 
              key={product.id} 
              className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col"
            >
              <div className="aspect-square relative overflow-hidden bg-gray-50">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Package size={48} strokeWidth={1} />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-[10px] font-mono tracking-widest text-dark rounded-full shadow-sm border border-gray-100">
                    {formatId('PRD', product.id)}
                  </span>
                </div>
                <div className="absolute bottom-4 right-4 translate-y-12 group-hover:translate-y-0 transition-transform duration-300 flex gap-2">
                  <button 
                    onClick={() => handleStartEdit(product)}
                    className="p-3 bg-[#2C2C2C] text-white rounded-2xl shadow-lg hover:bg-black transition-colors cursor-pointer"
                    title="Edit Product & Price"
                  >
                    <Pencil size={18} />
                  </button>
                  <button 
                    onClick={() => handleViewDetail(product)}
                    className="p-3 bg-[#8A9A5B] text-white rounded-2xl shadow-lg hover:bg-dark transition-colors cursor-pointer"
                    title="View Details"
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-serif text-xl text-dark line-clamp-1">{product.name}</h3>
                </div>
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">{product.category || 'Uncategorized'}</p>
                
                <div className="grid grid-cols-2 gap-4 mt-auto border-t border-gray-50 pt-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Price</p>
                    <p className="text-lg font-serif text-[#8A9A5B]">{formatCurrency(product.price)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Stock</p>
                    <p className={`text-lg font-semibold ${product.stock < 30 ? 'text-rose-500' : 'text-dark'}`}>
                      {product.stock} <span className="text-[10px] font-normal text-gray-400">units</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
              <Package className="mx-auto text-gray-200 mb-4" size={48} />
              <p className="text-gray-400 font-serif text-lg">No products found in the catalog</p>
            </div>
          )}
        </div>
      )}

      {/* Product Detail Modal */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-[#F8F6F1]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-[#8A9A5B]">
                  <Info size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-serif text-dark">{selectedProduct.name}</h2>
                  <p className="text-xs text-gray-400 uppercase tracking-[0.2em] font-medium">{formatId('PRD', selectedProduct.id)}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 bg-white text-gray-400 hover:text-dark rounded-full shadow-sm transition-all hover:rotate-90 cursor-pointer">
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Image Section */}
                <div className="space-y-6">
                  <div className="aspect-square rounded-3xl overflow-hidden border border-gray-100 bg-gray-50 shadow-inner">
                    {selectedProduct.image_url ? (
                      <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-200">
                        <Package size={100} strokeWidth={1} />
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1.5">
                        <Tag size={10} /> Sell Price
                      </p>
                      <p className="text-xl font-serif text-dark">{formatCurrency(selectedProduct.price)}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1.5">
                        <Layers size={10} /> In Stock
                      </p>
                      <p className="text-xl font-semibold text-dark">{selectedProduct.stock} units</p>
                    </div>
                  </div>

                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-xl text-emerald-600 shadow-sm">
                        <User size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-emerald-600/60 font-semibold">Imported By</p>
                        <p className="text-sm font-medium text-emerald-900">{selectedProduct.importer_name || 'System / Admin'}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-white/50 text-[10px] font-bold text-emerald-600 rounded-full uppercase tracking-widest border border-emerald-100">Verified</span>
                  </div>
                </div>

                {/* Info Section */}
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold mb-4 flex items-center gap-2">
                      <Clipboard size={14} className="text-[#8A9A5B]" /> Description
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedProduct.description || 'No description available for this botanical product.'}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold mb-4 flex items-center gap-2">
                      <Package size={14} className="text-[#8A9A5B]" /> Ingredients
                    </h3>
                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 italic text-gray-500 text-sm leading-relaxed">
                      {selectedProduct.ingredients || 'Ingredients not specified.'}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100 grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Category</p>
                      <p className="text-sm font-medium text-dark">{selectedProduct.category || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Unit Size</p>
                      <p className="text-sm font-medium text-dark">{selectedProduct.size || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              <button 
                onClick={() => handleStartEdit(selectedProduct)}
                className="px-6 py-2.5 bg-[#8A9A5B] text-white rounded-xl text-sm font-bold hover:bg-[#7A8A4B] transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Pencil size={16} /> Edit Product & Price
              </button>
              <button 
                onClick={() => setShowModal(false)}
                className="px-8 py-2.5 bg-dark text-white rounded-xl text-sm font-semibold hover:bg-black transition-all cursor-pointer"
              >
                Close Catalog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Edit Price & Product Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-gray-100" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-6">
              <div>
                <h3 className="text-xl font-serif text-dark font-bold">Edit Product & Pricing</h3>
                <p className="text-xs text-gray-400 mt-0.5">{formatId('PRD', editingProduct.id)} — {editingProduct.name}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-dark p-1 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 font-semibold mb-1.5">Product Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8A9A5B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 font-semibold mb-1.5">Price (LAK ₭)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editForm.price}
                    onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-dark focus:outline-none focus:border-[#8A9A5B]"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 font-semibold mb-1.5">Stock Count</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editForm.stock}
                    onChange={e => setEditForm({ ...editForm, stock: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-dark focus:outline-none focus:border-[#8A9A5B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 font-semibold mb-1.5">Description</label>
                <textarea
                  rows={2}
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8A9A5B] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 font-semibold mb-1.5">Ingredients</label>
                <textarea
                  rows={2}
                  value={editForm.ingredients}
                  onChange={e => setEditForm({ ...editForm, ingredients: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8A9A5B] resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2 text-sm text-gray-500 hover:text-dark transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-6 py-2 bg-[#8A9A5B] text-white font-bold rounded-xl text-sm hover:bg-[#7A8A4B] transition shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
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

export default ProductCatalog;
