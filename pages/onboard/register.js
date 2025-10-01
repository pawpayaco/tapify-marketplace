import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';
import { motion } from 'framer-motion';

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

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0]
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full blur-3xl opacity-30"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0]
          }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full blur-3xl opacity-30"
        />
      </div>

      {/* Desktop: Two-column layout, Mobile: Single column */}
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* LEFT COLUMN - Info (Sticky on desktop) */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:sticky lg:top-8"
          >
            {/* Header */}
            <div className="text-center lg:text-left mb-10">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-block bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white px-6 py-2 rounded-full text-sm font-bold mb-6 shadow-lg"
              >
                🎁 Limited Offer - Free Display
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight"
              >
                Claim Your Free Display
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-xl text-gray-600"
              >
                Fill out the form and we'll ship your NFC display within 5-7 business days. 
                <span className="font-semibold text-gray-900"> No credit card required.</span>
              </motion.p>
            </div>

            {/* Offer Details */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-[#fff3ea] to-[#fff6fb] rounded-3xl p-8 border-2 border-[#ff6fb3]/20 shadow-xl"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-2xl">✨</span>
                What You Get:
              </h3>
              <motion.ul 
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-4 text-gray-700"
              >
                {[
                  { icon: '✓', color: 'text-green-600', text: '<strong>Free NFC Display</strong> (worth $299) with 2-4 curated products' },
                  { icon: '✓', color: 'text-green-600', text: '<strong>Standard Shipping</strong> included (5-7 business days)' },
                  { icon: '✓', color: 'text-green-600', text: '<strong>Dashboard Access</strong> to track scans and earnings' },
                  { icon: '✓', color: 'text-green-600', text: '<strong>Monthly Product Rotation</strong> to keep things fresh' },
                  { icon: '⚡', color: 'text-[#ff6fb3]', text: '<strong>Express Shipping Upgrade:</strong> Get it in 2-3 days for just $50' }
                ].map((item, idx) => (
                  <motion.li 
                    key={idx}
                    variants={fadeInUp}
                    className="flex items-start gap-3"
                  >
                    <span className={`${item.color} font-bold text-2xl mt-0.5`}>{item.icon}</span>
                    <span dangerouslySetInnerHTML={{ __html: item.text }} />
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
          </motion.div>

          {/* RIGHT COLUMN - Registration Form */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-3xl shadow-2xl p-8 lg:p-10 border-2 border-gray-100"
          >
            {/* Form Header */}
            <div className="mb-8 pb-6 border-b-2 border-gray-100">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Registration Form</h2>
              <p className="text-gray-600">Fill in your store details below</p>
            </div>

            <motion.form 
              onSubmit={handleSubmit}
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              {/* Store Name */}
              <motion.div variants={fadeInUp}>
                <label htmlFor="storeName" className="block text-sm font-bold text-gray-700 mb-2">
                  Store Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="storeName"
                  name="storeName"
                  value={formData.storeName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all text-gray-900 placeholder-gray-400 hover:border-gray-300"
                  placeholder="e.g., Urban Goods Market"
                />
              </motion.div>

              {/* Owner & Manager Names - Side by Side */}
              <motion.div variants={fadeInUp} className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="ownerName" className="block text-sm font-bold text-gray-700 mb-2">
                    Owner Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="ownerName"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all text-gray-900 placeholder-gray-400 hover:border-gray-300"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="managerName" className="block text-sm font-bold text-gray-700 mb-2">
                    Manager Name
                  </label>
                  <input
                    type="text"
                    id="managerName"
                    name="managerName"
                    value={formData.managerName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all text-gray-900 placeholder-gray-400 hover:border-gray-300"
                    placeholder="Jane Smith (optional)"
                  />
                </div>
              </motion.div>

              {/* Email & Phone - Side by Side */}
              <motion.div variants={fadeInUp} className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all text-gray-900 placeholder-gray-400 hover:border-gray-300"
                    placeholder="owner@store.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-bold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all text-gray-900 placeholder-gray-400 hover:border-gray-300"
                    placeholder="(555) 123-4567 (optional)"
                  />
                  <p className="text-xs text-gray-500 mt-1">For shipping updates</p>
                </div>
              </motion.div>

              {/* Store Address */}
              <motion.div variants={fadeInUp}>
                <label htmlFor="storeAddress" className="block text-sm font-bold text-gray-700 mb-2">
                  Store Address (Shipping Address) <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="storeAddress"
                  name="storeAddress"
                  value={formData.storeAddress}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all text-gray-900 placeholder-gray-400 resize-none hover:border-gray-300"
                  placeholder="123 Main Street&#10;San Francisco, CA 94102&#10;United States"
                />
              </motion.div>

              {/* Express Shipping Option */}
              <motion.div 
                variants={fadeInUp}
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-r from-[#fff3ea] to-[#fff6fb] rounded-2xl p-6 border-2 border-[#ff7a4a]/20 shadow-lg"
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="expressShipping"
                    checked={formData.expressShipping}
                    onChange={handleChange}
                    className="mt-1 w-5 h-5 text-[#ff6fb3] border-2 border-gray-300 rounded focus:ring-[#ff6fb3] cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                      ⚡ Add Express Shipping - $50
                      <span className="text-xs bg-[#ff6fb3] text-white px-3 py-1 rounded-full font-bold">Save 3-4 days</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Get your display in 2-3 business days instead of 5-7 days. 
                      <span className="font-semibold"> Start earning sooner!</span>
                    </p>
                  </div>
                </label>
              </motion.div>

              {/* Error Message */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-2 shadow-lg"
                >
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{error}</span>
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.button
                variants={fadeInUp}
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white py-4 px-6 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
              </motion.button>

              {/* Terms */}
              <motion.p 
                variants={fadeInUp}
                className="text-xs text-gray-500 text-center"
              >
                By submitting, you agree to receive your free display and marketing emails. 
                <br />
                No spam, unsubscribe anytime. Express shipping is charged separately if selected.
              </motion.p>
            </motion.form>
          </motion.div>
        </div>

        {/* Back Link - Below everything */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center mt-12"
        >
          <Link href="/onboard" className="text-gray-600 hover:text-gray-900 font-bold inline-flex items-center gap-2 hover:gap-3 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to landing page
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
