import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import AddressInput from '../../components/AddressInput';

export default function ShopifyConnect() {
  const router = useRouter();
  const [priorityShipping, setPriorityShipping] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card', 'paypal', 'applepay'

  const SHOPIFY_STORE_URL = process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL || 'https://yourstore.myshopify.com';
  const PRIORITY_SKU = process.env.NEXT_PUBLIC_PRIORITY_SKU || 'PRIORITY_SHIPPING';
  const FREE_DISPLAY_SKU = process.env.NEXT_PUBLIC_FREE_DISPLAY_SKU || 'FREE_DISPLAY';

  useEffect(() => {
    // Ensure page loads at top
    window.scrollTo(0, 0);
    
    // Load data from session storage (from registration form)
    const savedEmail = sessionStorage.getItem('onboarding_email') || '';
    const savedName = sessionStorage.getItem('onboarding_owner_name') || '';
    const savedPhone = sessionStorage.getItem('onboarding_phone') || '';
    const savedAddress = sessionStorage.getItem('onboarding_address') || '';
    
    // Set address if it exists
    if (savedAddress) {
      setShippingAddress({
        name: savedName,
        email: savedEmail,
        phone: savedPhone,
        address: savedAddress
      });
    } else {
      setShippingAddress(prev => ({
        ...prev,
        name: savedName,
        email: savedEmail,
        phone: savedPhone
      }));
    }

    // Load from database as fallback
    const loadRetailerData = async () => {
      const retailerId = sessionStorage.getItem('onboarding_retailer_id');
      if (retailerId && supabase) {
        const { data, error } = await supabase
          .from('retailers')
          .select('name, email, phone, address, location')
          .eq('id', retailerId)
          .single();

        if (data && !error) {
          // Only fill in missing fields
          setShippingAddress(prev => ({
            name: prev.name || data.name || '',
            email: prev.email || data.email || '',
            phone: prev.phone || data.phone || '',
            address: prev.address || data.address || data.location || ''
          }));
        }
      }
    };
    loadRetailerData();
  }, []);

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (priorityShipping) {
        if (!shippingAddress.name || !shippingAddress.email || !shippingAddress.address) {
          setError('Please fill in all shipping details');
          setLoading(false);
      return;
        }
      }

      // Build Shopify checkout URL
      const cartItems = [];
      
      // Always add free display
      cartItems.push(`${FREE_DISPLAY_SKU}:1`);
      
      // Add priority shipping if selected
      if (priorityShipping) {
        cartItems.push(`${PRIORITY_SKU}:1`);
      }

      // Parse the full address into components for Shopify
      const addressParts = shippingAddress.address.split(',').map(p => p.trim());
      const address1 = addressParts[0] || shippingAddress.address;
      const city = addressParts[1] || '';
      const state = addressParts[2] || '';
      const zip = addressParts[3] || '';

      const checkoutUrl = `${SHOPIFY_STORE_URL}/cart/${cartItems.join(',')}?` + new URLSearchParams({
        'checkout[email]': shippingAddress.email,
        'checkout[shipping_address][first_name]': shippingAddress.name.split(' ')[0] || '',
        'checkout[shipping_address][last_name]': shippingAddress.name.split(' ').slice(1).join(' ') || '',
        'checkout[shipping_address][address1]': address1,
        'checkout[shipping_address][city]': city,
        'checkout[shipping_address][province]': state,
        'checkout[shipping_address][zip]': zip,
        'checkout[shipping_address][phone]': shippingAddress.phone
      });

      // Redirect to Shopify checkout
      window.location.href = checkoutUrl;
      
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Failed to process order. Please try again.');
      setLoading(false);
    }
  };

  const shippingPrice = priorityShipping ? 50 : 0;
  const displayValue = 299;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#faf8f3' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-bold mb-4 shadow-lg"
          >
            🎉 Almost Done! Claim Your Free Display
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-3">
            Complete Your Order
          </h1>
          <p className="text-lg text-gray-600">
            Get your <span className="font-bold text-[#ff6fb3]">${displayValue} Display FREE</span> — just cover shipping
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Shipping Option Selection - Clean & Simple */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden"
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Shipping</h2>
              
              <div className="space-y-4">
                {/* Priority Shipping - Pre-selected */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setPriorityShipping(true)}
                  className={[
                    "w-full p-6 rounded-2xl border-2 transition-all text-left relative",
                    priorityShipping
                      ? "border-[#ff6fb3] bg-gradient-to-br from-pink-50 to-purple-50 shadow-lg ring-4 ring-[#ff6fb3]/20"
                      : "border-gray-300 bg-white hover:border-gray-400 shadow-md"
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {priorityShipping && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 bg-gradient-to-br from-[#ff6fb3] to-purple-600 rounded-full flex items-center justify-center flex-shrink-0"
                          >
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </motion.div>
                        )}
                        <span className="text-2xl">🚀</span>
                        <h3 className="text-xl font-bold text-gray-900">Priority Shipping</h3>
                        <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        RECOMMENDED
                      </span>
                    </div>
                      <p className="text-gray-600 font-medium mb-3">Get your display in 2-3 business days</p>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Start earning faster
                      </li>
                        <li className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Full tracking & insurance
                      </li>
                        <li className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Priority customer support
                      </li>
                    </ul>
                  </div>
                    <div className="text-center flex-shrink-0">
                      <div className="text-4xl font-black text-gray-900 mb-1">${shippingPrice}</div>
                      <div className="text-sm text-gray-500 font-medium">one-time</div>
                    </div>
                  </div>
                </motion.button>

                {/* Standard Shipping */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setPriorityShipping(false)}
                  className={[
                    "w-full p-6 rounded-2xl border-2 transition-all text-left relative",
                    !priorityShipping
                      ? "border-[#ff6fb3] bg-gradient-to-br from-pink-50 to-purple-50 shadow-lg ring-4 ring-[#ff6fb3]/20"
                      : "border-gray-300 bg-white hover:border-gray-400 shadow-md"
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {!priorityShipping && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 bg-gradient-to-br from-[#ff6fb3] to-purple-600 rounded-full flex items-center justify-center flex-shrink-0"
                          >
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </motion.div>
                        )}
                        <span className="text-2xl">📦</span>
                        <h3 className="text-xl font-bold text-gray-900">Standard Shipping</h3>
                      </div>
                      <p className="text-gray-600 font-medium mb-2">Arrives in 5-7 business days</p>
                      <p className="text-sm text-gray-500">Basic tracking included</p>
                </div>
                    <div className="text-center flex-shrink-0">
                      <div className="text-4xl font-black text-green-600 mb-1">FREE</div>
                      <div className="text-sm text-gray-500 font-medium">no charge</div>
                  </div>
                  </div>
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Shipping Address - Only show if priority selected */}
          <AnimatePresence>
            {priorityShipping && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
          </div>
                    <h2 className="text-2xl font-bold text-gray-900">Shipping Address</h2>
                  </div>

                  <div className="space-y-6">
                    {/* Full Name */}
                  <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.name}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent"
                        placeholder="John Smith"
                        required
                      />
                </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={shippingAddress.email}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, email: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent"
                        placeholder="john@example.com"
                        required
                      />
                  </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={shippingAddress.phone}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent"
                        placeholder="(555) 123-4567"
                      />
                  </div>

                    {/* Address with Google Maps + USPS Validation */}
                    <AddressInput
                      value={shippingAddress.address}
                      onChange={(address) => setShippingAddress({ ...shippingAddress, address })}
                      onValidated={(validated) => {
                        // When USPS validates, use the full standardized address
                        const fullAddress = [
                          validated.address1,
                          validated.address2,
                          validated.city,
                          validated.state,
                          validated.zip5
                        ].filter(Boolean).join(', ');
                        setShippingAddress({ ...shippingAddress, address: fullAddress });
                      }}
                      required={true}
                      googleApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                      label="Shipping Address"
                      className="mb-0"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Payment Section - Only show if priority selected */}
          <AnimatePresence>
            {priorityShipping && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Payment Method</h2>
                  </div>

                  <div className="space-y-6">
                    {/* Payment Method Selection */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-4">
                        Choose Payment Method
                      </label>
                      <div className="grid grid-cols-3 gap-4">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => setPaymentMethod('card')}
                          className={[
                            "p-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3",
                            paymentMethod === 'card'
                              ? "border-[#ff6fb3] bg-gradient-to-br from-pink-50 to-purple-50 shadow-lg"
                              : "border-gray-200 hover:border-gray-300 bg-white"
                          ].join(" ")}
                        >
                          {paymentMethod === 'card' && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-3 right-3 w-6 h-6 bg-gradient-to-br from-[#ff6fb3] to-purple-600 rounded-full flex items-center justify-center"
                            >
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </motion.div>
                          )}
                          <svg className="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          <span className="text-sm font-bold">Credit Card</span>
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => setPaymentMethod('paypal')}
                          className={[
                            "p-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 relative",
                            paymentMethod === 'paypal'
                              ? "border-[#ff6fb3] bg-gradient-to-br from-pink-50 to-purple-50 shadow-lg"
                              : "border-gray-200 hover:border-gray-300 bg-white"
                          ].join(" ")}
                        >
                          {paymentMethod === 'paypal' && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-3 right-3 w-6 h-6 bg-gradient-to-br from-[#ff6fb3] to-purple-600 rounded-full flex items-center justify-center"
                            >
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </motion.div>
                          )}
                          <div className="text-3xl font-bold text-[#003087]">PayPal</div>
                          <span className="text-sm font-bold">PayPal</span>
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => setPaymentMethod('applepay')}
                          className={[
                            "p-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 relative",
                            paymentMethod === 'applepay'
                              ? "border-[#ff6fb3] bg-gradient-to-br from-pink-50 to-purple-50 shadow-lg"
                              : "border-gray-200 hover:border-gray-300 bg-white"
                          ].join(" ")}
                        >
                          {paymentMethod === 'applepay' && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-3 right-3 w-6 h-6 bg-gradient-to-br from-[#ff6fb3] to-purple-600 rounded-full flex items-center justify-center"
                            >
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </motion.div>
                          )}
                          <div className="text-3xl">🍎</div>
                          <span className="text-sm font-bold">Apple Pay</span>
                        </motion.button>
                      </div>
                    </div>

                    {/* Security Notice */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-100">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">🔒 Secure Checkout via Shopify</h3>
                          <p className="text-sm text-gray-700 mb-3">
                            You'll be redirected to our secure Shopify checkout to complete your payment. 
                            We accept all major credit cards, PayPal, Apple Pay, Google Pay, and more.
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              SSL Encrypted
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              PCI Compliant
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Money-Back Guarantee
                            </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                {/* Free Display */}
                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🎁</span>
                <div>
                      <p className="font-bold text-white">NFC Tap Display</p>
                      <p className="text-sm text-gray-400">$299 Value • 2-4 Products</p>
                </div>
              </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-400">FREE</div>
                    <div className="text-xs text-gray-400 line-through">${displayValue}</div>
              </div>
                </div>

                {/* Shipping */}
                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{priorityShipping ? '🚀' : '📦'}</span>
                <div>
                      <p className="font-bold text-white">
                        {priorityShipping ? 'Priority Shipping' : 'Standard Shipping'}
                      </p>
                      <p className="text-sm text-gray-400">
                        {priorityShipping ? '2-3 business days' : '5-7 business days'}
                      </p>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-white">
                    {priorityShipping ? `$${shippingPrice}` : 'FREE'}
                </div>
                </div>
              </div>

              {/* Total */}
              <div className="bg-gradient-to-r from-[#ff6fb3] to-purple-600 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-white">Total Today</span>
                  <span className="text-3xl font-black text-white">${shippingPrice}</span>
                </div>
                <p className="text-xs text-white/80 mt-2">
                  🎉 You're saving ${displayValue}! Display value not included.
                </p>
              </div>

              {/* Place Order Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePlaceOrder}
                  disabled={loading}
                className="w-full bg-white text-gray-900 py-5 rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-900 border-t-transparent"></div>
                      Processing...
                  </>
                ) : (
                  <>
                    <span>Complete Order</span>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </motion.button>

              <p className="text-xs text-gray-400 text-center mt-4">
                🔒 Secure checkout powered by Shopify
              </p>
            </div>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3"
            >
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800 font-medium">{error}</span>
            </motion.div>
          )}

          {/* Trust Badges */}
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center justify-center gap-8 flex-wrap">
              <div className="flex items-center gap-2 text-gray-600">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
                <span className="text-sm font-bold">Secure Checkout</span>
          </div>
              <div className="flex items-center gap-2 text-gray-600">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
                <span className="text-sm font-bold">Money-Back Guarantee</span>
          </div>
              <div className="flex items-center gap-2 text-gray-600">
            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
            </svg>
                <span className="text-sm font-bold">24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
