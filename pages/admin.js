import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";
import { formatMoney } from "../utils/formatMoney";
import { initiatePayout } from "../services/dwolla";
import { useAuthContext } from "../context/AuthContext";

const TABS = ["Vendors", "Retailers", "Payouts", "Analytics", "Sourcers", "UIDs"];

// Note: Server-side auth check temporarily disabled due to cookie issues
// Using client-side auth check instead
// export async function getServerSideProps(context) { ... }

export default function Admin() {
  const router = useRouter();
  const { user } = useAuthContext();
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState("Vendors");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [payouts, setPayouts] = useState([]);
  const [loadingPayouts, setLoadingPayouts] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [payoutJobs, setPayoutJobs] = useState([]);
  const [loadingPayoutJobs, setLoadingPayoutJobs] = useState(false);
  const [payoutFilter, setPayoutFilter] = useState('pending'); // 'pending' or 'paid'
  const [processingPayouts, setProcessingPayouts] = useState(new Set());
  const [toast, setToast] = useState(null);

  // Client-side auth check
  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        router.push('/login');
        return;
      }

      // Check if user is in admins table
      if (supabase && user.id) {
        try {
          const { data, error } = await supabase
            .from('admins')
            .select('id')
            .eq('id', user.id)
            .single();

          if (error || !data) {
            console.log('Not authorized as admin:', user.email);
            router.push('/');
          } else {
            setIsAdmin(true);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          router.push('/');
        }
      }

      setAuthLoading(false);
    };

    checkAuth();
  }, [user, router]);

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

  // Fetch payout data from Supabase when Analytics tab is active
  useEffect(() => {
    const fetchPayouts = async () => {
      if (tab === "Analytics") {
        // Check if Supabase is initialized
        if (!supabase) {
          console.warn('Supabase not initialized - skipping payout fetch');
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
          
          // Calculate total revenue
          const total = (data || []).reduce((sum, payout) => sum + (payout.total_amount || 0), 0);
          setTotalRevenue(total);
        } catch (error) {
          console.error('Error fetching payouts:', error);
        } finally {
          setLoadingPayouts(false);
        }
      }
    };

    fetchPayouts();
  }, [tab]);

  // Fetch payout jobs when Payouts tab is active
  useEffect(() => {
    const fetchPayoutJobs = async () => {
      if (tab === "Payouts") {
        if (!supabase) {
          console.warn('Supabase not initialized - skipping payout jobs fetch');
          setLoadingPayoutJobs(false);
          return;
        }

        setLoadingPayoutJobs(true);
        try {
          const { data, error } = await supabase
            .from('payout_jobs')
            .select(`
              *,
              vendors:vendor_id (name, email),
              retailers:retailer_id (name, location),
              sourcer_accounts:sourcer_id (name, email)
            `)
            .eq('status', payoutFilter)
            .order('created_at', { ascending: false });

          if (error) throw error;

          setPayoutJobs(data || []);
        } catch (error) {
          console.error('Error fetching payout jobs:', error);
          showToast('Failed to fetch payout jobs', 'error');
        } finally {
          setLoadingPayoutJobs(false);
        }
      }
    };

    fetchPayoutJobs();
  }, [tab, payoutFilter]);


  // Toast notification helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Process individual payout
  const handleProcessPayout = async (jobId) => {
    setProcessingPayouts(prev => new Set([...prev, jobId]));
    
    try {
      const response = await fetch('/api/payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payoutJobId: jobId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Payout failed');
      }

      // Update the job status in local state
      setPayoutJobs(prev => 
        prev.map(job => 
          job.id === jobId 
            ? { ...job, status: 'paid' }
            : job
        ).filter(job => payoutFilter === 'paid' ? true : job.id !== jobId)
      );

      showToast('Payout processed successfully!', 'success');
    } catch (error) {
      console.error('Error processing payout:', error);
      showToast(error.message || 'Failed to process payout', 'error');
    } finally {
      setProcessingPayouts(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  };

  // Test payout function
  const handleTestPayout = async () => {
    try {
      const testPayoutData = {
        sourceFundingSource: 'https://api-sandbox.dwolla.com/funding-sources/test-source',
        destinationFundingSource: 'https://api-sandbox.dwolla.com/funding-sources/test-dest',
        amount: 100.00,
        currency: 'USD',
        metadata: {
          test: true,
          timestamp: new Date().toISOString(),
        }
      };

      const result = await initiatePayout(testPayoutData);
      alert(`Payout initiated! Transfer ID: ${result.transferId || 'N/A'}`);
    } catch (error) {
      alert(`Payout failed: ${error.message}`);
    }
  };

  // ----- Dummy data -----
  const vendors = useMemo(
    () => [
      { id: "v1", name: "Sunrise Soap Co", email: "hello@sunrise.com", platform: "Shopify", cap: 200, status: "Active" },
      { id: "v2", name: "Moonbeam Ceramics", email: "hi@moonbeam.io", platform: "Etsy", cap: 80, status: "Pending" },
      { id: "v3", name: "Cedar & Sage", email: "support@cedarsage.com", platform: "Shopify", cap: 120, status: "Active" },
    ],
    []
  );

  const retailers = useMemo(
    () => [
      { id: "r1", name: "Green Market - Austin", location: "Austin, TX", displays: 4 },
      { id: "r2", name: "Urban Goods - SF", location: "San Francisco, CA", displays: 7 },
    ],
    []
  );

  const sourcers = useMemo(
    () => [
      { id: "s1", name: "Ecom Kid 1", email: "kid1@tapify.io", revenue: 2450 },
      { id: "s2", name: "Ecom Kid 2", email: "kid2@tapify.io", revenue: 1310 },
    ],
    []
  );

  const uids = useMemo(
    () => [
      { uid: "AAA111", business: "Sunrise Soap Co", claimed: true, scans: 92 },
      { uid: "BBB222", business: "Moonbeam Ceramics", claimed: false, scans: 11 },
      { uid: "CCC333", business: "Cedar & Sage", claimed: true, scans: 37 },
    ],
    []
  );

  const qlc = q.trim().toLowerCase();
  const filtVendors = vendors.filter(
    (v) =>
      (!qlc || v.name.toLowerCase().includes(qlc) || v.email.toLowerCase().includes(qlc)) &&
      (filter === "all" || v.platform.toLowerCase() === filter)
  );

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#ff6fb3] border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold text-lg">Checking authorization...</p>
        </motion.div>
      </div>
    );
  }

  // Show unauthorized message if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto text-center px-6"
        >
          <div className="bg-white rounded-3xl shadow-2xl p-10 border-2 border-red-200">
            <div className="text-7xl mb-6">🚫</div>
            <h1 className="text-4xl font-bold text-red-600 mb-4">Not Authorized</h1>
            <p className="text-gray-600 mb-6 leading-relaxed">
              You don't have permission to access this page. Please contact an administrator if you believe this is an error.
            </p>
            <div className="space-y-4">
              <p className="text-sm text-gray-500 font-medium">Logged in as: {user?.email}</p>
              <motion.a
                href="/"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white px-8 py-4 rounded-2xl hover:shadow-xl transition-all font-bold"
              >
                Go to Home
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white shadow-lg relative overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
            <div className="flex items-start justify-between gap-4">
              {/* Left side - Title and subtitle */}
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
                <p className="text-white/90 text-xs sm:text-sm md:text-base leading-relaxed">
                  Manage vendors, retailers, analytics & more
                </p>
              </motion.div>

              {/* Right side - Version badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex-shrink-0 self-start"
              >
                <span className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold text-white border-2 border-white/30 whitespace-nowrap shadow-lg">
                  v1.1
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
          className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-4 mb-6"
        >
          <div className="flex flex-wrap gap-3">
            {TABS.map((t, i) => {
              const active = tab === t;
              return (
                <motion.button
                  key={t}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTab(t)}
                  className={[
                    "rounded-2xl px-6 py-3 text-sm font-bold transition-all",
                    active
                      ? "bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white shadow-lg"
                      : "text-gray-700 hover:bg-gray-100 border-2 border-gray-200",
                  ].join(" ")}
                >
                  {t}
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
          className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-6 mb-6"
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
                  className="w-full h-12 pl-12 pr-4 rounded-2xl border-2 border-gray-200 bg-white outline-none focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all font-medium"
                />
              </div>
            </div>
            {tab === "Vendors" && (
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="h-12 rounded-2xl border-2 border-gray-200 bg-white px-4 outline-none focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all font-medium"
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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
                  className="bg-white rounded-3xl border-2 border-gray-100 p-6 shadow-lg hover:shadow-2xl hover:border-pink-200 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900">{v.name}</h3>
                    <span
                      className={[
                        "rounded-full px-3 py-1.5 text-xs font-bold",
                        v.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700",
                      ].join(" ")}
                    >
                      {v.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-4">{v.email}</div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-3 py-1.5 text-xs font-bold">
                      {v.platform}
                    </span>
                    <span className="rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 px-3 py-1.5 text-xs font-bold">
                      Cap: {v.cap}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <motion.a
                      href={`/vendor/${v.id}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 text-center rounded-2xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-900 hover:bg-gray-50 transition-all"
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
              {retailers.map((r) => (
                <motion.article
                  key={r.id}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.03, y: -5 }}
                  className="bg-white rounded-3xl border-2 border-gray-100 p-6 shadow-lg hover:shadow-2xl hover:border-purple-200 transition-all"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{r.name}</h3>
                      <div className="text-sm text-gray-600">{r.location}</div>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 px-4 py-3">
                    <div className="text-xs text-gray-600 mb-1">Active Displays</div>
                    <div className="text-2xl font-bold text-blue-700">{r.displays}</div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          )}

          {tab === "Payouts" && (
            <>
              {/* Filter Toggle */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-4 mb-6"
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
                        : "text-gray-700 hover:bg-gray-100 border-2 border-gray-200",
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
                        : "text-gray-700 hover:bg-gray-100 border-2 border-gray-200",
                    ].join(" ")}
                  >
                    Paid
                  </motion.button>
                </div>
              </motion.div>

              {/* Payouts Table */}
              <div className="rounded-3xl border-2 border-gray-100 bg-white shadow-xl overflow-hidden">
                <div className="p-6 border-b-2 border-gray-100 bg-gradient-to-r from-pink-50 to-purple-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Payout Jobs</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {payoutFilter === 'pending' ? 'Process pending payouts' : 'View payout history'}
                      </p>
                    </div>
                    <span className={[
                      "px-4 py-2 rounded-full text-sm font-bold",
                      payoutFilter === 'pending' 
                        ? "bg-yellow-100 text-yellow-700" 
                        : "bg-green-100 text-green-700"
                    ].join(" ")}>
                      {payoutJobs.length} {payoutFilter === 'pending' ? 'Pending' : 'Paid'}
                    </span>
                  </div>
                </div>
                
                {loadingPayoutJobs ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#ff6fb3] border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading payout jobs...</p>
                  </div>
                ) : payoutJobs.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-700 font-bold text-lg">
                      No {payoutFilter} payout jobs
                    </p>
                    <p className="text-gray-500 mt-2">
                      {payoutFilter === 'pending' 
                        ? 'All payouts have been processed!' 
                        : 'Process some payouts to see history here'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left bg-gradient-to-r from-gray-50 to-gray-100">
                          <Th>Vendor</Th>
                          <Th>Retailer</Th>
                          <Th>Sourcer</Th>
                          <Th>Total</Th>
                          <Th>Vendor Cut</Th>
                          <Th>Retailer Cut</Th>
                          <Th>Sourcer Cut</Th>
                          <Th>Tapify Cut</Th>
                          <Th>Date</Th>
                          {payoutFilter === 'pending' && <Th>Action</Th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {payoutJobs.map((job) => {
                          const isProcessing = processingPayouts.has(job.id);
                          const totalAmount = (job.vendor_cut || 0) + (job.retailer_cut || 0) + (job.sourcer_cut || 0) + (job.tapify_cut || 0);
                          
                          return (
                            <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                              <Td>
                                <div>
                                  <div className="font-bold text-gray-900">{job.vendors?.name || 'N/A'}</div>
                                  <div className="text-xs text-gray-500">{job.vendors?.email}</div>
                                </div>
                              </Td>
                              <Td>
                                <div>
                                  <div className="font-bold text-gray-900">{job.retailers?.name || 'N/A'}</div>
                                  <div className="text-xs text-gray-500">{job.retailers?.location}</div>
                                </div>
                              </Td>
                              <Td>
                                <div>
                                  <div className="font-bold text-gray-900">{job.sourcer_accounts?.name || 'N/A'}</div>
                                  <div className="text-xs text-gray-500">{job.sourcer_accounts?.email}</div>
                                </div>
                              </Td>
                              <Td><span className="font-bold text-lg text-purple-700">{formatMoney(totalAmount)}</span></Td>
                              <Td><span className="font-bold text-green-700">{formatMoney(job.vendor_cut || 0)}</span></Td>
                              <Td><span className="font-bold text-blue-700">{formatMoney(job.retailer_cut || 0)}</span></Td>
                              <Td><span className="font-bold text-orange-700">{formatMoney(job.sourcer_cut || 0)}</span></Td>
                              <Td><span className="font-bold text-pink-700">{formatMoney(job.tapify_cut || 0)}</span></Td>
                              <Td className="text-gray-600">{new Date(job.created_at).toLocaleDateString()}</Td>
                              {payoutFilter === 'pending' && (
                                <Td>
                                  <motion.button
                                    whileHover={!isProcessing ? { scale: 1.05 } : {}}
                                    whileTap={!isProcessing ? { scale: 0.95 } : {}}
                                    onClick={() => handleProcessPayout(job.id)}
                                    disabled={isProcessing}
                                    className={[
                                      "rounded-2xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap",
                                      isProcessing
                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        : "bg-gradient-to-r from-green-400 to-emerald-500 text-white hover:shadow-lg"
                                    ].join(" ")}
                                  >
                                    {isProcessing ? (
                                      <span className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                                        Processing...
                                      </span>
                                    ) : (
                                      '💰 Process Payout'
                                    )}
                                  </motion.button>
                                </Td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
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
                  className="bg-white rounded-3xl p-6 shadow-lg border-2 border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all"
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
                  className="bg-white rounded-3xl p-6 shadow-lg border-2 border-gray-100 hover:border-green-200 hover:shadow-xl transition-all"
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
                  className="bg-white rounded-3xl p-6 shadow-lg border-2 border-gray-100 hover:border-pink-200 hover:shadow-xl transition-all"
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
                  className="bg-white rounded-3xl p-6 shadow-lg border-2 border-gray-100 hover:border-purple-200 hover:shadow-xl transition-all"
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

              {/* Test Payout Button */}
              <div className="mb-6">
                <motion.button
                  onClick={handleTestPayout}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-sm font-bold text-white hover:shadow-lg transition-all"
                >
                  🔧 Test Payout (Dwolla)
                </motion.button>
              </div>

              {/* Payouts Table */}
              <div className="rounded-3xl border-2 border-gray-100 bg-white shadow-xl overflow-hidden">
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
                  className="bg-white rounded-3xl border-2 border-gray-100 p-6 shadow-lg hover:shadow-2xl hover:border-green-200 transition-all"
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
            <div className="overflow-auto rounded-3xl border-2 border-gray-100 bg-white shadow-xl">
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
    </div>
  );
}

/* ---------- small UI helpers ---------- */
function Th({ children }) {
  return <th className="px-6 py-4 text-sm font-bold text-gray-700">{children}</th>;
}
function Td({ children, className = "" }) {
  return <td className={`px-6 py-4 text-gray-800 ${className}`}>{children}</td>;
}
