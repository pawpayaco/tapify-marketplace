import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { supabase } from "../lib/supabase";
import { formatMoney } from "../utils/formatMoney";
import { initiatePayout } from "../services/dwolla";
import { useAuthContext } from "../context/AuthContext";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const TABS = ["Vendors", "Retailers", "Analytics", "Sourcers", "UIDs"];

export default function Admin() {
  const router = useRouter();
  const { user, loading: authContextLoading } = useAuthContext();
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState("Vendors");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [payouts, setPayouts] = useState([]);
  const [loadingPayouts, setLoadingPayouts] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);

  // --- GSAP refs ---
  const bgRef = useRef(null);
  const headerRef = useRef(null);
  const tabsRef = useRef([]);
  const toolbarRef = useRef(null);
  const contentRef = useRef(null);

  // Check if user is authenticated and authorized
  useEffect(() => {
    const checkAuth = async () => {
      // Check if auth is disabled for testing
      const disableAuth = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';
      
      if (disableAuth) {
        console.log('🚧 Auth disabled - allowing access to admin');
        setIsAdmin(true);
        setAuthLoading(false);
        return;
      }

      // Redirect to login if no user
      if (!user) {
        router.push('/login');
        return;
      }

      // Check if user is in admins table
      if (supabase && user.email) {
        try {
          const { data, error } = await supabase
            .from('admins')
            .select('email')
            .eq('email', user.email)
            .single();

          if (error || !data) {
            setIsAdmin(false);
          } else {
            setIsAdmin(true);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      }

      setAuthLoading(false);
    };

    checkAuth();
  }, [user, router]);

  // Animate page load
  useEffect(() => {
    if (typeof window !== "undefined") {
      gsap.from(bgRef.current, { opacity: 0, duration: 1.2, ease: "power2.out" });
      gsap.from(headerRef.current, { opacity: 0, y: -50, duration: 1, ease: "power3.out" });
      gsap.from(tabsRef.current, {
        opacity: 0,
        y: 30,
        stagger: 0.1,
        delay: 0.5,
        duration: 0.8,
        ease: "power2.out",
      });
      gsap.from(toolbarRef.current, {
        opacity: 0,
        y: 40,
        delay: 1,
        duration: 0.8,
        ease: "power2.out",
      });
    }
  }, []);

  // Animate tab content switch
  useEffect(() => {
    if (typeof window !== "undefined" && contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, scale: 0.97, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );
    }
  }, [tab]);

  // Scroll-trigger reveals
  const revealCards = (selector) => {
    if (typeof window !== "undefined") {
      gsap.utils.toArray(selector).forEach((el) => {
        gsap.from(el, {
          scrollTrigger: { trigger: el, start: "top 85%" },
          opacity: 0,
          y: 40,
          duration: 0.8,
          ease: "power3.out",
        });
      });
      ScrollTrigger.refresh();
    }
  };
  useEffect(() => {
    revealCards(".card");
  }, [tab]);

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

  // KPI counter animation
  useEffect(() => {
    if (typeof window !== "undefined" && tab === "Analytics") {
      document.querySelectorAll("[data-kpi]").forEach((el) => {
        const value = parseInt(el.dataset.kpi.replace(/[^0-9]/g, ""));
        gsap.fromTo(
          el,
          { innerText: 0 },
          {
            innerText: value,
            duration: 1.2,
            snap: { innerText: 1 },
            ease: "power1.out",
            onUpdate: function () {
              el.innerText = Math.floor(el.innerText);
            },
          }
        );
      });
    }
  }, [tab]);

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fff3ea] via-white to-[#fff6fb]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff6fb3] mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authorization...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized message if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fff3ea] via-white to-[#fff6fb]">
        <div className="max-w-md mx-auto text-center px-6">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-red-200">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-3xl font-bold text-red-600 mb-4">Not Authorized</h1>
            <p className="text-gray-600 mb-6">
              You don't have permission to access this page. Please contact an administrator if you believe this is an error.
            </p>
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Logged in as: {user?.email}</p>
              <a
                href="/"
                className="inline-block bg-[#ff6fb3] text-white px-6 py-3 rounded-lg hover:bg-[#ff58a8] transition-colors font-medium"
              >
                Go to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white relative overflow-hidden">
      {/* Parallax BG */}
      <div
        ref={bgRef}
        className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_50%_at_15%_5%,#fff3ea_0%,transparent_60%),radial-gradient(60%_60%_at_100%_0%,#fff6fb_0%,transparent_60%)]"
      />

      <section className="relative z-10 max-w-6xl mx-auto px-6 py-10 md:py-14">
        {/* Header */}
        <header ref={headerRef} className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-[#ff7a4a]">Tapify Command Center</h1>
            <p className="text-sm text-gray-500 mt-1">
              Admin dashboard • Manage vendors, retailers, analytics & more
            </p>
          </div>
          <span className="inline-flex items-center rounded-full border border-gray-200 bg-white/90 px-3 py-1 text-xs font-medium text-gray-700">
            v1.1
          </span>
        </header>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2 mb-5">
          {TABS.map((t, i) => {
            const active = tab === t;
            return (
              <button
                key={t}
                ref={(el) => (tabsRef.current[i] = el)}
                onClick={() => setTab(t)}
                className={[
                  "rounded-xl px-3.5 py-2 text-sm transition transform hover:scale-105",
                  active
                    ? "bg-[#111827] text-white border border-[#111827]"
                    : "text-[#111827] hover:bg-gray-100 border border-transparent",
                ].join(" ")}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <div ref={toolbarRef} className="flex flex-wrap items-center gap-3 mb-6">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${tab.toLowerCase()}…`}
            className="h-10 w-full md:w-72 rounded-xl border border-gray-300 bg-white px-3 outline-none focus:ring-2 focus:ring-[#ff6fb3]"
          />
          {tab === "Vendors" && (
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-10 rounded-xl border border-gray-300 bg-white px-3 outline-none focus:ring-2 focus:ring-[#ff6fb3]"
            >
              <option value="all">All platforms</option>
              <option value="shopify">Shopify</option>
              <option value="etsy">Etsy</option>
            </select>
          )}
          <button
            onClick={() => alert("Add new (stub)")}
            className="h-10 rounded-xl bg-[#ff6fb3] px-4 text-sm font-semibold text-white hover:scale-[1.05] transition"
          >
            + New
          </button>
        </div>

        {/* Content */}
        <div ref={contentRef}>
          {tab === "Vendors" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtVendors.map((v) => (
                <article
                  key={v.id}
                  className="card rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm backdrop-blur hover:shadow-lg transform hover:-translate-y-1 transition"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-base font-semibold text-[#111827]">{v.name}</h3>
                    <span
                      className={[
                        "rounded-full px-2 py-0.5 text-[10px] border",
                        v.status === "Active"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-yellow-50 text-yellow-700 border-yellow-200",
                      ].join(" ")}
                    >
                      {v.status}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">{v.email}</div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5">{v.platform}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5">Cap: {v.cap}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <a
                      href={`/vendor/${v.id}`}
                      className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-[#111827] hover:bg-gray-50"
                    >
                      View
                    </a>
                    <a
                      href={`/retailers?vendor=${v.id}`}
                      className="inline-flex items-center justify-center rounded-xl bg-[#111827] px-3 py-2 text-sm font-semibold text-white hover:scale-[1.02] transition"
                    >
                      Retailers
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}

          {tab === "Retailers" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {retailers.map((r) => (
                <article
                  key={r.id}
                  className="card rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm backdrop-blur hover:shadow-lg transform hover:-translate-y-1 transition"
                >
                  <h3 className="text-base font-semibold text-[#111827]">{r.name}</h3>
                  <div className="mt-1 text-sm text-gray-600">{r.location}</div>
                  <div className="mt-2 text-xs text-gray-600">Displays: {r.displays}</div>
                </article>
              ))}
            </div>
          )}

          {tab === "Analytics" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <KPI label="Total Scans (7d)" value="1148" />
                <KPI label="Conversions (7d)" value="124" />
                <KPI label="Total Revenue" value={formatMoney(totalRevenue)} />
                <KPI label="Top Vendor" value="Sunrise Soap Co" />
              </div>

              {/* Test Payout Button */}
              <div className="mb-4">
                <button
                  onClick={handleTestPayout}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
                >
                  Test Payout (Dwolla)
                </button>
              </div>

              {/* Payouts Table */}
              <div className="rounded-2xl border border-gray-200 bg-white/90 backdrop-blur overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-[#111827]">Recent Payouts</h3>
                </div>
                {loadingPayouts ? (
                  <div className="p-8 text-center text-gray-500">Loading payouts...</div>
                ) : payouts.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No payouts found</div>
                ) : (
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left bg-gray-50">
                          <Th>ID</Th>
                          <Th>Amount</Th>
                          <Th>Status</Th>
                          <Th>Vendor</Th>
                          <Th>Date</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {payouts.map((payout) => (
                          <tr key={payout.id} className="border-t border-gray-100 card">
                            <Td>{payout.id}</Td>
                            <Td className="font-semibold text-green-700">{formatMoney(payout.total_amount)}</Td>
                            <Td>
                              <span className={[
                                "rounded-full px-2 py-0.5 text-[10px] border",
                                payout.status === "completed"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : payout.status === "pending"
                                  ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                  : "bg-gray-50 text-gray-700 border-gray-200",
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sourcers.map((s) => (
                <article
                  key={s.id}
                  className="card rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm backdrop-blur hover:shadow-lg transform hover:-translate-y-1 transition"
                >
                  <h3 className="text-base font-semibold text-[#111827]">{s.name}</h3>
                  <div className="mt-1 text-sm text-gray-600">{s.email}</div>
                  <div className="mt-2 text-xs text-gray-600">Revenue: ${s.revenue.toLocaleString()}</div>
                </article>
              ))}
            </div>
          )}

          {tab === "UIDs" && (
            <div className="overflow-auto rounded-2xl border border-gray-200 bg-white/90 backdrop-blur">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <Th>UID</Th>
                    <Th>Business</Th>
                    <Th>Claimed</Th>
                    <Th>Scans</Th>
                  </tr>
                </thead>
                <tbody>
                  {uids
                    .filter((u) => !qlc || u.uid.toLowerCase().includes(qlc) || u.business.toLowerCase().includes(qlc))
                    .map((u) => (
                      <tr key={u.uid} className="border-t border-gray-100 card">
                        <Td>{u.uid}</Td>
                        <Td>{u.business}</Td>
                        <Td>{u.claimed ? "Yes" : "No"}</Td>
                        <Td>{u.scans}</Td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <footer className="mt-8 text-center text-sm text-gray-500">
          Tapify • Admin • {new Date().getFullYear()}
        </footer>
      </section>
    </main>
  );
}

/* ---------- small UI helpers ---------- */
function KPI({ label, value }) {
  return (
    <div
      className="card rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm backdrop-blur"
      data-kpi={value}
    >
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-[#111827]">{value}</div>
    </div>
  );
}
function Th({ children }) {
  return <th className="px-3 py-3 text-xs font-semibold text-gray-600">{children}</th>;
}
function Td({ children }) {
  return <td className="px-3 py-3 text-gray-800">{children}</td>;
}
