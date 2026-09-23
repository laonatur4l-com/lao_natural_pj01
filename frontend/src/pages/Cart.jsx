import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatters';
import { useLanguage } from '../context/LanguageContext';

function Cart() {
  const { cartItems, removeFromCart, updateQuantity, total, totalThb, totalUsd, count, getItemSubtotal, exchangeRates, refreshExchangeRates } = useCart();
  const { t, language } = useLanguage();

  useEffect(() => {
    if (refreshExchangeRates) refreshExchangeRates();
  }, []);

  if (count === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center min-h-[50vh] flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-[#FDFBF7] rounded-full flex items-center justify-center text-primary mb-6">
          <ShoppingBag size={32} />
        </div>
        <h1 className="text-3xl font-serif mb-4 text-dark uppercase tracking-widest">{t('cart_empty')}</h1>
        <p className="text-gray-500 mb-8 font-light">Bring the essence of nature to your skin.</p>
        <Link to="/products" className="bg-dark text-white px-8 py-3 uppercase tracking-widest text-sm hover:bg-black transition-colors cursor-pointer">
          {t('continue_shopping')}
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12 min-h-[60vh]">
      <h1 className="text-3xl font-serif mb-12 text-dark text-center uppercase tracking-widest">{t('cart_title')}</h1>

      <div className="flex flex-col lg:flex-row gap-12">
        <div className="lg:w-2/3">
          <div className="hidden md:grid grid-cols-12 gap-4 border-b border-[#E8DCC4] pb-4 mb-6 text-xs uppercase tracking-widest text-gray-500">
            <div className="col-span-6">{t('item')}</div>
            <div className="col-span-2 text-center">{t('price')}</div>
            <div className="col-span-2 text-center">{t('qty')}</div>
            <div className="col-span-2 text-right">{t('total')}</div>
          </div>

          <div className="space-y-6">
            {cartItems.map(item => {
              const sub = getItemSubtotal(item);
              const origLak = Number(item.price_lak || item.price || 0);

              return (
                <div key={`${item.id}-${item.selectedSize || ''}`} className="flex flex-col md:grid md:grid-cols-12 gap-4 items-center border-b border-[#E8DCC4] border-opacity-50 pb-6 relative">

                  {/* Mobile absolute delete */}
                  <button
                    onClick={() => removeFromCart(item.id, item.selectedSize)}
                    className="md:hidden absolute top-0 right-0 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={18} />
                  </button>

                  <div className="col-span-6 flex items-center w-full md:w-auto">
                    <div className="w-24 h-24 bg-[#FDFBF7] flex-shrink-0 cursor-pointer flex items-center justify-center border border-[#E8DCC4]">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-300 text-xs text-center p-2">Image</span>
                      )}
                    </div>
                    <div className="ml-4">
                      <Link to={`/product/${item.id}`} className="font-serif text-lg text-dark hover:text-primary transition-colors">
                        {item.name}
                      </Link>
                      <div className="text-xs text-gray-500 uppercase mt-1">{item.selectedSize || item.size || 'Standard'}</div>

                      {/* Promotion Badges in Cart */}
                      {sub.isB1G1 && (
                        <div className="mt-1.5 space-y-1">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            sub.freeQty > 0 ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-amber-100 text-amber-900 border border-amber-200'
                          }`}>
                            🎁 Buy {sub.buyQty || 1} Get {sub.getQty || 1} Free: {sub.freeQty > 0 ? `(${sub.freeQty} Free Item${sub.freeQty > 1 ? 's' : ''} Applied!)` : `(Add ${sub.itemsNeededForNextFree} more to get ${sub.getQty || 1} FREE!)`}
                          </span>

                          {sub.itemsNeededForNextFree > 0 && (item.quantity + sub.itemsNeededForNextFree) <= item.stock && (
                            <button
                              onClick={() => updateQuantity(item.id, item.selectedSize, item.quantity + sub.itemsNeededForNextFree)}
                              className="block text-[11px] font-bold text-purple-700 hover:text-purple-900 underline cursor-pointer"
                            >
                              + Click to add {sub.itemsNeededForNextFree} more item to get 1 FREE!
                            </button>
                          )}
                        </div>
                      )}
                      {sub.hasDiscount && !sub.isB1G1 && (
                        <span className="inline-block text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md mt-1">
                          -{sub.discountPercent}% OFF Promo Applied
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Unit Price */}
                  <div className="col-span-2 text-center w-full md:w-auto mt-4 md:mt-0 flex justify-between md:block">
                    <span className="md:hidden text-xs uppercase text-gray-400">Price</span>
                    <div className="flex flex-col items-center">
                      {sub.hasDiscount && !sub.isB1G1 ? (
                        <div>
                          <span className="text-rose-600 font-bold">{formatCurrency(sub.unitPriceLak, 'LAK')}</span>
                          <span className="text-gray-400 text-[10px] line-through block">{formatCurrency(origLak, 'LAK')}</span>
                        </div>
                      ) : (
                        <span className="text-dark font-medium">{formatCurrency(origLak, 'LAK')}</span>
                      )}

                      {sub.unitPriceThb > 0 && <span className="text-[10px] text-gray-400">{formatCurrency(sub.unitPriceThb, 'THB')}</span>}
                      {sub.unitPriceUsd > 0 && <span className="text-[10px] text-gray-400">{formatCurrency(sub.unitPriceUsd, 'USD')}</span>}
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="col-span-2 text-center w-full md:w-auto flex justify-between md:block items-center">
                    <span className="md:hidden text-xs uppercase text-gray-400">Quantity</span>
                    <div className="flex flex-col items-center">
                      <div className="flex border border-[#E8DCC4] h-10 w-fit mx-auto md:mx-0">
                        <button
                          onClick={() => updateQuantity(item.id, item.selectedSize, Math.max(1, item.quantity - 1))}
                          className="px-2 text-dark hover:bg-[#FDFBF7]"
                        >-</button>
                        <input
                          type="number"
                          min="1"
                          max={item.stock}
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) {
                              updateQuantity(item.id, item.selectedSize, Math.min(item.stock, Math.max(1, val)));
                            }
                          }}
                          className="w-8 text-center text-sm focus:outline-none bg-transparent"
                        />
                        <button
                          onClick={() => updateQuantity(item.id, item.selectedSize, Math.min(item.stock, item.quantity + 1))}
                          className="px-2 text-dark hover:bg-[#FDFBF7]"
                          disabled={item.quantity >= item.stock}
                        >+</button>
                      </div>

                      {sub.isB1G1 && sub.freeQty > 0 && (
                        <span className="text-[10px] text-purple-700 font-bold mt-1 block">
                          ({sub.payableQty} Paid + {sub.freeQty} Free)
                        </span>
                      )}

                      {item.quantity >= item.stock && (
                        <p className="text-[10px] text-red-500 uppercase tracking-widest mt-1">Stock Limit</p>
                      )}
                    </div>
                  </div>

                  {/* Line Total */}
                  <div className="col-span-2 text-right flex items-center justify-between md:justify-end w-full md:w-auto">
                    <span className="md:hidden text-xs uppercase text-gray-400">Total</span>
                    <div className="flex items-center">
                      <div className="flex flex-col items-end mr-4">
                        <span className="text-dark font-bold">{formatCurrency(sub.lak, 'LAK')}</span>
                        
                        {sub.savingsLak > 0 && (
                          <>
                            <span className="text-gray-400 text-[10px] line-through block">{formatCurrency(sub.fullPriceLak, 'LAK')}</span>
                            <span className="text-emerald-700 text-[10px] font-bold block">
                              Saved {formatCurrency(sub.savingsLak, 'LAK')} ({sub.freeQty} Free)
                            </span>
                          </>
                        )}

                        {sub.thb > 0 && <span className="text-[10px] text-gray-400">{formatCurrency(sub.thb, 'THB')}</span>}
                        {sub.usd > 0 && <span className="text-[10px] text-gray-400">{formatCurrency(sub.usd, 'USD')}</span>}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id, item.selectedSize)}
                        className="hidden md:block text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:w-1/3">
          <div className="bg-[#FDFBF7] p-8 border border-[#E8DCC4] sticky top-24">
            <h2 className="text-xl font-serif mb-6 text-dark border-b border-[#E8DCC4] pb-4">{t('order_summary')}</h2>

            <div className="space-y-4 text-sm mb-6">
              <div className="flex justify-between text-gray-600 items-start">
                <span>{t('subtotal')} ({count} items)</span>
                <div className="flex flex-col items-end">
                  <span className="text-dark font-medium">{formatCurrency(total, 'LAK')}</span>
                  {totalThb > 0 && <span className="text-xs text-gray-400">{formatCurrency(totalThb, 'THB')}</span>}
                  {totalUsd > 0 && <span className="text-xs text-gray-400">{formatCurrency(totalUsd, 'USD')}</span>}
                </div>
              </div>
              <div className="flex justify-between text-gray-600 items-start">
                <span>VAT (10%)</span>
                <div className="flex flex-col items-end">
                  <span className="text-dark font-medium">{formatCurrency(total * 0.1, 'LAK')}</span>
                  {totalThb > 0 && <span className="text-xs text-gray-400">{formatCurrency(totalThb * 0.1, 'THB')}</span>}
                  {totalUsd > 0 && <span className="text-xs text-gray-400">{formatCurrency(totalUsd * 0.1, 'USD')}</span>}
                </div>
              </div>
              <div className="flex justify-between text-gray-600 items-start text-sm">
                <span>{t('shipping_cost')}</span>
                <span className="text-right text-xs text-gray-500 max-w-[200px]">
                  {language === 'la' ? 'ສົ່ງຟຣີ (ຫຼວງພະບາງ)/ເກັບປາຍທາງ (ຕ່າງແຂວງ)' : language === 'th' ? 'ส่งฟรี (หลวงพระบาง) / เก็บปลายทาง (ต่างจังหวัด)' : 'Free (Luang Prabang) / Pay on delivery (Other Provinces)'}
                </span>
              </div>
            </div>

            <div className="border-t border-[#E8DCC4] pt-6 mb-8">
              <div className="flex justify-between items-start">
                <span className="text-dark font-medium uppercase tracking-widest text-sm mt-1">{t('total')}</span>
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-serif text-dark">{formatCurrency(total + total * 0.1, 'LAK')}</span>
                  {totalThb > 0 && <span className="text-xs text-gray-400">{formatCurrency(totalThb + totalThb * 0.1, 'THB')}</span>}
                  {totalUsd > 0 && <span className="text-xs text-gray-400">{formatCurrency(totalUsd + totalUsd * 0.1, 'USD')}</span>}
                </div>
              </div>
            </div>

            <Link
              to="/checkout"
              className="w-full h-12 flex items-center justify-center bg-dark text-white uppercase tracking-widest text-sm hover:bg-black transition-colors cursor-pointer"
            >
              {t('proceed_checkout')} <ArrowRight size={16} className="ml-2" />
            </Link>

            <Link to="/products" className="block text-center text-sm text-primary uppercase tracking-widest mt-6 hover:text-dark transition-colors cursor-pointer">
              {t('continue_shopping')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;
