import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Phone, Mail, MapPin, Facebook, Clock, QrCode, ExternalLink, Store, MessageCircle } from 'lucide-react';
import api from '../utils/api';

function Contact() {
  const { language } = useLanguage();
  const [distributors, setDistributors] = useState([]);

  useEffect(() => {
    // Fetch partner distributors / retail points
    api.get('/distributors')
      .then(res => {
        if (res.data?.data) {
          setDistributors(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  const t = {
    badge: language === 'la' ? 'ຕິດຕໍ່ຝ່າຍບໍລິການ' : language === 'th' ? 'ช่องทางการติดต่อ' : 'Customer Support & Inquiries',
    title: language === 'la' ? 'ຕິດຕໍ່ພວກເຮົາ' : language === 'th' ? 'ติดต่อเรา' : 'Contact Lao Natural',
    subtitle: language === 'la'
      ? 'ຫາກທ່ານມີຄຳຖາມກ່ຽວກັບການສັ່ງຊື້, ສິນຄ້າ, ຫຼື ການໂອນເງິນ, ສາມາດຕິດຕໍ່ຫາພວກເຮົາໄດ້ໂດຍກົງຜ່ານຊ່ອງທາງລຸ່ມນີ້:'
      : language === 'th'
      ? 'หากมีข้อสงสัยเกี่ยวกับคำสั่งซื้อ สินค้า หรือการโอนเงิน สามารถติดต่อเราได้โดยตรงผ่านช่องทางด้านล่างนี้:'
      : 'For order tracking, product inquiries, or payment verifications, please reach out to us directly through any of our channels below:',
    
    // Cards
    callUs: language === 'la' ? 'ໂທລະສັບ / WhatsApp' : language === 'th' ? 'โทรศัพท์ / WhatsApp' : 'Phone & WhatsApp',
    callDesc: language === 'la' ? 'ໂທ ຫຼື ສົ່ງຂໍ້ຄວາມຫາພວກເຮົາໂດຍກົງ' : language === 'th' ? 'โทรหรือส่งข้อความหาเราโดยตรง' : 'Call or message us directly',
    callBtn: language === 'la' ? 'ໂທດ່ວນ' : language === 'th' ? 'โทรออก' : 'Call Now',
    
    emailUs: language === 'la' ? 'ອີເມວ' : language === 'th' ? 'อีเมลติดต่อ' : 'Email Address',
    emailDesc: language === 'la' ? 'ສຳລັບການຕິດຕໍ່ສອບຖາມທົ່ວໄປ ແລະ ຕົວແທນ' : language === 'th' ? 'สำหรับการสอบถามทั่วไปและตัวแทนจำหน่าย' : 'For inquiries & business partnerships',
    emailBtn: language === 'la' ? 'ສົ່ງອີເມວ' : language === 'th' ? 'ส่งอีเมล' : 'Send Email',
    
    facebook: language === 'la' ? 'Facebook ທາງການ' : language === 'th' ? 'Facebook ทางการ' : 'Official Facebook',
    facebookDesc: language === 'la' ? 'ຕິດຕາມຂ່າວສານ ຫຼື ສົ່ງຂໍ້ຄວາມ Messenger' : language === 'th' ? 'ส่งข้อความทาง Messenger ได้ตลอด' : 'Chat with us on Facebook Messenger',
    facebookBtn: language === 'la' ? 'ເປີດ Facebook' : language === 'th' ? 'เปิด Facebook' : 'Open Facebook',

    visitUs: language === 'la' ? 'ຮ້ານຕົ້ນແບບ / ແຫຼ່ງຜະລິດ' : language === 'th' ? 'หน้าร้าน / แหล่งผลิต' : 'Flagship Store & Workshop',
    address: 'Ban Phasouk, Luang Prabang, Laos',
    openMaps: language === 'la' ? 'ເບິ່ງໃນ Google Maps' : language === 'th' ? 'ดูแผนที่ Google Maps' : 'View on Google Maps',
    
    // QR Card
    qrTitle: language === 'la' ? 'ສະແກນ QR Code ທາງການ' : language === 'th' ? 'สแกน QR Code ทางการ' : 'Scan Official QR Code',
    qrDesc: language === 'la' 
      ? 'ສະແກນເພື່ອໄປທີ່ Facebook ເພຈທາງການຂອງ Lao Natural ເພື່ອຕິດຕໍ່ສອບຖາມ ຫຼື ສົ່ງສະລິບໂອນເງິນ.'
      : language === 'th'
      ? 'สแกนเพื่อไปยัง Facebook เพจทางการของ Lao Natural เพื่อติดต่อสอบถาม หรือส่งหลักฐานการชำระเงิน'
      : 'Scan with your camera to visit our official Lao Natural page to send messages or payment slips.',

    // Business Hours
    hoursTitle: language === 'la' ? 'ໂມງເຮັດວຽກ' : language === 'th' ? 'เวลาทำการ' : 'Business Hours',
    hoursMonFri: language === 'la' ? 'ຈັນ - ສຸກ' : language === 'th' ? 'จันทร์ - ศุกร์' : 'Mon – Fri',
    hoursSat: language === 'la' ? 'ວັນເສົາ' : language === 'th' ? 'วันเสาร์' : 'Saturday',
    hoursSun: language === 'la' ? 'ວັນອາທິດ' : language === 'th' ? 'วันอาทิตย์' : 'Sunday',
    hoursOnline: language === 'la' ? 'ຕິດຕໍ່ຜ່ານ Facebook/WhatsApp ໄດ້' : language === 'th' ? 'ติดต่อผ่าน Facebook/WhatsApp ได้' : 'Online Inquiries Open',

    // Distributors
    retailTitle: language === 'la' ? 'ຈຸດວາງຈຳໜ່າຍ ແລະ ຕົວແທນ' : language === 'th' ? 'จุดจำหน่ายและตัวแทน' : 'Retail Partners & Collaborators',
    retailDesc: language === 'la' 
      ? 'ທ່ານສາມາດຊອກຊື້ຜະລິດຕະພັນ Lao Natural ໄດ້ທີ່ຈຸດຈຳໜ່າຍເຫຼົ່ານີ້:'
      : language === 'th'
      ? 'พบกับผลิตภัณฑ์ Lao Natural ได้ตามสาขาและตัวแทนจำหน่ายเหล่านี้:'
      : 'You can also find authentic Lao Natural skincare and wellness products at these partner stores:'
  };

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-12 md:py-20 text-dark font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block text-[11px] font-semibold tracking-widest uppercase text-[#8A9A5B] bg-[#8A9A5B]/10 px-3.5 py-1.5 rounded-full mb-3">
            {t.badge}
          </span>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-dark mb-4">
            {t.title}
          </h1>
          <p className="text-sm md:text-base text-gray-600 leading-relaxed font-light">
            {t.subtitle}
          </p>
        </div>

        {/* Top 4 Direct Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          
          {/* Phone / WhatsApp */}
          <div className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between hover:border-[#8A9A5B]/40 transition-all">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-[#8A9A5B]/10 text-[#8A9A5B] flex items-center justify-center shrink-0">
                  <Phone size={26} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-xl text-dark">{t.callUs}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{t.callDesc}</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-[#8A9A5B] font-mono tracking-wide mb-4">
                +856 30 990 4780
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <a
                href="tel:+856309904780"
                className="flex-1 py-3 px-4 bg-[#8A9A5B] text-white text-center rounded-xl text-xs font-semibold hover:bg-[#78884d] transition-colors flex items-center justify-center gap-2"
              >
                <Phone size={14} /> {t.callBtn}
              </a>
              <a
                href="https://wa.me/856309904780"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-4 bg-emerald-50 text-emerald-700 text-center rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2 border border-emerald-100"
              >
                <MessageCircle size={14} /> WhatsApp
              </a>
            </div>
          </div>

          {/* Facebook */}
          <div className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between hover:border-blue-200 transition-all">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Facebook size={26} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-xl text-dark">{t.facebook}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{t.facebookDesc}</p>
                </div>
              </div>
              <p className="text-lg font-semibold text-blue-700 mb-4">
                Lao Natural Essentials
              </p>
            </div>
            <a
              href="https://www.facebook.com/share/1EZ3EiPtsY/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-blue-600 text-white text-center rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Facebook size={14} /> {t.facebookBtn} <ExternalLink size={12} />
            </a>
          </div>

          {/* Email */}
          <div className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between hover:border-[#8A9A5B]/40 transition-all">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Mail size={26} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-xl text-dark">{t.emailUs}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{t.emailDesc}</p>
                </div>
              </div>
              <p className="text-lg font-semibold text-dark break-all mb-4">
                sales.laonatural@gmail.com
              </p>
            </div>
            <a
              href="mailto:sales.laonatural@gmail.com"
              className="w-full py-3 px-4 bg-gray-900 text-white text-center rounded-xl text-xs font-semibold hover:bg-black transition-colors flex items-center justify-center gap-2"
            >
              <Mail size={14} /> {t.emailBtn}
            </a>
          </div>

          {/* Location */}
          <div className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between hover:border-amber-200 transition-all">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <MapPin size={26} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-xl text-dark">{t.visitUs}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Luang Prabang, Laos</p>
                </div>
              </div>
              <p className="text-base text-gray-700 leading-relaxed mb-4">
                {t.address}
              </p>
            </div>
            <a
              href="https://maps.app.goo.gl/Hxi1vtuxssd2XYzm8?g_st=ic"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-rose-50 text-rose-700 border border-rose-100 text-center rounded-xl text-xs font-semibold hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
            >
              <MapPin size={14} /> {t.openMaps} <ExternalLink size={12} />
            </a>
          </div>

        </div>

        {/* QR Code & Business Hours Highlights */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-10 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            
            {/* QR Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              <div className="bg-[#FDFBF7] p-4 w-44 h-44 rounded-2xl shrink-0 border border-[#E8DCC4] shadow-sm flex items-center justify-center">
                <img
                  src="/lao_qr.png"
                  alt="Lao Natural QR"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#8A9A5B] bg-[#8A9A5B]/10 px-3 py-1 rounded-full mb-2">
                  <QrCode size={13} /> {t.qrTitle}
                </span>
                <h3 className="text-lg font-serif font-bold text-dark mb-2">
                  Scan to Chat & Verify
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {t.qrDesc}
                </p>
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-2.5 mb-4 text-[#8A9A5B]">
                <Clock size={20} />
                <h4 className="font-serif font-bold text-base text-dark">
                  {t.hoursTitle}
                </h4>
              </div>
              <ul className="text-xs space-y-2.5 text-gray-600">
                <li className="flex justify-between pb-2 border-b border-gray-200/60">
                  <span className="font-medium text-gray-700">{t.hoursMonFri}</span>
                  <span className="font-bold text-dark">08:30 – 18:00 (ICT)</span>
                </li>
                <li className="flex justify-between pb-2 border-b border-gray-200/60">
                  <span className="font-medium text-gray-700">{t.hoursSat}</span>
                  <span className="font-bold text-dark">09:00 – 17:00 (ICT)</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-medium text-gray-700">{t.hoursSun}</span>
                  <span className="text-emerald-700 font-semibold">{t.hoursOnline}</span>
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* Partner Distributors / Retail Points */}
        {distributors && distributors.length > 0 && (
          <div className="pt-8 border-t border-gray-200">
            <div className="text-center max-w-xl mx-auto mb-8">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8A9A5B] bg-[#8A9A5B]/10 px-3 py-1 rounded-full mb-2">
                <Store size={14} /> {t.retailTitle}
              </span>
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
                        <a href={`tel:${d.phone}`} className="text-[#8A9A5B] hover:underline flex items-center gap-1 font-medium">
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
