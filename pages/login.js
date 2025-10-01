import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../context/AuthContext';

export default function Login() {
  const router = useRouter();
  const { user, loading } = useAuthContext();
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
      console.log('🚧 Auth disabled - redirecting to admin');
      const redirectTo = router.query.redirect || '/admin';
      router.push(redirectTo);
    }
  }, [disableAuth, router]);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      // Check if there's a redirect query param
      const redirectTo = router.query.redirect || '/admin';
      router.push(redirectTo);
    }
  }, [user, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/admin`,
          },
        });
        if (error) throw error;
        setError('Check your email to confirm your account!');
      } else {
             const { data, error } = await supabase.auth.signInWithPassword({
               email,
               password,
             });
             if (error) throw error;
             
             // Redirect to specified page or default to admin
             const redirectTo = router.query.redirect || '/admin';
             router.push(redirectTo);
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading or nothing if already authenticated
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#ff7a4a] mb-2">
              Welcome to Tapify
            </h1>
            <p className="text-gray-600">
              Sign in to access your dashboard
            </p>
          </div>

          {/* Google Sign In Button - TEMPORARILY DISABLED */}
          {false && supabase && (
            <button
              onClick={async () => {
                const redirectTo = router.query.redirect || '/admin';
                const { error } = await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: {
                    redirectTo: `${window.location.origin}${redirectTo}`,
                  },
                });
                if (error) setError(error.message);
              }}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all mb-4"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          )}

          {false && (
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with email</span>
              </div>
            </div>
          )}

          {/* Custom Login Form */}
          {supabase ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className={`p-3 rounded-lg text-sm ${error.includes('Check your email') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm text-[#ff6fb3] hover:text-[#ff58a8] font-medium"
                >
                  {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center text-red-600 p-4 bg-red-50 rounded-lg">
              Supabase is not configured. Please add your environment variables.
            </div>
          )}
        </div>

        {/* Footer link */}
        <div className="text-center mt-6">
          <a href="/" className="text-gray-600 hover:text-[#ff6fb3] transition-colors text-sm">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}