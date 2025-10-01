import Link from 'next/link';
import Image from 'next/image';
import { useAuthContext } from '../context/AuthContext';

export default function Navbar() {
  const { user, signOut } = useAuthContext();

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <Image 
                src="/pawpaya-logo.png" 
                alt="Pawpaya" 
                width={151}
                height={40}
                className="h-[42px] w-auto"
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation & Auth */}
          <div className="flex items-center gap-3">
            {/* Dashboard Button */}
            <Link
              href="/onboard/dashboard"
              className="hidden sm:flex items-center gap-2 px-4 py-2 font-semibold text-gray-700 hover:text-gray-900 transition-all rounded-xl hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50"
            >
              <span>📊</span>
              <span>Dashboard</span>
            </Link>

            {user ? (
              <div className="flex items-center gap-3">
                <span className="hidden md:block text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg font-medium">
                  {user.email}
                </span>
                <button
                  onClick={signOut}
                  className="px-4 py-2 font-semibold text-gray-700 hover:text-gray-900 transition-all rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-5 py-2.5 font-bold text-white bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}