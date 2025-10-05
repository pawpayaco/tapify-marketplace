import Link from 'next/link';
import Image from 'next/image';
import { useAuthContext } from '../context/AuthContext';

export default function Navbar() {
  const { user } = useAuthContext();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200/50 shadow-lg" style={{ backgroundColor: '#faf8f3' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center hover:scale-105 transition-all duration-300 group">
              <div className="relative">
                <Image 
                  src="/pawpaya-logo.png" 
                  alt="Pawpaya" 
                  width={160}
                  height={45}
                  className="h-[45px] w-auto drop-shadow-md group-hover:drop-shadow-lg transition-all"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation & Auth */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden md:block text-sm text-gray-700 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl font-semibold border border-gray-200/50 shadow-sm">
                  {user.email}
                </span>
                <Link
                  href="/onboard/dashboard"
                  className="px-6 py-3 font-bold text-white bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 border border-white/20"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                className="px-6 py-3 font-bold text-white bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 border border-white/20"
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
