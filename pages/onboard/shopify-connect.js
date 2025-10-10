import { useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ShopifyConnect() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(true);

  const handlePriorityUpgrade = () => {
    // Open Shopify in new tab
    window.open('https://pawpayaco.com/products/priority-display', '_blank');
  };

  const handleSkipToDashboard = async () => {
    setLoading(true);

    // Confirm standard display
    try {
      const retailerId = sessionStorage.getItem('onboarding_retailer_id');
      if (!retailerId) {
        router.push('/onboard/dashboard');
        return;
      }

      await fetch('/api/onboard/confirm-display', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          retailerId,
          shippingOption: 'standard'
        })
      });

      router.push('/onboard/dashboard');
    } catch (error) {
      console.error('Error confirming display:', error);
      router.push('/onboard/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pt-24 md:pt-28 pb-16">
      {/* Success Modal Popup */}
      {showSuccessModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4"
          onClick={() => setShowSuccessModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Success Content */}
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-black mb-2 leading-tight">
                <span style={{ background: 'linear-gradient(to right, #FFA08A, #FF8FCF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Success!
                </span>
              </h1>
              <h2 className="text-2xl font-black text-gray-900 mb-4">
                Your Display Order Is Being Processed
              </h2>
              <p className="text-base text-gray-700 font-medium mb-6">
                Your free Pawpaya display will ship within 5-7 days.
              </p>

              {/* OK Button */}
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowSuccessModal(false)}
                className="px-8 py-3 rounded-2xl font-black text-lg text-white shadow-lg"
                style={{ background: 'linear-gradient(to right, #FFA08A, #FF8FCF)' }}
              >
                Got it! →
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 md:pb-16">
        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-12">

          {/* LEFT COLUMN - Priority Upgrade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-3xl p-8 md:p-10"
          >
            <div className="mb-6">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
                Upgrade to{' '}
                <span style={{ background: 'linear-gradient(to right, #FFA08A, #FF8FCF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Priority Shipping
                </span>{' '}
                for Just $50
              </h2>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                Basically, if you think you can sell more than 5 collars or DIY kits in the span of 4 weeks, which includes black friday, then this is a no brainer to add extra profit for the month.
              </p>
            </div>

            <div className="rounded-2xl p-6 mb-8" style={{ background: 'linear-gradient(135deg, #FFF5F0 0%, #FFF0F8 100%)' }}>
              <h3 className="font-black text-lg text-gray-900 mb-4">Priority Benefits:</h3>
              <ul className="space-y-3 text-gray-700 text-sm md:text-base">
                <li className="flex items-start gap-3">
                  <span className="font-bold text-xl flex-shrink-0" style={{ color: '#FF8FCF' }}>✓</span>
                  <span>2-3 day delivery (vs. 5-7 days standard)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold text-xl flex-shrink-0" style={{ color: '#FF8FCF' }}>✓</span>
                  <span>Arrives before Black Friday rush</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold text-xl flex-shrink-0" style={{ color: '#FF8FCF' }}>✓</span>
                  <span>Start earning commissions sooner</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold text-xl flex-shrink-0" style={{ color: '#FF8FCF' }}>✓</span>
                  <span>Priority placement in our marketplace</span>
                </li>
              </ul>
            </div>

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePriorityUpgrade}
              className="w-full py-4 rounded-2xl font-black text-lg text-white shadow-lg"
              style={{ background: 'linear-gradient(to right, #FFA08A, #FF8FCF)' }}
            >
              Upgrade for $50 →
            </motion.button>
          </motion.div>

          {/* RIGHT COLUMN - Skip to Dashboard */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-3xl p-8 md:p-10"
          >
            <div className="mb-6">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
                Continue with Standard Shipping
              </h2>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-6">
                Your display will arrive in 5-7 business days with free standard shipping.
                You'll still get all the benefits of the Pawpaya program.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-8">
              <h3 className="font-black text-lg text-gray-900 mb-4">What's Included:</h3>
              <ul className="space-y-3 text-gray-700 text-sm md:text-base">
                <li className="flex items-start gap-3">
                  <span className="text-gray-600 font-bold text-xl flex-shrink-0">✓</span>
                  <span>Free premium NFC display</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gray-600 font-bold text-xl flex-shrink-0">✓</span>
                  <span>Free standard shipping (5-7 days)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gray-600 font-bold text-xl flex-shrink-0">✓</span>
                  <span>Full commission tracking</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gray-600 font-bold text-xl flex-shrink-0">✓</span>
                  <span>Access to retailer dashboard</span>
                </li>
              </ul>
            </div>

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSkipToDashboard}
              disabled={loading}
              className="w-full py-4 rounded-2xl font-bold text-lg bg-gray-900 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </span>
              ) : 'Skip & Continue to Dashboard'}
            </motion.button>
          </motion.div>
        </div>

        {/* Final Reassurance */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <div className="bg-white rounded-2xl p-6 shadow-md inline-block">
            <p className="text-gray-600 text-base md:text-lg mb-2">
              Either way, you're all set! We'll send tracking info to your email as soon as your display ships.
            </p>
            <p className="font-black text-gray-900 text-lg md:text-xl">
              Welcome to the Tapify network. 🎉
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
