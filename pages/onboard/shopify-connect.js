import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthContext } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export default function ShopifyConnect() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const [prioritySelected, setPrioritySelected] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [shippingData, setShippingData] = useState({
    email: '',
    storeName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    phone: ''
  });

  const SHOPIFY_STORE_URL = process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL || 'https://yourstore.myshopify.com';
  const PRIORITY_SKU = process.env.NEXT_PUBLIC_PRIORITY_SKU || '12345678';

  // Check if auth is disabled for testing
  const disableAuth = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

  useEffect(() => {
    // Skip auth check if auth is disabled
    if (disableAuth) {
      console.log('🚧 Auth disabled - allowing access to shopify-connect');
      return;
    }

    if (!authLoading && !user) {
      // Redirect to login with return URL
      router.push(`/login?redirect=/onboard/shopify-connect`);
    }
  }, [user, authLoading, router, disableAuth]);

  useEffect(() => {
    if (user?.email) {
      setShippingData(prev => ({ ...prev, email: user.email }));
    } else if (disableAuth) {
      // If auth is disabled, use a placeholder email
      setShippingData(prev => ({ ...prev, email: 'test@example.com' }));
    }

    const loadRetailerData = async () => {
      const retailerId = sessionStorage.getItem('onboarding_retailer_id');
      if (retailerId && supabase) {
        const { data, error } = await supabase
          .from('retailers')
          .select('*')
          .eq('id', retailerId)
          .single();

        if (data && !error) {
          setShippingData(prev => ({
            ...prev,
            email: user?.email || data.email || '',
            storeName: data.name || '',
            addressLine1: data.location?.split('\n')[0] || '',
            phone: data.phone || ''
          }));
        }
      }
    };

    loadRetailerData();
  }, [user, disableAuth]);

  const handleInputChange = (e) => {
    setShippingData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const saveShippingInfo = async () => {
    if (!supabase) {
      console.warn('Supabase not configured');
      return null;
    }

    const retailerId = sessionStorage.getItem('onboarding_retailer_id');
    
    const fullAddress = [
      shippingData.addressLine1,
      shippingData.addressLine2,
      `${shippingData.city}, ${shippingData.state} ${shippingData.zipCode}`
    ].filter(Boolean).join('\n');

    const updateData = {
      name: shippingData.storeName || 'Store Name Not Provided',
      location: fullAddress,
      email: shippingData.email,
      phone: shippingData.phone || null,
      express_shipping: prioritySelected,
      onboarding_step: prioritySelected ? 'payment_pending' : 'completed',
      onboarding_completed: !prioritySelected
    };

    if (retailerId) {
      const { data, error } = await supabase
        .from('retailers')
        .update(updateData)
        .eq('id', retailerId)
        .select()
        .single();

      if (error) {
        console.error('Error updating retailer:', error);
        return null;
      }
      return data;
    } else {
      const { data, error } = await supabase
        .from('retailers')
        .insert([updateData])
        .select()
        .single();

      if (error) {
        console.error('Error creating retailer:', error);
        return null;
      }

      if (data?.id) {
        sessionStorage.setItem('onboarding_retailer_id', data.id);
      }
      return data;
    }
  };

  const validateForm = () => {
    if (!shippingData.storeName.trim()) {
      setError('Please enter your store name');
      return false;
    }
    if (!shippingData.addressLine1.trim()) {
      setError('Please enter your street address');
      return false;
    }
    if (!shippingData.city.trim()) {
      setError('Please enter your city');
      return false;
    }
    if (!shippingData.state.trim()) {
      setError('Please enter your state');
      return false;
    }
    if (!shippingData.zipCode.trim()) {
      setError('Please enter your ZIP code');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await saveShippingInfo();

      if (prioritySelected) {
        const checkoutUrl = `${SHOPIFY_STORE_URL}/cart/${PRIORITY_SKU}:1`;
        window.location.href = checkoutUrl;
      } else {
        router.push('/onboard/dashboard');
      }
    } catch (err) {
      console.error('Error placing order:', err);
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  // Only show loading/block if auth is NOT disabled
  if (!disableAuth) {
    if (authLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 text-[#ff6fb3] mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    if (!user) {
      return null;
    }
  }

  const totalAmount = prioritySelected ? 50 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-[#fff6fb]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-12">
          <div className="inline-block bg-gradient-to-r from-red-500 to-red-600 text-white px-5 py-2 rounded-full text-sm font-bold mb-6 shadow-lg animate-pulse">
            🎁 Holiday Rush Special
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Get Your Display in Time for the Holidays 🎁
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            <span className="font-semibold text-gray-900">Standard shipping is free (21–28 days).</span><br />
            Priority Processing ($50) ensures your display arrives in <span className="font-bold text-[#ff6fb3]">7–10 days</span>, just in time for Q4 holiday sales.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-100 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white py-6 px-8">
            <h2 className="text-2xl font-bold">Your Order Summary</h2>
            <p className="text-white/90 text-sm mt-1">Choose your shipping preference</p>
          </div>

          <div className="p-8 space-y-6">
            <div className="flex items-start gap-4 pb-6 border-b border-gray-200">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg">Free Pawpaya Display</h3>
                <p className="text-gray-600 text-sm mt-1">NFC-powered display with curated products</p>
                <p className="text-xs text-green-600 font-semibold mt-2">✅ Included with onboarding</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-gray-900">$0</span>
                <p className="text-xs text-gray-500 line-through">$299</p>
              </div>
            </div>

            <div 
              onClick={() => setPrioritySelected(!prioritySelected)}
              className={`flex items-start gap-4 p-6 rounded-xl border-2 transition-all cursor-pointer ${
                prioritySelected 
                  ? 'border-[#ff6fb3] bg-gradient-to-br from-[#fff3ea] to-[#fff6fb] shadow-lg' 
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              }`}
            >
              <div className="flex-shrink-0 pt-1">
                <input
                  type="checkbox"
                  checked={prioritySelected}
                  onChange={(e) => setPrioritySelected(e.target.checked)}
                  className="w-6 h-6 text-[#ff6fb3] border-2 border-gray-300 rounded focus:ring-[#ff6fb3] cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-gray-900 text-lg">Priority Processing</h3>
                  <span className="bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white text-xs px-3 py-1 rounded-full font-bold">
                    RECOMMENDED
                  </span>
                </div>
                <ul className="space-y-2 mt-3">
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-600 font-bold mt-0.5">✓</span>
                    <span><strong>Arrives in time for Q4 holiday season</strong></span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-600 font-bold mt-0.5">✓</span>
                    <span><strong>Beat shipping delays</strong> - jump the queue</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-600 font-bold mt-0.5">✓</span>
                    <span><strong>Start earning sooner</strong> - 7-10 day delivery vs 21-28 days</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-orange-600 font-bold mt-0.5">🔥</span>
                    <span className="font-semibold text-orange-700">Limited availability - holiday rush</span>
                  </li>
                </ul>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-[#ff6fb3]">+$50</span>
                <p className="text-xs text-gray-500 mt-1">One-time fee</p>
              </div>
            </div>

            <div className="border-t-2 border-gray-200 my-6"></div>

            <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6">
              <div>
                <p className="text-gray-600 text-sm font-medium">Order Total</p>
                <p className="text-xs text-gray-500 mt-1">
                  {prioritySelected ? 'Priority Processing' : 'Standard Shipping (Free)'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-4xl font-bold text-gray-900">${totalAmount}</span>
                {!prioritySelected && (
                  <p className="text-xs text-gray-500 mt-1">Free shipping</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#fff3ea] to-[#fff6fb] rounded-2xl p-8 mb-8 border-2 border-[#ff6fb3]/20 shadow-lg">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#ff7a4a] to-[#ff6fb3] rounded-full flex items-center justify-center shadow-lg">
              <span className="text-2xl">💡</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Why Most Stores Choose Priority</h3>
              <p className="text-gray-700 leading-relaxed">
                <strong>Most stores make back their $50 in the first week of holiday sales.</strong> Don't miss 
                the busiest season of the year. Q4 accounts for 30-40% of annual retail revenue.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="text-3xl mb-3">🚀</div>
              <h4 className="font-bold text-gray-900 mb-2">Ship Before Black Friday</h4>
              <p className="text-sm text-gray-600">
                Get your display installed and earning before the biggest shopping weekend of the year.
              </p>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="text-3xl mb-3">💰</div>
              <h4 className="font-bold text-gray-900 mb-2">Capture Holiday Sales</h4>
              <p className="text-sm text-gray-600">
                Average stores see 2-3x more traffic during holidays. Each scan is a potential sale.
              </p>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="text-3xl mb-3">🔥</div>
              <h4 className="font-bold text-gray-900 mb-2">Limited Supply Available</h4>
              <p className="text-sm text-gray-600">
                We can only fulfill a limited number of priority orders. Once they're gone, standard only.
              </p>
            </div>
          </div>

          <div className="mt-6 bg-white/50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-white flex items-center justify-center text-white font-bold text-sm">JM</div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-white flex items-center justify-center text-white font-bold text-sm">AC</div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 border-2 border-white flex items-center justify-center text-white font-bold text-sm">DT</div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  <strong>387 retailers</strong> upgraded to priority this month
                </p>
              </div>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-100 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white py-4 px-8">
            <h2 className="text-xl font-bold">Shipping Information</h2>
            <p className="text-white/90 text-sm mt-1">Where should we send your display?</p>
          </div>

          <div className="p-8 space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address <span className="text-xs text-gray-500">(from your account)</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={shippingData.email}
                readOnly
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="storeName" className="block text-sm font-semibold text-gray-700 mb-2">
                Store Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="storeName"
                name="storeName"
                value={shippingData.storeName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all text-gray-900"
                placeholder="e.g., Urban Goods Market"
              />
            </div>

            <div>
              <label htmlFor="addressLine1" className="block text-sm font-semibold text-gray-700 mb-2">
                Street Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="addressLine1"
                name="addressLine1"
                value={shippingData.addressLine1}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all text-gray-900"
                placeholder="123 Main Street"
              />
            </div>

            <div>
              <label htmlFor="addressLine2" className="block text-sm font-semibold text-gray-700 mb-2">
                Apt, Suite, etc. <span className="text-xs text-gray-500">(optional)</span>
              </label>
              <input
                type="text"
                id="addressLine2"
                name="addressLine2"
                value={shippingData.addressLine2}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all text-gray-900"
                placeholder="Suite 200"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={shippingData.city}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all text-gray-900"
                  placeholder="San Francisco"
                />
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-semibold text-gray-700 mb-2">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={shippingData.state}
                  onChange={handleInputChange}
                  required
                  maxLength={2}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all text-gray-900 uppercase"
                  placeholder="CA"
                />
              </div>

              <div>
                <label htmlFor="zipCode" className="block text-sm font-semibold text-gray-700 mb-2">
                  ZIP Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="zipCode"
                  name="zipCode"
                  value={shippingData.zipCode}
                  onChange={handleInputChange}
                  required
                  maxLength={10}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all text-gray-900"
                  placeholder="94102"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number <span className="text-xs text-gray-500">(for shipping updates)</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={shippingData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all text-gray-900"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-start gap-3 mb-6">
            <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        )}

        <button
          onClick={handlePlaceOrder}
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white py-6 px-8 rounded-xl font-bold text-2xl hover:shadow-2xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 mb-6"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-7 w-7 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {prioritySelected ? 'Processing...' : 'Saving...'}
            </>
          ) : (
            <>
              <span>
                {prioritySelected 
                  ? `Place Order ($${totalAmount})` 
                  : 'Complete Registration (Free)'}
              </span>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </button>

        <p className="text-center text-sm text-gray-600 mb-8">
          {prioritySelected ? (
            <>You'll be redirected to secure checkout to complete your $50 payment</>
          ) : (
            <>You'll proceed directly to your dashboard - no payment required</>
          )}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Secure Checkout</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Money-Back Guarantee</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            <span>24/7 Support</span>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link href="/onboard/register" className="text-gray-600 hover:text-gray-900 font-medium text-sm">
            ← Back to registration
          </Link>
        </div>
      </div>
    </div>
  );
}
