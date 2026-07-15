import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { useAuthContext } from '../../context/AuthContext';
import Script from 'next/script';
import OrderDisplayModal from '../../components/OrderDisplayModal';

export default function RetailerDashboard() {
  // ============================================================================
  // TEMPORARY: Bank connection disabled while waiting for Dwolla production keys
  // TO RE-ENABLE: Change this to false and redeploy
  // ============================================================================
  // Re-enabled: linking now goes through /api/plaid-connect, which stores only a
  // Plaid account reference and never touches Dwolla. Payouts settle manually via
  // Chase direct deposit from /api/admin/payout-csv until Dwolla is approved.
  const BANK_CONNECTION_DISABLED = false;

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
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

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

        // Get retailer profile - try by user ID first, then by email
        let { data: retailerData, error: retailerError } = await supabase
          .from('retailers')
          .select('*')
          .eq('created_by_user_id', user.id)
          .maybeSingle();

        if (retailerError) {
          console.error('Error fetching retailer by user_id:', retailerError);
        }

        // FALLBACK: If no retailer found by user_id, try finding by email
        // This handles cases where customer claimed UID before creating account
        if (!retailerData && user.email) {
          console.log('[Dashboard] No retailer found by user_id, trying email match:', user.email);

          const { data: emailRetailer, error: emailError } = await supabase
            .from('retailers')
            .select('*')
            .eq('email', user.email)
            .maybeSingle();

          if (emailError) {
            console.error('Error fetching retailer by email:', emailError);
          }

          if (emailRetailer) {
            console.log('[Dashboard] Found retailer by email, linking to user account');
            retailerData = emailRetailer;

            // Update the retailer to link it to this user account
            const { error: updateError } = await supabase
              .from('retailers')
              .update({ created_by_user_id: user.id })
              .eq('id', emailRetailer.id);

            if (updateError) {
              console.error('Error linking retailer to user:', updateError);
            } else {
              console.log('[Dashboard] Successfully linked retailer', emailRetailer.id, 'to user', user.id);
            }
          }
        }

        // If still no retailer found, initialize with empty data
        if (!retailerData) {
          console.warn('No retailer profile found for user:', user.id, 'or email:', user.email);
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

        // Get all retailer IDs that belong to this user (by user_id OR email match)
        const { data: allUserRetailers } = await supabase
          .from('retailers')
          .select('id')
          .or(`created_by_user_id.eq.${user.id},email.eq.${user.email}`);

        const retailerIds = allUserRetailers?.map(r => r.id) || [retailerData.id];

        console.log('🔍 [Dashboard] ========== FETCHING UIDs ==========');
        console.log('🔍 [Dashboard] Current user ID:', user?.id);
        console.log('🔍 [Dashboard] Retailer data:', retailerData);
        console.log('🔍 [Dashboard] All user retailers:', allUserRetailers);
        console.log('🔍 [Dashboard] Fetching UIDs for retailer IDs:', retailerIds);

        // Get UIDs claimed by ANY of this user's retailers
        const { data: uidsData, error: uidsError } = await supabase
          .from('uids')
          .select(`
            *,
            business:business_id (
              id,
              name
            )
          `)
          .in('retailer_id', retailerIds)
          .limit(100);

        console.log('📥 [Dashboard] UIDs query result:', { uidsData, uidsError });
        console.log('📥 [Dashboard] Found', uidsData?.length || 0, 'UIDs');
        if (uidsData && uidsData.length > 0) {
          console.log('📥 [Dashboard] UID details:', uidsData.map(u => ({
            uid: u.uid,
            retailer_id: u.retailer_id,
            is_claimed: u.is_claimed
          })));
        }

        setUids(uidsData || []);

        // Get scans ONLY for UIDs that are claimed and belong to this user
        // This prevents showing scans from unclaimed or unrelated UIDs
        const claimedUids = (uidsData || [])
          .filter(uid => uid.is_claimed)
          .map(uid => uid.uid);

        console.log('[Dashboard] Fetching scans for claimed UIDs:', claimedUids);

        let scansData = [];
        if (claimedUids.length > 0) {
          const { data: scans } = await supabase
            .from('scans')
            .select('*')
            .in('uid', claimedUids)
            .order('timestamp', { ascending: false })
            .limit(100);

          scansData = scans || [];
        } else {
          console.log('[Dashboard] No claimed UIDs found, skipping scans query');
        }

        setScans(scansData);

        // Get payout jobs and earnings from API endpoint
        let payoutsData = [];
        try {
          const earningsResponse = await fetch('/api/retailer-earnings');
          if (earningsResponse.ok) {
            const earningsData = await earningsResponse.json();
            payoutsData = earningsData.payouts || [];
            setPayoutJobs(payoutsData);
          } else {
            console.warn('[Dashboard] Failed to fetch earnings data');
            setPayoutJobs([]);
          }
        } catch (earningsError) {
          console.error('[Dashboard] Error fetching earnings:', earningsError);
          setPayoutJobs([]);
        }

        // Get retailer account
        const { data: accountData } = await supabase
          .from('retailer_bank_status')
          .select('*')
          .eq('retailer_id', retailerData.id)
          .maybeSingle();

        setRetailerAccount(accountData);

        // Calculate stats
        calculateStatsFromScans(scansData || [], uidsData || [], payoutsData || []);
        calculateWeeklyData(scansData || [], payoutsData || []);
        
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

  }, [user?.id, user?.email]);

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
  const calculateWeeklyData = (scansData, payoutsData = []) => {
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

      // Calculate revenue from payout_jobs created on this day
      const dayPayouts = payoutsData.filter(payout => {
        const payoutDate = new Date(payout.created_at);
        return payoutDate.toDateString() === targetDate.toDateString();
      });

      const dayRevenue = dayPayouts.reduce((sum, p) => sum + (p.retailer_cut || 0), 0);

      weekData.push({
        day: days[targetDate.getDay()],
        scans: dayScans.length,
        orders: dayScans.filter(s => s.converted).length,
        revenue: dayRevenue
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
            const exchangeResponse = await fetch('/api/plaid-connect', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                public_token,
                account_id: metadata?.account_id || metadata?.accounts?.[0]?.id,
                retailer_id: retailer.id,
                metadata
              })
            });

            console.log('[PLAID CONNECT] Exchange response status:', exchangeResponse.status);

            if (exchangeResponse.ok) {
              const result = await exchangeResponse.json();
              console.log('[PLAID CONNECT] Bank account connected successfully', result);

              // Refresh retailer account data
              const { data: accountData } = await supabase
                .from('retailer_bank_status')
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

  // A spinner is a decoration for a wait this short. Say what's happening and
  // hold the layout still.
  if (loading) {
    return (
      <div className="t-page" style={{ minHeight: '100vh' }}>
        <div className="t-wrap">
          <header style={{ padding: '64px 0 36px' }}>
            <p style={{ fontSize: 13, color: 'var(--pewter)', margin: 0 }}>&nbsp;</p>
            <h1 style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em', margin: '8px 0 0', color: 'var(--fog)' }}>
              Loading your displays…
            </h1>
          </header>
        </div>
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

  // Formatting helpers for the rebuilt view.
  const fmtMoney = (n) =>
    Number(n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const fmtWhen = (ts) => {
    if (!ts) return '—';
    const d = new Date(ts);
    const today = new Date().toDateString() === d.toDateString();
    return today
      ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <Script
        src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"
        strategy="lazyOnload"
        onLoad={() => setPlaidScriptLoaded(true)}
        onError={() => console.error('[PLAID] Script failed to load')}
      />

      <div className="t-page" style={{ minHeight: '100vh' }}>
        <div className="t-wrap">

          {/* Header — the store's own name, then the one thing this page is about. */}
          <header style={{ padding: '64px 0 36px' }}>
            <p style={{ fontSize: 13, color: 'var(--pewter)', margin: 0 }}>
              {retailer?.name || 'Your store'}
            </p>
            <h1 style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em', margin: '8px 0 0' }}>
              Your displays
            </h1>
          </header>

          {/* Spec sheet. Tesla puts 358mi / 200mph / 3.1s here. One gradient number. */}
          <section className="t-spec">
            <div className="t-spec__cell">
              <div className="t-spec__value">{stats.weeklyScans}</div>
              <div className="t-spec__label">Taps this week</div>
            </div>
            <div className="t-spec__cell">
              <div className="t-spec__value t-spec__value--brand">{fmtMoney(stats.revenue)}</div>
              <div className="t-spec__label">Earned this month</div>
            </div>
            <div className="t-spec__cell">
              <div className="t-spec__value">{stats.displaysClaimed}</div>
              <div className="t-spec__label">{stats.displaysClaimed === 1 ? 'Display live' : 'Displays live'}</div>
            </div>
            <div className="t-spec__cell">
              <div className="t-spec__value">
                {Math.round(stats.conversionRate)}<span style={{ fontSize: 24, color: 'var(--pewter)' }}>%</span>
              </div>
              <div className="t-spec__label">Taps that bought</div>
            </div>
          </section>

          {/* The thing a store owner opens this page to see. */}
          <section className="t-section t-row">
            <div>
              <div className="t-section__title">Waiting to be paid</div>
              <p className="t-section__note">
                {retailerAccount?.is_connected
                  ? `Deposited to ${retailerAccount.institution_name || 'your bank'}${retailerAccount.account_mask ? ` ••••${retailerAccount.account_mask}` : ''}.`
                  : 'Connect a bank below to get paid.'}
              </p>
              <div className="t-hero-num">{fmtMoney(stats.unpaidEarnings)}</div>
            </div>
            {payoutJobs.length > 0 && (
              <button className="t-btn t-btn--secondary" onClick={handleExportPayouts}>Export CSV</button>
            )}
          </section>

          <section className="t-section" style={{ paddingBottom: 0 }}>
            <div className="t-tabs">
              {[['stats', 'Activity'], ['payouts', 'Payouts'], ['settings', 'Settings']].map(([id, label]) => (
                <button
                  key={id}
                  className="t-tab"
                  role="tab"
                  aria-selected={activeTab === id}
                  onClick={() => handleTabChange(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* ---------------------------------------------------------- ACTIVITY */}
          {activeTab === 'stats' && (
            <>
              <section className="t-section" style={{ borderTop: 0 }}>
                <div className="t-section__title">Recent taps</div>
                <p className="t-section__note">Every row is someone who tapped a display in your store.</p>

                {scans.length === 0 ? (
                  <p className="t-empty">No taps yet. Once your display is on the counter, they show up here within seconds.</p>
                ) : (
                  <div className="t-scroll">
                    <table className="t-feed" style={{ marginTop: 28 }}>
                      <thead>
                        <tr>
                          <th style={{ width: 150 }}>When</th>
                          <th style={{ width: 170 }}>Display</th>
                          <th>Where</th>
                          <th style={{ width: 130 }}>Result</th>
                          <th style={{ width: 110, textAlign: 'right' }}>You earned</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scans.slice(0, 25).map((scan) => (
                          <tr key={scan.id}>
                            <td className="t-mono" style={{ color: 'var(--pewter)' }}>{fmtWhen(scan.timestamp)}</td>
                            <td className="t-mono">{scan.uid}</td>
                            <td style={{ color: 'var(--graphite)' }}>{scan.location || '—'}</td>
                            <td>
                              <span className={`t-status ${scan.converted ? 't-status--ok' : 't-status--idle'}`}>
                                {scan.converted ? 'Bought' : 'Browsed'}
                              </span>
                            </td>
                            <td className="t-mono" style={{ textAlign: 'right', color: scan.revenue ? 'var(--ink)' : 'var(--fog)' }}>
                              {scan.revenue ? fmtMoney(scan.revenue * 0.3) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Bars are hairline columns, not filled rounded blocks. */}
              {weeklyData.length > 0 && (
                <section className="t-section">
                  <div className="t-section__title">This week</div>
                  <p className="t-section__note">Taps per day.</p>
                  <div className="t-bars">
                    {weeklyData.map((d, i) => {
                      const max = Math.max(...weeklyData.map((x) => x.scans), 1);
                      return (
                        <div key={i} className="t-bars__col">
                          <div className="t-bars__track">
                            <div
                              className="t-bars__fill"
                              style={{ height: `${(d.scans / max) * 100}%` }}
                              aria-label={`${d.scans} taps on ${d.day}`}
                            />
                          </div>
                          <div className="t-bars__n">{d.scans || ''}</div>
                          <div className="t-bars__d">{d.day}</div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}

          {/* ---------------------------------------------------------- PAYOUTS */}
          {activeTab === 'payouts' && (
            <section className="t-section" style={{ borderTop: 0 }}>
              <div className="t-section__title">Payouts</div>
              <p className="t-section__note">Your 30% of every order a tap produced.</p>

              {payoutJobs.length === 0 ? (
                <p className="t-empty">Nothing yet. Payouts appear here the moment a tap turns into an order.</p>
              ) : (
                <div className="t-scroll">
                  <table className="t-feed" style={{ marginTop: 28 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 150 }}>Date</th>
                        <th style={{ width: 130 }}>Order total</th>
                        <th style={{ width: 140 }}>Status</th>
                        <th style={{ textAlign: 'right' }}>Your cut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payoutJobs.map((payout, i) => (
                        <tr key={i}>
                          <td className="t-mono" style={{ color: 'var(--pewter)' }}>{fmtWhen(payout.date_paid || payout.created_at)}</td>
                          <td className="t-mono">{fmtMoney(payout.total_amount || 0)}</td>
                          <td>
                            <span className={`t-status ${payout.status === 'paid' ? 't-status--ok' : 't-status--pending'}`}>
                              {payout.status === 'paid' ? 'Paid' : 'Pending'}
                            </span>
                          </td>
                          <td className="t-mono" style={{ textAlign: 'right', fontWeight: 500 }}>{fmtMoney(payout.retailer_cut || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* ---------------------------------------------------------- SETTINGS */}
          {activeTab === 'settings' && (
            <>
              <section className="t-section" style={{ borderTop: 0 }}>
                <div className="t-section__title">Your displays</div>
                <p className="t-section__note">
                  {retailer?.displays_ordered > 0
                    ? `${retailer.displays_ordered} registered to ${retailer?.name || 'your store'}.`
                    : 'None ordered yet.'}
                </p>

                {uids.length > 0 && (
                  <div className="t-scroll">
                    <table className="t-feed" style={{ marginTop: 28 }}>
                      <thead>
                        <tr>
                          <th style={{ width: 190 }}>Display</th>
                          <th>Status</th>
                          <th style={{ width: 150, textAlign: 'right' }}>Claimed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uids.map((uid) => {
                          const st = getDisplayStatus(uid);
                          return (
                            <tr key={uid.uid}>
                              <td className="t-mono">{uid.uid}</td>
                              <td>
                                <span className={`t-status ${st.color === 'green' ? 't-status--ok' : st.color === 'blue' ? 't-status--pending' : 't-status--idle'}`}>
                                  {st.status}
                                </span>
                              </td>
                              <td className="t-mono" style={{ textAlign: 'right', color: 'var(--pewter)' }}>
                                {uid.claimed_at ? new Date(uid.claimed_at).toLocaleDateString() : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <button className="t-btn t-btn--primary" style={{ marginTop: 28 }} onClick={() => setIsOrderModalOpen(true)}>
                  Order another display
                </button>
              </section>

              {/* Bank — status is a dot and a word, not a green card. */}
              <section className="t-section t-row">
                {retailerAccount?.is_connected ? (
                  <>
                    <div>
                      <div className="t-section__title">
                        {retailerAccount.institution_name || 'Bank connected'}
                        {retailerAccount.account_mask && (
                          <span className="t-mono" style={{ color: 'var(--pewter)', fontSize: 16, marginLeft: 8 }}>
                            ••••{retailerAccount.account_mask}
                          </span>
                        )}
                      </div>
                      <p className="t-section__note">
                        {retailerAccount.account_name ? `${retailerAccount.account_name} · ` : ''}
                        <span className="t-status t-status--ok">Ready for payouts</span>
                      </p>
                    </div>
                    <button className="t-btn t-btn--quiet" onClick={() => setShowRemoveConfirm(true)} disabled={removingBank}>
                      {removingBank ? 'Removing…' : 'Remove bank'}
                    </button>
                  </>
                ) : (
                  <>
                    <div>
                      <div className="t-section__title">No bank connected</div>
                      <p className="t-section__note">
                        {retailer?.id ? 'Connect a bank and we deposit your cut directly.' : 'Finish registering your store first.'}
                      </p>
                    </div>
                    {retailer?.id ? (
                      <button
                        className="t-btn t-btn--primary"
                        onClick={handlePlaidConnect}
                        disabled={plaidLoading || connecting || !plaidScriptLoaded}
                      >
                        {connecting ? 'Connecting…' : plaidLoading ? 'Opening…' : !plaidScriptLoaded ? 'Loading…' : 'Connect bank account'}
                      </button>
                    ) : (
                      <Link href="/onboard/register" className="t-btn t-btn--primary">Finish registering</Link>
                    )}
                  </>
                )}
              </section>

              <section className="t-section">
                <div className="t-section__title">Store details</div>
                <p className="t-section__note">Call us to change any of this.</p>
                <dl className="t-dl">
                  {[
                    ['Store', retailer?.name],
                    ['Address', retailer?.address || retailer?.location],
                    ['Owner', retailer?.owner_name],
                    ['Manager', retailer?.manager_name],
                    ['Phone', retailer?.phone || retailer?.store_phone],
                    ['Email', retailer?.email],
                  ].map(([k, v]) => (
                    <div key={k} className="t-dl__row">
                      <dt className="t-dl__k">{k}</dt>
                      <dd className="t-dl__v">{v || <span style={{ color: 'var(--fog)' }}>Not set</span>}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="t-section" style={{ paddingBottom: 96 }}>
                <div className="t-section__title">Account</div>
                <p className="t-section__note">Signed in as {retailer?.email || 'your account'}.</p>
                <button className="t-btn t-btn--secondary" style={{ marginTop: 20 }} onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}>
                  Sign out
                </button>
              </section>
            </>
          )}
        </div>

        {/* Remove-bank confirm */}
        {showRemoveConfirm && (
          <div className="t-modal" role="dialog" aria-modal="true">
            <div className="t-modal__panel">
              <div className="t-section__title">Remove this bank?</div>
              <p className="t-section__note" style={{ marginBottom: 28 }}>
                We stop depositing your payouts until you connect another one. Nothing you&apos;ve already earned goes away.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button className="t-btn t-btn--secondary" onClick={() => setShowRemoveConfirm(false)}>Keep it</button>
                <button className="t-btn t-btn--danger" onClick={handleRemoveBank} disabled={removingBank}>
                  {removingBank ? 'Removing…' : 'Remove bank'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast — a hairline card and a word, no gradient, no bounce. */}
        {toast && (
          <div className={`t-toast ${toast.type === 'success' ? 't-toast--ok' : 't-toast--fail'}`} role="status">
            {toast.message}
          </div>
        )}

        <OrderDisplayModal
          isOpen={isOrderModalOpen}
          onClose={() => setIsOrderModalOpen(false)}
          onSuccess={(result) => {
            setIsOrderModalOpen(false);
            showToast(`Display ordered. You now have ${result.displays_ordered}.`, 'success');
            if (retailer) setRetailer({ ...retailer, displays_ordered: result.displays_ordered });
          }}
        />
      </div>
    </>
  );
}
