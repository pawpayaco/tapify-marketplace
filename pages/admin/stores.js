import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '../../lib/supabase';
import StoresDataGrid from '../../components/StoresDataGrid';
import AddProspectModal from '../../components/AddProspectModal';

/**
 * Server-side authentication check
 * Same pattern as admin.js
 */
export async function getServerSideProps(context) {
  try {
    const { req, res } = context;

    // Parse cookies from raw Cookie header
    const cookieHeader = req.headers.cookie || '';
    const parsedCookies = {};
    if (cookieHeader) {
      cookieHeader.split(';').forEach(cookie => {
        const [name, ...rest] = cookie.trim().split('=');
        if (name && rest.length > 0) {
          parsedCookies[name] = rest.join('=');
        }
      });
    }
    
    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return parsedCookies[name] || req.cookies?.[name];
          },
          set(name, value, options) {
            if (!res.headersSent) {
              res.setHeader('Set-Cookie', `${name}=${value}; Path=/; ${options?.secure ? 'Secure;' : ''} ${options?.httpOnly ? 'HttpOnly;' : ''}`);
            }
          },
          remove(name, options) {
            if (!res.headersSent) {
              res.setHeader('Set-Cookie', `${name}=; Path=/; Max-Age=0`);
            }
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseServer.auth.getUser();

    if (userError || !user) {
      return {
        redirect: {
          destination: '/login?redirect=/admin/stores',
          permanent: false,
        },
      };
    }

    // Check if user is admin
    if (!supabaseAdmin) {
      return {
        props: {
          user: { id: user.id, email: user.email },
          isAdmin: false,
          error: 'Admin client not configured',
        },
      };
    }

    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('id, email')
      .eq('id', user.id)
      .maybeSingle();

    if (adminError || !adminData) {
      return {
        props: {
          user: { id: user.id, email: user.email },
          isAdmin: false,
          error: 'User not in admins table',
        },
      };
    }

    return {
      props: {
        user: { id: user.id, email: user.email },
        isAdmin: true,
        error: null,
      },
    };

  } catch (error) {
    console.error('[admin/stores] Auth error:', error);
    return {
      redirect: {
        destination: '/login?redirect=/admin/stores',
        permanent: false,
      },
    };
  }
}

export default function AdminStores({ user, isAdmin, error }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAddProspectModal, setShowAddProspectModal] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Scroll to top on page load
    window.scrollTo(0, 0);
  }, []);

  // Handle prospect added
  const handleProspectAdded = () => {
    setRefreshKey(prev => prev + 1); // Trigger refresh of data grid
    setShowAddProspectModal(false);
  };

  // Loading state
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  // Access denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-100 border-l-4 border-red-500 rounded-[23px] shadow-lg p-6">
            <h1 className="text-2xl font-bold text-red-900 mb-2">🚫 Access Denied</h1>
            <p className="text-red-800 mb-4">You are not authorized to access the stores admin panel.</p>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
                <p className="font-bold text-red-900">Error:</p>
                <p className="text-sm text-red-800 font-mono">{error}</p>
              </div>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => router.push('/admin')}
                className="px-6 py-3 bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white rounded-[15px] font-bold hover:shadow-lg"
              >
                ← Back to Admin
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-gray-600 text-white rounded-[15px] font-bold hover:bg-gray-700"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main admin stores view
  return (
    <div className="min-h-screen pt-20" style={{ backgroundColor: '#faf8f3' }}>
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white shadow-lg relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => router.push('/admin')}
                  className="p-2 hover:bg-white/20 rounded-[15px] transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-3xl">🏪</span>
                <h1 className="text-3xl md:text-4xl font-bold">Stores / Outreach</h1>
              </div>
              <p className="text-white/90 ml-14">
                Manage retailers, track outreach campaigns, and register store owners
              </p>
              <p className="text-white/70 text-sm ml-14 mt-1">
                Logged in as: <span className="font-semibold">{user?.email}</span>
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Action Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-[23px] shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] border border-transparent p-4 mb-6"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="text-gray-700 font-bold text-lg">
              📊 Store Management
            </div>

            {/* Add Prospect Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddProspectModal(true)}
              className="rounded-[15px] px-6 py-3 text-sm font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              🏪 Add Prospect
            </motion.button>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <StoresDataGrid
            key={refreshKey}
            onRefresh={() => setRefreshKey(prev => prev + 1)}
          />
        </motion.div>

        {/* Footer */}
        <motion.footer 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center py-6"
        >
          <p className="text-gray-600 font-medium">
            Tapify Stores & Outreach Admin • {new Date().getFullYear()}
          </p>
        </motion.footer>
      </div>

      {/* Add Prospect Modal */}
      <AddProspectModal
        isOpen={showAddProspectModal}
        onClose={() => setShowAddProspectModal(false)}
        onSuccess={handleProspectAdded}
      />
    </div>
  );
}

