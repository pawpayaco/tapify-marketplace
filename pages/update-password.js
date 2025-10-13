import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

export default function UpdatePassword() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Check if user came from password reset email
  useEffect(() => {
    // Supabase will automatically handle the token from the URL
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User has clicked the reset link and is ready to set new password
        console.log('Password recovery detected');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#FFFFFF' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[23px] shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] border border-transparent p-8 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Password Updated!</h2>
          <p className="text-gray-600 mb-4">Your password has been successfully updated.</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0]
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full blur-3xl opacity-30"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0]
          }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full blur-3xl opacity-30"
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-[23px] shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] border border-transparent p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#ff7a4a] to-[#ff6fb3] rounded-[23px] flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Set New Password
            </h1>
            <p className="text-gray-600">
              Enter your new password below
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-[15px] border-2 border-gray-200 outline-none focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-[15px] border-2 border-gray-200 outline-none focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all"
                placeholder="Re-enter password"
              />
            </div>

            {/* Password Requirements */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-[23px] p-4">
              <p className="text-xs font-bold text-blue-900 mb-2">Password Requirements:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li className={`flex items-center gap-2 ${password.length >= 6 ? 'text-green-600' : ''}`}>
                  <span className={`text-sm ${password.length >= 6 ? '✓' : '○'}`}></span>
                  At least 6 characters
                </li>
                <li className={`flex items-center gap-2 ${password && confirmPassword && password === confirmPassword ? 'text-green-600' : ''}`}>
                  <span className={`text-sm ${password && confirmPassword && password === confirmPassword ? '✓' : '○'}`}></span>
                  Passwords match
                </li>
              </ul>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-4 rounded-[23px] text-sm font-medium flex items-center gap-3"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
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
              className="w-full bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white py-3 px-4 rounded-[16px] font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border border-transparent border-t-transparent"></div>
                  Updating password...
                </span>
              ) : (
                'Update Password'
              )}
            </motion.button>

            {/* Back to Login */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="text-sm text-gray-600 hover:text-[#ff6fb3] font-medium inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to login
              </button>
            </div>
          </form>
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-6">
          <a href="/" className="text-gray-600 hover:text-[#ff6fb3] transition-colors text-sm">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}

