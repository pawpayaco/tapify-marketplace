import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthContext } from '../../context/AuthContext';
import Head from 'next/head';

export default function RetailerDashboard() {
  const router = useRouter();
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [settingsChanged, setSettingsChanged] = useState(false);
  
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

  // Fetch all retailer data
  useEffect(() => {
    const fetchRetailerData = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Get retailer profile - try multiple methods to find retailer
        let retailerData = null;
        let retailerError = null;
        
        // Try finding by name first
        const nameResult = await supabase
          .from('retailers')
          .select('*')
          .eq('name', user.email)
          .maybeSingle();
        
        if (nameResult.data) {
          retailerData = nameResult.data;
        } else {
          // Try finding by email field if it exists
          const emailResult = await supabase
            .from('retailers')
            .select('*')
            .ilike('name', `%${user.email}%`)
            .limit(1);
          
          if (emailResult.data && emailResult.data.length > 0) {
            retailerData = emailResult.data[0];
          }
        }
        
        // If no retailer found, initialize with empty data (no popup - just continue)
        if (!retailerData) {
          console.warn('No retailer profile found for user:', user.email);
          // Don't show popup - let them finish onboarding in registration flow
          // showToast('No retailer profile found. Contact support to get set up.', 'error');
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
        
        // Get UIDs
        const { data: uidsData } = await supabase
          .from('uids')
          .select('*')
          .limit(100);
        
        setUids(uidsData || []);
        
        // Get scans data
        const { data: scansData } = await supabase
          .from('scans')
          .select('*')
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

  // Handle Plaid Connect
  const handlePlaidConnect = async () => {
    try {
      // Get link token from backend
      const response = await fetch('/api/plaid-link-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user?.id,
          retailer_id: retailer?.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get link token');
      }

      const { link_token } = await response.json();

      // Initialize Plaid Link
      const handler = window.Plaid.create({
        token: link_token,
        onSuccess: async (public_token, metadata) => {
          try {
            // Exchange public token for access token
            const exchangeResponse = await fetch('/api/plaid-exchange', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                public_token,
                user_id: user?.id,
                retailer_id: retailer?.id,
                metadata
              })
            });

            if (exchangeResponse.ok) {
              showToast('Bank account connected successfully!', 'success');
              // Refresh the page to update the UI
              window.location.reload();
            } else {
              throw new Error('Failed to exchange token');
            }
          } catch (error) {
            console.error('Plaid exchange error:', error);
            showToast('Failed to connect bank account', 'error');
          }
        },
        onExit: (err, metadata) => {
          if (err) {
            console.error('Plaid exit error:', err);
            showToast('Bank connection cancelled', 'info');
          }
        },
        onEvent: (eventName, metadata) => {
          console.log('Plaid event:', eventName, metadata);
        }
      });

      handler.open();
    } catch (error) {
      console.error('Plaid connect error:', error);
      showToast('Failed to initialize bank connection', 'error');
    }
  };

  // Calculate max values for charts
  const maxScans = weeklyData.length > 0 ? Math.max(...weeklyData.map(d => d.scans), 1) : 1;
  const maxRevenue = weeklyData.length > 0 ? Math.max(...weeklyData.map(d => d.revenue), 1) : 1;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20" style={{ backgroundColor: '#faf8f3' }}>
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
      <Head>
        <script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>
      </Head>
      <div className="min-h-screen pt-20" style={{ backgroundColor: '#faf8f3' }}>
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white py-12 px-6 shadow-lg relative overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 md:w-96 md:h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-4xl md:text-5xl font-bold mb-2"
              >
                Your Dashboard 📊
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-white/90 text-lg"
              >
                Welcome back! Here's how your displays are performing.
              </motion.p>
            </div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex gap-3"
            >
              <Link 
                href="/"
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold transition-all backdrop-blur-sm hover:scale-105"
              >
                ← Home
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI Cards */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8"
        >
          {/* Weekly Scans */}
          <motion.div 
            variants={fadeInUp}
            className="bg-white rounded-3xl p-6 border-2 border-gray-100"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full font-bold">New</span>
            </div>
            <h3 className="text-gray-600 text-sm font-semibold mb-1">Weekly Scans</h3>
            <p className="text-4xl font-bold text-gray-900 mb-1">{stats.weeklyScans}</p>
            <p className="text-xs text-gray-500">Last 7 days</p>
          </motion.div>

          {/* Revenue */}
          <motion.div 
            variants={fadeInUp}
            className="bg-white rounded-3xl p-6 border-2 border-gray-100"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#ff7a4a] to-[#ff6fb3] rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full font-bold">New</span>
            </div>
            <h3 className="text-gray-600 text-sm font-semibold mb-1">Revenue Earned</h3>
            <p className="text-4xl font-bold text-gray-900 mb-1">${stats.revenue.toLocaleString()}</p>
            <p className="text-xs text-gray-500">This month</p>
          </motion.div>

          {/* Displays Claimed */}
          <motion.div 
            variants={fadeInUp}
            className="bg-white rounded-3xl p-6 border-2 border-gray-100"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-bold">Active</span>
            </div>
            <h3 className="text-gray-600 text-sm font-semibold mb-1">Displays Active</h3>
            <p className="text-4xl font-bold text-gray-900 mb-1">{stats.displaysClaimed}</p>
            <p className="text-xs text-gray-500">In your store</p>
          </motion.div>

          {/* Conversion Rate */}
          <motion.div 
            variants={fadeInUp}
            className="bg-white rounded-3xl p-6 border-2 border-gray-100"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full font-bold">New</span>
            </div>
            <h3 className="text-gray-600 text-sm font-semibold mb-1">Conversion Rate</h3>
            <p className="text-4xl font-bold text-gray-900 mb-1">{stats.conversionRate}%</p>
            <p className="text-xs text-gray-500">Scans to orders</p>
          </motion.div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-4 mb-6"
        >
          <div className="flex flex-wrap gap-3">
            {[
              { id: 'stats', label: 'Stats & Analytics' },
              { id: 'orders', label: 'Orders' },
              { id: 'payouts', label: 'Payouts' },
              { id: 'displays', label: 'Displays' },
              { id: 'settings', label: 'Settings' }
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    "rounded-2xl px-6 py-3 text-sm font-bold transition-all",
                    active
                      ? "bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white shadow-lg"
                      : "text-gray-700 hover:bg-gray-100 border-2 border-gray-200",
                  ].join(" ")}
                >
                  {tab.label}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

          {/* Tab Content */}
          <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-8">
            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Weekly Performance Chart */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Weekly Performance</h3>
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border-2 border-gray-100">
                    {/* Bar Chart - Scans */}
                    <div className="mb-10">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-gray-700 text-lg">Scans per Day</h4>
                        <div className="text-sm text-gray-500">Max: {maxScans}</div>
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
                        <h4 className="font-bold text-gray-700 text-lg">Revenue per Day</h4>
                        <div className="text-sm text-gray-500">Max: ${maxRevenue}</div>
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
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Top Performing Products</h3>
                  <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-lg">
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
                        {topProducts.length > 0 ? (
                          topProducts.map((product, idx) => (
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
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="py-20 text-center">
                              <div className="flex flex-col items-center gap-4">
                                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-gray-900 font-bold text-lg mb-1">No product data yet</p>
                                  <p className="text-gray-500">Product performance will show here once you have scans</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Orders Tab (Scans Activity) */}
            {activeTab === 'orders' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Unpaid Earnings Banner */}
                {stats.unpaidEarnings > 0 && (
                  <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-300 rounded-2xl p-6 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-1">💰 Unpaid Earnings</h4>
                        <p className="text-sm text-gray-600">Pending payout to your account</p>
                      </div>
                      <div className="text-3xl font-bold text-orange-700">${stats.unpaidEarnings.toFixed(2)}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Recent Scan Activity</h3>
                  <div className="text-sm text-gray-500 font-semibold">
                    Showing {scans.length} scans
                  </div>
                </div>

                <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-lg">
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
                      {scans.length > 0 ? (
                        scans.slice(0, 50).map((scan, idx) => (
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
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="py-20 text-center">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-gray-900 font-bold text-lg mb-1">No scans yet</p>
                                <p className="text-gray-500">Scan activity will appear here once customers interact with your displays</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Payouts Tab */}
            {activeTab === 'payouts' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">💸 Payouts</h3>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleExportPayouts}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all"
                  >
                    Export CSV
                  </motion.button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-3xl p-6 shadow-lg">
                    <h4 className="font-bold text-gray-700 mb-2">Pending Earnings</h4>
                    <p className="text-3xl font-bold text-gray-900">
                      ${payoutJobs
                        .filter(p => p.status === 'pending')
                        .reduce((sum, p) => sum + (p.retailer_cut || 0), 0)
                        .toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-3xl p-6 shadow-lg">
                    <h4 className="font-bold text-gray-700 mb-2">Total Paid Out</h4>
                    <p className="text-3xl font-bold text-gray-900">
                      ${payoutJobs
                        .filter(p => p.status === 'paid')
                        .reduce((sum, p) => sum + (p.retailer_cut || 0), 0)
                        .toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-3xl p-6 shadow-lg">
                    <h4 className="font-bold text-gray-700 mb-2">Lifetime Earnings</h4>
                    <p className="text-3xl font-bold text-gray-900">
                      ${payoutJobs
                        .reduce((sum, p) => sum + (p.retailer_cut || 0), 0)
                        .toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Payouts Table */}
                <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-lg">
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
                      {payoutJobs.length > 0 ? (
                        payoutJobs.map((payout, idx) => (
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
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="py-20">
                            <div className="text-center">
                              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <p className="text-gray-900 font-bold text-lg mb-1">No payouts yet</p>
                              <p className="text-gray-500">Your payout history will appear here</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Displays Tab */}
            {activeTab === 'displays' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-6">🖼️ Your Displays (UIDs)</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {uids.map((uid, idx) => (
                    <motion.div
                      key={uid.uid}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ scale: 1.03, y: -5 }}
                      className="bg-white rounded-3xl border-2 border-gray-100 p-6 shadow-lg hover:shadow-2xl hover:border-purple-200 transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                        </div>
                        <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                          Active
                        </span>
                      </div>
                      
                      <h4 className="text-lg font-bold text-gray-900 mb-2">
                        Display UID
                      </h4>
                      
                      <div className="mb-3">
                        <span className="text-xs text-gray-500 font-semibold">UID:</span>
                        <p className="font-mono text-sm text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg mt-1">
                          {uid.uid}
                        </p>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Registered: {new Date(uid.registered_at).toLocaleDateString()}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {uids.length === 0 && (
                  <div className="bg-white rounded-3xl border-2 border-gray-100 p-12 text-center shadow-lg">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    </div>
                    <p className="text-gray-700 font-bold text-lg">No displays assigned yet</p>
                    <p className="text-gray-500 mt-2">Contact support to get your first display</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <h3 className="text-2xl font-bold text-gray-900">Store Settings</h3>

                {/* Bank Connection Section */}
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border-2 border-gray-100 shadow-lg">
                  <h4 className="font-bold text-gray-900 text-lg mb-6">Bank Connection</h4>
                  
                  {retailerAccount?.plaid_access_token ? (
                    <div className="flex items-center justify-between p-6 bg-green-50 border-2 border-green-200 rounded-2xl">
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
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => showToast('Bank connection feature coming soon!', 'success')}
                        className="px-6 py-2.5 border-2 border-green-300 text-green-700 rounded-2xl text-sm font-bold hover:bg-green-50 transition-all"
                      >
                        Update Bank
                      </motion.button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <p className="text-gray-700 font-bold text-lg mb-2">No bank account connected</p>
                      <p className="text-gray-500 mb-6">Connect your bank account to receive payouts</p>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePlaidConnect}
                        className="px-8 py-3 bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white rounded-2xl font-bold hover:shadow-xl transition-all"
                      >
                        Connect Bank Account
                      </motion.button>
                      
                      {/* Bank Availability Info */}
                      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-semibold text-blue-800">Chase & Schwab coming in 2 weeks</span>
                        </div>
                        <p className="text-xs text-blue-600">All other major banks accepted • Instant setup • Secure connection</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Store Information */}
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border-2 border-gray-100 hover:border-gray-200 transition-all shadow-lg"
                >
                  <h4 className="font-bold text-gray-900 text-lg mb-6">Retailer Information</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Store Name</label>
                      <input
                        type="text"
                        value={retailer?.name || 'Not set'}
                        readOnly
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Location</label>
                      <input
                        type="text"
                        value={retailer?.location || 'Not set'}
                        readOnly
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Linked Vendor</label>
                      <input
                        type="text"
                        value={retailer?.linked_vendor_id?.substring(0, 8) || 'Not linked'}
                        readOnly
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-2">Contact support to update your information</p>
                    </div>
                  </div>
                </motion.div>

                {/* Notification Preferences */}
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border-2 border-gray-100 hover:border-gray-200 transition-all shadow-lg"
                >
                  <h4 className="font-bold text-gray-900 text-lg mb-6">Notification Preferences</h4>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        defaultChecked 
                        onChange={() => setSettingsChanged(true)}
                        className="w-5 h-5 text-[#ff6fb3] rounded focus:ring-[#ff6fb3]" 
                      />
                      <span className="text-gray-700 font-medium group-hover:text-gray-900 transition-colors">Email me when a new order is placed</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        defaultChecked 
                        onChange={() => setSettingsChanged(true)}
                        className="w-5 h-5 text-[#ff6fb3] rounded focus:ring-[#ff6fb3]" 
                      />
                      <span className="text-gray-700 font-medium group-hover:text-gray-900 transition-colors">Weekly performance summary</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        onChange={() => setSettingsChanged(true)}
                        className="w-5 h-5 text-[#ff6fb3] rounded focus:ring-[#ff6fb3]" 
                      />
                      <span className="text-gray-700 font-medium group-hover:text-gray-900 transition-colors">Product rotation updates</span>
                    </label>
                  </div>
                </motion.div>

                {/* Payout Settings */}
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border-2 border-gray-100 hover:border-gray-200 transition-all shadow-lg"
                >
                  <h4 className="font-bold text-gray-900 text-lg mb-6">Payout Settings</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Payout Method</label>
                      <select 
                        onChange={() => setSettingsChanged(true)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all"
                      >
                        <option>Bank Transfer (ACH)</option>
                        <option>PayPal</option>
                        <option>Stripe</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Payout Frequency</label>
                      <select 
                        onChange={() => setSettingsChanged(true)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all"
                      >
                        <option>Weekly</option>
                        <option>Bi-weekly</option>
                        <option>Monthly</option>
                      </select>
                    </div>
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
                      ? 'bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white hover:shadow-xl cursor-pointer'
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
              "rounded-2xl px-6 py-4 shadow-2xl border-2 flex items-center gap-3 min-w-[300px]",
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
