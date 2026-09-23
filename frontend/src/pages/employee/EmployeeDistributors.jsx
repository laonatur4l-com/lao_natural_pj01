import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { Trash2, Edit, Plus, Upload, Loader2, MapPin, Facebook, Globe, Phone, FileText, X } from 'lucide-react';
import AutoTranslate from '../../components/AutoTranslate';

function EmployeeDistributors() {
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null if adding
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    map_url: '',
    facebook_url: '',
    website_url: '',
    phone: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchDistributors();
  }, []);

  const fetchDistributors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/distributors/read.php');
      if (res.data?.data) {
        setDistributors(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load collaborators", err);
      setError("Failed to load collaborators");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      address: '',
      map_url: '',
      facebook_url: '',
      website_url: '',
      phone: ''
    });
    setSelectedFile(null);
    setPreviewUrl('');
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      address: item.address || '',
      map_url: item.map_url || '',
      facebook_url: item.facebook_url || '',
      website_url: item.website_url || '',
      phone: item.phone || ''
    });
    setSelectedFile(null);
    setPreviewUrl(item.image_url);
    setError('');
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!editingItem && !selectedFile) {
      setError("Logo image file is required");
      return;
    }

    setSaving(true);
    setError('');

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('address', formData.address);
      data.append('map_url', formData.map_url);
      data.append('facebook_url', formData.facebook_url);
      data.append('website_url', formData.website_url);
      data.append('phone', formData.phone);

      if (selectedFile) {
        data.append('image', selectedFile);
      }

      if (editingItem) {
        data.append('id', editingItem.id);
        await api.post('/distributors/update.php', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/distributors/create.php', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setShowModal(false);
      await fetchDistributors();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to save details");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this collaborator?")) return;

    try {
      await api.post('/distributors/delete.php', { id });
      await fetchDistributors();
    } catch (err) {
      alert("Failed to delete collaborator: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <AutoTranslate>
      <div className="p-8 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-serif text-dark mb-1">Available At / Places to Buy</h1>
            <p className="text-gray-400 text-sm">Manage collaborate stores, massage shops, hotels, or cafes where clients can buy products.</p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="bg-[#1a3a2a] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-[#2c533e] transition text-sm font-medium"
          >
            <Plus size={16} /> Add Collaborator
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-[#8A9A5B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400 text-sm">Loading places...</p>
          </div>
        ) : distributors.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-12 text-center shadow-sm">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-serif text-lg text-dark mb-1">No Collaborators Added</h3>
            <p className="text-gray-400 text-sm max-w-sm mx-auto mb-6">Show customers where to buy! Add your partners, retail outlets, spas, and hotels with contact details.</p>
            <button
              onClick={handleOpenAdd}
              className="text-sm font-semibold text-[#8A9A5B] hover:text-dark uppercase tracking-widest border-b border-[#8A9A5B]"
            >
              Add First Collaborator
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {distributors.map(item => (
              <div key={item.id} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden group flex flex-col h-full bg-[#fdfbf7]/50">
                <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden flex items-center justify-center p-4 border-b border-gray-50 shrink-0">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-lg text-dark mb-2 tracking-wide">{item.name}</h3>
                    {item.address && (
                      <p className="text-xs text-gray-500 font-light mb-4 line-clamp-2 leading-relaxed">
                        {item.address}
                      </p>
                    )}
                    
                    {/* Active channels indicator */}
                    <div className="flex gap-3 text-gray-400 mb-4">
                      {item.map_url && <MapPin size={14} className="text-[#8A9A5B]" title="Google Maps" />}
                      {item.facebook_url && <Facebook size={14} className="text-blue-600" title="Facebook" />}
                      {item.website_url && <Globe size={14} className="text-teal-600" title="Website" />}
                      {item.phone && <Phone size={14} className="text-gray-600" title="Phone Contact" />}
                    </div>
                  </div>
                  
                  <div className="flex justify-between pt-3 border-t border-gray-50 mt-auto">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[#8A9A5B] hover:bg-[#8A9A5B]/10 text-xs font-semibold uppercase tracking-wider transition"
                    >
                      <Edit size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 text-xs font-semibold uppercase tracking-wider transition"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Dialog */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl flex flex-col">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-serif text-xl text-dark">
                  {editingItem ? 'Edit Collaborator' : 'Add New Collaborator'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1">
                {error && (
                  <div className="bg-red-50 text-red-700 border border-red-100 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Collaborator Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Vientiane Center"
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-white focus:border-emerald-600 focus:outline-none"
                    required
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Address / Details
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="e.g. Khouvieng Road, Vientiane, Prefecture Vientiane 0100"
                    rows="2"
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-white focus:border-emerald-600 focus:outline-none resize-none"
                  />
                </div>

                {/* Image upload */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Logo Image *
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                      {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <Upload size={20} className="text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="border border-gray-200 rounded-lg px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
                      >
                        Upload Logo file
                      </button>
                      <p className="text-[10px] text-gray-400 mt-1">Recommended: PNG/JPG with white/transparent background.</p>
                    </div>
                  </div>
                </div>

                {/* Contact URLs & Details */}
                <div className="pt-2 border-t border-gray-100 space-y-3">
                  <h4 className="font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Contact & Map Links</h4>
                  
                  {/* Google Maps link */}
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-gray-400 shrink-0" />
                    <input
                      type="url"
                      name="map_url"
                      value={formData.map_url}
                      onChange={handleInputChange}
                      placeholder="Google Maps URL"
                      className="flex-1 border border-gray-200 rounded-lg p-2 text-xs bg-white focus:outline-none"
                    />
                  </div>

                  {/* Facebook link */}
                  <div className="flex items-center gap-2">
                    <Facebook size={16} className="text-gray-400 shrink-0" />
                    <input
                      type="url"
                      name="facebook_url"
                      value={formData.facebook_url}
                      onChange={handleInputChange}
                      placeholder="Facebook Page URL"
                      className="flex-1 border border-gray-200 rounded-lg p-2 text-xs bg-white focus:outline-none"
                    />
                  </div>

                  {/* Website link */}
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-gray-400 shrink-0" />
                    <input
                      type="url"
                      name="website_url"
                      value={formData.website_url}
                      onChange={handleInputChange}
                      placeholder="Website URL"
                      className="flex-1 border border-gray-200 rounded-lg p-2 text-xs bg-white focus:outline-none"
                    />
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-400 shrink-0" />
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Phone Number"
                      className="flex-1 border border-gray-200 rounded-lg p-2 text-xs bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Form actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-[#1a3a2a] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#2c533e] transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    {editingItem ? 'Save Changes' : 'Create Collaborator'}
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

export default EmployeeDistributors;
