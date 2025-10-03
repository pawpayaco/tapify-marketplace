import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * AdminAddOwnerModal Component
 * 
 * Modal for admin to add owner info for outreach (does NOT create auth user)
 * Used in admin stores page for pre-registering owner info before actual signup
 */
export default function AdminAddOwnerModal({ isOpen, onClose, retailer, onSuccess }) {
  const [formData, setFormData] = useState({
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.ownerEmail) {
      setError('Owner email is required');
      return;
    }
    if (!emailRegex.test(formData.ownerEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/add-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          retailer_id: retailer.id,
          owner_name: formData.ownerName,
          owner_email: formData.ownerEmail,
          owner_phone: formData.ownerPhone,
          notes: formData.notes
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add owner information');
      }

      console.log('[Modal] Owner added successfully:', result);

      // Show success state
      setSuccess(true);

      // Wait for animation, then reset and close
      setTimeout(() => {
        setFormData({
          ownerName: '',
          ownerEmail: '',
          ownerPhone: '',
          notes: ''
        });
        setSuccess(false);
        
        // Call success callback
        if (onSuccess) {
          onSuccess(result);
        }

        // Close modal
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Error adding owner:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        ownerName: '',
        ownerEmail: '',
        ownerPhone: '',
        notes: ''
      });
      setError('');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl border-2 border-gray-100 p-6 md:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="mb-6 pb-6 border-b-2 border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <span className="text-2xl">📧</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">Add Owner Info</h3>
                        <p className="text-gray-500 text-xs">Outreach Tracking</p>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl px-4 py-3 mt-3">
                      <p className="text-sm text-gray-700">
                        <span className="font-bold text-gray-900">Store:</span> {retailer?.name}
                      </p>
                      {retailer?.address && (
                        <p className="text-xs text-gray-600 mt-1">
                          {retailer.address}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-blue-600 mt-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      For outreach tracking only - does not create user account
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={loading}
                    className="ml-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl p-2 transition-all disabled:opacity-50"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Owner Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Owner Name
                  </label>
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 outline-none focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all"
                    placeholder="John Doe"
                  />
                </div>

                {/* Owner Email */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Owner Email *
                  </label>
                  <input
                    type="email"
                    name="ownerEmail"
                    value={formData.ownerEmail}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 outline-none focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all"
                    placeholder="owner@example.com"
                  />
                </div>

                {/* Owner Phone */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Owner Phone
                  </label>
                  <input
                    type="tel"
                    name="ownerPhone"
                    value={formData.ownerPhone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 outline-none focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all"
                    placeholder="(555) 123-4567"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 outline-none focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all resize-none"
                    placeholder="Additional notes about this owner..."
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm flex items-center gap-2"
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </motion.div>
                )}

                {/* Success Message */}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-r from-green-400 to-emerald-500 border-2 border-green-300 text-white px-4 py-4 rounded-2xl text-sm font-bold flex items-center gap-3"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </motion.div>
                    <span>Owner information added successfully!</span>
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <motion.button
                    type="submit"
                    disabled={loading || success}
                    whileHover={!loading && !success ? { scale: 1.02 } : {}}
                    whileTap={!loading && !success ? { scale: 0.98 } : {}}
                    className={[
                      "flex-1 px-6 py-3 rounded-2xl font-bold transition-all disabled:cursor-not-allowed",
                      success 
                        ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white"
                        : "bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white hover:shadow-lg disabled:opacity-50"
                    ].join(" ")}
                  >
                    {success ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Added!
                      </span>
                    ) : loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Adding...
                      </span>
                    ) : (
                      '✨ Add Owner Info'
                    )}
                  </motion.button>
                  
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading || success}
                    className="px-6 py-3 rounded-2xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

