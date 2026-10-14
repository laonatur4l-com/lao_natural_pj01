import { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { formatId } from '../utils/formatters';

export default function RejectPaymentModal({ isOpen, onClose, onConfirm, order, isSubmitting = false }) {
  const { language } = useLanguage();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const quickReasons = {
    en: [
      'Invalid or unrecognized transfer slip',
      'Transfer amount does not match order total',
      'Slip image is blurry or unreadable',
      'Payment not received in bank account',
      'Duplicate slip already used for another order'
    ],
    la: [
      'ສະລິບບໍ່ຖືກຕ້ອງ ຫຼື ບໍ່ພົບຂໍ້ມູນ',
      'ຍອດໂອນບໍ່ກົງກັບຍອດລວມຂອງອໍເດີ',
      'ຮູບສະລິບມົວ ບໍ່ສາມາດກວດສອບໄດ້',
      'ຍັງບໍ່ເຫັນຍອດເງິນເຂົ້າບັນຊີ',
      'ສະລິບນີ້ເຄີຍຖືກນຳໃຊ້ແລ້ວ'
    ],
    th: [
      'สลิปไม่ถูกต้อง หรือไม่พบข้อมูล',
      'ยอดโอนไม่ตรงกับยอดรวมของคำสั่งซื้อ',
      'รูปสลิปไม่ชัดเจน ตรวจสอบไม่ได้',
      'ยังไม่มียอดเงินเข้าบัญชี',
      'สลิปนี้เคยถูกใช้งานแล้ว'
    ]
  };

  const currentReasons = quickReasons[language] || quickReasons.en;

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError(
        language === 'la'
          ? 'ກະລຸນາໃສ່ ຫຼື ເລືອກເຫດຜົນໃນການປະຕິເສດ'
          : language === 'th'
          ? 'กรุณาระบุหรือเลือกเหตุผลในการปฏิเสธ'
          : 'Please select or enter a rejection reason.'
      );
      return;
    }
    onConfirm(reason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-dark">
                {language === 'la' ? 'ປະຕິເສດຫຼັກຖານການຊຳລະ' : language === 'th' ? 'ปฏิเสธหลักฐานการชำระเงิน' : 'Reject Payment Proof'}
              </h2>
              {order && (
                <p className="text-xs text-gray-400">
                  {formatId('ORD', order.id)} {order.shipping_name || order.customer_name ? `• ${order.shipping_name || order.customer_name}` : ''}
                </p>
              )}
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-dark p-1 rounded-lg hover:bg-gray-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              {language === 'la' ? 'ເລືອກເຫດຜົນດ່ວນ' : language === 'th' ? 'เลือกเหตุผลด่วน' : 'Quick Presets'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {currentReasons.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setReason(item);
                    setError('');
                  }}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border transition text-left cursor-pointer ${
                    reason === item
                      ? 'bg-red-50 border-red-300 text-red-700 font-medium'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
              {language === 'la' ? 'ລາຍລະອຽດເຫດຜົນ (ແຈ້ງໃຫ້ລູກຄ້າຊາບ)' : language === 'th' ? 'รายละเอียดเหตุผล (แจ้งให้ลูกค้าทราบ)' : 'Reason Details (Sent to Customer)'}
            </label>
            <textarea
              rows="3"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder={
                language === 'la'
                  ? 'ພິມເຫດຜົນ ຫຼື ເລືອກຈາກປຸ່ມດ່ວນຂ້າງເທິງ...'
                  : language === 'th'
                  ? 'พิมพ์เหตุผล หรือเลือกจากปุ่มด่วนด้านบน...'
                  : 'Type a reason or select a preset above...'
              }
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none"
              disabled={isSubmitting}
            />
            {error && (
              <p className="text-xs text-red-600 mt-1 font-medium">{error}</p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs uppercase tracking-wider font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
            >
              {language === 'la' ? 'ຍົກເລີກ' : language === 'th' ? 'ยกเลิก' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs uppercase tracking-wider font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{language === 'la' ? 'ກຳລັງປະຕິເສດ...' : language === 'th' ? 'กำลังปฏิเสธ...' : 'Rejecting...'}</span>
                </>
              ) : (
                <span>{language === 'la' ? 'ຢືນຢັນປະຕິເສດ' : language === 'th' ? 'ยืนยันปฏิเสธ' : 'Confirm Reject'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
