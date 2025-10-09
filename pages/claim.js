"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";

export default function ConnectPage() {
  const router = useRouter();
  const [uid, setUid] = useState("");
  const [retailers, setRetailers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [connectedId, setConnectedId] = useState(null);
  const [error, setError] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Ensure page loads at top
    window.scrollTo(0, 0);
    
    // Get UID from URL (?u=xxxx)
    const params = new URLSearchParams(window.location.search);
    const u = params.get("u");
    if (u) setUid(u);

    const fetchRetailers = async () => {
      try {
        setLoadingList(true);
        setError("");

        const response = await fetch('/api/retailers/ready-for-claim');
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load stores');
        }

        setRetailers(payload?.results || []);
      } catch (err) {
        console.error('[claim] Failed to load retailers:', err);
        setError(err.message || 'Could not load stores.');
      } finally {
        setLoadingList(false);
      }
    };

    fetchRetailers();
  }, []);

  const filteredRetailers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return retailers;

    return retailers.filter(retailer => {
      const composite = [retailer.name, retailer.address, retailer.displayLocation]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return composite.includes(term);
    });
  }, [retailers, search]);

  const shippingBadge = (status) => {
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

  const handleConnect = async (retailerId) => {
    console.log('[CLAIM] ========== CONNECT FLOW START ==========');
    console.log('[CLAIM] UID:', uid);
    console.log('[CLAIM] Retailer ID:', retailerId);

    if (!uid) {
      console.error('[CLAIM] ERROR: No UID in URL');
      setError("No UID detected in URL.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const requestBody = { uid, retailerId };
      console.log('[CLAIM] Request body:', requestBody);
      console.log('[CLAIM] Sending POST to /api/claim-display');

      const response = await fetch('/api/claim-display', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('[CLAIM] Response status:', response.status);
      console.log('[CLAIM] Response headers:', Object.fromEntries(response.headers.entries()));

      let result = null;
      const raw = await response.text();
      console.log('[CLAIM] Raw response:', raw);

      if (raw) {
        try {
          result = JSON.parse(raw);
          console.log('[CLAIM] Parsed response:', result);
        } catch (parseError) {
          console.error('[CLAIM] Failed to parse JSON response:', parseError);
          console.error('[CLAIM] Raw response was:', raw);
        }
      }

      if (!response.ok) {
        const message = result?.error || `Failed to claim display (status ${response.status}).`;
        console.error('[CLAIM] Request failed:', message);
        console.error('[CLAIM] Full error details:', result);
        throw new Error(message);
      }

      console.log('[CLAIM] SUCCESS: Display claimed successfully');
      setConnectedId(retailerId);
      setShowSuccess(true);

      // Redirect to claimed page after animation
      setTimeout(() => {
        router.push('/claimed');
      }, 1500);
    } catch (err) {
      console.error('[CLAIM] Exception caught:', err);
      setError(err.message || "Error connecting business.");
      setLoading(false);
    }
    console.log('[CLAIM] ========== CONNECT FLOW END ==========');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Soft background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFF3E8] to-transparent h-[400px] pointer-events-none"></div>

      <div className="flex flex-col items-center px-6 pt-28 md:pt-32 pb-12 relative">
        <div className="max-w-lg w-full">
          {/* Header */}
          <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Connect your Display
          </h1>
          <p className="text-gray-600">
            select your business below<br />to automatically start earning!
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search your business name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3
             rounded-2xl
             bg-white
             text-gray-900 placeholder-gray-400
             border-2 border-gray-200
             outline-none focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent
             transition-all"
          />
        </div>

        {/* Business List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredRetailers.map((store) => {
              const badge = shippingBadge(store.shippingStatus);
              const isSuccess = connectedId === store.id && showSuccess;

              return (
                <motion.div
                  key={store.id}
                  layout
                  initial={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.4 } }}
                  className="flex justify-between items-center bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-5 hover:shadow-2xl transition-all"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{store.name}</p>
                    {store.address && (
                      <p className="text-sm text-gray-500 truncate max-w-[240px]">
                        {store.address}
                      </p>
                    )}
                    <div className={`inline-flex items-center px-3 py-1 mt-2 rounded-full text-xs font-bold ${badge.tone}`}>
                      {badge.label}
                    </div>
                  </div>
                  <button
                    disabled={loading || connectedId === store.id}
                    onClick={() => handleConnect(store.id)}
                    className={`px-5 py-2.5 rounded-2xl font-bold text-sm transition-all ${
                      connectedId === store.id
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                    }`}
                  >
                    {loading && connectedId === store.id ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Claiming...
                      </div>
                    ) : connectedId === store.id ? (
                      "✅ Claimed"
                    ) : (
                      "Claim Display"
                    )}
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Empty state */}
          {!loadingList && filteredRetailers.length === 0 && (
            <div className="bg-white rounded-3xl border-2 border-gray-200 shadow-xl p-6 text-center text-gray-500">
              No stores ready for claim yet.
            </div>
          )}
          {loadingList && (
            <div className="bg-white rounded-3xl border-2 border-gray-200 shadow-xl p-6 text-center text-gray-500 flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent"></div>
              Loading stores…
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="mt-6 text-center text-sm text-red-600 font-medium">
            {error}
          </p>
        )}
        </div>
      </div>
    </div>
  );
}
