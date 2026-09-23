import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Check, Gift, Tag } from 'lucide-react';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { formatCurrency, getThbPrice, getUsdPrice } from '../utils/formatters';
import { useLanguage } from '../context/LanguageContext';

function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const { addToCart, exchangeRates } = useCart();
  const { t } = useLanguage();

  useEffect(() => {
    // Reset page states and smooth scroll to top on product change
    setQuantity(1);
    setAdded(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const fetchRelated = async (categoryName, currentPrdId) => {
      try {
        const res = await api.get(`/products/read.php?category=${categoryName}`);
        let list = [];
        if (res.data && res.data.data) {
          list = res.data.data.filter(p => String(p.id) !== String(currentPrdId));
        }
        
        // If there are less than 4 related items, backfill with general products
        if (list.length < 4) {
          const allRes = await api.get('/products/read.php');
          if (allRes.data && allRes.data.data) {
            const fallbackList = allRes.data.data.filter(
              p => String(p.id) !== String(currentPrdId) && !list.some(existing => String(existing.id) === String(p.id))
            );
            list = [...list, ...fallbackList];
          }
        }
        setRelatedProducts(list.slice(0, 4));
      } catch (err) {
        console.error("Error fetching related products", err);
      }
    };

    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        const prodData = res.data?.data || res.data;
        if (prodData && typeof prodData === 'object' && !Array.isArray(prodData) && prodData.name) {
          setProduct(prodData);
          if (prodData.category) {
            fetchRelated(prodData.category, id);
          } else {
            fetchRelated('', id);
          }
        } else {
          throw new Error("Invalid product data");
        }
      } catch (err) {
        console.error("Error fetching product", err);
        const mockProduct = {
          id,
          name: 'Luang Prabang Rose Soap', 
          description: 'A luxurious handcrafted soap infused with organic Rose Otto essential oil and wild honey sourced from the mountains of Luang Prabang.',
          category: 'soaps',
          price: 24.00,
          stock: 10,
          size: '150g',
          ingredients: 'Saponified Coconut Oil, Palm Oil, Olive Oil, Wild Mountain Honey, Rose Otto Essential Oil, Rose Petals.',
          image_url: ''
        };
        setProduct(mockProduct);
        fetchRelated(mockProduct.category, id);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if(product) {
      const origPriceLak = Number(product.price_lak || product.price || 0);
      const cartProduct = {
        ...product,
        price: origPriceLak,
        price_lak: origPriceLak,
        price_thb: Number(product.price_thb || 0),
        price_usd: Number(product.price_usd || 0),
        stock: parseInt(product.stock),
        selectedSize: product.size,
        promotion: product.promotion || null
      };
      addToCart(cartProduct, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  if (loading) return <div className="text-center py-24 text-gray-500">Loading...</div>;
  if (!product) return <div className="text-center py-24 text-red-500">Product not found.</div>;

  const currentStock = parseInt(product.stock);
  const hasPromo = !!product.promotion && product.promotion.status === 'active';
  const isB1G1 = hasPromo && product.promotion.type === 'b1g1';
  const isDiscount = hasPromo && product.promotion.type === 'discount';
  const discPercent = isDiscount ? parseFloat(product.promotion.discount_percent || 0) : 0;
  const origPriceLak = Number(product.price_lak || product.price || 0);
  const discPriceLak = discPercent > 0 ? origPriceLak * (1 - discPercent / 100) : origPriceLak;
  const promoStock = hasPromo ? parseInt(product.promotion.promo_stock || 0) : 0;

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12">
      <Link to="/products" className="inline-flex items-center text-sm text-gray-500 hover:text-dark transition-colors mb-8">
        <ArrowLeft size={16} className="mr-2" /> {t('back_products')}
      </Link>
      
      <div className="flex flex-col md:flex-row gap-12">
        {/* Product Image */}
        <div className="md:w-1/2">
          <div className="bg-[#FDFBF7] aspect-[4/5] relative border border-[#E8DCC4] flex items-center justify-center overflow-hidden">
            {product.image_url ? (
               <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
               <span className="text-gray-400 font-serif text-xl tracking-widest uppercase">Lao Natural</span>
            )}

            {/* Overlay Badges */}
            {isB1G1 && (
              <span className="absolute top-4 left-4 bg-purple-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1.5 z-10">
                <Gift size={14} /> {product.promotion.title ? `${product.promotion.title} (Buy ${product.promotion.buy_qty || 1} Get ${product.promotion.get_qty || 1})` : `Buy ${product.promotion.buy_qty || 1} Get ${product.promotion.get_qty || 1} Free`}
              </span>
            )}
            {isDiscount && discPercent > 0 && (
              <span className="absolute top-4 left-4 bg-rose-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1.5 z-10">
                <Tag size={14} /> {product.promotion.title ? `${product.promotion.title} (-${discPercent}%)` : `-${discPercent}% OFF`}
              </span>
            )}

            {currentStock <= 0 && (
               <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                 <span className="bg-dark text-white px-6 py-2 tracking-widest uppercase text-sm">{t('out_of_stock')}</span>
               </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="md:w-1/2 flex flex-col pt-4">
          {/* Promotion Title Banner */}
          {hasPromo && (
            <div className="mb-3 inline-flex items-center gap-2 bg-gradient-to-r from-rose-600 to-amber-600 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-md w-fit">
              {isB1G1 ? <Gift size={14} /> : <Tag size={14} />}
              <span>{product.promotion.title ? product.promotion.title : (isB1G1 ? `Buy ${product.promotion.buy_qty || 1} Get ${product.promotion.get_qty || 1} Free` : `-${discPercent}% OFF Promotion`)}</span>
              {isDiscount && discPercent > 0 && <span className="bg-white/25 px-2 py-0.5 rounded-full font-black">-{discPercent}% OFF</span>}
              {isB1G1 && <span className="bg-white/25 px-2 py-0.5 rounded-full font-black">BUY {product.promotion.buy_qty || 1} GET {product.promotion.get_qty || 1} FREE</span>}
            </div>
          )}

          <div className="flex items-center gap-2 mb-2">
            <span className="text-primary uppercase tracking-widest text-xs font-semibold">
              {product.category ? t(product.category.toLowerCase()) : ''}
            </span>
          </div>

          <h1 className="text-4xl font-serif mb-4 text-dark">{product.name}</h1>
          
          {/* Price */}
          <div className="mb-6 flex flex-col gap-1">
            {discPercent > 0 ? (
              <div>
                <p className="text-3xl font-bold text-rose-600">
                  {formatCurrency(discPriceLak, 'LAK')}
                  <span className="text-lg text-gray-400 font-normal line-through ml-3">{formatCurrency(origPriceLak, 'LAK')}</span>
                </p>
                <p className="text-sm font-sans text-gray-400 mt-1">
                  {formatCurrency(getThbPrice(origPriceLak) * (1 - discPercent / 100), 'THB')} <span className="line-through text-xs ml-1">{formatCurrency(getThbPrice(origPriceLak), 'THB')}</span>
                </p>
                <p className="text-sm font-sans text-gray-400">
                  {formatCurrency(getUsdPrice(origPriceLak) * (1 - discPercent / 100), 'USD')} <span className="line-through text-xs ml-1">{formatCurrency(getUsdPrice(origPriceLak), 'USD')}</span>
                </p>
              </div>
            ) : (
              <div>
                <p className="text-2xl font-light text-[#8A9A5B]">
                  {formatCurrency(origPriceLak, 'LAK')}
                </p>
                <p className="text-sm font-sans text-gray-400">
                  {formatCurrency(getThbPrice(origPriceLak), 'THB')}
                </p>
                <p className="text-sm font-sans text-gray-400">
                  {formatCurrency(getUsdPrice(origPriceLak), 'USD')}
                </p>
              </div>
            )}
          </div>
          
          <div className="prose prose-sm text-gray-600 mb-8 font-light leading-relaxed">
            <p>{product.description}</p>
          </div>

          {/* Size display */}
          {product.size && (
            <div className="mb-8 border-t border-b border-[#E8DCC4] border-opacity-50 py-6">
              <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-3 font-semibold">{t('select_size')}</h3>
              <div className="inline-block px-4 py-2.5 border rounded-lg text-xs tracking-wider uppercase font-semibold border-[#8A9A5B] bg-[#FDFBF7] text-[#8A9A5B] ring-1 ring-[#8A9A5B]">
                {product.size}
              </div>
            </div>
          )}

          <div className="mb-8">
            <h3 className="text-sm font-medium text-dark uppercase tracking-wide mb-2">{t('description_tab')}</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              {product.ingredients && <li><span className="font-medium text-dark block mb-1">{t('ingredients_tab')}:</span> {product.ingredients}</li>}
              
              {hasPromo && (
                <li className="bg-amber-50 border border-amber-100 p-3 rounded-xl">
                  <span className="font-bold text-amber-900 block mb-0.5">Promotion Stock Limit:</span>
                  <span className="text-xs text-amber-800">
                    {promoStock > 0 ? `${Math.min(promoStock, currentStock)} units allocated for promo deal` : 'Promotion deal active'} ({currentStock} total items in stock)
                  </span>
                </li>
              )}

              <li>
                <span className="font-medium text-dark w-24 inline-block">Stock:</span>
                <span className={currentStock > 0 ? 'text-emerald-600' : 'text-red-500'}>
                  {currentStock > 0 ? `${currentStock} available` : t('out_of_stock')}
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-auto border-t border-[#E8DCC4] pt-8 flex items-end gap-4">
            <div className="w-24">
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">{t('quantity')}</label>
              <div className="flex border border-[#E8DCC4] h-12">
                <button 
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 flex items-center justify-center text-dark hover:bg-[#FDFBF7] border-r border-[#E8DCC4] cursor-pointer"
                  disabled={currentStock <= 0}
                >-</button>
                <input 
                  type="number"
                  min="1"
                  max={currentStock}
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (isNaN(val) || val < 1) {
                      setQuantity('');
                    } else if (val > currentStock) {
                      setQuantity(currentStock);
                    } else {
                      setQuantity(val);
                    }
                  }}
                  onBlur={() => {
                    if (quantity === '' || quantity < 1) setQuantity(1);
                  }}
                  className="w-12 text-center text-sm font-medium focus:outline-none bg-white text-dark"
                  disabled={currentStock <= 0}
                />
                <button 
                  type="button"
                  onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                  className="w-8 flex items-center justify-center text-dark hover:bg-[#FDFBF7] border-l border-[#E8DCC4] cursor-pointer"
                  disabled={currentStock <= 0 || quantity >= currentStock}
                >+</button>
              </div>
              {quantity >= currentStock && currentStock > 0 && (
                <p className="text-[10px] text-red-500 uppercase tracking-widest mt-1">Only {product.stock} available</p>
              )}
            </div>

            {isB1G1 && (
              <div className="w-full mb-3 p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900">
                <span className="font-bold block mb-0.5">🎁 Buy {product.promotion.buy_qty || 1} Get {product.promotion.get_qty || 1} Free Special:</span>
                Adding <span className="font-extrabold text-purple-950">{quantity || 1}</span> items to cart will automatically add <span className="font-extrabold text-purple-950">{Math.floor((quantity || 1) / (product.promotion.buy_qty || 1)) * (product.promotion.get_qty || 1)}</span> FREE item(s) to your cart!
              </div>
            )}
            
            <button 
              onClick={handleAddToCart}
              disabled={currentStock <= 0 || added}
              className={`flex-grow h-12 flex items-center justify-center uppercase tracking-widest text-sm transition-colors cursor-pointer ${
                added 
                 ? 'bg-primary text-secondary'
                 : 'bg-dark text-white hover:bg-black disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed'
              }`}
            >
              {added ? (
                <><Check size={18} className="mr-2" /> Added</>
              ) : currentStock <= 0 ? t('out_of_stock') : t('add_to_cart')}
            </button>
          </div>

          
        </div>
      </div>

      {/* "You May Also Like" / Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="mt-24 pt-16 border-t border-[#E8DCC4] border-opacity-50">
          <div className="text-center mb-12">
            <span className="text-xs uppercase tracking-[0.2em] text-[#8A9A5B] font-semibold block mb-2">Curated for you</span>
            <h2 className="text-3xl font-serif text-dark">You May Also Like</h2>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((item) => (
              <Link 
                key={item.id} 
                to={`/product/${item.id}`} 
                className="group flex flex-col bg-white border border-[#E8DCC4] border-opacity-40 rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/20 transition-all duration-300"
              >
                {/* Image Container */}
                <div className="aspect-[4/5] bg-[#FDFBF7] relative overflow-hidden flex items-center justify-center border-b border-[#E8DCC4] border-opacity-30">
                  {item.image_url ? (
                    <img 
                      src={item.image_url} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                  ) : (
                    <span className="text-gray-300 font-serif text-xs tracking-widest uppercase group-hover:scale-105 transition-transform duration-700">Lao Natural</span>
                  )}
                  
                  {/* Category Badge */}
                  <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-semibold text-[#8A9A5B] uppercase tracking-wider shadow-sm">
                    {item.category}
                  </div>

                  {/* Out of Stock Overlay */}
                  {parseInt(item.stock) <= 0 && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <span className="bg-dark text-white px-4 py-1.5 tracking-widest uppercase text-[10px] font-semibold">Sold Out</span>
                    </div>
                  )}
                </div>

                {/* Content Container */}
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-serif text-base text-dark group-hover:text-[#8A9A5B] transition-colors line-clamp-1 mb-1">
                    {item.name}
                  </h3>
                  <p className="text-xs text-gray-400 font-light line-clamp-2 mb-4 flex-grow">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                    <span className="text-xs text-gray-400 font-medium">{item.size || '100g'}</span>
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-semibold text-[#8A9A5B]">{formatCurrency(parseFloat(item.price_lak || item.price), 'LAK')}</span>
                      {getThbPrice(item.price_lak || item.price) > 0 && <span className="text-[10px] text-gray-400 font-sans">{formatCurrency(getThbPrice(item.price_lak || item.price), 'THB')}</span>}
                      {getUsdPrice(item.price_lak || item.price) > 0 && <span className="text-[10px] text-gray-400 font-sans">{formatCurrency(getUsdPrice(item.price_lak || item.price), 'USD')}</span>}
                    </div>
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

export default ProductDetail;
