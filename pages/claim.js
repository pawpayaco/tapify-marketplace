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
    if (u) setUid(u);

    // Fetch retailers
    const fetchRetailers = async () => {
      try {
        const response = await fetch('/api/retailers/ready-for-claim');
        const data = await response.json();
        setRetailers(data.results || []);
      } catch (err) {
        setError('Could not load stores. Please try again.');
      }
    };

    fetchRetailers();
  }, []);

  const handleClaim = async (retailerId) => {
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

      if (response.status === 409) {
        setError(`This display is already claimed. Please contact support if you believe this is an error.`);
        setLoadingId(null);
        return;
      }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to claim display');
      }

      // Success! Redirect to success page
      router.push('/claimed');

    } catch (err) {
      setError(err.message || "Error claiming display. Please try again.");
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
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-12 sm:pb-16">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block p-3 bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] rounded-[23px] mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Claim Your Display
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Select your business below to activate your NFC display and start earning commissions
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for your business..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-6 py-4 pl-14 text-lg rounded-[23px] border-2 border-gray-200 focus:border-[#ff7a4a] focus:ring-4 focus:ring-orange-100 outline-none transition-all shadow-sm"
            />
            <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border-2 border-red-200 rounded-[23px]">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Retailers List */}
        <div className="space-y-4">
          {filteredRetailers.length === 0 && !error && (
            <div className="p-12 text-center bg-white border-2 border-gray-200 rounded-[23px] shadow-sm">
              <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="text-xl text-gray-500 font-medium">No stores found</p>
              <p className="text-sm text-gray-400 mt-2">Try adjusting your search</p>
            </div>
          )}

          {filteredRetailers.map((store) => (
            <div
              key={store.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-white border-2 border-gray-200 rounded-[23px] hover:border-[#ff7a4a] hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-100 to-pink-100 rounded-[23px] flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#ff7a4a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xl text-gray-900 mb-1">{store.name}</h3>
                  {store.address && (
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {store.address}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleClaim(store.id)}
                disabled={loadingId === store.id}
                className={`
                  w-full sm:w-auto px-8 py-3 rounded-[15px] font-bold text-white transition-all shadow-md
                  ${loadingId === store.id
                    ? 'bg-gray-400 cursor-wait'
                    : 'bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] hover:shadow-xl hover:scale-105 active:scale-95'
                  }
                `}
              >
                {loadingId === store.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Claiming...
                  </span>
                ) : (
                  'Claim Display'
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Info Footer */}
        {filteredRetailers.length > 0 && (
          <div className="mt-12 p-6 bg-orange-50 border-2 border-orange-200 rounded-[23px]">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-[#ff7a4a] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-orange-900">
                <p className="font-bold mb-1">What happens next?</p>
                <ul className="space-y-1 text-orange-800">
                  <li>• Your display will be activated and ready to use</li>
                  <li>• You'll receive a unique affiliate link for your business</li>
                  <li>• Start earning commissions on every sale through your display</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
