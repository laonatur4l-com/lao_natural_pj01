/**
 * Role-based authorization middleware factory.
 * Must be used AFTER the authenticate middleware.
 *
 * Usage:
 *   router.get('/admin-only', authenticate, authorize('owner'), handler);
 *   router.get('/staff', authenticate, authorize('owner', 'employee'), handler);
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied. Insufficient permissions.',
        required: allowedRoles,
        current: req.user.role,
      });
    }

    next();
  };
};
