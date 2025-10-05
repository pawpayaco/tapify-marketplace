import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import AddressInput from '../../components/AddressInput';

const SHIPPING_OPTIONS = [
  {
    id: 'expedited',
    emoji: '🚀',
    title: 'Halloween Guarantee',
    headline: 'Display on your floor by October 31',
    description: 'Tapify prints and ships within 48 hours so you launch before the holiday rush.',
    badge: 'Fastest activation',
    price: 50,
    bullets: [
      'Priority production slot & tracking emails',
      'Dedicated Tapify support if anything looks off',
      'Launch playbook to train your team before Halloween'
    ]
  },
  {
    id: 'standard',
    emoji: '📦',
    title: 'Standard Queue',
    headline: 'Ships after Black Friday (no rush fee)',
    description: 'We will slot your store into the standard national rollout once peak season ends.',
    badge: null,
    price: 0,
    bullets: [
      'Queued behind national orders',
      'Arrives after the Black Friday surge',
      'Email notification when production begins'
    ]
  }
];

const DISPLAY_VALUE = 299;
const EXPEDITE_DEADLINE = 'October 31';
const STANDARD_WINDOW = 'after Black Friday';

const hydrateAddressFromRaw = (raw = '') => {
  if (!raw) {
    return {
      address1: '',
      address2: '',
      city: '',
      state: '',
      zip: '',
      raw: ''
    };
  }

  const segments = raw.split(',').map((segment) => segment.trim()).filter(Boolean);
  const address1 = segments[0] || '';
  let address2 = '';
  let city = '';
  let state = '';
  let zip = '';

  if (segments.length >= 4) {
    address2 = segments.slice(1, segments.length - 2).join(', ');
    city = segments[segments.length - 2] || '';
    const stateZip = segments[segments.length - 1] || '';
    const stateZipParts = stateZip.split(' ').filter(Boolean);
    state = stateZipParts[0] || '';
    zip = stateZipParts.slice(1).join(' ') || '';
  } else if (segments.length === 3) {
    city = segments[1] || '';
    const stateZip = segments[2] || '';
    const stateZipParts = stateZip.split(' ').filter(Boolean);
    state = stateZipParts[0] || '';
    zip = stateZipParts.slice(1).join(' ') || '';
  } else if (segments.length === 2) {
    city = segments[0];
    state = segments[1];
  }

  if (!zip) {
    const potentialZip = segments.find((segment) => /\d{5}/.test(segment));
    zip = potentialZip ? potentialZip.match(/\d{5}(?:-\d{4})?/)[0] : '';
  }

  return {
    address1,
    address2,
    city,
    state,
    zip,
    raw
  };
};

export default function ShopifyConnect() {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState('expedited');
  const [loading, setLoading] = useState(false);
  const [standardProcessing, setStandardProcessing] = useState(false);
  const [error, setError] = useState('');
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    email: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    raw: ''
  });

  const SHOPIFY_STORE_URL = process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL || 'https://yourstore.myshopify.com';
  const PRIORITY_SKU = process.env.NEXT_PUBLIC_PRIORITY_SKU || 'PRIORITY_SHIPPING';
  const FREE_DISPLAY_SKU = process.env.NEXT_PUBLIC_FREE_DISPLAY_SKU || 'FREE_DISPLAY';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.scrollTo(0, 0);

    const savedEmail = sessionStorage.getItem('onboarding_email') || '';
    const savedName = sessionStorage.getItem('onboarding_owner_name') || '';
    const savedPhone = sessionStorage.getItem('onboarding_phone') || '';
    const savedAddress = sessionStorage.getItem('onboarding_address') || '';

    setShippingAddress((prev) => {
      const hydrated = savedAddress ? hydrateAddressFromRaw(savedAddress) : {};
      return {
        ...prev,
        name: savedName || prev.name,
        email: savedEmail || prev.email,
        phone: savedPhone || prev.phone,
        address1: hydrated.address1 || prev.address1,
        address2: hydrated.address2 || prev.address2,
        city: hydrated.city || prev.city,
        state: hydrated.state || prev.state,
        zip: hydrated.zip || prev.zip,
        raw: hydrated.raw || prev.raw
      };
    });

    const loadRetailerData = async () => {
      const retailerId = sessionStorage.getItem('onboarding_retailer_id');
      if (!retailerId || !supabase) return;

      const { data, error: supabaseError } = await supabase
        .from('retailers')
        .select('name, email, phone, address, location')
        .eq('id', retailerId)
        .single();

      if (supabaseError || !data) return;

      setShippingAddress((prev) => {
        const fallbackAddress = data.address || data.location || '';
        const hydrated = fallbackAddress ? hydrateAddressFromRaw(fallbackAddress) : {};
        return {
          ...prev,
          name: prev.name || data.name || '',
          email: prev.email || data.email || '',
          phone: prev.phone || data.phone || '',
          address1: prev.address1 || hydrated.address1 || '',
          address2: prev.address2 || hydrated.address2 || '',
          city: prev.city || hydrated.city || '',
          state: prev.state || hydrated.state || '',
          zip: prev.zip || hydrated.zip || '',
          raw: prev.raw || hydrated.raw || ''
        };
      });
    };

    loadRetailerData();
  }, []);

  const activeOption = SHIPPING_OPTIONS.find((option) => option.id === selectedOption) || SHIPPING_OPTIONS[0];
  const isExpedited = activeOption.id === 'expedited';
  const shippingPrice = activeOption.price;

  const normalizeAddress = () => {
    const hydrated = hydrateAddressFromRaw(shippingAddress.raw);
    return {
      address1: shippingAddress.address1 || hydrated.address1,
      address2: shippingAddress.address2 || hydrated.address2,
      city: shippingAddress.city || hydrated.city,
      state: shippingAddress.state || hydrated.state,
      zip: shippingAddress.zip || hydrated.zip
    };
  };

  const handleCheckout = async () => {
    if (!isExpedited) return;

    setLoading(true);
    setError('');

    const trimmedName = shippingAddress.name.trim();
    if (!trimmedName || !shippingAddress.email.trim()) {
      setError('Add the owner name and email so Shopify can pre-fill the checkout.');
      setLoading(false);
      return;
    }

    const normalized = normalizeAddress();

    if (!normalized.address1 || !normalized.city || !normalized.state || !normalized.zip) {
      setError('Add the shipping address so we can guarantee Halloween delivery.');
      setLoading(false);
      return;
    }

    try {
      const [firstName, ...rest] = trimmedName.split(/\s+/);
      const lastName = rest.join(' ') || firstName;

      // Redirect to the same Shopify product as the toggle
      window.open('https://pawpayaco.com/products/display-setup-for-affiliate', '_blank');
      setLoading(false);
    } catch (checkoutError) {
      console.error('Checkout error:', checkoutError);
      setError('We could not start the Shopify checkout. Please try again.');
      setLoading(false);
    }
  };

  const handleReserveStandard = async () => {
    setSelectedOption('standard');
    setStandardProcessing(true);
    setError('');

    try {
      if (typeof window === 'undefined') {
        throw new Error('Client context unavailable');
      }

      const retailerId = window.sessionStorage.getItem('onboarding_retailer_id');

      if (!retailerId) {
        setError('We could not find your onboarding record. Please restart your Tapify registration.');
        setStandardProcessing(false);
        return;
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
        const message = payload?.error || 'We could not reserve your display. Please try again.';
        throw new Error(message);
      }

      await router.push('/onboard/dashboard');
    } catch (reservationError) {
      console.error('Reserve standard error:', reservationError);
      const fallbackMessage = 'Something went wrong continuing your onboarding. Try again.';
      if (reservationError?.message && reservationError.message !== 'Client context unavailable') {
        setError(reservationError.message);
      } else {
        setError(fallbackMessage);
      }
    } finally {
      setStandardProcessing(false);
    }
  };

  const shippingTimeline = [
    {
      id: 'expedited',
      title: 'Launch before Halloween',
      description: 'Tapify prints within 48 hours. You place the display the week of October 21st.',
      highlight: `Guaranteed delivery by ${EXPEDITE_DEADLINE}`
    },
    {
      id: 'standard',
      title: 'Hold for post-holiday wave',
      description: 'We resume standard production after Cyber Week. Expect your display in early December.',
      highlight: `Ships ${STANDARD_WINDOW}`
    }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#faf8f3' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg">
            <span>Optional Add-On</span>
            <span className="text-xs uppercase tracking-wider">Step 4 · Shipping Upgrade</span>
          </div>
          <h1 className="mt-6 text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
            Guarantee your Pawpaya display by Halloween
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            {`Your free $${DISPLAY_VALUE} Pawpaya display is ready. Upgrade shipping for $50 to receive it by ${EXPEDITE_DEADLINE}, or stay on the standard schedule and we will ship ${STANDARD_WINDOW} once the holiday rush clears.`}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[1.6fr,1fr] gap-8 lg:gap-12">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-3xl border-2 border-gray-100 shadow-xl p-6 md:p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl">
                  ⏳
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Why upgrade now?</h2>
                  <p className="text-sm text-gray-500">Beat the Black Friday bottleneck and launch during peak foot traffic.</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {shippingTimeline.map((item) => (
                  <div
                    key={item.id}
                    className={[
                      'rounded-2xl p-5 border-2 transition-all h-full',
                      item.id === 'expedited'
                        ? 'border-[#ff6fb3]/60 bg-gradient-to-br from-pink-50 via-white to-white shadow-md'
                        : 'border-gray-200 bg-gray-50'
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl" role="img" aria-hidden="true">
                        {item.id === 'expedited' ? '🎃' : '🕒'}
                      </span>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                        <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                        <p className="mt-3 text-sm font-semibold text-[#ff6fb3] uppercase tracking-wide">
                          {item.highlight}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-white rounded-3xl border-2 border-gray-100 shadow-xl p-6 md:p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Choose your shipping path</h2>
              <div className="space-y-4">
                {SHIPPING_OPTIONS.map((option) => {
                  const isActive = option.id === activeOption.id;
                  return (
                    <motion.button
                      key={option.id}
                      type="button"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedOption(option.id)}
                      className={[
                        'w-full text-left p-6 rounded-3xl border-2 transition-all relative overflow-hidden',
                        isActive
                          ? 'border-[#ff6fb3] bg-gradient-to-br from-pink-50 via-white to-purple-50 shadow-xl ring-4 ring-[#ff6fb3]/20'
                          : 'border-gray-200 hover:border-gray-300 bg-white shadow-md'
                      ].join(' ')}
                    >
                      {isActive && (
                        <motion.span
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gradient-to-br from-[#ff7a4a] to-[#ff6fb3] text-white flex items-center justify-center"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </motion.span>
                      )}

                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl" role="img" aria-hidden="true">{option.emoji}</span>
                            <div>
                              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{option.title}</p>
                              <h3 className="text-xl font-bold text-gray-900">{option.headline}</h3>
                            </div>
                          </div>
                          <p className="mt-3 text-sm text-gray-600">{option.description}</p>
                          <ul className="mt-4 space-y-2 text-sm text-gray-600">
                            {option.bullets.map((bullet) => (
                              <li key={bullet} className="flex items-start gap-2">
                                <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          {option.badge && (
                            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white text-xs font-bold uppercase tracking-wide">
                              {option.badge}
                            </span>
                          )}
                          <div className="text-right">
                            <p className="text-sm text-gray-500">One-time</p>
                            <p className="text-4xl font-black text-gray-900">{option.price > 0 ? `$${option.price}` : 'FREE'}</p>
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            <AnimatePresence>
              {isExpedited && (
                <motion.div
                  key="address-form"
                  initial={{ opacity: 0, height: 0, y: 10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-3xl border-2 border-gray-100 shadow-xl p-6 md:p-8"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7l8.89 5.26L21 7M5 19h14a2 2 0 002-2V7a2 2 0 00-1-1.73M4 6.27A2 2 0 003 7v10a2 2 0 002 2" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Where should we ship?</h2>
                      <p className="text-sm text-gray-500">We pre-fill everything in Shopify so checkout takes seconds.</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Store owner name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.name}
                        onChange={(event) => setShippingAddress((prev) => ({ ...prev, name: event.target.value }))}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent text-gray-900"
                        placeholder="Jane Doe"
                        autoComplete="name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={shippingAddress.email}
                        onChange={(event) => setShippingAddress((prev) => ({ ...prev, email: event.target.value }))}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent text-gray-900"
                        placeholder="owner@yourstore.com"
                        autoComplete="email"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={shippingAddress.phone}
                        onChange={(event) => setShippingAddress((prev) => ({ ...prev, phone: event.target.value }))}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent text-gray-900"
                        placeholder="(555) 123-4567"
                        autoComplete="tel"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <AddressInput
                        value={shippingAddress.raw}
                        onChange={(raw) => setShippingAddress((prev) => ({ ...prev, raw }))}
                        onValidated={(validated) => {
                          setShippingAddress((prev) => ({
                            ...prev,
                            address1: validated.address1 || prev.address1,
                            address2: validated.address2 || prev.address2,
                            city: validated.city || prev.city,
                            state: validated.state || prev.state,
                            zip: validated.zip5 || prev.zip,
                            raw: [
                              validated.address1,
                              validated.address2,
                              validated.city,
                              validated.state,
                              validated.zip5
                            ].filter(Boolean).join(', ')
                          }));
                        }}
                        required
                        googleApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                        label="Shipping address"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 border-2 border-white/60 rounded-3xl p-6 md:p-8 shadow-lg"
            >
              <div className="grid md:grid-cols-3 gap-6">
                {[{
                  title: 'Faster first payout',
                  detail: 'Stores that launch in October beat national marketing pushes and capture early holiday momentum.'
                }, {
                  title: 'Managed install kit',
                  detail: 'Includes display hardware, NFC tags, QR signage, and setup checklist so your team is ready day one.'
                }, {
                  title: 'Live performance dashboard',
                  detail: 'Track scans, conversions, and payouts inside the Tapify retailer dashboard the moment your display ships.'
                }].map((item) => (
                  <div key={item.title} className="bg-white/80 backdrop-blur rounded-2xl border border-white/60 p-5 shadow">
                    <p className="text-sm font-semibold text-[#ff6fb3] uppercase tracking-wide">{item.title}</p>
                    <p className="mt-2 text-sm text-gray-600">{item.detail}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-white rounded-3xl border-2 border-gray-100 shadow-xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Your Pawpaya kit</h2>
                <span className="px-3 py-1 rounded-full bg-green-100 text-emerald-700 text-xs font-bold">{`$${DISPLAY_VALUE} value`}</span>
              </div>

              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-3">
                  <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Premium Pawpaya countertop display & signage kit
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  NFC & QR codes pre-programmed to your store UID
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Tapify performance dashboard + payout tracking
                </li>
              </ul>

              <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-[#ff7a4a]/10 to-[#ff6fb3]/10 border border-[#ff6fb3]/20">
                <p className="text-sm text-gray-700">
                  Your display is free — the $50 covers rush production, priority packing, and 2-day shipping so your store is live by Halloween.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="bg-white rounded-3xl border-2 border-gray-100 shadow-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Order summary
                </span>
                <span className="text-sm text-gray-500">{isExpedited ? 'Halloween delivery' : 'Standard queue'}</span>
              </div>

              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Free Pawpaya display</span>
                  <span className="font-semibold text-emerald-600">$0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{isExpedited ? 'Halloween rush processing' : 'Standard production'}</span>
                  <span className="font-semibold text-gray-900">{isExpedited ? '$50' : '$0'}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-gray-900">Total today</span>
                  <span className="text-3xl font-black text-gray-900">{shippingPrice > 0 ? `$${shippingPrice}` : '$0'}</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Display hardware remains free. Shipping fees are optional and only charged if you choose the Halloween guarantee.
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </motion.div>
              )}

              <div className="mt-6 space-y-3">
                <motion.button
                  whileHover={{ scale: isExpedited && !loading ? 1.02 : 1 }}
                  whileTap={{ scale: isExpedited && !loading ? 0.98 : 1 }}
                  type="button"
                  onClick={handleCheckout}
                  disabled={!isExpedited || loading}
                  className={[
                    'w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all',
                    isExpedited
                      ? 'bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white shadow-xl disabled:opacity-60 disabled:cursor-not-allowed'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  ].join(' ')}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      Starting Shopify checkout...
                    </>
                  ) : (
                    <>
                      <span>Upgrade & checkout on Shopify</span>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </motion.button>

                <button
                  type="button"
                  onClick={handleReserveStandard}
                  disabled={standardProcessing}
                  className="w-full py-4 rounded-2xl border-2 border-gray-300 bg-white text-gray-800 font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex flex-col items-center justify-center space-y-1 leading-tight"
                >
                  {standardProcessing ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                      <span>Reserving your display...</span>
                    </div>
                  ) : (
                    <>
                      <span className="text-lg font-black text-gray-900">Reserve my display</span>
                      <span className="text-xs font-medium text-gray-500">Ships after Black Friday</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-3xl p-6 shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3m6 0c0-1.657-1.343-3-3-3m0 6v1m0 4h.01M4.293 6.293a1 1 0 011.414 0L12 12.586l6.293-6.293a1 1 0 011.414 1.414L13.414 14l6.293 6.293a1 1 0 01-1.414 1.414L12 15.414l-6.293 6.293a1 1 0 01-1.414-1.414L10.586 14 4.293 7.707a1 1 0 010-1.414z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold">Tapify launch guarantee</h3>
                  <p className="text-sm text-white/80">
                    We replace or reprint anything that arrives damaged and monitor every shipment so you stay on track for launch.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
