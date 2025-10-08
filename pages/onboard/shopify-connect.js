import { useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ShopifyConnect() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen pt-20" style={{ backgroundColor: '#FFF1E6' }}>
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Success Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="text-6xl mb-4">🐾</div>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-4">
            Success! Your Display Order Is Being Processed
          </h1>
          <p className="text-xl text-gray-700">
            Your free Pawpaya display will ship within 5-7 days.
          </p>
        </motion.div>

        {/* Offer Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl border-2 mb-8"
          style={{ borderColor: '#FF8FCF' }}
        >
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
            Upgrade to Priority Shipping for Just $50
          </h2>
          <p className="text-lg text-gray-700 mb-6">
            Get your display before Black Friday and start earning 4× faster.
            Priority shipping means early arrival and maximum ROI during the busiest shopping season.
          </p>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200 mb-8">
            <h3 className="font-black text-xl text-gray-900 mb-3">Priority Benefits:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>2-3 day delivery (vs. 5-7 days standard)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Arrives before Black Friday rush</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Start earning commissions sooner</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Priority placement in our marketplace</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePriorityUpgrade}
              className="flex-1 py-4 rounded-2xl font-black text-lg text-white shadow-xl"
              style={{ background: 'linear-gradient(to right, #FFA08A, #FF8FCF)' }}
            >
              Upgrade for $50 →
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSkipToDashboard}
              disabled={loading}
              className="flex-1 py-4 rounded-2xl font-bold text-lg bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Skip & Continue to Dashboard'}
            </motion.button>
          </div>
        </motion.div>

        {/* Final Reassurance */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-gray-600"
        >
          <p className="mb-4">
            Either way, you're all set! We'll send tracking info to your email as soon as your display ships.
          </p>
          <p className="font-bold text-gray-900">
            Welcome to the Tapify network. 🎉
          </p>
        </motion.div>
      </div>
    </div>
  );
}
