import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

const highlightStats = [
  {
    label: 'Average owner payout',
    value: '$2,400/mo',
    subtext: 'Rolling 45-day average across pilot Pawpaya locations'
  },
  {
    label: 'Install time',
    value: '20 minutes',
    subtext: 'Displays arrive assembled with placement guide + signage'
  },
  {
    label: 'Owner cost',
    value: '$0',
    subtext: 'Tapify covers design, production, shipping, and refreshes'
  }
];

const ownerWins = [
  {
    title: 'Immediate incremental revenue',
    description:
      'Earn commission on every online order triggered from your location without hiring staff or holding inventory.'
  },
  {
    title: 'Premium merchandising delivered',
    description:
      'High-converting Pawpaya displays land ready to place, complete with NFC tap + QR scan experiences customers love.'
  },
  {
    title: 'Franchise-friendly compliance',
    description:
      'Clean reporting, weekly payouts, and transparent attribution keep accounting simple for multi-unit operators.'
  }
];

const kitHighlights = [
  {
    title: 'Counter + endcap display kits',
    description: 'Durable, wipe-clean cardboard engineered to survive high-traffic retail environments.',
    image: '/images/image28.jpg'
  },
  {
    title: 'Sample product experience',
    description: 'Pawpaya friendship collars and accessories customers can touch, paired with instant order links.',
    image: '/images/image29.jpg'
  },
  {
    title: 'Tap-ready NFC hardware',
    description: 'Every unit ships with programmed NFC + QR technology tied to your store ID for attribution and payouts.',
    image: '/images/image30.jpg'
  }
];

const rolloutSteps = [
  {
    number: '01',
    title: 'Owner approval',
    description:
      'Complete the quick activation form so we can ship displays and connect payouts to your franchise entity.'
  },
  {
    number: '02',
    title: 'Ship + stage',
    description: 'Displays arrive within 5-7 days. Your manager follows the placement guide and sends a photo confirmation.'
  },
  {
    number: '03',
    title: 'Tap-to-order live',
    description: 'Customers tap or scan, order online, and we fulfil directly. Your dashboard tracks every sale in real time.'
  },
  {
    number: '04',
    title: 'Weekly payouts',
    description:
      'Franchise owners receive automated deposits with line-item reporting for each location and sourcing partner.'
  }
];

const operations = [
  {
    title: 'Merchandising + creative',
    description: 'Tapify designs, prints, and continuously refreshes Pawpaya displays to keep the experience on-brand.'
  },
  {
    title: 'Fulfilment + customer service',
    description: 'We handle all ecommerce orders, returns, and support. Your staff never has to pack or ship inventory.'
  },
  {
    title: 'Attribution + analytics',
    description: 'NFC/QR data connects every order to the correct store. Owners see scan counts, sales, and payout history.'
  }
];

const techProof = [
  {
    title: 'Bank-grade payouts',
    description: 'Dwolla-backed payouts flow straight to your franchise bank account with audit-ready reporting.'
  },
  {
    title: 'Owner dashboard',
    description: 'Monitor revenue, scan volume, and display performance by store or region at a glance.'
  },
  {
    title: 'Live display tracking',
    description: 'Every display UID is registered, so you always know where units are deployed and earning.'
  }
];

const faqs = [
  {
    question: 'Why does my manager need owner approval?',
    answer:
      'Managers discovered the Pawpaya program and flagged your location. We require owner sign-off to connect payouts, confirm franchise compliance, and ship displays to the right locations.'
  },
  {
    question: 'What happens if the display is damaged?',
    answer:
      'Tapify keeps backup inventory and will overnight a replacement. We also refresh creative seasonally so the merchandising never goes stale.'
  },
  {
    question: 'How are commissions calculated?',
    answer:
      'Every order triggered from your store’s display includes a unique identifier. Owners earn a fixed percentage of every sale — posted weekly with downloadable reports.'
  },
  {
    question: 'Can I roll this out to multiple franchise locations?',
    answer:
      'Absolutely. Once your first store is live, you can request bulk deployment and we stage a rollout schedule with your regional managers.'
  }
];

const testimonials = [
  {
    name: 'Jessica Martinez',
    role: 'Multi-unit Franchise Owner • Bay Area',
    quote:
      'The Pawpaya displays installed in under half an hour and started generating orders day one. The weekly deposits are transparent and our managers stay motivated because it feels like free money.',
    image: '/images/image10.webp'
  },
  {
    name: 'David Thompson',
    role: 'Pet Supplies Plus • Austin Market',
    quote:
      'Tapify gave us the perks of ecommerce without operational drag. No inventory risk, no extra payroll, just found revenue from customers already in our stores.',
    image: '/images/image16.jpeg'
  }
];

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12
    }
  }
};

export default function RetailerOnboardLanding() {
  const router = useRouter();

  // Track referral 'view' event when page loads with ref parameter
  useEffect(() => {
    const { ref } = router.query;

    if (ref) {
      console.log('[Referral] Tracking view event for manager:', ref);

      fetch('/api/track-referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manager_phone: ref,
          event_type: 'view'
        })
      })
        .then(res => res.json())
        .then(data => console.log('[Referral] View event logged:', data))
        .catch(err => console.error('[Referral] Failed to log view event:', err));
    }
  }, [router.query]);

  return (
    <div className="min-h-screen bg-[#faf8f3] pt-20 text-gray-900 overflow-x-hidden">
      <section className="relative overflow-hidden py-12 md:py-24 px-4 sm:px-6 lg:px-8 max-w-full">
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.5, 0.35] }}
            transition={{ duration: 18, repeat: Infinity }}
            className="absolute -top-40 -right-32 w-72 h-72 md:w-96 md:h-96 bg-gradient-to-br from-[#ff7a4a]/30 to-[#ff6fb3]/30 blur-3xl"
          />
          <motion.div
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.25, 0.45, 0.25] }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute -bottom-40 -left-40 w-72 h-72 md:w-[28rem] md:h-[28rem] bg-gradient-to-br from-blue-200/50 to-purple-200/40 blur-3xl"
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-14 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 bg-white/80 backdrop-blur px-4 md:px-5 py-2.5 rounded-full text-xs md:text-sm font-semibold shadow-lg border border-white/60 mb-4 md:mb-6 max-w-full"
              >
                <span className="text-[#ff7a4a] truncate">Franchise Owner Briefing</span>
                <span className="text-gray-500 hidden sm:inline">Pawpaya Display Network</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-4 md:mb-6"
              >
                Turn Foot Traffic Into
                <span className="block bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] bg-clip-text text-transparent">
                  Guaranteed Ecommerce Revenue
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed mb-6 md:mb-8"
              >
                Your store manager requested Pawpaya displays because they see how quickly they convert customers. Approve the program, and we handle the rest — from merchandising and fulfilment to payouts that land in your account every week.
              </motion.p>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-8 md:mb-10"
              >
                {highlightStats.map((stat, idx) => (
                  <motion.div
                    key={stat.label}
                    variants={fadeInUp}
                    className="bg-white shadow-xl rounded-2xl md:rounded-2xl border border-gray-100 p-4 md:p-5"
                  >
                    <div className="text-xs font-semibold uppercase text-gray-500 tracking-wide mb-2">
                      {stat.label}
                    </div>
                    <div className="text-xl md:text-2xl font-black text-gray-900 mb-1">{stat.value}</div>
                    <p className="text-xs md:text-sm text-gray-500 leading-relaxed">{stat.subtext}</p>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-3 md:gap-4 sm:items-center mb-6"
              >
                <Link href="/onboard/register">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    className="bg-gradient-to-r from-[#ff7a4a]/90 via-[#ff6fb3]/90 to-[#ff7a4a]/70 text-white px-8 md:px-10 py-4 md:py-5 rounded-2xl text-base md:text-lg font-bold shadow-2xl border border-white/30 w-full sm:w-auto"
                  >
                    Activate Your Displays →
                  </motion.button>
                </Link>
                <Link href="#rollout">
                  <motion.button
                    whileHover={{ scale: 1.04, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-8 md:px-10 py-4 md:py-5 rounded-2xl text-base md:text-lg font-bold border-2 border-gray-300 text-gray-700 bg-white/80 backdrop-blur shadow-xl w-full sm:w-auto"
                  >
                    View Rollout Plan
                  </motion.button>
                </Link>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="text-sm text-gray-500"
              >
                No invoices. No minimums. Opt out anytime if the program stops printing revenue — but our pilots have only asked for more displays.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative w-full"
            >
              <div className="relative w-full h-80 md:h-96 lg:h-[520px] rounded-2xl md:rounded-[32px] overflow-hidden shadow-2xl border border-white/40">
                <Image
                  src="/images/image4.webp"
                  alt="Pawpaya in-store display with NFC tap-to-buy tech"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
                <div className="absolute top-3 left-3 md:top-6 md:left-6 bg-white/90 backdrop-blur px-3 py-2 md:px-5 md:py-4 rounded-xl md:rounded-2xl shadow-xl border border-white/80 max-w-[calc(100%-24px)] md:max-w-none">
                  <div className="text-xs font-semibold uppercase text-gray-500">Live Pilot Metric</div>
                  <div className="text-lg md:text-2xl font-black text-gray-900">38% tap-to-order</div>
                  <p className="text-xs md:text-sm text-gray-500 hidden md:block">Compared to QR-only retail displays</p>
                </div>
                <div className="absolute bottom-3 right-3 md:bottom-6 md:right-6 bg-gradient-to-r from-[#ff7a4a]/90 via-[#ff6fb3]/90 to-[#ff7a4a]/70 text-white px-3 py-2 md:px-5 md:py-3 rounded-xl md:rounded-2xl shadow-xl max-w-[calc(100%-24px)] md:max-w-none">
                  <div className="text-xs uppercase tracking-wider">Tapify handles</div>
                  <div className="text-sm md:text-lg font-semibold">Design • Logistics • Payouts</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 md:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-3 md:mb-4 px-2">Why Franchise Owners Say Yes</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-2">
              Tapify blends Pawpaya's viral product line with technology, logistics, and payouts designed for multi-unit operations.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
          >
            {ownerWins.map((win) => (
              <motion.div
                key={win.title}
                variants={fadeInUp}
                whileHover={{ y: -8 }}
                className="bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-xl p-6 md:p-8 flex flex-col gap-3 md:gap-4"
              >
                <h3 className="text-lg md:text-xl font-bold text-gray-900">{win.title}</h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed">{win.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 bg-white/80" id="rollout">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 md:gap-6 mb-8 md:mb-14"
          >
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-3 md:mb-4 px-2">Owner Rollout Playbook</h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl px-2">
                Approved once, deployed everywhere. Each step is documented for your managers so the program runs without creating new tasks for you.
              </p>
            </div>
            <div className="bg-gradient-to-r from-[#ff7a4a]/90 via-[#ff6fb3]/90 to-[#ff7a4a]/70 text-white px-5 md:px-6 py-3 md:py-4 rounded-2xl shadow-xl text-xs md:text-sm font-semibold mx-2 lg:mx-0">
              End-to-end launch timeline: <span className="font-black">7 days</span>
            </div>
          </motion.div>

          <div className="relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ff6fb3]/50 to-transparent" />
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
            >
              {rolloutSteps.map((step) => (
                <motion.div
                  key={step.number}
                  variants={fadeInUp}
                  className="relative bg-white rounded-2xl md:rounded-3xl shadow-xl border border-gray-100 p-5 md:p-6"
                >
                  <span className="text-xs md:text-sm font-bold text-[#ff6fb3]">Step {step.number}</span>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mt-2 mb-2 md:mb-3">{step.title}</h3>
                  <p className="text-gray-600 text-xs md:text-sm leading-relaxed">{step.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 md:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-3 md:mb-4 px-2">What Arrives In Every Pawpaya Kit</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-2">
              Displays are produced in batches and packed with placement instructions, manager scripts, and QR/NFC hardware already activated.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
          >
            {kitHighlights.map((item) => (
              <motion.div
                key={item.title}
                variants={fadeInUp}
                className="bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-xl border border-gray-100"
              >
                <div className="relative h-48 md:h-64">
                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                </div>
                <div className="p-5 md:p-6 flex flex-col gap-2 md:gap-3">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">{item.title}</h3>
                  <p className="text-gray-600 text-xs md:text-sm leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 bg-white/70">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[0.55fr,0.45fr] gap-8 md:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6 md:space-y-8"
          >
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-3 md:mb-4 px-2">Operations You Never Have To Touch</h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 px-2">
                Tapify functions as your ecommerce team. We run the full stack so your staff can keep focusing on in-store operations.
              </p>
            </div>
            <div className="space-y-3 md:space-y-4">
              {operations.map((item) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-lg p-5 md:p-6"
                >
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-600 text-xs md:text-sm leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative h-96 rounded-[28px] overflow-hidden shadow-2xl border border-white/40 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex flex-col justify-end">
              <video
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="absolute inset-0 w-full h-full object-cover opacity-70"
              >
                <source src="/images/video1.mp4" type="video/mp4" />
              </video>
              <div className="relative z-10 p-8 text-white">
                <div className="text-xs uppercase tracking-wider text-white/80 mb-2">Ops Snapshot</div>
                <div className="text-4xl font-black mb-2">0 inventory touches</div>
                <p className="text-sm text-white/85">
                  Tapify picks, packs, and ships every order. Your managers simply confirm placement and watch payouts climb.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 md:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-3 md:mb-4 px-2">Technology & Payout Infrastructure</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-2">
              Built on Tapify's platform stack: Supabase for real-time data, Shopify for ecommerce, and Dwolla for secure payouts.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
          >
            {techProof.map((item) => (
              <motion.div
                key={item.title}
                variants={fadeInUp}
                className="bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-xl p-5 md:p-6 flex flex-col gap-2 md:gap-3"
              >
                <h3 className="text-lg md:text-xl font-bold text-gray-900">{item.title}</h3>
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 bg-white/80">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 md:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-3 md:mb-4 px-2">Hear From Owners Already Live</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-2">
              Proven in Pet Supplies Plus and independent specialty retail. Owners see the upside in the first payout cycle.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
          >
            {testimonials.map((testimonial) => (
              <motion.div
                key={testimonial.name}
                variants={fadeInUp}
                className="bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-xl overflow-hidden"
              >
                <div className="relative h-48 md:h-64">
                  <Image
                    src={testimonial.image}
                    alt={`Pawpaya retailer testimonial - ${testimonial.name}`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 md:bottom-4 left-3 md:left-4 text-white">
                    <div className="text-base md:text-lg font-semibold">{testimonial.name}</div>
                    <div className="text-xs uppercase tracking-wide text-white/80">{testimonial.role}</div>
                  </div>
                </div>
                <div className="p-5 md:p-6">
                  <p className="text-gray-600 text-xs md:text-sm leading-relaxed">"{testimonial.quote}"</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8" id="faqs">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 md:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-3 md:mb-4 px-2">Owner FAQs</h2>
            <p className="text-base sm:text-lg text-gray-600 px-2">
              Straight answers so you can green-light the program confidently.
            </p>
          </motion.div>

          <div className="space-y-4 md:space-y-6">
            {faqs.map((faq) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-lg p-5 md:p-6"
              >
                <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-12 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#ff7a4a]/90 via-[#ff6fb3]/90 to-[#ff7a4a]/70 text-white">
        <div className="absolute inset-0 opacity-20">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 9, repeat: Infinity }}
            className="absolute top-0 left-0 w-80 h-80 bg-white rounded-full blur-3xl"
          />
          <motion.div
            animate={{ scale: [1.1, 0.95, 1.1] }}
            transition={{ duration: 11, repeat: Infinity }}
            className="absolute bottom-0 right-0 w-[22rem] h-[22rem] bg-white rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 lg:grid-cols-[0.6fr,0.4fr] gap-8 md:gap-12 items-center"
          >
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black leading-tight mb-4 md:mb-6 px-2">
                Ready to Approve Pawpaya For Your Franchise?
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-white/85 mb-6 md:mb-8 px-2">
                Give the green light today and your stores can be live in under a week. Displays stay fresh, staff stay focused, and your franchise captures ecommerce revenue it was missing.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 sm:items-center px-2">
                <Link href="/onboard/register">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white text-[#ff6fb3] px-8 md:px-10 py-4 md:py-5 rounded-2xl text-base md:text-lg font-black shadow-2xl border border-white/50 w-full sm:w-auto"
                  >
                    Activate Your Displays →
                  </motion.button>
                </Link>
                <Link href="mailto:oscar@tapify.com?subject=Pawpaya%20Display%20Program">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="px-8 md:px-10 py-4 md:py-5 rounded-2xl text-base md:text-lg font-bold border-2 border-white/70 text-white/90 backdrop-blur w-full sm:w-auto"
                  >
                    Talk With Tapify Ops
                  </motion.button>
                </Link>
              </div>
              <p className="text-xs md:text-sm text-white/70 mt-4 md:mt-6 px-2">
                Weekly payments • Cancel anytime • Replacement displays shipped free of charge
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white/15 backdrop-blur-lg rounded-2xl md:rounded-[28px] border border-white/20 p-5 md:p-6 shadow-2xl"
            >
              <h3 className="text-xs md:text-sm font-semibold text-white/80 uppercase tracking-wider mb-3">
                Quick Facts
              </h3>
              <ul className="space-y-2 md:space-y-3 text-xs md:text-sm text-white/85">
                <li>• 100% of ecommerce fulfilment managed by Tapify</li>
                <li>• Weekly payout statements tagged by store UID</li>
                <li>• Displays refreshed quarterly with new Pawpaya SKUs</li>
                <li>• Staff scripts + training cards included in every kit</li>
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
