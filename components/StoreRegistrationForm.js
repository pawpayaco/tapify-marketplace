import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

/**
 * StoreRegistrationForm Component
 * 
 * Form to register a store owner with:
 * - Store selection (autocomplete dropdown)
 * - Owner contact fields
 * - Campaign tracking
 * - Submits to /api/register-store
 */
export default function StoreRegistrationForm({ preselectedStore = null, onSuccess, onCancel, adminUserId }) {
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Form fields
  const [selectedStore, setSelectedStore] = useState(preselectedStore);
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [campaign, setCampaign] = useState(`cold-email-${new Date().toISOString().slice(0, 7)}`);
  const [notes, setNotes] = useState('');
  
  // UI states
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Fetch stores for dropdown
  useEffect(() => {
    const fetchStores = async () => {
      if (!supabase) {
        setLoadingStores(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('retailers')
          .select('id, name, address')
          .order('name', { ascending: true });

        if (error) throw error;

        setStores(data || []);
      } catch (err) {
        console.error('[StoreRegistrationForm] Error fetching stores:', err);
      } finally {
        setLoadingStores(false);
      }
    };

    fetchStores();
  }, []);

  // Filter stores based on search
  const filteredStores = stores.filter(store => {
    const search = searchTerm.toLowerCase();
    return (
      store.name?.toLowerCase().includes(search) ||
      store.address?.toLowerCase().includes(search)
    );
  });

  // Select store from dropdown
  const selectStore = (store) => {
    setSelectedStore(store);
    setSearchTerm('');
    setShowDropdown(false);
  };

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!selectedStore) {
      setError('Please select a store');
      return;
    }

    if (!ownerName && !ownerPhone && !ownerEmail) {
      setError('Please provide at least one owner contact field (name, phone, or email)');
      return;
    }

    setSubmitting(true);

    try {
      // Get admin secret from environment (if set)
      const adminSecret = process.env.NEXT_PUBLIC_ADMIN_API_SECRET;

      const response = await fetch('/api/register-store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminSecret && { 'x-admin-secret': adminSecret }),
        },
        body: JSON.stringify({
          retailer_id: selectedStore.id,
          owner_name: ownerName,
          owner_phone: ownerPhone,
          owner_email: ownerEmail,
          campaign,
          collected_by: adminUserId || 'admin-panel',
          notes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to register store');
      }

      showToast('✅ Store registered successfully! Retailer marked as converted.', 'success');
      
      // Reset form
      setSelectedStore(null);
      setOwnerName('');
      setOwnerPhone('');
      setOwnerEmail('');
      setNotes('');
      
      // Call success callback
      if (onSuccess) {
        onSuccess(result.data);
      }

    } catch (err) {
      console.error('[StoreRegistrationForm] Submission error:', err);
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-6 md:p-8 overflow-hidden max-w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Register Store Owner</h2>
        <p className="text-gray-600">
          Select a store and enter owner contact information. This will mark the retailer as converted.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Store Selection */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Store / Retailer *
          </label>
          
          {selectedStore ? (
            <div className="flex items-center gap-3 p-4 rounded-2xl border-2 border-green-200 bg-green-50">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 truncate">{selectedStore.name}</div>
                <div className="text-sm text-gray-600 truncate">{selectedStore.address}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStore(null)}
                className="px-3 py-1.5 rounded-xl bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 flex-shrink-0"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="relative w-full overflow-hidden">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search by name or address..."
                className="w-full h-12 px-4 rounded-2xl border-2 border-gray-200 outline-none focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent"
              />

              {showDropdown && (
                <div className="absolute z-10 left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-2xl shadow-xl max-h-64 overflow-auto">
                  {loadingStores ? (
                    <div className="p-4 text-center text-gray-500">Loading stores...</div>
                  ) : filteredStores.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No stores found</div>
                  ) : (
                    filteredStores.map((store) => (
                      <button
                        key={store.id}
                        type="button"
                        onClick={() => selectStore(store)}
                        className="w-full text-left p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 block"
                      >
                        <div className="font-bold text-gray-900 truncate overflow-hidden text-ellipsis whitespace-nowrap">{store.name}</div>
                        <div className="text-sm text-gray-600 truncate overflow-hidden text-ellipsis whitespace-nowrap">{store.address}</div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Owner Name */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Owner Name
          </label>
          <input
            type="text"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="John Doe"
            className="w-full h-12 px-4 rounded-2xl border-2 border-gray-200 outline-none focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent"
          />
        </div>

        {/* Owner Phone */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Owner Phone
          </label>
          <input
            type="tel"
            value={ownerPhone}
            onChange={(e) => setOwnerPhone(e.target.value)}
            placeholder="(555) 123-4567"
            className="w-full h-12 px-4 rounded-2xl border-2 border-gray-200 outline-none focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent"
          />
        </div>

        {/* Owner Email */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Owner Email
          </label>
          <input
            type="email"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
            placeholder="owner@example.com"
            className="w-full h-12 px-4 rounded-2xl border-2 border-gray-200 outline-none focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Email is recommended for duplicate detection
          </p>
        </div>

        {/* Campaign */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Campaign
          </label>
          <input
            type="text"
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            placeholder="cold-email-2025-10"
            className="w-full h-12 px-4 rounded-2xl border-2 border-gray-200 outline-none focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Campaign identifier for tracking (e.g., cold-email-2025-10)
          </p>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes about this registration..."
            rows={3}
            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 outline-none focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent resize-none"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-200">
            <p className="text-red-800 font-bold">Error:</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex flex-wrap gap-3 pt-4 border-t-2 border-gray-100">
          <motion.button
            type="submit"
            disabled={submitting || !selectedStore}
            whileHover={!submitting && selectedStore ? { scale: 1.05 } : {}}
            whileTap={!submitting && selectedStore ? { scale: 0.95 } : {}}
            className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Registering...
              </span>
            ) : (
              '✓ Register Store'
            )}
          </motion.button>

          {onCancel && (
            <motion.button
              type="button"
              onClick={onCancel}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 h-12 rounded-2xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-50"
            >
              Cancel
            </motion.button>
          )}
        </div>

        <p className="text-xs text-gray-500 text-center">
          * At least one owner contact field (name, phone, or email) is required
        </p>
      </form>

      {/* Toast Notification */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-8 right-8 z-50"
        >
          <div className={[
            "rounded-2xl px-6 py-4 shadow-2xl border-2 flex items-center gap-3 min-w-[300px]",
            toast.type === 'success' 
              ? "bg-gradient-to-r from-green-400 to-emerald-500 border-green-300 text-white" 
              : "bg-gradient-to-r from-red-400 to-rose-500 border-red-300 text-white"
          ].join(" ")}>
            <p className="font-bold">{toast.message}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

