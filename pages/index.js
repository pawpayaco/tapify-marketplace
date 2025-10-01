import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [hoveredProduct, setHoveredProduct] = useState(null);

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const products = [
    {
      id: 1,
      title: 'Friendship Collars',
      description: 'Matching collars and bracelets for every kind of bestie. Your dog wears the collar, you wear the bracelet. Always connected.',
      gradient: 'from-pink-200 via-purple-200 to-indigo-200',
      icon: '🐾',
      features: ['Matching sets', 'Premium materials', 'Adjustable sizing']
    },
    {
      id: 2,
      title: 'DIY Boxes',
      description: 'Design your own custom friendship collar kit. Choose colors, charms, and styles to make it uniquely yours.',
      gradient: 'from-yellow-200 via-orange-200 to-pink-200',
      icon: '🎨',
      features: ['Customizable', 'Creative fun', 'Perfect gifts']
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Get Your Free Display',
      description: 'Retailers receive a beautiful NFC-powered display for their store. No upfront cost.',
      icon: '📦'
    },
    {
      number: '02',
      title: 'Customers Scan & Shop',
      description: 'Shoppers tap the display with their phone to browse and purchase Pawpaya products instantly.',
      icon: '📱'
    },
    {
      number: '03',
      title: 'Earn Commission',
      description: 'Track sales in real-time and receive automatic payouts for every purchase through your display.',
      icon: '💰'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 md:pt-20 pb-16 md:pb-32 px-4 md:px-6">
        <motion.div
          className="max-w-7xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.6 }}
        >
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Hero Text */}
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="inline-block mb-4 md:mb-6">
                  <span className="bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-bold shadow-lg">
                    🎉 Now Available for Retailers
                  </span>
                </div>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight">
                  Pawpaya
                  <br />
                  <span className="bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] bg-clip-text text-transparent">
                    Friendship Collars
                  </span>
      </h1>
                <p className="text-lg md:text-xl lg:text-2xl text-gray-600 mb-6 md:mb-8 leading-relaxed px-2 md:px-0">
                  Matching collars and bracelets for every kind of bestie. 
                  <br className="hidden md:block" />
                  Your dog wears the collar, you wear the bracelet.
                  <br className="hidden md:block" />
                  <span className="font-semibold text-gray-800">Always connected. 💕</span>
                </p>
                <div className="flex justify-center lg:justify-start">
                  <Link href="/onboard" className="w-full sm:w-auto">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full sm:w-auto bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white px-8 md:px-10 py-4 md:py-5 rounded-2xl font-bold text-lg md:text-xl shadow-xl hover:shadow-2xl transition-all"
                    >
                      Get Your Free Display 🚀
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            </div>

            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="relative mt-8 lg:mt-0"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-[#fff3ea] to-[#fff6fb] p-6 md:p-8 border-4 border-white">
                <div className="aspect-square flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl md:text-9xl mb-2 md:mb-4">🐕‍🦺</div>
                    <div className="text-4xl md:text-6xl">💕</div>
                    <div className="text-6xl md:text-9xl mt-2 md:mt-4">👤</div>
                    <p className="text-gray-600 font-semibold mt-4 md:mt-6 text-base md:text-xl">
                      Best Friends Forever
                    </p>
                  </div>
                </div>
              </div>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-3 -right-3 md:-top-4 md:-right-4 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full w-16 h-16 md:w-24 md:h-24 shadow-xl flex items-center justify-center text-2xl md:text-4xl"
              >
                ⭐
              </motion.div>
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="absolute -bottom-3 -left-3 md:-bottom-4 md:-left-4 bg-gradient-to-br from-pink-300 to-purple-400 rounded-full w-14 h-14 md:w-20 md:h-20 shadow-xl flex items-center justify-center text-xl md:text-3xl"
              >
                💖
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Our Products Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our Products ✨
            </h2>
            <p className="text-xl text-gray-600">
              Designed with love for you and your furry best friend
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                whileHover={{ scale: 1.03 }}
                onHoverStart={() => setHoveredProduct(product.id)}
                onHoverEnd={() => setHoveredProduct(null)}
              >
                <div className={`bg-gradient-to-br ${product.gradient} rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all border-4 border-white h-full`}>
                  <div className="text-6xl mb-6">{product.icon}</div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">
                    {product.title}
                  </h3>
                  <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                    {product.description}
                  </p>
                  <div className="space-y-2 mb-6">
                    {product.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span className="text-gray-700 font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white text-gray-800 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all w-full"
                  >
                    Learn More →
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How Pawpaya Works Section */}
      <section className="py-20 px-4 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How Pawpaya Works 🎯
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to start earning with Pawpaya displays
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                whileHover={{ y: -10 }}
              >
                <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all border-2 border-gray-100 h-full relative">
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                      {index + 1}
                    </div>
                  </div>
                  
                  <div className="text-6xl mb-6 mt-4 text-center">{step.icon}</div>
                  <div className="text-gray-400 font-mono text-sm mb-2 text-center">{step.number}</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-center leading-relaxed">
                    {step.description}
                  </p>
                </div>
                
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <div className="text-[#ff6fb3] text-3xl">→</div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* For Retailers Section */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-[#fff3ea] via-[#fff6fb] to-[#f0f4ff] rounded-3xl p-10 md:p-16 shadow-2xl border-4 border-white"
          >
            <div className="text-center">
              <div className="text-7xl mb-6">🏪</div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                For Retailers
              </h2>
              <p className="text-xl text-gray-700 mb-8 leading-relaxed max-w-3xl mx-auto">
                Join hundreds of retailers earning passive income with Pawpaya displays. 
                Get access to a powerful dashboard to track your performance, manage displays, 
                and receive automatic payouts.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                  <div className="text-4xl mb-3">📊</div>
                  <h3 className="font-bold text-gray-900 mb-2">Dashboard Access</h3>
                  <p className="text-gray-600 text-sm">Real-time analytics and insights</p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                  <div className="text-4xl mb-3">📈</div>
                  <h3 className="font-bold text-gray-900 mb-2">Sales Tracking</h3>
                  <p className="text-gray-600 text-sm">Monitor every scan and purchase</p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                  <div className="text-4xl mb-3">💳</div>
                  <h3 className="font-bold text-gray-900 mb-2">Automatic Payouts</h3>
                  <p className="text-gray-600 text-sm">Weekly commission deposits</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/onboard/dashboard">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all"
                  >
                    Open Retailer Dashboard
                  </motion.button>
                </Link>
                <Link href="/onboard">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white text-gray-800 px-10 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all border-2 border-gray-200 hover:border-[#ff6fb3]"
                  >
                    Sign Up Now
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof Stats */}
      <section className="py-20 px-4 bg-gradient-to-r from-[#ff7a4a]/10 to-[#ff6fb3]/10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid md:grid-cols-4 gap-8"
          >
            {[
              { number: '500+', label: 'Retail Partners', icon: '🏪' },
              { number: '50K+', label: 'Happy Customers', icon: '😊' },
              { number: '$2M+', label: 'Retailer Earnings', icon: '💰' },
              { number: '4.9★', label: 'Average Rating', icon: '⭐' }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-5xl mb-3">{stat.icon}</div>
                <div className="text-4xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
