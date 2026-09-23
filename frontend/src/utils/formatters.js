/**
 * Formats an entity ID based on its type.
 * e.g. formatId('EMP', 1) => 'EMP-001'
 * 
 * @param {string} prefix - The 3-letter prefix (EMP, CTM, PRD, ORD)
 * @param {number|string} id - The integer ID from the database
 * @returns {string} - The zero-padded formatted ID
 */
export const formatId = (prefix, id) => {
  if (id === undefined || id === null || id === '') return '';
  const str = String(id).trim();
  if (/[a-zA-Z]/.test(str)) {
    return str;
  }
  return `${prefix}-${str.padStart(3, '0')}`;
};

/**
 * Derives the correct prefix based on the user's role.
 * 
 * @param {string} role - The user's role ('employee' or 'user')
 * @returns {string}
 */
export const getUserPrefix = (role) => {
  if (role === 'employee') return 'EMP';
  if (role === 'user') return 'CTM';
  if (role === 'owner') return 'OWN';
  return 'USR';
};

/**
 * Formats a number as LAK, THB, or USD.
 * e.g. (2000000, 'LAK') => '₭2.000.000'
 *      (150, 'THB') => '฿150'
 *      (5.5, 'USD') => '$5.50'
 * 
 * @param {number|string} amount - The amount to format
 * @param {string} currency - The currency code ('LAK', 'THB', 'USD')
 * @returns {string} - The formatted currency string
 */
export const formatCurrency = (amount, currency = 'LAK') => {
  if (amount === undefined || amount === null) {
    const curr = (currency || 'LAK').toUpperCase();
    return curr === 'LAK' ? '₭0' : curr === 'THB' ? '฿0' : '$0';
  }
  const num = parseFloat(amount);
  if (isNaN(num)) {
    const curr = (currency || 'LAK').toUpperCase();
    return curr === 'LAK' ? '₭0' : curr === 'THB' ? '฿0' : '$0';
  }
  
  const curr = (currency || 'LAK').toUpperCase();
  if (curr === 'THB') {
    const dec = num % 1 !== 0 ? 2 : 0;
    return '฿' + num.toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  if (curr === 'USD') {
    const dec = num % 1 !== 0 ? 2 : 0;
    return '$' + num.toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  // Default LAK
  return '₭' + num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const getStoredExchangeRates = () => {
  try {
    const saved = localStorage.getItem('exchange_rates');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.THB && parsed?.USD) return parsed;
    }
  } catch (e) {}
  return { THB: 650, USD: 20000 };
};

export let EXCHANGE_RATES = getStoredExchangeRates();

export const exchangeChannel = typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('lao_exchange_rates_channel')
  : null;

export const setExchangeRates = (newRates) => {
  let updated = false;
  if (newRates?.THB && parseFloat(newRates.THB) > 0) {
    EXCHANGE_RATES.THB = parseFloat(newRates.THB);
    updated = true;
  }
  if (newRates?.USD && parseFloat(newRates.USD) > 0) {
    EXCHANGE_RATES.USD = parseFloat(newRates.USD);
    updated = true;
  }
  if (updated) {
    try {
      localStorage.setItem('exchange_rates', JSON.stringify(EXCHANGE_RATES));
      if (exchangeChannel) {
        exchangeChannel.postMessage(EXCHANGE_RATES);
      }
    } catch (e) {}
  }
};

/**
 * Gets THB price by converting from LAK using the current exchange rate.
 * Accepts optional rateOverride (e.g. 670) or defaults to global EXCHANGE_RATES.THB.
 * 
 * @param {number|string} priceLak - The price in LAK
 * @param {number|string} [customRate] - Optional custom exchange rate (e.g. 670)
 */
export const getThbPrice = (priceLak, customRate) => {
  const lak = parseFloat(priceLak || 0);
  const rate = (customRate && !isNaN(parseFloat(customRate)) && parseFloat(customRate) > 10) 
    ? parseFloat(customRate) 
    : EXCHANGE_RATES.THB;
  return lak > 0 ? (lak / (rate || 700)) : 0;
};

/**
 * Gets USD price by converting from LAK using the current exchange rate.
 * Accepts optional rateOverride (e.g. 21800) or defaults to global EXCHANGE_RATES.USD.
 * 
 * @param {number|string} priceLak - The price in LAK
 * @param {number|string} [customRate] - Optional custom exchange rate (e.g. 21800)
 */
export const getUsdPrice = (priceLak, customRate) => {
  const lak = parseFloat(priceLak || 0);
  const rate = (customRate && !isNaN(parseFloat(customRate)) && parseFloat(customRate) > 1000) 
    ? parseFloat(customRate) 
    : EXCHANGE_RATES.USD;
  return lak > 0 ? (lak / (rate || 22000)) : 0;
};
