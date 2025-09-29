// File: /pages/admin.js
import { useState } from 'react';

const sections = ['Vendors', 'Retailers', 'Analytics', 'Sourcing Agents', 'Affiliates', 'Leaderboard'];

const dummyData = {
  Vendors: [
    { name: 'Luna Collars', platform: 'Etsy', earnings: '$1,280' },
    { name: 'Oak & Paw', platform: 'Shopify', earnings: '$980' },
  ],
  Retailers: [
    { name: 'Pet Supplies Plus - Chicago', displays: 3, revenue: '$745' },
    { name: 'Pawfect Groomers - LA', displays: 1, revenue: '$210' },
  ],
  Analytics: {
    totalSales: 84,
    conversionRate: '12%',
    totalRevenue: '$4,985',
    scanHeatmap: '🔴🟡🟢' // Placeholder
  },
  'Sourcing Agents': [
    { name: 'Jenna (jenna@tapify.com)', vendors: 8, earned: '$320' },
    { name: 'Kai (kai@tapify.com)', vendors: 12, earned: '$540' },
  ],
  Affiliates: [
    { uid: '04a7d2', clicks: 45, conversions: 12, revenue: '$385' },
    { uid: '1f9c31', clicks: 23, conversions: 6, revenue: '$160' },
  ],
  Leaderboard: [
    { rank: 1, name: 'Kai', revenue: '$1,210' },
    { rank: 2, name: 'Jenna', revenue: '$820' },
  ]
};

export default function Admin() {
  const [activeSection, setActiveSection] = useState('Vendors');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef9f5] to-[#ffe9f0] p-6 text-[#333] font-sans">
      <h1 className="text-3xl font-bold text-[#ff60a5] mb-4">Tapify Command Center</h1>

      <div className="flex space-x-3 mb-6">
        {sections.map((sec) => (
          <button
            key={sec}
            onClick={() => setActiveSection(sec)}
            className={`px-4 py-2 rounded-full border ${
              activeSection === sec
                ? 'bg-[#ff60a5] text-white'
                : 'bg-white text-[#ff60a5] border-[#ff60a5]'
            }`}
          >
            {sec}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-3 text-[#ff60a5]">{activeSection}</h2>

        {/* Renders section content */}
        {renderSection(activeSection)}
      </div>
    </div>
  );
}

function renderSection(section) {
  const data = dummyData[section];

  if (Array.isArray(data)) {
    return (
      <table className="w-full text-left">
        <thead>
          <tr>
            {Object.keys(data[0]).map((key) => (
              <th key={key} className="py-2 border-b text-sm text-gray-600">
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-[#fff5fa]">
              {Object.values(row).map((val, j) => (
                <td key={j} className="py-2 border-b text-sm">
                  {val}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (typeof data === 'object') {
    return (
      <div className="text-sm grid grid-cols-2 gap-4">
        {Object.entries(data).map(([k, v]) => (
          <div key={k} className="bg-[#fff5fa] p-4 rounded-md shadow">
            <strong className="block text-[#ff60a5]">{k}</strong>
            <span>{v}</span>
          </div>
        ))}
      </div>
    );
  }

  return <div className="text-sm">No data</div>;
}
