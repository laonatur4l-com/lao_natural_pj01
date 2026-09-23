import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Package, Truck, LogOut, Store, Tag, FileText, History, Image, Globe, PackagePlus, MapPin } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

function EmployeeLayout() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/employee', icon: LayoutDashboard, label: language === 'la' ? 'ກະດານຄວບຄຸມ' : language === 'th' ? 'แดชบอร์ด' : 'Dashboard', end: true },
    { to: '/employee/categories', icon: Tag, label: language === 'la' ? 'ໝວດໝູ່' : language === 'th' ? 'หมวดหมู่' : 'Categories' },
    { to: '/employee/import-products', icon: PackagePlus, label: language === 'la' ? 'ນຳເຂົ້າສິນຄ້າ' : language === 'th' ? 'นำเข้าสินค้า' : 'Import Products' },
    { to: '/employee/orders', icon: Truck, label: language === 'la' ? 'ລາຍການສັ່ງຊື້' : language === 'th' ? 'รายการสั่งซื้อ' : 'Orders' },
    { to: '/employee/sell-history', icon: History, label: language === 'la' ? 'ປະຫວັດການຂາຍ' : language === 'th' ? 'ประวัติการขาย' : 'Sell History' },
    { to: '/employee/reports', icon: FileText, label: language === 'la' ? 'ລາຍງານ & ໃບບິນ' : language === 'th' ? 'รายงาน & ใบเสร็จ' : 'Reports & Invoices' },
    { to: '/employee/banners', icon: Image, label: language === 'la' ? 'ແບນເນີເວັບໄຊ' : language === 'th' ? 'แบนเนอร์เว็บไซต์' : 'Hero Banners' },
    { to: '/employee/promotions', icon: Tag, label: language === 'la' ? 'ໂປຣໂມຊັນ' : language === 'th' ? 'โปรโมชั่น' : 'Promotions' },
    { to: '/employee/distributors', icon: MapPin, label: language === 'la' ? 'ບ່ອນວາງຂາຍສິນຄ້າ' : language === 'th' ? 'สถานที่วางจำหน่าย' : 'Available At' },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1a3a2a] text-white flex flex-col shrink-0 print:hidden sticky top-0 h-screen">
        <div className="p-6 border-b border-white/10">
          <Link to="/" className="block mb-4">
            <img src="/lao_logo_transparent.png" alt="Lao Natural" className="h-12 w-auto object-contain drop-shadow-md" />
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-1">
                {language === 'la' ? 'ພອດທໍພະນັກງານ' : language === 'th' ? 'พอร์ทัลพนักงาน' : 'Employee Portal'}
              </p>
              <p className="font-serif text-sm">{user?.name}</p>
            </div>
            {/* Language Switcher */}
            <div className="flex items-center gap-1.5 border border-white/10 px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors">
              <Globe size={12} className="text-white/40" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent text-[10px] font-bold uppercase tracking-wider text-white border-none cursor-pointer focus:outline-none pr-1"
              >
                <option value="en" className="bg-[#1a3a2a] text-white">EN</option>
                <option value="la" className="bg-[#1a3a2a] text-white">LA</option>
                <option value="th" className="bg-[#1a3a2a] text-white">TH</option>
              </select>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 text-sm tracking-wide transition-all duration-200 ${
                  isActive
                    ? 'bg-white/10 text-white border-r-2 border-[#8A9A5B]'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 w-full px-2 py-2 text-sm text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            <Store size={18} />
            {language === 'la' ? 'ເບິ່ງໜ້າຮ້ານ' : language === 'th' ? 'ดูหน้าร้าน' : 'View Store'}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-2 py-2 text-sm text-white/50 hover:text-red-400 transition-colors cursor-pointer"
          >
            <LogOut size={18} />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-[#F8F6F1] overflow-y-auto print:bg-white print:p-0">
        <Outlet />
      </main>
    </div>
  );
}

export default EmployeeLayout;
