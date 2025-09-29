// File: /pages/claim.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ClaimPage() {
  const [uid, setUid] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [affiliateURL, setAffiliateURL] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Grab UID from URL query param (?u=xxxx)
    const urlParams = new URLSearchParams(window.location.search);
    const u = urlParams.get('u');
    if (u) setUid(u);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!businessName || !uid) {
      alert('Missing business name or UID.');
      return;
    }

    // Insert business first
    const { data: bizData, error: bizError } = await supabase
      .from('businesses')
      .insert([{ name: businessName, affiliate_url: affiliateURL, is_claimed: true }])
      .select()
      .single();

    if (bizError) {
      alert('Error saving business: ' + bizError.message);
      return;
    }

    // Update UID → link to business
    const { error: uidError } = await supabase
      .from('uids')
      .update({
        business_id: bizData.id,
        affiliate_url: affiliateURL,
      })
      .eq('uid', uid);

    if (uidError) {
      alert('Error linking UID: ' + uidError.message);
      return;
    }

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fef9f5] to-[#ffe9f0]">
        <div className="text-center p-6 rounded-lg bg-white shadow-md">
          <h1 className="text-2xl text-[#ff60a5] font-semibold mb-2">🎉 You're all set!</h1>
          <p className="text-gray-600">Your display is now live. Customers will be redirected to your affiliate page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fef9f5] to-[#ffe9f0]">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md font-sans"
      >
        <h1 className="text-2xl font-bold text-[#ff60a5] mb-6">Claim Your Display</h1>

        <label className="block mb-4">
          <span className="text-sm text-gray-600">Business Name</span>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="mt-1 w-full border px-3 py-2 rounded-md focus:ring-[#ff60a5] focus:border-[#ff60a5]"
            required
          />
        </label>

        <label className="block mb-6">
          <span className="text-sm text-gray-600">Affiliate URL (Shopify, Etsy, etc.)</span>
          <input
            type="url"
            value={affiliateURL}
            onChange={(e) => setAffiliateURL(e.target.value)}
            placeholder="https://yourstore.com/collection/special"
            className="mt-1 w-full border px-3 py-2 rounded-md focus:ring-[#ff60a5] focus:border-[#ff60a5]"
          />
        </label>

        <button
          type="submit"
          className="bg-[#ff60a5] w-full py-2 text-white font-medium rounded-md hover:bg-[#ff428e] transition"
        >
          Claim Now
        </button>
      </form>
    </div>
  );
}
