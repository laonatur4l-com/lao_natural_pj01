import { createContext, useState, useContext, useEffect } from 'react';
import { getThbPrice, getUsdPrice, setExchangeRates, EXCHANGE_RATES } from '../utils/formatters';
import api from '../utils/api';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const getItemSubtotal = (item) => {
  const origLak = Number(item.price_lak || item.price || 0);
  const origThb = getThbPrice(origLak);
  const origUsd = getUsdPrice(origLak);
  const qty = item.quantity || 1;

  if (!item.promotion || item.promotion.status === 'inactive') {
    return {
      lak: origLak * qty,
      thb: origThb * qty,
      usd: origUsd * qty,
      unitPriceLak: origLak,
      unitPriceThb: origThb,
      unitPriceUsd: origUsd,
      hasDiscount: false,
      isB1G1: false,
      discountPercent: 0
    };
  }

  const promo = item.promotion;
  const totalPromoStock = parseInt(promo.promo_stock) > 0 ? parseInt(promo.promo_stock) : 9999;
  const promoSold = parseInt(promo.promo_sold || 0);
  const remainingPromoStock = Math.max(0, totalPromoStock - promoSold);

  const promoQty = Math.min(qty, remainingPromoStock);
  const regularQty = qty - promoQty;

  if (promo.type === 'discount') {
    const discPercent = parseFloat(promo.discount_percent || 0);
    if (discPercent <= 0) {
      return {
        lak: origLak * qty,
        thb: origThb * qty,
        usd: origUsd * qty,
        unitPriceLak: origLak,
        unitPriceThb: origThb,
        unitPriceUsd: origUsd,
        hasDiscount: false,
        isB1G1: false,
        discountPercent: 0
      };
    }

    const discUnitLak = origLak * (1 - discPercent / 100);
    const discUnitThb = origThb * (1 - discPercent / 100);
    const discUnitUsd = origUsd * (1 - discPercent / 100);

    const totalLak = (promoQty * discUnitLak) + (regularQty * origLak);
    const totalThb = (promoQty * discUnitThb) + (regularQty * origThb);
    const totalUsd = (promoQty * discUnitUsd) + (regularQty * origUsd);

    return {
      lak: totalLak,
      thb: totalThb,
      usd: totalUsd,
      unitPriceLak: discUnitLak,
      unitPriceThb: discUnitThb,
      unitPriceUsd: discUnitUsd,
      hasDiscount: true,
      isB1G1: false,
      discountPercent: discPercent,
      promoQty,
      regularQty
    };
  }

  if (promo.type === 'b1g1') {
    const buyQty = promo.buy_qty ? Math.max(1, parseInt(promo.buy_qty)) : 1;
    const getQty = promo.get_qty ? Math.max(1, parseInt(promo.get_qty)) : 1;
    const setSize = buyQty + getQty;

    const numSets = Math.floor(promoQty / setSize);
    const remainder = promoQty % setSize;

    const paidInSets = numSets * buyQty;
    const freeInSets = numSets * getQty;

    const paidInRemainder = Math.min(remainder, buyQty);
    const freeInRemainder = Math.max(0, remainder - buyQty);

    const totalPaidPromoQty = paidInSets + paidInRemainder;
    const totalFreePromoQty = freeInSets + freeInRemainder;

    const totalPayableQty = totalPaidPromoQty + regularQty;

    const totalLak = totalPayableQty * origLak;
    const totalThb = totalPayableQty * origThb;
    const totalUsd = totalPayableQty * origUsd;

    const itemsNeededForNextFree = (setSize - remainder) % setSize;

    return {
      lak: totalLak,
      thb: totalThb,
      usd: totalUsd,
      unitPriceLak: origLak,
      unitPriceThb: origThb,
      unitPriceUsd: origUsd,
      fullPriceLak: qty * origLak,
      fullPriceThb: qty * origThb,
      fullPriceUsd: qty * origUsd,
      savingsLak: (qty - totalPayableQty) * origLak,
      savingsThb: (qty - totalPayableQty) * origThb,
      savingsUsd: (qty - totalPayableQty) * origUsd,
      hasDiscount: true,
      isB1G1: true,
      buyQty,
      getQty,
      setSize,
      itemsNeededForNextFree,
      discountPercent: 0,
      payableQty: totalPayableQty,
      freeQty: totalFreePromoQty
    };
  }

  return {
    lak: origLak * qty,
    thb: origThb * qty,
    usd: origUsd * qty,
    unitPriceLak: origLak,
    unitPriceThb: origThb,
    unitPriceUsd: origUsd,
    hasDiscount: false,
    isB1G1: false,
    discountPercent: 0
  };
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const storedCart = localStorage.getItem('cart');
    return storedCart ? JSON.parse(storedCart) : [];
  });

  const [exchangeRatesState, setExchangeRatesState] = useState(EXCHANGE_RATES);

  const fetchExchangeRates = async () => {
    try {
      const res = await api.get('/exchange_rates/read.php?t=' + Date.now());
      if (res.data?.rates) {
        setExchangeRates(res.data.rates);
        setExchangeRatesState({ ...res.data.rates });
      }
    } catch (err) {
      console.error('Error fetching exchange rates:', err);
    }
  };

  useEffect(() => {
    fetchExchangeRates();

    // 1. Listen for instant cross-tab BroadcastChannel notifications (0-ms delay)
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('lao_exchange_rates_channel') : null;
    if (channel) {
      channel.onmessage = (event) => {
        if (event.data?.THB && event.data?.USD) {
          setExchangeRates(event.data);
          setExchangeRatesState({ ...event.data });
        }
      };
    }

    // 2. Listen for window storage changes (0-ms cross-tab sync)
    const handleStorageChange = (e) => {
      if (e.key === 'exchange_rates' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed?.THB && parsed?.USD) {
            setExchangeRates(parsed);
            setExchangeRatesState({ ...parsed });
          }
        } catch (err) { }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    let finalQtyToAdd = quantity;

    const promo = product.promotion;
    if (promo && promo.type === 'b1g1') {
      const buyQty = promo.buy_qty ? Math.max(1, parseInt(promo.buy_qty)) : 1;
      const getQty = promo.get_qty ? Math.max(1, parseInt(promo.get_qty)) : 1;
      const setSize = buyQty + getQty;

      if (quantity % setSize !== 0 && quantity % buyQty === 0) {
        const numSets = Math.floor(quantity / buyQty);
        finalQtyToAdd = quantity + (numSets * getQty);
      }
    }

    setCartItems(prev => {
      const pSize = product.selectedSize || '';
      const existing = prev.find(item => item.id === product.id && (item.selectedSize || '') === pSize);
      const maxStock = product.stock ? parseInt(product.stock) : 9999;

      if (existing) {
        const newQty = Math.min(maxStock, existing.quantity + finalQtyToAdd);
        return prev.map(item =>
          item.id === product.id && (item.selectedSize || '') === pSize
            ? { ...item, quantity: newQty, promotion: product.promotion || item.promotion }
            : item
        );
      }
      const newQty = Math.min(maxStock, finalQtyToAdd);
      return [...prev, { ...product, quantity: newQty, promotion: product.promotion || null }];
    });
  };

  const removeFromCart = (productId, selectedSize = '') => {
    setCartItems(prev => prev.filter(item =>
      !(item.id === productId && (item.selectedSize || '') === (selectedSize || ''))
    ));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const updateQuantity = (productId, selectedSize = '', quantity) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === productId && (item.selectedSize || '') === (selectedSize || '')) {
        let newQty = Math.max(1, quantity);
        const promo = item.promotion;
        if (promo && promo.type === 'b1g1') {
          const buyQty = promo.buy_qty ? Math.max(1, parseInt(promo.buy_qty)) : 1;
          const getQty = promo.get_qty ? Math.max(1, parseInt(promo.get_qty)) : 1;
          const setSize = buyQty + getQty;

          if (newQty > item.quantity && newQty % setSize !== 0 && newQty % buyQty === 0) {
            const numSets = Math.floor(newQty / buyQty);
            const boosted = newQty + (numSets * getQty);
            const maxStock = item.stock ? parseInt(item.stock) : 9999;
            newQty = Math.min(maxStock, boosted);
          }
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const total = cartItems.reduce((acc, item) => acc + getItemSubtotal(item).lak, 0);
  const totalThb = cartItems.reduce((acc, item) => acc + getItemSubtotal(item).thb, 0);
  const totalUsd = cartItems.reduce((acc, item) => acc + getItemSubtotal(item).usd, 0);
  const count = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, total, totalThb, totalUsd, count, getItemSubtotal, exchangeRates: exchangeRatesState, refreshExchangeRates: fetchExchangeRates }}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
