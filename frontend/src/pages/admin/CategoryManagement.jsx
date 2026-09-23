import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatId } from '../../utils/formatters';
import { Plus, Pencil, Trash2, X, Tag, Search } from 'lucide-react';
import AutoTranslate from '../../components/AutoTranslate';

function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories/read.php');
      if (res.data?.data) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load categories", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    setSaving(true);
    try {
      if (editingCategory) {
        await api.put('/categories/update.php', { id: editingCategory.id, name: categoryName });
      } else {
        await api.post('/categories/create.php', { name: categoryName });
      }
      setShowModal(false);
      setCategoryName('');
      setEditingCategory(null);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || "Error saving category");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (cat) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category? Products using this category will still have the category name, but it won't appear in the active dropdowns.")) return;

    try {
      await api.delete('/categories/delete.php', { data: { id } });
      fetchCategories();
    } catch (err) {
      alert("Error deleting category: " + (err.response?.data?.message || err.message));
    }
  };

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.id.toString().includes(searchTerm)
  );

  return (
    <AutoTranslate>
      <div className="p-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif text-dark mb-1">Category Management</h1>
          <p className="text-gray-400 text-sm">Manage product categories for the store</p>
        </div>
        <button
          onClick={() => { setEditingCategory(null); setCategoryName(''); setShowModal(true); }}
          className="flex items-center gap-2 bg-dark text-white px-5 py-2.5 rounded-xl text-sm hover:bg-black transition-all shadow-lg shadow-dark/20"
        >
          <Plus size={18} /> Add Category
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-[#8A9A5B] shadow-sm transition-all"
        />
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 flex justify-center">
          <div className="w-8 h-8 border-2 border-[#8A9A5B] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] text-gray-400 uppercase tracking-[0.2em] bg-gray-50/50 border-b border-gray-50">
                <th className="p-6 font-semibold">ID</th>
                <th className="p-6 font-semibold">Category Name</th>
                <th className="p-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCategories.length > 0 ? filteredCategories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="p-6 text-gray-400 font-mono text-xs">{cat.id.toString().padStart(3, '0')}</td>
                  <td className="p-6 font-medium text-dark">{cat.name}</td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="p-2 text-gray-400 hover:text-[#8A9A5B] hover:bg-[#8A9A5B]/10 rounded-lg transition-all"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="3" className="p-12 text-center text-gray-400">No categories found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-[#F8F6F1]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#8A9A5B]/20 text-[#8A9A5B] rounded-xl">
                  <Tag size={20} />
                </div>
                <h2 className="text-xl font-serif text-dark">{editingCategory ? 'Edit Category' : 'New Category'}</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-dark transition-colors bg-white rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8">
              <div className="mb-6">
                <label className="block text-xs uppercase tracking-[0.2em] text-gray-400 font-bold mb-3">Category Name</label>
                <input
                  autoFocus
                  required
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g. Skincare, Soap, etc."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-[#8A9A5B] focus:bg-white transition-all"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-100 text-gray-400 rounded-2xl text-sm hover:text-dark hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !categoryName.trim()}
                  className="flex-1 px-6 py-3 bg-dark text-white rounded-2xl text-sm hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-dark/20"
                >
                  {saving ? 'Saving...' : 'Save Category'}
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

export default CategoryManagement;
