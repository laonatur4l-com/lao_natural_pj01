import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import ws from 'ws';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://demo-project.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'demo-anon-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'demo-service-role-key';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.warn('⚠️ Warning: Using demo Supabase URL/Keys. Please fill in your real credentials in backend-new/.env when ready.');
}

const clientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    transport: ws,
  },
};

// Public client — respects Row Level Security (RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, clientOptions);

// Admin client — bypasses RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, clientOptions);

export default supabase;
