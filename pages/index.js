// pages/index.js
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-6 py-12 bg-gradient-to-br from-[#fff3ea] via-white to-[#fff6fb] font-inter">
      <h1 className="text-4xl md:text-5xl font-bold text-[#ff7a4a] mb-3 text-center">
        Welcome to Tapify 👋
      </h1>
      <p className="text-gray-500 text-lg md:text-xl max-w-xl text-center mb-10">
        Bridging online brands with real-world retail. Tap your way into the
        future of selling with NFC-powered displays, affiliate analytics, and
        vendor automation.
      </p>

      {/* Button grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
        <a
          href="/onboard"
          className="bg-[#ff6fb3] hover:bg-[#ff58a8] text-white font-semibold py-3 px-6 rounded-xl text-center transition-transform transform hover:scale-105"
        >
          🚀 Vendor Onboarding
        </a>
        <a
          href="/claim"
          className="bg-[#ff6fb3] hover:bg-[#ff58a8] text-white font-semibold py-3 px-6 rounded-xl text-center transition-transform transform hover:scale-105"
        >
          📌 Claim a Display
        </a>
        <a
          href="/admin"
          className="bg-[#ff6fb3] hover:bg-[#ff58a8] text-white font-semibold py-3 px-6 rounded-xl text-center transition-transform transform hover:scale-105"
        >
          🧠 Admin Dashboard
        </a>
        <a
          href="https://pawpayaco.com"
          target="_blank"
          className="bg-[#ff6fb3] hover:bg-[#ff58a8] text-white font-semibold py-3 px-6 rounded-xl text-center transition-transform transform hover:scale-105"
        >
          💖 Visit Live Example
        </a>
      </div>

      <footer className="mt-auto pt-16 text-gray-400 text-sm text-center">
        &copy; {new Date().getFullYear()} Tapify Inc. All rights reserved.
      </footer>
    </div>
  );
}
