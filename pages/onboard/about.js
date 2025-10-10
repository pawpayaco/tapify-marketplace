import Link from 'next/link';
import { motion } from 'framer-motion';

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
    <div className="min-h-screen bg-white pt-20 md:pt-24 pb-16">
      {/* Hero Content */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pb-8 md:pb-12">
        <section className="text-center">
          {/* Trust Badge */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="inline-flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full mb-8 mt-8 md:mt-12 text-xs md:text-sm font-bold text-gray-700"
          >
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></span>
            <span className="whitespace-nowrap">Free display • Zero inventory • Auto commissions</span>
          </motion.div>

          <h1 className="text-6xl sm:text-7xl md:text-8xl font-black text-gray-900 mb-8 leading-[1.1]">
            Meet Pawpaya
            <span className="block mt-3 bg-gradient-to-r from-[#FFA08A] to-[#FF8FCF] bg-clip-text text-transparent">
              The Future of Retail
            </span>
          </h1>

          <motion.p
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.12 }}
            className="text-2xl sm:text-2xl md:text-3xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-14 font-medium"
          >
            We're bringing custom products to your store
          </motion.p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link href="/onboard">
              <motion.button
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-4 rounded-2xl text-lg font-black shadow-xl transition-all text-white"
                style={{ background: 'linear-gradient(to right, #FFA08A, #FF8FCF)', width: '320px', maxWidth: '100%' }}
              >
                Learn About Partnership →
              </motion.button>
            </Link>
            <motion.a
              href="#how-it-works"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.18 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-4 rounded-2xl text-lg font-black shadow-xl transition-all bg-white inline-block cursor-pointer text-center"
              style={{ border: '4px solid #FF8FCF', color: '#FF8FCF', width: '320px', maxWidth: '100%' }}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              See How It Works ↓
            </motion.a>
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

        {/* Scroll anchor with padding */}
        <div id="how-it-works" className="pt-24 md:pt-32 -mt-24 md:-mt-32"></div>

        {/* The Opportunity Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 md:mb-20"
        >
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
              Our Story & What We Do
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
              We created Pawpaya to bring the joy of premium pet products to stores everywhere—using NFC tap technology to make discovering and buying our collars effortless for customers and profitable for you
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            {/* Left: What You Get */}
            <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-3xl p-8 md:p-10">
              <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-6">Who We Are</h3>
              <div className="space-y-5">
                {[
                  { icon: '🐾', title: 'Pawpaya Pet Collars', desc: 'Adorable, high-quality pet collars crafted to make tails wag and customers smile' },
                  { icon: '💝', title: 'The Friendship Collar', desc: 'Matching collars for pets and bracelets for humans—celebrating the bond between best friends' },
                  { icon: '🚀', title: 'Nationwide Rollout', desc: 'Rolling out to 750+ Pet Supplies Plus stores through innovative NFC displays' },
                  { icon: '✨', title: 'Built on Joy', desc: 'Designed to spread happiness and strengthen the pet-parent bond' }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="text-3xl flex-shrink-0">{item.icon}</div>
                    <div>
                      <div className="font-bold text-gray-900 text-lg mb-1">{item.title}</div>
                      <div className="text-gray-600 leading-relaxed">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: How It Works */}
            <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-3xl p-8 md:p-10">
              <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-6">What We Offer</h3>
              <div className="space-y-6">
                {[
                  { step: '1', title: 'NFC Tap Displays', desc: 'Beautiful displays featuring our Friendship Collars—customers tap their phone to browse and buy' },
                  { step: '2', title: 'Zero Inventory Risk', desc: 'Sample collars for customers to see and touch. Orders ship from us—you never handle inventory' },
                  { step: '3', title: 'Earn Per Sale', desc: 'Earn commission on every Pawpaya product ordered from your display—completely automatic' },
                  { step: '4', title: 'Automatic Payouts', desc: 'We track every sale and deposit earnings directly to your account—completely hands-free' }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-[#FFA08A] to-[#FF8FCF] flex items-center justify-center text-white font-black text-lg shadow-lg">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <div className="font-black text-gray-900 text-lg mb-1">{item.title}</div>
                      <div className="text-gray-700 leading-relaxed">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Photo Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-12 md:mt-16 mb-12 md:mb-16"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                'iap_640x640.7007939477_lvhsoby5_800x800.webp',
                'iap_640x640.7082515652_jtlddech_800x800.webp',
                'image10.webp',
                'image15.jpeg',
                'image16.jpeg',
                'image17.jpeg',
                'image18.jpeg',
                'image20.webp'
              ].map((filename, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <img
                    src={`/images/${filename}`}
                    alt={`Pawpaya product ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Bottom Trust Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-8 md:mt-12 mb-0 bg-gradient-to-br from-orange-50 to-pink-50 border-2 border-orange-200 rounded-2xl p-6 md:p-8 text-center"
          >
            <div className="max-w-4xl mx-auto">
              <p className="text-2xl md:text-3xl font-black mb-3 text-gray-900">
                The Perfect Win-Win Partnership
              </p>
              <p className="text-lg md:text-xl text-gray-700">
                We handle product creation, fulfillment, customer service, and technology. You provide counter space and earn commission on every sale. It's that simple.
              </p>
            </div>
          </motion.div>
        </motion.section>

        {/* Expansion Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-8 md:mb-12 -mt-8 md:-mt-12"
        >
          <div className="rounded-3xl md:rounded-[2rem] p-6 md:p-10 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] text-white text-center"
               style={{ background: 'linear-gradient(to bottom right, #FFA08A, #FF8FCF)' }}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-5">
              Our Expansion & Your Opportunity
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl mb-6 md:mb-8 max-w-4xl mx-auto opacity-90">
              We started with a simple idea: make in-store shopping as seamless as online. Now we're expanding to hundreds of retail partners nationwide through our NFC tap checkout technology. Your store could be next—earning passive commission while offering customers something they've never seen before.
            </p>
            <Link href="/onboard">
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white px-10 md:px-12 py-4 md:py-5 rounded-2xl md:rounded-3xl text-lg md:text-xl font-black transition-all shadow-2xl"
                style={{ color: '#FF8FCF' }}
              >
                See What We're Offering →
              </motion.button>
            </Link>
          </div>

          {/* Final CTA */}
          <div className="text-center pt-8 md:pt-12">
            <Link href="/onboard" className="text-gray-600 hover:text-gray-900 font-bold inline-flex items-center gap-2 hover:gap-3 transition-all text-base md:text-lg">
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Continue to Registration
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
