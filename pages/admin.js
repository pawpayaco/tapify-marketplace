import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { createServerClient } from '@supabase/ssr';
import { supabase, supabaseAdmin } from "../lib/supabase";
import { formatMoney } from "../utils/formatMoney";
import { triggerPayout } from "../services/dwolla";
import CommissionSettingsModal from "../components/CommissionSettingsModal";
import RetailerPayoutRow from "../components/RetailerPayoutRow";

const TABS = ["Vendors", "Retailers", "Stores", "Payouts", "Analytics", "Sourcers", "UIDs"];

/**
 * Server-side authentication check using @supabase/ssr
 * Always returns props, never redirects
 */
export async function getServerSideProps(context) {

  try {
    const { req, res } = context;

    // Parse cookies from raw Cookie header since req.cookies might be empty
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

    if (userError) {
      console.error('[ADMIN] Auth error:', userError.message);
      return {
        props: {
          user: null,
          isAdmin: false,
          error: `Auth error: ${userError.message}`,
          debugInfo: {
            timestamp: new Date().toISOString(),
            userError: userError.message,
            errorStatus: userError.status,
          },
        },
      };
    }

    if (!user) {
      return {
        props: {
          user: null,
          isAdmin: false,
          error: 'No user session found',
          debugInfo: {
            timestamp: new Date().toISOString(),
            message: 'User not logged in',
          },
        },
      };
    }

    // Check if user is in admins table using admin client
    if (!supabaseAdmin) {
      console.error('[ADMIN] Admin client not available - check SUPABASE_SERVICE_ROLE_KEY');
      return {
        props: {
          user: {
            id: user.id,
            email: user.email,
          },
          isAdmin: false,
          error: 'Admin client not configured (missing SUPABASE_SERVICE_ROLE_KEY)',
          debugInfo: {
            timestamp: new Date().toISOString(),
            user: { id: user.id, email: user.email },
          },
        },
      };
    }

    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('id, email')
      .eq('id', user.id)
      .maybeSingle();

    if (adminError) {
      console.error('[ADMIN] Database error:', adminError.message);
      return {
        props: {
          user: {
            id: user.id,
            email: user.email,
          },
          isAdmin: false,
          error: `Database error: ${adminError.message}`,
          debugInfo: {
            timestamp: new Date().toISOString(),
            user: { id: user.id, email: user.email },
            adminError: adminError.message,
            adminErrorCode: adminError.code,
          },
        },
      };
    }

    if (!adminData) {
      console.log(`[ADMIN] User ${user.email} not in admins table`);
      return {
        props: {
          user: {
            id: user.id,
            email: user.email,
          },
          isAdmin: false,
          error: 'User not in admins table',
          sqlCommand: `INSERT INTO admins (id, email) VALUES ('${user.id}', '${user.email}');`,
          debugInfo: {
            timestamp: new Date().toISOString(),
            user: { id: user.id, email: user.email },
            message: 'User exists but not in admins table',
          },
        },
      };
    }

    // Fetch dashboard data
    const [
      { data: payoutJobs, error: payoutError },
      { data: vendors, error: vendorsError },
      { data: retailersData, error: retailersError },
      { data: sourcers, error: sourcersError },
      { data: uids, error: uidsError },
    ] = await Promise.all([
      supabaseAdmin.from('payout_jobs').select('*').order('created_at', { ascending: false }).limit(100),
      supabaseAdmin.from('vendors').select('*').order('created_at', { ascending: false }),
      supabaseAdmin
        .from('retailers')
        .select(`
          id,
          name,
          location,
          address,
          converted,
          onboarding_completed,
          express_shipping,
          created_at,
          displays:displays (
            id,
            status
          )
        `)
        .eq('converted', true)
        .eq('onboarding_completed', true)
        .order('created_at', { ascending: false }),
      supabaseAdmin.from('sourcer_accounts').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('uids').select('*').order('registered_at', { ascending: false }).limit(100),
    ]);

    if (payoutError) console.error('[ADMIN] Payout jobs error:', payoutError.message);
    if (vendorsError) console.error('[ADMIN] Vendors error:', vendorsError.message);
    if (retailersError) console.error('[ADMIN] Retailers error:', retailersError.message);
    if (sourcersError) console.error('[ADMIN] Sourcers error:', sourcersError.message);
    if (uidsError) console.error('[ADMIN] UIDs error:', uidsError.message);

    const statusRank = {
      active: 3,
      shipped: 3,
      priority_queue: 2,
      standard_queue: 1,
    };

    const normalizedRetailers = (retailersData || [])
      .map((retailer) => {
        const displayList = Array.isArray(retailer.displays) ? retailer.displays : [];
        const displayCount = displayList.length;

        const primaryStatus = displayList.reduce((best, display) => {
          const currentRank = statusRank[best?.status] ?? 0;
          const incomingRank = statusRank[display.status] ?? 0;
          return incomingRank > currentRank ? display : best;
        }, null);

        return {
          ...retailer,
          display_count: displayCount,
          primary_display_status: primaryStatus?.status ?? null,
        };
      });

    return {
      props: {
        user: {
          id: user.id,
          email: user.email,
        },
        isAdmin: true,
        error: null,
        initialPayoutJobs: payoutJobs || [],
        initialVendors: vendors || [],
        initialRetailers: normalizedRetailers,
        initialSourcers: sourcers || [],
        initialUids: uids || [],
        debugInfo: {
          timestamp: new Date().toISOString(),
          user: { id: user.id, email: user.email },
          dataLoaded: {
            payoutJobs: payoutJobs?.length || 0,
            vendors: vendors?.length || 0,
            retailers: normalizedRetailers?.length || 0,
            sourcers: sourcers?.length || 0,
            uids: uids?.length || 0,
          },
        },
      },
    };

  } catch (error) {
    console.error('[ADMIN] Unexpected error:', error.message);
    return {
      props: {
        user: null,
        isAdmin: false,
        error: `Unexpected error: ${error.message}`,
        debugInfo: {
          timestamp: new Date().toISOString(),
          error: error.message,
          errorName: error.name,
          stack: error.stack,
        },
      },
    };
  }
}

export default function Admin({ 
  user = null,
  isAdmin = false,
  error = null,
  initialPayoutJobs = [],
  initialVendors = [],
  initialRetailers = [],
  initialSourcers = [],
  initialUids = [],
  sqlCommand = null,
  debugInfo = {},
}) {

  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState("Vendors");
  const [previousTabIndex, setPreviousTabIndex] = useState(0);
  const [tabDirection, setTabDirection] = useState(0);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [payouts, setPayouts] = useState([]);
  const [loadingPayouts, setLoadingPayouts] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [payoutJobs, setPayoutJobs] = useState(initialPayoutJobs);
  const [loadingPayoutJobs, setLoadingPayoutJobs] = useState(false);
  const [payoutFilter, setPayoutFilter] = useState('pending');
  const [processingPayouts, setProcessingPayouts] = useState(new Set());
  const [toast, setToast] = useState(null);
  const [commissionModalOpen, setCommissionModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendors, setVendors] = useState(initialVendors);
  const [retailerPayouts, setRetailerPayouts] = useState([]);
  const [loadingRetailerPayouts, setLoadingRetailerPayouts] = useState(false);
  const [payoutTotals, setPayoutTotals] = useState({ total_pending: 0, total_paid: 0 });

  // Handle client-side mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    // Scroll to top on page load
    window.scrollTo(0, 0);
  }, []);

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  // Fetch payout data from Supabase when Analytics tab is active
  useEffect(() => {
    const fetchPayouts = async () => {
      if (tab === "Analytics" && isAdmin) {
        if (!supabase) {
          console.warn('[Admin] Supabase not initialized');
          setLoadingPayouts(false);
          return;
        }

        setLoadingPayouts(true);
        try {
          const { data, error } = await supabase
            .from('payout_jobs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

          if (error) throw error;

          setPayouts(data || []);
          const total = (data || []).reduce((sum, payout) => sum + (payout.total_amount || 0), 0);
          setTotalRevenue(total);
        } catch (error) {
          console.error('[Admin] Error fetching payouts:', error);
        } finally {
          setLoadingPayouts(false);
        }
      }
    };

    fetchPayouts();
  }, [tab, isAdmin]);

  // Fetch retailer payouts when Payouts tab is active
  useEffect(() => {
    const fetchRetailerPayouts = async () => {
      if (tab === "Payouts" && isAdmin) {
        setLoadingRetailerPayouts(true);
        try {
          const response = await fetch(`/api/admin/retailer-payouts?status=${payoutFilter}`);
          if (!response.ok) throw new Error('Failed to fetch retailer payouts');

          const data = await response.json();
          setRetailerPayouts(data.retailers || []);
          setPayoutTotals(data.totals || { total_pending: 0, total_paid: 0 });
        } catch (error) {
          console.error('[Admin] Error fetching retailer payouts:', error);
          showToast('Failed to fetch retailer payouts', 'error');
        } finally {
          setLoadingRetailerPayouts(false);
        }
      }
    };

    fetchRetailerPayouts();
  }, [tab, payoutFilter, isAdmin]);

  // Toast notification helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Handle tab change with direction calculation
  const handleTabChange = (newTab) => {
    const currentIndex = TABS.indexOf(tab);
    const newIndex = TABS.indexOf(newTab);

    // Calculate direction: positive = right to left, negative = left to right
    const direction = newIndex > currentIndex ? 1 : -1;
    setTabDirection(direction);
    setPreviousTabIndex(currentIndex);
    setTab(newTab);
  };

  // Process individual payout
  const handleProcessPayout = async (jobId) => {
    setProcessingPayouts(prev => new Set([...prev, jobId]));

    try {
      await triggerPayout(jobId);

      setPayoutJobs(prev =>
        prev.map(job =>
          job.id === jobId ? { ...job, status: 'paid' } : job
        ).filter(job => payoutFilter === 'paid' ? true : job.id !== jobId)
      );

      showToast('Payout processed successfully!', 'success');
    } catch (error) {
      console.error('[Admin] Error processing payout:', error);
      showToast(error.message || 'Failed to process payout', 'error');
    } finally {
      setProcessingPayouts(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  };

  // Handle commission settings modal
  const handleOpenCommissionModal = (vendor) => {
    setSelectedVendor(vendor);
    setCommissionModalOpen(true);
  };

  const handleCloseCommissionModal = () => {
    setCommissionModalOpen(false);
    setSelectedVendor(null);
  };

  const handleSaveCommission = (updatedVendor) => {
    // Update the vendor in the local state
    setVendors(prev =>
      prev.map(v => v.id === updatedVendor.id ? updatedVendor : v)
    );
    showToast('Commission settings updated successfully!', 'success');
  };

  // Handle processing all pending payouts for a retailer
  const handleProcessAllPayouts = async (payouts) => {
    try {
      const results = await Promise.all(
        payouts.map(payout => triggerPayout(payout.id))
      );

      // Refresh retailer payouts data
      const response = await fetch(`/api/admin/retailer-payouts?status=${payoutFilter}`);
      if (response.ok) {
        const data = await response.json();
        setRetailerPayouts(data.retailers || []);
        setPayoutTotals(data.totals || { total_pending: 0, total_paid: 0 });
      }

      showToast(`Successfully processed ${payouts.length} payout(s)!`, 'success');
    } catch (error) {
      console.error('[Admin] Error processing payouts:', error);
      showToast('Failed to process some payouts', 'error');
    }
  };

  // Handle processing single payout
  const handleProcessSinglePayout = async (jobId) => {
    setProcessingPayouts(prev => new Set([...prev, jobId]));

    try {
      await triggerPayout(jobId);

      // Refresh retailer payouts data
      const response = await fetch(`/api/admin/retailer-payouts?status=${payoutFilter}`);
      if (response.ok) {
        const data = await response.json();
        setRetailerPayouts(data.retailers || []);
        setPayoutTotals(data.totals || { total_pending: 0, total_paid: 0 });
      }

      showToast('Payout processed successfully!', 'success');
    } catch (error) {
      console.error('[Admin] Error processing payout:', error);
      showToast(error.message || 'Failed to process payout', 'error');
    } finally {
      setProcessingPayouts(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  };

  const retailers = useMemo(() => initialRetailers, [initialRetailers]);
  const sourcers = useMemo(() => initialSourcers, [initialSourcers]);
  const uids = useMemo(() => initialUids, [initialUids]);

  const retailerShippingBadge = (status) => {
    const normalized = (status || '').toLowerCase();
    switch (normalized) {
      case 'priority_queue':
        return { label: 'Priority Shipping', tone: 'bg-purple-100 text-purple-700' };
      case 'standard_queue':
        return { label: 'Queued to Ship', tone: 'bg-blue-100 text-blue-700' };
      case 'active':
        return { label: 'Active Display', tone: 'bg-green-100 text-green-700' };
      case 'shipped':
        return { label: 'In Transit', tone: 'bg-blue-100 text-blue-700' };
      default:
        return { label: 'Preparing', tone: 'bg-gray-100 text-gray-600' };
    }
  };

  const qlc = q.trim().toLowerCase();
  const filtVendors = vendors.filter(
    (v) =>
      (!qlc || v.name?.toLowerCase().includes(qlc) || v.email?.toLowerCase().includes(qlc)) &&
      (filter === "all" || (v.store_type || v.platform || '').toLowerCase() === filter)
  );

  // LOADING STATE - Show before mount to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-semibold">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // ACCESS DENIED STATE
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-2xl w-full"
        >
          {/* Main Error Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] border border-white/20 overflow-hidden">
            {/* Header with Icon */}
            <div className="bg-gradient-to-r from-red-500 to-pink-500 p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10"></div>
              <div className="relative">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center"
                >
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </motion.div>
                <motion.h1 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-white mb-2"
                >
                  Access Denied
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/90 text-lg"
                >
                  You don't have permission to access this area
                </motion.p>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              {/* Error Message */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-red-50 border-l-4 border-red-400 rounded-xl p-4"
                >
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-semibold text-red-800 mb-1">Authentication Error</p>
                      <p className="text-sm text-red-700 font-mono bg-red-100 px-3 py-2 rounded-lg">{error}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* User Info */}
              {user && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-blue-50 border border-blue-200 rounded-xl p-4"
                >
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="font-semibold text-blue-800 mb-2">Your Account</p>
                      <div className="space-y-1">
                        <p className="text-sm text-blue-700">
                          <span className="font-medium">Email:</span> 
                          <span className="ml-2 font-mono bg-blue-100 px-2 py-1 rounded text-xs">{user.email}</span>
                        </p>
                        <p className="text-sm text-blue-700">
                          <span className="font-medium">User ID:</span> 
                          <span className="ml-2 font-mono bg-blue-100 px-2 py-1 rounded text-xs">{user.id}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SQL Command Helper */}
              {sqlCommand && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-amber-50 border border-amber-200 rounded-xl p-4"
                >
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="font-semibold text-amber-800 mb-2">Grant Admin Access</p>
                      <p className="text-sm text-amber-700 mb-3">Run this SQL command in your Supabase SQL Editor:</p>
                      <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                        <pre className="text-green-400 text-xs font-mono">{sqlCommand}</pre>
                      </div>
                      <p className="text-xs text-amber-600 mt-2">After running this command, refresh this page.</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Login Prompt */}
              {!user && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-indigo-50 border border-indigo-200 rounded-xl p-4"
                >
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-indigo-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V5a1 1 0 011-1h4a1 1 0 011 1z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="font-semibold text-indigo-800 mb-3">Authentication Required</p>
                      <p className="text-sm text-indigo-700 mb-4">You need to log in to access the admin panel.</p>
                      <button
                        onClick={() => router.push('/login?redirect=/admin')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg hover:scale-105 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Log In
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="flex flex-wrap gap-3 pt-4"
              >
                <button
                  onClick={() => router.push('/')}
                  className="flex-1 bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] hover:from-[#ff6b3a] hover:to-[#ff5aa3] text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg hover:scale-105 flex items-center justify-center gap-2"
                >
                  Back to Home
                </button>
                {user && (
                  <button
                    onClick={() => router.reload()}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Page
                  </button>
                )}
              </motion.div>
            </div>
          </div>

          {/* Debug Information */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="mt-6 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden"
          >
            <details className="group">
              <summary className="p-6 cursor-pointer hover:bg-white/20 transition-colors duration-200 flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-600 group-open:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="font-semibold text-gray-800">Debug Information</span>
                <span className="text-sm text-gray-500">(Click to expand)</span>
              </summary>
              <div className="px-6 pb-6">
                <div className="bg-gray-900 rounded-xl p-4 overflow-auto max-h-96">
                  <pre className="text-green-400 text-xs font-mono">
{JSON.stringify({ isAdmin, user, error, sqlCommand, debugInfo }, null, 2)}
                  </pre>
                </div>
              </div>
            </details>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // AUTHORIZED ADMIN STATE
  return (
    <div className="min-h-screen pt-20" style={{ backgroundColor: '#FFFFFF' }}>
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white shadow-lg relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
            <div className="flex items-start justify-between gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex-1 min-w-0"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl sm:text-3xl">🎯</span>
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">
                    Admin Command Center
                  </h1>
                </div>
                <div className="space-y-1">
                  <p className="text-white/90 text-xs sm:text-sm md:text-base leading-relaxed">
                    Manage vendors, retailers, analytics & more
                  </p>
                  <p className="text-white/70 text-xs sm:text-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                    </svg>
                    Logged in as: <span className="font-semibold">{user?.email}</span>
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex-shrink-0 self-start"
              >
                <span className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold text-white border border-transparent/30 whitespace-nowrap shadow-lg">
                  v1.2
                </span>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-6"
        >
          <div className="flex gap-2 border-b-2 border-gray-200 overflow-x-auto">
            {TABS.map((t) => {
              const active = tab === t;
              return (
                <motion.button
                  key={t}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTabChange(t)}
                  className={[
                    "px-4 py-3 md:px-6 text-xs md:text-sm font-bold transition-all relative whitespace-nowrap",
                    active
                      ? "text-[#ff6fb3]"
                      : "text-gray-600 hover:text-gray-900",
                  ].join(" ")}
                >
                  {t}
                  {active && (
                    <motion.div
                      layoutId="adminActiveTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Toolbar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white rounded-3xl shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] border border-transparent p-6 mb-6"
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={`Search ${tab.toLowerCase()}…`}
                  className="w-full h-12 pl-12 pr-4 rounded-2xl border border-transparent bg-white outline-none focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all font-medium"
                />
              </div>
            </div>
            {tab === "Vendors" && (
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="h-12 rounded-2xl border border-transparent bg-white px-4 outline-none focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all font-medium"
              >
                <option value="all">All platforms</option>
                <option value="shopify">Shopify</option>
                <option value="etsy">Etsy</option>
              </select>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => alert("Add new (stub)")}
              className="h-12 rounded-2xl bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] px-6 text-sm font-bold text-white hover:shadow-lg transition-all"
            >
              + Add New
            </motion.button>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          key={tab}
          initial={{ opacity: 0, x: tabDirection * 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          {tab === "Vendors" && (
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filtVendors.map((v) => (
                <motion.article
                  key={v.id}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.03, y: -5 }}
                  className="bg-white rounded-3xl border border-transparent p-6 shadow-lg hover:shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] hover:border-pink-200 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900">{v.name}</h3>
                    <span className="rounded-full px-3 py-1.5 text-xs font-bold bg-green-100 text-green-700">
                      Active
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-4">{v.email || 'No email'}</div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-3 py-1.5 text-xs font-bold">
                      {v.store_type || v.platform || 'N/A'}
                    </span>
                    {(v.inventory_cap || v.cap) && (
                      <span className="rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 px-3 py-1.5 text-xs font-bold">
                        Cap: {v.inventory_cap || v.cap}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mb-3">
                    <motion.a
                      href={`/vendor/${v.id}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 text-center rounded-2xl border border-transparent bg-white px-4 py-2.5 text-sm font-bold text-gray-900 hover:bg-gray-50 transition-all"
                    >
                      View
                    </motion.a>
                    <motion.a
                      href={`/retailers?vendor=${v.id}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 text-center rounded-2xl bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] px-4 py-2.5 text-sm font-bold text-white hover:shadow-lg transition-all"
                    >
                      Retailers
                    </motion.a>
                  </div>
                  <motion.button
                    onClick={() => handleOpenCommissionModal(v)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full text-center rounded-2xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-2.5 text-sm font-bold text-purple-700 hover:border-purple-300 hover:shadow-md transition-all"
                  >
                    ⚙️ Commission Settings
                  </motion.button>
                </motion.article>
              ))}
            </motion.div>
          )}

          {tab === "Retailers" && (
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {retailers.map((r) => {
                const badge = retailerShippingBadge(r.primary_display_status);
                return (
                <motion.article
                  key={r.id}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.03, y: -5 }}
                  className="bg-white rounded-3xl border border-transparent p-6 shadow-lg hover:shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] hover:border-purple-200 transition-all"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{r.name}</h3>
                      <div className="text-sm text-gray-600">
                        {r.address || r.location || 'Address to be assigned'}
                      </div>
                      <div className={`inline-flex items-center px-3 py-1 mt-2 rounded-full text-xs font-bold ${badge.tone}`}>
                        {badge.label}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 px-4 py-3">
                    <div className="text-xs text-gray-600 mb-1">Active Displays</div>
                    <div className="text-2xl font-bold text-blue-700">{r.display_count}</div>
                  </div>
                </motion.article>
              );
            })}
            </motion.div>
          )}

          {tab === "Stores" && (
            <div className="bg-white rounded-3xl shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] border border-transparent p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-4xl">🏪</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Stores & Outreach Management
              </h3>
              <p className="text-gray-600 mb-6 max-w-lg mx-auto">
                Manage store outreach campaigns, track cold emails, register owners, and export store data.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/admin/stores')}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white font-bold text-lg hover:shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] transition-all"
              >
                <span>Open Stores Dashboard</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </motion.button>
              
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border-2 border-blue-100">
                  <div className="text-3xl mb-2">📊</div>
                  <div className="font-bold text-gray-900">Filter & Search</div>
                  <div className="text-sm text-gray-600">Search stores by name, location, or status</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border-2 border-green-100">
                  <div className="text-3xl mb-2">✍️</div>
                  <div className="font-bold text-gray-900">Register Owners</div>
                  <div className="text-sm text-gray-600">Add owner contacts and mark conversions</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border-2 border-purple-100">
                  <div className="text-3xl mb-2">📧</div>
                  <div className="font-bold text-gray-900">Track Outreach</div>
                  <div className="text-sm text-gray-600">Mark cold emails sent and track campaigns</div>
                </div>
              </div>
            </div>
          )}

          {tab === "Payouts" && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] border border-transparent p-4 mb-6"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-700">Show:</span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPayoutFilter('pending')}
                    className={[
                      "rounded-2xl px-6 py-2.5 text-sm font-bold transition-all",
                      payoutFilter === 'pending'
                        ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg"
                        : "text-gray-700 hover:bg-gray-100 border border-transparent",
                    ].join(" ")}
                  >
                    Pending
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPayoutFilter('paid')}
                    className={[
                      "rounded-2xl px-6 py-2.5 text-sm font-bold transition-all",
                      payoutFilter === 'paid'
                        ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg"
                        : "text-gray-700 hover:bg-gray-100 border border-transparent",
                    ].join(" ")}
                  >
                    Paid
                  </motion.button>
                </div>
              </motion.div>

              <div className="rounded-3xl border border-transparent bg-white shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] overflow-hidden">
                <div className="p-6 border-b-2 border-gray-100 bg-gradient-to-r from-pink-50 to-purple-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Retailer Payouts</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {payoutFilter === 'pending' ? 'Process pending payouts by retailer' : 'View payout history by retailer'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Total {payoutFilter === 'pending' ? 'Pending' : 'Paid'}</div>
                      <div className="text-2xl font-bold text-purple-700">
                        {formatMoney(payoutFilter === 'pending' ? payoutTotals.total_pending : payoutTotals.total_paid)}
                      </div>
                    </div>
                  </div>
                </div>

                {loadingRetailerPayouts ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#ff6fb3] border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading retailer payouts...</p>
                  </div>
                ) : retailerPayouts.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-700 font-bold text-lg">No {payoutFilter} payouts</p>
                    <p className="text-gray-500 mt-2">
                      {payoutFilter === 'pending'
                        ? 'All payouts have been processed!'
                        : 'Process some payouts to see history here'}
                    </p>
                  </div>
                ) : (
                  <div>
                    {retailerPayouts.map((retailerData) => (
                      <RetailerPayoutRow
                        key={retailerData.retailer.id}
                        retailerData={retailerData}
                        onProcessPayout={handleProcessSinglePayout}
                        onProcessAll={handleProcessAllPayouts}
                        processingPayouts={processingPayouts}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {tab === "Analytics" && (
            <>
              <motion.div 
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6"
              >
                <motion.div 
                  variants={fadeInUp}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-white rounded-3xl p-6 shadow-lg border border-transparent hover:border-blue-200 hover:shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-gray-600 text-sm font-semibold mb-1">Total Scans (7d)</h3>
                  <p className="text-4xl font-bold text-gray-900">1,148</p>
                </motion.div>

                <motion.div 
                  variants={fadeInUp}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-white rounded-3xl p-6 shadow-lg border border-transparent hover:border-green-200 hover:shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-gray-600 text-sm font-semibold mb-1">Conversions (7d)</h3>
                  <p className="text-4xl font-bold text-gray-900">124</p>
                </motion.div>

                <motion.div 
                  variants={fadeInUp}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-white rounded-3xl p-6 shadow-lg border border-transparent hover:border-pink-200 hover:shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#ff7a4a] to-[#ff6fb3] rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-gray-600 text-sm font-semibold mb-1">Total Revenue</h3>
                  <p className="text-4xl font-bold text-gray-900">{formatMoney(totalRevenue)}</p>
                </motion.div>

                <motion.div 
                  variants={fadeInUp}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-white rounded-3xl p-6 shadow-lg border border-transparent hover:border-purple-200 hover:shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-gray-600 text-sm font-semibold mb-1">Top Vendor</h3>
                  <p className="text-xl font-bold text-gray-900">Sunrise Soap Co</p>
                </motion.div>
              </motion.div>

              <div className="rounded-3xl border border-transparent bg-white shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] overflow-hidden">
                <div className="p-6 border-b-2 border-gray-100 bg-gradient-to-r from-pink-50 to-purple-50">
                  <h3 className="text-2xl font-bold text-gray-900">Recent Payouts</h3>
                </div>
                {loadingPayouts ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#ff6fb3] border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading payouts...</p>
                  </div>
                ) : payouts.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-700 font-bold text-lg">No payouts found</p>
                  </div>
                ) : (
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left bg-gradient-to-r from-gray-50 to-gray-100">
                          <Th>ID</Th>
                          <Th>Amount</Th>
                          <Th>Status</Th>
                          <Th>Vendor</Th>
                          <Th>Date</Th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {payouts.map((payout) => (
                          <tr key={payout.id} className="hover:bg-gray-50 transition-colors">
                            <Td>{payout.id}</Td>
                            <Td className="font-bold text-green-700">{formatMoney(payout.total_amount)}</Td>
                            <Td>
                              <span className={[
                                "rounded-full px-3 py-1.5 text-xs font-bold",
                                payout.status === "completed"
                                  ? "bg-green-100 text-green-700"
                                  : payout.status === "pending"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-700",
                              ].join(" ")}>
                                {payout.status || 'pending'}
                              </span>
                            </Td>
                            <Td>{payout.vendor_name || 'N/A'}</Td>
                            <Td>{new Date(payout.created_at).toLocaleDateString()}</Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {tab === "Sourcers" && (
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {sourcers.map((s) => (
                <motion.article
                  key={s.id}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.03, y: -5 }}
                  className="bg-white rounded-3xl border border-transparent p-6 shadow-lg hover:shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] hover:border-green-200 transition-all"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{s.name}</h3>
                      <div className="text-sm text-gray-600">{s.email}</div>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3">
                    <div className="text-xs text-gray-600 mb-1">Total Revenue</div>
                    <div className="text-2xl font-bold text-green-700">${s.revenue.toLocaleString()}</div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          )}

          {tab === "UIDs" && (
            <div className="overflow-auto rounded-3xl border border-transparent bg-white shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left bg-gradient-to-r from-pink-50 to-purple-50">
                    <Th>UID</Th>
                    <Th>Business</Th>
                    <Th>Claimed</Th>
                    <Th>Scans</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {uids
                    .filter((u) => !qlc || u.uid.toLowerCase().includes(qlc) || u.business.toLowerCase().includes(qlc))
                    .map((u) => (
                      <tr key={u.uid} className="hover:bg-gray-50 transition-colors">
                        <Td><span className="font-mono font-bold text-gray-900">{u.uid}</span></Td>
                        <Td><span className="font-semibold text-gray-900">{u.business}</span></Td>
                        <Td>
                          <span className={[
                            "rounded-full px-3 py-1.5 text-xs font-bold",
                            u.claimed 
                              ? "bg-green-100 text-green-700" 
                              : "bg-gray-100 text-gray-600"
                          ].join(" ")}>
                            {u.claimed ? "✓ Yes" : "No"}
                          </span>
                        </Td>
                        <Td><span className="font-bold text-blue-700">{u.scans}</span></Td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        <motion.footer 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 text-center py-6"
        >
          <p className="text-gray-600 font-medium">
            Tapify Admin Command Center • {new Date().getFullYear()}
          </p>
        </motion.footer>
      </div>

      {/* Toast Notification */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-8 right-8 z-50"
        >
          <div className={[
            "rounded-2xl px-6 py-4 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] border-2 flex items-center gap-3 min-w-[300px]",
            toast.type === 'success'
              ? "bg-gradient-to-r from-green-400 to-emerald-500 border-green-300 text-white"
              : "bg-gradient-to-r from-red-400 to-rose-500 border-red-300 text-white"
          ].join(" ")}>
            {toast.type === 'success' ? (
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <p className="font-bold">{toast.message}</p>
          </div>
        </motion.div>
      )}

      {/* Commission Settings Modal */}
      <CommissionSettingsModal
        vendor={selectedVendor}
        isOpen={commissionModalOpen}
        onClose={handleCloseCommissionModal}
        onSave={handleSaveCommission}
      />
    </div>
  );
}

/* ---------- UI helpers ---------- */
function Th({ children }) {
  return <th className="px-6 py-4 text-sm font-bold text-gray-700">{children}</th>;
}
function Td({ children, className = "" }) {
  return <td className={`px-6 py-4 text-gray-800 ${className}`}>{children}</td>;
}
