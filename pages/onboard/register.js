import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import AddressInput from '../../components/AddressInput';

export default function RegisterRetailer() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Capture manager referral from URL (?ref=phone)
  const [managerReferral, setManagerReferral] = useState(null);

  useEffect(() => {
    if (router.query.ref) {
      const ref = router.query.ref;
      console.log('[register] Manager referral detected:', ref);
      setManagerReferral(ref);
    }
  }, [router.query.ref]);

  // Store search/autocomplete state
  const [storeQuery, setStoreQuery] = useState('');
  const [storeSuggestions, setStoreSuggestions] = useState([]);
  const [selectedRetailer, setSelectedRetailer] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAddNewStore, setShowAddNewStore] = useState(false);
  const suggestionsRef = useRef(null);

  const [formData, setFormData] = useState({
    storeName: '',
    ownerName: '',
    managerName: '',
    email: '',
    phone: '',
    storeAddress: '',
    password: '',
    expressShipping: false,
  });

  // Additional stores for multi-location retailers
  const [additionalStores, setAdditionalStores] = useState([]);
  const [lastAddedStoreId, setLastAddedStoreId] = useState(null);
  const storeRefs = useRef({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Add new store location with search capabilities
  const addAdditionalStore = () => {
    const newStoreId = Date.now();
    setAdditionalStores(prev => [
      ...prev,
      {
        id: newStoreId, // Simple ID for React key
        storeQuery: '',
        selectedRetailer: null,
        storeSuggestions: [],
        showSuggestions: false,
        showAddNewStore: false,
        managerName: '',
        address: '',
        isCreatingNew: false
      }
    ]);
    setLastAddedStoreId(newStoreId);
  };

  // Scroll to newly added store
  useEffect(() => {
    if (lastAddedStoreId && storeRefs.current[lastAddedStoreId]) {
      // Small delay to ensure the DOM is updated with animation
      setTimeout(() => {
        storeRefs.current[lastAddedStoreId]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
        setLastAddedStoreId(null);
      }, 100);
    }
  }, [lastAddedStoreId, additionalStores]);

  // Remove store location
  const removeAdditionalStore = (id) => {
    setAdditionalStores(prev => prev.filter(store => store.id !== id));
  };

  // Handle additional store search query change
  const handleAdditionalStoreQueryChange = (id, query) => {
    setAdditionalStores(prev =>
      prev.map(store =>
        store.id === id ? {
          ...store,
          storeQuery: query,
          showSuggestions: true,
          selectedRetailer: null
        } : store
      )
    );
  };

  // Handle selecting a retailer for additional store
  const handleSelectAdditionalRetailer = (id, retailer) => {
    setAdditionalStores(prev =>
      prev.map(store =>
        store.id === id ? {
          ...store,
          selectedRetailer: retailer,
          storeQuery: retailer.name,
          storeName: retailer.name, // Auto-populate store name
          address: retailer.address || retailer.location || '', // Auto-populate address
          managerName: retailer.owner_name || store.managerName, // Auto-populate manager/owner name
          showSuggestions: false,
          storeSuggestions: []
        } : store
      )
    );
  };

  // Handle additional store field changes
  const handleAdditionalStoreFieldChange = (id, field, value) => {
    setAdditionalStores(prev =>
      prev.map(store =>
        store.id === id ? { ...store, [field]: value } : store
      )
    );
  };

  // Search for additional stores
  useEffect(() => {
    additionalStores.forEach(async (store) => {
      if (!store.storeQuery || store.storeQuery.length < 1 || store.selectedRetailer) {
        return;
      }

      try {
        const response = await fetch(`/api/retailers/search?query=${encodeURIComponent(store.storeQuery)}`);
        const data = await response.json();

        setAdditionalStores(prev =>
          prev.map(s =>
            s.id === store.id ? {
              ...s,
              storeSuggestions: data.results || [],
              showAddNewStore: (data.results || []).length === 0
            } : s
          )
        );
      } catch (err) {
        console.error('Error searching stores for additional location:', err);
      }
    });
  }, [additionalStores.map(s => s.storeQuery).join(',')]);

  // Add new store for additional location
  const handleAddNewAdditionalStore = async (id) => {
    const store = additionalStores.find(s => s.id === id);
    if (!store || !store.storeQuery || store.storeQuery.trim().length < 1) {
      setError('Please enter a store name (at least 1 character)');
      return;
    }

    setAdditionalStores(prev =>
      prev.map(s => s.id === id ? { ...s, isCreatingNew: true } : s)
    );

    try {
      const response = await fetch('/api/retailers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: store.storeQuery.trim(),
          address: null,
          phone: null,
          email: null,
          source: 'onboard-additional'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add store');
      }

      if (data.ok && data.retailer) {
        setAdditionalStores(prev =>
          prev.map(s =>
            s.id === id ? {
              ...s,
              selectedRetailer: data.retailer,
              storeQuery: data.retailer.name,
              showAddNewStore: false,
              showSuggestions: false,
              storeSuggestions: [],
              isCreatingNew: false
            } : s
          )
        );
      }
    } catch (err) {
      console.error('Error adding additional store:', err);
      setError(err.message || 'Failed to add store. Please try again.');
      setAdditionalStores(prev =>
        prev.map(s => s.id === id ? { ...s, isCreatingNew: false } : s)
      );
    }
  };

  // Fetch store suggestions (autocomplete)
  useEffect(() => {
    let mounted = true;

    if (!storeQuery || storeQuery.length < 1) {
      setStoreSuggestions([]);
      setShowAddNewStore(false);
      return;
    }

    const timer = setTimeout(async () => {
      console.log('[Autocomplete] Searching for:', storeQuery);
      try {
        const response = await fetch(`/api/retailers/search?query=${encodeURIComponent(storeQuery)}`);
        const data = await response.json();

        console.log('[Autocomplete] API response:', data);

        if (mounted) {
          if (data.error) {
            console.error('[Autocomplete] API error:', data.error);
            setError(`Search error: ${data.error}. Please check server configuration.`);
            setStoreSuggestions([]);
            setShowAddNewStore(true); // Show "add new" option as fallback
          } else {
            setStoreSuggestions(data.results || []);
            setShowAddNewStore(data.results?.length === 0);
            console.log('[Autocomplete] Found', data.results?.length || 0, 'results');
          }
        }
      } catch (err) {
        console.error('[Autocomplete] Fetch error:', err);
        if (mounted) {
          setError('Failed to search stores. Please try again or add your store manually.');
          setStoreSuggestions([]);
          setShowAddNewStore(true); // Show "add new" option as fallback
        }
      }
    }, 300); // Debounce 300ms

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [storeQuery]);

  // Handle click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Select a retailer from suggestions - Auto-populate form with prospect data
  const handleSelectRetailer = (retailer) => {
    setSelectedRetailer(retailer);
    setStoreQuery(retailer.name);
    setFormData(prev => ({
      ...prev,
      storeName: retailer.name,
      ownerName: retailer.owner_name || prev.ownerName,
      storeAddress: retailer.address || retailer.location || '',
      email: retailer.email || '',
      phone: retailer.phone || retailer.store_phone || '',
    }));
    setShowSuggestions(false);
    setStoreSuggestions([]);
  };

  // Add new store (not in suggestions) - Only requires store name!
  const handleAddNewStore = async () => {
    if (!storeQuery || storeQuery.trim().length < 1) {
      setError('Please enter a store name (at least 1 character)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/retailers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: storeQuery.trim(),
          address: null, // Address will be filled in later in the form
          phone: null,
          email: null,
          source: 'onboard'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add store');
      }

      if (data.ok && data.retailer) {
        setSelectedRetailer(data.retailer);
        setFormData(prev => ({ ...prev, storeName: data.retailer.name }));
        setSuccess('Store added! Please complete the rest of your information below.');
        setShowAddNewStore(false);
        setShowSuggestions(false);
        setStoreSuggestions([]);
      }
    } catch (err) {
      console.error('Error adding store:', err);
      setError(err.message || 'Failed to add store. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  // Step 1 must hold before we ask for account details — otherwise a missing
  // address only surfaces after the user has typed a password.
  const goToStep2 = () => {
    setError('');
    if (!formData.storeName) return setError('Pick your store, or add it as a new one.');
    if (!formData.storeAddress) return setError('We need a shipping address to send your display.');
    for (const store of additionalStores) {
      if (!store.storeName || !store.storeAddress) {
        return setError('Finish the extra location, or remove it.');
      }
    }
    setStep(2);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      if (!formData.storeName || !formData.ownerName || !formData.email || !formData.password) {
        throw new Error('Please fill in all required fields (store name, your name, email, and password)');
      }

      if (!formData.storeAddress) {
        throw new Error('Please enter your store address');
      }

      // Validate additional stores if any
      for (let i = 0; i < additionalStores.length; i++) {
        const store = additionalStores[i];
        if (!store.selectedRetailer) {
          throw new Error(`Additional Store #${i + 2}: Please select or add a store`);
        }
        if (!store.address || store.address.trim() === '') {
          throw new Error(`Additional Store #${i + 2}: Please enter the store address`);
        }
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Validate password
      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Call the onboarding registration endpoint (creates auth user + DB records)
      const payload = {
        retailer_id: selectedRetailer?.id || null,
        store_name: formData.storeName,
            owner_name: formData.ownerName,
        owner_email: formData.email,
        owner_phone: formData.phone || null,
        address: formData.storeAddress,
        password: formData.password,
        campaign: 'onboard-2025',
        notes: `Multi-location retailer - ${additionalStores.length + 1} total locations`,
        additional_stores: additionalStores.length > 0 ? additionalStores.map(store => ({
          retailer_id: store.selectedRetailer?.id,
          storeName: store.selectedRetailer?.name,
          managerName: store.managerName || null,
          address: store.address || store.selectedRetailer?.address || null
        })) : null,
        manager_referral: managerReferral // Pass manager phone for referral tracking
      };

      const response = await fetch('/api/onboard/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to complete registration');
      }

      console.log('Registration successful:', result);

      // Store retailer ID in session storage for the next step
      if (result.retailer_id) {
        sessionStorage.setItem('onboarding_retailer_id', result.retailer_id);
        sessionStorage.setItem('onboarding_email', formData.email);
      }

      // Automatically log in the user with Supabase
      setSuccess('Account created successfully! Logging you in...');

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        console.error('[register] Auto sign-in error:', signInError);
        // Don't fail registration, just redirect to login
        setTimeout(() => {
          router.push('/login?message=Please log in with your new account');
        }, 1500);
        return;
      }

      // Success! User is now logged in, redirect to next step
      setTimeout(() => {
      router.push('/onboard/shopify-connect');
      }, 1000);

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


  const nextSteps = [
    {
      title: 'Confirmation',
      timing: 'Right away',
      description: 'Get immediate confirmation in your dashboard. Your display order is locked in.'
    },
    {
      title: 'Delivery',
      timing: '3 weeks',
      description: 'We print, ship, and quality-check your display. Including hooks, samples and tech.'
    },
    {
      title: 'Start Earning',
      timing: 'Day 1',
      description: 'Place display near checkout or on the shelf. You start earning.'
    }
  ];


  return (
    <div className="t-page" style={{ minHeight: '100vh' }}>
      <div className="t-wrap" style={{ maxWidth: 640 }}>

        <header style={{ padding: '64px 0 8px' }}>
          <p style={{ fontSize: 13, color: 'var(--pewter)', margin: 0 }}>
            Step {step} of 2 · {step === 1 ? 'Your store' : 'Your account'}
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em', margin: '8px 0 0' }}>
            {step === 1 ? 'Which store is this for?' : 'Create your account'}
          </h1>
          <p className="t-section__note" style={{ maxWidth: 460 }}>
            {step === 1
              ? 'We print and ship your display free. Tell us where to send it.'
              : 'This is how you sign in to see your taps and get paid.'}
          </p>
        </header>

        <div className="t-progress"><div className="t-progress__fill" style={{ width: step === 1 ? '50%' : '100%' }} /></div>

        <form onSubmit={handleSubmit} className="space-y-5 w-full" style={{ paddingTop: 36 }}>

          {step === 1 && (
            <>
              {/* Store Name with Autocomplete */}
              <motion.div variants={fadeInUp} className="relative w-full" ref={suggestionsRef}>
                <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-2">
                  Store Name <span className="text-red-500">*</span>
                  {selectedRetailer && <span className="text-green-600 text-xs ml-2">Selected ✓</span>}
                </label>
                {/* Unified Search Container - COMPLETELY RESTRUCTURED */}
                <div className="relative max-w-full">
                  {/* Input Field */}
                  <input
                    type="text"
                    id="storeName"
                    value={storeQuery}
                    onChange={(e) => {
                      setStoreQuery(e.target.value);
                      setFormData(prev => ({ ...prev, storeName: e.target.value }));
                      setShowSuggestions(true);
                      setSelectedRetailer(null);
                      setSuccess('');
                    }}
                    onFocus={() => {
                      if (!selectedRetailer) {
                        setShowSuggestions(true);
                      }
                    }}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-[4px] hover:border-gray-300 focus:border-[#ff6fb3] focus:ring-2 focus:ring-[#ff6fb3]/20 transition-all text-gray-900 placeholder-gray-400"
                    placeholder="Start typing your store name..."
                  />

                  {/* Dropdown - Absolutely Positioned, No Animations, Max 3 Items */}
                  {showSuggestions && storeQuery.length >= 1 && (
                    <div
                      className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-[4px]"
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        maxHeight: 'none',
                        overflow: 'visible',
                        touchAction: 'auto'
                      }}
                    >
                      <div style={{ overflow: 'visible' }}>
                        {storeSuggestions.length > 0 ? (
                          <>
                            {storeSuggestions.slice(0, 3).map((store, idx) => {
                                const isTaken = store.converted;
                                return (
                                  <div
                                    key={store.id}
                                    className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-b-0 transition-all overflow-hidden ${
                                      isTaken
                                        ? 'bg-gray-50 cursor-not-allowed opacity-60'
                                        : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer'
                                    }`}
                                  >
                                    {isTaken ? (
                                      <div className="flex items-start gap-3 w-full overflow-hidden">
                                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                                          <span className="text-gray-600 text-xs font-medium">{store.name.charAt(0)}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="font-medium text-gray-500 break-words">
                                            {store.name}
                                          </div>
                                          <div className="text-xs text-gray-400 break-words">
                                            {store.address || store.location || 'Address not listed'}
                                          </div>
                                          <div className="flex items-center gap-2 mt-2">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                              🚫 Taken
                                            </span>
                                            <span className="text-xs text-gray-400">
                                              Already registered
                                            </span>
                                          </div>
                                        </div>
                                        <div className="flex-shrink-0">
                                          <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </div>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleSelectRetailer(store)}
                                        className="w-full overflow-hidden block"
                                      >
                                        <div className="flex items-start gap-3 w-full overflow-hidden">
                                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff7a4a] to-[#ff6fb3] flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-white text-xs font-medium">{store.name.charAt(0)}</span>
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-900 group-hover:text-[#ff6fb3] transition-colors break-words">{store.name}</div>
                                            <div className="text-xs text-gray-600 break-words">{store.address || store.location || 'Address not listed'}</div>
                                            {store.email && <div className="text-xs text-gray-500 break-words">{store.email}</div>}
                                          </div>
                                          <svg className="w-5 h-5 text-gray-400 group-hover:text-[#ff6fb3] transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                          </svg>
                                        </div>
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </>
                          ) : showAddNewStore ? (
                            <button
                              type="button"
                              onClick={handleAddNewStore}
                              disabled={loading}
                              className="w-full text-left px-4 py-4 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 hover:from-green-100 hover:via-emerald-100 hover:to-green-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed group rounded-[4px]"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                                  <span className="text-white text-lg">✨</span>
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-green-700 group-hover:text-green-800 transition-colors">
                                    Add "{storeQuery}" as new store
                                  </div>
                                  <div className="text-xs text-green-600">Store not listed? Click to add it!</div>
                                </div>
                                {loading && (
                                  <div className="animate-spin rounded-full h-5 w-5 border border-green-600 border-t-transparent"></div>
                                )}
                              </div>
                            </button>
                          ) : (
                            <div className="px-4 py-8 text-gray-500 text-sm flex items-center justify-center gap-2 bg-white rounded-[4px]">
                              <div className="animate-spin rounded-full h-4 w-4 border border-gray-400 border-t-transparent"></div>
                              Searching retailers...
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Success Banner - Right After Store Name */}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="mt-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-[4px] px-4 py-3 flex items-center gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-green-700 flex-1">{success}</span>
                  </motion.div>
                )}

              </motion.div>
              {/* Store Address - Google Maps + USPS Validation */}
              <motion.div variants={fadeInUp}>
                <AddressInput
                  value={formData.storeAddress}
                  onChange={(address) => {
                    setFormData(prev => ({ ...prev, storeAddress: address }));
                  }}
                  onValidated={(validated) => {
                    // Store USPS-validated address
                    const fullAddress = `${validated.address1}${validated.address2 ? ', ' + validated.address2 : ''}, ${validated.city}, ${validated.state} ${validated.zip5}`;
                    setFormData(prev => ({
                      ...prev,
                      storeAddress: fullAddress,
                      validatedAddress: validated // Store full validated object for backend
                    }));
                  }}
                  googleApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                  required={true}
                  label="Store Address (Shipping Address)"
                />
              </motion.div>

              {/* Multi-Location Stores Section */}
              <motion.div variants={fadeInUp}>

                {/* Additional Stores List */}
                <AnimatePresence initial={false}>
                  {additionalStores.map((store, index) => (
                    <motion.div
                      key={store.id}
                      ref={el => storeRefs.current[store.id] = el}
                      initial={{ opacity: 0, height: 0, overflow: "hidden" }}
                      animate={{
                        opacity: 1,
                        height: "auto",
                        overflow: "visible",
                        transition: {
                          height: { duration: 0.4, ease: "easeOut" },
                          opacity: { duration: 0.3, delay: 0.1 }
                        }
                      }}
                      exit={{
                        opacity: 0,
                        height: 0,
                        overflow: "hidden",
                        transition: {
                          height: { duration: 0.3, ease: "easeIn" },
                          opacity: { duration: 0.2 }
                        }
                      }}
                      className="pt-6 border-t-2 border-gray-200"
                    >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-gradient-to-br from-[#ff7a4a] to-[#ff6fb3] rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {index + 2}
                            </span>
                            <span className="font-medium text-gray-900">Store #{index + 2}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAdditionalStore(store.id)}
                            className="text-red-500 hover:text-red-700 p-1 rounded-[4px] hover:bg-red-50 transition-colors"
                            title="Remove this store"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        <div className="space-y-4 w-full">
                          {/* Store Name Search - Same as Main Field */}
                          <div className="relative w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Store Name <span className="text-red-500">*</span>
                              {store.selectedRetailer && <span className="text-green-600 text-xs ml-2">Selected ✓</span>}
                            </label>

                            {/* Unified Search Container - COMPLETELY RESTRUCTURED */}
                            <div className="relative w-full">
                              {/* Input Field */}
                              <input
                                type="text"
                                value={store.storeQuery}
                                onChange={(e) => handleAdditionalStoreQueryChange(store.id, e.target.value)}
                                onFocus={() => {
                                  if (!store.selectedRetailer) {
                                    handleAdditionalStoreFieldChange(store.id, 'showSuggestions', true);
                                  }
                                }}
                                required
                                className="w-full px-4 py-3 border border-gray-200 rounded-[4px] hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 placeholder-gray-400"
                                placeholder="Start typing store name..."
                              />

                              {/* Dropdown - Absolutely Positioned, No Animations, Max 3 Items */}
                              {store.showSuggestions && store.storeQuery.length >= 1 && (
                                <div
                                  className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-[4px]"
                                  style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    maxHeight: 'none',
                                    overflow: 'visible',
                                    touchAction: 'auto'
                                  }}
                                >
                                  <div style={{ overflow: 'visible' }}>
                                    {store.storeSuggestions.length > 0 ? (
                                      <>
                                        {store.storeSuggestions.slice(0, 3).map((retailer) => {
                                          const isTaken = retailer.converted;
                                          return (
                                            <div
                                              key={retailer.id}
                                              className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-b-0 transition-all overflow-hidden ${
                                                isTaken
                                                  ? 'bg-gray-50 cursor-not-allowed opacity-60'
                                                  : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer'
                                              }`}
                                            >
                                              {isTaken ? (
                                                <div className="flex items-start gap-3 w-full overflow-hidden">
                                                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <span className="text-gray-600 text-xs font-medium">{retailer.name.charAt(0)}</span>
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-gray-500 break-words">
                                                      {retailer.name}
                                                    </div>
                                                    <div className="text-xs text-gray-400 break-words">
                                                      {retailer.address || retailer.location || 'Address not listed'}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2">
                                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        🚫 Taken
                                                      </span>
                                                      <span className="text-xs text-gray-400">
                                                        Already registered
                                                      </span>
                                                    </div>
                                                  </div>
                                                  <div className="flex-shrink-0">
                                                    <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                  </div>
                                                </div>
                                              ) : (
                                                <button
                                                  type="button"
                                                  onClick={() => handleSelectAdditionalRetailer(store.id, retailer)}
                                                  className="w-full overflow-hidden block"
                                                >
                                                  <div className="flex items-start gap-3 w-full overflow-hidden">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff7a4a] to-[#ff6fb3] flex items-center justify-center flex-shrink-0 mt-0.5">
                                                      <span className="text-white text-xs font-medium">{retailer.name.charAt(0)}</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                      <div className="font-medium text-gray-900 group-hover:text-[#ff6fb3] transition-colors break-words">{retailer.name}</div>
                                                      <div className="text-xs text-gray-600 break-words">{retailer.address || retailer.location || 'Address not listed'}</div>
                                                      {retailer.email && <div className="text-xs text-gray-500 break-words">{retailer.email}</div>}
                                                    </div>
                                                    <svg className="w-5 h-5 text-gray-400 group-hover:text-[#ff6fb3] transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                  </div>
                                                </button>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </>
                                    ) : store.showAddNewStore ? (
                                      <button
                                        type="button"
                                        onClick={() => handleAddNewAdditionalStore(store.id)}
                                        disabled={store.isCreatingNew}
                                        className="w-full text-left px-4 py-4 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 hover:from-green-100 hover:via-emerald-100 hover:to-green-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed group rounded-[4px]"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                                            <span className="text-white text-lg">✨</span>
                                          </div>
                                          <div className="flex-1">
                                            <div className="font-medium text-green-700 group-hover:text-green-800 transition-colors">
                                              Add "{store.storeQuery}" as new store
                                            </div>
                                            <div className="text-xs text-green-600">Store not listed? Click to add it!</div>
                                          </div>
                                          {store.isCreatingNew && (
                                            <div className="animate-spin rounded-full h-5 w-5 border border-green-600 border-t-transparent"></div>
                                          )}
                                        </div>
                                      </button>
                                    ) : (
                                      <div className="px-4 py-8 text-gray-500 text-sm flex items-center justify-center gap-2 bg-white rounded-[4px]">
                                        <div className="animate-spin rounded-full h-4 w-4 border border-gray-400 border-t-transparent"></div>
                                        Searching retailers...
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Manager Name */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Manager's Name
                </label>
                            <input
                              type="text"
                              value={store.managerName}
                              onChange={(e) => handleAdditionalStoreFieldChange(store.id, 'managerName', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-200 rounded-[4px] focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400 hover:border-gray-300"
                              placeholder="Store manager's name (optional)"
                            />
                          </div>

                        {/* Store Address - Google Maps + USPS Validation */}
                        <div>
                          <AddressInput
                            value={store.address || ''}
                            onChange={(address) => {
                              handleAdditionalStoreFieldChange(store.id, 'address', address);
                            }}
                            onValidated={(validated) => {
                              // Store USPS-validated address for this additional store
                              const fullAddress = `${validated.address1}${validated.address2 ? ', ' + validated.address2 : ''}, ${validated.city}, ${validated.state} ${validated.zip5}`;
                              handleAdditionalStoreFieldChange(store.id, 'address', fullAddress);
                              handleAdditionalStoreFieldChange(store.id, 'validatedAddress', validated);
                            }}
                            googleApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                            required={true}
                            label="Store Address"
                          />
                        </div>
                    </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Add Store Button */}
                <motion.button
                  type="button"
                  onClick={addAdditionalStore}
                  
                  className="mt-6 px-6 py-3 rounded-[4px] text-sm font-medium transition-all flex items-center gap-2 text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="md:hidden">Add Another Store</span>
                  <span className="hidden md:inline">Add Another Retail Location</span>
                </motion.button>

              </motion.div>

              {/* Success message now shows under Store Name field */}

            </>
          )}

          {step === 2 && (
            <>
              {/* Owner & Manager Names - Side by Side */}
              <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700 mb-2">
                    Owner's Name(s) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="ownerName"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-[4px] focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all text-gray-900 placeholder-gray-400 hover:border-gray-300"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="managerName" className="block text-sm font-medium text-gray-700 mb-2">
                    Manager's Name
                  </label>
                  <input
                    type="text"
                    id="managerName"
                    name="managerName"
                    value={formData.managerName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-[4px] focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all text-gray-900 placeholder-gray-400 hover:border-gray-300"
                    placeholder="Jane Smith (optional)"
                  />
                </div>
              </motion.div>

              {/* Email & Phone - Side by Side */}
              <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-[4px] focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all text-gray-900 placeholder-gray-400 hover:border-gray-300"
                    placeholder="owner@store.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-[4px] focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all text-gray-900 placeholder-gray-400 hover:border-gray-300"
                    placeholder="(555) 123-4567 (optional)"
                  />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div variants={fadeInUp}>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Create Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-200 rounded-[4px] focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all text-gray-900 placeholder-gray-400 hover:border-gray-300"
                  placeholder="At least 6 characters"
                />
                <p className="text-xs text-gray-500 mt-1">Create a password to access your account dashboard</p>
              </motion.div>

            </>
          )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[4px] flex items-start gap-2"
                >
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{error}</span>
                </motion.div>
              )}

          <div style={{ display: 'flex', gap: 12, paddingTop: 16 }}>
            {step === 2 && (
              <button type="button" className="t-btn t-btn--secondary" onClick={() => setStep(1)}>Back</button>
            )}
            {step === 1 ? (
              <button type="button" className="t-btn t-btn--primary" style={{ flex: 1 }} onClick={goToStep2}>Continue</button>
            ) : (
              <button type="submit" className="t-btn t-btn--primary" style={{ flex: 1 }} disabled={loading}>
                {loading ? 'Setting up…' : `Claim my free display${additionalStores.length > 0 ? `s (${additionalStores.length + 1})` : ''}`}
              </button>
            )}
          </div>

          {step === 2 && (
            <p style={{ fontSize: 12, color: 'var(--pewter)', paddingTop: 8 }}>
              By submitting you agree to receive your display{additionalStores.length > 0 ? 's' : ''} and marketing emails. Unsubscribe anytime. Shipping is free.
            </p>
          )}
        </form>

        <div style={{ padding: '48px 0 96px' }}>
          <Link href="/onboard" className="t-footer__link">← Back to overview</Link>
        </div>
      </div>
    </div>
  );
}
