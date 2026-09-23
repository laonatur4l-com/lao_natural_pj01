import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, PackagePlus, ScrollText, LogOut, Store, ChevronDown, UserCog, ShoppingBag, BookOpen, Tag, TrendingUp, Wallet, Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

function AdminLayout() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-expand if we're on a /admin/users route
  const [usersOpen, setUsersOpen] = useState(location.pathname.startsWith('/admin/users'));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isUsersActive = location.pathname.startsWith('/admin/users');

  const linkClass = (isActive) =>
    `flex items-center gap-3 px-6 py-3 text-sm tracking-wide transition-all duration-200 ${
      isActive
        ? 'bg-white/10 text-white border-r-2 border-[#8A9A5B]'
        : 'text-white/50 hover:text-white hover:bg-white/5'
    }`;

  const subLinkClass = (isActive) =>
    `flex items-center gap-3 pl-12 pr-6 py-2.5 text-xs tracking-wide transition-all duration-200 ${
      isActive
        ? 'bg-white/10 text-white border-r-2 border-[#8A9A5B]'
        : 'text-white/40 hover:text-white hover:bg-white/5'
    }`;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-[#2C2C2C] text-white flex flex-col shrink-0 print:hidden sticky top-0 h-screen">
        <div className="p-6 border-b border-white/10">
          <Link to="/" className="block mb-4">
            <img src="/lao_logo_transparent.png" alt="Lao Natural" className="h-12 w-auto object-contain drop-shadow-md" />
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-1">
                {language === 'la' ? 'ພອດທໍຜູ້ດູແລ' : language === 'th' ? 'พอร์ทัลผู้ดูแล' : 'Owner Portal'}
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
                <option value="en" className="bg-[#2C2C2C] text-white">EN</option>
                <option value="la" className="bg-[#2C2C2C] text-white">LA</option>
                <option value="th" className="bg-[#2C2C2C] text-white">TH</option>
              </select>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {/* Dashboard */}
          <NavLink to="/admin" end className={({ isActive }) => linkClass(isActive)}>
            <LayoutDashboard size={18} /> {language === 'la' ? 'ກະດານຄວບຄຸມ' : language === 'th' ? 'แดชบอร์ด' : 'Dashboard'}
          </NavLink>

          {/* Total Revenue */}
          <NavLink to="/admin/total-revenue" className={({ isActive }) => linkClass(isActive)}>
            <TrendingUp size={18} /> {language === 'la' ? 'ລາຍຮັບທັງໝົດ' : language === 'th' ? 'รายได้ทั้งหมด' : 'Total Revenue'}
          </NavLink>

          {/* All Users — Expandable */}
          <button
            onClick={() => setUsersOpen(!usersOpen)}
            className={`flex items-center justify-between w-full px-6 py-3 text-sm tracking-wide transition-all duration-200 cursor-pointer ${
              isUsersActive ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="flex items-center gap-3">
              <Users size={18} /> 
              {language === 'la' ? 'ຜູ້ໃຊ້ທັງໝົດ' : language === 'th' ? 'ผู้ใช้งานทั้งหมด' : 'All Users'}
            </span>
            <ChevronDown size={14} className={`transition-transform duration-200 ${usersOpen ? 'rotate-180' : ''}`} />
          </button>
          {usersOpen && (
            <div className="bg-black/20">
              <NavLink to="/admin/users" end className={({ isActive }) => subLinkClass(isActive)}>
                <Users size={14} /> {language === 'la' ? 'ຜູ້ໃຊ້ທັງໝົດ' : language === 'th' ? 'ผู้ใช้งานทั้งหมด' : 'All Users'}
              </NavLink>
              <NavLink to="/admin/users/employees" className={({ isActive }) => subLinkClass(isActive)}>
                <UserCog size={14} /> {language === 'la' ? 'ພະນັກງານ' : language === 'th' ? 'พนักงาน' : 'Employees'}
              </NavLink>
              <NavLink to="/admin/users/customers" className={({ isActive }) => subLinkClass(isActive)}>
                <ShoppingBag size={14} /> {language === 'la' ? 'ລູກຄ້າ' : language === 'th' ? 'ลูกค้า' : 'Customers'}
              </NavLink>
            </div>
          )}

          {/* Employee Sales History */}
          <NavLink to="/admin/employee-sales" className={({ isActive }) => linkClass(isActive)}>
            <ScrollText size={18} /> {language === 'la' ? 'ປະວັດການຂາຍພະນັກງານ' : language === 'th' ? 'ประวัติการขายพนักงาน' : 'Employee Sales Log'}
          </NavLink>

          {/* Product Catalog */}
          <NavLink to="/admin/product-catalog" className={({ isActive }) => linkClass(isActive)}>
            <BookOpen size={18} /> {language === 'la' ? 'ລາຍການສິນຄ້າ' : language === 'th' ? 'รายการสินค้า' : 'Product Catalog'}
          </NavLink>

          {/* Promotions */}
          <NavLink to="/admin/promotions" className={({ isActive }) => linkClass(isActive)}>
            <Tag size={18} /> {language === 'la' ? 'ໂປຣໂມຊັນ' : language === 'th' ? 'โปรโมชั่น' : 'Promotions'}
          </NavLink>


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

export default AdminLayout;

