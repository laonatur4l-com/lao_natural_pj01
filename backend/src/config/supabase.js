import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import ws from 'ws';

dotenv.config();

const DEFAULT_SUPABASE_URL = 'https://rstapddufiwagvrsphqr.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzdGFwZGR1Zml3YWd2cnNwaHFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNDgzMTAsImV4cCI6MjEwNTcyNDMxMH0.OZPwWehFv_1HKvYZhLYvx6i1bDR3EMB2wEeYRFLAmQ0';
const DEFAULT_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzdGFwZGR1Zml3YWd2cnNwaHFyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDE0ODMxMCwiZXhwIjoyMTA1NzI0MzEwfQ.LiPfBtzSZc79iFy2pLv8aCy85mZYU4nPIA1GxS2jiXA';

const isServiceRoleKey = (key) => {
  try {
    if (!key || typeof key !== 'string') return false;
    const parts = key.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    return payload?.role === 'service_role';
  } catch (e) {
    return false;
  }
};

const supabaseUrl = (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('demo-project'))
  ? process.env.SUPABASE_URL
  : DEFAULT_SUPABASE_URL;

const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_ANON_KEY !== 'demo-anon-key')
  ? process.env.SUPABASE_ANON_KEY
  : DEFAULT_SUPABASE_ANON_KEY;

// Ensure supabaseServiceKey is genuinely a service_role key to bypass storage/database RLS
const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseServiceKey = isServiceRoleKey(rawServiceKey)
  ? rawServiceKey
  : DEFAULT_SERVICE_ROLE_KEY;

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
