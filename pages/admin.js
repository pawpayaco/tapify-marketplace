// pages/admin.js
import { useMemo, useState } from "react";

const TABS = ["Vendors", "Retailers", "Analytics", "Sourcers", "UIDs"];

export default function Admin() {
  const [tab, setTab] = useState("Vendors");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  // ----- Dummy data (swap for Supabase later) -----
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

  // ----- Filters -----
  const qlc = q.trim().toLowerCase();
  const filtVendors = vendors.filter(
    (v) =>
      (!qlc || v.name.toLowerCase().includes(qlc) || v.email.toLowerCase().includes(qlc)) &&
      (filter === "all" || v.platform.toLowerCase() === filter)
  );

  return (
    <main className="min-h-screen bg-white relative overflow-hidden">
      {/* Soft radial BG like your index.html */}
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_50%_at_15%_5%,#fff3ea_0%,transparent_60%),radial-gradient(60%_60%_at_100%_0%,#fff6fb_0%,transparent_60%)]" />

      <section className="relative z-10 max-w-6xl mx-auto px-6 py-10 md:py-14">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
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
          {TABS.map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={[
                  "rounded-xl px-3.5 py-2 text-sm transition",
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
        <div className="flex flex-wrap items-center gap-3 mb-6">
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
            className="h-10 rounded-xl bg-[#ff6fb3] px-4 text-sm font-semibold text-white hover:scale-[1.02] transition"
          >
            + New
          </button>
        </div>

        {/* Content */}
        {tab === "Vendors" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtVendors.map((v) => (
              <article
                key={v.id}
                className="rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm backdrop-blur"
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
                className="rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm backdrop-blur"
              >
                <h3 className="text-base font-semibold text-[#111827]">{r.name}</h3>
                <div className="mt-1 text-sm text-gray-600">{r.location}</div>
                <div className="mt-2 text-xs text-gray-600">Displays: {r.displays}</div>
                <div className="mt-3 flex gap-2">
                  <a
                    href={`/retailer/${r.id}`}
                    className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-[#111827] hover:bg-gray-50"
                  >
                    View
                  </a>
                  <a
                    href={`/retailer/${r.id}/rotate`}
                    className="inline-flex items-center justify-center rounded-xl bg-[#111827] px-3 py-2 text-sm font-semibold text-white hover:scale-[1.02] transition"
                  >
                    Rotation
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === "Analytics" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <KPI label="Total Scans (7d)" value="1,148" />
              <KPI label="Conversions (7d)" value="124" />
              <KPI label="Est. Revenue (7d)" value="$8,920" />
              <KPI label="Top Vendor" value="Sunrise Soap Co" />
            </div>

            <div className="overflow-auto rounded-2xl border border-gray-200 bg-white/90 backdrop-blur">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <Th>Vendor</Th>
                    <Th>UID</Th>
                    <Th>Scans</Th>
                    <Th>Conversions</Th>
                    <Th>Revenue</Th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { vendor: "Sunrise Soap Co", uid: "AAA111", scans: 92, conv: 16, rev: 620 },
                    { vendor: "Moonbeam Ceramics", uid: "BBB222", scans: 11, conv: 1, rev: 55 },
                    { vendor: "Cedar & Sage", uid: "CCC333", scans: 37, conv: 6, rev: 220 },
                  ].map((row, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <Td>{row.vendor}</Td>
                      <Td>{row.uid}</Td>
                      <Td>{row.scans}</Td>
                      <Td>{row.conv}</Td>
                      <Td>${row.rev.toLocaleString()}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "Sourcers" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sourcers.map((s) => (
              <article
                key={s.id}
                className="rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm backdrop-blur"
              >
                <h3 className="text-base font-semibold text-[#111827]">{s.name}</h3>
                <div className="mt-1 text-sm text-gray-600">{s.email}</div>
                <div className="mt-2 text-xs text-gray-600">Revenue: ${s.revenue.toLocaleString()}</div>
                <div className="mt-3 flex gap-2">
                  <a
                    href={`/sourcer/${s.id}`}
                    className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-[#111827] hover:bg-gray-50"
                  >
                    Profile
                  </a>
                  <a
                    href={`/leaderboard`}
                    className="inline-flex items-center justify-center rounded-xl bg-[#111827] px-3 py-2 text-sm font-semibold text-white hover:scale-[1.02] transition"
                  >
                    Leaderboard
                  </a>
                </div>
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
                    <tr key={u.uid} className="border-t border-gray-100">
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
    <div className="rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm backdrop-blur">
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
