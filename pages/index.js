import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const commitments = [
  {
    icon: '🛍️',
    title: 'Zero-Inventory Growth',
    description:
      'Displays arrive stocked with sample product and NFC/QR tech. Your team promotes, the customer orders online, and we fulfill direct-to-door.'
  },
  {
    icon: '📈',
    title: 'Live Attribution',
    description:
      'Every tap, scan, and order is tagged to your store’s UID. The dashboard shows scans-to-sales conversion so you always know what is working.'
  },
  {
    icon: '💸',
    title: 'Automatic Payouts',
    description:
      'Plaid + Dwolla deposit retailer commission automatically. No spreadsheets, no manual reconciliations—just cleared ACH transfers each week.'
  },
  {
    icon: '🎨',
    title: 'Staff-Ready Creative',
    description:
      'Use the included talking points, QR flyers, and merchandising shots to keep associates aligned and the display looking fresh in your aisles.'
  }
];

const actionCards = [
  {
    icon: '🏪',
    title: 'Register Your Store',
    description:
      'Register your franchise and connect it to your display network.',
    href: '/onboard',
    buttonLabel: 'Register Now',
    highlight: true
  },
  {
    icon: '💰',
    title: 'Claim Rewards & Payouts',
    description:
      'Manage commissions, link your bank, and track monthly earnings.',
    href: '/onboard/dashboard?tab=payouts',
    buttonLabel: 'View Payouts'
  },
  {
    icon: '🚀',
    title: 'Track Performance',
    description:
      'View real-time sales, scans, and payouts for your stores and products.',
    href: '/onboard/dashboard?tab=stats',
    buttonLabel: 'View Analytics'
  },
  {
    icon: '💬',
    title: 'Talk with Pawpaya Staff',
    description:
      'Chat with Pawpaya for support, display requests, or feedback.',
    href: 'pawpayaco@gmail.com',
    buttonLabel: 'Copy Address',
    external: false,
    copyAction: true
  }
];

const journey = [
  {
    icon: '📦',
    title: 'Display Arrives',
    description:
      'We pre-pack the Pawpaya display with sample product, NFC, and QR. You unbox, place it, and keep it visible near impulse zones.'
  },
  {
    icon: '📲',
    title: 'Customer Taps',
    description:
      'Shoppers tap or scan, land on your Pawpaya storefront, and customize their collar in seconds without calling staff for help.'
  },
  {
    icon: '🛒',
    title: 'Shopify Processes',
    description:
      'Order intelligence flows through Tapify → Shopify. Inventory stays virtual, so shelves stay clean and risk-free.'
  },
  {
    icon: '🏦',
    title: 'Payout Hits',
    description:
      'Once the order is fulfilled, your commission routes through Dwolla. Watch it clear in the dashboard and your connected bank account.'
  }
];

const roadmap = [
  {
    title: 'Product Match AI',
    description:
      'Auto-suggests the next display mix for your location based on scan velocity and conversion data.'
  },
  {
    title: 'QR Flyer Generator',
    description:
      'Download event-ready flyers that auto-embed your franchise UID for farmers markets, adoption days, or in-store activations.'
  },
  {
    title: 'Auto-Rotation Engine',
    description:
      'Schedule seasonal refreshes so Tapify can send new hero products without adding to your workload.'
  }
];

export default function Home() {
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText('pawpayaco@gmail.com');
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch (err) {
      console.error('Failed to copy email:', err);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Soft background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFF3E8] to-transparent h-[400px] pointer-events-none"></div>
      
      {/* Franchise Owner Funnel Card - First Section */}
      <section className="pt-28 md:pt-32 pb-8 md:pb-16 px-4 bg-gradient-to-br from-white via-pink-50/30 to-orange-50/30 backdrop-blur-sm relative">
        <div className="max-w-5xl mx-auto relative">
          {/* Soft radial glow behind the card */}
          <div
            className="absolute inset-0 -m-32 rounded-full opacity-60 blur-[60px] pointer-events-none"
            style={{
              background: 'radial-gradient(circle, #FFD8C2 0%, transparent 70%)',
              width: '600px',
              height: '600px',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          ></div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-[#ff7a4a]/90 via-[#ff6fb3]/90 to-[#ff7a4a]/70 rounded-2xl md:rounded-3xl p-6 md:p-12 shadow-2xl text-center relative z-10"
          >
            <motion.div
              className="text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            >
              {/* Pre-heading */}
              <motion.div
                className="text-xs md:text-sm font-medium opacity-80 uppercase tracking-wider mb-3 md:mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.8, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              >
                For Pet Stores & Franchise Owners
              </motion.div>

              {/* Main heading */}
              <motion.h3
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 px-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              >
                Bring Pawpaya to Your Store
              </motion.h3>

              {/* Subheader */}
              <motion.p
                className="hidden md:block text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed px-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
              >
                Pet lovers everywhere are turning their store shelves into smiles and side income. Claim your free Pawpaya display and see the joy it brings.
              </motion.p>

              {/* Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                className="mt-6 md:mt-0"
              >
                <Link href="/onboard">
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center justify-center text-[#ff7a4a] px-6 md:px-8 py-3 md:py-4 font-bold text-base md:text-xl shadow-xl hover:shadow-2xl transition-all"
                    style={{
                      border: '2px solid transparent',
                      background: 'linear-gradient(white, white) padding-box, linear-gradient(to right, #FF9966, #FF5E8E) border-box',
                      borderRadius: '9999px'
                    }}
                  >
                    Claim Your Free Display →
                  </motion.span>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Action Center */}
      <section className="pt-8 md:pt-12 pb-12 md:pb-20 px-4 bg-gradient-to-br from-white via-pink-50/30 to-orange-50/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 md:mb-14"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 md:mb-6 px-2">
              Action Center
            </h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 max-w-4xl mx-auto mb-4 md:mb-8 px-2"
            >
              Stay connected, track your impact, and keep your Pawpaya displays running strong.
            </motion.p>

          </motion.div>

          <div className="grid md:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
            {actionCards.map((card, index) => {
              const CardWrapper = index < 2 ? 'div' : motion.div;
              const cardProps = index < 2 ? {} : {
                initial: { opacity: 0, y: 40 },
                whileInView: { opacity: 1, y: 0 },
                viewport: { once: true },
                transition: { duration: 0.5, delay: (index - 2) * 0.1 }
              };

              return (
                <CardWrapper
                  key={card.title}
                  {...cardProps}
                  className="rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-xl border-2 transition-all h-full bg-white border-gray-100 hover:shadow-2xl"
                >
                <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3 text-gray-900">
                  {card.title}
                </h3>
                <p className="text-sm md:text-base mb-4 md:mb-6 leading-relaxed text-gray-600">
                  {card.description}
                </p>
                {card.copyAction ? (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={handleCopyEmail}
                    className={`inline-flex items-center justify-center px-6 py-3 rounded-2xl font-bold text-sm md:text-base shadow-lg transition-all ${
                      copiedEmail
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                        : 'bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white hover:shadow-xl'
                    }`}
                  >
                    {copiedEmail ? '✓ Copied!' : `${card.buttonLabel} →`}
                  </motion.button>
                ) : card.external ? (
                  <a
                    href={card.href}
                    className="inline-flex items-center justify-center px-6 py-3 rounded-2xl font-bold text-sm md:text-base shadow-lg transition-all bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white hover:shadow-xl"
                  >
                    {card.buttonLabel} →
                  </a>
                ) : (
                  <Link href={card.href}>
                    <motion.span
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      className="inline-flex items-center justify-center px-6 py-3 rounded-2xl font-bold text-sm md:text-base shadow-lg transition-all bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white hover:shadow-xl"
                    >
                      {card.buttonLabel} →
                    </motion.span>
                  </Link>
                )}
                </CardWrapper>
              );
            })}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-12 md:py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-[#fff3ea] via-[#fff6fb] to-[#f0f4ff] rounded-2xl md:rounded-3xl p-6 md:p-10 shadow-2xl border-2 md:border-4 border-white text-center"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4 px-2">
              We've Got Your Back
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed mb-6 px-2">
              Keep your Pawpaya displays performing their best. We're here to help you boost sales, save time, and turn every display into real store value.
            </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                <Link href="/onboard">
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center justify-center bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white px-6 md:px-8 py-3 rounded-2xl font-bold text-base md:text-lg shadow-xl hover:shadow-2xl transition-all w-full sm:w-auto"
                >
                  Get Your Display →
                </motion.span>
              </Link>
              <a
                href="mailto:oscar@tapify.com?subject=Pawpaya%20Display%20Feedback"
                className="inline-flex items-center justify-center bg-white text-gray-800 px-6 md:px-8 py-3 rounded-2xl font-bold text-base md:text-lg shadow-lg hover:shadow-xl transition-all border-2 border-gray-200 hover:border-[#ff6fb3] w-full sm:w-auto"
              >
                Share Feedback
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Operating Flow */}
      <section className="py-12 md:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 md:mb-14"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 md:mb-4 px-2">
              The Franchise Operator's Flywheel
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-2">
              Every display follows the same four-step loop. Keep the wheel turning and Tapify handles the rest.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-6">
            {journey.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="relative bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-xl border-2 border-gray-100 h-full">
                  <div className="absolute -top-4 md:-top-6 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold shadow-lg text-sm md:text-base">
                      {index + 1}
                    </div>
                  </div>
                  <div className="text-3xl md:text-4xl text-center mt-6 md:mt-8 mb-3 md:mb-4">{step.icon}</div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-3 text-center">{step.title}</h3>
                  <p className="text-sm md:text-base text-gray-600 text-center leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-12 md:py-20 px-4 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 md:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 md:mb-4 px-2">
              What's Next on the Tapify Roadmap
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-2">
              Phase 1 proves the model with Pawpaya. Here's what we are deploying next to make every franchise location self-propelling.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            {roadmap.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-xl border-2 border-white hover:shadow-2xl transition-all h-full">
                  <div className="text-xs md:text-sm font-semibold text-[#ff7a4a] mb-2 md:mb-3">Coming Soon</div>
                  <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-2 md:mb-3">{item.title}</h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
