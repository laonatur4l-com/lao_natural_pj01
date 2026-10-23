import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Menu, Shield, Briefcase, Globe, X, ChevronDown, LogOut } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const { count } = useCart();
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
    navigate('/login');
  };

  const handleHomeClick = (e) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
    if (window.location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    }
  };

  const handleShopClick = (e) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
    if (window.location.pathname === '/products') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/products');
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    }
  };

  const handleOurStoryClick = (e) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
    if (window.location.pathname === '/') {
      const el = document.getElementById('story');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/#story');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full font-manrope bg-gradient-to-b from-[#EEF4E1] to-[#F7F9F0] px-3 sm:px-5 md:px-8 py-3 md:py-5 transition-all duration-300">
      {/* Floating Pill Nav Bar */}
      <div className="max-w-[1376px] mx-auto w-full h-[76px] sm:h-[88px] min-[1100px]:h-[104px] bg-white rounded-full shadow-[0_8px_28px_rgba(60,90,20,0.14)] flex items-center justify-between px-3 sm:px-6 min-[1100px]:pl-8 min-[1100px]:pr-7 transition-all duration-300 relative">
        
        {/* LEFT: BRAND LOCKUP (Image 72px tall + 18px gap + 2-line text) */}
        <a 
          href="/" 
          onClick={handleHomeClick} 
          className="flex items-center gap-2.5 sm:gap-3 md:gap-[18px] text-decoration-none group shrink-0 select-none min-h-[44px]"
          aria-label="Lao Natural Home"
        >
          <img 
            src="/lao_logo_transparent.png" 
            alt="Lao Natural logo" 
            className="h-[48px] sm:h-[60px] md:h-[72px] w-auto block object-contain transition-transform duration-150 group-hover:scale-105" 
          />
          <span className="flex flex-col leading-[1.15] justify-center">
            <span className="font-extrabold text-[15px] sm:text-[18px] md:text-[22px] tracking-[0.04em] text-[#4F7F12] whitespace-nowrap">
              LAO NATURAL
            </span>
            <span className="hidden sm:block font-medium text-[11px] md:text-[13px] text-[#6A6A60] mt-[3px] whitespace-nowrap">
              and Organic Co., Ltd
            </span>
          </span>
        </a>

        {/* CENTER: DESKTOP NAV LINKS (Manrope Bold 13px, uppercase, 0.14em tracking, 30px gap) */}
        <nav 
          className="hidden min-[1100px]:flex items-center gap-[30px]" 
          aria-label="Main Navigation"
        >
          <a 
            href="/" 
            onClick={handleHomeClick} 
            className="text-[#2B2B26] hover:text-[#4F7F12] font-bold text-[13px] tracking-[0.14em] uppercase transition-colors duration-150 min-h-[44px] flex items-center"
          >
            {t('home')}
          </a>
          <a 
            href="/products" 
            onClick={handleShopClick} 
            className="text-[#2B2B26] hover:text-[#4F7F12] font-bold text-[13px] tracking-[0.14em] uppercase transition-colors duration-150 min-h-[44px] flex items-center"
          >
            {t('shop')}
          </a>
          <a 
            href="/#story" 
            onClick={handleOurStoryClick} 
            className="text-[#2B2B26] hover:text-[#4F7F12] font-bold text-[13px] tracking-[0.14em] uppercase transition-colors duration-150 min-h-[44px] flex items-center whitespace-nowrap"
          >
            {t('our_story')}
          </a>
        </nav>

        {/* RIGHT: ACTIONS (Language Switcher, Admin, My Account, Logout, Cart, Mobile Menu) */}
        <div className="flex items-center gap-2 sm:gap-3 min-[1100px]:gap-4 shrink-0">
          
          {/* 1. Language Switcher Pill */}
          <div className="relative flex items-center gap-1.5 sm:gap-2 h-[40px] sm:h-[44px] px-2.5 sm:px-4 rounded-full bg-[#F4F7EC] border border-[#E3EAD0] text-[#2B2B26] font-bold text-[12px] sm:text-[13px] tracking-[0.08em] cursor-pointer hover:border-[#8A9A5B] transition-colors duration-150">
            <Globe size={18} className="text-[#2B2B26] stroke-[1.6]" aria-hidden="true" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent font-bold text-[12px] sm:text-[13px] tracking-[0.08em] text-[#2B2B26] border-none cursor-pointer focus:outline-none appearance-none pr-3 sm:pr-4 uppercase"
              aria-label="Select Language"
            >
              <option value="en">EN</option>
              <option value="la">LA</option>
              <option value="th">TH</option>
            </select>
            <ChevronDown size={13} className="text-[#2B2B26] stroke-[2.5] absolute right-2.5 sm:right-3 pointer-events-none" aria-hidden="true" />
          </div>

          {/* 2, 3, 4. Desktop Account Group (Below 900px collapses into account menu) */}
          <div className="hidden min-[900px]:flex items-center gap-[18px]">
            {user ? (
              <>
                {/* ADMIN Link (Only show to admin / owner) */}
                {user.role === 'owner' && (
                  <Link 
                    to="/admin" 
                    className="flex items-center gap-1.5 text-[#4F7F12] hover:text-[#3e640e] font-bold text-[13px] tracking-[0.1em] uppercase min-h-[44px] transition-colors duration-150 whitespace-nowrap"
                  >
                    <Shield size={16} strokeWidth={1.7} aria-hidden="true" />
                    <span>{t('admin')}</span>
                  </Link>
                )}

                {/* EMPLOYEE PORTAL Link */}
                {user.role === 'employee' && (
                  <Link 
                    to="/employee" 
                    className="flex items-center gap-1.5 text-[#4F7F12] hover:text-[#3e640e] font-bold text-[13px] tracking-[0.1em] uppercase min-h-[44px] transition-colors duration-150 whitespace-nowrap"
                  >
                    <Briefcase size={16} strokeWidth={1.7} aria-hidden="true" />
                    <span>{t('portal')}</span>
                  </Link>
                )}

                {/* MY ACCOUNT */}
                <Link 
                  to="/dashboard" 
                  className="flex items-center text-[#2B2B26] hover:text-[#4F7F12] font-bold text-[13px] tracking-[0.1em] uppercase min-h-[44px] transition-colors duration-150 whitespace-nowrap"
                >
                  {t('my_account')}
                </Link>

                {/* LOGOUT */}
                <button 
                  onClick={handleLogout} 
                  className="flex items-center text-[#2B2B26] hover:text-[#4F7F12] font-bold text-[13px] tracking-[0.1em] uppercase min-h-[44px] cursor-pointer transition-colors duration-150 whitespace-nowrap"
                >
                  {t('logout')}
                </button>
              </>
            ) : (
              /* SIGN IN */
              <Link 
                to="/login" 
                className="flex items-center text-[#2B2B26] hover:text-[#4F7F12] font-bold text-[13px] tracking-[0.1em] uppercase min-h-[44px] transition-colors duration-150 whitespace-nowrap"
              >
                {t('sign_in')}
              </Link>
            )}
          </div>

          {/* Collapsed Account Menu Button (Below 900px) */}
          <div className="min-[900px]:hidden relative">
            <button 
              onClick={() => { setAccountMenuOpen(!accountMenuOpen); setMobileMenuOpen(false); }}
              className="flex items-center justify-center h-[40px] w-[40px] sm:h-[44px] sm:w-[44px] rounded-full bg-[#F4F7EC] border border-[#E3EAD0] text-[#2B2B26] hover:border-[#8A9A5B] transition-colors duration-150 cursor-pointer"
              aria-label="Account Menu"
              aria-expanded={accountMenuOpen}
            >
              <User size={18} strokeWidth={1.8} />
            </button>

            {/* Account Popover Menu for < 900px */}
            {accountMenuOpen && (
              <div className="absolute right-0 top-[52px] w-52 bg-white rounded-2xl shadow-[0_12px_28px_rgba(60,90,20,0.18)] border border-[#E3EAD0] py-2 z-50 animate-fadeIn">
                {user ? (
                  <>
                    <div className="px-4 py-2 border-b border-[#E3EAD0]/50 text-xs font-semibold text-gray-500 truncate">
                      {user.email || user.name || 'User'}
                    </div>
                    {user.role === 'owner' && (
                      <Link 
                        to="/admin" 
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#4F7F12] hover:bg-[#F4F7EC] transition-colors"
                      >
                        <Shield size={16} />
                        <span>{t('admin')}</span>
                      </Link>
                    )}
                    {(user.role === 'employee' || user.role === 'owner') && (
                      <Link 
                        to="/employee" 
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#4F7F12] hover:bg-[#F4F7EC] transition-colors"
                      >
                        <Briefcase size={16} />
                        <span>{t('portal')}</span>
                      </Link>
                    )}
                    <Link 
                      to="/dashboard" 
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#2B2B26] hover:bg-[#F4F7EC] transition-colors"
                    >
                      <User size={16} />
                      <span>{t('my_account')}</span>
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-50 transition-colors text-left"
                    >
                      <LogOut size={16} />
                      <span>{t('logout')}</span>
                    </button>
                  </>
                ) : (
                  <Link 
                    to="/login" 
                    onClick={() => setAccountMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#2B2B26] hover:bg-[#F4F7EC] transition-colors"
                  >
                    <User size={16} />
                    <span>{t('sign_in')}</span>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* 5. CART Filled Pill Button */}
          <Link 
            to="/cart" 
            className="flex items-center gap-2 text-white bg-[#5E9618] hover:bg-[#4E7D14] rounded-full px-3.5 sm:px-[22px] h-[40px] sm:h-[48px] font-bold text-[12px] sm:text-[13px] tracking-[0.12em] transition-all duration-150 relative shrink-0 shadow-sm"
            aria-label={`Cart with ${count} items`}
          >
            <ShoppingBag size={18} sm:size={20} strokeWidth={1.7} aria-hidden="true" />
            <span className="hidden min-[400px]:inline-block uppercase">{t('cart')}</span>
            {count > 0 && (
              <span className="bg-white text-[#5E9618] text-[10px] sm:text-[11px] font-extrabold rounded-full px-1.5 h-4 sm:h-5 min-w-4 sm:min-w-5 flex items-center justify-center shadow-xs">
                {count}
              </span>
            )}
          </Link>

          {/* Hamburger Menu Toggle (Below 1100px) */}
          <button 
            onClick={() => { setMobileMenuOpen(!mobileMenuOpen); setAccountMenuOpen(false); }}
            className="min-[1100px]:hidden flex items-center justify-center h-[40px] w-[40px] sm:h-[44px] sm:w-[44px] rounded-full bg-[#F4F7EC] border border-[#E3EAD0] text-[#2B2B26] hover:border-[#8A9A5B] transition-colors duration-150 cursor-pointer"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Responsive Dropdown Panel for < 1100px */}
      {mobileMenuOpen && (
        <div className="min-[1100px]:hidden max-w-[1376px] mx-auto mt-3 bg-white rounded-3xl p-6 shadow-[0_12px_32px_rgba(60,90,20,0.18)] border border-[#E3EAD0] animate-fadeIn z-50">
          <nav className="flex flex-col space-y-1">
            <a 
              href="/" 
              onClick={handleHomeClick} 
              className="flex items-center text-[#2B2B26] hover:text-[#4F7F12] font-bold text-sm uppercase tracking-[0.14em] min-h-[44px] border-b border-gray-100 px-2"
            >
              {t('home')}
            </a>
            <a 
              href="/products" 
              onClick={handleShopClick} 
              className="flex items-center text-[#2B2B26] hover:text-[#4F7F12] font-bold text-sm uppercase tracking-[0.14em] min-h-[44px] border-b border-gray-100 px-2"
            >
              {t('shop')}
            </a>
            <a 
              href="/#story" 
              onClick={handleOurStoryClick} 
              className="flex items-center text-[#2B2B26] hover:text-[#4F7F12] font-bold text-sm uppercase tracking-[0.14em] min-h-[44px] border-b border-gray-100 px-2"
            >
              {t('our_story')}
            </a>

            {/* Account options in mobile dropdown */}
            {user ? (
              <>
                <Link 
                  to="/dashboard" 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="flex items-center text-[#2B2B26] hover:text-[#4F7F12] font-bold text-sm uppercase tracking-[0.1em] min-h-[44px] border-b border-gray-100 px-2"
                >
                  {t('my_account')}
                </Link>

                {user.role === 'owner' && (
                  <Link 
                    to="/admin" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="flex items-center gap-2 text-[#4F7F12] hover:text-[#3e640e] font-bold text-sm uppercase tracking-[0.1em] min-h-[44px] border-b border-gray-100 px-2"
                  >
                    <Shield size={16} strokeWidth={1.7} />
                    <span>{t('admin')} Dashboard</span>
                  </Link>
                )}

                {(user.role === 'employee' || user.role === 'owner') && (
                  <Link 
                    to="/employee" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="flex items-center gap-2 text-[#4F7F12] hover:text-[#3e640e] font-bold text-sm uppercase tracking-[0.1em] min-h-[44px] border-b border-gray-100 px-2"
                  >
                    <Briefcase size={16} strokeWidth={1.7} />
                    <span>{t('portal')}</span>
                  </Link>
                )}

                <button 
                  onClick={handleLogout} 
                  className="flex items-center gap-2 text-rose-600 hover:text-rose-700 font-bold text-sm uppercase tracking-[0.1em] min-h-[44px] text-left px-2 pt-2 cursor-pointer"
                >
                  <LogOut size={16} />
                  <span>{t('logout')}</span>
                </button>
              </>
            ) : (
              <Link 
                to="/login" 
                onClick={() => setMobileMenuOpen(false)} 
                className="flex items-center text-[#2B2B26] hover:text-[#4F7F12] font-bold text-sm uppercase tracking-[0.1em] min-h-[44px] px-2 pt-2"
              >
                {t('sign_in')}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navbar;
