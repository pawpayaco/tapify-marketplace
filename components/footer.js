import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 border-t-2 border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <h3 className="text-2xl font-bold bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] bg-clip-text text-transparent">
              Pawpaya
            </h3>
            <p className="text-gray-700 leading-relaxed">
              Matching friendship collars and bracelets for you and your furry best friend. 
              Built with love. 💕
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4"
          >
            <h4 className="text-lg font-bold text-gray-900">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-700 hover:text-[#ff6fb3] transition-colors font-medium">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/onboard" className="text-gray-700 hover:text-[#ff6fb3] transition-colors font-medium">
                  For Retailers
                </Link>
              </li>
              <li>
                <Link href="/onboard/dashboard" className="text-gray-700 hover:text-[#ff6fb3] transition-colors font-medium">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-700 hover:text-[#ff6fb3] transition-colors font-medium">
                  Privacy & Policies
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Connect Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            <h4 className="text-lg font-bold text-gray-900">Connect</h4>
            <p className="text-gray-700">
              Follow us for updates and adorable pet content!
            </p>
            <div className="flex space-x-4">
              <motion.a 
                href="#" 
                whileHover={{ scale: 1.1, y: -2 }}
                className="bg-white p-3 rounded-xl hover:bg-gradient-to-r hover:from-[#ff7a4a] hover:to-[#ff6fb3] hover:text-white transition-all shadow-md border-2 border-gray-200" 
                aria-label="Instagram"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </motion.a>
              <motion.a 
                href="#" 
                whileHover={{ scale: 1.1, y: -2 }}
                className="bg-white p-3 rounded-xl hover:bg-gradient-to-r hover:from-[#ff7a4a] hover:to-[#ff6fb3] hover:text-white transition-all shadow-md border-2 border-gray-200" 
                aria-label="TikTok"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </motion.a>
              <motion.a 
                href="#" 
                whileHover={{ scale: 1.1, y: -2 }}
                className="bg-white p-3 rounded-xl hover:bg-gradient-to-r hover:from-[#ff7a4a] hover:to-[#ff6fb3] hover:text-white transition-all shadow-md border-2 border-gray-200" 
                aria-label="Facebook"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </motion.a>
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t-2 border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-sm">
              © {currentYear} Pawpaya. All rights reserved. Made with 💕 for pet lovers everywhere.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/privacy" className="text-gray-600 hover:text-[#ff6fb3] transition-colors font-medium">
                Privacy Policy
              </Link>
              <Link href="/privacy" className="text-gray-600 hover:text-[#ff6fb3] transition-colors font-medium">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
