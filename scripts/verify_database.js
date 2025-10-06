// ================================================================
// DATABASE VERIFICATION SCRIPT
// ================================================================
// Checks that your Supabase database is correctly set up
// Run: node scripts/verify_database.js
// ================================================================

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function verifyDatabase() {
  console.log('🔍 Verifying Supabase Database Setup...\n');
  console.log('='.repeat(60));

  let allGood = true;

  // ================================================================
  // 1. Check Connection
  // ================================================================
  console.log('\n✅ 1. Testing Database Connection...');
  try {
    const { data, error } = await supabase.from('retailers').select('count').limit(1);
    if (error) throw error;
    console.log('   ✅ Connection successful!');
  } catch (err) {
    console.log('   ❌ Connection failed:', err.message);
    allGood = false;
  }

  // ================================================================
  // 2. Check Table Counts
  // ================================================================
  console.log('\n📊 2. Checking Table Counts...');

  const tables = [
    'retailers',
    'retailer_outreach',
    'auth.users',
    'vendors',
    'uids',
    'scans',
    'payout_jobs'
  ];

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table.replace('auth.', ''))
        .select('*', { count: 'exact', head: true });

      if (error && !error.message.includes('auth.users')) {
        console.log(`   ⚠️  ${table}: Error - ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: ${count || 'N/A'} rows`);
      }
    } catch (err) {
      console.log(`   ⚠️  ${table}: ${err.message}`);
    }
  }

  // ================================================================
  // 3. Check New Columns Exist
  // ================================================================
  console.log('\n🔧 3. Verifying New Columns...');

  try {
    const { data, error } = await supabase
      .from('retailers')
      .select('id, created_by_user_id, recruited_by_sourcer_id, place_id, lat, lng')
      .limit(1);

    if (error) throw error;

    const sample = data[0] || {};
    console.log('   ✅ created_by_user_id exists:', 'created_by_user_id' in sample);
    console.log('   ✅ recruited_by_sourcer_id exists:', 'recruited_by_sourcer_id' in sample);
    console.log('   ✅ place_id exists:', 'place_id' in sample);
    console.log('   ✅ lat exists:', 'lat' in sample);
    console.log('   ✅ lng exists:', 'lng' in sample);
  } catch (err) {
    console.log('   ❌ Column check failed:', err.message);
    allGood = false;
  }

  // ================================================================
  // 4. Check Admin Account
  // ================================================================
  console.log('\n👤 4. Checking Admin Account...');

  try {
    const { data: adminCheck, error } = await supabase
      .from('admins')
      .select('id')
      .limit(10);

    if (error) throw error;
    console.log(`   ✅ Admin table accessible: ${adminCheck.length} admin(s)`);
  } catch (err) {
    console.log('   ❌ Admin check failed:', err.message);
    allGood = false;
  }

  // ================================================================
  // 5. Check Prospects Have Data
  // ================================================================
  console.log('\n📞 5. Checking Prospect Data Quality...');

  try {
    const { data: prospects, error } = await supabase
      .from('retailers')
      .select('id, name, phone, store_phone, email, address, place_id, converted')
      .eq('converted', false)
      .limit(5);

    if (error) throw error;

    const withPhone = prospects.filter(p => p.phone || p.store_phone).length;
    const withAddress = prospects.filter(p => p.address).length;
    const withPlaceId = prospects.filter(p => p.place_id).length;

    console.log(`   ✅ Sample prospects: ${prospects.length}`);
    console.log(`   ✅ Have phone: ${withPhone}/${prospects.length}`);
    console.log(`   ✅ Have address: ${withAddress}/${prospects.length}`);
    console.log(`   ✅ Have place_id: ${withPlaceId}/${prospects.length}`);

    if (prospects.length > 0) {
      console.log('\n   📋 Sample Prospect:');
      console.log(`      Name: ${prospects[0].name}`);
      console.log(`      Phone: ${prospects[0].phone || prospects[0].store_phone || 'N/A'}`);
      console.log(`      Address: ${prospects[0].address || 'N/A'}`);
      console.log(`      Place ID: ${prospects[0].place_id || 'N/A'}`);
    }
  } catch (err) {
    console.log('   ❌ Prospect check failed:', err.message);
    allGood = false;
  }

  // ================================================================
  // 6. Check Outreach Tracking
  // ================================================================
  console.log('\n📧 6. Checking Outreach Tracking...');

  try {
    const { count: outreachCount, error } = await supabase
      .from('retailer_outreach')
      .select('*', { count: 'exact', head: true })
      .eq('campaign', 'pet-supplies-plus-2025');

    if (error) throw error;
    console.log(`   ✅ Pet Supplies Plus campaign records: ${outreachCount}`);
  } catch (err) {
    console.log('   ⚠️  Outreach check:', err.message);
  }

  // ================================================================
  // 7. Summary
  // ================================================================
  console.log('\n' + '='.repeat(60));
  console.log('\n📈 VERIFICATION SUMMARY\n');

  try {
    const { count: totalRetailers } = await supabase
      .from('retailers')
      .select('*', { count: 'exact', head: true });

    const { count: prospects } = await supabase
      .from('retailers')
      .select('*', { count: 'exact', head: true })
      .eq('converted', false);

    const { count: converted } = await supabase
      .from('retailers')
      .select('*', { count: 'exact', head: true })
      .eq('converted', true);

    console.log(`Total Retailers: ${totalRetailers}`);
    console.log(`├─ Prospects (not converted): ${prospects}`);
    console.log(`└─ Converted (registered): ${converted}`);

    console.log('\n' + '='.repeat(60));

    if (allGood && prospects > 0) {
      console.log('\n✅ DATABASE IS CORRECTLY CONFIGURED!');
      console.log('\n🚀 You\'re ready to:');
      console.log('   1. View prospects at: http://localhost:3000/admin/stores');
      console.log('   2. Start cold calling your 706 Pet Supplies Plus stores');
      console.log('   3. Test registration flow at: http://localhost:3000/onboard/register');
    } else if (prospects === 0) {
      console.log('\n⚠️  Database configured but NO PROSPECTS found');
      console.log('   Run: node scripts/import_prospects.js');
    } else {
      console.log('\n⚠️  Some issues detected - review errors above');
    }
  } catch (err) {
    console.log('\n❌ Summary check failed:', err.message);
  }

  console.log('');
}

verifyDatabase()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n❌ Verification failed:', err);
    process.exit(1);
  });
