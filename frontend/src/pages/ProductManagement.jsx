import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency } from '../utils/formatters';

function ProductManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    size: '',
    price: '',
    stock: '',
    image_url: '',
    ingredients: ''
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!user || (user.role !== 'owner' && user.role !== 'employee')) {
      navigate('/dashboard');
      return;
    }
    fetchProducts();
    fetchCategories();
  }, [user, navigate]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories/read.php');
      if (res.data?.data) setCategories(res.data.data);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products/read.php');
      if (res.data && res.data.data) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load products", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put('/products/update.php', { ...formData, id: editingProduct.id });
      } else {
        await api.post('/products/create.php', formData);
      }
      setShowModal(false);
      resetForm();
      fetchProducts();
    } catch (err) {
      alert("Error saving product: " + (err.response?.data?.message || err.message));
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      category: product.category || '',
      size: product.size || '',
      price: product.price,
      stock: product.stock || 0,
      image_url: product.image_url || '',
      ingredients: product.ingredients || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await api.delete('/products/delete.php', { data: { id } });
        fetchProducts();
      } catch (err) {
        alert("Error deleting product: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      category: '',
      size: '',
      price: '',
      stock: '',
      image_url: '',
      ingredients: ''
    });
  };

  if (!user || (user.role !== 'owner' && user.role !== 'employee')) return null;

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12 min-h-[70vh]">
      <div className="flex justify-between items-end mb-12 border-b border-[#E8DCC4] pb-6">
        <div>
          <h1 className="text-4xl font-serif text-dark mb-2">Product Management</h1>
          <p className="text-gray-500 font-light tracking-wide">Add, update or remove items from your collection</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-dark text-white px-6 py-3 uppercase tracking-widest text-xs hover:bg-black transition-colors"
        >
          Add New Product
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading inventory...</p>
      ) : (
        <div className="overflow-x-auto border border-[#E8DCC4] bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FDFBF7] text-xs uppercase tracking-widest text-gray-500 border-b border-[#E8DCC4]">
                <th className="p-4 font-normal">Product</th>
                <th className="p-4 font-normal">Category</th>
                <th className="p-4 font-normal">Price</th>
                <th className="p-4 font-normal">Stock</th>
                <th className="p-4 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DCC4] text-sm text-dark">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 flex items-center space-x-4">
                    {product.image_url && (
                      <img src={product.image_url} alt={product.name} className="w-10 h-10 object-cover border border-[#E8DCC4]" />
                    )}
                    <div>
                      <span className="font-medium">{product.name}</span>
                      {product.size && <p className="text-xs text-gray-400 font-light">{product.size}</p>}
                    </div>
                  </td>
                  <td className="p-4 text-gray-500 uppercase tracking-wider text-xs">{product.category}</td>
                  <td className="p-4">{formatCurrency(product.price)}</td>
                  <td className="p-4">
                    <span className={product.stock < 30 ? 'text-red-600 font-bold' : ''}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-4">
                    <button onClick={() => handleEdit(product)} className="text-primary hover:text-dark uppercase tracking-widest text-xs">Edit</button>
                    <button onClick={() => handleDelete(product.id)} className="text-red-400 hover:text-red-700 uppercase tracking-widest text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && <div className="p-12 text-center text-gray-400 font-light">Your collection is empty.</div>}
        </div>
      )}

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#FDFBF7] border border-[#E8DCC4] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
            <h2 className="text-2xl font-serif mb-8 text-dark">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Product Name *</label>
                  <input 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-[#E8DCC4] focus:outline-none focus:border-primary bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-2 border border-[#E8DCC4] focus:outline-none focus:border-primary bg-white text-sm"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Size *</label>
                    <input 
                      type="text" required
                      value={formData.size}
                      onChange={(e) => setFormData({...formData, size: e.target.value})}
                      placeholder="e.g. 100g, 250ml"
                      className="w-full px-4 py-2 border border-[#E8DCC4] focus:outline-none focus:border-primary bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Price (₭) *</label>
                    <input 
                      type="number" step="0.01" required
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="w-full px-4 py-2 border border-[#E8DCC4] focus:outline-none focus:border-primary bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Stock</label>
                    <input 
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: e.target.value})}
                      className="w-full px-4 py-2 border border-[#E8DCC4] focus:outline-none focus:border-primary bg-white text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Image URL</label>
                  <input 
                    value={formData.image_url}
                    onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                    className="w-full px-4 py-2 border border-[#E8DCC4] focus:outline-none focus:border-primary bg-white"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Description</label>
                  <textarea 
                    rows="4"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-2 border border-[#E8DCC4] focus:outline-none focus:border-primary bg-white resize-none"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Ingredients</label>
                  <textarea 
                    rows="4"
                    value={formData.ingredients}
                    onChange={(e) => setFormData({...formData, ingredients: e.target.value})}
                    className="w-full px-4 py-2 border border-[#E8DCC4] focus:outline-none focus:border-primary bg-white resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end space-x-4 mt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 uppercase tracking-widest text-xs text-gray-500 hover:text-dark transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-dark text-white px-8 py-3 uppercase tracking-widest text-xs hover:bg-black transition-colors"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductManagement;
