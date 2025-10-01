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
      // Mark business as connected
      const { error: bizError } = await supabase
        .from("businesses")
        .update({ is_connected: true })
        .eq("id", bizId);

      if (bizError) throw bizError;

      // Link UID → business
      const { error: uidError } = await supabase
        .from("uids")
        .update({ business_id: bizId })
        .eq("uid", uid);

      if (uidError) throw uidError;

      setConnectedId(bizId);
    } catch (err) {
      setError(err.message || "Error connecting business.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-12 bg-white">
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
            className="w-full px-5 py-2.5 
             rounded-full 
             bg-gray-100 
             text-gray-900 placeholder-gray-500
             border border-gray-200
             focus:outline-none focus:ring-0 focus:border-gray-300
             transition"
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
                className="flex justify-between items-center bg-white rounded-2xl shadow-md border border-gray-100 p-5 hover:shadow-lg transition-all"
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
                  className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${
                    biz.is_connected || connectedId === biz.id
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white shadow hover:shadow-lg hover:scale-105 active:scale-95"
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
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center text-gray-500">
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
  );
}
