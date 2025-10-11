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
    console.log('🚀 [CLAIM] ========== CLAIM BUTTON CLICKED! ==========');
    console.log('🚀 [CLAIM] Timestamp:', new Date().toISOString());
    console.log('🚀 [CLAIM] UID:', uid);
    console.log('🚀 [CLAIM] Retailer ID:', retailerId);
    console.log('🚀 [CLAIM] Current loadingId:', loadingId);

    if (!uid) {
      console.error('❌ [CLAIM] ERROR: No UID in URL');
      setError("No UID in URL. Please scan your NFC tag again.");
      return;
    }

    console.log('⏳ [CLAIM] Setting loadingId to:', retailerId);
    setLoadingId(retailerId);
    setError("");

    try {
      const requestBody = { uid, retailerId };
      console.log('📤 [CLAIM] Sending request to /api/claim-display');
      console.log('📤 [CLAIM] Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('/api/claim-display', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 [CLAIM] Response status:', response.status);
      console.log('📥 [CLAIM] Response headers:', Object.fromEntries(response.headers.entries()));

      const result = await response.json();
      console.log('📥 [CLAIM] Response body:', JSON.stringify(result, null, 2));

      if (response.status === 409) {
        console.warn('⚠️  [CLAIM] UID already claimed!');
        setError(`This UID is already claimed. Please use a different UID.`);
        setLoadingId(null);
        return;
      }

      if (!response.ok) {
        console.error('❌ [CLAIM] Request failed with status:', response.status);
        throw new Error(result.error || 'Failed to claim display');
      }

      // SUCCESS!
      console.log('✅ [CLAIM] SUCCESS! Display claimed successfully!');
      console.log('✅ [CLAIM] Affiliate URL:', result.affiliate_url);
      console.log('✅ [CLAIM] Retailer:', result.retailer_name);
      console.log('🔄 [CLAIM] Redirecting to /claimed...');

      // Immediate redirect
      router.push('/claimed');

    } catch (err) {
      console.error('💥 [CLAIM] Exception caught:', err);
      console.error('💥 [CLAIM] Error message:', err.message);
      console.error('💥 [CLAIM] Error stack:', err.stack);
      setError(err.message || "Error claiming display.");
      setLoadingId(null);
    }
    console.log('🏁 [CLAIM] ========== CLAIM FLOW COMPLETE ==========');
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
          <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-400 rounded-lg text-sm space-y-1">
            <p className="font-bold text-lg">🔍 Debug Info:</p>
            <p>✅ UID: <span className="font-mono font-bold">{uid}</span></p>
            <p>✅ Stores loaded: <span className="font-bold">{retailers.length}</span></p>
            <p>✅ Filtered stores: <span className="font-bold">{filteredRetailers.length}</span></p>
            <p>⏳ Loading ID: <span className="font-bold">{loadingId || 'None'}</span></p>
            <p className="text-xs text-gray-600 mt-2">
              Open browser console (F12) to see detailed logs when you click a button
            </p>
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
                onClick={(e) => {
                  console.log('🖱️  [CLAIM] BUTTON CLICK EVENT FIRED!', {
                    storeId: store.id,
                    storeName: store.name,
                    event: e.type,
                    timestamp: new Date().toISOString()
                  });
                  handleClaim(store.id);
                }}
                onMouseDown={() => console.log('👆 [CLAIM] Mouse down on button:', store.id)}
                onMouseUp={() => console.log('👆 [CLAIM] Mouse up on button:', store.id)}
                disabled={loadingId === store.id}
                className={`
                  px-6 py-3 rounded-xl font-bold text-white transition-all
                  ${loadingId === store.id
                    ? 'bg-gray-400 cursor-wait'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 active:scale-95'
                  }
                `}
                style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
              >
                {loadingId === store.id ? '⏳ Claiming...' : 'Claim Display'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
