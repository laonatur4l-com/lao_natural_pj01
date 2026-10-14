import { supabaseAdmin } from '../config/supabase.js';

const WHITELIST_EMAILS = [
  'laonaturalowner@gmail.com',
  'superadmin@laonatural.com',
  'owner@laonatural.com',
  'employee1@laonatural.com',
  'laonatur4l@gmail.com'
].map(e => e.toLowerCase());

async function deleteNonStaffUsers() {
  console.log('🚀 Starting test customer deletion...');
  console.log('🛡️ Whitelist (Accounts to KEEP):', WHITELIST_EMAILS);

  // 1. Fetch all auth users
  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers();
  if (authErr) {
    console.error('Failed to list auth users:', authErr);
    process.exit(1);
  }

  const usersToDelete = authData.users.filter(u => !WHITELIST_EMAILS.includes(u.email?.toLowerCase()));
  const usersToKeep = authData.users.filter(u => WHITELIST_EMAILS.includes(u.email?.toLowerCase()));

  console.log(`\nFound ${authData.users.length} total auth users:`);
  console.log(`- ${usersToKeep.length} to KEEP:`, usersToKeep.map(u => u.email));
  console.log(`- ${usersToDelete.length} to DELETE.`);

  let deletedAuthCount = 0;
  for (const user of usersToDelete) {
    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (delErr) {
      console.error(`❌ Failed to delete auth user ${user.email} (${user.id}):`, delErr.message);
    } else {
      console.log(`🗑️ Deleted auth user: ${user.email}`);
      deletedAuthCount++;
    }
  }

  // 2. Clean up public.profiles
  console.log('\n--- Cleaning up public.profiles table ---');
  const { data: profiles, error: profErr } = await supabaseAdmin.from('profiles').select('*');
  if (profErr) {
    console.error('Failed to fetch profiles:', profErr);
  } else {
    const profilesToDelete = profiles.filter(p => !WHITELIST_EMAILS.includes(p.email?.toLowerCase()));
    console.log(`Found ${profilesToDelete.length} customer profiles to delete from 'profiles' table.`);

    for (const prof of profilesToDelete) {
      const { error: pDelErr } = await supabaseAdmin.from('profiles').delete().eq('id', prof.id);
      if (pDelErr) {
        console.error(`❌ Failed to delete profile ${prof.email}:`, pDelErr.message);
      } else {
        console.log(`🗑️ Deleted profile: ${prof.email} (ID: ${prof.id})`);
      }
    }
  }

  // 3. Final verification
  console.log('\n--- Final Verification ---');
  const { data: finalAuth } = await supabaseAdmin.auth.admin.listUsers();
  console.log('Remaining Auth Users:', finalAuth?.users?.map(u => u.email));

  const { data: finalProfiles } = await supabaseAdmin.from('profiles').select('id, name, email, role');
  console.log('Remaining Profiles:', finalProfiles);

  console.log(`\n✅ Clean up complete! Deleted ${deletedAuthCount} auth users.`);
}

deleteNonStaffUsers().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
