import { useState } from 'react';
import Link from 'next/link';

export default function RetailerDashboard() {
  const [activeTab, setActiveTab] = useState('stats');

  // Mock data
  const kpis = {
    weeklyScans: 342,
    revenue: 2840,
    displaysClaimed: 4,
    conversionRate: 23.5,
    avgOrderValue: 47.20,
    topProduct: "Sunrise Soap Co."
  };

  const recentOrders = [
    { id: 'ORD-001', customer: 'Sarah M.', product: 'Lavender Soap Set', amount: 45.99, status: 'completed', date: '2025-09-28' },
    { id: 'ORD-002', customer: 'Michael T.', product: 'Cedar Candle', amount: 32.50, status: 'completed', date: '2025-09-28' },
    { id: 'ORD-003', customer: 'Emily R.', product: 'Ceramic Bowl', amount: 68.00, status: 'pending', date: '2025-09-29' },
    { id: 'ORD-004', customer: 'David L.', product: 'Handmade Mug', amount: 28.99, status: 'completed', date: '2025-09-29' },
    { id: 'ORD-005', customer: 'Jessica P.', product: 'Artisan Soap Bundle', amount: 55.00, status: 'completed', date: '2025-09-30' },
  ];

  const weeklyData = [
    { day: 'Mon', scans: 45, orders: 12, revenue: 380 },
    { day: 'Tue', scans: 52, orders: 15, revenue: 485 },
    { day: 'Wed', scans: 38, orders: 9, revenue: 320 },
    { day: 'Thu', scans: 61, orders: 18, revenue: 590 },
    { day: 'Fri', scans: 73, orders: 21, revenue: 680 },
    { day: 'Sat', scans: 48, orders: 14, revenue: 445 },
    { day: 'Sun', scans: 25, orders: 6, revenue: 240 },
  ];

  const topProducts = [
    { name: 'Lavender Soap Set', scans: 89, conversions: 24, revenue: 1104 },
    { name: 'Cedar Candle', scans: 67, conversions: 18, revenue: 585 },
    { name: 'Ceramic Bowl', scans: 54, conversions: 12, revenue: 816 },
    { name: 'Handmade Mug', scans: 42, conversions: 11, revenue: 319 },
  ];

  const maxScans = Math.max(...weeklyData.map(d => d.scans));
  const maxRevenue = Math.max(...weeklyData.map(d => d.revenue));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white py-8 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Retailer Dashboard</h1>
              <p className="text-white/90">Welcome back! Here's how your displays are performing.</p>
            </div>
            <div className="flex gap-3">
              <Link 
                href="/onboard"
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-semibold transition-all backdrop-blur-sm"
              >
                ← Back to Onboarding
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Weekly Scans */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">+12%</span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Weekly Scans</h3>
            <p className="text-3xl font-bold text-gray-900">{kpis.weeklyScans}</p>
            <p className="text-xs text-gray-500 mt-2">Last 7 days</p>
          </div>

          {/* Revenue */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#ff7a4a] to-[#ff6fb3] rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">+8%</span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Revenue Earned</h3>
            <p className="text-3xl font-bold text-gray-900">${kpis.revenue.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-2">This month</p>
          </div>

          {/* Displays Claimed */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">Active</span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Displays Active</h3>
            <p className="text-3xl font-bold text-gray-900">{kpis.displaysClaimed}</p>
            <p className="text-xs text-gray-500 mt-2">In your store</p>
          </div>

          {/* Conversion Rate */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">+3%</span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Conversion Rate</h3>
            <p className="text-3xl font-bold text-gray-900">{kpis.conversionRate}%</p>
            <p className="text-xs text-gray-500 mt-2">Scans to orders</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Tab Headers */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex gap-2 px-6 pt-6">
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-6 py-3 rounded-t-lg font-semibold transition-all ${
                  activeTab === 'stats'
                    ? 'bg-white text-[#ff6fb3] border-b-2 border-[#ff6fb3]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                📊 Stats & Analytics
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-3 rounded-t-lg font-semibold transition-all ${
                  activeTab === 'orders'
                    ? 'bg-white text-[#ff6fb3] border-b-2 border-[#ff6fb3]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                🛍️ Orders
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-6 py-3 rounded-t-lg font-semibold transition-all ${
                  activeTab === 'settings'
                    ? 'bg-white text-[#ff6fb3] border-b-2 border-[#ff6fb3]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                ⚙️ Settings
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <div className="space-y-8">
                {/* Weekly Performance Chart */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Weekly Performance</h3>
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100">
                    {/* Bar Chart - Scans */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-700">Scans per Day</h4>
                        <div className="text-sm text-gray-500">Max: {maxScans}</div>
                      </div>
                      <div className="flex items-end justify-between gap-2 h-48">
                        {weeklyData.map((day, idx) => (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full flex flex-col justify-end h-full">
                              <div
                                className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg hover:from-blue-600 hover:to-blue-500 transition-all cursor-pointer relative group"
                                style={{ height: `${(day.scans / maxScans) * 100}%` }}
                              >
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  {day.scans} scans
                                </div>
                              </div>
                            </div>
                            <span className="text-xs font-medium text-gray-600">{day.day}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Revenue Chart */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-700">Revenue per Day</h4>
                        <div className="text-sm text-gray-500">Max: ${maxRevenue}</div>
                      </div>
                      <div className="flex items-end justify-between gap-2 h-48">
                        {weeklyData.map((day, idx) => (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full flex flex-col justify-end h-full">
                              <div
                                className="w-full bg-gradient-to-t from-[#ff7a4a] to-[#ff6fb3] rounded-t-lg hover:opacity-80 transition-all cursor-pointer relative group"
                                style={{ height: `${(day.revenue / maxRevenue) * 100}%` }}
                              >
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  ${day.revenue}
                                </div>
                              </div>
                            </div>
                            <span className="text-xs font-medium text-gray-600">{day.day}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Products */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Top Performing Products</h3>
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Product</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Scans</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Conversions</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {topProducts.map((product, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3]"></div>
                                <span className="font-medium text-gray-900">{product.name}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                                {product.scans}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                                {product.conversions}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <span className="font-bold text-gray-900">${product.revenue.toLocaleString()}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Conversion Funnel */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Conversion Funnel</h3>
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-8 border border-gray-100">
                    <div className="space-y-4">
                      {/* Step 1 */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900">1. Display Scans</span>
                          <span className="font-bold text-gray-900">342</span>
                        </div>
                        <div className="h-10 bg-gradient-to-r from-blue-500 to-blue-400 rounded-lg w-full"></div>
                      </div>

                      {/* Step 2 */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900">2. Product Clicks</span>
                          <span className="font-bold text-gray-900">187 (54.7%)</span>
                        </div>
                        <div className="h-10 bg-gradient-to-r from-purple-500 to-purple-400 rounded-lg" style={{ width: '54.7%' }}></div>
                      </div>

                      {/* Step 3 */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900">3. Add to Cart</span>
                          <span className="font-bold text-gray-900">103 (30.1%)</span>
                        </div>
                        <div className="h-10 bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] rounded-lg" style={{ width: '30.1%' }}></div>
                      </div>

                      {/* Step 4 */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900">4. Completed Purchase</span>
                          <span className="font-bold text-gray-900">80 (23.5%)</span>
                        </div>
                        <div className="h-10 bg-gradient-to-r from-green-500 to-green-400 rounded-lg" style={{ width: '23.5%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Recent Orders</h3>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
                      Filter
                    </button>
                    <button className="px-4 py-2 bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all">
                      Export
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Order ID</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Customer</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Product</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm">Amount</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Status</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {recentOrders.map((order, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            <span className="font-mono text-sm font-semibold text-gray-900">{order.id}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-gray-900">{order.customer}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-gray-700">{order.product}</span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="font-bold text-gray-900">${order.amount}</span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              order.status === 'completed' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right text-sm text-gray-600">
                            {order.date}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-gray-600">Showing 1-5 of 87 orders</p>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
                      Previous
                    </button>
                    <button className="px-4 py-2 bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">Store Settings</h3>

                {/* Store Information */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-4">Store Information</h4>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Store Name</label>
                        <input
                          type="text"
                          defaultValue="Urban Goods Market"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                        <input
                          type="email"
                          defaultValue="owner@urbangoods.com"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Store Address</label>
                      <textarea
                        rows={2}
                        defaultValue="123 Main Street, San Francisco, CA 94102"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Notification Preferences */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-4">Notification Preferences</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-5 h-5 text-[#ff6fb3] rounded focus:ring-[#ff6fb3]" />
                      <span className="text-gray-700">Email me when a new order is placed</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-5 h-5 text-[#ff6fb3] rounded focus:ring-[#ff6fb3]" />
                      <span className="text-gray-700">Weekly performance summary</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-5 h-5 text-[#ff6fb3] rounded focus:ring-[#ff6fb3]" />
                      <span className="text-gray-700">Product rotation updates</span>
                    </label>
                  </div>
                </div>

                {/* Payout Settings */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-4">Payout Settings</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payout Method</label>
                      <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent">
                        <option>Bank Transfer (ACH)</option>
                        <option>PayPal</option>
                        <option>Stripe</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payout Frequency</label>
                      <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent">
                        <option>Weekly</option>
                        <option>Bi-weekly</option>
                        <option>Monthly</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <button className="w-full bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white py-3 px-6 rounded-xl font-bold text-lg hover:shadow-xl transition-all">
                  Save Settings
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
