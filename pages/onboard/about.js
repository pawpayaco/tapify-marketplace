import Link from 'next/link';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function AboutPawpaya() {
  const [isCopied, setIsCopied] = useState(false);

  const handleManagerShare = async () => {
    const shareUrl = window.location.origin + '/onboard/about';

    try {
      // Try to copy to clipboard first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch (clipboardErr) {
      console.log('Clipboard write failed:', clipboardErr);
      // Fallback: still show as copied if we proceed to share
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }

    // Try native share API if available (separate from clipboard)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Pawpaya Display Program',
          text: 'I found this program that\'s completely free to sign up, can you check it out?',
          url: shareUrl
        });
      } catch (shareErr) {
        // User cancelled share or share failed - that's ok, link is already copied
        if (shareErr.name !== 'AbortError') {
          console.log('Share failed:', shareErr);
        }
      }
    }
  };

  return (
    <>
      <Head>
        <title>Pawpaya Display Program - Free Display for Pet Stores</title>
        <meta name="description" content="I found this program that's completely free to sign up, can you check it out?" />
        <meta property="og:title" content="Pawpaya Display Program" />
        <meta property="og:description" content="I found this program that's completely free to sign up, can you check it out?" />
        <meta property="og:image" content="/images/image1.webp" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pawpaya Display Program" />
        <meta name="twitter:description" content="I found this program that's completely free to sign up, can you check it out?" />
        <meta name="twitter:image" content="/images/image1.webp" />
      </Head>
      <div className="min-h-screen bg-white pt-20 md:pt-24 pb-16">
      {/* Hero Content */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pb-8 md:pb-12">
        <section className="text-center">
          {/* Trust Badge */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="inline-flex items-center gap-1.5 bg-gray-100 px-4 py-2.5 rounded-full mb-8 mt-8 md:mt-12 text-xs md:text-sm font-bold text-gray-700"
          >
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></span>
            <span className="whitespace-nowrap">Free display • Zero inventory • Auto commissions</span>
          </motion.div>

          <h1 className="text-6xl sm:text-7xl md:text-8xl font-black text-gray-900 mb-6 leading-tight">
            Meet Pawpaya
            <span className="block w-full bg-transparent" style={{ height: '2px', margin: '16px 0' }}></span>
            <span className="block mt-2 bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] bg-clip-text text-transparent">
              Cute Collars<br />+<br />NFC Tech
            </span>
          </h1>

          <motion.p
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.12 }}
            className="text-xl sm:text-2xl md:text-3xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-9 font-medium"
          >
            We're bringing custom<br />collars to your store
          </motion.p>

          {/* CTA Buttons */}
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <Link href="/onboard">
              <button
                className="bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white px-8 py-4 rounded-[15px] text-lg font-black shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                Learn About Partnership →
              </button>
            </Link>
            <a
              href="#how-it-works"
              className="bg-white border-4 px-8 py-4 rounded-[23px] text-lg font-black shadow-lg hover:shadow-xl transition-all hover:scale-105 inline-block cursor-pointer"
              style={{ borderColor: '#ff6fb3', color: '#ff6fb3' }}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              See How It Works ↓
            </a>
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
            <h2 className="text-4xl sm:text-5xl md:text-6xl text-gray-900 mb-6 leading-tight" style={{ fontWeight: 600 }}>
              What We Do
            </h2>

            {/* Two Column Layout on Desktop */}
            <div className="flex flex-col md:grid md:grid-cols-[2.25fr_1fr] gap-8 items-center max-w-6xl mx-auto">
              <div className="order-2 md:order-none bg-white rounded-[23px] p-7 md:p-10 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)]">
                <p className="text-xl md:text-2xl text-gray-600 text-left leading-relaxed">
                  This free display from Pawpaya serves as in-store marketing that showcases our custom made collar and bracelet sets. Each tap-to-buy display helps your store earn extra profit through automatic affiliate commissions. A modern way to make the customer experience better.                </p>
              </div>

              {/* Rounded Image Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="order-1 md:order-none pointer-events-none md:pointer-events-auto"
              >
                <motion.div
                  whileHover={{ scale: 1.5 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-[23px] overflow-hidden shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)]"
                >
                  <img
                    src="/images/image1.webp"
                    alt="Pawpaya story"
                    className="w-full h-auto object-cover"
                  />
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Wrapper for mobile reordering */}
          <div className="flex flex-col gap-8 md:gap-0">
            {/* Photo Grid - order-0 on mobile (first) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-0 md:order-none mt-0 md:mt-0 mb-0 md:mb-16"
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
                  className="aspect-square rounded-[23px] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-lg hover:shadow-xl transition-shadow"
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

            {/* Customize Feature Block */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-1 md:order-none mt-0 md:mt-12 mb-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-[23px] p-8 md:p-10 text-center"
            >
              <h3 className="text-3xl md:text-4xl text-gray-900 mb-4" style={{ fontWeight: 600 }}>
                Check Out Our Customize Tool
              </h3>
              <p className="text-lg md:text-xl text-gray-700 mb-6 max-w-3xl mx-auto leading-relaxed">
                Create your own personalized pet collar. Choose colors, add custom text, and make it uniquely yours!
              </p>
              <a
                href="https://pawpayaco.com/products/diy-builder-kit-copy"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-8 py-4 rounded-[20px] text-lg md:text-xl font-black text-white shadow-lg transition-all hover:shadow-xl hover:scale-105"
                style={{ background: 'linear-gradient(to right, #ff7a4a, #ff6fb3)' }}
              >
                Start Customizing →
              </a>
            </motion.div>

            {/* Grid wrapper - uses contents on mobile to allow flex ordering, grid on desktop */}
            <div className="contents md:grid md:grid-cols-2 md:gap-8 md:gap-12">
              {/* Left: What You Get */}
              <div className="order-2 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-[23px] p-8 md:p-10">
                <h3 className="text-2xl md:text-3xl text-gray-900 mb-6" style={{ fontWeight: 600 }}>Who We Are</h3>
                <div className="space-y-5">
                  {[
                    { icon: '🐾', title: 'Pawpaya Pet Collars', desc: 'Adorable, high-quality matching collar + bracelet sets and DIY kits for customers to craft' },
                    { icon: '🚀', title: 'Nationwide Rollout', desc: '700+ orders, $30k rev, we are rolling out to local pet shops and Pet Supplies Plus stores through innovative display tech' },
                    { icon: '✨', title: 'Built on Joy', desc: 'Designed to spread happiness and strengthen the pet-parent bond' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-start">
                      <div className="text-3xl flex-shrink-0">{item.icon}</div>
                      <div>
                        <div className="text-gray-900 text-lg mb-1" style={{ fontWeight: 500 }}>{item.title}</div>
                        <div className="text-gray-600 leading-relaxed">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: How It Works - order-4 on mobile (after photo grid) */}
              <div className="order-4 md:order-none bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-[23px] p-8 md:p-10">
                <h3 className="text-2xl md:text-3xl text-gray-900 mb-6" style={{ fontWeight: 600 }}>What We Offer</h3>
                <div className="space-y-8">
                  {[
                    { step: '1', title: 'NFC Tap Displays', desc: 'Beautiful displays featuring our Friendship Collars. Customers tap their phone to browse and buy' },
                    { step: '2', title: 'Zero Inventory Risk', desc: 'Sample display collars for customers to see and touch. Orders ship from us. You never handle inventory' },
                    { step: '3', title: 'Earn Per Sale', desc: 'Earn 30% commission on every Pawpaya product ordered from your display automatically' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-start">
                      <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-[#ff7a4a] to-[#ff6fb3] flex items-center justify-center text-white font-black text-lg shadow-lg">
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <div className="text-gray-900 text-lg mb-1" style={{ fontWeight: 500 }}>{item.title}</div>
                        <div className="text-gray-700 leading-relaxed">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Your Opportunity Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-12 md:mt-16 mb-8 md:mb-12"
          >
            <div className="rounded-[23px] md:rounded-[23px] p-6 md:p-10 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] text-white"
                 style={{ background: 'linear-gradient(to bottom right, #ff7a4a, #ff6fb3)' }}>
              <h2 className="text-3xl sm:text-4xl md:text-5xl mb-4 md:mb-5 text-left" style={{ fontWeight: 600 }}>
                Your Opportunity
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl mb-6 md:mb-8 max-w-4xl opacity-90 text-left">
                Our NFC tap-to-shop displays are in select stores nation wide. Your store could be next, offering customers an unforgettable experience.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/onboard">
                  <button
                    className="bg-white px-10 md:px-12 py-4 md:py-5 rounded-[15px] md:rounded-[15px] text-lg md:text-xl font-black transition-all shadow-2xl whitespace-nowrap"
                    style={{ color: '#ff6fb3' }}
                  >
                    See What We're Offering →
                  </button>
                </Link>
                <button
                  onClick={handleManagerShare}
                  className="bg-transparent border-2 border-white px-10 md:px-12 py-4 md:py-5 rounded-[15px] md:rounded-[15px] text-lg md:text-xl font-black transition-all shadow-2xl text-white hover:bg-white hover:bg-opacity-10 whitespace-nowrap"
                >
                  {isCopied ? 'Copied! ✓' : 'I\'m a Manager — Share This'}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Bottom Trust Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-8 md:mb-12 bg-gradient-to-br from-orange-50 to-pink-50 border-2 border-orange-200 rounded-[23px] p-6 md:p-8"
          >
            <div className="max-w-4xl mx-auto">
              <p className="text-2xl md:text-3xl mb-3 text-gray-900 text-left" style={{ fontWeight: 600 }}>
                A Win-Win Partnership
              </p>
              <p className="text-lg md:text-xl text-gray-700 text-left">
                We handle product creation, fulfillment, customer service, and technology. You provide shelf, rack, or counter space and earn commission on every sale.<br />It's that simple.
              </p>
            </div>
          </motion.div>

          {/* Questions Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-0 bg-white rounded-[23px] p-5 md:p-6 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] border border-transparent text-center"
          >
            <h3 className="text-xl font-black text-gray-900 mb-3">Questions?</h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Call us now! We're here to help you out.
            </p>
            <a
              href="tel:7159791259"
              className="inline-block px-6 py-3 rounded-[15px] font-bold text-white shadow-lg hover:shadow-xl transition-all"
              style={{ background: 'linear-gradient(to right, #ff7a4a, #ff6fb3)' }}
            >
              (715) 979-1259
            </a>
          </motion.div>
        </motion.section>
      </div>
    </div>
    </>
  );
}
