import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import AddressInput from './AddressInput';

export default function OrderDisplayModal({ isOpen, onClose, onSuccess }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Store search state
  const [storeQuery, setStoreQuery] = useState('');
  const [storeSuggestions, setStoreSuggestions] = useState([]);
  const [selectedRetailer, setSelectedRetailer] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAddNewStore, setShowAddNewStore] = useState(false);
  const suggestionsRef = useRef(null);

  const [formData, setFormData] = useState({
    storeName: '',
    managerName: '',
    address: ''
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ storeName: '', managerName: '', address: '' });
      setStoreQuery('');
      setSelectedRetailer(null);
      setError('');
    }
  }, [isOpen]);

  // Fetch store suggestions
  useEffect(() => {
    if (!storeQuery || storeQuery.length < 1) {
      setStoreSuggestions([]);
      setShowAddNewStore(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/retailers/search?query=${encodeURIComponent(storeQuery)}`);
        const data = await response.json();

        if (data.error) {
          setStoreSuggestions([]);
          setShowAddNewStore(true);
        } else {
          setStoreSuggestions(data.results || []);
          setShowAddNewStore(data.results?.length === 0);
        }
      } catch (err) {
        console.error('Store search error:', err);
        setStoreSuggestions([]);
        setShowAddNewStore(true);
      }
    }, 300);

    return () => clearTimeout(timer);
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

  // Select retailer from suggestions
  const handleSelectRetailer = (retailer) => {
    setSelectedRetailer(retailer);
    setStoreQuery(retailer.name);
    setFormData(prev => ({
      ...prev,
      storeName: retailer.name,
      address: retailer.address || retailer.location || ''
    }));
    setShowSuggestions(false);
    setStoreSuggestions([]);
  };

  // Add new store (not in suggestions)
  const handleAddNewStore = async () => {
    if (!storeQuery || storeQuery.trim().length < 1) {
      setError('Please enter a store name');
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
          address: null,
          phone: null,
          email: null,
          source: 'order-display'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add store');
      }

      if (data.ok && data.retailer) {
        setSelectedRetailer(data.retailer);
        setFormData(prev => ({ ...prev, storeName: data.retailer.name }));
        setShowAddNewStore(false);
        setShowSuggestions(false);
        setStoreSuggestions([]);
      }
    } catch (err) {
      console.error('Error adding store:', err);
      setError(err.message || 'Failed to add store');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.storeName || !formData.address) {
        throw new Error('Please fill in store name and address');
      }

      const response = await fetch('/api/order-display', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to order display');
      }

      // Success! Close modal and call success callback
      if (onSuccess) {
        onSuccess(result);
      }

      // Redirect to Shopify connect page
      setTimeout(() => {
        router.push('/onboard/shopify-connect');
      }, 500);

    } catch (err) {
      console.error('Order display error:', err);
      setError(err.message || 'Failed to order display');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b-2 border-gray-100 px-8 py-6 rounded-t-[15px] z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Order Another Display</h2>
                <p className="text-gray-600 mt-1">Add another retail location to grow your earnings</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
            {/* Store Name with Autocomplete */}
            <div className="relative" ref={suggestionsRef}>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Store Name <span className="text-red-500">*</span>
                {selectedRetailer && <span className="text-green-600 text-xs ml-2">Selected ✓</span>}
              </label>

              <div className="relative">
                <input
                  type="text"
                  value={storeQuery}
                  onChange={(e) => {
                    setStoreQuery(e.target.value);
                    setFormData(prev => ({ ...prev, storeName: e.target.value }));
                    setShowSuggestions(true);
                    setSelectedRetailer(null);
                  }}
                  onFocus={() => {
                    if (!selectedRetailer) {
                      setShowSuggestions(true);
                    }
                  }}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl hover:border-gray-300 focus:border-[#ff6fb3] focus:ring-2 focus:ring-[#ff6fb3]/20 transition-all text-gray-900 placeholder-gray-400"
                  placeholder="Start typing store name..."
                />

                {/* Dropdown */}
                {showSuggestions && storeQuery.length >= 1 && (
                  <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-2xl shadow-2xl max-h-64 overflow-y-auto">
                    {storeSuggestions.length > 0 ? (
                      <>
                        {storeSuggestions.slice(0, 3).map((store) => {
                          const isTaken = store.converted;
                          return (
                            <div
                              key={store.id}
                              className={`px-4 py-3 border-b border-gray-100 last:border-b-0 ${
                                isTaken ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer'
                              }`}
                            >
                              {isTaken ? (
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                                    <span className="text-gray-600 text-xs font-bold">{store.name.charAt(0)}</span>
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-bold text-gray-500">{store.name}</div>
                                    <div className="text-xs text-gray-400">{store.address || 'Address not listed'}</div>
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-2">
                                      🚫 Already registered
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSelectRetailer(store)}
                                  className="w-full text-left"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff7a4a] to-[#ff6fb3] flex items-center justify-center flex-shrink-0">
                                      <span className="text-white text-xs font-bold">{store.name.charAt(0)}</span>
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-bold text-gray-900">{store.name}</div>
                                      <div className="text-xs text-gray-600">{store.address || store.location || 'Address not listed'}</div>
                                    </div>
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
                        className="w-full px-4 py-4 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all disabled:opacity-50 rounded-2xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                            <span className="text-white text-lg">✨</span>
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-bold text-green-700">Add "{storeQuery}" as new store</div>
                            <div className="text-xs text-green-600">Store not listed? Click to add it!</div>
                          </div>
                          {loading && (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-600 border-t-transparent"></div>
                          )}
                        </div>
                      </button>
                    ) : (
                      <div className="px-4 py-8 text-gray-500 text-sm flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
                        Searching...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Manager Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Manager's Name
              </label>
              <input
                type="text"
                value={formData.managerName}
                onChange={(e) => setFormData(prev => ({ ...prev, managerName: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all text-gray-900 placeholder-gray-400 hover:border-gray-300"
                placeholder="Store manager's name (optional)"
              />
            </div>

            {/* Address */}
            <div>
              <AddressInput
                value={formData.address}
                onChange={(address) => {
                  setFormData(prev => ({ ...prev, address }));
                }}
                onValidated={(validated) => {
                  const fullAddress = `${validated.address1}${validated.address2 ? ', ' + validated.address2 : ''}, ${validated.city}, ${validated.state} ${validated.zip5}`;
                  setFormData(prev => ({ ...prev, address: fullAddress }));
                }}
                googleApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                required={true}
                label="Store Address (Shipping Address)"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-2">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white py-3 px-6 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                  'Order Display'
                )}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Your new display will be shipped within 3 weeks. Free shipping included.
            </p>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
