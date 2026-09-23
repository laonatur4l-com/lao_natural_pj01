import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { formatCurrency, getThbPrice, getUsdPrice } from '../utils/formatters';
import { useLanguage } from '../context/LanguageContext';
import { Gift, Tag } from 'lucide-react';

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');
  const { addToCart, exchangeRates } = useCart();
  const [categories, setCategories] = useState([]);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const query = categoryFilter ? `?category=${categoryFilter}` : '';
        const res = await api.get(`/products/read.php${query}`);
        if(res.data && res.data.data) {
           setProducts(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching products", err);
        setProducts([
          { id: 1, name: 'Luang Prabang Rose Soap', price: 240000, category: 'soaps', stock: 10, image_url: '' },
          { id: 2, name: 'Wild Honey Scrub', price: 350000, category: 'scrubs', stock: 5, image_url: '' },
          { id: 3, name: 'Lemongrass Essential Oil', price: 180000, category: 'oils', stock: 15, image_url: '' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [categoryFilter]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories/read.php');
        if (res.data && res.data.data) {
          setCategories(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching categories", err);
      }
    };
    fetchCategories();
  }, []);

  const allCategoryOptions = ['All', ...categories.map(c => c.name)];

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12">
      <h1 className="text-4xl font-serif mb-8 text-center text-dark">{t('products_title')}</h1>
      
      <div className="flex justify-center flex-wrap gap-4 mb-12">
        {allCategoryOptions.map(cat => (
          <button 
            key={cat}
            onClick={() => cat === 'All' ? setSearchParams({}) : setSearchParams({category: cat})}
            className={`px-4 py-2 uppercase tracking-widest text-xs transition-colors rounded-sm cursor-pointer ${
              (categoryFilter === cat || (cat==='All' && !categoryFilter)) 
                ? 'bg-primary text-secondary' 
                : 'border border-[#E8DCC4] text-dark hover:border-primary'
            }`}
          >
            {cat === 'All' ? t('all_categories') : t(cat.toLowerCase())}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-24 text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {products.map(product => {
            const hasPromo = !!product.promotion;
            const isB1G1 = hasPromo && product.promotion.type === 'b1g1';
            const isDiscount = hasPromo && product.promotion.type === 'discount';
            const discPercent = isDiscount ? parseFloat(product.promotion.discount_percent || 0) : 0;
            const origPriceLak = Number(product.price_lak || product.price || 0);
            const finalPriceLak = discPercent > 0 ? origPriceLak * (1 - discPercent / 100) : origPriceLak;

            return (
              <div key={product.id} className="group flex flex-col">
                <Link to={`/product/${product.id}`} className="block bg-[#FDFBF7] aspect-[3/4] mb-4 relative overflow-hidden border border-[#E8DCC4]">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-light">Image</div>
                  )}

                  {/* Promotion Overlay Badges */}
                  {isB1G1 && (
                    <span className="absolute top-2 left-2 bg-purple-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1 z-10 max-w-[85%] truncate">
                      <Gift size={12} className="shrink-0" />
                      <span className="truncate">{product.promotion.title ? `${product.promotion.title} (Buy ${product.promotion.buy_qty || 1} Get ${product.promotion.get_qty || 1})` : `Buy ${product.promotion.buy_qty || 1} Get ${product.promotion.get_qty || 1}`}</span>
                    </span>
                  )}
                  {isDiscount && discPercent > 0 && (
                    <span className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1 z-10 max-w-[85%] truncate">
                      <Tag size={12} className="shrink-0" />
                      <span className="truncate">{product.promotion.title ? `${product.promotion.title} (-${discPercent}%)` : `-${discPercent}% OFF`}</span>
                    </span>
                  )}

                  {!hasPromo && product.stock < 5 && product.stock > 0 && (
                     <span className="absolute top-2 left-2 bg-red-100 text-red-800 text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Low Stock</span>
                  )}
                  {product.stock <= 0 && (
                     <span className="absolute top-2 left-2 bg-gray-200 text-gray-800 text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">{t('out_of_stock')}</span>
                  )}
                </Link>

                <h3 className="font-serif text-lg text-dark mb-0.5">{product.name}</h3>

                {/* Promotion Title Tag */}
                {hasPromo && product.promotion.title && (
                  <div className="mb-1.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                      🏷️ {product.promotion.title}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-start mt-auto pt-2">
                  <div className="flex flex-col">
                    {discPercent > 0 ? (
                      <div>
                        <span className="text-rose-600 font-bold">{formatCurrency(finalPriceLak, 'LAK')}</span>
                        <span className="text-gray-400 text-xs line-through ml-1.5">{formatCurrency(origPriceLak, 'LAK')}</span>
                      </div>
                    ) : (
                      <span className="text-dark font-medium">{formatCurrency(origPriceLak, 'LAK')}</span>
                    )}

                    <span className="text-[11px] text-gray-400 font-sans">
                      {discPercent > 0 ? formatCurrency(getThbPrice(origPriceLak) * (1 - discPercent / 100), 'THB') : formatCurrency(getThbPrice(origPriceLak), 'THB')}
                    </span>
                    <span className="text-[11px] text-gray-400 font-sans">
                      {discPercent > 0 ? formatCurrency(getUsdPrice(origPriceLak) * (1 - discPercent / 100), 'USD') : formatCurrency(getUsdPrice(origPriceLak), 'USD')}
                    </span>
                  </div>

                  <button 
                    onClick={() => addToCart(product)}
                    disabled={product.stock <= 0}
                    className="text-xs uppercase tracking-widest text-primary hover:text-dark transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {t('add_to_cart')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Products;
