import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthContext } from '../../context/AuthContext';
import Script from 'next/script';

export default function RetailerDashboard() {
  const router = useRouter();
  const { user, signOut } = useAuthContext();
  const [activeTab, setActiveTab] = useState('stats');

  // Handle URL tab parameter
  useEffect(() => {
    if (router.query.tab && ['stats', 'payouts', 'settings'].includes(router.query.tab)) {
      setActiveTab(router.query.tab);
    }
  }, [router.query.tab]);
  const [previousTabIndex, setPreviousTabIndex] = useState(0);
  const [tabDirection, setTabDirection] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [settingsChanged, setSettingsChanged] = useState(false);
  const [plaidLoading, setPlaidLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [removingBank, setRemovingBank] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [plaidScriptLoaded, setPlaidScriptLoaded] = useState(false);
  
  // Data states
  const [retailer, setRetailer] = useState(null);
  const [stats, setStats] = useState({
    weeklyScans: 0,
    revenue: 0,
    displaysClaimed: 0,
    conversionRate: 0,
    unpaidEarnings: 0
  });
  const [scans, setScans] = useState([]);
  const [uids, setUids] = useState([]);
  const [payoutJobs, setPayoutJobs] = useState([]);
  const [retailerAccount, setRetailerAccount] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  
  // Toast helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Wait for Plaid to be available
  const waitForPlaid = () => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 20;

      const check = () => {
        if (typeof window.Plaid !== 'undefined') {
          setPlaidScriptLoaded(true);
          resolve();
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(check, 200);
        } else {
          reject(new Error('Plaid script not loaded'));
        }
      };

      check();
    });
  };

  // Auth protection - redirect if not logged in
  useEffect(() => {
    if (user === undefined) {
      // Still loading auth state
      return;
    }
    
    if (!user) {
      // Not logged in, redirect to login
      router.push('/login');
    }
  }, [user, router]);

  // Check if Plaid is loaded on mount
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 10;

    const checkPlaid = () => {
      if (typeof window.Plaid !== 'undefined') {
        console.log('[PLAID] Plaid is available');
        setPlaidScriptLoaded(true);
      } else if (attempts < maxAttempts) {
        attempts++;
        console.log(`[PLAID] Plaid not yet available, attempt ${attempts}/${maxAttempts}`);
        setTimeout(checkPlaid, 500);
      } else {
        console.error('[PLAID] Failed to load Plaid script after multiple attempts');
        setPlaidScriptLoaded(false);
      }
    };

    checkPlaid();
  }, []);

  // Fetch all retailer data
  useEffect(() => {
    const fetchRetailerData = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);

        // Get retailer profile using proper user ID foreign key
        const { data: retailerData, error: retailerError } = await supabase
          .from('retailers')
          .select('*')
          .eq('created_by_user_id', user.id)
          .maybeSingle();

        if (retailerError) {
          console.error('Error fetching retailer:', retailerError);
        }

        // If no retailer found, initialize with empty data (no popup - just continue)
        if (!retailerData) {
          console.warn('No retailer profile found for user:', user.id);
          // Don't show popup - let them finish onboarding in registration flow
          setLoading(false);
          
          // Initialize with empty weekly data so charts don't break
          setWeeklyData([
            { day: 'Mon', scans: 0, orders: 0, revenue: 0 },
            { day: 'Tue', scans: 0, orders: 0, revenue: 0 },
            { day: 'Wed', scans: 0, orders: 0, revenue: 0 },
            { day: 'Thu', scans: 0, orders: 0, revenue: 0 },
            { day: 'Fri', scans: 0, orders: 0, revenue: 0 },
            { day: 'Sat', scans: 0, orders: 0, revenue: 0 },
            { day: 'Sun', scans: 0, orders: 0, revenue: 0 },
          ]);
          return;
        }
        
        setRetailer(retailerData);
        
        // Get UIDs claimed by this retailer with business information
        const { data: uidsData } = await supabase
          .from('uids')
          .select(`
            *,
            business:business_id (
              id,
              name,
              address,
              city,
              state
            )
          `)
          .eq('retailer_id', retailerData.id)
          .limit(100);

        setUids(uidsData || []);

        // Get scans data scoped to this retailer
        const { data: scansData } = await supabase
          .from('scans')
          .select('*')
          .eq('retailer_id', retailerData.id)
          .order('timestamp', { ascending: false })
          .limit(100);

        setScans(scansData || []);
        
        // Get payout jobs
        const { data: payoutsData } = await supabase
          .from('payout_jobs')
          .select('*')
          .eq('retailer_id', retailerData.id)
          .order('created_at', { ascending: false });
        
        setPayoutJobs(payoutsData || []);
        
        // Get retailer account
        const { data: accountData } = await supabase
          .from('retailer_accounts')
          .select('*')
          .eq('retailer_id', retailerData.id)
          .maybeSingle();
        
        setRetailerAccount(accountData);
        
        // Calculate stats
        calculateStatsFromScans(scansData || [], uidsData || [], payoutsData || []);
        calculateWeeklyData(scansData || []);
        
      } catch (error) {
        console.error('Error fetching retailer data:', error);
        showToast('Failed to load dashboard data', 'error');
        
        // Initialize with empty weekly data
        setWeeklyData([
          { day: 'Mon', scans: 0, orders: 0, revenue: 0 },
          { day: 'Tue', scans: 0, orders: 0, revenue: 0 },
          { day: 'Wed', scans: 0, orders: 0, revenue: 0 },
          { day: 'Thu', scans: 0, orders: 0, revenue: 0 },
          { day: 'Fri', scans: 0, orders: 0, revenue: 0 },
          { day: 'Sat', scans: 0, orders: 0, revenue: 0 },
          { day: 'Sun', scans: 0, orders: 0, revenue: 0 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRetailerData();

    // Auto-refresh disabled to prevent animation resets
    // Users can manually refresh by navigating away and back
    // Webhook updates will be visible on next page load

  }, [user]);

  // Calculate statistics from scans
  const calculateStatsFromScans = (scansData, uidsData, payoutsData) => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklyScans = scansData.filter(s => new Date(s.timestamp) > weekAgo);
    const totalClicks = weeklyScans.filter(s => s.clicked).length;
    const totalConversions = weeklyScans.filter(s => s.converted).length;
    const totalRevenue = scansData.reduce((sum, s) => sum + (s.revenue || 0), 0);
    const conversionRate = totalClicks > 0 ? 
      ((totalConversions / totalClicks) * 100).toFixed(1) : 0;
    
    const unpaidEarnings = payoutsData
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + (p.retailer_cut || 0), 0);
    
    setStats({
      weeklyScans: weeklyScans.length,
      revenue: totalRevenue,
      displaysClaimed: uidsData.length,
      conversionRate: conversionRate,
      unpaidEarnings: unpaidEarnings
    });
  };

  // Calculate weekly chart data
  const calculateWeeklyData = (scansData) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekData = [];
    
    for (let i = 0; i < 7; i++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - (6 - i));
      targetDate.setHours(0, 0, 0, 0);
      
      const dayScans = scansData.filter(scan => {
        const scanDate = new Date(scan.timestamp);
        return scanDate.toDateString() === targetDate.toDateString();
      });
      
      weekData.push({
        day: days[targetDate.getDay()],
        scans: dayScans.length,
        orders: dayScans.filter(s => s.converted).length,
        revenue: dayScans.reduce((sum, s) => sum + (s.revenue || 0), 0)
      });
    }
    
    setWeeklyData(weekData);
  };

  // Export payouts CSV
  const handleExportPayouts = () => {
    try {
      const csv = ['Date,Amount,Status\n'];
      payoutJobs.forEach(p => {
        csv.push(`${new Date(p.created_at).toLocaleDateString()},${p.retailer_cut || 0},${p.status}\n`);
      });
      
      const blob = new Blob(csv, { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'payouts.csv';
      a.click();
      
      showToast('Payouts exported successfully!', 'success');
    } catch (error) {
      showToast('Failed to export payouts', 'error');
    }
  };

  // Handle Remove Bank
  const handleRemoveBank = async () => {
    try {
      setRemovingBank(true);
      setShowRemoveConfirm(false);

      console.log('[REMOVE BANK] Starting bank removal');

      const response = await fetch('/api/remove-bank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_type: 'retailer',
          entity_id: retailer.id,
        }),
      });

      if (response.ok) {
        console.log('[REMOVE BANK] Bank removed successfully');
        setRetailerAccount(null);
        showToast('Bank account removed successfully', 'success');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('[REMOVE BANK] Error:', errorData);
        showToast(errorData.error || 'Failed to remove bank account', 'error');
      }
    } catch (error) {
      console.error('[REMOVE BANK] Error:', error);
      showToast('Failed to remove bank account', 'error');
    } finally {
      setRemovingBank(false);
    }
  };

  // Handle Express Shipping Toggle
  const handleExpressShippingToggle = () => {
    if (!retailer?.express_shipping) {
      // Redirect to Shopify product for express shipping purchase
      window.open('https://pawpayaco.com/products/display-setup-for-affiliate', '_blank');
    }
  };

  // Get display status based on UID data
  const getDisplayStatus = (uid) => {
    if (!uid) return { status: 'No display', badge: 'Inactive', color: 'gray', dotColor: 'bg-gray-400' };

    // Check if UID is claimed
    if (uid.is_claimed && uid.claimed_at) {
      const storeName = uid.business?.name || 'Unknown Store';
      return {
        status: `Active at ${storeName}`,
        badge: 'Live & Earning',
        color: 'green',
        dotColor: 'bg-green-500',
        storeName: storeName
      };
    }

    // Check if UID is registered but not claimed (shipping/in transit)
    if (uid.registered_at && !uid.is_claimed) {
      return {
        status: 'In transit / shipping',
        badge: 'In Transit',
        color: 'blue',
        dotColor: 'bg-blue-500'
      };
    }

    // Check if UID exists but not yet shipped (preparing)
    if (uid.uid && !uid.registered_at) {
      return {
        status: 'Preparing your display',
        badge: 'Preparing',
        color: 'yellow',
        dotColor: 'bg-yellow-500'
      };
    }

    // Fallback for unknown status
    return {
      status: 'Pending',
      badge: 'Pending',
      color: 'gray',
      dotColor: 'bg-gray-400'
    };
  };

  // Handle Plaid Connect
  const handlePlaidConnect = async () => {
    try {
      setPlaidLoading(true);
      console.log('[PLAID CONNECT] Starting Plaid connection process');
      
      // Check if retailer exists
      if (!retailer?.id) {
        console.log('[PLAID CONNECT] No retailer found:', retailer);
        showToast('Please complete your retailer registration first', 'error');
        return;
      }

      if (!user?.id) {
        console.log('[PLAID CONNECT] No user found:', user);
        showToast('Please log in to connect your bank account', 'error');
        return;
      }

      console.log('[PLAID CONNECT] Making API call with:', { user_id: user.id, retailer_id: retailer.id });

      // Get link token from backend
      const response = await fetch('/api/plaid-link-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          retailer_id: retailer.id
        })
      });

      console.log('[PLAID CONNECT] API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[PLAID CONNECT] API error:', errorData);
        throw new Error(errorData.error || 'Failed to get link token');
      }

      const { link_token } = await response.json();
      console.log('[PLAID CONNECT] Received link token:', !!link_token);

      // Check if Plaid is loaded, wait for it if not
      if (typeof window.Plaid === 'undefined') {
        console.log('[PLAID CONNECT] Plaid not loaded yet, waiting...');
        try {
          await waitForPlaid();
          console.log('[PLAID CONNECT] Plaid is now available');
        } catch (error) {
          console.error('[PLAID CONNECT] Plaid failed to load:', error);
          throw new Error('Plaid script not loaded. Please refresh the page and try again.');
        }
      }

      console.log('[PLAID CONNECT] Creating Plaid handler');
      // Initialize Plaid Link
      const handler = window.Plaid.create({
        token: link_token,
        onSuccess: async (public_token, metadata) => {
          console.log('[PLAID CONNECT] Success callback triggered', { metadata });
          setConnecting(true);
          setPlaidLoading(false);

          try {
            console.log('[PLAID CONNECT] Exchanging public token');
            // Exchange public token for access token
            const exchangeResponse = await fetch('/api/plaid-exchange', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                public_token,
                account_id: metadata?.account_id || metadata?.accounts?.[0]?.id,
                account_type: 'retailer',
                entity_id: retailer.id,
                name: retailer.name,
                email: user.email,
                metadata
              })
            });

            console.log('[PLAID CONNECT] Exchange response status:', exchangeResponse.status);

            if (exchangeResponse.ok) {
              const result = await exchangeResponse.json();
              console.log('[PLAID CONNECT] Bank account connected successfully', result);

              // Refresh retailer account data
              const { data: accountData } = await supabase
                .from('retailer_accounts')
                .select('*')
                .eq('retailer_id', retailer.id)
                .maybeSingle();

              setRetailerAccount(accountData);
              setConnecting(false);
              showToast('Bank account connected successfully!', 'success');
            } else {
              const errorData = await exchangeResponse.json().catch(() => ({}));
              console.error('[PLAID CONNECT] Exchange error:', {
                status: exchangeResponse.status,
                statusText: exchangeResponse.statusText,
                error: errorData
              });
              setConnecting(false);
              showToast(errorData.error || 'Failed to connect bank account', 'error');
              throw new Error(errorData.error || 'Failed to exchange token');
            }
          } catch (error) {
            console.error('[PLAID CONNECT] Exchange error:', error);
            setConnecting(false);
            showToast('Failed to connect bank account', 'error');
          }
        },
        onExit: (err, metadata) => {
          console.log('[PLAID CONNECT] Exit callback triggered:', err, metadata);
          setPlaidLoading(false);
          setConnecting(false);
          if (err) {
            console.error('[PLAID CONNECT] Exit error:', err);
            showToast('Bank connection cancelled', 'info');
          }
        },
        onEvent: (eventName, metadata) => {
          console.log('[PLAID CONNECT] Event:', eventName, metadata);
        }
      });

      console.log('[PLAID CONNECT] Opening Plaid handler');
      handler.open();
    } catch (error) {
      console.error('Plaid connect error:', error);
      showToast('Failed to initialize bank connection', 'error');
    } finally {
      setPlaidLoading(false);
    }
  };

  // Handle tab change with direction calculation
  const handleTabChange = (newTab) => {
    const tabs = ['stats', 'payouts', 'settings'];
    const currentIndex = tabs.indexOf(activeTab);
    const newIndex = tabs.indexOf(newTab);

    // Calculate direction: positive = right to left, negative = left to right
    const direction = newIndex > currentIndex ? 1 : -1;
    setTabDirection(direction);
    setPreviousTabIndex(currentIndex);
    setActiveTab(newTab);
  };

  // Calculate max values for charts
  const maxScans = weeklyData.length > 0 ? Math.max(...weeklyData.map(d => d.scans), 1) : 1;
  const maxRevenue = weeklyData.length > 0 ? Math.max(...weeklyData.map(d => d.revenue), 1) : 1;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20" style={{ backgroundColor: '#FFFFFF' }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#ff6fb3] border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold text-lg">Loading your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <>
      <Script
        src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"
        strategy="lazyOnload"
        onLoad={() => {
          console.log('[PLAID] Script loaded via next/script');
          setPlaidScriptLoaded(true);
        }}
        onError={() => {
          console.error('[PLAID] Script failed to load');
        }}
      />
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
            <div className="flex items-start justify-between gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex-1 min-w-0"
              >
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold leading-tight mb-2">
                  Your Dashboard
                </h1>
                <p className="text-white/90 text-xs leading-relaxed">
                  Welcome back! Here's how your displays are performing.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">
        {/* KPI Cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-8"
        >
          {/* Weekly Scans */}
          <motion.div
            variants={fadeInUp}
            className="bg-white rounded-3xl p-4 md:p-6 border border-transparent text-center shadow-lg"
          >
            <p className="text-gray-600 text-base md:text-lg font-semibold mb-2">Weekly scans</p>
            <p className="text-xl md:text-2xl font-bold text-gray-900 mb-1">{stats.weeklyScans}</p>
            <p className="text-xs text-gray-500">Last 7 days</p>
          </motion.div>

          {/* Revenue */}
          <motion.div
            variants={fadeInUp}
            className="bg-white rounded-3xl p-4 md:p-6 border border-transparent text-center shadow-lg"
          >
            <p className="text-gray-600 text-base md:text-lg font-semibold mb-2">Revenue earned</p>
            <p className="text-xl md:text-2xl font-bold text-gray-900 mb-1">${stats.revenue.toLocaleString()}</p>
            <p className="text-xs text-gray-500">This month</p>
          </motion.div>

          {/* Displays Claimed */}
          <motion.div
            variants={fadeInUp}
            className="bg-white rounded-3xl p-4 md:p-6 border border-transparent text-center shadow-lg"
          >
            <p className="text-gray-600 text-base md:text-lg font-semibold mb-2">Displays active</p>
            <p className="text-xl md:text-2xl font-bold text-gray-900 mb-1">{stats.displaysClaimed}</p>
            <p className="text-xs text-gray-500">In your store</p>
          </motion.div>

          {/* Conversion Rate */}
          <motion.div
            variants={fadeInUp}
            className="bg-white rounded-3xl p-4 md:p-6 border border-transparent text-center shadow-lg"
          >
            <p className="text-gray-600 text-base md:text-lg font-semibold mb-2">Conversion rate</p>
            <p className="text-xl md:text-2xl font-bold text-gray-900 mb-1">{stats.conversionRate}%</p>
            <p className="text-xs text-gray-500">Scans to orders</p>
          </motion.div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-6"
        >
          <div className="flex gap-2 border-b-2 border-gray-200">
            {[
              { id: 'stats', label: 'Orders & Analytics' },
              { id: 'payouts', label: 'Payouts' },
              { id: 'settings', label: 'Settings' }
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTabChange(tab.id)}
                  className={[
                    "px-4 py-3 md:px-6 text-xs md:text-sm font-bold transition-all relative",
                    active
                      ? "text-[#ff6fb3]"
                      : "text-gray-600 hover:text-gray-900",
                  ].join(" ")}
                >
                  {tab.label}
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

          {/* Tab Content */}
          <div className="bg-white rounded-3xl shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] border border-transparent p-4 md:p-8">
            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, x: tabDirection * 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Recent Scan Activity */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 md:space-y-6"
                >
                  <div className="flex items-center justify-between mb-3 md:mb-6">
                    <h3 className="text-xs md:text-sm font-black text-gray-900">Recent Scan Activity</h3>
                    <div className="text-xs md:text-sm text-gray-500 font-semibold">
                      Showing {scans.length} scans
                    </div>
                  </div>

                  {scans.length > 0 ? (
                    <>
                      {/* Desktop Table View */}
                      <div className="hidden md:block bg-white rounded-2xl border border-transparent overflow-hidden shadow-lg">
                        <table className="w-full">
                          <thead className="bg-gradient-to-r from-pink-50 to-purple-50">
                            <tr>
                              <th className="text-left py-4 px-6 font-bold text-gray-700">UID</th>
                              <th className="text-left py-4 px-6 font-bold text-gray-700">Location</th>
                              <th className="text-center py-4 px-6 font-bold text-gray-700">Clicked</th>
                              <th className="text-center py-4 px-6 font-bold text-gray-700">Converted</th>
                              <th className="text-right py-4 px-6 font-bold text-gray-700">Revenue</th>
                              <th className="text-right py-4 px-6 font-bold text-gray-700">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {scans.slice(0, 50).map((scan, idx) => (
                              <motion.tr
                                key={scan.id || idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.5) }}
                                className="border-t border-gray-100 hover:bg-gray-50"
                              >
                                <td className="py-4 px-6">
                                  <span className="font-mono text-sm text-gray-900">{scan.uid || '-'}</span>
                                </td>
                                <td className="py-4 px-6 text-gray-700">{scan.location || '-'}</td>
                                <td className="py-4 px-6 text-center">
                                  {scan.clicked ? (
                                    <span className="text-green-600 text-lg">✓</span>
                                  ) : (
                                    <span className="text-gray-300 text-lg">○</span>
                                  )}
                                </td>
                                <td className="py-4 px-6 text-center">
                                  {scan.converted ? (
                                    <span className="text-green-600 font-bold text-lg">✓</span>
                                  ) : (
                                    <span className="text-gray-300 text-lg">○</span>
                                  )}
                                </td>
                                <td className="py-4 px-6 text-right">
                                  <span className="font-bold text-green-700">
                                    ${(scan.revenue || 0).toFixed(2)}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-right text-sm text-gray-600">
                                  {new Date(scan.timestamp).toLocaleDateString()}
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card View */}
                      <div className="md:hidden space-y-3">
                        {scans.slice(0, 50).map((scan, idx) => (
                          <motion.div
                            key={scan.id || idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.5) }}
                            className="bg-white rounded-2xl border border-transparent p-4 shadow-lg"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <div className="text-xs text-gray-500 mb-1">UID</div>
                                <span className="font-mono text-sm text-gray-900">{scan.uid || '-'}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-gray-500 mb-1">Date</div>
                                <span className="text-sm text-gray-600">{new Date(scan.timestamp).toLocaleDateString()}</span>
                              </div>
                            </div>

                            <div className="mb-3">
                              <div className="text-xs text-gray-500 mb-1">Location</div>
                              <span className="text-sm text-gray-700">{scan.location || '-'}</span>
                            </div>

                            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
                              <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">Clicked</div>
                                {scan.clicked ? (
                                  <span className="text-green-600 text-lg">✓</span>
                                ) : (
                                  <span className="text-gray-300 text-lg">○</span>
                                )}
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">Converted</div>
                                {scan.converted ? (
                                  <span className="text-green-600 font-bold text-lg">✓</span>
                                ) : (
                                  <span className="text-gray-300 text-lg">○</span>
                                )}
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">Revenue</div>
                                <span className="font-bold text-green-700">
                                  ${(scan.revenue || 0).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="bg-white rounded-2xl border border-transparent shadow-lg py-12 md:py-20 text-center">
                      <div className="flex flex-col items-center gap-4 max-w-sm mx-auto px-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-gray-900 font-bold text-lg mb-1">No scans yet</p>
                          <p className="text-gray-500 text-sm">Scan activity will appear here once customers interact with your displays</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {stats.unpaidEarnings > 0 && (
                    <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-300 rounded-2xl p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900 mb-1">Unpaid Earnings</h4>
                          <p className="text-sm text-gray-600">Pending payout to your account</p>
                        </div>
                        <div className="text-3xl font-bold text-orange-700">${stats.unpaidEarnings.toFixed(2)}</div>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Weekly Performance Chart */}
                <div>
                  <h3 className="text-xs font-bold text-gray-900 mb-4 md:mb-6">Weekly Performance</h3>
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-4 md:p-8 border border-transparent">
                    {/* Bar Chart - Scans */}
                    <div className="mb-10">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-gray-700 text-xs md:text-sm">Scans per Day</h4>
                        <div className="text-xs md:text-sm text-gray-500">Max: {maxScans}</div>
                      </div>
                      <div className="flex items-end justify-between gap-2 h-48">
                        {weeklyData.map((day, idx) => (
                          <motion.div 
                            key={idx} 
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            className="flex-1 flex flex-col items-center gap-2"
                          >
                            <div className="w-full flex flex-col justify-end h-full">
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-xl hover:from-blue-600 hover:to-blue-500 transition-all cursor-pointer relative group shadow-lg"
                                style={{ height: `${(day.scans / maxScans) * 100}%` }}
                              >
                                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-semibold shadow-lg">
                                  {day.scans} scans
                                </div>
                              </motion.div>
                            </div>
                            <span className="text-sm font-bold text-gray-600">{day.day}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Revenue Chart */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-gray-700 text-xs md:text-sm">Revenue per Day</h4>
                        <div className="text-xs md:text-sm text-gray-500">Max: ${maxRevenue}</div>
                      </div>
                      <div className="flex items-end justify-between gap-2 h-48">
                        {weeklyData.map((day, idx) => (
                          <motion.div 
                            key={idx}
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            transition={{ duration: 0.5, delay: idx * 0.1 + 0.3 }}
                            className="flex-1 flex flex-col items-center gap-2"
                          >
                            <div className="w-full flex flex-col justify-end h-full">
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                className="w-full bg-gradient-to-t from-[#ff7a4a] to-[#ff6fb3] rounded-t-xl hover:opacity-90 transition-all cursor-pointer relative group shadow-lg"
                                style={{ height: `${(day.revenue / maxRevenue) * 100}%` }}
                              >
                                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-semibold shadow-lg">
                                  ${day.revenue}
                                </div>
                              </motion.div>
                            </div>
                            <span className="text-sm font-bold text-gray-600">{day.day}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Products */}
                <div>
                  <h3 className="text-xs font-bold text-gray-900 mb-4 md:mb-6">Top Performing Products</h3>

                  {topProducts.length > 0 ? (
                    <>
                      {/* Desktop Table View */}
                      <div className="hidden md:block bg-white rounded-2xl border border-transparent overflow-hidden shadow-lg">
                        <table className="w-full">
                          <thead className="bg-gradient-to-r from-pink-50 to-purple-50">
                            <tr>
                              <th className="text-left py-4 px-6 font-bold text-gray-700">Product</th>
                              <th className="text-center py-4 px-6 font-bold text-gray-700">Scans</th>
                              <th className="text-center py-4 px-6 font-bold text-gray-700">Conversions</th>
                              <th className="text-right py-4 px-6 font-bold text-gray-700">Revenue</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {topProducts.map((product, idx) => (
                              <motion.tr
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: idx * 0.1 }}
                                whileHover={{ backgroundColor: '#fafafa' }}
                                className="transition-colors"
                              >
                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3]"></div>
                                    <span className="font-semibold text-gray-900">{product.name}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-6 text-center">
                                  <span className="inline-block bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold">
                                    {product.scans}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-center">
                                  <span className="inline-block bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-bold">
                                    {product.conversions}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-right">
                                  <span className="font-bold text-gray-900">${product.revenue.toLocaleString()}</span>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card View */}
                      <div className="md:hidden space-y-3">
                        {topProducts.map((product, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.1 }}
                            className="bg-white rounded-2xl border border-transparent p-4 shadow-lg"
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3]"></div>
                              <span className="font-bold text-gray-900">{product.name}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">Scans</div>
                                <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                                  {product.scans}
                                </span>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">Conversions</div>
                                <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                                  {product.conversions}
                                </span>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">Revenue</div>
                                <span className="font-bold text-gray-900 text-sm">${product.revenue.toLocaleString()}</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="bg-white rounded-2xl border border-transparent shadow-lg py-12 md:py-20 text-center">
                      <div className="flex flex-col items-center gap-4 max-w-sm mx-auto px-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-gray-900 font-bold text-lg mb-1">No product data yet</p>
                          <p className="text-gray-500 text-sm">Product performance will show here once you have scans</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Payouts Tab */}
            {activeTab === 'payouts' && (
              <motion.div
                key="payouts"
                initial={{ opacity: 0, x: tabDirection * 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                 <div className="flex items-center justify-between mb-4 md:mb-6">
                   <h3 className="text-sm md:text-base font-black text-gray-900">Payouts</h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleExportPayouts}
                    className="px-3 py-2 md:px-5 md:py-2.5 bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white rounded-xl text-xs md:text-sm font-bold hover:shadow-lg transition-all"
                  >
                    Export CSV
                  </motion.button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-8">
                  <div className="bg-white border border-transparent rounded-3xl p-4 md:p-6 shadow-lg">
                    <h4 className="font-bold text-gray-700 mb-2 text-sm md:text-base">Pending Earnings</h4>
                    <p className="text-3xl font-bold text-gray-900">
                      ${payoutJobs
                        .filter(p => p.status === 'pending')
                        .reduce((sum, p) => sum + (p.retailer_cut || 0), 0)
                        .toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-white border border-transparent rounded-3xl p-4 md:p-6 shadow-lg">
                    <h4 className="font-bold text-gray-700 mb-2 text-sm md:text-base">Total Paid Out</h4>
                    <p className="text-3xl font-bold text-gray-900">
                      ${payoutJobs
                        .filter(p => p.status === 'paid')
                        .reduce((sum, p) => sum + (p.retailer_cut || 0), 0)
                        .toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-white border border-transparent rounded-3xl p-4 md:p-6 shadow-lg">
                    <h4 className="font-bold text-gray-700 mb-2 text-sm md:text-base">Lifetime Earnings</h4>
                    <p className="text-3xl font-bold text-gray-900">
                      ${payoutJobs
                        .reduce((sum, p) => sum + (p.retailer_cut || 0), 0)
                        .toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Payouts Table */}
                {payoutJobs.length > 0 ? (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block bg-white rounded-2xl border border-transparent overflow-hidden shadow-lg">
                      <table className="w-full">
                        <thead className="bg-gradient-to-r from-pink-50 to-purple-50">
                          <tr>
                            <th className="text-left py-4 px-6 font-bold text-gray-700">Date</th>
                            <th className="text-left py-4 px-6 font-bold text-gray-700">Vendor</th>
                            <th className="text-right py-4 px-6 font-bold text-gray-700">Your Cut</th>
                            <th className="text-right py-4 px-6 font-bold text-gray-700">Total Amount</th>
                            <th className="text-center py-4 px-6 font-bold text-gray-700">Status</th>
                            <th className="text-right py-4 px-6 font-bold text-gray-700">Paid Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payoutJobs.map((payout, idx) => (
                            <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50">
                              <td className="py-4 px-6 text-gray-900">
                                {new Date(payout.created_at).toLocaleDateString()}
                              </td>
                              <td className="py-4 px-6 text-gray-700">Vendor #{payout.vendor_id?.substring(0, 8)}</td>
                              <td className="py-4 px-6 text-right">
                                <span className="font-bold text-green-700">${(payout.retailer_cut || 0).toFixed(2)}</span>
                              </td>
                              <td className="py-4 px-6 text-right">
                                <span className="font-bold text-gray-900">${(payout.total_amount || 0).toFixed(2)}</span>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold ${
                                  payout.status === 'paid'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {payout.status}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right text-gray-600">
                                {payout.date_paid ? new Date(payout.date_paid).toLocaleDateString() : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                      {payoutJobs.map((payout, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.1 }}
                          className="bg-white rounded-2xl border border-transparent p-4 shadow-lg"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Date</div>
                              <span className="text-sm font-semibold text-gray-900">
                                {new Date(payout.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              payout.status === 'paid'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {payout.status}
                            </span>
                          </div>

                          <div className="mb-3">
                            <div className="text-xs text-gray-500 mb-1">Vendor</div>
                            <span className="text-sm text-gray-700">Vendor #{payout.vendor_id?.substring(0, 8)}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Your Cut</div>
                              <span className="font-bold text-green-700 text-sm">${(payout.retailer_cut || 0).toFixed(2)}</span>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Total Amount</div>
                              <span className="font-bold text-gray-900 text-sm">${(payout.total_amount || 0).toFixed(2)}</span>
                            </div>
                          </div>

                          {payout.date_paid && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="text-xs text-gray-500 mb-1">Paid Date</div>
                              <span className="text-sm text-gray-600">{new Date(payout.date_paid).toLocaleDateString()}</span>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-2xl border border-transparent shadow-lg py-12 md:py-20 text-center">
                    <div className="flex flex-col items-center gap-4 max-w-sm mx-auto px-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-900 font-bold text-lg mb-1">No payouts yet</p>
                        <p className="text-gray-500 text-sm">Your payout history will appear here</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: tabDirection * 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 md:space-y-6"
              >
                <h3 className="text-sm md:text-base font-black text-gray-900">Store Settings</h3>

                {/* Bank Connection Section */}
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 md:p-8 border border-transparent shadow-lg">
                  <h4 className="font-bold text-gray-900 text-base md:text-lg mb-4 md:mb-6">Bank Connection</h4>
                  
                  {retailerAccount?.plaid_access_token ? (
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 md:p-6 bg-green-50 border-2 border-green-200 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">Bank Account Connected</p>
                          <p className="text-sm text-gray-600">Ready to receive payouts</p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: removingBank ? 1 : 1.05 }}
                        whileTap={{ scale: removingBank ? 1 : 0.95 }}
                        onClick={() => setShowRemoveConfirm(true)}
                        disabled={removingBank}
                        className={`w-full md:w-auto px-6 py-2.5 border-2 border-red-300 text-red-700 rounded-2xl text-sm font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2 ${
                          removingBank ? 'opacity-75 cursor-not-allowed' : ''
                        }`}
                      >
                        {removingBank && (
                          <svg className="animate-spin h-4 w-4 text-red-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        {removingBank ? 'Removing...' : 'Remove Bank'}
                      </motion.button>
                    </div>
                  ) : (
                    <div className="text-center pt-8 pb-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <p className="text-gray-700 font-bold text-lg mb-2">No bank account connected</p>
                      <p className="text-gray-500 mb-6">Connect your bank account to receive payouts</p>
                      {retailer?.id ? (
                        <motion.button
                          whileHover={{ scale: (plaidLoading || connecting) ? 1 : 1.05 }}
                          whileTap={{ scale: (plaidLoading || connecting) ? 1 : 0.95 }}
                          onClick={handlePlaidConnect}
                          disabled={plaidLoading || connecting || !plaidScriptLoaded}
                          className={`px-8 py-3 bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white rounded-2xl font-bold hover:shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] transition-all flex items-center gap-2 mx-auto ${
                            (plaidLoading || connecting || !plaidScriptLoaded) ? 'opacity-75 cursor-not-allowed' : ''
                          }`}
                        >
                          {(plaidLoading || connecting) && (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          )}
                          {connecting ? 'Connecting...' : plaidLoading ? 'Opening...' : !plaidScriptLoaded ? 'Loading...' : 'Connect Bank Account'}
                        </motion.button>
                      ) : (
                        <Link href="/onboard/register">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-8 py-3 bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white rounded-2xl font-bold hover:shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] transition-all mx-auto"
                          >
                            Complete registration first
                          </motion.button>
                        </Link>
                      )}
                      
                      {/* Bank Availability Info */}
                      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-semibold text-blue-800">Chase & Schwab available in 2 weeks</span>
                        </div>
                        <p className="text-xs text-blue-600">All other major banks accepted • Instant setup • Secure connection</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Your Displays Section */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 md:p-8 border border-transparent shadow-lg"
                >
                  <h4 className="font-bold text-gray-900 text-base md:text-lg mb-4 md:mb-6">Your Displays (UIDs)</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {uids.map((uid, idx) => {
                      const displayStatus = getDisplayStatus(uid);
                      const statusColors = {
                        green: 'bg-green-100 text-green-700 border-green-200',
                        blue: 'bg-blue-100 text-blue-700 border-blue-200',
                        yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                        gray: 'bg-gray-100 text-gray-700 border-gray-200'
                      };
                      
                      return (
                        <motion.div
                          key={uid.uid}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          whileHover={{ scale: 1.03, y: -5 }}
                          className="bg-white rounded-3xl border border-transparent p-6 shadow-lg hover:shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] hover:border-purple-200 transition-all"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2.5 rounded-full">
                              <span className={`w-2 h-2 ${displayStatus.dotColor} rounded-full animate-pulse`}></span>
                              <span className="text-sm font-bold text-gray-700">{displayStatus.badge}</span>
                            </div>
                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 ${statusColors[displayStatus.color]}`}>
                              {displayStatus.status.includes('Active') ? 'Active' : displayStatus.status.split(' ')[0]}
                            </span>
                          </div>

                          <h5 className="text-lg font-bold text-gray-900 mb-2">Display UID</h5>

                          <div className="mb-3">
                            <span className="text-xs text-gray-500 font-semibold">UID:</span>
                            <p className="font-mono text-sm text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg mt-1">
                              {uid.uid}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <div className="text-sm font-semibold text-gray-700">
                              {displayStatus.status}
                            </div>
                            
                            {uid.registered_at && (
                              <div className="text-xs text-gray-500">
                                Registered: {new Date(uid.registered_at).toLocaleDateString()}
                              </div>
                            )}
                            
                            {uid.claimed_at && (
                              <div className="text-xs text-gray-500">
                                Claimed: {new Date(uid.claimed_at).toLocaleDateString()}
                              </div>
                            )}
                            
                            {displayStatus.storeName && (
                              <div className="text-xs text-gray-600 font-medium">
                                📍 {displayStatus.storeName}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {uids.length === 0 && (
                    <div className="bg-white rounded-3xl border border-transparent p-12 text-center shadow-lg">
                      <div className="flex flex-col items-center gap-4 max-w-sm mx-auto px-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-gray-900 font-bold text-lg mb-1">No displays assigned yet</p>
                          <p className="text-gray-500 text-sm">Contact support to get your first display</p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Store Profile */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 md:p-8 border border-transparent hover:border-gray-200 transition-all shadow-lg"
                >
                  <h4 className="font-bold text-gray-900 text-base md:text-lg mb-4 md:mb-6">Store Profile</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Store Name</label>
                      <div className="w-full px-4 py-3 border border-transparent rounded-xl bg-gray-50 text-gray-900">
                        {retailer?.name || 'Not set'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Address</label>
                      <div className="w-full px-4 py-3 border border-transparent rounded-xl bg-gray-50 text-gray-900">
                        {retailer?.address || retailer?.location || 'Not set'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Owner Name</label>
                      <div className="w-full px-4 py-3 border border-transparent rounded-xl bg-gray-50 text-gray-900">
                        {retailer?.owner_name || 'Not set'}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Contact support to update your store information</p>
                  </div>
                </motion.div>

                {/* Shipping Preferences */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 md:p-8 border border-transparent hover:border-gray-200 transition-all shadow-lg"
                >
                  <h4 className="font-bold text-gray-900 text-base md:text-lg mb-4 md:mb-6">Display Shipping Preferences</h4>
                  <div className="space-y-4">
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-bold text-gray-900">Express Shipping</h5>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={retailer?.express_shipping || false}
                                onChange={handleExpressShippingToggle}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#ff6fb3]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#ff7a4a] peer-checked:to-[#ff6fb3]"></div>
                            </label>
                          </div>
                          <p className="text-sm text-gray-600">
                            Get your new displays delivered faster with priority shipping
                          </p>
                          {retailer?.express_shipping ? (
                            <div className="mt-2 text-xs font-semibold text-green-700">
                              ✓ Display shipping active — your display will ship priority
                            </div>
                          ) : (
                            <div className="mt-2 text-xs text-gray-500">
                              Toggle to purchase express shipping for faster delivery
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Display Confirmation */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 md:p-8 border border-transparent hover:border-gray-200 transition-all shadow-lg"
                >
                  <h4 className="font-bold text-gray-900 text-base md:text-lg mb-4 md:mb-6">Display Confirmation</h4>
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-bold text-gray-900">Displays Owned</h5>
                            <span className="text-2xl font-black bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] bg-clip-text text-transparent">
                              {uids.length}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            You have {uids.length} {uids.length === 1 ? 'display' : 'displays'} registered to your store
                          </p>

                          {/* Priority Display Status */}
                          {retailer?.priority_display_active ? (
                            <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-lg">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">💎</span>
                                <div>
                                  <p className="font-bold text-amber-900">Priority Display Active</p>
                                  <p className="text-xs text-amber-700">Premium marketplace placement enabled</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">📦</span>
                                <div>
                                  <p className="font-bold text-blue-900">Standard Display</p>
                                  <p className="text-xs text-blue-700">
                                    <Link href="/onboard/shopify-connect" className="underline hover:text-blue-900">
                                      Upgrade to Priority Display
                                    </Link> for premium placement
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Shipping Status */}
                          <div className="mt-3 p-3 bg-green-50 border-2 border-green-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🚚</span>
                              <div>
                                <p className="font-bold text-green-900">Shipping Status</p>
                                <p className="text-xs text-green-700">
                                  {retailer?.express_shipping ? 'Express shipping enabled - faster delivery' : 'Standard shipping - free delivery'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Store Contact Information */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 md:p-8 border border-transparent hover:border-gray-200 transition-all shadow-lg"
                >
                  <h4 className="font-bold text-gray-900 text-base md:text-lg mb-4 md:mb-6">Store Contact Information</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Manager Name</label>
                      <div className="w-full px-4 py-3 border border-transparent rounded-xl bg-gray-50 text-gray-900">
                        {retailer?.manager_name || 'Not set'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Store Phone</label>
                      <div className="w-full px-4 py-3 border border-transparent rounded-xl bg-gray-50 text-gray-900">
                        {retailer?.phone || retailer?.store_phone || 'Not set'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Store Email</label>
                      <div className="w-full px-4 py-3 border border-transparent rounded-xl bg-gray-50 text-gray-900">
                        {retailer?.email || 'Not set'}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">We use this information to send updates about your displays and payouts</p>
                  </div>
                </motion.div>

                {/* Account Actions */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 md:p-8 border border-transparent hover:border-gray-200 transition-all shadow-lg"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-gray-900 text-base md:text-lg mb-2">Account</h4>
                      <p className="text-sm text-gray-600">Sign out to switch accounts or end your session securely.</p>
                    </div>
                    <button
                      onClick={() => signOut()}
                      className="px-6 py-3 font-bold text-gray-700 hover:text-gray-900 transition-all rounded-2xl border border-transparent/80 hover:border-gray-400 bg-white/80 backdrop-blur-sm hover:bg-white/90 shadow-sm hover:shadow-md"
                    >
                      Sign Out
                    </button>
                  </div>
                </motion.div>

                {/* Save Button */}
                <motion.button 
                  whileHover={{ scale: settingsChanged ? 1.02 : 1 }}
                  whileTap={{ scale: settingsChanged ? 0.98 : 1 }}
                  onClick={() => {
                    if (settingsChanged) {
                      showToast('Settings saved successfully!', 'success');
                      setSettingsChanged(false);
                    }
                  }}
                  className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all ${
                    settingsChanged
                      ? 'bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white hover:shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] cursor-pointer'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={!settingsChanged}
                >
                  {settingsChanged ? '💾 Save Changes' : '✓ All Settings Saved'}
                </motion.button>
              </motion.div>
            )}
          </div>
      </div>

      {/* Remove Bank Confirmation Modal */}
      <AnimatePresence>
        {showRemoveConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowRemoveConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] max-w-md w-full p-6 md:p-8 border border-transparent"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xs md:text-sm font-bold text-gray-900 text-center mb-2">Remove Bank Account?</h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                This will disconnect your bank account. Your payout history will be preserved, but you won't be able to receive new payouts until you connect a new bank account.
              </p>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowRemoveConfirm(false)}
                  className="flex-1 px-6 py-3 border border-transparent text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRemoveBank}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-bold hover:shadow-lg transition-all"
                >
                  Remove Bank
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
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
      </AnimatePresence>
    </div>
    </>
  );
}
