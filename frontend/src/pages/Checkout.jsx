import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../utils/api';
import { formatCurrency, getThbPrice, getUsdPrice } from '../utils/formatters';
import { useLanguage } from '../context/LanguageContext';

const COUNTRIES_LIST = [
  { id: 'Laos', la: '🇱🇦 ລາວ (Laos)', th: '🇱🇦 ลาว (Laos)', en: '🇱🇦 Laos' },
  { id: 'Thailand', la: '🇹🇭 ໄທ (Thailand)', th: '🇹🇭 ไทย (Thailand)', en: '🇹🇭 Thailand' },
  { id: 'United States', la: '🇺🇸 ສະຫະລັດອາເມລິກາ (USA)', th: '🇺🇸 สหรัฐอเมริกา (USA)', en: '🇺🇸 United States' },
  { id: 'China', la: '🇨🇳 ຈີນ (China)', th: '🇨🇳 จีน (China)', en: '🇨🇳 China' },
  { id: 'Vietnam', la: '🇻🇳 ຫວຽດນາມ (Vietnam)', th: '🇻🇳 เวียดนาม (Vietnam)', en: '🇻🇳 Vietnam' },
  { id: 'Cambodia', la: '🇰🇭 ກຳປູເຈຍ (Cambodia)', th: '🇰🇭 กัมพูชา (Cambodia)', en: '🇰🇭 Cambodia' },
  { id: 'Other', la: '🌐 ປະເທດອື່ນໆ (Other)', th: '🌐 ประเทศอื่น ๆ (Other)', en: '🌐 Other Country' }
];

const PROVINCES_LIST = [
  { id: 'Luang Prabang', la: 'ຫຼວງພະບາງ (Luang Prabang)', th: 'หลวงพระบาง (Luang Prabang)', en: 'Luang Prabang', keywords: ['luang prabang', 'luangprabang', 'ຫຼວງພະບາງ', 'หลวงพระบาง'] },
  { id: 'Vientiane Capital', la: 'ນະຄອນຫຼວງວຽງຈັນ (Vientiane Capital)', th: 'เวียงจันทน์ (Vientiane Capital)', en: 'Vientiane Capital', keywords: ['vientiane capital', 'vientiane', 'ວຽງຈັນ', 'เวียงจันทน์'] },
  { id: 'Vientiane Province', la: 'ແຂວງວຽງຈັນ (Vientiane Province)', th: 'แขวงเวียงจันทน์ (Vientiane Province)', en: 'Vientiane Province', keywords: ['vientiane province', 'vang vieng', 'ວັງວຽງ'] },
  { id: 'Champasak', la: 'ຈຳປາສັກ (Champasak)', th: 'จำปาสัก (Champasak)', en: 'Champasak', keywords: ['champasak', 'pakse', 'ຈຳປາສັກ', 'ປາກເຊ', 'จำปาสัก', 'ปากเซ'] },
  { id: 'Savannakhet', la: 'ສະຫວັນນະເຂດ (Savannakhet)', th: 'สะหวันนะเขต (Savannakhet)', en: 'Savannakhet', keywords: ['savannakhet', 'ສະຫວັນນະເຂດ', 'สะหวันนะเขต'] },
  { id: 'Khammouane', la: 'ຄຳມ່ວນ (Khammouane)', th: 'คำม่วน (Khammouane)', en: 'Khammouane', keywords: ['khammouane', 'thakhek', 'ຄຳມ່ວນ', 'ທ່າແຂກ', 'คำม่วน', 'ท่าแขก'] },
  { id: 'Bolikhamsai', la: 'ບໍລິຄຳໄຊ (Bolikhamsai)', th: 'บริคำไชย (Bolikhamsai)', en: 'Bolikhamsai', keywords: ['bolikhamsai', 'paksan', 'ບໍລິຄຳໄຊ', 'ปากซัน'] },
  { id: 'Oudomxay', la: 'ອຸດົມໄຊ (Oudomxay)', th: 'อุดมไชย (Oudomxay)', en: 'Oudomxay', keywords: ['oudomxay', 'ອຸດົມໄຊ', 'อุดมไชย'] },
  { id: 'Luang Namtha', la: 'ຫຼວງນ້ຳທາ (Luang Namtha)', th: 'หลวงน้ำทา (Luang Namtha)', en: 'Luang Namtha', keywords: ['luang namtha', 'luangnamtha', 'ຫຼວງນ້ຳທາ', 'หลวงน้ำทา'] },
  { id: 'Phongsaly', la: 'ຜົ້ງສາລີ (Phongsaly)', th: 'พงสาลี (Phongsaly)', en: 'Phongsaly', keywords: ['phongsaly', 'ຜົ້ງສາລີ', 'พงสาลี'] },
  { id: 'Bokeo', la: 'ບໍ່ແກ້ວ (Bokeo)', th: 'บ่อแก้ว (Bokeo)', en: 'Bokeo', keywords: ['bokeo', 'houayxay', 'ບໍ່ແກ້ວ', 'ห้วยทราย'] },
  { id: 'Huaphanh', la: 'ຫົວພັນ (Huaphanh)', th: 'หัวพัน (Huaphanh)', en: 'Huaphanh', keywords: ['huaphanh', 'sam neua', 'ຫົວພັນ', 'ຊຳເໜືອ', 'หัวพัน'] },
  { id: 'Xieng Khouang', la: 'ຊຽງຂວາງ (Xieng Khouang)', th: 'เชียงขวาง (Xieng Khouang)', en: 'Xieng Khouang', keywords: ['xieng khouang', 'xiengkhouang', 'phonsavan', 'ຊຽງຂວາງ', 'ໂພນສະຫວັນ', 'เชียงขวาง'] },
  { id: 'Xaisomboun', la: 'ໄຊສົມບູນ (Xaisomboun)', th: 'ไชยสมบูรณ์ (Xaisomboun)', en: 'Xaisomboun', keywords: ['xaisomboun', 'ໄຊສົມບູນ', 'ไชยสมบูรณ์'] },
  { id: 'Salavan', la: 'ສາລະວັນ (Salavan)', th: 'สาละวัน (Salavan)', en: 'Salavan', keywords: ['salavan', 'ສາລະວັນ', 'สาละวัน'] },
  { id: 'Sekong', la: 'ເຊກອງ (Sekong)', th: 'เซกอง (Sekong)', en: 'Sekong', keywords: ['sekong', 'ເຊກອງ', 'เซกอง'] },
  { id: 'Attapeu', la: 'ອັດຕະປື (Attapeu)', th: 'อัตตะปือ (Attapeu)', en: 'Attapeu', keywords: ['attapeu', 'ອັດຕະປື', 'อัตตะปือ'] },
  { id: 'Sainyabuli', la: 'ໄຊຍະບູລີ (Sainyabuli)', th: 'ไชยบุรี (Sainyabuli)', en: 'Sainyabuli', keywords: ['sainyabuli', 'sayaboury', 'ໄຊຍະບູລີ', 'ไชยบุรี'] },
];

function Checkout() {
  const { user } = useAuth();
  const { cartItems, total, totalThb, totalUsd, clearCart, getItemSubtotal, exchangeRates, refreshExchangeRates } = useCart();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [shippingForm, setShippingForm] = useState({ name: '', phone: '', address: '' });
  
  const [selectedProvince, setSelectedProvince] = useState('Luang Prabang');
  const [paymentScreenshot, setPaymentScreenshot] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [activeQrCurrency, setActiveQrCurrency] = useState('LAK'); // 'LAK', 'THB', 'USD'

  useEffect(() => {
    if (refreshExchangeRates) refreshExchangeRates();
    if (user) {
      // Pre-fill from user profile
      setShippingForm({ name: user.name || '', phone: user.phone || '', address: user.address || '' });
      // Also fetch fresh profile data
      api.get('/user/profile.php').then(res => {
        if (res.data?.data) {
          const prof = res.data.data;
          setShippingForm({
            name: prof.name || user.name || '',
            phone: prof.phone || user.phone || '',
            address: prof.address || ''
          });
        }
      }).catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    // Auto-detect province from address text (Lao, Thai, or English keywords)
    const text = (shippingForm.address || '').toLowerCase().replace(/\s/g, '');
    if (!text) return;
    
    for (const p of PROVINCES_LIST) {
      const match = p.keywords.some(kw => text.includes(kw.toLowerCase().replace(/\s/g, '')));
      if (match) {
        setSelectedProvince(p.id);
        break;
      }
    }
  }, [shippingForm.address]);

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Url = reader.result;
      setScreenshotPreview(base64Url);
      setUploadingScreenshot(true);
      setError('');

      try {
        const formDataUpload = new FormData();
        formDataUpload.append('screenshot', file);

        const res = await api.post('/orders/upload_screenshot.php', formDataUpload, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (res.data?.screenshot_url) {
          setPaymentScreenshot(res.data.screenshot_url);
        } else {
          setPaymentScreenshot(base64Url);
        }
      } catch (err) {
        console.warn('Server storage upload notice, using image fallback:', err);
        setPaymentScreenshot(base64Url);
      } finally {
        setUploadingScreenshot(false);
      }
    };

    reader.readAsDataURL(file);
  };

  // If not logged in, this would be handled by a protected route typically,
  // but for simplicity we can redirect or show a message.
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-serif mb-4">{language === 'la' ? 'ກະລຸນາເຂົ້າສູ່ລະບົບເພື່ອຊຳລະເງິນ' : language === 'th' ? 'กรุณาเข้าสู่ระบบเพื่อชำระเงิน' : 'Please log in to checkout'}</h2>
        <Link to="/login" className="text-primary hover:underline">{t('sign_in')}</Link>
      </div>
    );
  }

  if (cartItems.length === 0 && !success) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-serif mb-4">{t('cart_empty')}</h2>
        <Link to="/products" className="text-primary hover:underline">{t('continue_shopping')}</Link>
      </div>
    );
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!paymentScreenshot) {
      setError(language === 'la' ? 'ກະລຸນາອັບໂຫຼດສະລິບການໂອນເງິນກ່ອນຢືນຢັນການສັ່ງຊື້.' : language === 'th' ? 'กรุณาอัปโหลดสลิปการโอนเงินก่อนทำการสั่งซื้อ' : 'Please upload your payment screenshot before placing your order.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setLoading(true);
    setError('');

    try {
      const items = cartItems.map(item => {
        const sub = getItemSubtotal(item);
        const effectivePrice = item.quantity > 0 ? (sub.lak / item.quantity) : Number(item.price_lak || item.price || 0);

        return {
          id: item.id,
          quantity: item.quantity,
          price: effectivePrice,
          selectedSize: item.selectedSize || ''
        };
      });

      await api.post('/orders/create.php', { 
        items,
        shipping_name: shippingForm.name,
        shipping_phone: shippingForm.phone,
        shipping_address: shippingForm.address,
        province: selectedProvince,
        shipping_cost: 0,
        payment_screenshot: paymentScreenshot
      });
      clearCart();
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (err) {
       console.error("Order creation failed", err);
       setError(err.response?.data?.message || "Something went wrong placing your order. Please try again.");
    } finally {
       setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-4xl font-serif mb-4 text-primary">{language === 'la' ? 'ຂໍຂອບໃຈ' : language === 'th' ? 'ขอบคุณ' : 'Thank You'}</h2>
        <p className="text-gray-600 mb-8">{language === 'la' ? 'ລາຍການສັ່ງຊື້ຂອງທ່ານສຳເລັດແລ້ວ.' : language === 'th' ? 'ทำการสั่งซื้อสร็จสมบูรณ์เรียบร้อยแล้ว' : 'Your order has been placed successfully.'}</p>
        <p className="text-sm text-gray-500">{language === 'la' ? 'ກຳລັງນຳທ່ານກັບໄປໜ້າຫຼັກ...' : language === 'th' ? 'กำลังนำคุณไปยังหน้าแดชบอร์ด...' : 'Redirecting to your dashboard...'}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12">
      <h1 className="text-3xl font-serif mb-8 text-dark text-center uppercase tracking-widest">{t('checkout_title')}</h1>
      
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Checkout Form */}
        <div className="lg:w-2/3">
          <div className="bg-[#FDFBF7] p-8 border border-[#E8DCC4]">
            <h2 className="text-xl font-serif mb-6 border-b border-[#E8DCC4] pb-4">{t('shipping_details')}</h2>
            
            {error && <div className="bg-red-50 text-red-600 p-4 mb-4 text-sm">{error}</div>}
            
            <form onSubmit={handlePlaceOrder} className="space-y-6">
              
              <div className="space-y-4 bg-white p-4 border border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-xs uppercase text-gray-500 mb-1">{t('full_name')}</label>
                     <input type="text" value={shippingForm.name} onChange={e => setShippingForm({...shippingForm, name: e.target.value})} required className="w-full border border-gray-200 p-3 focus:outline-none focus:border-primary" />
                   </div>
                   <div>
                     <label className="block text-xs uppercase text-gray-500 mb-1">{t('phone_number')}</label>
                     <input type="text" value={shippingForm.phone} onChange={e => setShippingForm({...shippingForm, phone: e.target.value})} required className="w-full border border-gray-200 p-3 focus:outline-none focus:border-primary" />
                   </div>
                </div>
                
                <div>
                  <label className="block text-xs uppercase text-gray-500 mb-1">{t('province')}</label>
                  <select 
                    value={selectedProvince} 
                    onChange={e => setSelectedProvince(e.target.value)} 
                    className="w-full border border-gray-200 p-3 focus:outline-none focus:border-primary bg-white cursor-pointer font-sans"
                  >
                    {PROVINCES_LIST.map(p => (
                      <option key={p.id} value={p.id}>
                        {language === 'la' ? p.la : language === 'th' ? p.th : p.en}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase text-gray-500 mb-1">{t('delivery_address')}</label>
                  <textarea 
                    rows="3" 
                    value={shippingForm.address} 
                    onChange={e => setShippingForm({...shippingForm, address: e.target.value})} 
                    required 
                    className="w-full border border-gray-200 p-3 focus:outline-none focus:border-primary"
                    placeholder={language === 'la' ? 'ລະບຸທີ່ຢູ່, ບ້ານ, ເມືອງ, ຈຸດສັງເກດ ຫຼື ບໍລິສັດຂົນສົ່ງ...' : language === 'th' ? 'ระบุที่อยู่ บ้าน เมือง จุดสังเกต หรือบริษัทขนส่ง...' : 'Enter address, village, district, landmark or transport branch...'}
                  ></textarea>
                </div>
              </div>



              {/* QR Code and Proof Upload Section */}
              <div className="bg-white p-6 border border-[#E8DCC4] space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-[#E8DCC4] pb-4 gap-4">
                  <div>
                    <h3 className="text-xl md:text-2xl font-serif text-dark font-bold uppercase tracking-wider">
                      {language === 'la' ? 'ຊຳລະເງິນຜ່ານ BCEL One (LAO QR)' : language === 'th' ? 'ชำระเงินผ่าน BCEL One (LAO QR)' : 'Payment via BCEL One (LAO QR)'}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-500 font-medium mt-1">
                      {language === 'la' ? 'ກະລຸນາເລືອກສະກຸນເງິນທີ່ທ່ານຕ້ອງການຊຳລະ:' : language === 'th' ? 'กรุณาเลือกสกุลเงินที่คุณต้องการชำระ:' : 'Please select your payment currency:'}
                    </p>
                  </div>
                  
                  {/* Currency Selection Tabs — Fully Responsive Grid for Mobile */}
                  <div className="grid grid-cols-3 gap-1.5 bg-[#FDFBF7] p-1.5 border-2 border-[#8A9A5B]/30 rounded-2xl shadow-sm w-full md:w-auto">
                    {[
                      { code: 'LAK', flag: '🇱🇦', label: 'LAK (₭)' },
                      { code: 'THB', flag: '🇹🇭', label: 'THB (฿)' },
                      { code: 'USD', flag: '🇺🇸', label: 'USD ($)' }
                    ].map(cur => (
                      <button
                        key={cur.code}
                        type="button"
                        onClick={() => setActiveQrCurrency(cur.code)}
                        className={`flex items-center justify-center gap-1 sm:gap-2 px-2 py-2 md:px-5 md:py-2.5 text-xs sm:text-sm md:text-base font-extrabold rounded-xl transition-all cursor-pointer text-center ${
                          activeQrCurrency === cur.code
                            ? 'bg-[#8A9A5B] text-white shadow-md border border-[#7A8A4B]'
                            : 'text-gray-700 hover:text-dark hover:bg-white/80'
                        }`}
                      >
                        <span className="text-sm sm:text-base md:text-lg">{cur.flag}</span>
                        <span className="truncate">{cur.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-6">
                  {/* QR Image & Currency Tag */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="w-64 h-64 border-2 border-gray-200 p-3 bg-white flex items-center justify-center shadow-md rounded-2xl overflow-hidden relative group">
                      <img 
                        src={activeQrCurrency === 'THB' ? '/lao_thb_qr.png' : activeQrCurrency === 'USD' ? '/lao_usd_qr.png' : '/lao_lak_qr.png'} 
                        alt={`${activeQrCurrency} QR Code`} 
                        className="w-full h-full object-contain" 
                      />
                      <div className="absolute top-2.5 right-2.5 bg-[#8A9A5B] text-white text-xs font-extrabold px-2.5 py-1 rounded-lg shadow-md">
                        {activeQrCurrency} QR
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-500">
                      {language === 'la' ? 'ສະແກນ QR ໂຄ້ດນີ້' : language === 'th' ? 'สแกน QR โค้ดนี้' : 'Scan this QR Code'} ({activeQrCurrency})
                    </span>
                  </div>
                  
                  {/* Payment Instructions & Account Breakdown */}
                  <div className="flex-1 space-y-4">
                    <p className="text-sm text-gray-600 font-light leading-relaxed">
                      {language === 'la' 
                        ? 'ກະລຸນາເປີດແອັບທະນາຄານຂອງທ່ານ (BCEL One ຫຼື ແອັບທີ່ຮອງຮັບ) ແລະ ສະແກນ QR ໂຄ້ດເພື່ອຊຳລະເງິນຕາມສະກຸນເງິນທີ່ເລືອກ.' 
                        : language === 'th' 
                        ? 'กรุณาเปิดแอปธนาคารของคุณ (BCEL One หรือแอปที่รองรับ) และสแกนคิวอาร์โค้ดเพื่อชำระเงินตามสกุลเงินที่เลือก' 
                        : 'Please open your banking app (BCEL One or any supported app) and scan the QR code to transfer in your selected currency.'}
                    </p>

                    {/* Account & Transfer Info Card */}
                    <div className="bg-[#FDFBF7] border border-[#E8DCC4] p-4 rounded-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-[#E8DCC4]/60 pb-2">
                        <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">
                          {language === 'la' ? 'ເລກບັນຊີ BCEL One' : language === 'th' ? 'เลขบัญชี BCEL One' : 'BCEL Account No.'}
                        </span>
                        <span className="text-xs font-mono font-bold text-dark bg-white px-2 py-1 border border-gray-200 rounded">
                          {activeQrCurrency === 'LAK' && '050-12-36219162 LAK'}
                          {activeQrCurrency === 'THB' && '050-12-36219313 THB'}
                          {activeQrCurrency === 'USD' && '050-12-36219461 USD'}
                        </span>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">
                          {language === 'la' ? 'ຈຳນວນເງິນທີ່ຕ້ອງໂອນ' : language === 'th' ? 'จำนวนเงินที่ต้องโอน' : 'Amount to Transfer'} ({activeQrCurrency})
                        </p>
                        
                        {activeQrCurrency === 'LAK' && (
                          <p className="text-2xl font-bold text-[#8A9A5B]">
                            {formatCurrency(total + total * 0.1, 'LAK')}
                          </p>
                        )}
                        {activeQrCurrency === 'THB' && (
                          <p className="text-2xl font-bold text-[#8A9A5B]">
                            {formatCurrency(totalThb + totalThb * 0.1, 'THB')}
                          </p>
                        )}
                        {activeQrCurrency === 'USD' && (
                          <p className="text-2xl font-bold text-[#8A9A5B]">
                            {formatCurrency(totalUsd + totalUsd * 0.1, 'USD')}
                          </p>
                        )}
                      </div>

                      {/* Display equivalent amounts in all 3 currencies for clarity */}
                      <div className="pt-2 border-t border-[#E8DCC4]/60 flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-500">
                        <span>LAK: {formatCurrency(total + total * 0.1, 'LAK')}</span>
                        <span>• THB: {formatCurrency(totalThb + totalThb * 0.1, 'THB')}</span>
                        <span>• USD: {formatCurrency(totalUsd + totalUsd * 0.1, 'USD')}</span>
                      </div>
                    </div>

                    <p className="text-xs text-amber-600 font-medium">
                      {language === 'la' ? '*ໝາຍເຫດ: ກະລຸນາໂອນເງິນຕາມຈຳນວນທີ່ລະບຸໄວ້ຂ້າງເທິງໃຫ້ຖືກຕ້ອງ, ຖ່າຍພາບໜ້າຈໍການໂອນເງິນສຳເລັດ ແລະ ອັບໂຫຼດເພື່ອເປັນຫຼັກຖານ.' : language === 'th' ? '*ข้อสำคัญ: กรุณาโอนเงินให้ตรงตามจำนวนที่ระบุไว้ข้างต้น และจับภาพหน้าจอการทำรายการสำเร็จเพื่อนำมาอัปโหลดเป็นหลักฐาน' : '*Important: Transfer the exact amount shown above, capture a screenshot of the successful transaction, and upload it below as proof.'}
                    </p>
                  </div>
                </div>
                
                {/* Screenshot Upload Field */}
                <div className="border-t border-dashed border-gray-200 pt-6">
                  <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2 font-semibold">{t('proof_desc')}</label>
                  
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    <label className="cursor-pointer bg-[#FDFBF7] hover:bg-gray-50 border border-dashed border-gray-300 hover:border-[#8A9A5B] transition-colors p-4 rounded-xl flex flex-col items-center justify-center text-center w-full sm:w-48 h-32 shrink-0 group relative overflow-hidden">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleScreenshotChange} 
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10" 
                        disabled={uploadingScreenshot}
                      />
                      {uploadingScreenshot ? (
                        <div className="w-6 h-6 border-2 border-[#8A9A5B] border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">📸</span>
                          <span className="text-xs text-gray-500 font-medium">{t('choose_file')}</span>
                          <span className="text-[10px] text-gray-400 mt-1">PNG, JPG, WebP</span>
                        </>
                      )}
                    </label>
                    
                    {/* Preview of Uploaded Image */}
                    {screenshotPreview && (
                      <div className="relative border border-gray-200 rounded-xl overflow-hidden bg-gray-50 w-full sm:w-48 h-32 flex items-center justify-center shrink-0 group">
                        <img src={screenshotPreview} alt="Screenshot Preview" className="w-full h-full object-cover" />
                        {paymentScreenshot && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-xs font-semibold uppercase tracking-widest">Uploaded</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button 
                  type="submit" 
                  disabled={loading || uploadingScreenshot || !paymentScreenshot}
                  className="w-full bg-dark text-white py-4 uppercase tracking-widest text-sm hover:bg-black transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Processing...' : t('place_order')}
                </button>
                <p className="text-xs text-center text-gray-500 mt-4">{language === 'la' ? '*ລາຍການສັ່ງຊື້ ແລະ ສະລິບການໂອນເງິນຂອງທ່ານຈະຖືກສົ່ງເພື່ອກວດສອບ.' : language === 'th' ? '*รายการสั่งซื้อและสลิปการโอนเงินของคุณจะถูกส่งเพื่อตรวจสอบ' : '*Your order and payment slip will be submitted for verification.'}</p>
              </div>
            </form>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:w-1/3">
          <div className="bg-white p-8 border border-[#E8DCC4]">
            <h2 className="text-xl font-serif mb-6 border-b border-[#E8DCC4] pb-4">{t('order_summary')}</h2>
            
            <div className="space-y-4 mb-6">
              {cartItems.map(item => {
                const itemLak = item.price_lak || item.price || 0;
                const itemThb = getThbPrice(itemLak);
                const itemUsd = getUsdPrice(itemLak);
                return (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div className="flex items-center gap-4 text-gray-600">
                      <span className="w-6 h-6 bg-gray-100 flex items-center justify-center rounded-full text-xs">{item.quantity}</span>
                      <span className="truncate w-32">{item.name}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-dark font-medium">{formatCurrency(itemLak * item.quantity, 'LAK')}</span>
                      <span className="text-[10px] text-gray-400">{formatCurrency(itemThb * item.quantity, 'THB')}</span>
                      <span className="text-[10px] text-gray-400">{formatCurrency(itemUsd * item.quantity, 'USD')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="border-t border-[#E8DCC4] pt-4 space-y-3">
              <div className="flex justify-between text-sm text-gray-500 items-start">
                <span>{t('subtotal')}</span>
                <div className="flex flex-col items-end">
                  <span className="text-dark font-medium">{formatCurrency(total, 'LAK')}</span>
                  <span className="text-xs text-gray-400">{formatCurrency(totalThb, 'THB')}</span>
                  <span className="text-xs text-gray-400">{formatCurrency(totalUsd, 'USD')}</span>
                </div>
              </div>
              <div className="flex justify-between text-sm text-gray-500 items-start">
                <span>VAT (10%)</span>
                <div className="flex flex-col items-end">
                  <span className="text-dark font-medium">{formatCurrency(total * 0.1, 'LAK')}</span>
                  <span className="text-xs text-gray-400">{formatCurrency(totalThb * 0.1, 'THB')}</span>
                  <span className="text-xs text-gray-400">{formatCurrency(totalUsd * 0.1, 'USD')}</span>
                </div>
              </div>
              <div className="flex justify-between text-sm text-gray-500 items-start">
                <div>
                  <span>{t('shipping_cost')}</span>
                  <span className="block text-[11px] text-gray-400 font-normal">
                    {selectedProvince === 'Luang Prabang'
                      ? (language === 'la' ? '(ຫຼວງພະບາງ - ສົ່ງຟຣີ)' : language === 'th' ? '(หลวงพระบาง - ส่งฟรี)' : '(Luang Prabang - Free Delivery)')
                      : (language === 'la' ? '(ຕ່າງແຂວງ - ເກັບປາຍທາງ)' : language === 'th' ? '(ต่างจังหวัด - เก็บปลายทาง)' : '(Other Provinces - Pay on Delivery)')}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  {selectedProvince === 'Luang Prabang' ? (
                    <span className="inline-block bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded text-xs border border-emerald-200">
                      {language === 'la' ? 'ສົ່ງຟຣີ' : language === 'th' ? 'ส่งฟรี' : 'FREE'}
                    </span>
                  ) : (
                    <div className="text-right">
                      <span className="inline-block bg-amber-50 text-amber-700 font-medium px-2 py-0.5 rounded text-xs border border-amber-200">
                        {language === 'la' ? 'ເກັບເງິນປາຍທາງ' : language === 'th' ? 'เก็บเงินปลายทาง' : 'Collect on Delivery'}
                      </span>
                      <span className="block text-[10px] text-gray-400 mt-0.5">
                        {language === 'la' ? '(ຊຳລະກັບບໍລິສັດຂົນສົ່ງ)' : language === 'th' ? '(ชำระกับบริษัทขนส่ง)' : '(Pay to courier upon delivery)'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-between text-lg font-serif mt-4 pt-4 border-t border-[#E8DCC4] items-start">
                <span>{t('total')}</span>
                <div className="flex flex-col items-end">
                  <span className="text-xl font-bold text-dark">{formatCurrency(total + total * 0.1, 'LAK')}</span>
                  {totalThb > 0 && <span className="text-sm font-semibold text-gray-500">{formatCurrency(totalThb + totalThb * 0.1, 'THB')}</span>}
                  {totalUsd > 0 && <span className="text-sm font-semibold text-gray-500">{formatCurrency(totalUsd + totalUsd * 0.1, 'USD')}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
