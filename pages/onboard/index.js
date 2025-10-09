import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function OnboardIndex() {
  const [shareError, setShareError] = useState('');

  const handleManagerShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Tapify Display Program',
          text: 'Check out this amazing display program for our store!',
          url: window.location.origin + '/onboard'
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.origin + '/onboard');
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Share error:', err);
      setShareError('Unable to share. Please copy the link manually.');
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen pt-20" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0]
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-40 -right-40 w-64 h-64 md:w-96 md:h-96 rounded-full blur-3xl opacity-30"
          style={{ background: 'linear-gradient(to bottom right, #FFD4B8, #FF8FCF)' }}
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0]
          }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute -bottom-40 -left-40 w-64 h-64 md:w-96 md:h-96 rounded-full blur-3xl opacity-30"
          style={{ background: 'linear-gradient(to bottom right, #FFA08A, #FFD4B8)' }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16 relative z-10">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-6 leading-tight">
            Your Store Can{' '}
            <span className="block mt-2">
              Earn More — With{' '}
              <span style={{ background: 'linear-gradient(to right, #FFA08A, #FF8FCF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Zero Inventory
              </span>
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed mb-12">
            Free displays. Zero risk. Automatic commissions on every sale.
            Choose your path below.
          </p>

          {/* Two-Path CTA Buttons */}
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center mb-16">
            <Link href="/onboard/register">
              <motion.button
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 rounded-2xl text-xl font-black shadow-xl hover:shadow-2xl transition-all text-white w-full md:w-auto"
                style={{ background: 'linear-gradient(to right, #FFA08A, #FF8FCF)' }}
              >
                I'm a Franchise Owner →
              </motion.button>
            </Link>
            <motion.button
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleManagerShare}
              className="px-10 py-5 rounded-2xl text-xl font-black shadow-xl hover:shadow-2xl transition-all bg-white border-4 w-full md:w-auto"
              style={{ borderColor: '#FF8FCF', color: '#FF8FCF' }}
            >
              I'm a Manager — Share This
            </motion.button>
          </div>
          {shareError && <p className="text-red-600 text-sm">{shareError}</p>}
        </motion.section>

        {/* What You'll Get Section */}
        <motion.section
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-12 text-center">
            What You'll Get
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Free Display',
                description: 'Professional NFC-enabled display shipped to your store',
                icon: '📦'
              },
              {
                title: 'Zero Inventory',
                description: 'No products to buy, stock, or manage',
                icon: '✨'
              },
              {
                title: 'Auto Commissions',
                description: 'Earn on every customer tap-to-order sale',
                icon: '💰'
              },
              {
                title: 'Full Support',
                description: 'We handle fulfillment, shipping, and customer service',
                icon: '🤝'
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                className="bg-white rounded-2xl p-6 shadow-xl border-2 border-gray-100 text-center"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Why It Works */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl border-2 border-gray-100">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-8 text-center">
              Why It Works
            </h2>
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              {[
                { step: '1', text: 'Customer sees display' },
                { step: '2', text: 'Taps phone to order' },
                { step: '3', text: 'We ship product' },
                { step: '4', text: 'You earn commission' }
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-white mb-3"
                       style={{ background: 'linear-gradient(to bottom right, #FFA08A, #FF8FCF)' }}>
                    {item.step}
                  </div>
                  <p className="text-gray-700 font-semibold">{item.text}</p>
                  {idx < 3 && (
                    <div className="hidden md:block text-3xl text-gray-300 mt-4">→</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* For Managers */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <div className="rounded-3xl p-8 md:p-12 shadow-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              For Managers
            </h2>
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              Love this idea? Share it with your owner using the button above.
              When they approve, you'll be the hero who brought in passive revenue.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleManagerShare}
              className="px-8 py-4 rounded-2xl text-lg font-black shadow-lg bg-white border-2"
              style={{ borderColor: '#FF8FCF', color: '#FF8FCF' }}
            >
              Share With Owner
            </motion.button>
          </div>
        </motion.section>

        {/* For Owners */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <div className="rounded-3xl p-8 md:p-12 shadow-2xl text-white"
               style={{ background: 'linear-gradient(to bottom right, #FFA08A, #FF8FCF)' }}>
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              For Franchise Owners
            </h2>
            <p className="text-lg mb-6 leading-relaxed opacity-95">
              Ready to add a new revenue stream with zero upfront cost?
              Register now and we'll ship your free display within 5-7 days.
            </p>
            <Link href="/onboard/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white px-10 py-4 rounded-2xl text-lg font-black hover:bg-gray-50 transition-all shadow-xl"
                style={{ color: '#FF8FCF' }}
              >
                Register Now →
              </motion.button>
            </Link>
          </div>
        </motion.section>

        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <Link href="/onboard/about" className="text-gray-600 hover:text-gray-900 font-bold inline-flex items-center gap-2 hover:gap-3 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Learn More About Pawpaya
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
