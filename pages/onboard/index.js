import Link from 'next/link';

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

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#fff3ea] via-white to-[#fff6fb] py-16 md:py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-block bg-[#ff6fb3]/10 text-[#ff6fb3] px-4 py-2 rounded-full text-sm font-semibold mb-6">
              ✨ Free to Join • No Inventory Required
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Turn Your Store Into a{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3]">
                Revenue Machine
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Add NFC-powered product displays to your store and earn commissions on every sale. 
              <span className="font-semibold text-gray-900"> Zero inventory risk. Zero setup costs. 100% passive income.</span>
            </p>
          </div>

          {/* Value Props - Quick Glance */}
          <div className="flex flex-wrap justify-center gap-6 mb-10">
            <div className="flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-sm border border-gray-100">
              <span className="text-2xl">✅</span>
              <span className="font-medium text-gray-900">Free Displays</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-sm border border-gray-100">
              <span className="text-2xl">✅</span>
              <span className="font-medium text-gray-900">Passive Commissions</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-sm border border-gray-100">
              <span className="text-2xl">✅</span>
              <span className="font-medium text-gray-900">More Foot Traffic</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link 
              href="/onboard/register"
              className="bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white px-10 py-5 rounded-xl text-xl font-bold hover:shadow-xl transition-all transform hover:scale-105 shadow-lg w-full sm:w-auto text-center"
            >
              Get Started Free →
            </Link>
            <Link 
              href="#how-it-works"
              className="bg-white text-gray-700 px-10 py-5 rounded-xl text-xl font-semibold hover:bg-gray-50 transition-all border-2 border-gray-200 w-full sm:w-auto text-center"
            >
              See How It Works
            </Link>
          </div>

          {/* Social Proof Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#ff7a4a] mb-1">$2.8K</div>
              <div className="text-gray-600 text-sm">Avg. Monthly Earnings</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#ff6fb3] mb-1">500+</div>
              <div className="text-gray-600 text-sm">Active Stores</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#ff7a4a] mb-1">15-20%</div>
              <div className="text-gray-600 text-sm">Commission Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#ff6fb3] mb-1">$0</div>
              <div className="text-gray-600 text-sm">Setup Cost</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Store Owners Love Tapify
            </h2>
            <p className="text-xl text-gray-600">
              Join 500+ retailers earning passive income with zero risk
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, idx) => (
              <div 
                key={idx}
                className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-7 shadow-lg hover:shadow-xl transition-all border border-gray-100 relative overflow-hidden"
              >
                {/* Earnings Badge */}
                <div className="absolute top-4 right-4 bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white px-4 py-2 rounded-full text-sm font-bold shadow-md">
                  {testimonial.revenue}
                </div>

                <div className="flex items-start gap-3 mb-4 mt-8">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#ff7a4a] to-[#ff6fb3] flex items-center justify-center text-white font-bold text-lg shadow-md">
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
                    <svg key={i} className="w-5 h-5 text-[#ff7a4a]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Dead Simple Setup
            </h2>
            <p className="text-xl text-gray-600">
              From signup to earning in less than 7 days
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-12 left-0 right-0 h-1 bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] opacity-20" style={{ top: '48px' }}></div>

            <div className="relative text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#ff7a4a] to-[#ff6fb3] text-white rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-4 shadow-lg">
                1
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Sign Up</h3>
              <p className="text-gray-600">
                Quick form. Takes 3 minutes. No credit card needed.
              </p>
            </div>

            <div className="relative text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#ff7a4a] to-[#ff6fb3] text-white rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-4 shadow-lg">
                2
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Get Displays</h3>
              <p className="text-gray-600">
                We send you beautiful NFC displays with curated products.
              </p>
            </div>

            <div className="relative text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#ff7a4a] to-[#ff6fb3] text-white rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-4 shadow-lg">
                3
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Place & Profit</h3>
              <p className="text-gray-600">
                Put them in your store. Customers tap, shop, you earn.
              </p>
            </div>

            <div className="relative text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#ff7a4a] to-[#ff6fb3] text-white rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-4 shadow-lg">
                4
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Get Paid</h3>
              <p className="text-gray-600">
                Weekly payouts. Track everything in your dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Store Owners Choose Us
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to turn your space into a revenue stream
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, idx) => (
              <div 
                key={idx}
                className="bg-white rounded-xl p-6 border-2 border-gray-100 hover:border-[#ff6fb3] hover:shadow-lg transition-all"
              >
                <div className="text-5xl mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-[#ff7a4a] to-[#ff6fb3] text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Start Earning?
          </h2>
          <p className="text-2xl mb-8 opacity-95 font-medium">
            Join 500+ stores already earning passive income with Tapify displays
          </p>
          
          <Link 
            href="/onboard/register"
            className="inline-block bg-white text-[#ff6fb3] px-12 py-6 rounded-xl text-2xl font-bold hover:bg-gray-50 transition-all transform hover:scale-105 shadow-2xl mb-6"
          >
            Get Started Free →
          </Link>

          <div className="flex flex-col sm:flex-row gap-8 justify-center items-center mt-10 text-white/90">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Free Setup</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Cancel Anytime</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

