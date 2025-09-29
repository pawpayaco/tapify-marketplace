// pages/admin.js
import { useMemo, useState } from "react";

const S = {
  page: {
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, 'Helvetica Neue', Arial",
    minHeight: "100vh",
    background: "linear-gradient(180deg,#fff 0%,#fafafa 100%)",
    color: "#111827",
  },
  container: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "28px 20px 60px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  h1: { fontSize: 28, margin: 0 },
  badge: {
    fontSize: 12,
    background: "#EEF2FF",
    color: "#374151",
    padding: "6px 10px",
    borderRadius: 999,
    marginLeft: 10,
  },
  tabs: {
    display: "flex",
    gap: 8,
    borderBottom: "1px solid #E5E7EB",
    paddingBottom: 6,
    marginBottom: 18,
    flexWrap: "wrap",
  },
  tab: (active) => ({
    padding: "8px 12px",
    borderRadius: 10,
    fontSize: 14,
    background: active ? "#111827" : "transparent",
    color: active ? "white" : "#111827",
    border: active ? "1px solid #111827" : "1px solid transparent",
    cursor: "pointer",
  }),
  toolbar: {
    display: "flex",
    gap: 8,
    margin: "6px 0 18px",
    flexWrap: "wrap",
  },
  input: {
    height: 36,
    padding: "0 12px",
    border: "1px solid #E5E7EB",
    borderRadius: 10,
    outline: "none",
  },
  select: {
    height: 36,
    padding: "0 10px",
    border: "1px solid #E5E7EB",
    borderRadius: 10,
    outline: "none",
    background: "white",
  },
  btn: {
    height: 36,
    padding: "0 12px",
    borderRadius: 10,
    border: "1px solid #111827",
    background: "#111827",
    color: "white",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 12,
  },
  card: {
    background: "white",
    border: "1px solid #E5E7EB",
    borderRadius: 14,
    padding: 16,
    display: "grid",
    gap: 8,
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  cardTitle: { margin: 0, fontSize: 16 },
  statRow: { display: "flex", gap: 8, color: "#6B7280", fontSize: 13, flexWrap: "wrap" },
  kpiWrap: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
    marginBottom: 12,
  },
  kpi: {
    background: "white",
    border: "1px solid #E5E7EB",
    borderRadius: 14,
    padding: 14,
  },
  kpiLabel: { color: "#6B7280", fontSize: 12, marginBottom: 4 },
  kpiValue: { fontSize: 20, fontWeight: 600 },
  tableWrap: {
    overflow: "auto",
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    background: "white",
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  thtd: { borderBottom: "1px solid #F3F4F6", padding: "10px 12px", textAlign: "left" },
  footer: { marginTop: 26, color: "#6B7280", fontSize: 13, textAlign: "center" },
};

const TABS = ["Vendors", "Retailers", "Analytics", "Sourcers", "UIDs"];

export default function Admin() {
  const [tab, setTab] = useState("Vendors");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  // Dummy data (swap these for Supabase queries later)
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

  // Simple filters
  const qlc = q.trim().toLowerCase();
  const filtVendors = vendors.filter(
    (v) =>
      (!qlc || v.name.toLowerCase().includes(qlc) || v.email.toLowerCase().includes(qlc)) &&
      (filter === "all" || v.platform.toLowerCase() === filter)
  );

  return (
    <div style={S.page}>
      <div style={S.container}>
        <header style={S.header}>
          <h1 style={S.h1}>Tapify Command Center</h1>
          <div style={S.badge}>v1.1</div>
        </header>

        {/* Tabs */}
        <div style={S.tabs}>
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} style={S.tab(tab === t)}>
              {t}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div style={S.toolbar}>
          <input
            style={S.input}
            placeholder={`Search ${tab.toLowerCase()}…`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {tab === "Vendors" && (
            <select style={S.select} value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All platforms</option>
              <option value="shopify">Shopify</option>
              <option value="etsy">Etsy</option>
            </select>
          )}
          <button style={S.btn} onClick={() => alert("Add new (stub)")}>
            + New
          </button>
        </div>

        {/* Content */}
        {tab === "Vendors" && (
          <>
            <div style={S.grid}>
              {filtVendors.map((v) => (
                <article key={v.id} style={S.card}>
                  <h3 style={S.cardTitle}>{v.name}</h3>
                  <div style={S.statRow}>
                    <span>{v.platform}</span>·<span>Cap: {v.cap}</span>·<span>Status: {v.status}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    <a href={`/vendor/${v.id}`} style={{ ...S.btn, background: "#fff", color: "#111827" }}>
                      View
                    </a>
                    <a href={`/retailers?vendor=${v.id}`} style={{ ...S.btn, background: "#111827" }}>
                      Retailers
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {tab === "Retailers" && (
          <div style={S.grid}>
            {retailers.map((r) => (
              <article key={r.id} style={S.card}>
                <h3 style={S.cardTitle}>{r.name}</h3>
                <div style={S.statRow}>
                  <span>{r.location}</span>·<span>Displays: {r.displays}</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <a href={`/retailer/${r.id}`} style={{ ...S.btn, background: "#fff", color: "#111827" }}>
                    View
                  </a>
                  <a href={`/retailer/${r.id}/rotate`} style={{ ...S.btn, background: "#111827" }}>
                    Rotation
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === "Analytics" && (
          <>
            <div style={S.kpiWrap}>
              <div style={S.kpi}>
                <div style={S.kpiLabel}>Total Scans (7d)</div>
                <div style={S.kpiValue}>1,148</div>
              </div>
              <div style={S.kpi}>
                <div style={S.kpiLabel}>Conversions (7d)</div>
                <div style={S.kpiValue}>124</div>
              </div>
              <div style={S.kpi}>
                <div style={S.kpiLabel}>Est. Revenue (7d)</div>
                <div style={S.kpiValue}>$8,920</div>
              </div>
              <div style={S.kpi}>
                <div style={S.kpiLabel}>Top Vendor</div>
                <div style={S.kpiValue}>Sunrise Soap Co</div>
              </div>
            </div>

            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.thtd}>Vendor</th>
                    <th style={S.thtd}>UID</th>
                    <th style={S.thtd}>Scans</th>
                    <th style={S.thtd}>Conversions</th>
                    <th style={S.thtd}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { vendor: "Sunrise Soap Co", uid: "AAA111", scans: 92, conv: 16, rev: 620 },
                    { vendor: "Moonbeam Ceramics", uid: "BBB222", scans: 11, conv: 1, rev: 55 },
                    { vendor: "Cedar & Sage", uid: "CCC333", scans: 37, conv: 6, rev: 220 },
                  ].map((row, i) => (
                    <tr key={i}>
                      <td style={S.thtd}>{row.vendor}</td>
                      <td style={S.thtd}>{row.uid}</td>
                      <td style={S.thtd}>{row.scans}</td>
                      <td style={S.thtd}>{row.conv}</td>
                      <td style={S.thtd}>${row.rev.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "Sourcers" && (
          <div style={S.grid}>
            {sourcers.map((s) => (
              <article key={s.id} style={S.card}>
                <h3 style={S.cardTitle}>{s.name}</h3>
                <div style={S.statRow}>
                  <span>{s.email}</span>·<span>Revenue: ${s.revenue.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <a href={`/sourcer/${s.id}`} style={{ ...S.btn, background: "#fff", color: "#111827" }}>
                    Profile
                  </a>
                  <a href={`/leaderboard`} style={{ ...S.btn, background: "#111827" }}>
                    Leaderboard
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === "UIDs" && (
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.thtd}>UID</th>
                  <th style={S.thtd}>Business</th>
                  <th style={S.thtd}>Claimed</th>
                  <th style={S.thtd}>Scans</th>
                </tr>
              </thead>
              <tbody>
                {uids
                  .filter((u) => !q || u.uid.toLowerCase().includes(qlc) || u.business.toLowerCase().includes(qlc))
                  .map((u) => (
                    <tr key={u.uid}>
                      <td style={S.thtd}>{u.uid}</td>
                      <td style={S.thtd}>{u.business}</td>
                      <td style={S.thtd}>{u.claimed ? "Yes" : "No"}</td>
                      <td style={S.thtd}>{u.scans}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={S.footer}>Tapify • Admin • {new Date().getFullYear()}</div>
      </div>
    </div>
  );
}
