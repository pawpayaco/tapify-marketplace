import Link from 'next/link';
import { motion } from 'framer-motion';

export default function RetailerOnboardLanding() {
  const testimonials = [
    {
      name: "Jessica Martinez",
      store: "Urban Goods - San Francisco",
      location: "SF Bay Area",
      text: "We added 4 Tapify displays last month and saw a 40% increase in foot traffic. Customers love discovering new brands, and we're earning passive commissions with zero inventory risk!",
      revenue: "$3,200/mo",
      avatar: "JM"
    },
    {
      name: "David Thompson",
      store: "Green Market Austin",
      location: "Austin, TX",
      text: "This was a no-brainer. Free displays, curated products that fit our vibe, and we're making money while our customers discover amazing local brands. Win-win-win.",
      revenue: "$2,800/mo",
      avatar: "DT"
    },
    {
      name: "Alicia Chen",
      store: "The Corner Store",
      location: "Portland, OR",
      text: "I was skeptical at first, but the NFC tech is so seamless. Customers tap, shop, we earn. It's literally the easiest revenue stream we've added to our store.",
      revenue: "$4,100/mo",
      avatar: "AC"
    }
  ];

  const benefits = [
    {
      icon: "💰",
      title: "Earn Passive Income",
      description: "Get paid commissions on every sale generated from your displays. No inventory, no risk, pure profit."
    },
    {
      icon: "📈",
      title: "Increase Foot Traffic",
      description: "Customers come in to see new brands and products. More visitors = more opportunities for your existing business."
    },
    {
      icon: "🎯",
      title: "Zero Setup Costs",
      description: "We provide the displays, the products, and the technology. You just provide the space. 100% free to start."
    },
    {
      icon: "📱",
      title: "Modern NFC Technology",
      description: "Customers tap their phone and instantly access product info and checkout. No apps, no friction, just sales."
    },
    {
      icon: "🔄",
      title: "Fresh Content Monthly",
      description: "We rotate products and displays to keep things fresh and engaging for your customers."
    },
    {
      icon: "📊",
      title: "Real-Time Analytics",
      description: "Track scans, conversions, and earnings with our simple dashboard. Know what's working."
    }
  ];

  const steps = [
    { number: 1, title: "Sign Up", description: "Quick form. Takes 3 minutes. No credit card needed." },
    { number: 2, title: "Get Displays", description: "We send you beautiful NFC displays with curated products." },
    { number: 3, title: "Place & Profit", description: "Put them in your store. Customers tap, shop, you earn." },
    { number: 4, title: "Get Paid", description: "Weekly payouts. Track everything in your dashboard." }
  ];

  const stats = [
    { value: "$2.8K", label: "Avg. Monthly Earnings", color: "text-[#ff7a4a]" },
    { value: "500+", label: "Active Stores", color: "text-[#ff6fb3]" },
    { value: "15-20%", label: "Commission Rate", color: "text-[#ff7a4a]" },
    { value: "$0", label: "Setup Cost", color: "text-[#ff6fb3]" }
  ];

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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32 px-6">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0]
            }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full blur-3xl opacity-30"
          />
          <motion.div
            animate={{ 
              scale: [1, 1.3, 1],
              rotate: [0, -90, 0]
            }}
            transition={{ duration: 25, repeat: Infinity }}
            className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full blur-3xl opacity-30"
          />
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-block bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white px-6 py-2 rounded-full text-sm font-bold mb-8 shadow-lg"
            >
              ✨ Free to Join • No Inventory Required
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight"
            >
              Turn Your Store Into a{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3]">
                Revenue Machine
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed"
            >
              Add NFC-powered product displays to your store and earn commissions on every sale. 
              <span className="font-semibold text-gray-900"> Zero inventory risk. Zero setup costs. 100% passive income.</span>
            </motion.p>
          </div>

          {/* Value Props - Quick Glance */}
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap justify-center gap-4 mb-12"
          >
            {['Free Displays', 'Passive Commissions', 'More Foot Traffic'].map((prop, idx) => (
              <motion.div 
                key={idx}
                variants={fadeInUp}
                whileHover={{ scale: 1.05, y: -2 }}
                className="flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-lg border-2 border-gray-100 hover:border-[#ff6fb3] transition-all"
              >
                <span className="text-2xl">✅</span>
                <span className="font-bold text-gray-900">{prop}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <Link href="/onboard/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white px-10 py-5 rounded-2xl text-xl font-bold shadow-2xl w-full sm:w-auto"
              >
                Get Started Free →
              </motion.button>
            </Link>
            <Link href="#how-it-works">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-gray-700 px-10 py-5 rounded-2xl text-xl font-bold border-2 border-gray-200 hover:border-gray-300 shadow-lg w-full sm:w-auto"
              >
                See How It Works
              </motion.button>
            </Link>
          </motion.div>

          {/* Social Proof Stats */}
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-4xl mx-auto"
          >
            {stats.map((stat, idx) => (
              <motion.div 
                key={idx}
                variants={fadeInUp}
                whileHover={{ scale: 1.1, y: -5 }}
                className="text-center bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100"
              >
                <div className={`text-4xl md:text-5xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
                <div className="text-gray-600 text-sm font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Store Owners Love Pawpaya
            </h2>
            <p className="text-xl text-gray-600">
              Join 500+ retailers earning passive income with zero risk
            </p>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6"
          >
            {testimonials.map((testimonial, idx) => (
              <motion.div 
                key={idx}
                variants={fadeInUp}
                whileHover={{ scale: 1.03, y: -5 }}
                className="bg-white rounded-3xl p-8 shadow-xl border-2 border-gray-100 relative overflow-hidden"
              >
                {/* Earnings Badge */}
                <motion.div 
                  initial={{ scale: 0, rotate: -45 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 + 0.3 }}
                  className="absolute top-4 right-4 bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg"
                >
                  {testimonial.revenue}
                </motion.div>

                <div className="flex items-start gap-3 mb-4 mt-8">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#ff7a4a] to-[#ff6fb3] flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {testimonial.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 text-lg">{testimonial.name}</div>
                    <div className="text-sm font-semibold text-gray-700">{testimonial.store}</div>
                    <div className="text-xs text-gray-500 mt-1">📍 {testimonial.location}</div>
                  </div>
                </div>

                <p className="text-gray-700 leading-relaxed mb-4">
                  "{testimonial.text}"
                </p>

                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <motion.svg 
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: idx * 0.1 + i * 0.05 }}
                      className="w-5 h-5 text-[#ff7a4a]" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </motion.svg>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 bg-gradient-to-br from-white to-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Dead Simple Setup
            </h2>
            <p className="text-xl text-gray-600">
              From signup to earning in less than 7 days
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-12 left-0 right-0 h-1 bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] opacity-20" style={{ top: '48px' }}></div>

            {steps.map((step, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -10 }}
                className="relative text-center"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 + 0.2, type: "spring" }}
                  className="w-24 h-24 bg-gradient-to-br from-[#ff7a4a] to-[#ff6fb3] text-white rounded-3xl flex items-center justify-center text-4xl font-bold mx-auto mb-6 shadow-2xl"
                >
                  {step.number}
                </motion.div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{step.title}</h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-20 px-6 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Store Owners Choose Us
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to turn your space into a revenue stream
            </p>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {benefits.map((benefit, idx) => (
              <motion.div 
                key={idx}
                variants={fadeInUp}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white rounded-3xl p-8 border-2 border-gray-100 hover:border-[#ff6fb3] shadow-xl transition-all"
              >
                <div className="text-6xl mb-6">{benefit.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-[#ff7a4a] to-[#ff6fb3] text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"
          />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Ready to Start Earning?
          </h2>
          <p className="text-2xl mb-10 opacity-95 font-medium">
            Join 500+ stores already earning passive income with Pawpaya displays
          </p>
          
          <Link href="/onboard/register">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block bg-white text-[#ff6fb3] px-12 py-6 rounded-2xl text-2xl font-bold hover:bg-gray-50 transition-all shadow-2xl mb-8"
            >
              Get Started Free →
            </motion.button>
          </Link>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-8 justify-center items-center mt-10 text-white/90"
          >
            {['No Credit Card Required', 'Free Setup', 'Cancel Anytime'].map((text, idx) => (
              <motion.div 
                key={idx}
                variants={fadeInUp}
                className="flex items-center gap-2"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-bold">{text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
