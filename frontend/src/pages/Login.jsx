import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { supabase } from '../utils/supabase';
import { useLanguage } from '../context/LanguageContext';

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Listen for Supabase OAuth redirect back to /login only when hash contains OAuth tokens
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const hasAuthHash = window.location.hash.includes('access_token=') || window.location.hash.includes('error=');
      if (!hasAuthHash) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          setLoading(true);
          const res = await api.post('/auth/google-sync', { token: session.access_token }, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });

          if (res.data?.user && res.data?.jwt) {
            login(res.data.user, res.data.jwt);
            window.history.replaceState(null, '', window.location.pathname);
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
        }
      } catch (err) {
        console.error('Google OAuth callback error:', err);
        const serverMsg = err.response?.data?.error || 'Google authentication failed. Please try again.';
        setError(serverMsg);
      } finally {
        setLoading(false);
      }
    };

    handleOAuthCallback();
  }, [location, login, navigate]);

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

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to start Google sign-in.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const res = await api.post('/auth/login', { email: formData.email, password: formData.password });
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
        const regRes = await api.post('/auth/register', formData);
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

        {/* Google Sign-In Button */}
        <button 
          type="button" 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-[#E8DCC4] py-3 text-sm font-medium text-dark hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>
            {language === 'la' ? 'ສືບຕໍ່ດ້ວຍ Google' : language === 'th' ? 'ดำเนินการต่อด้วย Google' : 'Continue with Google'}
          </span>
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E8DCC4]"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wider">
            <span className="bg-[#FDFBF7] px-3 text-gray-500 font-medium">
              {language === 'la' ? 'ຫຼື ໃຊ້ອີເມວ' : language === 'th' ? 'หรือ ใช้อีเมล' : 'Or with email'}
            </span>
          </div>
        </div>

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
              onClick={() => { setIsLogin(!isLogin); setError(''); setFormData({name: '', email: '', password: '', phone: ''})}} 
              className="text-primary hover:text-dark uppercase tracking-widest text-xs transition-colors cursor-pointer ml-1"
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
