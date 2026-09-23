import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { ArrowLeft, Package, Truck, CheckCircle, Info } from 'lucide-react';
import { formatId, formatCurrency, getThbPrice, getUsdPrice } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  
  // Inline edit state
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editForm, setEditForm] = useState({
    shipping_name: '',
    shipping_phone: '',
    shipping_address: ''
  });
  const [updatingAddress, setUpdatingAddress] = useState(false);
  const [addressError, setAddressError] = useState('');

  // Re-upload states
  const [newScreenshotPreview, setNewScreenshotPreview] = useState(null);
  const [newScreenshotUrl, setNewScreenshotUrl] = useState('');
  const [uploadingNewScreenshot, setUploadingNewScreenshot] = useState(false);
  const [submittingNewPayment, setSubmittingNewPayment] = useState(false);
  const [activeQrCurrency, setActiveQrCurrency] = useState('LAK');

  const handleReuploadScreenshotChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setNewScreenshotPreview(URL.createObjectURL(file));
    setUploadingNewScreenshot(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('screenshot', file);

      const res = await api.post('/orders/upload_screenshot.php', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data?.screenshot_url) {
        setNewScreenshotUrl(res.data.screenshot_url);
      } else {
        throw new Error('No upload URL returned');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to upload proof of payment. Please try again.');
      setNewScreenshotPreview(null);
      setNewScreenshotUrl('');
    } finally {
      setUploadingNewScreenshot(false);
    }
  };

  const handleSubmitNewPayment = async () => {
    if (!newScreenshotUrl) return;
    setSubmittingNewPayment(true);
    try {
      await api.put('/orders/reupload_payment.php', {
        id: order.id,
        payment_screenshot: newScreenshotUrl
      });
      setOrder({
        ...order,
        status: 'pending_payment',
        payment_screenshot: newScreenshotUrl,
        rejection_reason: null
      });
      setNewScreenshotUrl('');
      setNewScreenshotPreview(null);
      alert("New payment proof submitted successfully!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to submit new payment proof.");
    } finally {
      setSubmittingNewPayment(false);
    }
  };

  const handleStartEdit = () => {
    if (order) {
      setEditForm({
        shipping_name: order.shipping_name || '',
        shipping_phone: order.shipping_phone || '',
        shipping_address: order.shipping_address || ''
      });
      setAddressError('');
      setIsEditingAddress(true);
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!editForm.shipping_name.trim() || !editForm.shipping_phone.trim() || !editForm.shipping_address.trim()) {
      setAddressError("All fields are required.");
      return;
    }
    setUpdatingAddress(true);
    setAddressError('');
    try {
      await api.put('/orders/update_address.php', {
        id: order.id,
        shipping_name: editForm.shipping_name.trim(),
        shipping_phone: editForm.shipping_phone.trim(),
        shipping_address: editForm.shipping_address.trim()
      });
      setOrder({
        ...order,
        shipping_name: editForm.shipping_name.trim(),
        shipping_phone: editForm.shipping_phone.trim(),
        shipping_address: editForm.shipping_address.trim()
      });
      setIsEditingAddress(false);
    } catch (err) {
      console.error(err);
      setAddressError(err.response?.data?.message || "Failed to update shipping address.");
    } finally {
      setUpdatingAddress(false);
    }
  };


  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get('/orders/read.php');
        if (res.data?.data) {
          const found = res.data.data.find(o => o.id.toString() === id);
          if (found) {
            setOrder(found);
            return;
          }
        }
        const employeeRes = await api.get('/admin/employee_analytics.php');
        if (employeeRes.data?.orders_list) {
          const found = employeeRes.data.orders_list.find(o => o.id.toString() === id);
          if (found) {
            setOrder(found);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to load order detail", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleApprovePayment = async () => {
    setApproving(true);
    try {
      await api.put('/orders/update_status.php', { id: order.id, status: 'prepare' });
      setOrder({ ...order, status: 'prepare' });
    } catch (err) {
      alert("Failed to approve payment status.");
    } finally {
      setApproving(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-500">{language === 'la' ? 'ກຳລັງໂຫລດ...' : language === 'th' ? 'กำลังโหลด...' : 'Loading Order Tracking...'}</div>;

  if (!order) return (
    <div className="p-12 text-center text-gray-500">
      <h2 className="text-2xl font-serif text-dark mb-4">{language === 'la' ? 'ບໍ່ພົບລາຍການສັ່ງຊື້' : language === 'th' ? 'ไม่พบรายการสั่งซื้อ' : 'Order Not Found'}</h2>
      <button onClick={() => navigate(-1)} className="text-[#8A9A5B] hover:text-dark uppercase tracking-widest text-xs cursor-pointer">{language === 'la' ? 'ກັບຄືນ' : language === 'th' ? 'ย้อนกลับ' : 'Go Back'}</button>
    </div>
  );

  const steps = ['pending_payment', 'prepare', 'sending', 'received'];
  const isRejected = order.status === 'payment_rejected';
  const currentStep = isRejected ? 0 : steps.indexOf(order.status);

  const itemsSubtotal = order.items?.reduce((sum, item) => sum + Number(item.price * item.quantity), 0) || 0;
  const vatAmount = itemsSubtotal * 0.10;

  const itemsSubtotalThb = order.items?.reduce((sum, item) => sum + (getThbPrice(item.price_lak || item.price) * item.quantity), 0) || 0;
  const itemsSubtotalUsd = order.items?.reduce((sum, item) => sum + (getUsdPrice(item.price_lak || item.price) * item.quantity), 0) || 0;

  const vatAmountThb = itemsSubtotalThb * 0.10;
  const vatAmountUsd = itemsSubtotalUsd * 0.10;

  const shippingCostThb = getThbPrice(Number(order.shipping_cost || 0));
  const shippingCostUsd = getUsdPrice(Number(order.shipping_cost || 0));

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <button onClick={() => navigate(-1)} className="text-xs uppercase tracking-widest text-gray-400 hover:text-dark flex items-center gap-2 mb-8 transition-colors cursor-pointer">
        <ArrowLeft size={16} /> {language === 'la' ? 'ກັບຄືນ' : language === 'th' ? 'ย้อนกลับ' : 'Back to previous page'}
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif text-dark mb-2">{t('order_tracking')} {formatId('ORD', order.id)}</h1>
          <p className="text-gray-500">{language === 'la' ? 'ສັ່ງຊື້ເມື່ອ' : language === 'th' ? 'สั่งซื้อเมื่อ' : 'Placed on'} {new Date(order.created_at).toLocaleDateString()}</p>
        </div>
        <div className={`px-4 py-2 uppercase tracking-widest text-sm rounded-full ${isRejected ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-[#E8DCC4]/20 text-[#8A9A5B]'}`}>
          {isRejected 
            ? (language === 'la' ? 'ການຊຳລະເງິນຖືກປະຕິເສດ' : language === 'th' ? 'การชำระเงินถูกปฏิเสธ' : 'Payment Rejected')
            : order.status === 'pending_payment' ? t('status_pending') 
            : order.status === 'prepare' ? t('status_prepare') 
            : order.status === 'sending' ? t('status_sending') 
            : t('status_received')}
        </div>
      </div>

      {isRejected && (
        <div className="mb-8 bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="space-y-1">
            <h3 className="text-red-800 font-semibold uppercase tracking-wider text-sm">
              {language === 'la' ? 'ການຊຳລະເງິນຖືກປະຕິເສດ' : language === 'th' ? 'การชำระเงินถูกปฏิเสธ' : 'Payment Verification Failed'}
            </h3>
            <p className="text-sm text-red-700 leading-relaxed">
              {language === 'la' ? 'ເຫດຜົນ: ' : language === 'th' ? 'เหตุผล: ' : 'Reason: '}
              <strong className="underline">{order.rejection_reason || (language === 'la' ? 'ບໍ່ລະບຸເຫດຜົນ' : language === 'th' ? 'ไม่ระบุเหตุผล' : 'No reason provided')}</strong>.
            </p>
            <p className="text-xs text-red-600">
              {language === 'la' ? 'ກະລຸນາກວດສອບຍອດໂອນ ຫຼື ອັບໂຫຼດສະລິບໃໝ່ໃຫ້ຖືກຕ້ອງອີກຄັ້ງ.' : language === 'th' ? 'กรุณาตรวจสอบยอดโอน หรืออัปโหลดสลิปใหม่ให้ถูกต้องอีกครั้ง' : 'Please verify your transfer details or upload a new transaction slip below.'}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          
          {/* Tracking Progress */}
          <div className="bg-white border border-gray-100 p-8 rounded-xl shadow-sm">
            <h2 className="text-sm uppercase tracking-widest text-gray-400 mb-8 border-b border-gray-100 pb-2">{language === 'la' ? 'ສະຖານະການຈັດສົ່ງ' : language === 'th' ? 'สถานะการจัดส่ง' : 'Status Timeline'}</h2>
            <div className="flex justify-between items-center relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 -z-10"></div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#8A9A5B] transition-all -z-10" style={{ width: `${isRejected ? '0%' : `${(currentStep / (steps.length - 1)) * 100}%`}` }}></div>
              
              <div className="flex flex-col items-center gap-2 bg-white px-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isRejected ? 'bg-red-500 text-white animate-pulse' :
                  currentStep >= 0 ? 'bg-[#8A9A5B] text-white' : 
                  'bg-gray-100 text-gray-400'
                }`}><Info size={20} /></div>
                <span className={`text-[10px] uppercase tracking-widest text-center ${isRejected ? 'text-red-500 font-semibold animate-pulse' : 'text-gray-500'}`}>
                  {isRejected 
                    ? (language === 'la' ? 'ຖືກປະຕິເສດ' : language === 'th' ? 'ปฏิเสธแล้ว' : 'Rejected')
                    : (language === 'la' ? 'ຊຳລະແລ້ວ' : language === 'th' ? 'ชำระเงินแล้ว' : 'Paid')
                  }
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 bg-white px-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-[#8A9A5B] text-white' : 'bg-gray-100 text-gray-400'}`}><Package size={20} /></div>
                <span className="text-[10px] uppercase tracking-widest text-gray-500 text-center">{language === 'la' ? 'ກຽມຈັດສົ່ງ' : language === 'th' ? 'เตรียมสินค้า' : 'Prepare'}</span>
              </div>
              <div className="flex flex-col items-center gap-2 bg-white px-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-[#8A9A5B] text-white' : 'bg-gray-100 text-gray-400'}`}><Truck size={20} /></div>
                <span className="text-[10px] uppercase tracking-widest text-gray-500 text-center">{language === 'la' ? 'ຈັດສົ່ງແລ້ວ' : language === 'th' ? 'จัดส่งแล้ว' : 'Sent'}</span>
              </div>
              <div className="flex flex-col items-center gap-2 bg-white px-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-[#8A9A5B] text-white' : 'bg-gray-100 text-gray-400'}`}><CheckCircle size={20} /></div>
                <span className="text-[10px] uppercase tracking-widest text-gray-500 text-center">{language === 'la' ? 'ໄດ້ຮັບແລ້ວ' : language === 'th' ? 'ได้รับสินค้าแล้ว' : 'Received'}</span>
              </div>
            </div>
            
            {order.express_tracking && (
              <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-blue-800 text-sm">{language === 'la' ? 'ຈັດສົ່ງໂດຍ' : language === 'th' ? 'จัดส่งโดย' : 'Shipped via'} <strong>{order.express_company}</strong></p>
                <p className="text-blue-900 font-mono tracking-widest mt-1">{t('tracking_number')}: <span className="font-semibold">{order.express_tracking}</span></p>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="bg-white border border-gray-100 p-8 rounded-xl shadow-sm">
            <h2 className="text-sm uppercase tracking-widest text-gray-400 mb-6 border-b border-gray-100 pb-2">{language === 'la' ? 'ລາຍການສິນຄ້າ' : language === 'th' ? 'รายการสินค้า' : 'Items Ordered'}</h2>
            <div className="space-y-4">
              {order.items?.map(item => (
                <div key={item.id} className="flex justify-between items-start text-sm">
                  <div className="flex items-center text-gray-600 gap-4">
                    <span className="w-8 h-8 bg-[#FDFBF7] border border-[#E8DCC4] flex items-center justify-center text-xs text-dark rounded-md">{item.quantity}</span>
                    <Link to={`/product/${item.product_id}`} className="hover:text-[#8A9A5B] hover:underline font-medium text-dark">{item.name}</Link>
                    <span className="text-xs text-gray-400 font-mono tracking-wider">{formatId('PRD', item.product_id)}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-gray-500 font-medium">{formatCurrency((item.price_lak || item.price) * item.quantity, 'LAK')}</span>
                    {getThbPrice(item.price_lak || item.price) > 0 && <span className="text-[10px] text-gray-400">{formatCurrency(getThbPrice(item.price_lak || item.price) * item.quantity, 'THB')}</span>}
                    {getUsdPrice(item.price_lak || item.price) > 0 && <span className="text-[10px] text-gray-400">{formatCurrency(getUsdPrice(item.price_lak || item.price) * item.quantity, 'USD')}</span>}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
              <div className="flex justify-between items-start text-sm text-gray-500">
                <span>{t('subtotal')}</span>
                <div className="flex flex-col items-end">
                  <span className="text-dark font-medium">{formatCurrency(itemsSubtotal, 'LAK')}</span>
                  {itemsSubtotalThb > 0 && <span className="text-xs text-gray-400">{formatCurrency(itemsSubtotalThb, 'THB')}</span>}
                  {itemsSubtotalUsd > 0 && <span className="text-xs text-gray-400">{formatCurrency(itemsSubtotalUsd, 'USD')}</span>}
                </div>
              </div>
              <div className="flex justify-between items-start text-sm text-gray-500">
                <span>VAT (10%)</span>
                <div className="flex flex-col items-end">
                  <span className="text-dark font-medium">{formatCurrency(vatAmount, 'LAK')}</span>
                  {itemsSubtotalThb > 0 && <span className="text-xs text-gray-400">{formatCurrency(vatAmountThb, 'THB')}</span>}
                  {itemsSubtotalUsd > 0 && <span className="text-xs text-gray-400">{formatCurrency(vatAmountUsd, 'USD')}</span>}
                </div>
              </div>
              <div className="flex justify-between items-start text-sm text-gray-500">
                <div>
                  <span>{t('shipping_cost')}</span>
                  <span className="block text-[11px] text-gray-400 font-normal">
                    {(order.province || 'Luang Prabang') === 'Luang Prabang'
                      ? (language === 'la' ? '(ຫຼວງພະບາງ - ສົ່ງຟຣີ)' : language === 'th' ? '(หลวงพระบาง - ส่งฟรี)' : '(Luang Prabang - Free Delivery)')
                      : `${order.province || ''} - ${language === 'la' ? 'ເກັບປາຍທາງ' : language === 'th' ? 'เก็บปลายทาง' : 'Pay on Delivery'}`}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  {Number(order.shipping_cost) > 0 ? (
                    <>
                      <span className="text-dark font-medium">{formatCurrency(order.shipping_cost, 'LAK')}</span>
                      {itemsSubtotalThb > 0 && <span className="text-xs text-gray-400">{formatCurrency(shippingCostThb, 'THB')}</span>}
                      {itemsSubtotalUsd > 0 && <span className="text-xs text-gray-400">{formatCurrency(shippingCostUsd, 'USD')}</span>}
                    </>
                  ) : (order.province || 'Luang Prabang') === 'Luang Prabang' ? (
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
              <div className="flex justify-between items-start border-t border-gray-100 pt-4">
                <span className="uppercase tracking-widest text-gray-500 text-sm mt-1">{t('total')}</span>
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-serif text-dark font-bold">{formatCurrency(itemsSubtotal + vatAmount + Number(order.shipping_cost || 0), 'LAK')}</span>
                  {itemsSubtotalThb > 0 && <span className="text-sm font-semibold text-gray-500">{formatCurrency(itemsSubtotalThb + vatAmountThb + (Number(order.shipping_cost) > 0 ? shippingCostThb : 0), 'THB')}</span>}
                  {itemsSubtotalUsd > 0 && <span className="text-sm font-semibold text-gray-500">{formatCurrency(itemsSubtotalUsd + vatAmountUsd + (Number(order.shipping_cost) > 0 ? shippingCostUsd : 0), 'USD')}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[10px] uppercase tracking-widest text-gray-400">{t('delivery_address')}</h2>
              {!isEditingAddress && (order.status === 'pending_payment' || order.status === 'prepare') && (
                <button 
                  onClick={handleStartEdit} 
                  className="text-xs text-[#8A9A5B] hover:text-dark uppercase tracking-widest font-semibold transition-colors cursor-pointer"
                >
                  {language === 'la' ? 'ແກ້ໄຂທີ່ຢູ່' : language === 'th' ? 'แก้ไขที่อยู่' : 'Edit Address'}
                </button>
              )}
            </div>

            {isEditingAddress ? (
              <form onSubmit={handleSaveAddress} className="space-y-4">
                {addressError && <div className="text-xs bg-red-50 text-red-600 p-2 rounded">{addressError}</div>}
                
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1">{language === 'la' ? 'ຊື່ຜູ້ຮັບ' : language === 'th' ? 'ชื่อผู้รับ' : 'Recipient Name'}</label>
                  <input 
                    type="text" 
                    value={editForm.shipping_name} 
                    onChange={e => setEditForm({ ...editForm, shipping_name: e.target.value })} 
                    className="w-full border border-gray-200 p-2 text-sm rounded focus:outline-none focus:border-[#8A9A5B] text-dark" 
                    required 
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1">{language === 'la' ? 'ເບີໂທຜູ້ຮັບ' : language === 'th' ? 'เบอร์โทรศัพท์ผู้รับ' : 'Recipient Phone'}</label>
                  <input 
                    type="text" 
                    value={editForm.shipping_phone} 
                    onChange={e => setEditForm({ ...editForm, shipping_phone: e.target.value })} 
                    className="w-full border border-gray-200 p-2 text-sm rounded focus:outline-none focus:border-[#8A9A5B] text-dark" 
                    required 
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t('delivery_address')}</label>
                  <textarea 
                    rows="3"
                    value={editForm.shipping_address} 
                    onChange={e => setEditForm({ ...editForm, shipping_address: e.target.value })} 
                    className="w-full border border-gray-200 p-2 text-sm rounded focus:outline-none focus:border-[#8A9A5B] text-dark resize-none" 
                    required 
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    type="submit" 
                    disabled={updatingAddress}
                    className="flex-grow bg-[#8A9A5B] text-white py-2 px-3 text-xs uppercase tracking-wider font-semibold rounded hover:bg-dark transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {updatingAddress ? (language === 'la' ? 'ກຳລັງບັນທຶກ...' : language === 'th' ? 'กำลังบันทึก...' : 'Saving...') : (language === 'la' ? 'ບັນທຶກ' : language === 'th' ? 'บันทึก' : 'Save')}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsEditingAddress(false)}
                    className="bg-gray-100 text-gray-600 py-2 px-3 text-xs uppercase tracking-wider font-semibold rounded hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    {language === 'la' ? 'ຍົກເລີກ' : language === 'th' ? 'ยกเลิก' : 'Cancel'}
                  </button>
                </div>
              </form>
            ) : order.shipping_name ? (
              <div className="text-sm text-gray-600 leading-relaxed">
                <p className="font-medium text-dark">{order.shipping_name}</p>
                <p className="mb-2">{order.shipping_phone}</p>
                {order.province && <p className="font-medium text-dark">{order.province}</p>}
                <p className="whitespace-pre-line">{order.shipping_address}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">{language === 'la' ? 'ບໍ່ມີຂໍ້ມູນການຈັດສົ່ງ.' : language === 'th' ? 'ไม่มีรายละเอียดการจัดส่ง' : 'No delivery details provided.'}</p>
            )}
          </div>

          {order.status !== 'payment_rejected' && order.payment_screenshot && (
            <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm">
              <h2 className="text-[10px] uppercase tracking-widest text-gray-400 mb-4">{language === 'la' ? 'ຫຼັກຖານການຊຳລະເງິນ' : language === 'th' ? 'หลักฐานการชำระเงิน' : 'Payment Proof'}</h2>
              <a href={order.payment_screenshot} target="_blank" rel="noopener noreferrer" className="block border border-gray-200 rounded-lg overflow-hidden group hover:border-[#8A9A5B] transition-colors relative">
                <img src={order.payment_screenshot} alt="Payment Screenshot" className="w-full h-48 object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-semibold uppercase tracking-widest">{language === 'la' ? 'ເບິ່ງໃບບິນເຕັມ' : language === 'th' ? 'ดูใบเสร็จฉบับเต็ม' : 'View Full Receipt'}</span>
                </div>
              </a>
            </div>
          )}

          {order.status === 'payment_rejected' && (
            <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm space-y-4">
              <h2 className="text-[10px] uppercase tracking-widest text-gray-400">
                {language === 'la' ? 'ຫຼັກຖານການຊຳລະເງິນ' : language === 'th' ? 'หลักฐานการชำระเงิน' : 'Payment Proof'}
              </h2>
              
              {/* QR Code and Bank Transfer details */}
              <div className="bg-white border border-[#E8DCC4] p-5 rounded-2xl space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E8DCC4] pb-3 gap-3">
                  <h3 className="text-sm font-serif font-bold text-dark uppercase tracking-wider">
                    {language === 'la' ? 'ຊຳລະເງິນຜ່ານ BCEL One (LAO QR)' : language === 'th' ? 'ชำระเงินผ่าน BCEL One (LAO QR)' : 'Payment via BCEL One (LAO QR)'}
                  </h3>

                  <div className="flex items-center gap-1.5 bg-[#FDFBF7] p-1 border-2 border-[#8A9A5B]/30 rounded-xl">
                    {[
                      { code: 'LAK', flag: '🇱🇦', label: 'LAK (₭)' },
                      { code: 'THB', flag: '🇹🇭', label: 'THB (฿)' },
                      { code: 'USD', flag: '🇺🇸', label: 'USD ($)' }
                    ].map(cur => (
                      <button
                        key={cur.code}
                        type="button"
                        onClick={() => setActiveQrCurrency(cur.code)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold rounded-lg transition ${
                          activeQrCurrency === cur.code
                            ? 'bg-[#8A9A5B] text-white shadow-sm'
                            : 'text-gray-700 hover:bg-white'
                        }`}
                      >
                        <span>{cur.flag}</span>
                        <span>{cur.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3">
                  {/* QR Image */}
                  <div className="w-40 h-40 border border-gray-200 p-2 bg-white flex items-center justify-center shrink-0 shadow-sm rounded-lg overflow-hidden relative">
                    <img 
                      src={activeQrCurrency === 'THB' ? '/lao_thb_qr.png' : activeQrCurrency === 'USD' ? '/lao_usd_qr.png' : '/lao_lak_qr.png'} 
                      alt={`${activeQrCurrency} QR Code`} 
                      className="w-full h-full object-contain" 
                    />
                    <span className="absolute top-1 right-1 bg-[#8A9A5B] text-white text-[9px] font-bold px-1.5 py-0.2 rounded">
                      {activeQrCurrency}
                    </span>
                  </div>
                  
                  {/* Account detail */}
                  <div className="w-full space-y-1 text-center">
                    <p className="text-xs font-mono font-bold text-dark">
                      Account: {activeQrCurrency === 'LAK' ? '050-12-36219162 LAK' : activeQrCurrency === 'THB' ? '050-12-36219313 THB' : '050-12-36219461 USD'}
                    </p>
                    <p className="text-[11px] text-gray-600 font-light leading-relaxed">
                      {language === 'la' ? 'ກະລຸນາສະແກນ QR ໂຄ້ດເພື່ອຊຳລະເງິນຜ່ານແອັບທະນາຄານຂອງທ່ານ.' : language === 'th' ? 'กรุณาสแกนคิวอาร์โค้ดเพื่อชำระเงินผ่านแอปธนาคารของคุณ' : 'Please scan the QR code to make payment via your banking app.'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 pt-2">
                {order.payment_screenshot && (
                  <div className="relative border border-gray-200 rounded-lg overflow-hidden h-32 bg-gray-50 flex items-center justify-center">
                    <img src={newScreenshotPreview || order.payment_screenshot} alt="Payment Slip" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                      <span className="text-white text-[10px] uppercase tracking-wider font-semibold">
                        {newScreenshotPreview ? 'New Slip Selected' : 'Previous Rejected Slip'}
                      </span>
                    </div>
                  </div>
                )}
                
                <label className="cursor-pointer bg-[#FDFBF7] hover:bg-gray-50 border border-dashed border-gray-300 hover:border-[#8A9A5B] transition-colors p-4 rounded-xl flex flex-col items-center justify-center text-center h-24 group">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleReuploadScreenshotChange} 
                    className="hidden" 
                    disabled={uploadingNewScreenshot}
                  />
                  {uploadingNewScreenshot ? (
                    <div className="w-6 h-6 border-2 border-[#8A9A5B] border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="text-xl mb-1 group-hover:scale-110 transition-transform">📸</span>
                      <span className="text-xs text-[#8A9A5B] font-medium">
                        {language === 'la' ? 'ເລືອກສະລິບໃໝ່' : language === 'th' ? 'เลือกสลิปใหม่' : 'Select New Slip'}
                      </span>
                    </>
                  )}
                </label>

                {newScreenshotUrl && (
                  <button
                    onClick={handleSubmitNewPayment}
                    disabled={submittingNewPayment}
                    className="w-full bg-[#8A9A5B] hover:bg-dark text-white py-2 px-4 rounded-lg text-xs uppercase tracking-widest font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {submittingNewPayment 
                      ? (language === 'la' ? 'ກຳລັງຢືນຢັນ...' : language === 'th' ? 'กำลังส่ง...' : 'Submitting...')
                      : (language === 'la' ? 'ສົ່ງຫຼັກຖານໃໝ່' : language === 'th' ? 'ส่งหลักฐานใหม่' : 'Submit New Slip')
                    }
                  </button>
                )}
              </div>
            </div>
          )}

          {user && (user.role === 'owner' || user.role === 'employee') && order.status === 'pending_payment' && (
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl text-center space-y-4">
              <h2 className="text-sm font-semibold text-amber-800 uppercase tracking-widest">{language === 'la' ? 'ລໍຖ້າການກວດສອບ' : language === 'th' ? 'รอการตรวจสอบ' : 'Awaiting Verification'}</h2>
              <p className="text-xs text-amber-700">{language === 'la' ? `ກະລຸນາກວດສອບສະລິບໂອນເງິນໃຫ້ກົງກັບຍອດລວມ ${formatCurrency(order.total_price)} ໃນ BCEL One ກ່ອນອະນຸມັດ.` : language === 'th' ? `กรุณาตรวจสอบสลิปโอนเงินให้ตรงกับยอดรวม ${formatCurrency(order.total_price)} ใน BCEL One ก่อนอนุมัติ` : `Please verify the payment screenshot transfer slip matches the total of ${formatCurrency(order.total_price)} in BCEL One before approving.`}</p>
              <button 
                onClick={handleApprovePayment} 
                disabled={approving}
                className="w-full bg-[#8A9A5B] hover:bg-dark text-white py-3 uppercase tracking-widest text-xs font-medium transition-colors rounded shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {approving ? (language === 'la' ? 'ກຳລັງກວດສອບ...' : language === 'th' ? 'กำลังตรวจสอบ...' : 'Verifying...') : (language === 'la' ? 'ອະນຸມັດການຊຳລະ' : language === 'th' ? 'อนุมัติการชำระเงิน' : 'Approve Payment')}
              </button>
            </div>
          )}

          <div className="bg-[#FDFBF7] border border-[#E8DCC4] p-6 rounded-xl text-center">
            <h2 className="text-[10px] uppercase tracking-widest text-[#8A9A5B] mb-2">{language === 'la' ? 'ຕ້ອງການຄວາມຊ່ວຍເຫຼືອ?' : language === 'th' ? 'ต้องการความช่วยเหลือ?' : 'Need Help?'}</h2>
            <p className="text-xs text-gray-500 mb-4">{language === 'la' ? 'ຫາກທ່ານມີຄຳຖາມໃດໆ ກ່ຽວກັບການສັ່ງຊື້, ກະລຸນາຕິດຕໍ່ພະນັກງານຂອງພວກເຮົາ.' : language === 'th' ? 'หากคุณมีคำถามใดๆ เกี่ยวกับการสั่งซื้อนี้ กรุณาติดต่อฝ่ายบริการลูกค้าของเรา' : 'If you have any questions about this order, please contact our support team.'}</p>
            <button onClick={() => navigate('/contact')} className="text-xs text-dark hover:text-[#8A9A5B] underline uppercase tracking-widest transition-colors cursor-pointer">{language === 'la' ? 'ຕິດຕໍ່ພວກເຮົາ' : language === 'th' ? 'ติดต่อเรา' : 'Contact Us'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetail;
