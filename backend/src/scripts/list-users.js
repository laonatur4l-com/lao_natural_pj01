import { supabaseAdmin } from '../config/supabase.js';

async function listAllUsers() {
  console.log('--- Fetching auth.users ---');
  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers();
  if (authErr) {
    console.error('Error fetching auth users:', authErr);
  } else {
    console.log(`Found ${authData.users.length} auth users:`);
    authData.users.forEach(u => {
      console.log(`- ID: ${u.id} | Email: ${u.email} | Created: ${u.created_at}`);
    });
  }

  console.log('\n--- Fetching public.profiles ---');
  const { data: profiles, error: profErr } = await supabaseAdmin.from('profiles').select('*');
  if (profErr) {
    console.error('Error fetching profiles:', profErr);
  } else {
    console.log(`Found ${profiles.length} profiles:`);
    profiles.forEach(p => {
      console.log(`- ID: ${p.id} | Name: ${p.name || p.full_name} | Email: ${p.email} | Role: ${p.role}`);
    });
  }
}

listAllUsers();
