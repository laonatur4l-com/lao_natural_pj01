import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Phone, Mail, MapPin, Facebook, MessageSquare, Send, CheckCircle2, Clock, QrCode, ExternalLink, Store } from 'lucide-react';
import api from '../utils/api';

function Contact() {
  const { language } = useLanguage();
  const location = useLocation();

  // Query parameter to pre-fill order number if navigated from /order/:id
  const searchParams = new URLSearchParams(location.search);
  const initialOrderNo = searchParams.get('order') || '';

  const [form, setForm] = useState({
    name: '',
    contact: '',
    orderNo: initialOrderNo,
    subject: initialOrderNo ? `Order Inquiry #${initialOrderNo}` : '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [distributors, setDistributors] = useState([]);

  useEffect(() => {
    // Fetch partner distributors
    api.get('/distributors')
      .then(res => {
        if (res.data?.data) {
          setDistributors(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const t = {
    badge: language === 'la' ? 'ຕິດຕໍ່ຝ່າຍບໍລິການ' : language === 'th' ? 'ติดต่อฝ่ายบริการลูกค้า' : 'Customer Support & Inquiries',
    title: language === 'la' ? 'ຕິດຕໍ່ພວກເຮົາ' : language === 'th' ? 'ติดต่อเรา' : 'Get in Touch with Lao Natural',
    subtitle: language === 'la'
      ? 'ມີຄຳຖາມກ່ຽວກັບການສັ່ງຊື້, ຜະລິດຕະພັນ, ຫຼື ຕ້ອງການຊື້ຂາຍຍົກ? ທີມງານຂອງພວກເຮົາຍິນດີຊ່ວຍເຫຼືອສະເໝີ.'
      : language === 'th'
      ? 'มีคำถามเกี่ยวกับคำสั่งซื้อ สินค้า หรือสนใจเป็นตัวแทนจำหน่าย? ทีมงานเราพร้อมดูแลคุณเสมอ'
      : 'Have questions about your order, natural ingredients, or wholesale partnerships? We are here to help.',
    
    // Cards
    callUs: language === 'la' ? 'ໂທລະສັບ / WhatsApp' : language === 'th' ? 'โทรศัพท์ / WhatsApp' : 'Phone & WhatsApp',
    callDesc: language === 'la' ? 'ຈັນ - ເສົາ: 08:30 - 18:00' : language === 'th' ? 'จันทร์ - เสาร์: 08:30 - 18:00' : 'Mon - Sat: 8:30 AM - 6:00 PM',
    
    emailUs: language === 'la' ? 'ອີເມວ' : language === 'th' ? 'อีเมลฝ่ายขาย' : 'Email Support',
    emailDesc: language === 'la' ? 'ຕອບກັບພາຍໃນ 24 ຊົ່ວໂມງ' : language === 'th' ? 'ตอบกลับภายใน 24 ชม.' : 'Response within 24 hours',
    
    visitUs: language === 'la' ? 'ຮ້ານຕົ້ນແບບ / ໂຮງງານ' : language === 'th' ? 'หน้าร้าน / แหล่งผลิต' : 'Flagship Store & Workshop',
    address: 'Ban Phasouk, Luang Prabang, Laos',
    openMaps: language === 'la' ? 'ເບິ່ງໃນ Google Maps' : language === 'th' ? 'ดูใน Google Maps' : 'View on Google Maps',
    
    facebook: language === 'la' ? 'ເຟສບຸກທາງການ' : language === 'th' ? 'Facebook ทางการ' : 'Official Facebook',
    facebookDesc: language === 'la' ? 'ສົ່ງຂໍ້ຄວາມ Messenger ໄດ້ 24/7' : language === 'th' ? 'ส่งข้อความ Messenger ได้ตลอด 24 ชม.' : 'Message us on Messenger anytime',
    
    // Form
    formTitle: language === 'la' ? 'ສົ່ງຂໍ້ຄວາມຫາພວກເຮົາ' : language === 'th' ? 'ส่งข้อความถึงเรา' : 'Send Us a Message',
    formSubtitle: language === 'la' ? 'ກະລຸນາປ້ອນຂໍ້ມູນຂອງທ່ານ ຂ້າງລຸ່ມນີ້:' : language === 'th' ? 'กรอกรายละเอียดเพื่อติดต่อเจ้าหน้าที่:' : 'Fill in the form below and our team will get back to you shortly.',
    nameLabel: language === 'la' ? 'ຊື່ຂອງທ່ານ *' : language === 'th' ? 'ชื่อของคุณ *' : 'Your Name *',
    contactLabel: language === 'la' ? 'ເບີໂທ ຫຼື ອີເມວ *' : language === 'th' ? 'เบอร์โทร หรือ อีเมล *' : 'Phone or Email *',
    orderLabel: language === 'la' ? 'ເລກທີຄຳສັ່ງຊື້ (ຖ້າມີ)' : language === 'th' ? 'หมายเลขคำสั่งซื้อ (ถ้ามี)' : 'Order Number (Optional)',
    messageLabel: language === 'la' ? 'ຂໍ້ຄວາມ ຫຼື ຄຳຖາມ *' : language === 'th' ? 'ข้อความ หรือ คำถาม *' : 'Message or Question *',
    sendBtn: language === 'la' ? 'ສົ່ງຂໍ້ຄວາມ' : language === 'th' ? 'ส่งข้อความ' : 'Send Message',
    
    successTitle: language === 'la' ? 'ໄດ້ຮັບຂໍ້ຄວາມແລ້ວ!' : language === 'th' ? 'ได้รับข้อความเรียบร้อยแล้ว!' : 'Message Received!',
    successDesc: language === 'la' 
      ? 'ຂອບໃຈທີ່ຕິດຕໍ່ Lao Natural! ພະນັກງານຈະກວດສອບ ແລະ ຕິດຕໍ່ກັບທ່ານໂດຍໄວທີ່ສຸດ.'
      : language === 'th'
      ? 'ขอบคุณที่ติดต่อ Lao Natural เจ้าหน้าที่จะตรวจสอบและติดต่อกลับโดยเร็วที่สุด'
      : 'Thank you for reaching out to Lao Natural. Our customer support team will review your inquiry and reply promptly.',
    sendAnother: language === 'la' ? 'ສົ່ງຂໍ້ຄວາມໃໝ່' : language === 'th' ? 'ส่งข้อความอื่น' : 'Send Another Message',
    
    // QR Card
    qrTitle: language === 'la' ? 'ສະແກນ QR ຕິດຕໍ່ດ່ວນ' : language === 'th' ? 'สแกน QR ติดต่อด่วน' : 'Quick Connect & Verification',
    qrDesc: language === 'la' 
      ? 'ສະແກນເພື່ອໄປທີ່ Facebook ເພຈທາງການ ຫຼື ສົ່ງສະລິບໂອນເງິນ.'
      : language === 'th'
      ? 'สแกนเพื่อไปยัง Facebook ทางการ หรือสอบถามหลักฐานการโอน'
      : 'Scan to visit our verified Facebook page or verify payment transfers.',

    // Distributors
    retailTitle: language === 'la' ? 'ຈຸດວາງຈຳໜ່າຍ ແລະ ຕົວແທນ' : language === 'th' ? 'จุดจำหน่ายและตัวแทน' : 'Retail Partners & Collaborators',
    retailDesc: language === 'la' 
      ? 'ທ່ານສາມາດຊອກຊື້ຜະລິດຕະພັນ Lao Natural ໄດ້ທີ່ຈຸດຈຳໜ່າຍເຫຼົ່ານີ້:'
      : language === 'th'
      ? 'พบกับผลิตภัณฑ์ Lao Natural ได้ตามสาขาและตัวแทนจำหน่ายเหล่านี้:'
      : 'You can also find authentic Lao Natural skincare and wellness products at these partner stores:'
  };

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-12 md:py-16 text-dark font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block text-[11px] font-semibold tracking-widest uppercase text-[#8A9A5B] bg-[#8A9A5B]/10 px-3 py-1 rounded-full mb-3">
            {t.badge}
          </span>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-dark mb-4">
            {t.title}
          </h1>
          <p className="text-sm md:text-base text-gray-600 leading-relaxed font-light">
            {t.subtitle}
          </p>
        </div>

        {/* 4 Contact Channels Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          
          {/* Phone */}
          <a
            href="tel:+856309904780"
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#8A9A5B]/50 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#8A9A5B]/10 text-[#8A9A5B] flex items-center justify-center mb-4 group-hover:bg-[#8A9A5B] group-hover:text-white transition-colors">
                <Phone size={22} />
              </div>
              <h3 className="font-serif font-semibold text-lg text-dark mb-1">{t.callUs}</h3>
              <p className="text-xs text-gray-500 mb-3">{t.callDesc}</p>
            </div>
            <p className="text-sm font-semibold text-[#8A9A5B] group-hover:underline flex items-center gap-1">
              +856 30 990 4780
            </p>
          </a>

          {/* Email */}
          <a
            href="mailto:sales.laonatural@gmail.com"
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#8A9A5B]/50 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#8A9A5B]/10 text-[#8A9A5B] flex items-center justify-center mb-4 group-hover:bg-[#8A9A5B] group-hover:text-white transition-colors">
                <Mail size={22} />
              </div>
              <h3 className="font-serif font-semibold text-lg text-dark mb-1">{t.emailUs}</h3>
              <p className="text-xs text-gray-500 mb-3">{t.emailDesc}</p>
            </div>
            <p className="text-sm font-semibold text-[#8A9A5B] group-hover:underline truncate">
              sales.laonatural@gmail.com
            </p>
          </a>

          {/* Facebook */}
          <a
            href="https://www.facebook.com/share/1EZ3EiPtsY/?mibextid=wwXIfr"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#8A9A5B]/50 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Facebook size={22} />
              </div>
              <h3 className="font-serif font-semibold text-lg text-dark mb-1">{t.facebook}</h3>
              <p className="text-xs text-gray-500 mb-3">{t.facebookDesc}</p>
            </div>
            <p className="text-sm font-semibold text-blue-600 group-hover:underline flex items-center gap-1">
              facebook.com/LaoNatural <ExternalLink size={12} />
            </p>
          </a>

          {/* Location */}
          <a
            href="https://maps.app.goo.gl/Hxi1vtuxssd2XYzm8?g_st=ic"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#8A9A5B]/50 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <MapPin size={22} />
              </div>
              <h3 className="font-serif font-semibold text-lg text-dark mb-1">{t.visitUs}</h3>
              <p className="text-xs text-gray-500 mb-3">{t.address}</p>
            </div>
            <p className="text-sm font-semibold text-amber-600 group-hover:underline flex items-center gap-1">
              {t.openMaps} <ExternalLink size={12} />
            </p>
          </a>

        </div>

        {/* Form & QR Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          
          {/* Message Form (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#8A9A5B]/10 text-[#8A9A5B] flex items-center justify-center">
                <MessageSquare size={20} />
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold text-dark">{t.formTitle}</h2>
                <p className="text-xs text-gray-500">{t.formSubtitle}</p>
              </div>
            </div>

            {submitted ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-xl font-serif font-bold text-dark mb-2">{t.successTitle}</h3>
                <p className="text-sm text-gray-600 max-w-md mx-auto mb-6 leading-relaxed">
                  {t.successDesc}
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setForm({ name: '', contact: '', orderNo: '', subject: '', message: '' });
                  }}
                  className="px-6 py-2.5 bg-[#8A9A5B] text-white rounded-xl text-xs font-semibold hover:bg-[#78884d] transition-colors"
                >
                  {t.sendAnother}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1.5">
                      {t.nameLabel}
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Somchai S."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#8A9A5B] transition bg-gray-50/50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1.5">
                      {t.contactLabel}
                    </label>
                    <input
                      type="text"
                      required
                      value={form.contact}
                      onChange={e => setForm({ ...form, contact: e.target.value })}
                      placeholder="Phone (+856 / +66) or Email"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#8A9A5B] transition bg-gray-50/50 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1.5">
                    {t.orderLabel}
                  </label>
                  <input
                    type="text"
                    value={form.orderNo}
                    onChange={e => setForm({ ...form, orderNo: e.target.value })}
                    placeholder="e.g. ORD-022"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#8A9A5B] transition bg-gray-50/50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1.5">
                    {t.messageLabel}
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    placeholder="Describe your inquiry, order status, or wholesale question..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#8A9A5B] transition bg-gray-50/50 focus:bg-white resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3 bg-[#8A9A5B] text-white rounded-xl text-sm font-semibold hover:bg-[#78884d] transition-all shadow-sm hover:shadow cursor-pointer"
                  >
                    <Send size={16} />
                    {t.sendBtn}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* QR & Info Sidebar (1 col) */}
          <div className="space-y-6">
            
            {/* QR Card */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm text-center">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8A9A5B] bg-[#8A9A5B]/10 px-3 py-1 rounded-full mb-4">
                <QrCode size={14} />
                {t.qrTitle}
              </div>
              <div className="bg-[#FDFBF7] p-4 w-44 h-44 rounded-2xl mx-auto mb-4 border border-[#E8DCC4] flex items-center justify-center shadow-inner">
                <img
                  src="/lao_qr.png"
                  alt="Lao Natural QR"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
                {t.qrDesc}
              </p>
            </div>

            {/* Business Hours */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <Clock size={18} className="text-[#8A9A5B]" />
                <h4 className="font-serif font-semibold text-sm text-dark">
                  {language === 'la' ? 'ໂມງເຮັດວຽກ' : language === 'th' ? 'เวลาทำการ' : 'Operating Hours'}
                </h4>
              </div>
              <ul className="text-xs space-y-2 text-gray-600">
                <li className="flex justify-between pb-1.5 border-b border-gray-50">
                  <span>Mon – Fri</span>
                  <span className="font-medium text-dark">08:30 – 18:00 (ICT)</span>
                </li>
                <li className="flex justify-between pb-1.5 border-b border-gray-50">
                  <span>Saturday</span>
                  <span className="font-medium text-dark">09:00 – 17:00 (ICT)</span>
                </li>
                <li className="flex justify-between">
                  <span>Sunday</span>
                  <span className="text-amber-600 font-medium">Online Inquiries Open</span>
                </li>
              </ul>
            </div>

          </div>

        </div>

        {/* Partner Distributors / Retail Points */}
        {distributors && distributors.length > 0 && (
          <div className="mt-16 pt-12 border-t border-gray-200">
            <div className="text-center max-w-xl mx-auto mb-8">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8A9A5B] bg-[#8A9A5B]/10 px-3 py-1 rounded-full mb-2">
                <Store size={14} />
                {t.retailTitle}
              </div>
              <h2 className="text-2xl font-serif font-bold text-dark mb-2">
                {language === 'la' ? 'ຊອກຊື້ໄດ້ຕາມຕົວແທນໃກ້ບ້ານທ່ານ' : language === 'th' ? 'จุดจำหน่ายและพันธมิตร' : 'Where to Buy in Laos'}
              </h2>
              <p className="text-xs text-gray-500">
                {t.retailDesc}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {distributors.map((d, index) => (
                <div key={d.id || index} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4 hover:border-[#8A9A5B]/40 transition">
                  {d.image_url ? (
                    <img src={d.image_url} alt={d.name} className="w-14 h-14 rounded-xl object-cover shrink-0 border border-gray-100" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center shrink-0 border border-gray-100">
                      <Store size={22} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-dark truncate mb-1">{d.name}</h4>
                    {d.address && <p className="text-xs text-gray-500 line-clamp-2 mb-2">{d.address}</p>}
                    <div className="flex items-center gap-3 text-xs">
                      {d.phone && (
                        <a href={`tel:${d.phone}`} className="text-[#8A9A5B] hover:underline flex items-center gap-1">
                          <Phone size={12} /> {d.phone}
                        </a>
                      )}
                      {d.map_url && (
                        <a href={d.map_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-dark flex items-center gap-1">
                          <MapPin size={12} /> Map
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Contact;
