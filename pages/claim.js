"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function ClaimPage() {
  const router = useRouter();
  const [uid, setUid] = useState("");
  const [retailers, setRetailers] = useState([]);
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Get UID from URL
    const params = new URLSearchParams(window.location.search);
    const u = params.get("u");
    console.log('[CLAIM] Page loaded, UID from URL:', u);
    if (u) setUid(u);

    // Fetch retailers
    const fetchRetailers = async () => {
      try {
        console.log('[CLAIM] Fetching retailers...');
        const response = await fetch('/api/retailers/ready-for-claim');
        const data = await response.json();
        console.log('[CLAIM] Retailers loaded:', data.results?.length || 0);
        setRetailers(data.results || []);
      } catch (err) {
        console.error('[CLAIM] Failed to load retailers:', err);
        setError('Could not load stores.');
      }
    };

    fetchRetailers();
  }, []);

  const handleClaim = async (retailerId) => {
    console.log('[CLAIM] ========== CLAIM BUTTON CLICKED! ==========');
    console.log('[CLAIM] UID:', uid);
    console.log('[CLAIM] Retailer ID:', retailerId);

    if (!uid) {
      setError("No UID in URL. Please scan your NFC tag again.");
      return;
    }

    setLoadingId(retailerId);
    setError("");

    try {
      const response = await fetch('/api/claim-display', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, retailerId }),
      });

      const result = await response.json();
      console.log('[CLAIM] Response:', response.status, result);

      if (response.status === 409) {
        // UID already claimed
        setError(`This UID is already claimed by another store. Please contact support if this is incorrect.`);
        setLoadingId(null);
        return;
      }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to claim display');
      }

      // SUCCESS!
      console.log('[CLAIM] ✅ SUCCESS! Redirecting to success page...');

      // Immediate redirect - no animation delays
      router.push('/claimed');

    } catch (err) {
      console.error('[CLAIM] Error:', err);
      setError(err.message || "Error claiming display.");
      setLoadingId(null);
    }
  };

  // Filter retailers based on search
  const filteredRetailers = retailers.filter(retailer => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      retailer.name?.toLowerCase().includes(term) ||
      retailer.address?.toLowerCase().includes(term) ||
      retailer.displayLocation?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-white pt-32 pb-16">
      <div className="max-w-2xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Claim Your Display
          </h1>
          <p className="text-lg text-gray-600">
            Select your business below to start earning commissions
          </p>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search for your business..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 mb-6 rounded-xl border-2 border-gray-300 focus:border-blue-500 outline-none transition-colors"
        />

        {/* Debug Info */}
        {uid && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <p><strong>Debug:</strong></p>
            <p>UID: {uid}</p>
            <p>Stores loaded: {retailers.length}</p>
            <p>Loading: {loadingId || 'None'}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Retailers List */}
        <div className="space-y-3">
          {filteredRetailers.length === 0 && (
            <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
              No stores found
            </div>
          )}

          {filteredRetailers.map((store) => (
            <div
              key={store.id}
              className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 transition-colors"
            >
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900">{store.name}</h3>
                {store.address && (
                  <p className="text-sm text-gray-600">{store.address}</p>
                )}
              </div>

              <button
                onClick={() => {
                  console.log('[CLAIM] Button onClick fired for:', store.id);
                  handleClaim(store.id);
                }}
                disabled={loadingId === store.id}
                className={`
                  px-6 py-3 rounded-xl font-bold text-white transition-all
                  ${loadingId === store.id
                    ? 'bg-gray-400 cursor-wait'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 active:scale-95'
                  }
                `}
                style={{ pointerEvents: 'auto' }}
              >
                {loadingId === store.id ? 'Claiming...' : 'Claim Display'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
