// Design direction preview — not wired to anything. Uses the real data shapes
// and real current values from the database so the numbers land honestly.
// If this direction is approved, it gets ported onto /onboard/dashboard.

import Head from 'next/head';
import { useState } from 'react';

const SCANS = [
  { time: '1:21:41 PM', uid: 'Q4D06E86A6E', place: 'Madison, WI', converted: false, revenue: null },
  { time: '1:19:50 PM', uid: 'Q4D06E86A6E', place: 'Madison, WI', converted: true,  revenue: 41.15 },
  { time: '1:18:31 PM', uid: 'Q4D06E86A6E', place: 'Madison, WI', converted: false, revenue: null },
  { time: '1:17:00 PM', uid: 'Q4D06E86A6E', place: 'Madison, WI', converted: false, revenue: null },
];

const money = (n) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export default function DesignPreview() {
  const [tab, setTab] = useState('activity');

  return (
    <div className="t-page" style={{ minHeight: '100vh' }}>
      <Head><title>Tapify · design preview</title></Head>

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 32px' }}>

        {/* Header — no card, no gradient, no shadow. Just type and space. */}
        <header style={{ padding: '72px 0 40px' }}>
          <p style={{ fontSize: 13, color: 'var(--pewter)', margin: 0 }}>Test Self-Wash Co</p>
          <h1 style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em', margin: '8px 0 0' }}>
            Your displays
          </h1>
        </header>

        {/* The spec sheet. Tesla puts 358mi / 200mph / 3.1s here. You put this.
            Exactly one number carries the gradient. */}
        <section className="t-spec">
          <div className="t-spec__cell">
            <div className="t-spec__value">3</div>
            <div className="t-spec__label">Taps this week</div>
          </div>
          <div className="t-spec__cell">
            <div className="t-spec__value t-spec__value--brand">{money(41.15)}</div>
            <div className="t-spec__label">Earned this month</div>
          </div>
          <div className="t-spec__cell">
            <div className="t-spec__value">1</div>
            <div className="t-spec__label">Display live</div>
          </div>
          <div className="t-spec__cell">
            <div className="t-spec__value">33<span style={{ fontSize: 24, color: 'var(--pewter)' }}>%</span></div>
            <div className="t-spec__label">Taps that bought</div>
          </div>
        </section>

        {/* Payout — the one thing a store owner actually opens this to see. */}
        <section className="t-section" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
          <div>
            <div className="t-section__title">Waiting to be paid</div>
            <p className="t-section__note">Deposited to Chase ••••1141 every Friday.</p>
            <div style={{ fontSize: 56, fontWeight: 500, letterSpacing: '-0.03em', marginTop: 20, fontVariantNumeric: 'tabular-nums' }}>
              {money(12.34)}
            </div>
          </div>
          <button className="t-btn t-btn--secondary">View payout history</button>
        </section>

        {/* Telemetry. Every row is a person who touched a phone to your display. */}
        <section className="t-section">
          <div className="t-tabs" style={{ marginBottom: 32 }}>
            {['activity', 'orders', 'settings'].map((t) => (
              <button key={t} className="t-tab" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
                {t === 'activity' ? 'Activity' : t === 'orders' ? 'Orders' : 'Settings'}
              </button>
            ))}
          </div>

          <table className="t-feed">
            <thead>
              <tr>
                <th style={{ width: 120 }}>Time</th>
                <th style={{ width: 180 }}>Display</th>
                <th>Where</th>
                <th style={{ width: 140 }}>Result</th>
                <th style={{ width: 100, textAlign: 'right' }}>You earned</th>
              </tr>
            </thead>
            <tbody>
              {SCANS.map((s, i) => (
                <tr key={i}>
                  <td className="t-mono" style={{ color: 'var(--pewter)' }}>{s.time}</td>
                  <td className="t-mono">{s.uid}</td>
                  <td style={{ color: 'var(--graphite)' }}>{s.place}</td>
                  <td>
                    <span className={`t-status ${s.converted ? 't-status--ok' : 't-status--idle'}`}>
                      {s.converted ? 'Bought' : 'Browsed'}
                    </span>
                  </td>
                  <td className="t-mono" style={{ textAlign: 'right', color: s.revenue ? 'var(--ink)' : 'var(--fog)' }}>
                    {s.revenue ? money(s.revenue * 0.3) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Bank — status is a dot and a word, not a green card. */}
        <section className="t-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
          <div>
            <div className="t-section__title">
              Chase <span className="t-mono" style={{ color: 'var(--pewter)', fontSize: 16 }}>••••1141</span>
            </div>
            <p className="t-section__note">
              Total Checking · <span className="t-status t-status--ok">Ready for payouts</span>
            </p>
          </div>
          <button className="t-btn t-btn--quiet">Remove bank</button>
        </section>

        {/* Empty state as an invitation, per the copy rules. Single primary action. */}
        <section className="t-section" style={{ paddingBottom: 96 }}>
          <div className="t-section__title">Add another display</div>
          <p className="t-section__note" style={{ maxWidth: 460 }}>
            More displays, more taps. We print and ship it free — you place it near the register.
          </p>
          <button className="t-btn t-btn--primary" style={{ marginTop: 24 }}>Order a display</button>
        </section>

      </div>
    </div>
  );
}
