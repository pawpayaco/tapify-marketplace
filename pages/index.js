import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-[#fff9f5] to-[#fff0f7]">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16 max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] bg-clip-text text-transparent">
              Tapify Marketplace
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 font-medium">
            Choose your path to get started
          </p>
        </div>

        {/* CTA Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl px-4">
          {/* Retailer Dashboard Card */}
          <Link href="/dashboard/retailer">
            <div className="group cursor-pointer">
              <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-8 h-full transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-[#ff7a4a]">
                <div className="flex flex-col items-center text-center space-y-4">
                  {/* Icon */}
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-2xl font-bold text-gray-900">
                    Retailer Dashboard
                  </h3>
                  
                  {/* Description */}
                  <p className="text-gray-600 leading-relaxed">
                    Manage your retail locations, track display performance, and view analytics.
                  </p>
                  
                  {/* Arrow */}
                  <div className="pt-2">
                    <div className="inline-flex items-center text-[#ff7a4a] font-semibold group-hover:translate-x-2 transition-transform">
                      Get Started
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Seller Dashboard Card */}
          <Link href="/dashboard/seller">
            <div className="group cursor-pointer">
              <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-8 h-full transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-[#ff6fb3]">
                <div className="flex flex-col items-center text-center space-y-4">
                  {/* Icon */}
                  <div className="w-16 h-16 bg-gradient-to-br from-[#ff7a4a] to-[#ff6fb3] rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-2xl font-bold text-gray-900">
                    Seller Dashboard
                  </h3>
                  
                  {/* Description */}
                  <p className="text-gray-600 leading-relaxed">
                    List your products, manage inventory, and track sales across retail partners.
                  </p>
                  
                  {/* Arrow */}
                  <div className="pt-2">
                    <div className="inline-flex items-center text-[#ff6fb3] font-semibold group-hover:translate-x-2 transition-transform">
                      Get Started
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Order Displays Card */}
          <Link href="/order-displays">
            <div className="group cursor-pointer">
              <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-8 h-full transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-purple-500">
                <div className="flex flex-col items-center text-center space-y-4">
                  {/* Icon */}
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-2xl font-bold text-gray-900">
                    Order Displays
                  </h3>
                  
                  {/* Description */}
                  <p className="text-gray-600 leading-relaxed">
                    Get NFC-powered displays for your store or products and start selling.
                  </p>
                  
                  {/* Arrow */}
                  <div className="pt-2">
                    <div className="inline-flex items-center text-purple-600 font-semibold group-hover:translate-x-2 transition-transform">
                      Get Started
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Additional Features */}
        <div className="mt-16 max-w-4xl text-center">
          <p className="text-gray-500 text-sm">
            Powered by NFC technology • Real-time analytics • Seamless integration
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-500 text-sm border-t border-gray-200 bg-white/50 backdrop-blur-sm">
        <p>© 2025 Tapify Marketplace. All rights reserved.</p>
      </footer>
    </div>
  );
}
