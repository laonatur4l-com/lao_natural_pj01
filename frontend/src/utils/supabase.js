import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rstapddufiwagvrsphqr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzdGFwZGR1Zml3YWd2cnNwaHFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNDgzMTAsImV4cCI6MjEwNTcyNDMxMH0.OZPwWehFv_1HKvYZhLYvx6i1bDR3EMB2wEeYRFLAmQ0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
