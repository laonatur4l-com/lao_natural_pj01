import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { useLanguage } from '../context/LanguageContext';

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in — based on role
  if (user) {
    if (user.role === 'owner') {
      navigate('/admin', { replace: true });
    } else if (user.role === 'employee') {
      navigate('/employee', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const res = await api.post('/auth/login.php', { email: formData.email, password: formData.password });
        if (res.data && res.data.jwt) {
          login(res.data.user, res.data.jwt);
          
          const role = res.data.user.role;
          const from = location.state?.from?.pathname;
          
          if (from) {
            navigate(from, { replace: true });
          } else if (role === 'owner') {
            navigate('/admin', { replace: true });
          } else if (role === 'employee') {
            navigate('/employee', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        }
      } else {
        const regRes = await api.post('/auth/register.php', formData);
        if (regRes.data?.jwt && regRes.data?.user) {
          login(regRes.data.user, regRes.data.jwt);
          navigate('/dashboard', { replace: true });
        } else {
          setIsLogin(true);
          setError('Registration successful. Please log in.');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      const serverMsg = err.response?.data?.details?.[0]?.message 
                     || err.response?.data?.error 
                     || err.response?.data?.message;
      setError(serverMsg || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-24 min-h-[70vh] flex items-center justify-center">
      <div className="max-w-md w-full border border-[#E8DCC4] p-8 text-center bg-[#FDFBF7] shadow-sm">
        <Link to="/" className="inline-block mb-8">
          <img src="/lao_logo_transparent.png" alt="Lao Natural" className="h-16 w-auto object-contain mx-auto" />
        </Link>
        <h1 className="text-3xl font-serif mb-2 text-dark">{isLogin ? t('sign_in') : (language === 'la' ? 'ສ້າງບັນຊີ' : language === 'th' ? 'สร้างบัญชี' : 'Create Account')}</h1>
        <p className="text-sm text-gray-500 mb-8 font-light">
          {isLogin 
            ? (language === 'la' ? 'ເຂົ້າເຖິງລາຍການສັ່ງຊື້ ແລະ ຂໍ້ມູນບັນຊີຂອງທ່ານ.' : language === 'th' ? 'เข้าถึงรายการสั่งซื้อและบัญชีของคุณ' : 'Access your orders and preferences.')
            : (language === 'la' ? 'ຮ່ວມເດີນທາງໄປກັບພວກເຮົາ ເພື່ອສຸຂະພາບທີ່ດີຈາກທຳມະຊາດ.' : language === 'th' ? 'ร่วมเดินทางไปกับเราเพื่อสุขภาพที่ดีจากธรรมชาติ' : 'Join us for a natural wellness journey.')
          }
        </p>

        {error && (
          <div className={`p-4 mb-6 text-sm ${error.includes('successful') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <input 
                type="text" 
                placeholder={t('full_name')} 
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 focus:border-primary focus:outline-none transition-colors" 
              />
              <input 
                type="tel" 
                placeholder={t('phone_number')} 
                required
                value={formData.phone || ''}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 focus:border-primary focus:outline-none transition-colors" 
              />
            </>
          )}
          <input 
            type="text" 
            placeholder={t('email_address') || "Email or Username"} 
            required
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full px-4 py-3 border border-gray-200 focus:border-primary focus:outline-none transition-colors" 
          />
          <input 
            type="password" 
            placeholder={language === 'la' ? 'ລະຫັດຜ່ານ' : language === 'th' ? 'รหัสผ่าน' : 'Password'} 
            required
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="w-full px-4 py-3 border border-gray-200 focus:border-primary focus:outline-none transition-colors" 
          />
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-dark text-white py-3 uppercase tracking-widest text-sm hover:bg-black transition-colors disabled:opacity-50 mt-4 cursor-pointer"
          >
            {loading ? (language === 'la' ? 'ກຳລັງກວດສອບ...' : language === 'th' ? 'กำลังตรวจสอบ...' : 'Validating...') : (isLogin ? t('sign_in') : (language === 'la' ? 'ລົງທະບຽນ' : language === 'th' ? 'ลงทะเบียน' : 'Register'))}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#E8DCC4]">
          <p className="text-sm text-gray-500">
            {isLogin 
              ? (language === 'la' ? 'ຍັງບໍ່ທັນມີບັນຊີບໍ? ' : language === 'th' ? 'ยังไม่มีบัญชีใช่หรือไม่? ' : "Don't have an account? ")
              : (language === 'la' ? 'ມີບັນຊີຢູ່ແລ້ວບໍ? ' : language === 'th' ? 'มีบัญชีอยู่แล้วใช่หรือไม่? ' : "Already have an account? ")
            }
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); setFormData({name: '', email: '', password: ''})}} 
              className="text-primary hover:text-dark uppercase tracking-widest text-xs transition-colors cursor-pointer"
            >
              {isLogin ? (language === 'la' ? 'ລົງທະບຽນ' : language === 'th' ? 'ลงทะเบียน' : 'Register') : t('sign_in')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
