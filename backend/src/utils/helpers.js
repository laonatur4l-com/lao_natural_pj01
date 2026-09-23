/**
 * Shared utility functions for the Lao Natural Essentials backend.
 */

/**
 * Format a Supabase/PostgreSQL error into a clean API response.
 * Prevents leaking internal database details to the client.
 */
export const formatError = (error, fallbackMessage = 'An unexpected error occurred.') => {
  if (process.env.NODE_ENV === 'development') {
    return { error: fallbackMessage, debug: error.message || error };
  }
  return { error: fallbackMessage };
};

/**
 * Log an activity to the activity_log table.
 *
 * @param {object} supabase - Supabase client instance
 * @param {number} userId - The profile ID of the user performing the action
 * @param {string} action - Description of the action performed
 */
export const logActivity = async (supabase, userId, action) => {
  try {
    await supabase
      .from('activity_log')
      .insert({ user_id: userId, action });
  } catch (err) {
    // Don't let logging failures break the main request
    console.error('Activity log error:', err.message);
  }
};

/**
 * Parse pagination parameters from query string.
 * Returns { from, to, page, limit } for Supabase range queries.
 */
export const parsePagination = (query, defaultLimit = 50) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return { from, to, page, limit };
};

/**
 * Build a safe dynamic update object from the request body.
 * Only includes fields that are in the allowedFields list and are not undefined.
 *
 * @param {object} body - The request body
 * @param {string[]} allowedFields - List of field names allowed to be updated
 * @returns {object} Clean update object with only allowed, defined fields
 */
export const buildUpdateObject = (body, allowedFields) => {
  const updates = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }
  return updates;
};

/**
 * Validate that required fields exist in an object.
 *
 * @param {object} obj - Object to check
 * @param {string[]} fields - Required field names
 * @returns {{ valid: boolean, missing: string[] }}
 */
export const validateRequired = (obj, fields) => {
  const missing = fields.filter(f => obj[f] === undefined || obj[f] === null || obj[f] === '');
  return { valid: missing.length === 0, missing };
};
