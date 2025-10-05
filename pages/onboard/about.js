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
    <div className="min-h-screen pt-20" style={{ backgroundColor: '#faf8f3' }}>
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0]
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-40 -right-40 w-64 h-64 md:w-96 md:h-96 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full blur-3xl opacity-30"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0]
          }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute -bottom-40 -left-40 w-64 h-64 md:w-96 md:h-96 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full blur-3xl opacity-30"
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        {/* Hero Section - Who We Are */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white px-6 py-3 rounded-full text-sm font-bold mb-8 shadow-2xl"
          >
            Our Story
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-6 leading-tight">
            Hey, I'm{' '}
            <span className="bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] bg-clip-text text-transparent">
              Oscar
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Six months ago my roommates and I squeezed four 3D printers into our college living room so we could bring Pawpaya collars to life.
          </p>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed mt-6">
            We hand-finished every strap, filmed hundreds of scrappy videos that clocked millions of views, and even boarded neighborhood dogs overnight so they'd model for us. All without outside funding.
          </p>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed mt-6">
            That grind pushed us to build a fully automated, factory-backed supply chain so indie retailers can plug in without worrying about quality or shipping delays.
          </p>

          <div className="mt-10 flex justify-center">
            <Link href="/onboard">
              <motion.button
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="bg-[#ff6fb3] text-white px-10 py-4 rounded-2xl text-lg md:text-xl font-black shadow-xl hover:shadow-2xl transition-all"
              >
                See How The Display Works →
              </motion.button>
            </Link>
          </div>
        </motion.section>

        {/* The Problem & Solution Grid */}
        <motion.section
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* The Problem */}
            <motion.div
              variants={fadeInUp}
              className="bg-white rounded-3xl p-8 shadow-xl border-2 border-gray-100"
            >
              <div className="text-4xl mb-4">😓</div>
              <h2 className="text-3xl font-black text-gray-900 mb-4">The Problem</h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                The first boutiques we visited loved our collars, but buying inventory from a brand launched in a college house felt risky. Shelf space, staff attention, and cash flow are all too tight to gamble on "maybe".
                <br /><br />
                At the same time, handmade creators like us rarely make it onto those shelves because traditional wholesale is slow, complicated, and expensive.
              </p>
            </motion.div>

            {/* The Solution */}
            <motion.div
              variants={fadeInUp}
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 shadow-xl border-2 border-green-200"
            >
              <div className="text-4xl mb-4">💡</div>
              <h2 className="text-3xl font-black text-gray-900 mb-4">Our Solution</h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                We took everything we learned and built a plug-and-play display with NFC that brings our collars to life, then paired it with an on-demand supply chain we stitched together across multiple specialized factories in China.
                <br /><br />
                The store gets a branded experience, customers tap and buy in seconds, and every order ships fast without the store owning a single SKU.
              </p>
            </motion.div>
          </div>
        </motion.section>

        {/* Product Showcase with Story */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-3xl p-8 md:p-12 shadow-2xl border-2 border-purple-200">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Image */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative h-96 rounded-2xl overflow-hidden shadow-2xl"
              >
                <Image
                  src="/images/image4.webp"
                  alt="Beautiful Pawpaya pet collar products"
                  fill
                  className="object-cover"
                />
              </motion.div>

              {/* Right: Text */}
              <div>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
                  It Started With Pet Collars
                </h2>
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  Pawpaya was born in a cramped college house where four 3D printers whirred day and night. My roommates and I took turns watching print beds, sanding edges, and stitching hardware so every collar felt like it came from a boutique studio.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  We became our own creative agency overnight—shooting late-night content, posting hundreds of videos that racked up millions of views, and even hosting dogs for sleepovers so we could photograph them in fresh drops.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  But when we brought those collars to retailers, the excitement always ran into the same inventory wall. That's when I asked:
                </p>
                <div className="bg-white rounded-2xl p-6 border-2 border-orange-200 shadow-lg">
                  <p className="text-xl font-bold text-gray-900">
                    "What if stores could showcase products without buying them upfront — and still earn money from every sale?"
                  </p>
                </div>
                <p className="text-lg text-gray-700 leading-relaxed mt-6">
                  Fast-forward: we now run production through a tight network of factories we personally vetted in China, keep quality control obsessive, and ship directly to customers under the Pawpaya brand—no middlemen, no slowdowns.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* How It Works - Simple Version */}
        <motion.section
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Here's How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We handle everything. You just put the display in your store and start earning.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'We Ship You a Display',
                description: 'Beautiful, professional display with real product samples and NFC technology built in.',
                emoji: '📦',
                gradient: 'from-blue-400 to-purple-500'
              },
              {
                step: '2',
                title: 'Customers Tap & Buy',
                description: 'They see the products, tap their phone on the display, and order online instantly.',
                emoji: '📱',
                gradient: 'from-purple-400 to-pink-500'
              },
              {
                step: '3',
                title: 'You Earn Commission',
                description: 'Every sale that happens in your store earns you money. Paid directly to your bank account.',
                emoji: '💰',
                gradient: 'from-pink-400 to-[#ff6fb3]'
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                whileHover={{ y: -10 }}
                className="bg-white rounded-3xl p-8 shadow-xl border-2 border-gray-100 text-center"
              >
                <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-4xl shadow-lg`}>
                  {item.emoji}
                </div>
                <div className="text-6xl font-black text-gray-200 mb-2">{item.step}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Product Gallery */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Products Your Customers Will Love
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Every piece still carries the details we obsessed over by hand, now finished with factory-grade consistency and made to make tails wag
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { src: '/images/image1.webp', alt: 'Handmade pet collar collection' },
              { src: '/images/image2.webp', alt: 'Custom pet accessories' },
              { src: '/images/image3.webp', alt: 'Pawpaya product showcase' },
              { src: '/images/image5.webp', alt: 'Beautiful pet collar designs' },
              { src: '/images/image6.webp', alt: 'Unique pet accessories' },
              { src: '/images/image7.webp', alt: 'Premium pet products' }
            ].map((image, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="relative h-80 rounded-2xl overflow-hidden shadow-xl border-2 border-gray-200 cursor-pointer"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* The Mission - Authentic & Personal */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl border-2 border-gray-100">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Oscar's photo or logo */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative h-96 rounded-2xl overflow-hidden shadow-2xl"
              >
                <Image
                  src="/images/image10.webp"
                  alt="Happy customers with Pawpaya products"
                  fill
                  className="object-cover"
                />
              </motion.div>

              {/* Right: Mission Statement */}
              <div>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
                  Why I'm Doing This
                </h2>
                <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
                  <p>
                    I'm not a funded startup. I'm still the guy who loves pets, loves building things, and believes neighborhood retailers should win right alongside the brands they feature.
                  </p>
                  <p>
                    I watched talented makers stall out because getting into stores felt impossible, and I watched retailers pass on products they loved because taking on inventory could sink a slow month.
                  </p>
                  <p className="font-bold text-gray-900">
                    This system changes that.
                  </p>
                  <p>
                    Pawpaya is proof that a bootstrapped crew can stitch together factories, branding, and logistics that feel enterprise-grade. Now we're channeling that playbook into retailers nationwide so the next customer can tap, smile, and walk out with nothing but a great story to tell.
                  </p>
                  <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-2xl p-6 border-2 border-orange-200">
                    <p className="text-xl font-bold text-gray-900">
                      Zero outside funding. Zero shortcuts. Just a system that pays makers, pays retailers, and delights pet parents.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Social Proof - Real Results */}
        <motion.section
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <div className="inline-block bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-full text-green-700 font-bold text-sm mb-4 border-2 border-green-200">
              Bootstrapped, Built To Scale
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Where Pawpaya Is Today
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Dorm Room Origins',
                description: 'Hundreds of collars handcrafted in a college house with four 3D printers humming through the night.',
                emoji: '🏠'
              },
              {
                title: 'Factory-Grade Fulfillment',
                description: 'Multiple specialized partners in China producing our custom molds, hardware, and packaging with tight QC and fast shipping.',
                emoji: '🏭'
              },
              {
                title: 'Retail Rollout',
                description: 'Scaling our NFC displays into shops across the country so stores earn commission without carrying inventory.',
                emoji: '🚀'
              }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-[#ff7a4a] to-[#ff6fb3] rounded-3xl p-8 text-white shadow-2xl text-center"
              >
                <div className="text-5xl mb-4">{stat.emoji}</div>
                <div className="text-2xl font-black mb-3">{stat.title}</div>
                <div className="text-lg opacity-90">{stat.description}</div>
              </motion.div>
            ))}
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
          <div className="bg-gradient-to-br from-[#ff7a4a] via-[#ff6fb3] to-purple-600 rounded-3xl p-12 md:p-16 shadow-2xl relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 0]
                }}
                transition={{ duration: 10, repeat: Infinity }}
                className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"
              />
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  rotate: [0, -180, 0]
                }}
                transition={{ duration: 12, repeat: Infinity }}
                className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"
              />
            </div>

            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
                Ready to Start Earning?
              </h2>
              <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto">
                Be part of the first wave of retailers rolling out Pawpaya displays and earning commission without holding inventory
              </p>

              <Link href="/onboard">
                <motion.button
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white text-[#ff6fb3] px-12 py-6 rounded-2xl text-2xl font-black hover:bg-gray-50 transition-all shadow-2xl hover:shadow-3xl mb-6"
                >
                  Yes, I Want My Free Display →
                </motion.button>
              </Link>

              <div className="flex flex-wrap justify-center gap-6 text-white/90 mt-8">
                {['No Credit Card', 'Free Shipping', '5-7 Day Delivery'].map((text, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-bold">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center mt-12"
        >
          <Link href="/onboard" className="text-gray-600 hover:text-gray-900 font-bold inline-flex items-center gap-2 hover:gap-3 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to home
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
