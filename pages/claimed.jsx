import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function ClaimedPage() {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setShowConfetti(true);
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: '#faf8f3' }}>
      {/* Soft background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFF3E8] to-transparent h-[400px] pointer-events-none"></div>

      <div className="max-w-lg w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: 0.6,
            ease: [0.23, 1, 0.32, 1]
          }}
          className="bg-white rounded-3xl shadow-2xl border-2 border-gray-100 p-8 md:p-12 text-center"
        >
          {/* Success Icon with animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.2,
              type: "spring",
              stiffness: 200,
              damping: 15
            }}
            className="mb-6"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-xl">
              <motion.span
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="text-4xl md:text-5xl"
              >
                ✓
              </motion.span>
            </div>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
          >
            🎉 Display Claimed!
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-base md:text-lg text-gray-600 mb-2 leading-relaxed"
          >
            Your display is now live and ready to earn!
          </motion.p>

          {/* Call to action - tap the display */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-r from-[#FFF3E8] to-[#FFF0F5] rounded-2xl p-6 mb-6"
          >
            <div className="text-5xl mb-3">👆</div>
            <p className="text-lg font-bold text-gray-900 mb-2">
              Next Step: Tap the Display to Shop
            </p>
            <p className="text-sm text-gray-600">
              Use your phone to tap or scan the NFC tag or QR code on your physical display to start shopping.
            </p>
          </motion.div>

          {/* Optional: Close instruction */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-sm text-gray-500"
          >
            You can close this page now.
          </motion.p>
        </motion.div>

        {/* Confetti particles */}
        {showConfetti && (
          <>
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 1,
                  y: 0,
                  x: 0,
                  scale: 1
                }}
                animate={{
                  opacity: 0,
                  y: -200 + Math.random() * 100,
                  x: (Math.random() - 0.5) * 300,
                  scale: 0,
                  rotate: Math.random() * 360
                }}
                transition={{
                  duration: 1.5 + Math.random() * 0.5,
                  delay: 0.3 + i * 0.05,
                  ease: "easeOut"
                }}
                className="absolute top-1/2 left-1/2 pointer-events-none"
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: ['#ff7a4a', '#ff6fb3', '#FFD700', '#87CEEB', '#98D8C8'][i % 5],
                }}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
