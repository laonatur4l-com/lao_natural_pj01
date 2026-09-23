import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validateExchangeRates } from '../middleware/validate.js';
import { logActivity } from '../utils/helpers.js';

const router = express.Router();

// Fallback in-memory exchange rates store
let currentRates = {
  THB: 700.0,
  USD: 22000.0,
};

/**
 * GET /api/exchange-rates
 * Public read endpoint for store currency exchange rates (THB, USD against LAK base)
 */
router.get('/', async (req, res) => {
  try {
    const { data: ratesData, error } = await supabaseAdmin
      .from('exchange_rates')
      .select('currency, rate');

    if (!error && ratesData && ratesData.length > 0) {
      ratesData.forEach(row => {
        currentRates[row.currency] = parseFloat(row.rate);
      });
    }

    res.json({
      success: true,
      rates: currentRates,
    });
  } catch (err) {
    console.error('Fetch exchange rates error:', err);
    res.json({
      success: true,
      rates: currentRates,
    });
  }
});

/**
 * POST /api/exchange-rates
 * Update exchange rates (Owner & Employee)
 */
router.post('/', authenticate, authorize('owner', 'employee'), validateExchangeRates, async (req, res) => {
  try {
    const { rates } = req.body;

    const thbRate = parseFloat(rates.THB);
    const usdRate = parseFloat(rates.USD);

    currentRates.THB = thbRate;
    currentRates.USD = usdRate;

    // Try upserting to Supabase DB if available
    try {
      await supabaseAdmin
        .from('exchange_rates')
        .upsert([
          { currency: 'THB', rate: thbRate, updated_at: new Date().toISOString() },
          { currency: 'USD', rate: usdRate, updated_at: new Date().toISOString() }
        ], { onConflict: 'currency' });
    } catch (dbErr) {
      console.warn('Supabase exchange rates update warning:', dbErr.message);
    }

    await logActivity(supabaseAdmin, req.user.id, `Updated exchange rates: THB=${thbRate}, USD=${usdRate}`);

    res.json({
      success: true,
      message: 'Exchange rates updated successfully!',
      rates: { THB: thbRate, USD: usdRate },
    });
  } catch (err) {
    console.error('Update exchange rates error:', err);
    res.status(500).json({ error: 'Failed to update exchange rates.' });
  }
});

export default router;

