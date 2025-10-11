import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CommissionSettingsModal({ vendor, isOpen, onClose, onSave }) {
  const [retailerPercent, setRetailerPercent] = useState(20);
  const [sourcerPercent, setSourcerPercent] = useState(10);
  const [tapifyPercent, setTapifyPercent] = useState(10);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Calculate vendor percent (what's left after others)
  const vendorPercent = Math.max(0, 100 - retailerPercent - sourcerPercent - tapifyPercent);
  const total = retailerPercent + sourcerPercent + tapifyPercent + vendorPercent;
  const isValid = total === 100;

  // Load vendor's current settings when modal opens
  useEffect(() => {
    if (isOpen && vendor) {
      setRetailerPercent(vendor.retailer_commission_percent ?? 20);
      setSourcerPercent(vendor.sourcer_commission_percent ?? 10);
      setTapifyPercent(vendor.tapify_commission_percent ?? 10);
      setError(null);
    }
  }, [isOpen, vendor]);

  const handleSave = async () => {
    if (!isValid) {
      setError('Total must equal 100%');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/update-vendor-commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: vendor.id,
          retailerPercent,
          sourcerPercent,
          tapifyPercent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update commission');
      }

      onSave(data.vendor);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!vendor) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 pointer-events-auto">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    Commission Settings
                  </h2>
                  <p className="text-gray-600">
                    Adjust commission splits for <span className="font-semibold text-[#ff6fb3]">{vendor.name}</span>
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Total Display */}
              <div className={[
                "rounded-2xl p-4 mb-6 border-2",
                isValid
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              ].join(" ")}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">Total Commission Split:</span>
                  <span className={[
                    "text-2xl font-bold",
                    isValid ? "text-green-700" : "text-red-700"
                  ].join(" ")}>
                    {total}%
                  </span>
                </div>
                {!isValid && (
                  <p className="text-sm text-red-600 mt-2">
                    ⚠️ Total must equal 100%. Current: {total}%
                  </p>
                )}
              </div>

              {/* Sliders */}
              <div className="space-y-6 mb-6">
                {/* Retailer */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="font-semibold text-gray-900">Retailer Commission</label>
                    <span className="text-2xl font-bold text-blue-600">{retailerPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={retailerPercent}
                    onChange={(e) => setRetailerPercent(Number(e.target.value))}
                    className="w-full h-3 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Sourcer */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="font-semibold text-gray-900">Sourcer Commission</label>
                    <span className="text-2xl font-bold text-orange-600">{sourcerPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sourcerPercent}
                    onChange={(e) => setSourcerPercent(Number(e.target.value))}
                    className="w-full h-3 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Tapify */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="font-semibold text-gray-900">Tapify Commission</label>
                    <span className="text-2xl font-bold text-pink-600">{tapifyPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={tapifyPercent}
                    onChange={(e) => setTapifyPercent(Number(e.target.value))}
                    className="w-full h-3 bg-pink-200 rounded-lg appearance-none cursor-pointer accent-pink-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Vendor (calculated) */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border-2 border-purple-200">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-gray-900">
                      Vendor Commission (You Keep)
                    </label>
                    <span className="text-2xl font-bold text-purple-700">{vendorPercent}%</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    This is automatically calculated as what's left after other commissions.
                  </p>
                </div>
              </div>

              {/* Example Calculation */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Example: $100 Sale</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Retailer:</span>
                    <span className="font-bold text-blue-700">${(100 * retailerPercent / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sourcer:</span>
                    <span className="font-bold text-orange-700">${(100 * sourcerPercent / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tapify:</span>
                    <span className="font-bold text-pink-700">${(100 * tapifyPercent / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vendor (You):</span>
                    <span className="font-bold text-purple-700">${(100 * vendorPercent / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4 mb-6">
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 rounded-2xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!isValid || saving}
                  className={[
                    "flex-1 px-6 py-3 rounded-2xl font-bold transition-all",
                    isValid && !saving
                      ? "bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white hover:shadow-lg"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  ].join(" ")}
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Saving...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
