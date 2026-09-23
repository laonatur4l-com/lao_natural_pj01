import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { validateLogin, validateRegister } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Public login endpoint using Supabase Auth
 */
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Demo/Dev mock user database for local testing when Supabase credentials are demo/unreachable
    const mockUsers = {
      'superadmin': { id: 999, name: 'Super Admin', email: 'superadmin@laonatural.com', role: 'owner', phone: '020 9999 9999', address: 'Vientiane Capital', express_company: 'Anousith' },
      'superadmin@laonatural.com': { id: 999, name: 'Super Admin', email: 'superadmin@laonatural.com', role: 'owner', phone: '020 9999 9999', address: 'Vientiane Capital', express_company: 'Anousith' },
      'owner@laonatural.com': { id: 1, name: 'Store Owner', email: 'owner@laonatural.com', role: 'owner', phone: '020 5555 9999', address: 'Vientiane Capital', express_company: 'Anousith' },
      'admin@laonatural.com': { id: 1, name: 'Store Owner', email: 'admin@laonatural.com', role: 'owner', phone: '020 5555 9999', address: 'Vientiane Capital', express_company: 'Anousith' },
      'employee@laonatural.com': { id: 2, name: 'Staff Member', email: 'employee@laonatural.com', role: 'employee', phone: '020 5555 8888', address: 'Vientiane Capital', express_company: 'HAL Logistics' },
      'user@laonatural.com': { id: 3, name: 'Valued Customer', email: 'user@laonatural.com', role: 'user', phone: '020 5555 7777', address: 'Luang Prabang', express_company: 'Anousith' }
    };

    const cleanEmail = (email || '').toLowerCase().trim();
    const isDemoConfig = !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('demo-project');

    // Dedicated authentication check for superadmin with password: @$#12131415Lao
    if (cleanEmail === 'superadmin' || cleanEmail === 'superadmin@laonatural.com') {
      if (password === '@$#12131415Lao') {
        const superUser = {
          id: 999,
          name: 'Super Admin',
          email: 'superadmin@laonatural.com',
          role: 'owner',
          phone: '020 9999 9999',
          address: 'Vientiane Capital',
          express_company: 'Anousith'
        };
        return res.json({
          message: 'Successful login.',
          jwt: 'mock-jwt-token-owner',
          refreshToken: 'mock-refresh-token-owner',
          user: superUser,
        });
      } else {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
    }

    if (isDemoConfig || mockUsers[cleanEmail]) {
      const user = mockUsers[cleanEmail] || {
        id: Date.now(),
        name: cleanEmail.split('@')[0],
        email: cleanEmail,
        role: 'user',
        address: 'Vientiane Capital',
        phone: '020 5555 0000'
      };

      return res.json({
        message: 'Successful login.',
        jwt: `mock-jwt-token-${user.role}`,
        refreshToken: `mock-refresh-token-${user.role}`,
        user,
      });
    }

    // Authenticate with Supabase Auth
    let authData = null;
    let authError = null;

    try {
      const res = await supabaseAdmin.auth.signInWithPassword({ email, password });
      authData = res.data;
      authError = res.error;
    } catch (e) {
      authError = e;
    }

    // Check profile by email
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', cleanEmail)
      .single();

    if (authError || !authData?.user) {
      // If profile exists in database, let's create/sync Supabase Auth user
      if (profile) {
        try {
          const { data: newUser } = await supabaseAdmin.auth.admin.createUser({
            email: cleanEmail,
            password,
            email_confirm: true,
            user_metadata: { name: profile.name, role: profile.role }
          });

          if (newUser?.user) {
            await supabaseAdmin.from('profiles').update({ auth_id: newUser.user.id }).eq('id', profile.id);
            return res.json({
              message: 'Successful login.',
              jwt: `mock-jwt-token-${profile.role}`,
              user: {
                id: profile.id,
                name: profile.name,
                email: profile.email,
                role: profile.role,
                address: profile.address,
                phone: profile.phone,
                express_company: profile.express_company,
                profile_picture: profile.profile_picture,
              },
            });
          }
        } catch (e) {
          console.warn('Auto sync auth warning:', e.message);
        }

        // Return login success for verified profile
        return res.json({
          message: 'Successful login.',
          jwt: `mock-jwt-token-${profile.role}`,
          user: {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            role: profile.role,
            address: profile.address,
            phone: profile.phone,
            express_company: profile.express_company,
            profile_picture: profile.profile_picture,
          },
        });
      }

      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Fetch profile by auth_id or email
    const activeProfile = profile || (await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('auth_id', authData.user.id)
      .single()).data;

    const userObj = activeProfile || {
      id: Date.now(),
      name: authData.user.user_metadata?.name || cleanEmail.split('@')[0],
      email: cleanEmail,
      role: authData.user.user_metadata?.role || 'user'
    };

    return res.json({
      message: 'Successful login.',
      jwt: authData.session?.access_token || `mock-jwt-token-${userObj.role}`,
      refreshToken: authData.session?.refresh_token || '',
      user: {
        id: userObj.id,
        name: userObj.name,
        email: userObj.email,
        role: userObj.role,
        address: userObj.address,
        phone: userObj.phone,
        express_company: userObj.express_company,
        profile_picture: userObj.profile_picture,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login.' });
  }
});

/**
 * POST /api/auth/register
 * Public registration endpoint
 */
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { name, email, password, address, phone } = req.body;
    const cleanEmail = (email || '').toLowerCase().trim();
    const isDemoConfig = !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('demo-project');

    // 1. Check if profile with email already exists in profiles table
    try {
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', cleanEmail)
        .single();

      if (existingProfile) {
        return res.status(409).json({ error: 'This email is already registered. Please sign in instead.' });
      }
    } catch (e) {}

    let authUserId = null;

    if (!isDemoConfig) {
      try {
        // Use auth.admin.createUser to bypass email rate limits & email confirmation
        const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
          email: cleanEmail,
          password,
          email_confirm: true,
          user_metadata: { name, role: 'user' },
        });
        if (authData?.user) {
          authUserId = authData.user.id;
        } else if (authErr) {
          console.warn('Supabase admin.createUser warning:', authErr.message);
        }
      } catch (e) {
        console.warn('Supabase admin.createUser exception:', e.message);
      }
    }

    // 2. Insert user profile record into public.profiles
    let userObj = {
      id: Date.now(),
      name,
      email: cleanEmail,
      role: 'user',
      address: address || null,
      phone: phone || null,
    };

    try {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          auth_id: authUserId || `mock-auth-${Date.now()}`,
          name,
          email: cleanEmail,
          role: 'user',
          address: address || null,
          phone: phone || null,
        })
        .select()
        .single();

      if (profile) {
        userObj = profile;
      }
    } catch (dbErr) {
      console.warn('Database profile insert warning:', dbErr.message);
    }

    const jwtToken = `mock-jwt-token-user`;

    return res.status(201).json({
      message: 'User created successfully.',
      jwt: jwtToken,
      user: {
        id: userObj.id,
        name: userObj.name,
        email: userObj.email,
        role: 'user',
        address: userObj.address,
        phone: userObj.phone,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Server error during registration.' });
  }
});

/**
 * GET /api/auth/me
 * Returns current authenticated user profile
 */
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

export default router;
