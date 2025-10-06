// ================================================================
// CSV PROSPECT IMPORT SCRIPT
// ================================================================
// Purpose: Import 750 Pet Supplies Plus locations from CSV
//          into retailers + retailer_outreach tables
//
// Run after MIGRATION_SCRIPT.sql completes
// Usage: node scripts/import_prospects.js
// ================================================================

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Supabase connection
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ================================================================
// CSV PARSING HELPER
// ================================================================

function parseCSV(csvContent) {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values = parseCSVLine(lines[i]);
    const row = {};

    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || null;
    });

    rows.push(row);
  }

  return rows;
}

// Handle quoted CSV values
function parseCSVLine(line) {
  const values = [];
  let currentValue = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      values.push(currentValue);
      currentValue = '';
    } else {
      currentValue += char;
    }
  }

  values.push(currentValue);
  return values;
}

// ================================================================
// MAIN IMPORT FUNCTION
// ================================================================

async function importProspects() {
  console.log('🚀 Starting CSV prospect import...\n');

  // Read CSV file
  const csvPath = './sotres_enricheddddd.csv';
  console.log(`📂 Reading CSV from: ${csvPath}`);

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(csvContent);

  console.log(`✅ Parsed ${rows.length} rows from CSV\n`);

  // Transform CSV rows into retailer records
  const retailers = rows.map(row => ({
    name: row.name,
    address: row.formatted_address || row.address,
    place_id: row.place_id,
    lat: row.lat ? parseFloat(row.lat) : null,
    lng: row.lng ? parseFloat(row.lng) : null,
    store_phone: row.formatted_phone_number,
    store_website: row.website,
    source: 'google-maps-scrape',
    converted: false,
    created_at: new Date().toISOString()
  }));

  console.log('📊 Sample retailer record:');
  console.log(JSON.stringify(retailers[0], null, 2));
  console.log('');

  // Insert retailers in batches (Supabase has limits)
  const BATCH_SIZE = 100;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < retailers.length; i += BATCH_SIZE) {
    const batch = retailers.slice(i, i + BATCH_SIZE);

    console.log(`📦 Inserting batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(retailers.length / BATCH_SIZE)} (${batch.length} records)...`);

    const { data, error } = await supabase
      .from('retailers')
      .insert(batch)
      .select('id, name');

    if (error) {
      console.error('❌ Batch insert error:', error.message);
      errors += batch.length;
    } else {
      inserted += data.length;
      console.log(`✅ Inserted ${data.length} retailers`);

      // Create corresponding retailer_outreach records
      const outreachRecords = data.map(retailer => ({
        retailer_id: retailer.id,
        campaign: 'pet-supplies-plus-2025',
        channel: 'cold-call',
        email_sent: false,
        contacted: false,
        registered: false,
        notes: `Prospect imported from Google Maps scrape - ${retailer.name}`,
        created_at: new Date().toISOString()
      }));

      const { error: outreachError } = await supabase
        .from('retailer_outreach')
        .insert(outreachRecords);

      if (outreachError) {
        console.warn('⚠️  Outreach insert warning:', outreachError.message);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📈 IMPORT SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total CSV rows: ${rows.length}`);
  console.log(`✅ Successfully inserted: ${inserted}`);
  console.log(`❌ Errors: ${errors}`);
  console.log('='.repeat(60));

  // Verify final counts
  const { count: retailerCount } = await supabase
    .from('retailers')
    .select('*', { count: 'exact', head: true });

  const { count: outreachCount } = await supabase
    .from('retailer_outreach')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📊 Database totals after import:`);
  console.log(`   Retailers: ${retailerCount}`);
  console.log(`   Outreach records: ${outreachCount}`);

  console.log('\n✨ Import complete!\n');
}

// ================================================================
// RUN IMPORT
// ================================================================

importProspects()
  .then(() => {
    console.log('✅ Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
