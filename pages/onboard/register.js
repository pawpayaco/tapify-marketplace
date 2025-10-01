import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';

export default function RegisterRetailer() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    storeName: '',
    ownerName: '',
    managerName: '',
    email: '',
    phone: '',
    storeAddress: '',
    expressShipping: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.storeName || !formData.ownerName || !formData.email || !formData.storeAddress) {
        throw new Error('Please fill in all required fields');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      if (!supabase) {
        throw new Error('Database connection not configured. Please contact support.');
      }

      // Insert into retailers table
      // Make sure you've run SCHEMA_UPDATE_retailers.sql to add the new columns
      const { data: retailer, error: insertError } = await supabase
        .from('retailers')
        .insert([
          {
            name: formData.storeName,
            location: formData.storeAddress,
            owner_name: formData.ownerName,
            manager_name: formData.managerName || null,
            email: formData.email,
            phone: formData.phone || null,
            express_shipping: formData.expressShipping,
            onboarding_completed: false,
            onboarding_step: 'registered'
          }
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      // Store retailer ID in session storage for the next step
      if (retailer?.id) {
        sessionStorage.setItem('onboarding_retailer_id', retailer.id);
      }

      // Redirect to Shopify connect page
      router.push('/onboard/shopify-connect');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-block bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white px-6 py-2 rounded-full text-sm font-bold mb-6 shadow-lg">
            🎁 Limited Offer - Free Display
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Claim Your Free Display
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Fill out the form below and we'll ship your NFC display within 5-7 business days. 
            <span className="font-semibold text-gray-900"> No credit card required.</span>
          </p>
        </div>

        {/* Offer Details */}
        <div className="bg-gradient-to-br from-[#fff3ea] to-[#fff6fb] rounded-2xl p-6 mb-8 border-2 border-[#ff6fb3]/20">
          <h3 className="text-lg font-bold text-gray-900 mb-3">✨ What You Get:</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">✓</span>
              <span><strong>Free NFC Display</strong> (worth $299) with 2-4 curated products</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">✓</span>
              <span><strong>Standard Shipping</strong> included (5-7 business days)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">✓</span>
              <span><strong>Dashboard Access</strong> to track scans and earnings</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">✓</span>
              <span><strong>Monthly Product Rotation</strong> to keep things fresh</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#ff6fb3] font-bold mt-0.5">⚡</span>
              <span><strong>Express Shipping Upgrade:</strong> Get it in 2-3 days for just $50</span>
            </li>
          </ul>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Store Name */}
            <div>
              <label htmlFor="storeName" className="block text-sm font-semibold text-gray-700 mb-2">
                Store Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="storeName"
                name="storeName"
                value={formData.storeName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                placeholder="e.g., Urban Goods Market"
              />
            </div>

            {/* Owner & Manager Names - Side by Side */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="ownerName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Owner Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="ownerName"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="managerName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Manager Name
                </label>
                <input
                  type="text"
                  id="managerName"
                  name="managerName"
                  value={formData.managerName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                  placeholder="Jane Smith (optional)"
                />
              </div>
            </div>

            {/* Email & Phone - Side by Side */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                  placeholder="owner@store.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                  placeholder="(555) 123-4567 (optional)"
                />
                <p className="text-xs text-gray-500 mt-1">For shipping updates</p>
              </div>
            </div>

            {/* Store Address */}
            <div>
              <label htmlFor="storeAddress" className="block text-sm font-semibold text-gray-700 mb-2">
                Store Address (Shipping Address) <span className="text-red-500">*</span>
              </label>
              <textarea
                id="storeAddress"
                name="storeAddress"
                value={formData.storeAddress}
                onChange={handleChange}
                required
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all text-gray-900 placeholder-gray-400 resize-none"
                placeholder="123 Main Street&#10;San Francisco, CA 94102&#10;United States"
              />
            </div>

            {/* Express Shipping Option */}
            <div className="bg-gradient-to-r from-[#fff3ea] to-[#fff6fb] rounded-xl p-5 border-2 border-[#ff7a4a]/20">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="expressShipping"
                  checked={formData.expressShipping}
                  onChange={handleChange}
                  className="mt-1 w-5 h-5 text-[#ff6fb3] border-2 border-gray-300 rounded focus:ring-[#ff6fb3] cursor-pointer"
                />
                <div className="flex-1">
                  <div className="font-bold text-gray-900 flex items-center gap-2">
                    ⚡ Add Express Shipping - $50
                    <span className="text-xs bg-[#ff6fb3] text-white px-2 py-0.5 rounded-full">Save 3-4 days</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Get your display in 2-3 business days instead of 5-7 days. 
                    <span className="font-semibold"> Start earning sooner!</span>
                  </p>
                </div>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white py-4 px-6 rounded-xl font-bold text-lg hover:shadow-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <span>Claim My Free Display →</span>
              )}
            </button>

            {/* Terms */}
            <p className="text-xs text-gray-500 text-center">
              By submitting, you agree to receive your free display and marketing emails. 
              <br />
              No spam, unsubscribe anytime. Express shipping is charged separately if selected.
            </p>
          </form>
        </div>

        {/* Back Link */}
        <div className="text-center mt-8">
          <Link href="/onboard" className="text-gray-600 hover:text-gray-900 font-medium">
            ← Back to landing page
          </Link>
        </div>
      </div>
    </div>
  );
}

