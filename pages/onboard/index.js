import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';

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
      title: "Guaranteed Extra Revenue",
      description: "Earn $1,500-$3,000 monthly with zero risk. No inventory to buy, no staff to train, no extra work."
    },
    {
      title: "Works With Your Existing Store",
      description: "Simply place displays in your store. Customers discover products while shopping for pet supplies."
    },
    {
      title: "No Setup Required",
      description: "We handle everything. Displays arrive ready to use. You just put them out and start earning."
    },
    {
      title: "Simple for Customers",
      description: "Customers tap their phone on displays to learn about products. No apps to download, no complicated process."
    },
    {
      title: "Set It and Forget It",
      description: "Displays work automatically. We update products monthly. You focus on running your store."
    },
    {
      title: "Track Your Earnings",
      description: "Simple dashboard shows exactly how much you're earning. Weekly payouts to your bank account."
    }
  ];

  const steps = [
    { number: 1, title: "Simple Registration", description: "Fill out basic store information. No payment required. Takes 5 minutes." },
    { number: 2, title: "Receive Displays", description: "We ship professional displays to your store. Everything included, ready to use." },
    { number: 3, title: "Place and Earn", description: "Put displays in your store. They work automatically. You earn from every sale." },
    { number: 4, title: "Get Paid Weekly", description: "Money goes directly to your bank account. Track earnings in your dashboard." }
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 pt-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24 px-4 sm:px-6 lg:px-8">
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

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-12">
            {/* Left side - Text content */}
            <div className="text-center lg:text-left">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-block bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white px-6 py-3 rounded-full text-sm font-bold mb-8 shadow-2xl"
              >
                ✅ Proven System • No Risk • No Extra Work
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-5xl md:text-7xl font-black text-gray-900 mb-6 leading-none"
              >
                The{' '}
                <span className="bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] bg-clip-text text-transparent">
                  Easiest Profit
                </span>
                <br />
                You'll Ever Make
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed font-medium"
              >
                Simple product displays that work while you run your store. 
                <br />
                <span className="font-bold text-gray-900">No staff training. No inventory. No risk. Just extra revenue.</span>
              </motion.p>
            </div>

            {/* Right side - Hero image */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative"
            >
              <div className="relative w-full h-96 lg:h-[500px] rounded-3xl overflow-hidden shadow-2xl">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  className="w-full h-full object-cover"
                >
                  <source src="/images/video1.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </motion.div>
          </div>

          {/* Value Props - Quick Glance */}
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap justify-center gap-4 mb-12"
          >
            {['No Setup Required', 'Guaranteed Revenue', 'Works Automatically'].map((prop, idx) => (
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
                className="bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white px-12 py-6 rounded-2xl text-xl font-bold shadow-2xl hover:shadow-3xl w-full sm:w-auto border border-white/20"
              >
                Start Earning Extra Revenue →
              </motion.button>
            </Link>
            <Link href="#how-it-works">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white/90 backdrop-blur-sm text-gray-700 px-12 py-6 rounded-2xl text-xl font-bold border-2 border-gray-300 hover:border-gray-400 shadow-xl hover:shadow-2xl w-full sm:w-auto"
              >
                Learn More
              </motion.button>
            </Link>
          </motion.div>

          {/* Social Proof Stats */}
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mt-20 max-w-5xl mx-auto"
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
      <section className="py-20 px-6 bg-white/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-4"
          >
            <div className="inline-block bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-full text-green-700 font-bold text-sm mb-4 border-2 border-green-200">
              ⭐ Loved by 500+ Store Owners
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Store Owners Love Pawpaya
            </h2>
            <p className="text-xl text-gray-600 font-medium">
              Join 500+ retailers earning passive income with zero risk
            </p>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {testimonials.map((testimonial, idx) => {
              // Map testimonials to customer images
              const customerImages = [
                "/images/image10.webp", // CEELY dog for Jessica
                "/images/image16.jpeg", // Outdoor dog for David  
                "/images/image17.jpeg"  // Bulldog in chair for Alicia
              ];
              
              return (
                <motion.div 
                  key={idx}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.03, y: -5 }}
                  className="bg-white rounded-3xl p-8 shadow-xl border-2 border-gray-100 relative overflow-hidden"
                >
                  {/* Earnings Badge */}

                  {/* Customer Image */}
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden mb-4 mt-8">
                    <Image
                      src={customerImages[idx]}
                      alt={`Happy Pawpaya customer - ${testimonial.name}`}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <div className="absolute bottom-2 left-2 text-white text-xs font-medium">
                      Happy Pawpaya Customer
                    </div>
                  </div>

                  <div className="flex items-start gap-3 mb-4">
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
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Dead Simple Setup
            </h2>
            <p className="text-xl text-gray-600 font-medium">
              From signup to earning in less than 7 days
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
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
      <section className="py-20 px-6 bg-white/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Why Store Owners Choose Us
            </h2>
            <p className="text-xl text-gray-600 font-medium">
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
            {benefits.map((benefit, idx) => {
              return (
                <motion.div 
                  key={idx}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-white rounded-3xl p-8 border-2 border-gray-100 hover:border-[#ff6fb3] shadow-xl transition-all"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                </motion.div>
              );
            })}
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
          className="max-w-6xl mx-auto relative z-10"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Product image */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative w-full h-80 rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/image4.webp"
                  alt="COOPER patriotic collar and bracelet set - example of Pawpaya products"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-sm font-medium">COOPER Collection</p>
                  <p className="text-xs opacity-90">Patriotic Style</p>
                </div>
              </div>
            </motion.div>

            {/* Right side - Text content */}
            <div className="text-center lg:text-left">
              <h2 className="text-4xl md:text-6xl font-bold mb-6">
                Ready to Add Extra Revenue?
              </h2>
              <p className="text-2xl mb-10 opacity-95 font-medium">
                Join 500+ store owners earning $2,000+ monthly with simple displays
              </p>
              
              <Link href="/onboard/register">
                <motion.button
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-block bg-white text-[#ff6fb3] px-14 py-7 rounded-2xl text-2xl font-black hover:bg-gray-50 transition-all shadow-2xl hover:shadow-3xl mb-8 border-2 border-white/50"
                >
                  Start Earning Extra Revenue →
                </motion.button>
              </Link>

              {/* Customer proof image */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="relative w-full h-48 rounded-2xl overflow-hidden shadow-xl"
              >
                <Image
                  src="/images/image10.webp"
                  alt="Happy dog wearing CEELY collar - proof customers love Pawpaya products"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-3 left-3 text-white">
                  <p className="text-sm font-medium">Happy Customers</p>
                  <p className="text-xs opacity-90">Real results, real revenue</p>
                </div>
              </motion.div>
            </div>
          </div>

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
