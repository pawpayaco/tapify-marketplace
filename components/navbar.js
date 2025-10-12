import Link from 'next/link';
import Image from 'next/image';
import { useAuthContext } from '../context/AuthContext';

export default function Navbar() {
  const { user } = useAuthContext();

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '100vh',
          background: '#f3f4f6',
          zIndex: 45,
          transform: 'translateY(-100vh)',
          pointerEvents: 'none'
        }}
      />
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 shadow-sm bg-white">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 pt-2 pb-2">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Left: See Products Button */}
          <div className="flex-1 flex justify-start">
            <Link
              href="https://pawpayaco.com/products/diy-builder-kit-copy"
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 sm:py-3.5 font-bold text-sm sm:text-base text-[#ff7a4a] bg-white border-2 border-[#ff7a4a] rounded-[15px] shadow-md whitespace-nowrap w-[180px] text-center"
            >
              See Products
            </Link>
          </div>

          {/* Center: Logo */}
          <div className="flex-shrink-0 absolute left-1/2 transform -translate-x-1/2">
            <Link href="/" className="flex items-center">
              <div className="relative">
                <Image
                  src="/pawpaya-logo-circle.png"
                  alt="Pawpaya Collar Co."
                  width={72}
                  height={72}
                  className="h-[60px] w-[60px] sm:h-[72px] sm:w-[72px]"
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
                className="py-2.5 sm:py-3.5 font-bold text-sm sm:text-base text-[#ff7a4a] bg-white border-2 border-[#ff7a4a] rounded-[15px] shadow-md whitespace-nowrap w-[180px] text-center"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="py-2.5 sm:py-3.5 font-bold text-sm sm:text-base text-[#ff7a4a] bg-white border-2 border-[#ff7a4a] rounded-[15px] shadow-md whitespace-nowrap w-[180px] text-center"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
    </>
  );
}
