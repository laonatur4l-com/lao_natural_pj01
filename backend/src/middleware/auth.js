import { supabaseAdmin } from '../config/supabase.js';

/**
 * Authentication middleware - verifies Supabase JWT token
 * Extracts the Bearer token from the Authorization header,
 * validates it with Supabase, and attaches the user to req.user
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access denied. Invalid token format.' });
    }

    // Dev/Mock token handler for local testing
    if (token.startsWith('mock-jwt-token-') || token.startsWith('user-')) {
      const parts = token.replace('mock-jwt-token-', '').replace('user-', '');
      const roleOrId = parts;

      // If token specifies user ID (e.g. mock-jwt-token-user-15 or user-15)
      const idMatch = roleOrId.match(/\d+$/);
      if (idMatch) {
        const userId = parseInt(idMatch[0], 10);
        const { data: dbProfile } = await supabaseAdmin
          .from('profiles')
          .select('id, name, email, role, phone, address')
          .eq('id', userId)
          .single();

        if (dbProfile) {
          req.authUser = { id: `mock-${dbProfile.id}`, email: dbProfile.email };
          req.user = dbProfile;
          req.token = token;
          return next();
        }
      }

      const role = roleOrId.replace(/-\d+$/, '');
      const mockProfiles = {
        owner: { id: 1, name: 'Store Owner', email: 'owner@laonatural.com', role: 'owner', phone: '020 5555 9999', address: 'Vientiane Capital' },
        employee: { id: 2, name: 'Staff Member', email: 'employee@laonatural.com', role: 'employee', phone: '020 5555 8888', address: 'Vientiane Capital' },
        user: { id: 3, name: 'Valued Customer', email: 'user@laonatural.com', role: 'user', phone: '020 5555 7777', address: 'Luang Prabang' }
      };
      const profile = mockProfiles[role] || mockProfiles['user'];
      req.authUser = { id: `mock-${profile.id}`, email: profile.email };
      req.user = profile;
      req.token = token;
      return next();
    }

    // Verify the JWT with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Access denied. Invalid or expired token.' });
    }

    // Fetch the user's profile (role, name, etc.) from our profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email, role, phone, address')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({ error: 'User profile not found.' });
    }

    // Attach both Supabase auth user and our profile to the request
    req.authUser = user;
    req.user = profile;
    req.token = token;

    next();
  } catch (err) {
    console.error('Authentication error:', err.message);
    return res.status(500).json({ error: 'Authentication failed.' });
  }
};

/**
 * Optional authentication - doesn't block the request if no token,
 * but attaches user info if a valid token is present.
 * Useful for public endpoints that show extra data for logged-in users.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      req.user = null;
      return next();
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email, role, phone, address')
      .eq('auth_id', user.id)
      .single();

    req.authUser = user;
    req.user = profile || null;
    req.token = token;
  } catch {
    req.user = null;
  }

  next();
};
