// pages/index.js
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-6 py-12 bg-white">
      <h1 className="text-4xl md:text-5xl font-bold text-[#ff7a4a] mb-3 text-center">
        Welcome to Tapify
      </h1>
      <p className="text-gray-500 text-lg md:text-xl max-w-3xl text-center mb-10">
        Bridging online brands with real-world retail. Tap your way into the
        future of selling with NFC-powered displays, affiliate analytics, and
        vendor automation.
      </p>

      {/* Top 2 boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl mb-8">
        <a
          href="/onboard"
          className="border-2 border-black hover:bg-black hover:text-white text-black font-semibold py-6 px-6 rounded-xl text-center transition-all transform hover:scale-105"
        >
          Vendor Onboarding
        </a>
        <a
          href="/claim"
          className="border-2 border-black hover:bg-black hover:text-white text-black font-semibold py-6 px-6 rounded-xl text-center transition-all transform hover:scale-105"
        >
          Claim a Display
        </a>
      </div>

      {/* Off-white center section */}
      <div className="w-full bg-gray-50 py-16 flex items-center justify-center">
        <div className="max-w-2xl text-center px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Built for Modern Commerce
          </h2>
          <p className="text-gray-600">
            Seamlessly connect your online store with physical retail locations through our innovative NFC technology.
          </p>
        </div>
      </div>

      {/* Bottom 2 boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl mt-8">
        <a
          href="/admin"
          className="border-2 border-black hover:bg-black hover:text-white text-black font-semibold py-6 px-6 rounded-xl text-center transition-all transform hover:scale-105"
        >
          Admin Dashboard
        </a>
        <a
          href="https://pawpayaco.com"
          target="_blank"
          className="border-2 border-black hover:bg-black hover:text-white text-black font-semibold py-6 px-6 rounded-xl text-center transition-all transform hover:scale-105"
        >
          Visit Live Example
        </a>
      </div>
    </div>
  );
}
