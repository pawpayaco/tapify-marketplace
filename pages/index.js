// pages/index.js
export default function Home() {
  return (
    <div style={{ minHeight: "100vh" }}>
      <style jsx>{`
        :root {
          --ink: #1f2937;
          --muted: #6b7280;
          --line: #e5e7eb;
          --brand: #ff7a4a;
          --brand-2: #ff6fb3;
          --brand-3: #ffd166;
          --bg-1: #fff6fb;
          --bg-2: #fff3ea;
        }
        body {
          margin: 0;
          font-family: 'Inter', sans-serif;
          background:
            radial-gradient(60% 50% at 15% 5%, var(--bg-2), transparent 60%),
            radial-gradient(60% 60% at 100% 0%, var(--bg-1), transparent 60%);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 3rem 1.5rem;
          color: var(--ink);
        }
        h1 {
          font-size: 2.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: var(--brand);
          text-align: center;
        }
        p {
          font-size: 1.1rem;
          color: var(--muted);
          max-width: 600px;
          text-align: center;
          margin-bottom: 2rem;
        }
        .button-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          max-width: 400px;
          width: 100%;
        }
        .btn {
          background: var(--brand-2);
          color: white;
          padding: 1rem 1.5rem;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1rem;
          text-decoration: none;
          text-align: center;
          transition: all 0.2s ease;
        }
        .btn:hover {
          background: #ff58a8;
          transform: scale(1.02);
        }
        footer {
          margin-top: auto;
          font-size: 0.9rem;
          color: var(--muted);
          padding-top: 3rem;
          text-align: center;
        }
        @media (min-width: 600px) {
          .button-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>

      <h1>Welcome to Tapify 👋</h1>
      <p>
        Bridging online brands with real-world retail. Tap your way into the future of selling with NFC-powered displays, affiliate analytics, and vendor automation.
      </p>

      <div className="button-grid">
        <a className="btn" href="/onboard">🚀 Vendor Onboarding</a>
        <a className="btn" href="/claim">📌 Claim a Display</a>
        <a className="btn" href="/admin">🧠 Admin Dashboard</a>
        <a className="btn" href="https://pawpayaco.com" target="_blank">💖 Visit Live Example</a>
      </div>

      <footer>
        &copy; 2025 Tapify Inc. All rights reserved.
      </footer>
    </div>
  );
}
