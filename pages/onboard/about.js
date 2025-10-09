import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function AboutPawpaya() {
  // Animation variants
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
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Hero Section with Gradient Header */}
      <div className="relative overflow-hidden">
        {/* Gradient Background Image */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/images/gradient-header.png"
            alt="Header background"
            fill
            className="object-cover"
            priority
          />
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-white"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-32 md:py-40">
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-6 leading-tight drop-shadow-sm">
              The Future of Retail{' '}
              <span className="block mt-2">
                Starts With a Tap{' '}
                <span className="inline-block">🐾</span>
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-800 max-w-3xl mx-auto leading-relaxed mb-8 drop-shadow-sm">
              We built Pawpaya from a college dorm, bootstrapped to factory-scale production,
              and now we're bringing zero-inventory retail to stores nationwide.
            </p>
            <Link href="/onboard">
              <motion.button
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-4 rounded-2xl text-lg md:text-xl font-black shadow-xl hover:shadow-2xl transition-all text-white"
                style={{ background: 'linear-gradient(to right, #FFA08A, #FF8FCF)' }}
              >
                Get Started →
              </motion.button>
            </Link>
          </motion.section>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-16 relative z-10">

        {/* Story Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl border-2 border-gray-100">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 text-center">
              From Handmade Collars to a Nationwide Movement
            </h2>
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                <p>
                  Six months ago, we were just college students with four 3D printers crammed into our living room,
                  hand-finishing every single Pawpaya collar.
                </p>
                <p>
                  We filmed our own content, hosted neighborhood dogs for photoshoots, and built a supply chain
                  from scratch—all without outside funding.
                </p>
                <p>
                  Now we're scaling that same scrappy energy into a plug-and-play retail system that lets
                  stores showcase premium products without buying inventory upfront.
                </p>
              </div>
              <div className="relative h-80 rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/image4.webp"
                  alt="Pawpaya story"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </motion.section>

        {/* 3-Column Value Section */}
        <motion.section
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-12 text-center">
            Why Stores Love Tapify
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Free',
                description: 'Zero cost to get started. We ship the display, you place it in your store.',
                icon: '🎁',
                gradient: 'from-[#FFD4B8] to-[#FFA08A]'
              },
              {
                title: 'No Risk',
                description: 'No inventory to buy. No commitment. Customers order online, we fulfill and ship.',
                icon: '🛡️',
                gradient: 'from-[#FF8FCF] to-[#FFD4B8]'
              },
              {
                title: 'Earn Automatically',
                description: 'Every tap-to-order sale earns your store a commission. Paid directly to your account.',
                icon: '💰',
                gradient: 'from-[#FFA08A] to-[#FF8FCF]'
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                whileHover={{ y: -10 }}
                className="bg-white rounded-3xl p-8 shadow-xl border-2 border-gray-100 text-center"
              >
                <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-4xl shadow-lg`}>
                  {item.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Expansion Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <div className="rounded-3xl p-8 md:p-12 shadow-2xl text-white text-center"
               style={{ background: 'linear-gradient(to bottom right, #FFA08A, #FF8FCF)' }}>
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              Join the Movement
            </h2>
            <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto opacity-90">
              We're building a network of independent retailers who want to offer premium products
              without the overhead. Be part of wave one.
            </p>
            <Link href="/onboard">
              <motion.button
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white px-12 py-5 rounded-2xl text-xl font-black hover:bg-gray-50 transition-all shadow-2xl"
                style={{ color: '#FF8FCF' }}
              >
                Get Your Free Display →
              </motion.button>
            </Link>
          </div>
        </motion.section>

        {/* Final CTA */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <Link href="/onboard" className="text-gray-600 hover:text-gray-900 font-bold inline-flex items-center gap-2 hover:gap-3 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Continue to Registration
          </Link>
        </motion.section>
      </div>
    </div>
  );
}
