"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function ConnectPage() {
  const [uid, setUid] = useState("");
  const [businesses, setBusinesses] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [connectedId, setConnectedId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Ensure page loads at top
    window.scrollTo(0, 0);
    
    // Get UID from URL (?u=xxxx)
    const params = new URLSearchParams(window.location.search);
    const u = params.get("u");
    if (u) setUid(u);

    // Load businesses
    const fetchBusinesses = async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, is_connected, created_at")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching businesses:", error.message);
        setError("Could not load businesses.");
      } else {
        setBusinesses(data || []);
      }
    };
    fetchBusinesses();
  }, []);

  const handleConnect = async (bizId) => {
    if (!uid) {
      setError("No UID detected in URL.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const response = await fetch('/api/claim-uid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, businessId: bizId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || 'Failed to claim display.');
      }

      setConnectedId(bizId);
      setBusinesses(prev => prev.map(biz => biz.id === bizId ? { ...biz, is_connected: true } : biz));
    } catch (err) {
      setError(err.message || "Error connecting business.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#faf8f3' }}>
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
          {businesses
            .filter((b) =>
              b.name.toLowerCase().includes(search.toLowerCase())
            )
            .map((biz, idx) => (
              <div
                key={biz.id}
                className="flex justify-between items-center bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-5 hover:shadow-2xl transition-all"
              >
                <div>
                  <p className="font-semibold text-gray-900">{biz.name}</p>
                  <p className="text-sm text-gray-500">
                    ID: b-{idx + 1001}
                  </p>
                </div>
                <button
                  disabled={biz.is_connected || loading || connectedId === biz.id}
                  onClick={() => handleConnect(biz.id)}
                  className={`px-5 py-2.5 rounded-2xl font-bold text-sm transition-all ${
                    biz.is_connected || connectedId === biz.id
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                  }`}
                >
                  {connectedId === biz.id
                    ? "✅ Connected"
                    : biz.is_connected
                    ? "Unavailable"
                    : "Connect"}
                </button>
              </div>
            ))}

          {/* Empty state */}
          {businesses.filter((b) =>
            b.name.toLowerCase().includes(search.toLowerCase())
          ).length === 0 && (
            <div className="bg-white rounded-3xl border-2 border-gray-200 shadow-xl p-6 text-center text-gray-500">
              No results found.
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
