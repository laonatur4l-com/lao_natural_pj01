import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Menu, Shield, Briefcase, Globe, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { count } = useCart();
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const handleHomeClick = (e) => {
    e.preventDefault();
    setMobileMenuOpen(false);
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
    <header className="sticky top-0 z-50 bg-[#FDFBF7] border-b border-[#E8DCC4] py-4">
      <div className="container mx-auto px-4 lg:px-8 flex items-center justify-between">
        
        {/* Mobile menu button */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-dark hover:text-primary transition-colors cursor-pointer"
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Logo */}
        <a href="/" onClick={handleHomeClick} className="flex-grow md:flex-grow-0 flex justify-center md:justify-start">
          <img src="/lao_logo_transparent.png" alt="Lao Natural" className="h-10 w-auto object-contain" />
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <a href="/" onClick={handleHomeClick} className="text-dark hover:text-primary transition-colors uppercase tracking-widest text-sm cursor-pointer">{t('home')}</a>
          <a href="/products" onClick={handleShopClick} className="text-dark hover:text-primary transition-colors uppercase tracking-widest text-sm cursor-pointer">{t('shop')}</a>
          <a href="/#story" onClick={handleOurStoryClick} className="text-dark hover:text-primary transition-colors uppercase tracking-widest text-sm cursor-pointer">{t('our_story')}</a>
        </nav>

        {/* Icons & Language Switcher */}
        <div className="flex items-center space-x-4">
          {/* Language Switcher */}
          <div className="flex items-center gap-1.5 border border-[#E8DCC4] px-2.5 py-1.5 rounded-full bg-white shadow-sm hover:border-[#8A9A5B] transition-colors">
            <Globe size={14} className="text-gray-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-[10px] font-bold uppercase tracking-wider text-dark border-none cursor-pointer focus:outline-none hover:text-[#8A9A5B] transition-colors pr-1"
            >
              <option value="en" className="bg-[#FDFBF7] text-dark">EN</option>
              <option value="la" className="bg-[#FDFBF7] text-dark">LA</option>
              <option value="th" className="bg-[#FDFBF7] text-dark">TH</option>
            </select>
          </div>

          {user && (
            <>
              {/* Role-based portal links */}
              {user.role === 'owner' && (
                <Link to="/admin" className="hidden md:flex items-center gap-1.5 text-sm text-[#8A9A5B] hover:text-dark transition-colors">
                  <Shield size={16} />
                  <span className="text-xs uppercase tracking-widest">{t('admin')}</span>
                </Link>
              )}
              {(user.role === 'employee') && (
                <Link to="/employee" className="hidden md:flex items-center gap-1.5 text-sm text-[#8A9A5B] hover:text-dark transition-colors">
                  <Briefcase size={16} />
                  <span className="text-xs uppercase tracking-widest">{t('portal')}</span>
                </Link>
              )}
            </>
          )}

          {user ? (
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-dark hover:text-primary transition-colors hidden md:block text-xs uppercase tracking-widest">{t('my_account')}</Link>
              <button onClick={handleLogout} className="text-dark hover:text-primary transition-colors hidden md:block text-xs uppercase tracking-widest">{t('logout')}</button>
              <Link to="/dashboard" className="text-dark hover:text-primary transition-colors md:hidden">
                <User size={20} />
              </Link>
            </div>
          ) : (
            <Link to="/login" className="flex items-center gap-1.5 text-dark hover:text-primary transition-colors">
              <User size={20} />
              <span className="hidden md:inline-block text-xs uppercase tracking-widest">{t('sign_in')}</span>
            </Link>
          )}
          
          <Link to="/cart" className="relative flex items-center gap-1.5 text-dark hover:text-primary transition-colors">
            <ShoppingBag size={20} />
            <span className="hidden md:inline-block text-xs uppercase tracking-widest">{t('cart')}</span>
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-secondary text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E8DCC4] bg-[#FDFBF7] mt-4 px-6 py-6 space-y-4 shadow-lg animate-fadeIn">
          <nav className="flex flex-col space-y-4">
            <a href="/" onClick={handleHomeClick} className="text-dark hover:text-primary transition-colors uppercase tracking-widest text-sm font-medium border-b border-[#E8DCC4]/50 pb-2">
              {t('home')}
            </a>
            <a href="/products" onClick={handleShopClick} className="text-dark hover:text-primary transition-colors uppercase tracking-widest text-sm font-medium border-b border-[#E8DCC4]/50 pb-2">
              {t('shop')}
            </a>
            <a href="/#story" onClick={handleOurStoryClick} className="text-dark hover:text-primary transition-colors uppercase tracking-widest text-sm font-medium border-b border-[#E8DCC4]/50 pb-2">
              {t('our_story')}
            </a>

            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-dark hover:text-primary transition-colors uppercase tracking-widest text-sm font-medium border-b border-[#E8DCC4]/50 pb-2">
                  {t('my_account')}
                </Link>

                {user.role === 'owner' && (
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="text-[#8A9A5B] hover:text-dark transition-colors uppercase tracking-widest text-sm font-semibold border-b border-[#E8DCC4]/50 pb-2 flex items-center gap-2">
                    <Shield size={16} />
                    <span>{t('admin')} Dashboard</span>
                  </Link>
                )}

                {(user.role === 'employee' || user.role === 'owner') && (
                  <Link to="/employee" onClick={() => setMobileMenuOpen(false)} className="text-[#8A9A5B] hover:text-dark transition-colors uppercase tracking-widest text-sm font-semibold border-b border-[#E8DCC4]/50 pb-2 flex items-center gap-2">
                    <Briefcase size={16} />
                    <span>{t('portal')}</span>
                  </Link>
                )}

                <button onClick={handleLogout} className="text-red-600 hover:text-red-800 transition-colors uppercase tracking-widest text-sm font-medium text-left pt-2">
                  {t('logout')}
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-dark hover:text-primary transition-colors uppercase tracking-widest text-sm font-medium border-b border-[#E8DCC4]/50 pb-2">
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
