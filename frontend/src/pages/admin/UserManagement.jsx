import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../utils/api';
import { Plus, Pencil, Trash2, Search, X, Image as ImageIcon, Eye, Mail, Phone, MapPin, Calendar, Briefcase, User as UserIcon } from 'lucide-react';
import { formatId, getUserPrefix } from '../../utils/formatters';
import AutoTranslate from '../../components/AutoTranslate';

function UserManagement() {
  const location = useLocation();

  // Derive role filter from the URL path
  const filter = location.pathname.endsWith('/employees') ? 'employee'
    : location.pathname.endsWith('/customers') ? 'user'
    : 'all';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'employee', phone: '', address: '', profile_picture: '' });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => { setLoading(true); fetchUsers(); }, [filter]);

  const fetchUsers = async () => {
    try {
      const params = filter !== 'all' ? `?role=${filter}` : '';
      const res = await api.get(`/admin/users.php${params}`);
      if (res.data?.data) setUsers(res.data.data);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingUser) {
        const payload = { ...formData, id: editingUser.id };
        if (!payload.password) delete payload.password;
        await api.put('/admin/users.php', payload);
      } else {
        await api.post('/admin/users.php', formData);
      }
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving user');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (u) => {
    setEditingUser(u);
    setFormData({ name: u.name, email: u.email, password: '', role: u.role, phone: u.phone || '', address: u.address || '', profile_picture: u.profile_picture || '' });
    setShowModal(true);
  };

  const handleView = (u) => {
    setSelectedUser(u);
    setShowViewModal(true);
  };

  const handleImageUpload = async (e) => {
    if (!e.target.files[0]) return;
    setUploadingAvatar(true);
    const data = new FormData();
    data.append('image', e.target.files[0]);

    try {
      const res = await api.post('/products/upload_image.php', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.image_url) {
        setFormData(prev => ({ ...prev, profile_picture: res.data.image_url }));
      } else {
        alert('Upload succeeded but no URL returned.');
      }
    } catch (err) {
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete('/admin/users.php', { data: { id } });
      fetchUsers();
    } catch (err) {
      alert('Error deleting user: ' + (err.response?.data?.message || err.message));
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: 'employee', phone: '', address: '', profile_picture: '' });
  };

  const filtered = users
    .filter(u => u.email !== 'superadmin' && u.email !== 'superadmin@laonatural.com' && (u.name || '').toLowerCase() !== 'superadmin')
    .filter(u =>
      (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase())
    );

  const pageTitle = filter === 'employee' ? 'Employees'
    : filter === 'user' ? 'Customers'
    : 'All Users';

  const pageDesc = filter === 'employee' ? 'Manage store employees'
    : filter === 'user' ? 'View registered customers'
    : 'All employees & customers';

  const roleBadge = (role) => {
    const styles = {
      owner: 'bg-purple-50 text-purple-700',
      employee: 'bg-blue-50 text-blue-700',
      user: 'bg-gray-100 text-gray-600',
    };
    return <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${styles[role] || styles.user}`}>{role}</span>;
  };

  return (
    <AutoTranslate>
      <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-serif text-dark mb-1">{pageTitle}</h1>
          <p className="text-gray-400 text-sm">{pageDesc}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#8A9A5B] bg-white w-56"
            />
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 bg-[#2C2C2C] text-white px-5 py-2.5 rounded-lg text-sm hover:bg-black transition-colors whitespace-nowrap"
          >
            <Plus size={16} /> Add {filter === 'employee' ? 'Employee' : filter === 'user' ? 'Customer' : 'User'}
          </button>
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
                <th className="text-left p-4 font-medium">User Details</th>
                <th className="text-left p-4 font-medium">Role</th>
                <th className="text-left p-4 font-medium">Contact</th>
                <th className="text-left p-4 font-medium">Joined</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {u.profile_picture ? (
                        <img src={u.profile_picture} alt={u.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#E8DCC4] flex items-center justify-center text-[#2C2C2C] font-serif uppercase">
                          {u.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-dark">{u.name}</p>
                        <p className="text-xs text-gray-400 font-mono tracking-widest">{formatId(getUserPrefix(u.role), u.id)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">{roleBadge(u.role)}</td>
                  <td className="p-4">
                    <p className="text-gray-500">{u.email}</p>
                    <p className="text-gray-400 text-xs">{u.phone || 'No phone'}</p>
                  </td>
                  <td className="p-4 text-gray-400 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleView(u)} className="p-2 text-gray-400 hover:text-blue-500 transition rounded-lg hover:bg-blue-50" title="View Details">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => handleEdit(u)} className="p-2 text-gray-400 hover:text-[#8A9A5B] transition rounded-lg hover:bg-gray-50" title="Edit User">
                        <Pencil size={14} />
                      </button>
                      {u.role !== 'owner' && (
                        <button onClick={() => handleDelete(u.id)} className="p-2 text-gray-400 hover:text-red-500 transition rounded-lg hover:bg-red-50" title="Delete User">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="p-12 text-center text-gray-400">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-serif text-dark">{editingUser ? 'Edit User' : 'Add New User'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-dark transition"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="flex items-center gap-4 mb-4">
                {formData.profile_picture ? (
                  <img src={formData.profile_picture} alt="Preview" className="w-16 h-16 rounded-full object-cover border border-gray-200" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                    <ImageIcon className="text-gray-400" size={24} />
                  </div>
                )}
                <div className="flex-1">
                  <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5">Profile Picture (Optional)</label>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#E8DCC4] file:text-dark hover:file:bg-[#d6c7ab]" disabled={uploadingAvatar} />
                  {uploadingAvatar && <p className="text-xs text-gray-400 mt-1">Uploading...</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5">Full Name *</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#8A9A5B]" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5">Email *</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#8A9A5B]" />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5">
                  Password {editingUser ? '(leave blank to keep)' : '*'}
                </label>
                <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                  required={!editingUser}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#8A9A5B]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5">Role</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    disabled={editingUser?.role === 'owner'}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#8A9A5B] bg-white disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    <option value="owner">Owner</option>
                    <option value="employee">Employee</option>
                    <option value="user">Customer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5">Phone</label>
                  <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#8A9A5B]" />
                </div>
              </div>
              {formData.role !== 'user' && (
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5">Address</label>
                  <textarea rows={2} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#8A9A5B] resize-none" />
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-sm text-gray-500 hover:text-dark transition">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2.5 bg-[#2C2C2C] text-white rounded-lg text-sm hover:bg-black transition disabled:opacity-50">
                  {saving ? 'Saving...' : (editingUser ? 'Save Changes' : 'Create User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowViewModal(false)}>
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-[#F8F6F1]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-[#8A9A5B]">
                  <UserIcon size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-serif text-dark">User Profile</h2>
                  <p className="text-xs text-gray-400 uppercase tracking-[0.2em] font-medium">{formatId(getUserPrefix(selectedUser.role), selectedUser.id)}</p>
                </div>
              </div>
              <button onClick={() => setShowViewModal(false)} className="p-2 bg-white text-gray-400 hover:text-dark rounded-full shadow-sm transition-all hover:rotate-90">
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              <div className="flex flex-col items-center mb-8">
                {selectedUser.profile_picture ? (
                  <img src={selectedUser.profile_picture} alt={selectedUser.name} className="w-32 h-32 rounded-3xl object-cover border-4 border-white shadow-xl mb-4" />
                ) : (
                  <div className="w-32 h-32 rounded-3xl bg-[#E8DCC4] flex items-center justify-center text-[#2C2C2C] text-4xl font-serif uppercase shadow-xl mb-4">
                    {selectedUser.name.charAt(0)}
                  </div>
                )}
                <h3 className="text-xl font-serif text-dark mb-1">{selectedUser.name}</h3>
                <div className="flex items-center gap-2">
                  {roleBadge(selectedUser.role)}
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <Mail className="text-[#8A9A5B] shrink-0" size={18} />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">Email Address</p>
                    <p className="text-sm font-medium text-dark">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <Phone className="text-[#8A9A5B] shrink-0" size={18} />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">Contact Number</p>
                    <p className="text-sm font-medium text-dark">{selectedUser.phone || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <MapPin className="text-[#8A9A5B] shrink-0" size={18} />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">Physical Address</p>
                    <p className="text-sm font-medium text-dark leading-relaxed">{selectedUser.address || 'No address registered'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <Calendar className="text-[#8A9A5B] shrink-0" size={16} />
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">Joined</p>
                      <p className="text-xs font-medium text-dark">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <Briefcase className="text-[#8A9A5B] shrink-0" size={16} />
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">Express</p>
                      <p className="text-xs font-medium text-dark">{selectedUser.express_company || 'Standard'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button onClick={() => setShowViewModal(false)} className="px-8 py-3 bg-dark text-white rounded-2xl text-sm font-semibold hover:bg-black transition-all">
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AutoTranslate>
  );
}

export default UserManagement;
