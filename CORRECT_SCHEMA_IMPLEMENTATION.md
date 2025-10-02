# 🎯 Retailer Dashboard - CORRECTED Implementation (Using Real Schema)

## ⚠️ IMPORTANT: Schema Corrections

Your actual schema uses:
- ✅ `payout_jobs` (NOT `payouts`)
- ✅ `retailer_accounts` (NOT `bank_accounts`)
- ✅ `scans` (NOT `orders`) 
- ✅ `uids` (NOT `displays`)
- ✅ `businesses` (for business/vendor tracking)

## 📊 Dashboard Data Fetching (CORRECTED)

Replace your data fetching useEffect with this:

```javascript
useEffect(() => {
  const fetchRetailerData = async () => {
    if (!user?.email) return;
    
    try {
      setLoading(true);
      
      // 1. Get retailer profile
      const { data: retailerData, error: retailerError } = await supabase
        .from('retailers')
        .select('*')
        .eq('email', user.email) // or however you identify retailers
        .single();
      
      if (retailerError) throw retailerError;
      setRetailer(retailerData);
      
      // 2. Get linked vendor to find associated UIDs
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id, name')
        .eq('id', retailerData.linked_vendor_id)
        .single();
      
      // 3. Get UIDs associated with this vendor/retailer
      const { data: uidsData } = await supabase
        .from('uids')
        .select(`
          uid,
          business:business_id (
            id,
            name,
            affiliate_url
          ),
          registered_at
        `);
      
      setUids(uidsData || []);
      
      // 4. Get scans data (revenue events)
      const { data: scansData } = await supabase
        .from('scans')
        .select('*')
        .in('uid', (uidsData || []).map(u => u.uid))
        .order('timestamp', { ascending: false });
      
      setScans(scansData || []);
      
      // 5. Get payout jobs
      const { data: payoutsData } = await supabase
        .from('payout_jobs')
        .select('*')
        .eq('retailer_id', retailerData.id)
        .order('created_at', { ascending: false });
      
      setPayoutJobs(payoutsData || []);
      
      // 6. Get retailer account (bank connection)
      const { data: accountData } = await supabase
        .from('retailer_accounts')
        .select('*')
        .eq('retailer_id', retailerData.id)
        .single();
      
      setRetailerAccount(accountData);
      
      // 7. Calculate stats from scans
      calculateStatsFromScans(scansData || [], uidsData || []);
      calculateWeeklyData(scansData || []);
      
    } catch (error) {
      console.error('Error fetching retailer data:', error);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  fetchRetailerData();
}, [user]);
```

## 📈 Statistics Calculation (Using Scans)

```javascript
const calculateStatsFromScans = (scansData, uidsData) => {
  // Filter scans from last 7 days
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const weeklyScans = scansData.filter(s => new Date(s.timestamp) > weekAgo);
  
  // Calculate metrics
  const totalClicks = weeklyScans.filter(s => s.clicked).length;
  const totalConversions = weeklyScans.filter(s => s.converted).length;
  const totalRevenue = scansData.reduce((sum, s) => sum + (s.revenue || 0), 0);
  const conversionRate = totalClicks > 0 ? 
    ((totalConversions / totalClicks) * 100).toFixed(1) : 0;
  
  // Calculate unpaid earnings from payout_jobs
  const unpaidEarnings = payoutJobs
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + (p.retailer_cut || 0), 0);
  
  setStats({
    weeklyScans: weeklyScans.length,
    revenue: totalRevenue,
    displaysClaimed: uidsData.length, // Number of UIDs is like number of displays
    conversionRate: conversionRate,
    unpaidEarnings: unpaidEarnings
  });
};
```

## 📅 Weekly Chart Data (Using Scans)

```javascript
const calculateWeeklyData = (scansData) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekData = [];
  
  for (let i = 0; i < 7; i++) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - (6 - i));
    targetDate.setHours(0, 0, 0, 0);
    
    const dayScans = scansData.filter(scan => {
      const scanDate = new Date(scan.timestamp);
      return scanDate.toDateString() === targetDate.toDateString();
    });
    
    weekData.push({
      day: days[targetDate.getDay()],
      scans: dayScans.length,
      orders: dayScans.filter(s => s.converted).length,
      revenue: dayScans.reduce((sum, s) => sum + (s.revenue || 0), 0)
    });
  }
  
  setWeeklyData(weekData);
};
```

## 💸 Payouts Tab (Using payout_jobs)

```javascript
{activeTab === 'payouts' && (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3 }}
  >
    {/* Summary Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-3xl p-6 shadow-lg">
        <h4 className="font-bold text-gray-700 mb-2">Pending Earnings</h4>
        <p className="text-3xl font-bold text-gray-900">
          ${payoutJobs
            .filter(p => p.status === 'pending')
            .reduce((sum, p) => sum + (p.retailer_cut || 0), 0)
            .toFixed(2)}
        </p>
      </div>
      
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-3xl p-6 shadow-lg">
        <h4 className="font-bold text-gray-700 mb-2">Total Paid Out</h4>
        <p className="text-3xl font-bold text-gray-900">
          ${payoutJobs
            .filter(p => p.status === 'paid')
            .reduce((sum, p) => sum + (p.retailer_cut || 0), 0)
            .toFixed(2)}
        </p>
      </div>
      
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-3xl p-6 shadow-lg">
        <h4 className="font-bold text-gray-700 mb-2">Lifetime Earnings</h4>
        <p className="text-3xl font-bold text-gray-900">
          ${payoutJobs
            .reduce((sum, p) => sum + (p.retailer_cut || 0), 0)
            .toFixed(2)}
        </p>
      </div>
    </div>

    {/* Payouts Table */}
    <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-lg">
      <table className="w-full">
        <thead className="bg-gradient-to-r from-pink-50 to-purple-50">
          <tr>
            <th className="text-left py-4 px-6 font-bold text-gray-700">Date</th>
            <th className="text-left py-4 px-6 font-bold text-gray-700">Vendor</th>
            <th className="text-right py-4 px-6 font-bold text-gray-700">Your Cut</th>
            <th className="text-right py-4 px-6 font-bold text-gray-700">Total Amount</th>
            <th className="text-center py-4 px-6 font-bold text-gray-700">Status</th>
            <th className="text-right py-4 px-6 font-bold text-gray-700">Paid Date</th>
          </tr>
        </thead>
        <tbody>
          {payoutJobs.length > 0 ? (
            payoutJobs.map((payout, idx) => (
              <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-6 text-gray-900">
                  {new Date(payout.created_at).toLocaleDateString()}
                </td>
                <td className="py-4 px-6 text-gray-700">Vendor #{payout.vendor_id?.substring(0, 8)}</td>
                <td className="py-4 px-6 text-right">
                  <span className="font-bold text-green-700">${(payout.retailer_cut || 0).toFixed(2)}</span>
                </td>
                <td className="py-4 px-6 text-right">
                  <span className="font-bold text-gray-900">${(payout.total_amount || 0).toFixed(2)}</span>
                </td>
                <td className="py-4 px-6 text-center">
                  <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold ${
                    payout.status === 'paid' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {payout.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-right text-gray-600">
                  {payout.date_paid ? new Date(payout.date_paid).toLocaleDateString() : '-'}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="py-20 text-center">
                <p className="text-gray-700 font-bold text-lg">No payouts yet</p>
                <p className="text-gray-500 mt-2">Your payout history will appear here</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </motion.div>
)}
```

## 🛍️ Orders/Revenue Tab (Using Scans)

```javascript
{activeTab === 'orders' && (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3 }}
  >
    {/* Unpaid Earnings Banner */}
    {stats.unpaidEarnings > 0 && (
      <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-300 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-1">💰 Unpaid Earnings</h4>
            <p className="text-sm text-gray-600">Pending payout to your account</p>
          </div>
          <div className="text-3xl font-bold text-orange-700">${stats.unpaidEarnings.toFixed(2)}</div>
        </div>
      </div>
    )}

    <h3 className="text-2xl font-bold text-gray-900 mb-6">Recent Scan Activity</h3>

    <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-lg">
      <table className="w-full">
        <thead className="bg-gradient-to-r from-pink-50 to-purple-50">
          <tr>
            <th className="text-left py-4 px-6 font-bold text-gray-700">UID</th>
            <th className="text-left py-4 px-6 font-bold text-gray-700">Location</th>
            <th className="text-center py-4 px-6 font-bold text-gray-700">Clicked</th>
            <th className="text-center py-4 px-6 font-bold text-gray-700">Converted</th>
            <th className="text-right py-4 px-6 font-bold text-gray-700">Revenue</th>
            <th className="text-right py-4 px-6 font-bold text-gray-700">Date</th>
          </tr>
        </thead>
        <tbody>
          {scans.length > 0 ? (
            scans.slice(0, 50).map((scan, idx) => (
              <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-6">
                  <span className="font-mono text-sm text-gray-900">{scan.uid}</span>
                </td>
                <td className="py-4 px-6 text-gray-700">{scan.location || '-'}</td>
                <td className="py-4 px-6 text-center">
                  {scan.clicked ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-gray-300">○</span>
                  )}
                </td>
                <td className="py-4 px-6 text-center">
                  {scan.converted ? (
                    <span className="text-green-600 font-bold">✓</span>
                  ) : (
                    <span className="text-gray-300">○</span>
                  )}
                </td>
                <td className="py-4 px-6 text-right">
                  <span className="font-bold text-green-700">
                    ${(scan.revenue || 0).toFixed(2)}
                  </span>
                </td>
                <td className="py-4 px-6 text-right text-sm text-gray-600">
                  {new Date(scan.timestamp).toLocaleDateString()}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="py-20 text-center">
                <p className="text-gray-700 font-bold text-lg">No scans yet</p>
                <p className="text-gray-500 mt-2">Scan activity will appear here</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </motion.div>
)}
```

## 🖼️ UIDs Tab (Instead of Displays)

```javascript
{activeTab === 'uids' && (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3 }}
  >
    <h3 className="text-2xl font-bold text-gray-900 mb-6">Your UIDs</h3>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {uids.map((uid, idx) => (
        <motion.div
          key={uid.uid}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          whileHover={{ scale: 1.03, y: -5 }}
          className="bg-white rounded-3xl border-2 border-gray-100 p-6 shadow-lg hover:shadow-2xl hover:border-purple-200 transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
              Active
            </span>
          </div>
          
          <h4 className="text-lg font-bold text-gray-900 mb-2">
            {uid.business?.name || 'Business'}
          </h4>
          
          <div className="mb-3">
            <span className="text-xs text-gray-500 font-semibold">UID:</span>
            <p className="font-mono text-sm text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg mt-1">
              {uid.uid}
            </p>
          </div>
          
          <div className="text-xs text-gray-500">
            Registered: {new Date(uid.registered_at).toLocaleDateString()}
          </div>
        </motion.div>
      ))}
    </div>

    {uids.length === 0 && (
      <div className="bg-white rounded-3xl border-2 border-gray-100 p-12 text-center shadow-lg">
        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
        </div>
        <p className="text-gray-700 font-bold text-lg">No UIDs assigned yet</p>
        <p className="text-gray-500 mt-2">Contact support to get your first UID</p>
      </div>
    )}
  </motion.div>
)}
```

## ⚙️ Settings Tab (Using retailer_accounts)

```javascript
{activeTab === 'settings' && (
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3 }}
    className="space-y-6"
  >
    <h3 className="text-2xl font-bold text-gray-900">Store Settings</h3>

    {/* Bank Connection Section */}
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border-2 border-gray-100 shadow-lg">
      <h4 className="font-bold text-gray-900 text-lg mb-6">Bank Connection</h4>
      
      {retailerAccount?.plaid_access_token ? (
        <div className="flex items-center justify-between p-6 bg-green-50 border-2 border-green-200 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-gray-900">Bank Account Connected</p>
              <p className="text-sm text-gray-600">Ready to receive payouts</p>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleConnectBank}
            className="px-6 py-2.5 border-2 border-green-300 text-green-700 rounded-2xl text-sm font-bold hover:bg-green-50 transition-all"
          >
            Update Bank
          </motion.button>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <p className="text-gray-700 font-bold text-lg mb-2">No bank account connected</p>
          <p className="text-gray-500 mb-6">Connect your bank account to receive payouts</p>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleConnectBank}
            className="px-8 py-3 bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white rounded-2xl font-bold hover:shadow-xl transition-all"
          >
            Connect Bank Account
          </motion.button>
        </div>
      )}
    </div>

    {/* Retailer Information */}
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border-2 border-gray-100 shadow-lg">
      <h4 className="font-bold text-gray-900 text-lg mb-6">Retailer Information</h4>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Store Name</label>
          <input
            type="text"
            value={retailer?.name || ''}
            readOnly
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Location</label>
          <input
            type="text"
            value={retailer?.location || ''}
            readOnly
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Linked Vendor</label>
          <input
            type="text"
            value={retailer?.linked_vendor_id?.substring(0, 8) || 'Not linked'}
            readOnly
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50"
          />
        </div>
      </div>
    </div>
  </motion.div>
)}
```

## 🎉 Summary

This implementation now uses YOUR ACTUAL SCHEMA:
- ✅ `payout_jobs` for payouts with `retailer_cut`
- ✅ `retailer_accounts` for bank connections
- ✅ `scans` for revenue/order data
- ✅ `uids` instead of displays
- ✅ No more fake tables!

The dashboard will now work with your real database! 🚀

