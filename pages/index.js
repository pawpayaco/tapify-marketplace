import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

const benefits = [
  {
    icon: '💰',
    title: 'Zero Risk, Pure Profit',
    description: 'No inventory to buy. No upfront costs. Just earn commission on every sale from your display.'
  },
  {
    icon: '🎁',
    title: 'Free Display Shipped',
    description: 'We send you a premium, ready-to-place display with sample products and NFC technology built in.'
  },
  {
    icon: '📱',
    title: 'Tap-to-Buy Technology',
    description: 'Customers tap their phone on the display, order online instantly, and you earn automatically.'
  },
  {
    icon: '🏦',
    title: 'Automatic Payouts',
    description: 'Get paid weekly via direct deposit. Track every scan and sale in your personal dashboard.'
  }
];

const actionCards = [
  {
    icon: '🏪',
    title: 'Register Your Store',
    description:
      "Register your franchise or business and we'll ship you the display.",
    href: '/onboard/about',
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
    href: 'oscar@pawpayaco.com',
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
      'We pre-pack the Pawpaya display with sample display products and NFC. You unbox, and hang or place it in your store.'
  },
  {
    icon: '📲',
    title: 'Customer Taps',
    description:
      'Shoppers tap, and customize or order their collar in seconds without calling staff for help.'
  },
  {
    icon: '🛒',
    title: 'Earn Commission',
    description:
      'Orders flow automatically through your affiliate link and 30% commission gets paid out to your bank via ACH with Plaid and Dwolla.'
  }
];

const roadmap = [
  {
    title: 'Product Match AI',
    description:
      'Auto-suggests the next display mix for your location based on scan velocity and conversion data.'
  },
  {
    title: 'QR Flyers',
    description:
      'Download event-ready flyers that connect your affiliate link for farmers markets, adoption days, or in-store activations. Ask if you are interested.'
  },
  {
    title: 'More Businesses',
    description:
      'We plan to expand pawpaya into retailors nation wide. Later, signing on etsy type businesses, to bring more hand made products into retail.'
  }
];

export default function Home() {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText('oscar@pawpayaco.com');
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch (err) {
      console.error('Failed to copy email:', err);
    }
  };

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
    <div className="min-h-screen pt-24 sm:pt-32 pb-12 sm:pb-16 bg-white">
      {/* Franchise Owner Funnel Card - First Section */}
      <section className="pb-8 sm:pb-12 md:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-[#ff7a4a]/90 via-[#ff6fb3]/90 to-[#ff7a4a]/70 rounded-[23px] sm:rounded-[23px] md:rounded-[23px] p-6 sm:p-8 md:p-12 lg:p-16 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] text-center relative z-10">
            <div className="text-white">
              {/* Pre-heading */}
              <div className="text-xs sm:text-xs md:text-sm font-semibold opacity-90 uppercase tracking-wide mb-2 sm:mb-3 md:mb-4 px-4 py-2.5">
                • Earn Passive Profit Every Day •
              </div>

              {/* Main heading */}
              <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 md:mb-6 px-1 sm:px-2 leading-tight">
                We Make You More Money
              </h1>

              {/* Subheader */}
              <p className="text-sm sm:text-lg md:text-2xl text-white/95 mb-4 sm:mb-6 md:mb-8 max-w-3xl mx-auto leading-tight px-1 sm:px-2">
                Customers tap to buy and you earn<br />automatic 30% commission.
              </p>

              {/* Value props - visible on mobile */}
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8 px-1 sm:px-2">
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs md:text-sm font-semibold">
                  ✓ Free Display
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs md:text-sm font-semibold">
                  ✓ Auto Payouts
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs md:text-sm font-semibold">
                  ✓ Zero Inventory
                </div>
              </div>

              {/* Button */}
              <div className="mt-4 sm:mt-6 md:mt-0">
                <Link href="/onboard/about">
                  <span className="glow-button">
                    <motion.span
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex items-center justify-center text-[#ff7a4a] px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 font-bold text-sm sm:text-base md:text-xl shadow-xl hover:shadow-2xl transition-all bg-white"
                      style={{
                        borderRadius: '15px'
                      }}
                    >
                      Claim Your Free Display →
                    </motion.span>
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Manager Referral Card */}
      <section className="pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-[23px] p-5 md:p-6 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] border border-transparent text-center"
          >
            <h3 className="text-xl font-black text-gray-900 mb-3">Managers</h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Think your store would benefit from this? Help the owner discover this opportunity by sharing with them.
            </p>
            <motion.button
              onClick={handleManagerShare}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto px-6 py-3 rounded-[15px] font-bold shadow-lg transition-all bg-white border-2"
              style={{ borderColor: '#ff6fb3', color: '#ff6fb3' }}
            >
              {isCopied ? 'Copied! ✓' : 'Share With Owner'}
            </motion.button>
          </div>
        </div>
      </section>

      {/* Action Center */}
      <section className="pt-6 md:pt-10 pb-6 md:pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {actionCards.map((card, index) => {
              return (
                <div
                  key={card.title}
                  className="rounded-[23px] md:rounded-[23px] p-8 md:p-10 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] border border-transparent transition-all h-full bg-white hover:shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08),0px_2px_2px_-0.5px_rgba(0,0,0,0.08),0px_4px_4px_-1.5px_rgba(0,0,0,0.08),0px_8px_8px_-3px_rgba(0,0,0,0.08),0px_16px_16px_-6px_rgba(0,0,0,0.08),0px_32px_32px_-12px_rgba(0,0,0,0.08)]"
                >
                <h3 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4 text-gray-900">
                  {card.title}
                </h3>
                <p className="text-base md:text-lg mb-4 md:mb-6 leading-relaxed text-gray-600">
                  {card.description}
                </p>
                {card.copyAction ? (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={handleCopyEmail}
                    className={`inline-flex items-center justify-center px-6 py-3 rounded-[15px] font-bold text-sm md:text-base shadow-lg transition-all ${
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
                    className="inline-flex items-center justify-center px-6 py-3 rounded-[23px] font-bold text-sm md:text-base shadow-lg transition-all bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white hover:shadow-xl"
                  >
                    {card.buttonLabel} →
                  </a>
                ) : (
                  <Link href={card.href}>
                    <motion.span
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      className="inline-flex items-center justify-center px-6 py-3 rounded-[15px] font-bold text-sm md:text-base shadow-lg transition-all bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white hover:shadow-xl"
                    >
                      {card.buttonLabel} →
                    </motion.span>
                  </Link>
                )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="pt-6 md:pt-10 pb-12 md:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-[#fff3ea] via-[#fff6fb] to-[#f0f4ff] rounded-[23px] md:rounded-[23px] p-8 sm:p-10 md:p-12 lg:p-14 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] border border-transparent text-center"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 md:mb-4 px-2">
              Test it Out
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-700 leading-relaxed mb-6 px-2">
              If the display isn't working out how you would like, then simply throw it away.
            </p>
              <div className="flex justify-center">
                <Link href="/onboard/about">
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center justify-center bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white px-6 md:px-8 py-3 rounded-[15px] font-bold text-base md:text-lg shadow-xl hover:shadow-2xl transition-all"
                >
                  Get Your Display →
                </motion.span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Operating Flow */}
      <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 md:mb-14"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 md:mb-4 px-2">
              How it Works
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto px-2">
              Every display follows the same simple process. Keep the display up and Pawpaya handles the rest.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {journey.map((step, index) => (
              <div key={step.title}
              >
                <div className="relative bg-white rounded-[23px] md:rounded-[23px] p-8 md:p-10 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] border border-transparent h-full">
                  <div className="absolute -top-4 md:-top-6 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold shadow-lg text-sm md:text-base">
                      {index + 1}
                    </div>
                  </div>
                  <div className="text-4xl md:text-5xl text-center mt-6 md:mt-8 mb-3 md:mb-4">{step.icon}</div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3 text-center">{step.title}</h3>
                  <p className="text-base md:text-lg text-gray-600 text-center leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 md:mb-12"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 md:mb-4 px-2">
              What's Next on the Tapify Roadmap
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto px-2">
              Here's what we are deploying next to make every location self-propelling.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {roadmap.map((item, index) => (
              <div key={item.title}
              >
                <div className="bg-white rounded-[23px] md:rounded-[23px] p-8 md:p-10 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] border border-transparent hover:shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08),0px_2px_2px_-0.5px_rgba(0,0,0,0.08),0px_4px_4px_-1.5px_rgba(0,0,0,0.08),0px_8px_8px_-3px_rgba(0,0,0,0.08),0px_16px_16px_-6px_rgba(0,0,0,0.08),0px_32px_32px_-12px_rgba(0,0,0,0.08)] transition-all h-full">
                  <div className="text-sm md:text-base font-semibold text-[#ff7a4a] mb-2 md:mb-3">Coming Soon</div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">{item.title}</h3>
                  <p className="text-base md:text-lg text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Questions Card */}
      <section className="pb-12 md:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-[23px] p-5 md:p-6 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] border border-transparent text-center"
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
          </div>
        </div>
      </section>
    </div>
  );
}
