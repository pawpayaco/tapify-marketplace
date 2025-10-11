import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';

export default function ClaimedSuccess() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard after 3 seconds
    const timeout = setTimeout(() => {
      router.push('/onboard/dashboard');
    }, 3000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-500 rounded-full mx-auto mb-6 flex items-center justify-center"
        >
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Display Claimed!
        </h1>

        <p className="text-lg text-gray-600 mb-6">
          Your NFC display is now active and ready to earn commissions
        </p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4 mb-6"
        >
          <p className="text-sm text-gray-700">
            Redirecting to your dashboard...
          </p>
          <div className="mt-3 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent"></div>
          </div>
        </motion.div>

        <button
          onClick={() => router.push('/onboard/dashboard')}
          className="bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
        >
          Go to Dashboard Now →
        </button>
      </motion.div>
    </div>
  );
}
