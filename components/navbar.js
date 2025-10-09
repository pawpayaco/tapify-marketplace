import Link from 'next/link';
import Image from 'next/image';
import { useAuthContext } from '../context/AuthContext';

export default function Navbar() {
  const { user } = useAuthContext();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 shadow-sm bg-white">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Left: See Products Button */}
          <div className="flex-1 flex justify-start">
            <Link
              href="https://pawpayaco.com/products/diy-builder-kit-copy"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 sm:px-6 py-2 sm:py-3 font-bold text-xs sm:text-base text-[#ff7a4a] bg-white border-2 border-[#ff7a4a] rounded-xl hover:bg-gradient-to-r hover:from-[#ff7a4a] hover:to-[#ff6fb3] hover:text-white hover:border-transparent shadow-md hover:shadow-lg transition-all hover:scale-105 whitespace-nowrap"
            >
              <span className="hidden sm:inline">See Products</span>
              <span className="sm:hidden">Products</span>
            </Link>
          </div>

          {/* Center: Logo */}
          <div className="flex-shrink-0 absolute left-1/2 transform -translate-x-1/2">
            <Link href="/" className="flex items-center hover:scale-105 transition-all duration-300">
              <div className="relative">
                <Image
                  src="/pawpaya-logo-circle.png"
                  alt="Pawpaya Collar Co."
                  width={48}
                  height={48}
                  className="h-10 w-10 sm:h-12 sm:w-12 transition-all"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Right: Dashboard/Login Button */}
          <div className="flex-1 flex justify-end">
            {user ? (
              <Link
                href="/onboard/dashboard"
                className="px-3 sm:px-6 py-2 sm:py-3 font-bold text-xs sm:text-base text-white bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 whitespace-nowrap"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-3 sm:px-6 py-2 sm:py-3 font-bold text-xs sm:text-base text-white bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 whitespace-nowrap"
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
