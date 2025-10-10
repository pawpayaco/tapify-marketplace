import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';
import ImageModalGallery from '../../components/ImageModalGallery';

export default function OnboardIndex() {
  const [isCopied, setIsCopied] = useState(false);

  const handleManagerShare = async () => {
    try {
      const shareUrl = window.location.origin + '/onboard';

      // Always copy to clipboard first
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);

      // Try to use native share API if available
      if (navigator.share) {
        await navigator.share({
          title: 'Tapify Display Program',
          text: 'Check out this amazing display program for our store!',
          url: shareUrl
        });
      }
    } catch (err) {
      console.error('Share error:', err);
      // Link is already copied, so no need to show error
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
    <div className="min-h-screen bg-white pt-24 md:pt-32 pb-20">
      {/* Hero Content */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pb-24 md:pb-32">
        <section className="text-center">
          {/* Trust Badge */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="inline-flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full mb-12 text-xs md:text-sm font-bold text-gray-700"
          >
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></span>
            <span className="whitespace-nowrap">Free display • Zero inventory • Auto commissions</span>
          </motion.div>

          <h1 className="text-7xl md:text-9xl font-black text-gray-900 mb-10 leading-tight">
            Your Store Can{' '}
            <span className="block mt-2">
              Earn More — With{' '}
              <span style={{ background: 'linear-gradient(to right, #FFA08A, #FF8FCF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Zero Inventory
              </span>
            </span>
          </h1>
          <motion.p
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.12 }}
            className="text-2xl md:text-4xl text-gray-700 max-w-4xl mx-auto leading-relaxed mb-16"
          >
            Free displays. Zero risk. Automatic commissions on every sale.
            Choose your path below.
          </motion.p>

          {/* Two-Path CTA Buttons */}
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
            <Link href="/onboard/register" className="w-full md:w-[260px]">
              <motion.button
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-6 py-4 rounded-2xl text-lg font-black shadow-xl transition-all text-white"
                style={{ background: 'linear-gradient(to right, #FFA08A, #FF8FCF)' }}
              >
                I'm a Franchise Owner →
              </motion.button>
            </Link>
            <motion.button
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.18 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleManagerShare}
              className="w-full md:w-[260px] px-6 py-4 rounded-2xl text-lg font-black shadow-xl transition-all bg-white"
              style={{ border: '4px solid #FF8FCF', color: '#FF8FCF' }}
            >
              {isCopied ? 'Copied! ✓' : 'I\'m a Manager — Share This'}
            </motion.button>
          </div>
        </section>
      </div>

      {/* Subtle Divider */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 md:mb-20">
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="h-0.5 bg-gradient-to-r from-transparent via-gray-400 to-transparent max-w-5xl mx-auto"
        />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* See What You're Getting Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
          className="mb-16 md:mb-20"
        >
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-4">
              See What You're Getting
            </h2>
            {/* FREE Tag */}
            <div className="inline-flex items-center px-5 py-2.5 rounded-full text-base font-black text-white shadow-lg"
                 style={{ background: 'linear-gradient(to right, #FFA08A, #FF8FCF)' }}>
              100% FREE
            </div>
          </div>
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-3xl p-8 md:p-12 lg:p-16">
              <ImageModalGallery
                images={[
                  { src: "/images/image28.jpg", alt: "Pawpaya display hero angle" },
                  { src: "/images/image29.jpg", alt: "Pawpaya display close up" },
                  { src: "/images/image30.jpg", alt: "Pawpaya display lifestyle" }
                ]}
              />
            </div>
          </div>
        </motion.section>

        {/* How It Works - Moved to top */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 md:mb-20"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 text-center mb-8 md:mb-12">
            How It Works
          </h2>

          <div className="bg-white rounded-3xl md:rounded-[2rem] py-6 md:py-8 px-4 md:px-10 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] border border-transparent">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-3">
              {[
                { step: '1', text: 'Customer sees display' },
                { step: '2', text: 'Taps phone to order' },
                { step: '3', text: 'We ship product' },
                { step: '4', text: 'You earn commission' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 md:gap-4 flex-1">
                  <div className="flex flex-col items-center text-center flex-1">
                    <div className="w-24 h-24 md:w-20 md:h-20 rounded-full flex items-center justify-center text-4xl md:text-3xl font-black text-white mb-3 shadow-lg"
                         style={{ background: 'linear-gradient(to bottom right, #FFA08A, #FF8FCF)' }}>
                      {item.step}
                    </div>
                    <p className="text-gray-900 font-bold text-lg md:text-lg">{item.text}</p>
                  </div>
                  {idx < 3 && (
                    <div className="hidden md:block text-4xl text-gray-300">→</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Three Column Cards Section */}
        <motion.section
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-16 md:mb-20"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
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
                className="relative overflow-hidden rounded-3xl md:rounded-[2rem] p-8 md:p-10 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] border border-transparent text-center transition-all"
                style={{
                  backgroundImage: 'url(/gradient-bg.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-white opacity-40"></div>
                <div className="relative z-10">
                  <div className="text-4xl md:text-5xl mb-4 md:mb-5">{item.icon}</div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">
                    {item.title === 'Full Support' ? (
                      <>Full<br/>Support</>
                    ) : (
                      item.title
                    )}
                  </h3>
                  <p className="text-gray-700 text-base md:text-lg">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* For Managers and For Owners - Unified Block */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 md:mb-16"
        >
          <div className="bg-white rounded-3xl md:rounded-[2rem] p-8 md:p-10 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] border border-transparent">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-0">
              {/* For Managers */}
              <div className="flex flex-col md:pr-8 md:border-r md:border-gray-200">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-4 md:mb-5">
                  For Managers
                </h2>
                <p className="text-base md:text-lg text-gray-700 mb-5 md:mb-6 leading-relaxed flex-grow">
                  Love this idea? Share it with your owner using the button above.
                  When they approve, you'll be the hero who brought in passive revenue.
                </p>
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleManagerShare}
                  className="w-[240px] px-6 md:px-8 py-3 md:py-4 rounded-2xl md:rounded-3xl text-base md:text-lg font-black shadow-lg bg-white border-2 whitespace-nowrap"
                  style={{ borderColor: '#FF8FCF', color: '#FF8FCF' }}
                >
                  {isCopied ? 'Copied! ✓' : 'Share With Owner'}
                </motion.button>
              </div>

              {/* For Franchise Owners */}
              <div className="flex flex-col border-t md:border-t-0 pt-8 md:pt-0 md:pl-8">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4 md:mb-5 text-gray-900">
                  For Owners
                </h2>
                <p className="text-base md:text-lg mb-5 md:mb-6 leading-relaxed text-gray-700 flex-grow">
                  Ready to add a new revenue stream with zero upfront cost?
                  Register now and we'll ship your free display within 5-7 days.
                </p>
                <Link href="/onboard/register">
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-[240px] px-8 md:px-10 py-3 md:py-4 rounded-2xl md:rounded-3xl text-base md:text-lg font-black transition-all shadow-xl text-white whitespace-nowrap"
                    style={{ background: 'linear-gradient(to right, #FFA08A, #FF8FCF)' }}
                  >
                    Register Now →
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>

          {/* Back Link */}
          <div className="text-center pt-6 md:pt-8">
            <Link href="/onboard/about" className="text-gray-600 hover:text-gray-900 font-bold inline-flex items-center gap-2 hover:gap-3 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Learn More About Pawpaya
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
