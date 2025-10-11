#!/usr/bin/env node

/**
 * Creates the Pawpaya vendor record if it doesn't exist
 */

import { supabaseAdmin } from '../lib/supabase.js';

async function createPawpayaVendor() {
  console.log('Checking for Pawpaya vendor...');

  // Check if vendor already exists
  const { data: existing } = await supabaseAdmin
    .from('vendors')
    .select('id, name')
    .eq('name', 'Pawpaya')
    .maybeSingle();

  if (existing) {
    console.log('✅ Pawpaya vendor already exists:', existing.id);
    return existing.id;
  }

  // Create vendor
  console.log('Creating Pawpaya vendor...');
  const { data, error } = await supabaseAdmin
    .from('vendors')
    .insert({
      name: 'Pawpaya',
      email: 'vendors@pawpayaco.com',
      phone: '(715) 979-1259',
      description: 'Pawpaya Collar Co. - Matching friendship collars and bracelets',
      is_active: true,
    })
    .select('id')
    .single();

  if (error) {
    console.error('❌ Failed to create vendor:', error.message);
    throw error;
  }

  console.log('✅ Pawpaya vendor created:', data.id);
  return data.id;
}

createPawpayaVendor()
  .then((id) => {
    console.log('\n✅ Done! Vendor ID:', id);
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Error:', err);
    process.exit(1);
  });
