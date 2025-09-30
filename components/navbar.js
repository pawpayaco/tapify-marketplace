import Link from 'next/link';
import { useState } from 'react';
import { useAuthContext } from '../context/AuthContext';

export default function Navbar() {
  const { user, signOut } = useAuthContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
              Tapify Marketplace
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
              Home
            </Link>
            <Link href="/claim" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
              Claim
            </Link>
            <Link href="/onboard" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
              Onboard
            </Link>
            <Link href="/admin" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
              Admin
            </Link>
            
            {/* Auth Button */}
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">{user.email}</span>
                <button
                  onClick={signOut}
                  className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-[#ff6fb3] text-white px-4 py-2 rounded-lg hover:bg-[#ff58a8] transition-colors font-medium"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 p-2"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200 mt-2">
            <div className="flex flex-col space-y-3 pt-4">
              <Link 
                href="/" 
                className="text-gray-700 hover:text-gray-900 transition-colors font-medium px-2 py-2 hover:bg-gray-50 rounded"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/claim" 
                className="text-gray-700 hover:text-gray-900 transition-colors font-medium px-2 py-2 hover:bg-gray-50 rounded"
                onClick={() => setMobileMenuOpen(false)}
              >
                Claim
              </Link>
              <Link 
                href="/onboard" 
                className="text-gray-700 hover:text-gray-900 transition-colors font-medium px-2 py-2 hover:bg-gray-50 rounded"
                onClick={() => setMobileMenuOpen(false)}
              >
                Onboard
              </Link>
              <Link 
                href="/admin" 
                className="text-gray-700 hover:text-gray-900 transition-colors font-medium px-2 py-2 hover:bg-gray-50 rounded"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin
              </Link>
              
              {/* Mobile Auth Button */}
              {user ? (
                <div className="pt-3 border-t border-gray-200 space-y-2">
                  <div className="text-sm text-gray-600 px-2">{user.email}</div>
                  <button
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="bg-[#ff6fb3] text-white px-4 py-2 rounded-lg hover:bg-[#ff58a8] transition-colors font-medium text-center block"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}