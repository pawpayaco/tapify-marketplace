import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function RetailerDashboard() {
  const [activeTab, setActiveTab] = useState('stats');

  // Mock data - New display with no activity yet
  const kpis = {
    weeklyScans: 0,
    revenue: 0,
    displaysClaimed: 1,
    conversionRate: 0,
    avgOrderValue: 0,
    topProduct: "No data yet"
  };

  const recentOrders = [];

  const weeklyData = [
    { day: 'Mon', scans: 0, orders: 0, revenue: 0 },
    { day: 'Tue', scans: 0, orders: 0, revenue: 0 },
    { day: 'Wed', scans: 0, orders: 0, revenue: 0 },
    { day: 'Thu', scans: 0, orders: 0, revenue: 0 },
    { day: 'Fri', scans: 0, orders: 0, revenue: 0 },
    { day: 'Sat', scans: 0, orders: 0, revenue: 0 },
    { day: 'Sun', scans: 0, orders: 0, revenue: 0 },
  ];

  const topProducts = [];

  const maxScans = Math.max(...weeklyData.map(d => d.scans), 1);
  const maxRevenue = Math.max(...weeklyData.map(d => d.revenue), 1);

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
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
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white py-12 px-6 shadow-lg relative overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-4xl md:text-5xl font-bold mb-2"
              >
                Your Dashboard 📊
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-white/90 text-lg"
              >
                Welcome back! Here's how your displays are performing.
              </motion.p>
            </div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex gap-3"
            >
              <Link 
                href="/"
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold transition-all backdrop-blur-sm hover:scale-105"
              >
                ← Home
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI Cards */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {/* Weekly Scans */}
          <motion.div 
            variants={fadeInUp}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white rounded-3xl p-6 shadow-lg border-2 border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full font-bold">New</span>
            </div>
            <h3 className="text-gray-600 text-sm font-semibold mb-1">Weekly Scans</h3>
            <p className="text-4xl font-bold text-gray-900 mb-1">{kpis.weeklyScans}</p>
            <p className="text-xs text-gray-500">Last 7 days</p>
          </motion.div>

          {/* Revenue */}
          <motion.div 
            variants={fadeInUp}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white rounded-3xl p-6 shadow-lg border-2 border-gray-100 hover:border-pink-200 hover:shadow-xl transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#ff7a4a] to-[#ff6fb3] rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full font-bold">New</span>
            </div>
            <h3 className="text-gray-600 text-sm font-semibold mb-1">Revenue Earned</h3>
            <p className="text-4xl font-bold text-gray-900 mb-1">${kpis.revenue.toLocaleString()}</p>
            <p className="text-xs text-gray-500">This month</p>
          </motion.div>

          {/* Displays Claimed */}
          <motion.div 
            variants={fadeInUp}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white rounded-3xl p-6 shadow-lg border-2 border-gray-100 hover:border-purple-200 hover:shadow-xl transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-bold">Active</span>
            </div>
            <h3 className="text-gray-600 text-sm font-semibold mb-1">Displays Active</h3>
            <p className="text-4xl font-bold text-gray-900 mb-1">{kpis.displaysClaimed}</p>
            <p className="text-xs text-gray-500">In your store</p>
          </motion.div>

          {/* Conversion Rate */}
          <motion.div 
            variants={fadeInUp}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white rounded-3xl p-6 shadow-lg border-2 border-gray-100 hover:border-green-200 hover:shadow-xl transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full font-bold">New</span>
            </div>
            <h3 className="text-gray-600 text-sm font-semibold mb-1">Conversion Rate</h3>
            <p className="text-4xl font-bold text-gray-900 mb-1">{kpis.conversionRate}%</p>
            <p className="text-xs text-gray-500">Scans to orders</p>
          </motion.div>
        </motion.div>

        {/* Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 overflow-hidden"
        >
          {/* Tab Headers */}
          <div className="border-b-2 border-gray-100 bg-gradient-to-r from-pink-50 to-purple-50">
            <div className="flex gap-2 px-6 pt-6 pb-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('stats')}
                className={`px-6 py-3 rounded-t-2xl font-bold transition-all ${
                  activeTab === 'stats'
                    ? 'bg-white text-[#ff6fb3] shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                📊 Stats & Analytics
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-3 rounded-t-2xl font-bold transition-all ${
                  activeTab === 'orders'
                    ? 'bg-white text-[#ff6fb3] shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                🛍️ Orders
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('settings')}
                className={`px-6 py-3 rounded-t-2xl font-bold transition-all ${
                  activeTab === 'settings'
                    ? 'bg-white text-[#ff6fb3] shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                ⚙️ Settings
              </motion.button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Weekly Performance Chart */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Weekly Performance</h3>
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border-2 border-gray-100">
                    {/* Bar Chart - Scans */}
                    <div className="mb-10">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-gray-700 text-lg">Scans per Day</h4>
                        <div className="text-sm text-gray-500">Max: {maxScans}</div>
                      </div>
                      <div className="flex items-end justify-between gap-2 h-48">
                        {weeklyData.map((day, idx) => (
                          <motion.div 
                            key={idx} 
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            className="flex-1 flex flex-col items-center gap-2"
                          >
                            <div className="w-full flex flex-col justify-end h-full">
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-xl hover:from-blue-600 hover:to-blue-500 transition-all cursor-pointer relative group shadow-lg"
                                style={{ height: `${(day.scans / maxScans) * 100}%` }}
                              >
                                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-semibold shadow-lg">
                                  {day.scans} scans
                                </div>
                              </motion.div>
                            </div>
                            <span className="text-sm font-bold text-gray-600">{day.day}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Revenue Chart */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-gray-700 text-lg">Revenue per Day</h4>
                        <div className="text-sm text-gray-500">Max: ${maxRevenue}</div>
                      </div>
                      <div className="flex items-end justify-between gap-2 h-48">
                        {weeklyData.map((day, idx) => (
                          <motion.div 
                            key={idx}
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            transition={{ duration: 0.5, delay: idx * 0.1 + 0.3 }}
                            className="flex-1 flex flex-col items-center gap-2"
                          >
                            <div className="w-full flex flex-col justify-end h-full">
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                className="w-full bg-gradient-to-t from-[#ff7a4a] to-[#ff6fb3] rounded-t-xl hover:opacity-90 transition-all cursor-pointer relative group shadow-lg"
                                style={{ height: `${(day.revenue / maxRevenue) * 100}%` }}
                              >
                                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-semibold shadow-lg">
                                  ${day.revenue}
                                </div>
                              </motion.div>
                            </div>
                            <span className="text-sm font-bold text-gray-600">{day.day}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Products */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Top Performing Products</h3>
                  <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-lg">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-pink-50 to-purple-50">
                        <tr>
                          <th className="text-left py-4 px-6 font-bold text-gray-700">Product</th>
                          <th className="text-center py-4 px-6 font-bold text-gray-700">Scans</th>
                          <th className="text-center py-4 px-6 font-bold text-gray-700">Conversions</th>
                          <th className="text-right py-4 px-6 font-bold text-gray-700">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {topProducts.length > 0 ? (
                          topProducts.map((product, idx) => (
                            <motion.tr 
                              key={idx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: idx * 0.1 }}
                              whileHover={{ backgroundColor: '#fafafa' }}
                              className="transition-colors"
                            >
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3]"></div>
                                  <span className="font-semibold text-gray-900">{product.name}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <span className="inline-block bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold">
                                  {product.scans}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <span className="inline-block bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-bold">
                                  {product.conversions}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right">
                                <span className="font-bold text-gray-900">${product.revenue.toLocaleString()}</span>
                              </td>
                            </motion.tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="py-20 text-center">
                              <div className="flex flex-col items-center gap-4">
                                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-gray-900 font-bold text-lg mb-1">No product data yet</p>
                                  <p className="text-gray-500">Product performance will show here once you have scans</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Recent Orders</h3>
                  <div className="flex gap-3">
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold transition-all"
                    >
                      Filter
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-5 py-2.5 bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all"
                    >
                      Export
                    </motion.button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-lg">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-pink-50 to-purple-50">
                      <tr>
                        <th className="text-left py-4 px-6 font-bold text-gray-700">Order ID</th>
                        <th className="text-left py-4 px-6 font-bold text-gray-700">Customer</th>
                        <th className="text-left py-4 px-6 font-bold text-gray-700">Product</th>
                        <th className="text-right py-4 px-6 font-bold text-gray-700">Amount</th>
                        <th className="text-center py-4 px-6 font-bold text-gray-700">Status</th>
                        <th className="text-right py-4 px-6 font-bold text-gray-700">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.length > 0 ? (
                        recentOrders.map((order, idx) => (
                          <motion.tr 
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.1 }}
                            whileHover={{ backgroundColor: '#fafafa' }}
                            className="border-t border-gray-100"
                          >
                            <td className="py-4 px-6">
                              <span className="font-mono text-sm font-bold text-gray-900">{order.id}</span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-gray-900 font-medium">{order.customer}</span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-gray-700">{order.product}</span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <span className="font-bold text-gray-900">${order.amount}</span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold ${
                                order.status === 'completed' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right text-sm text-gray-600 font-medium">
                              {order.date}
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="py-20 text-center">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-gray-900 font-bold text-lg mb-1">No orders yet</p>
                                <p className="text-gray-500">Orders will appear here once customers start purchasing</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <h3 className="text-2xl font-bold text-gray-900">Store Settings</h3>

                {/* Store Information */}
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border-2 border-gray-100 hover:border-gray-200 transition-all shadow-lg"
                >
                  <h4 className="font-bold text-gray-900 text-lg mb-6">Store Information</h4>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Store Name</label>
                        <input
                          type="text"
                          defaultValue="Urban Goods Market"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Contact Email</label>
                        <input
                          type="email"
                          defaultValue="owner@urbangoods.com"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Store Address</label>
                      <textarea
                        rows={2}
                        defaultValue="123 Main Street, San Francisco, CA 94102"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent resize-none transition-all"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Notification Preferences */}
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border-2 border-gray-100 hover:border-gray-200 transition-all shadow-lg"
                >
                  <h4 className="font-bold text-gray-900 text-lg mb-6">Notification Preferences</h4>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" defaultChecked className="w-5 h-5 text-[#ff6fb3] rounded focus:ring-[#ff6fb3]" />
                      <span className="text-gray-700 font-medium group-hover:text-gray-900 transition-colors">Email me when a new order is placed</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" defaultChecked className="w-5 h-5 text-[#ff6fb3] rounded focus:ring-[#ff6fb3]" />
                      <span className="text-gray-700 font-medium group-hover:text-gray-900 transition-colors">Weekly performance summary</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" className="w-5 h-5 text-[#ff6fb3] rounded focus:ring-[#ff6fb3]" />
                      <span className="text-gray-700 font-medium group-hover:text-gray-900 transition-colors">Product rotation updates</span>
                    </label>
                  </div>
                </motion.div>

                {/* Payout Settings */}
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border-2 border-gray-100 hover:border-gray-200 transition-all shadow-lg"
                >
                  <h4 className="font-bold text-gray-900 text-lg mb-6">Payout Settings</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Payout Method</label>
                      <select className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all">
                        <option>Bank Transfer (ACH)</option>
                        <option>PayPal</option>
                        <option>Stripe</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Payout Frequency</label>
                      <select className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all">
                        <option>Weekly</option>
                        <option>Bi-weekly</option>
                        <option>Monthly</option>
                      </select>
                    </div>
                  </div>
                </motion.div>

                {/* Save Button */}
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white py-4 px-6 rounded-2xl font-bold text-lg hover:shadow-xl transition-all"
                >
                  Save Settings
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
