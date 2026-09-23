import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency, getThbPrice, getUsdPrice } from '../utils/formatters';
import { useLanguage } from '../context/LanguageContext';
import { MapPin, Facebook, Globe, Phone } from 'lucide-react';

function Home() {
  const [popularProducts, setPopularProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const [banners, setBanners] = useState([
    'https://images.unsplash.com/photo-1608248593842-8d765507ec2a?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&q=80'
  ]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [sliderInterval, setSliderInterval] = useState(2000);

  const ingredientList = [
    { name: 'Frangipani', key: 'ing_frangipani' },
    { name: 'Wild Honey', key: 'ing_honey' },
    { name: 'Lemongrass', key: 'ing_lemongrass' },
    { name: 'Coconut', key: 'ing_coconut' },
    { name: 'Rice', key: 'ing_rice' },
    { name: 'Coffee', key: 'ing_coffee' },
    { name: 'Peppermint', key: 'ing_peppermint' },
    { name: 'Turmeric', key: 'ing_turmeric' }
  ];

  const [clientLogos, setClientLogos] = useState([]);
  const [distributors, setDistributors] = useState([]);

  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const res = await api.get('/products/read_popular.php');
        if (res.data?.data) {
          setPopularProducts(res.data.data.slice(0, 4)); // Get top 4 for landing layout
        }
      } catch (err) {
        console.error("Failed to fetch popular products", err);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchBanners = async () => {
      try {
        const res = await api.get('/banners/read.php?type=hero');
        if (res.data?.data && res.data.data.length > 0) {
          setBanners(res.data.data.map(b => b.image_url));
        }
      } catch (err) {
        console.error("Failed to load hero banners", err);
      }
    };

    const fetchClientLogos = async () => {
      try {
        const res = await api.get('/banners/read.php?type=client');
        if (res.data?.data && res.data.data.length > 0) {
          setClientLogos(res.data.data.map(b => ({ src: b.image_url, name: 'Client' })));
        }
      } catch (err) {
        console.error("Failed to load client logos", err);
      }
    };

    const fetchDistributors = async () => {
      try {
        const res = await api.get('/distributors/read.php');
        if (res.data?.data) {
          setDistributors(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load collaborators", err);
      }
    };

    // Load slider interval from localStorage
    const savedInterval = localStorage.getItem('slider_interval');
    if (savedInterval) {
      const ms = parseInt(savedInterval, 10);
      if (!isNaN(ms) && ms > 0) {
        setSliderInterval(ms);
      }
    }

    fetchPopular();
    fetchBanners();
    fetchClientLogos();
    fetchDistributors();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % banners.length);
    }, sliderInterval); // Transitions dynamically based on settings
    return () => clearInterval(interval);
  }, [banners, sliderInterval]);

  useEffect(() => {
    if (window.location.hash === '#story') {
      const timer = setTimeout(() => {
        const el = document.getElementById('story');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300); // Ensures DOM is painted before scrolling
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="w-full">
      {/* Full-Width Slider Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center bg-gray-100 overflow-hidden">
        {/* Absolute Slider Images with smooth cross-fade */}
        {banners.map((url, idx) => (
          <div 
            key={idx}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
              idx === currentBannerIndex ? 'opacity-100 z-0' : 'opacity-0 z-0'
            }`}
            style={{ backgroundImage: `url('${url}')` }}
          />
        ))}
        
        {/* Transparent legible front overlay backdrop */}
        <div className="absolute inset-0 bg-black/15 z-10"></div>
        
        {/* Fixed Overlay Typography */}
        <div className="relative z-20 text-center px-6 md:px-12 animate-fade-in py-12 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl text-white font-serif mb-6 tracking-wide leading-tight drop-shadow-md">
            {t('hero_title').includes(',') ? (
              <>
                {t('hero_title').split(',')[0]}, <br /> {t('hero_title').split(',')[1]}
              </>
            ) : t('hero_title')}
          </h1>
          <p className="text-base md:text-lg text-white/95 mb-10 font-light max-w-2xl mx-auto drop-shadow-sm leading-relaxed">
            {t('hero_desc')}
          </p>
          <Link to="/products" className="inline-block bg-[#8A9A5B] text-white px-10 py-4 uppercase tracking-widest text-xs font-bold hover:bg-[#78884c] transition-all duration-300 shadow-lg rounded-sm">
            {t('hero_button')}
          </Link>
        </div>
      </section>

      {/* Popular Products */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-serif text-dark mb-2">{t('popular_title')}</h2>
              <p className="text-gray-400 text-sm font-light">{t('popular_subtitle')}</p>
            </div>
            <Link to="/products" className="text-sm uppercase tracking-widest text-[#8A9A5B] hover:text-dark transition border-b border-transparent hover:border-dark pb-1">{t('view_all')}</Link>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#8A9A5B] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : popularProducts.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No products available</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {popularProducts.map(product => {
                const hasPromo = !!product.promotion;
                const isB1G1 = hasPromo && product.promotion.type === 'b1g1';
                const isDiscount = hasPromo && product.promotion.type === 'discount';
                const discPercent = isDiscount ? parseFloat(product.promotion.discount_percent || 0) : 0;
                const origLak = Number(product.price_lak || product.price || 0);
                const finalLak = discPercent > 0 ? origLak * (1 - discPercent / 100) : origLak;

                return (
                  <Link to={`/product/${product.id}`} key={product.id} className="group overflow-hidden flex flex-col h-full bg-[#FDFBF7] border border-[#E8DCC4]/30 hover:border-[#8A9A5B]/30 hover:shadow-sm transition-all duration-300 relative">
                    <div className="bg-[#fcfbf9] aspect-square relative overflow-hidden border-b border-gray-100 flex items-center justify-center p-4">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name} 
                          className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-500" 
                        />
                      ) : (
                        <div className="text-gray-300 text-xs font-serif uppercase tracking-widest">Natural Care</div>
                      )}

                      {/* Promo Overlay Badge */}
                      {hasPromo && (
                        <div className="absolute top-2 left-2 bg-rose-600 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shadow-md truncate max-w-[70%]">
                          {product.promotion.title || (isB1G1 ? 'B1G1' : `-${discPercent}%`)}
                        </div>
                      )}

                      <div className="absolute top-2 right-2 bg-[#8A9A5B]/10 text-[#556B2F] text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full">
                        Best Seller
                      </div>
                    </div>
                    
                    <div className="p-5 flex-1 flex flex-col">
                      <span className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">{product.category}</span>
                      <h3 className="font-serif text-base text-dark mb-1 group-hover:text-[#8A9A5B] transition-colors">{product.name}</h3>

                      {hasPromo && product.promotion.title && (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded w-fit mb-2">
                          🏷️ {product.promotion.title}
                        </span>
                      )}

                      <p className="text-xs text-gray-500 mb-4 font-light flex-1 line-clamp-2">{product.description}</p>
                      <div className="flex justify-between items-center mt-auto pt-2 border-t border-[#E8DCC4]/20">
                        <span className="text-xs text-gray-400 font-mono">{product.size}</span>
                        <div className="flex flex-col items-end">
                          {discPercent > 0 ? (
                            <div>
                              <span className="text-sm font-bold text-rose-600">{formatCurrency(finalLak, 'LAK')}</span>
                              <span className="text-[10px] text-gray-400 line-through ml-1">{formatCurrency(origLak, 'LAK')}</span>
                            </div>
                          ) : (
                            <span className="text-sm font-semibold text-dark">{formatCurrency(origLak, 'LAK')}</span>
                          )}
                          {origLak > 0 && <span className="text-[10px] text-gray-400 font-sans">{formatCurrency(getThbPrice(origLak), 'THB')}</span>}
                          {origLak > 0 && <span className="text-[10px] text-gray-400 font-sans">{formatCurrency(getUsdPrice(origLak), 'USD')}</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Our Story */}
      <section id="story" className="py-24 bg-[#F5F2EA] text-dark border-t border-b border-[#E8DCC4] border-opacity-40">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif mb-6 text-primary uppercase tracking-widest">{t('story_title')}</h2>
            <div className="w-16 h-px bg-primary mx-auto mb-6"></div>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto font-light leading-relaxed">
              {t('story_subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Mission 1 */}
            <div className="bg-white p-8 border border-[#E8DCC4] border-opacity-40 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#8A9A5B]/10 flex items-center justify-center text-[#8A9A5B] mb-6 font-serif text-lg font-bold">1</div>
              <h3 className="font-serif text-xl text-dark mb-4 tracking-wide">{t('mission1_title')}</h3>
              <p className="text-sm text-gray-600 font-light leading-relaxed">
                {t('mission1_desc')}
              </p>
            </div>

            {/* Mission 2 */}
            <div className="bg-white p-8 border border-[#E8DCC4] border-opacity-40 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#8A9A5B]/10 flex items-center justify-center text-[#8A9A5B] mb-6 font-serif text-lg font-bold">2</div>
              <h3 className="font-serif text-xl text-dark mb-4 tracking-wide">{t('mission2_title')}</h3>
              <p className="text-sm text-gray-600 font-light leading-relaxed">
                {t('mission2_desc')}
              </p>
            </div>

            {/* Mission 3 */}
            <div className="bg-white p-8 border border-[#E8DCC4] border-opacity-40 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#8A9A5B]/10 flex items-center justify-center text-[#8A9A5B] mb-6 font-serif text-lg font-bold">3</div>
              <h3 className="font-serif text-xl text-dark mb-4 tracking-wide">{t('mission3_title')}</h3>
              <p className="text-sm text-gray-600 font-light leading-relaxed">
                {t('mission3_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Clients */}
      <section className="py-20 bg-[#FDFBF7] overflow-hidden">
        <div className="container mx-auto px-4 lg:px-8 mb-12">
          <h2 className="text-3xl font-serif mb-4 text-center text-dark">{t('clients_title') !== 'clients_title' ? t('clients_title') : 'Some of Our Clients'}</h2>
          <p className="text-center text-gray-500 max-w-2xl mx-auto text-sm font-light">{t('clients_subtitle') !== 'clients_subtitle' ? t('clients_subtitle') : 'Trusted by leading hotels, resorts and businesses across Laos'}</p>
        </div>

        {(() => {
          // Fallback static list of clients
          const defaultClients = [
            // Row 1
            { src: '/clients/rosewood.jpg', name: 'Rosewood' },
            { src: '/clients/doubletree.jpg', name: 'DoubleTree by Hilton' },
            { src: '/clients/pullman.jpg', name: 'Pullman' },
            { src: '/clients/amantaka.jpg', name: 'Amantaka' },
            { src: '/clients/the_grand.jpg', name: 'The Grand' },
            { src: '/clients/the_namkhan.jpg', name: 'The Namkhan' },
            { src: '/clients/angsana_maison.jpg', name: 'Angsana Maison' },
            { src: '/clients/m_gallery.jpg', name: 'M Gallery' },
            { src: '/clients/belle_rive.jpg', name: 'The Belle Rive' },
            { src: '/clients/souphattra_hotel.jpg', name: 'Souphattra Hotel' },
            { src: '/clients/sisombat_plaza.jpg', name: 'Sisombat Plaza' },
            { src: '/clients/phongsavath.jpg', name: 'Phongsavath' },
            // Row 2
            { src: '/clients/landmark.jpg', name: 'Landmark' },
            { src: '/clients/sala_prabang.jpg', name: 'Sala Prabang' },
            { src: '/clients/luang_prabang.jpg', name: 'Luang Prabang' },
            { src: '/clients/xay_more.jpg', name: 'Xay More' },
            { src: '/clients/maison.jpg', name: 'Maison' },
            { src: '/clients/le_bel_air.jpg', name: 'Le Bel Air' },
            { src: '/clients/sada_hotel.jpg', name: 'Sada Hotel' },
            { src: '/clients/namkhan_view.jpg', name: 'Namkhan View' },
            { src: '/clients/city_inn.jpg', name: 'City Inn' },
            { src: '/clients/monsane.jpg', name: 'Monsané' },
            { src: '/clients/lpb_view_hotel.jpg', name: 'LPB View Hotel' },
            { src: '/clients/villa_maly.jpg', name: 'Villa Maly' },
            // Row 3
            { src: '/clients/mandala_ou.jpg', name: 'Mandala Ou' },
            { src: '/clients/angsana.jpg', name: 'Angsana' },
            { src: '/clients/indigo_house.jpg', name: 'Indigo House' },
            { src: '/clients/pha_nya.jpg', name: 'Pha Nya' },
            { src: '/clients/burasari.jpg', name: 'Burasari Heritage' },
            { src: '/clients/phubarn.jpg', name: 'Phubarn' },
            { src: '/clients/bualuang.jpg', name: 'Bualuang Hotel' },
            { src: '/clients/champasak_grand.jpg', name: 'Champasak Grand' },
            { src: '/clients/tmark_resort.jpg', name: 'Tmark Resort' },
            { src: '/clients/souphattra_apt.jpg', name: 'Souphattra Apartments' },
            { src: '/clients/lao_poet.jpg', name: 'Lao Poet Hotel' },
            { src: '/clients/amantaka_dark.jpg', name: 'Amantaka' }
          ];

          const activeClients = clientLogos.length > 0 ? clientLogos : defaultClients;

          // Helper to split clients into 3 rows and ensure enough items for seamless scrolling marquee
          const getRowItems = (rowIndex) => {
            // Select items for this row (every 3rd item starting from rowIndex)
            const rowItems = activeClients.filter((_, idx) => idx % 3 === rowIndex);
            if (rowItems.length === 0) return [];
            
            // Duplicate rowItems until we have at least 8 elements for width/seamless scroll
            let list = [...rowItems];
            while (list.length < 8) {
              list = [...list, ...rowItems];
            }
            // Duplicate once more to create standard two-half loop for infinite animation
            return [...list, ...list];
          };

          const row1 = getRowItems(0);
          const row2 = getRowItems(1);
          const row3 = getRowItems(2);

          return (
            <>
              {/* Row 1 - scrolls left */}
              {row1.length > 0 && (
                <div className="relative mb-6">
                  <div className="flex animate-scroll-left gap-8 w-max">
                    {row1.map((client, i) => (
                      <div key={i} className="shrink-0 w-28 h-28 bg-white rounded-2xl border border-[#E8DCC4]/40 shadow-sm flex items-center justify-center p-3 hover:shadow-md transition-shadow">
                        <img src={client.src} alt={client.name} className="max-w-full max-h-full object-contain" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Row 2 - scrolls right */}
              {row2.length > 0 && (
                <div className="relative mb-6">
                  <div className="flex animate-scroll-right gap-8 w-max">
                    {row2.map((client, i) => (
                      <div key={i} className="shrink-0 w-28 h-28 bg-white rounded-2xl border border-[#E8DCC4]/40 shadow-sm flex items-center justify-center p-3 hover:shadow-md transition-shadow">
                        <img src={client.src} alt={client.name} className="max-w-full max-h-full object-contain" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Row 3 - scrolls left */}
              {row3.length > 0 && (
                <div className="relative">
                  <div className="flex animate-scroll-left-slow gap-8 w-max">
                    {row3.map((client, i) => (
                      <div key={i} className="shrink-0 w-28 h-28 bg-white rounded-2xl border border-[#E8DCC4]/40 shadow-sm flex items-center justify-center p-3 hover:shadow-md transition-shadow">
                        <img src={client.src} alt={client.name} className="max-w-full max-h-full object-contain" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          );
        })()}

        {/* Scroll animation styles */}
        <style>{`
          @keyframes scroll-left {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes scroll-right {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(0); }
          }
          .animate-scroll-left {
            animation: scroll-left 50s linear infinite;
          }
          .animate-scroll-left-slow {
            animation: scroll-left 55s linear infinite;
          }
          .animate-scroll-right {
            animation: scroll-right 52s linear infinite;
          }
          .animate-scroll-left:hover,
          .animate-scroll-left-slow:hover,
          .animate-scroll-right:hover {
            animation-play-state: paused;
          }
        `}</style>
      </section>

      {/* Available At Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-3xl font-serif mb-4 text-center text-dark">
            {t('available_at_title') !== 'available_at_title' ? t('available_at_title') : 'Available at...'}
          </h2>
          <p className="text-center text-gray-500 max-w-2xl mx-auto text-sm font-light mb-12">
            {t('available_at_subtitle') !== 'available_at_subtitle' ? t('available_at_subtitle') : 'Find our products at these trusted locations across Laos'}
          </p>

          {(() => {
            const defaultDistributors = [
              {
                id: 1,
                name: 'Vientiane Center',
                address: 'Khouvieng Road, Vientiane, Prefecture Vientiane 0100',
                image_url: '/clients/vientiane_center.jpg',
                map_url: '',
                facebook_url: '',
                website_url: '',
                phone: ''
              },
              {
                id: 2,
                name: 'Luangprabang Cat Cafe',
                address: 'Ban Visoun, Luang Prabang Laos 06000',
                image_url: '/clients/cat_cafe.jpg',
                map_url: '',
                facebook_url: '',
                website_url: '',
                phone: ''
              },
              {
                id: 3,
                name: 'Gai Artisan Candles',
                address: 'Taohai Village, Luang Prabang Laos 06000',
                image_url: '/clients/gai_artisan.jpg',
                map_url: '',
                facebook_url: '',
                website_url: '',
                phone: ''
              },
              {
                id: 4,
                name: 'Mora Massage & Spa',
                address: 'Kitsalat Road, Luang Prabang Laos 06000',
                image_url: '/clients/mora_spa.jpg',
                map_url: '',
                facebook_url: '',
                website_url: '',
                phone: ''
              }
            ];

            const activeDistributors = distributors.length > 0 ? distributors : defaultDistributors;

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {activeDistributors.map(item => (
                  <div
                    key={item.id}
                    className="bg-[#FDFBF7] border border-[#E8DCC4]/40 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group flex flex-col"
                  >
                    {/* Logo */}
                    <div className="aspect-square bg-white flex items-center justify-center p-6 border-b border-[#E8DCC4]/30">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Info */}
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-serif text-base text-dark mb-1.5 tracking-wide leading-tight">{item.name}</h3>
                      {item.address && (
                        <p className="text-xs text-gray-500 font-light leading-relaxed mb-4 line-clamp-2">{item.address}</p>
                      )}

                      {/* Action links */}
                      {(item.map_url || item.facebook_url || item.website_url || item.phone) && (
                        <div className="flex gap-2 mt-auto pt-3 border-t border-[#E8DCC4]/30">
                          {item.map_url && (
                            <a href={item.map_url} target="_blank" rel="noopener noreferrer" title="View on Map"
                              className="w-8 h-8 rounded-full bg-[#8A9A5B]/10 flex items-center justify-center text-[#8A9A5B] hover:bg-[#8A9A5B] hover:text-white transition-all duration-200">
                              <MapPin size={14} />
                            </a>
                          )}
                          {item.facebook_url && (
                            <a href={item.facebook_url} target="_blank" rel="noopener noreferrer" title="Facebook Page"
                              className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-200">
                              <Facebook size={14} />
                            </a>
                          )}
                          {item.website_url && (
                            <a href={item.website_url} target="_blank" rel="noopener noreferrer" title="Website"
                              className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 hover:bg-teal-600 hover:text-white transition-all duration-200">
                              <Globe size={14} />
                            </a>
                          )}
                          {item.phone && (
                            <a href={`tel:${item.phone}`} title="Call"
                              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-600 hover:text-white transition-all duration-200">
                              <Phone size={14} />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </section>
    </div>
  );
}

export default Home;
