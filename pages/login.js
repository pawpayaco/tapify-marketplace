import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../context/AuthContext';

export default function Login() {
  const router = useRouter();
  const { user, loading } = useAuthContext();

  // Redirect to admin if already logged in
  useEffect(() => {
    if (user && !loading) {
      router.push('/admin');
    }
  }, [user, loading, router]);

  // Show loading or nothing if already authenticated
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fff3ea] via-white to-[#fff6fb]">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#fff3ea] via-white to-[#fff6fb]">
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

          {/* Supabase Auth UI */}
          {supabase ? (
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#ff6fb3',
                      brandAccent: '#ff58a8',
                    },
                  },
                },
                className: {
                  container: 'auth-container',
                  button: 'auth-button',
                  input: 'auth-input',
                },
              }}
              providers={['google']}
              redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/admin`}
              onlyThirdPartyProviders={false}
            />
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
