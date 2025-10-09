import Link from 'next/link';
import Image from 'next/image';
import { useAuthContext } from '../context/AuthContext';

export default function Navbar() {
  const { user } = useAuthContext();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 shadow-sm bg-white">
      <div className="max-w-[1800px] mx-auto px-8 sm:px-12 lg:px-16">
        <div className="flex justify-between items-center h-20">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center hover:scale-105 transition-all duration-300 group">
              <div className="relative">
                <Image
                  src="/tapify-logo.png"
                  alt="Tapify"
                  width={128}
                  height={36}
                  className="h-[36px] w-auto transition-all"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation & Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* See Products Button - Always visible */}
            <Link
              href="https://pawpayaco.com/products/diy-builder-kit-copy"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 sm:px-6 py-2 sm:py-3 font-bold text-sm sm:text-base text-[#ff7a4a] bg-white border-2 border-[#ff7a4a] rounded-xl hover:bg-gradient-to-r hover:from-[#ff7a4a] hover:to-[#ff6fb3] hover:text-white hover:border-transparent shadow-md hover:shadow-lg transition-all hover:scale-105 whitespace-nowrap"
            >
              <span className="hidden sm:inline">See Products</span>
              <span className="sm:hidden">Products</span>
            </Link>

            {user ? (
              <Link
                href="/onboard/dashboard"
                className="px-3 sm:px-6 py-2 sm:py-3 font-bold text-sm sm:text-base text-white bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 whitespace-nowrap"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-3 sm:px-6 py-2 sm:py-3 font-bold text-sm sm:text-base text-white bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 whitespace-nowrap"
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
