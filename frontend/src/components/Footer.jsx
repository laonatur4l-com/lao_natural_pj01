import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { MapPin, Mail, Phone, Facebook } from 'lucide-react';

function Footer() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleHomeClick = (e) => {
    e.preventDefault();
    if (window.location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    }
  };

  const handleShopClick = (e) => {
    e.preventDefault();
    if (window.location.pathname === '/products') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/products');
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    }
  };

  const handleOurStoryClick = (e) => {
    e.preventDefault();
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
    <footer className="bg-dark text-secondary py-12 mt-12">
      <div className="container mx-auto px-4 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <img src="/lao_logo_transparent.png" alt="Lao Natural" className="h-10 w-auto object-contain drop-shadow-sm" />
            <h3 className="font-serif text-2xl text-[#E8DCC4]">Lao Natural</h3>
          </div>
          <p className="text-sm opacity-80 max-w-xs leading-relaxed font-light">
            {t('footer_desc')}
          </p>
        </div>
        <div>
          <h4 className="font-serif text-lg mb-4 uppercase tracking-widest text-primary">{t('quick_links')}</h4>
          <ul className="space-y-2.5 opacity-80 text-sm font-light">
            <li><a href="/" onClick={handleHomeClick} className="hover:text-primary transition-colors cursor-pointer block">{t('home')}</a></li>
            <li><a href="/products" onClick={handleShopClick} className="hover:text-primary transition-colors cursor-pointer block">{t('shop')}</a></li>
            <li><a href="/#story" onClick={handleOurStoryClick} className="hover:text-primary transition-colors cursor-pointer block">{t('our_story')}</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-serif text-lg mb-4 uppercase tracking-widest text-primary">{t('contact')}</h4>
          <ul className="space-y-3 opacity-80 text-sm font-light leading-relaxed">
            <li>
              <a href="https://maps.app.goo.gl/Hxi1vtuxssd2XYzm8?g_st=ic" target="_blank" rel="noopener noreferrer" className="flex items-start gap-2.5 hover:text-primary transition-colors group">
                <MapPin size={16} className="shrink-0 mt-0.5 text-primary/70 group-hover:text-primary transition-colors" />
                <span>Ban Phasouk,<br />Luang Prabang, Laos</span>
              </a>
            </li>
            <li>
              <a href="mailto:sales.laonatural@gmail.com" className="flex items-center gap-2.5 hover:text-primary transition-colors group">
                <Mail size={16} className="shrink-0 text-primary/70 group-hover:text-primary transition-colors" />
                <span>sales.laonatural@gmail.com</span>
              </a>
            </li>
            <li>
              <a href="tel:+85630990478O" className="flex items-center gap-2.5 hover:text-primary transition-colors group">
                <Phone size={16} className="shrink-0 text-primary/70 group-hover:text-primary transition-colors" />
                <span>+856 30 990 4780</span>
              </a>
            </li>
            <li>
              <a href="https://www.facebook.com/share/1EZ3EiPtsY/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 hover:text-primary transition-colors group">
                <Facebook size={16} className="shrink-0 text-primary/70 group-hover:text-primary transition-colors" />
                <span>Lao Natural</span>
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-serif text-lg mb-4 uppercase tracking-widest text-primary">{t('scan_qr')}</h4>
          <div className="bg-white p-2 w-32 h-32 rounded-xl flex items-center justify-center shadow-md">
            <img
              src="/lao_qr.png"
              alt="Lao Natural QR"
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-[11px] opacity-75 mt-3 max-w-[160px] leading-relaxed font-light">
            {t('scan_desc')}
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
