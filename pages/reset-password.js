import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResetPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;

      setMessage('success:Check your email for the password reset link!');
      setEmail('');
    } catch (err) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pt-24 sm:pt-32 pb-8 sm:pb-16 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-transparent p-5 sm:p-8"
        >
          {/* Header */}
          <div className="text-center mb-5 sm:mb-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#ff7a4a] to-[#ff6fb3] rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
              Reset Password
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Enter your email and we'll send you a link to reset your password
            </p>
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key="reset-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleResetPassword}
              className="space-y-4 sm:space-y-6"
            >
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base rounded-xl sm:rounded-2xl border-2 border-gray-200 outline-none focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all"
                  placeholder="you@example.com"
                />
              </div>

            {/* Success Message */}
            {message && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 border-2 border-green-200 text-green-700 px-3 py-3 sm:px-4 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium flex items-center gap-2 sm:gap-3"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{message.replace('success:', '')}</span>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border-2 border-red-200 text-red-700 px-3 py-3 sm:px-4 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium flex items-center gap-2 sm:gap-3"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              className="w-full bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white py-2.5 sm:py-3 px-4 text-sm sm:text-base rounded-xl sm:rounded-2xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border border-transparent border-t-transparent"></div>
                  Sending reset link...
                </span>
              ) : (
                'Send Reset Link'
              )}
            </motion.button>

              {/* Back to Login */}
              <div className="text-center pt-1 sm:pt-2">
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="text-xs sm:text-sm text-gray-600 hover:text-[#ff6fb3] font-medium inline-flex items-center gap-2"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to login
                </button>
              </div>
            </motion.form>
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-4 sm:mt-6">
          <a href="/" className="text-gray-600 hover:text-[#ff6fb3] transition-colors text-xs sm:text-sm">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}

