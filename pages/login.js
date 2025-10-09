import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
  const router = useRouter();
  const { user, loading, signIn, signUp } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Check if auth is disabled for testing
  const disableAuth = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

  // If auth is disabled, redirect immediately
  useEffect(() => {
    if (disableAuth) {
      console.log('🚧 Auth disabled - redirecting to dashboard');
      const redirectTo = router.query.redirect || '/onboard/dashboard';
      router.push(redirectTo);
    }
  }, [disableAuth, router]);

  // Redirect if already logged in (silently, no popup)
  useEffect(() => {
    if (user && !loading && router.isReady) {
      const redirectTo = router.query.redirect || '/onboard/dashboard';
      router.replace(redirectTo); // Use replace instead of push to avoid back button issues
    }
  }, [user, loading, router.isReady, router.query.redirect]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('\n🔐 [Login] Form submitted:', { email, isSignUp });
    
    setError('');
    setSubmitting(true);

    try {
      if (isSignUp) {
        const redirectUrl = typeof window !== 'undefined'
          ? `${window.location.origin}/onboard/dashboard`
          : undefined;

        const signUpOptions = {};
        if (redirectUrl) {
          signUpOptions.emailRedirectTo = redirectUrl;
        }

        const { error: signUpError } = await signUp(email, password, signUpOptions);

        if (signUpError) throw signUpError;

        setError('success:Check your email to confirm your account!');
      } else {
        const { error: signInError } = await signIn(email, password);

        if (signInError) {
          const message = signInError.message || '';

          if (message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please try again.');
          } else if (message.includes('Email not confirmed')) {
            setError('Please verify your email before signing in.');
          } else {
            setError(message || 'Unable to sign in. Please try again.');
          }
          return;
        }

        // Successful login - redirect
        const redirectTo = router.query.redirect || '/onboard/dashboard';
        router.replace(redirectTo);
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading or nothing if already authenticated
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 relative overflow-hidden" style={{ backgroundColor: '#FFFFFF' }}>
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
          className="bg-white rounded-3xl shadow-2xl border-2 border-gray-100 p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#ff7a4a] to-[#ff6fb3] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isSignUp ? 'Create Account' : 'Welcome to Tapify'}
            </h1>
            <p className="text-gray-600">
              {isSignUp ? 'Sign up to get started with your dashboard' : 'Sign in to access your dashboard'}
            </p>
          </div>

          {/* Custom Login Form */}
          {supabase ? (
            <AnimatePresence mode="wait">
              <motion.form
                key={isSignUp ? 'signup' : 'login'}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 outline-none focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 outline-none focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>

                {/* Success Message */}
                {error && error.startsWith('success:') && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-4 rounded-2xl text-sm font-medium flex items-center gap-3"
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{error.replace('success:', '')}</span>
                  </motion.div>
                )}

                {/* Error Message */}
                {error && !error.startsWith('success:') && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-4 rounded-2xl text-sm font-medium flex items-center gap-3"
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
                  disabled={submitting}
                  whileHover={!submitting ? { scale: 1.02 } : {}}
                  whileTap={!submitting ? { scale: 0.98 } : {}}
                  className="w-full bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white py-3 px-4 rounded-2xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      {isSignUp ? 'Creating account...' : 'Signing in...'}
                    </span>
                  ) : (
                    isSignUp ? 'Create Account' : 'Sign In'
                  )}
                </motion.button>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-sm text-[#ff6fb3] hover:text-[#ff58a8] font-medium"
                  >
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                  </button>
                  
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => router.push('/reset-password')}
                      className="text-sm text-gray-600 hover:text-[#ff6fb3] font-medium"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
              </motion.form>
            </AnimatePresence>
          ) : (
            <div className="text-center text-red-600 p-4 bg-red-50 rounded-lg">
              Supabase is not configured. Please add your environment variables.
            </div>
          )}
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
