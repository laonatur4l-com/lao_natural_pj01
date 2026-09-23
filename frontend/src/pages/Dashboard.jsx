import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency, formatId, getThbPrice, getUsdPrice } from '../utils/formatters';
import { useLanguage } from '../context/LanguageContext';

function Dashboard() {
  const { user, login, logout } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  
  // Account Form State
  const [accountForm, setAccountForm] = useState({ name: '', phone: '', address: '' });
  const [accountMsg, setAccountMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    setAccountForm({ name: user.name || '', phone: user.phone || '', address: user.address || '' });

    const fetchData = async () => {
      try {
        const [ordersRes, profileRes, popularRes] = await Promise.all([
          api.get('/orders/read.php'),
          api.get('/user/profile.php').catch(() => ({ data: { data: null } })),
          api.get('/products/read_popular.php').catch(() => ({ data: { data: [] } }))
        ]);
        if (ordersRes.data?.data) setOrders(ordersRes.data.data);
        if (profileRes.data?.data) {
          const prof = profileRes.data.data;
          setAccountForm({ name: prof.name || '', phone: prof.phone || '', address: prof.address || '' });
        }
        if (popularRes.data?.data) setPopularProducts(popularRes.data.data.slice(0, 3));
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    try {
      await api.put('/user/profile.php', accountForm);
      setAccountMsg({ 
        text: language === 'la' ? 'ອັບເດດຂໍ້ມູນບັນຊີສຳເລັດແລ້ວ' : language === 'th' ? 'อัปเดตข้อมูลบัญชีสำเร็จแล้ว' : 'Account updated successfully', 
        type: 'success' 
      });
      login({ ...user, ...accountForm }, localStorage.getItem('token'));
      setTimeout(() => setAccountMsg({text: '', type: ''}), 3000);
    } catch (err) {
      setAccountMsg({ 
        text: language === 'la' ? 'ບໍ່ສາມາດອັບເດດຂໍ້ມູນບັນຊີໄດ້' : language === 'th' ? 'ไม่สามารถอัปเดตข้อมูลบัญชีได้' : 'Failed to update account', 
        type: 'error' 
      });
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12 min-h-[60vh]">
      <div className="flex justify-between items-end mb-12 border-b border-[#E8DCC4] pb-6">
        <div>
          <h1 className="text-4xl font-serif text-dark mb-2">{t('my_account')}</h1>
          <p className="text-gray-500 font-light tracking-wide">{language === 'la' ? `ຍິນດີຕ້ອນຮັບກັບຄືນ, ${user.name}` : language === 'th' ? `ยินดีต้อนรับกลับมา, ${user.name}` : `Welcome back, ${user.name}`}</p>
        </div>
        <button onClick={logout} className="text-sm uppercase tracking-widest text-primary hover:text-dark transition cursor-pointer">
          {t('logout')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Sidebar */}
        <div className="font-serif">
          <ul className="space-y-4 text-lg">
            <li>
              <button onClick={() => setActiveTab('orders')} className={`transition cursor-pointer ${activeTab === 'orders' ? 'text-dark border-b border-dark pb-1' : 'text-gray-400 hover:text-dark'}`}>{t('order_history')}</button>
            </li>
            <li>
              <button onClick={() => setActiveTab('account')} className={`transition cursor-pointer ${activeTab === 'account' ? 'text-dark border-b border-dark pb-1' : 'text-gray-400 hover:text-dark'}`}>{t('profile_details')}</button>
            </li>
            {user.role === 'owner' && (
              <li className="pt-4 mt-4 border-t border-[#E8DCC4]">
                <button onClick={() => navigate('/admin')} className="text-primary font-sans text-xs uppercase tracking-widest cursor-pointer">{language === 'la' ? 'ກະດານຄວບຄຸມຜູ້ດູແລ' : language === 'th' ? 'แดชบอร์ดผู้ดูแล' : 'Admin Dashboard'}</button>
              </li>
            )}
            {user.role === 'employee' || user.role === 'owner' ? (
              <li className="pt-4 mt-4 border-t border-[#E8DCC4]">
                <button onClick={() => navigate('/employee')} className="text-primary font-sans text-xs uppercase tracking-widest cursor-pointer">{t('portal')}</button>
              </li>
            ) : null}
          </ul>
        </div>

        {/* Main Content Area */}
        <div className="col-span-1 lg:col-span-3">
          
          {loading ? (
            <p className="text-gray-500">{language === 'la' ? 'ກຳລັງໂຫລດ...' : language === 'th' ? 'กำลังโหลด...' : 'Loading...'}</p>
          ) : (
            <>
              {activeTab === 'orders' && (
                <div>
                  <h2 className="text-xl font-serif mb-6 text-dark uppercase tracking-widest">{t('order_history')}</h2>
                  {orders.length === 0 ? (
                    <div className="bg-[#FDFBF7] border border-[#E8DCC4] p-8 text-center text-gray-500">
                      <p className="mb-4">{t('no_orders')}</p>
                      <button onClick={() => navigate('/products')} className="text-primary uppercase tracking-widest text-xs hover:text-dark border-b border-transparent hover:border-dark transition cursor-pointer">{language === 'la' ? 'ເລີ່ມຊື້ສິນຄ້າ' : language === 'th' ? 'เริ่มช้อปปิ้ง' : 'Start Shopping'}</button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {orders.map(order => (
                        <div key={order.id} className="bg-white border border-[#E8DCC4] p-6 lg:p-8">
                          <div className="flex flex-col md:flex-row justify-between border-b border-[#E8DCC4] pb-4 mb-4 gap-4">
                            <div>
                               <p className="text-sm uppercase tracking-widest mb-1 font-semibold">
                                 <Link to={`/order/${order.id}`} className="text-[#8A9A5B] hover:underline">
                                   {formatId('ORD', order.id)}
                                 </Link>
                               </p>
                              <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
                              {order.shipping_name && (
                                <div className="mt-2 text-xs text-gray-500">
                                  <p className="font-medium text-dark">{language === 'la' ? 'ຈັດສົ່ງໄປທີ່:' : language === 'th' ? 'จัดส่งไปที่:' : 'Shipped to:'}</p>
                                  <p>{order.shipping_name} ({order.shipping_phone})</p>
                                  <p>{order.shipping_address}</p>
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-serif text-dark mb-1">{formatCurrency(order.total_price)}</p>
                              <span className={`inline-block px-3 py-1 text-xs uppercase tracking-widest ${
                                order.status === 'received' ? 'bg-green-100 text-green-800' :
                                order.status === 'sending' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'payment_rejected' ? 'bg-red-100 text-red-800 border border-red-200' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {order.status === 'received' ? t('status_received') :
                                 order.status === 'sending' ? t('status_sending') :
                                 order.status === 'prepare' ? t('status_prepare') :
                                 order.status === 'payment_rejected' ? (language === 'la' ? 'ການຊຳລະເງິນຖືກປະຕິເສດ' : language === 'th' ? 'การชำระเงินถูกปฏิเสธ' : 'Payment Rejected') :
                                 t('status_pending')}
                              </span>
                            </div>
                          </div>

                          {order.status === 'payment_rejected' && (
                            <div className="mb-4 p-4 bg-red-50 border border-red-100 text-xs text-red-700 space-y-2 rounded-xl">
                              <p className="font-semibold uppercase tracking-wider">
                                {language === 'la' ? 'ການຊຳລະເງິນຖືກປະຕິເສດ' : language === 'th' ? 'การชำระเงินถูกปฏิเสธ' : 'Payment Rejected'}
                              </p>
                              <p>
                                {language === 'la' ? 'ເຫດຜົນ: ' : language === 'th' ? 'เหตุผล: ' : 'Reason: '}
                                <strong className="underline">{order.rejection_reason || (language === 'la' ? 'ບໍ່ລະບຸເຫດຜົນ' : language === 'th' ? 'ไม่ระบุเหตุผล' : 'No reason provided')}</strong>
                              </p>
                              <Link to={`/order/${order.id}`} className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold uppercase tracking-widest px-3 py-1.5 rounded transition text-[10px]">
                                {language === 'la' ? 'ອັບໂຫຼດສະລິບໃໝ່' : language === 'th' ? 'อัปโหลดสลิปใหม่' : 'Re-upload Slip'}
                              </Link>
                            </div>
                          )}
                          
                          <div className="space-y-3">
                            {order.items?.map(item => (
                              <div key={item.id} className="flex justify-between items-center text-sm">
                                <div className="flex items-center text-gray-600 gap-4">
                                  <span className="w-8 h-8 bg-[#FDFBF7] border border-[#E8DCC4] flex items-center justify-center text-xs">{item.quantity}</span>
                                  <Link to={`/product/${item.product_id}`} className="hover:text-[#8A9A5B] hover:underline">{item.name}</Link>
                                  <span className="text-[10px] text-gray-400 font-mono">{formatId('PRD', item.product_id)}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                  <span className="text-gray-500">{formatCurrency(item.price_lak || item.price, 'LAK')}</span>
                                  {getThbPrice(item.price_lak || item.price) > 0 && <span className="text-[10px] text-gray-400">{formatCurrency(getThbPrice(item.price_lak || item.price), 'THB')}</span>}
                                  {getUsdPrice(item.price_lak || item.price) > 0 && <span className="text-[10px] text-gray-400">{formatCurrency(getUsdPrice(item.price_lak || item.price), 'USD')}</span>}
                                </div>
                              </div>
                            ))}
                          </div>

                          {order.express_tracking && (
                            <div className="mt-6 pt-4 border-t border-[#E8DCC4] text-sm text-gray-600">
                              {language === 'la' ? 'ເລກຕິດຕາມພັດສະດຸ: ' : language === 'th' ? 'หมายเลขติดตามพัสดุ: ' : 'Tracking: '} <span className="font-medium text-dark">{order.express_tracking}</span> ({order.express_company})
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'account' && (
                <div>
                  <h2 className="text-xl font-serif mb-6 text-dark uppercase tracking-widest">{t('profile_details')}</h2>
                  <div className="bg-[#FDFBF7] border border-[#E8DCC4] p-8 max-w-xl">
                    {accountMsg.text && (
                      <div className={`p-4 mb-6 text-sm ${accountMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {accountMsg.text}
                      </div>
                    )}
                    <form onSubmit={handleUpdateAccount} className="space-y-4">
                      <div>
                        <label className="block text-xs uppercase text-gray-500 mb-1">{t('full_name')}</label>
                        <input type="text" required value={accountForm.name} onChange={e => setAccountForm({...accountForm, name: e.target.value})} className="w-full border border-gray-200 p-3 focus:outline-none focus:border-primary" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase text-gray-500 mb-1">{t('email_address')}</label>
                        <input type="email" value={user.email} disabled className="w-full border border-gray-200 p-3 bg-gray-50 text-gray-500 cursor-not-allowed" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase text-gray-500 mb-1">{language === 'la' ? 'ເບີໂທລະສັບ' : language === 'th' ? 'เบอร์โทรศัพท์' : 'Phone Number'}</label>
                        <input type="tel" required value={accountForm.phone} onChange={e => setAccountForm({...accountForm, phone: e.target.value})} className="w-full border border-gray-200 p-3 focus:outline-none focus:border-primary" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase text-gray-500 mb-1">{language === 'la' ? 'ທີ່ຢູ່ຈັດສົ່ງ' : language === 'th' ? 'ที่อยู่จัดส่ง' : 'Shipping Address'}</label>
                        <textarea rows="3" value={accountForm.address} onChange={e => setAccountForm({...accountForm, address: e.target.value})} className="w-full border border-gray-200 p-3 focus:outline-none focus:border-primary" placeholder={language === 'la' ? 'ກະລຸນາໃສ່ທີ່ຢູ່ຈັດສົ່ງຂອງທ່ານ' : language === 'th' ? 'กรุณาใส่ที่อยู่จัดส่งของคุณ' : 'Enter your default shipping address'}></textarea>
                      </div>
                      <button type="submit" className="bg-dark text-white px-6 py-3 uppercase tracking-widest text-sm hover:bg-black transition-colors mt-4 cursor-pointer">
                        {language === 'la' ? 'ບັນທຶກການປ່ຽນແປງ' : language === 'th' ? 'บันทึกการเปลี่ยนแปลง' : 'Save Changes'}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Popular Skincare Recommendations */}
      {popularProducts.length > 0 && (
        <div className="mt-20 pt-12 border-t border-[#E8DCC4]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-serif text-dark mb-1">{language === 'la' ? 'ແນະນຳສຳລັບທ່ານ' : language === 'th' ? 'แนะนำสำหรับคุณ' : 'Recommended for You'}</h2>
              <p className="text-gray-400 text-xs font-light">{language === 'la' ? 'ຜະລິດຕະພັນ ລາວເນເຊີໂຣ ທີ່ໄດ້ຮັບຄວາມນິຍົມໃນຊຸມຊົນຂອງພວກເຮົາ.' : language === 'th' ? 'ผลิตภัณฑ์ Lao Natural ที่ได้รับความนิยมในชุมชนของเรา' : 'Lao Natural products currently loved by our community.'}</p>
            </div>
            <Link to="/products" className="text-xs uppercase tracking-widest text-[#8A9A5B] hover:text-dark transition border-b border-transparent hover:border-dark pb-0.5">
              {language === 'la' ? 'ເບິ່ງຜະລິດຕະພັນທັງໝົດ' : language === 'th' ? 'สำรวจสินค้าทั้งหมด' : 'Explore All Products'}
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {popularProducts.map(product => (
              <Link 
                to={`/product/${product.id}`} 
                key={product.id} 
                className="flex items-center gap-4 p-4 bg-white border border-[#E8DCC4]/30 hover:border-[#8A9A5B]/30 hover:shadow-sm transition-all duration-300 group"
              >
                <div className="w-16 h-16 bg-[#FDFBF7] border border-gray-100 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <span className="text-[10px] font-serif text-gray-300">Natural</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif text-sm text-dark truncate group-hover:text-[#8A9A5B] transition-colors">{product.name}</h3>
                  <p className="text-xs text-gray-400 font-mono mb-1">{product.size}</p>
                  <div>
                    <p className="text-xs font-semibold text-dark">{formatCurrency(product.price_lak || product.price, 'LAK')}</p>
                    {getThbPrice(product.price_lak || product.price) > 0 && <p className="text-[10px] text-gray-400">{formatCurrency(getThbPrice(product.price_lak || product.price), 'THB')}</p>}
                    {getUsdPrice(product.price_lak || product.price) > 0 && <p className="text-[10px] text-gray-400">{formatCurrency(getUsdPrice(product.price_lak || product.price), 'USD')}</p>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
