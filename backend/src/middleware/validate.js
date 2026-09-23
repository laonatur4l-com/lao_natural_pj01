import { body, param, query, validationResult } from 'express-validator';

/**
 * Runs validation and returns 400 with errors if any fail.
 * Use as the last item in a validation chain.
 */
export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed.',
      details: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ─── Auth Validations ────────────────────────────────────────────
export const validateLogin = [
  body('email').isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
  handleValidation,
];

export const validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').trim().isEmail().withMessage('Valid email address is required.'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'),
  handleValidation,
];

// ─── Product Validations ────────────────────────────────────────
export const validateProduct = [
  body('name').trim().notEmpty().withMessage('Product name is required.'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number.'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be >= 0.'),
  body('category').optional().trim(),
  body('description').optional().trim(),
  handleValidation,
];

export const validateProductUpdate = [
  param('id').notEmpty().withMessage('Product ID is required.'),
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty.'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number.'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be >= 0.'),
  handleValidation,
];

// ─── Order Validations ──────────────────────────────────────────
export const validateOrderCreate = [
  body('items').isArray({ min: 1 }).withMessage('Order must have at least one item.'),
  body('items.*.id').notEmpty().withMessage('Each item must have a product ID.'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be >= 1.'),
  body('shipping_name').trim().notEmpty().withMessage('Shipping name is required.'),
  body('shipping_phone').trim().notEmpty().withMessage('Shipping phone is required.'),
  body('shipping_address').trim().notEmpty().withMessage('Shipping address is required.'),
  handleValidation,
];

export const validateOrderStatus = [
  param('id').isInt().withMessage('Order ID must be a number.'),
  body('status')
    .isIn(['pending_payment', 'prepare', 'sending', 'received', 'payment_rejected'])
    .withMessage('Invalid status value.'),
  handleValidation,
];

export const validateOrderAddress = [
  param('id').isInt().withMessage('Order ID must be a number.'),
  body('shipping_name').trim().notEmpty().withMessage('Shipping name is required.'),
  body('shipping_phone').trim().notEmpty().withMessage('Shipping phone is required.'),
  body('shipping_address').trim().notEmpty().withMessage('Shipping address is required.'),
  handleValidation,
];

// ─── Category Validations ───────────────────────────────────────
export const validateCategory = [
  body('name').trim().notEmpty().withMessage('Category name is required.'),
  handleValidation,
];

// ─── Promotion Validations ──────────────────────────────────────
export const validatePromotion = [
  body('product_id').notEmpty().withMessage('Product ID is required.'),
  body('title').trim().notEmpty().withMessage('Promotion title is required.'),
  body('type').isIn(['discount', 'b1g1']).withMessage('Type must be "discount" or "b1g1".'),
  body('promo_stock').isInt({ min: 1 }).withMessage('Promo stock must be >= 1.'),
  handleValidation,
];

// ─── User Management Validations ────────────────────────────────
export const validateUserCreate = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters.'),
  body('role')
    .isIn(['owner', 'employee', 'user'])
    .withMessage('Role must be owner, employee, or user.'),
  handleValidation,
];

export const validateProfileUpdate = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  handleValidation,
];

// ─── Exchange Rate Validations ──────────────────────────────────
export const validateExchangeRates = [
  body('rates').isObject().withMessage('Rates object is required.'),
  body('rates.THB').isFloat({ min: 0 }).withMessage('THB rate must be a positive number.'),
  body('rates.USD').isFloat({ min: 0 }).withMessage('USD rate must be a positive number.'),
  handleValidation,
];

// ─── Import Product Validations ─────────────────────────────────
export const validateImportProduct = [
  body('product_id').notEmpty().withMessage('Product ID is required.'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be >= 1.'),
  body('import_price').isFloat({ min: 0 }).withMessage('Import price must be >= 0.'),
  handleValidation,
];

// Re-export express-validator helpers for route files that need custom validators
export { body, param, query };
