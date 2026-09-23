import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { Trash2, Image as ImageIcon, Upload, Loader2 } from 'lucide-react';
import AutoTranslate from '../../components/AutoTranslate';

function EmployeeBanners() {
  const [activeTab, setActiveTab] = useState('hero'); // 'hero' or 'client'
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [sliderInterval, setSliderInterval] = useState("2");
  const [savingSettings, setSavingSettings] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchBanners();
  }, [activeTab]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/banners/read.php?type=${activeTab}`);
      if (res.data?.data) {
        setBanners(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load banners", err);
      setError("Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = () => {
    const savedInterval = localStorage.getItem('slider_interval');
    if (savedInterval) {
      const seconds = Math.round(parseInt(savedInterval, 10) / 1000);
      setSliderInterval(String(seconds || 2));
    }
  };

  const handleIntervalChange = (e) => {
    const val = e.target.value;
    setSliderInterval(val);
    const ms = String(parseInt(val, 10) * 1000);
    localStorage.setItem('slider_interval', ms);
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError('');
    
    try {
      const uploadForm = new FormData();
      uploadForm.append('image', file);
      uploadForm.append('type', activeTab);

      const res = await api.post('/banners/upload.php', uploadForm, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data && res.data.image_url) {
        await fetchBanners(); // Reload
      } else {
        setError(res.data?.message || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
      // Reset file input value so same file can be uploaded again
      e.target.value = '';
    }
  };

  const handleDeleteBanner = async (id) => {
    const confirmMessage = activeTab === 'hero' 
      ? "Are you sure you want to delete this hero banner?" 
      : "Are you sure you want to delete this client logo?";
    if (!window.confirm(confirmMessage)) return;

    try {
      await api.post('/banners/delete.php', { id });
      await fetchBanners();
    } catch (err) {
      alert("Failed to delete banner: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <AutoTranslate>
    <div className="p-8 max-w-6xl">
      {/* Title section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-serif text-dark mb-1">Banner & Client Manager</h1>
          <p className="text-gray-400 text-sm">Upload and manage active homepage slider banners and client logos.</p>
        </div>
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
          <button 
            onClick={handleUploadClick}
            disabled={uploading}
            className="bg-[#1a3a2a] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-[#2c533e] transition text-sm font-medium disabled:opacity-50"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploading ? 'Uploading...' : activeTab === 'hero' ? 'Upload New Banner' : 'Upload Client Logo'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-8">
        <button
          onClick={() => setActiveTab('hero')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'hero' 
              ? 'border-[#1a3a2a] text-[#1a3a2a]' 
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Hero Banners
        </button>
        <button
          onClick={() => setActiveTab('client')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'client' 
              ? 'border-[#1a3a2a] text-[#1a3a2a]' 
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Client Logos
        </button>
      </div>

      {/* Slideshow transition interval config card (Hero banners only) */}
      {activeTab === 'hero' && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#fdfbf7]/50">
          <div>
            <h3 className="font-serif text-lg text-[#1a3a2a] mb-1">Slideshow Settings</h3>
            <p className="text-gray-400 text-xs">Set the transition speed of the background image carousel in seconds.</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700 shrink-0">Slide Interval:</label>
            <select 
              value={sliderInterval} 
              onChange={handleIntervalChange}
              disabled={savingSettings}
              className="border border-gray-200 rounded-lg p-2 text-sm bg-white min-w-[120px]"
            >
              <option value="1">1 Second</option>
              <option value="2">2 Seconds</option>
              <option value="3">3 Seconds</option>
              <option value="4">4 Seconds</option>
              <option value="5">5 Seconds</option>
              <option value="6">6 Seconds</option>
              <option value="8">8 Seconds</option>
              <option value="10">10 Seconds</option>
            </select>
            {savingSettings && <Loader2 size={16} className="animate-spin text-emerald-500" />}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-[#8A9A5B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center shadow-sm">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-serif text-lg text-dark mb-1">
            {activeTab === 'hero' ? 'No Custom Banners' : 'No Client Logos'}
          </h3>
          <p className="text-gray-400 text-sm max-w-sm mx-auto mb-6">
            {activeTab === 'hero' 
              ? 'Create a beautiful homepage! Upload custom high-resolution banner photos to display in the main slideshow rotation.'
              : 'Showcase your partnerships! Upload client logos to display in the scrolling gallery on the homepage.'
            }
          </p>
          <button 
            onClick={handleUploadClick} 
            className="text-sm font-semibold text-[#8A9A5B] hover:text-dark uppercase tracking-widest border-b border-[#8A9A5B]"
          >
            {activeTab === 'hero' ? 'Upload First Banner' : 'Upload First Client Logo'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {banners.map((banner, index) => (
            <div key={banner.id} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden group flex flex-col h-full bg-[#fdfbf7]/50">
              <div className={`bg-gray-50 relative overflow-hidden flex items-center justify-center p-4 border-b border-gray-50 shrink-0 ${
                activeTab === 'hero' ? 'aspect-[16/9]' : 'aspect-square'
              }`}>
                <img 
                  src={banner.image_url} 
                  alt={activeTab === 'hero' ? `Banner ${index + 1}` : `Client Logo ${index + 1}`} 
                  className="max-h-full max-w-full object-contain group-hover:scale-102 transition-transform duration-300"
                />
                {activeTab === 'hero' && (
                  <span className="absolute top-2 left-2 bg-[#8A9A5B] text-white text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded">
                    Slide {banners.length - index}
                  </span>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div className="mb-4">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-mono">ID: {banner.id}</p>
                  <p className="text-xs text-gray-500 font-light mt-1">Added: {new Date(banner.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex justify-end pt-3 border-t border-gray-50">
                  <button 
                    onClick={() => handleDeleteBanner(banner.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 text-xs font-semibold uppercase tracking-wider transition"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </AutoTranslate>
  );
}

export default EmployeeBanners;
