import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { verifyPriorityDisplay } from '../../lib/client/verifyPriorityDisplay';
import { useToast } from '../../context/ui/useToast';

export default function ShopifyConnect() {
  const router = useRouter();
  const { toast, Toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [priorityDisplayActive, setPriorityDisplayActive] = useState(false);
  const [priorityDisplayConfirmed, setPriorityDisplayConfirmed] = useState(false);
  const [retailerUid, setRetailerUid] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.scrollTo(0, 0);

    const loadRetailerData = async () => {
      if (!supabase) return;

      // First, check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error('[shopify-connect] Not authenticated:', authError);
        // Redirect to login if not authenticated
        router.push('/login?message=Please log in to continue your registration');
        return;
      }

      // Get retailer ID from either sessionStorage OR from database via user ID
      let retailerId = sessionStorage.getItem('onboarding_retailer_id');

      if (!retailerId) {
        console.log('[shopify-connect] No retailer_id in sessionStorage, looking up by user_id');

        // Look up retailer by created_by_user_id
        const { data: retailerLookup, error: lookupError } = await supabase
          .from('retailers')
          .select('id')
          .eq('created_by_user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lookupError || !retailerLookup) {
          console.error('[shopify-connect] Could not find retailer for user:', lookupError);
          setError('We could not find your registration. Please contact support or try registering again.');
          return;
        }

        retailerId = retailerLookup.id;
        // Store it for future use
        sessionStorage.setItem('onboarding_retailer_id', retailerId);
        sessionStorage.setItem('onboarding_email', user.email);
      }

      try {
        // Load retailer data
        const { data: retailerData, error: retailerError } = await supabase
          .from('retailers')
          .select('id, name, email, phone, priority_display_active')
          .eq('id', retailerId)
          .single();

        if (retailerError || !retailerData) {
          console.error('Error loading retailer:', retailerError);
          return;
        }

        // Get retailer's UID - Try claimed first, then any UID
        let { data: uidData } = await supabase
          .from('uids')
          .select('uid')
          .eq('retailer_id', retailerId)
          .eq('is_claimed', true)
          .limit(1)
          .maybeSingle();

        // If no claimed UID, check for any UID assigned to this retailer
        if (!uidData) {
          const { data: anyUidData } = await supabase
            .from('uids')
            .select('uid')
            .eq('retailer_id', retailerId)
            .limit(1)
            .maybeSingle();

          uidData = anyUidData;
        }

        if (uidData) {
          setRetailerUid(uidData.uid);
        }

        // Verify priority display status
        const isActive = await verifyPriorityDisplay(storedRetailerId);
        setPriorityDisplayActive(isActive);

        // If not active in retailer record but found in orders, sync it
        if (!isActive) {
          const { data: orderData } = await supabase
            .from('orders')
            .select('is_priority_display')
            .eq('retailer_id', storedRetailerId)
            .eq('is_priority_display', true)
            .maybeSingle();

          if (orderData) {
            setPriorityDisplayActive(true);

            // Update retailer record if not already marked
            if (!retailerData.priority_display_active) {
              await supabase
                .from('retailers')
                .update({ priority_display_active: true })
                .eq('id', storedRetailerId);
            }
          }
        }
      } catch (err) {
        console.error('Error loading retailer data:', err);
      }
    };

    loadRetailerData();

    // Check for Shopify return parameters
    const checkShopifyReturn = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const success = urlParams.get('success');
      const shopifyConfirmed = urlParams.get('shopify_confirmed');
      const orderConfirmed = urlParams.get('order_confirmed');

      // Detect Shopify redirect after checkout
      if (success === '1' || shopifyConfirmed === 'true' || orderConfirmed === 'true') {
        setPriorityDisplayConfirmed(true);
        toast('🎉 Display upgrade ordered successfully!');

        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);

        // Redirect to dashboard after short delay
        setTimeout(() => {
          router.push('/onboard/dashboard');
        }, 2000);
      }
    };

    checkShopifyReturn();
  }, [router, toast]);

  const handlePriorityDisplayUpgrade = () => {
    const storedRetailerId = sessionStorage.getItem('onboarding_retailer_id');

    if (!storedRetailerId) {
      setError('Please complete your registration first.');
      return;
    }

    // Use UID if available, otherwise use retailer_id as fallback
    // The webhook will handle both UID-based and retailer_id-based attribution
    const attributionRef = retailerUid || `retailer-${storedRetailerId}`;

    // Redirect to Shopify Priority Display product with retailer attribution
    const shopifyUrl = `https://pawpayaco.com/products/priority-display?ref=${attributionRef}`;

    // Open Shopify in new tab
    window.open(shopifyUrl, '_blank');

    toast('Opening Shopify checkout... Complete your order and return here!');
  };

  const handleClaimAndFinish = async () => {
    setLoading(true);
    setError('');

    try {
      if (typeof window === 'undefined') {
        throw new Error('Client context unavailable');
      }

      let retailerId = window.sessionStorage.getItem('onboarding_retailer_id');

      // If no retailer ID in sessionStorage, look it up from the authenticated user
      if (!retailerId) {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          setError('Please log in to continue your registration.');
          setLoading(false);
          return;
        }

        const { data: retailerLookup, error: lookupError } = await supabase
          .from('retailers')
          .select('id')
          .eq('created_by_user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lookupError || !retailerLookup) {
          setError('We could not find your onboarding record. Please contact support.');
          setLoading(false);
          return;
        }

        retailerId = retailerLookup.id;
        sessionStorage.setItem('onboarding_retailer_id', retailerId);
        sessionStorage.setItem('onboarding_email', user.email);
      }

      const actorId = window.sessionStorage.getItem('onboarding_email');

      const response = await fetch('/api/onboard/confirm-display', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          retailerId,
          shippingOption: 'standard',
          actorId
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message = payload?.error || 'We could not complete your setup. Please try again.';
        throw new Error(message);
      }

      toast('✅ Setup complete! Redirecting to dashboard...');

      // Redirect to dashboard
      setTimeout(() => {
        router.push('/onboard/dashboard');
      }, 1000);

    } catch (setupError) {
      console.error('Claim and finish error:', setupError);
      const fallbackMessage = 'Something went wrong completing your onboarding. Try again.';
      if (setupError?.message && setupError.message !== 'Client context unavailable') {
        setError(setupError.message);
      } else {
        setError(fallbackMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#faf8f3' }}>
      <Toast />

      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFF3E8] to-transparent h-[400px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg mb-6">
            <span>Final Step</span>
            <span className="text-xs uppercase tracking-wider">Complete Your Setup</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
            Ready to Launch Your Display?
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Choose to upgrade to Priority Display for premium placement, or continue with the free standard display.
          </p>
        </motion.div>

        {/* Priority Display Success Message */}
        <AnimatePresence>
          {priorityDisplayConfirmed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-3xl p-6 shadow-xl mb-8"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-green-900 mb-2">
                    ✅ Priority Display Upgrade Confirmed
                  </h3>
                  <p className="text-green-800 mb-3">
                    Your Priority Display upgrade has been processed! You'll see the status in your dashboard.
                  </p>
                  <p className="text-sm text-green-700">
                    Redirecting to dashboard...
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Priority Display Upgrade Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-3xl border-2 border-gray-100 shadow-xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] p-6">
              <div className="flex items-center gap-3 text-white">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-3xl">
                  💎
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Priority Display</h2>
                  <p className="text-white/90 text-sm">Premium marketplace placement</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {priorityDisplayActive ? (
                <div className="flex items-center gap-3 p-4 bg-green-50 border-2 border-green-200 rounded-2xl mb-4">
                  <svg className="w-8 h-8 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-bold text-green-900">Already Active!</p>
                    <p className="text-sm text-green-700">You have Priority Display</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <p className="text-3xl font-black text-gray-900 mb-2">$50</p>
                    <p className="text-gray-700 text-sm mb-4">
                      Get featured placement in our marketplace for maximum visibility and sales.
                    </p>
                  </div>

                  <div className="space-y-2 mb-6">
                    <h3 className="font-semibold text-gray-900">Benefits:</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center gap-2">
                        <span className="text-green-500 font-bold">✓</span>
                        Featured marketplace placement
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500 font-bold">✓</span>
                        3x more customer visibility
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500 font-bold">✓</span>
                        Higher conversion rates
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500 font-bold">✓</span>
                        One-time payment
                      </li>
                    </ul>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePriorityDisplayUpgrade}
                    className="w-full px-6 py-4 bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white font-bold text-lg rounded-2xl hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>💎</span>
                    <span>Upgrade Display ($50)</span>
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>

          {/* Claim & Finish Setup Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white rounded-3xl border-2 border-gray-100 shadow-xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
              <div className="flex items-center gap-3 text-white">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-3xl">
                  ✅
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Standard Display</h2>
                  <p className="text-white/90 text-sm">Free display with standard shipping</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <p className="text-3xl font-black text-gray-900 mb-2">FREE</p>
                <p className="text-gray-700 text-sm mb-4">
                  Get your free Tapify display and start earning commissions from day one.
                </p>
              </div>

              <div className="space-y-2 mb-6">
                <h3 className="font-semibold text-gray-900">Includes:</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500 font-bold">✓</span>
                    Free premium display hardware
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500 font-bold">✓</span>
                    NFC & QR codes programmed
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500 font-bold">✓</span>
                    Performance tracking dashboard
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500 font-bold">✓</span>
                    Automated commission payouts
                  </li>
                </ul>
              </div>

              <motion.button
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                onClick={handleClaimAndFinish}
                disabled={loading}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-lg rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Setting up...</span>
                  </>
                ) : (
                  <>
                    <span>✅</span>
                    <span>Claim & Finish Setup</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 text-center mb-6"
            >
              <p className="text-red-800 font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 border-2 border-white/60 rounded-3xl p-6 shadow-lg"
        >
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              🚀 Your Display is Ready
            </h3>
            <p className="text-gray-700 mb-4">
              Both options include full access to your Tapify dashboard where you can track scans, orders, revenue, and payouts in real-time.
            </p>
            <p className="text-sm text-gray-600">
              You can upgrade to Priority Display anytime from your dashboard settings.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
