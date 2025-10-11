import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatMoney } from '../utils/formatMoney';

export default function RetailerPayoutRow({ retailerData, onProcessPayout, onProcessAll, processingPayouts }) {
  const [expanded, setExpanded] = useState(false);
  const { retailer, uids, payouts, orders, summary } = retailerData;

  const handleProcessAll = async () => {
    const pendingPayouts = payouts.filter(p => p.status === 'pending');
    if (pendingPayouts.length === 0) return;

    if (confirm(`Process ${pendingPayouts.length} pending payout(s) for ${retailer.name}?`)) {
      await onProcessAll(pendingPayouts);
    }
  };

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      {/* Main Row */}
      <div className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
        {/* Expand Button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors"
        >
          <svg
            className={`w-5 h-5 text-gray-600 transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Retailer Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-gray-900 truncate">{retailer.name}</h3>
            {summary.uid_count > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                {summary.uid_count} UID{summary.uid_count !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>{retailer.email}</span>
            {retailer.location && (
              <>
                <span className="text-gray-400">•</span>
                <span>{retailer.location}</span>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6">
          {/* Pending Earnings */}
          <div className="text-right">
            <div className="text-xs text-gray-600 mb-0.5">Pending</div>
            <div className="text-xl font-bold text-yellow-600">
              {formatMoney(summary.pending_earnings)}
            </div>
            <div className="text-xs text-gray-500">{summary.pending_count} payout{summary.pending_count !== 1 ? 's' : ''}</div>
          </div>

          {/* Paid Earnings */}
          <div className="text-right">
            <div className="text-xs text-gray-600 mb-0.5">Paid</div>
            <div className="text-xl font-bold text-green-600">
              {formatMoney(summary.paid_earnings)}
            </div>
            <div className="text-xs text-gray-500">{summary.paid_count} payout{summary.paid_count !== 1 ? 's' : ''}</div>
          </div>

          {/* Total */}
          <div className="text-right">
            <div className="text-xs text-gray-600 mb-0.5">Lifetime</div>
            <div className="text-xl font-bold text-gray-900">
              {formatMoney(summary.total_earnings)}
            </div>
            <div className="text-xs text-gray-500">{summary.total_orders} order{summary.total_orders !== 1 ? 's' : ''}</div>
          </div>
        </div>

        {/* Mass Payout Button */}
        {summary.pending_count > 0 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleProcessAll}
            disabled={processingPayouts.size > 0}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            💰 Pay All ({summary.pending_count})
          </motion.button>
        )}
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-200">
              {/* UIDs Section */}
              {uids.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-gray-700 mb-3">📱 NFC UIDs</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {uids.map((uid) => (
                      <div
                        key={uid.uid}
                        className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono font-bold text-purple-700">{uid.uid}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                            Active
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          Registered: {new Date(uid.registered_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payouts Section */}
              {payouts.length > 0 ? (
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-3">💵 Payout Transactions</h4>
                  <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="text-left py-3 px-4 font-bold text-gray-700">Date</th>
                          <th className="text-left py-3 px-4 font-bold text-gray-700">Order ID</th>
                          <th className="text-left py-3 px-4 font-bold text-gray-700">Source UID</th>
                          <th className="text-right py-3 px-4 font-bold text-gray-700">Total</th>
                          <th className="text-right py-3 px-4 font-bold text-gray-700">Retailer Cut</th>
                          <th className="text-center py-3 px-4 font-bold text-gray-700">Status</th>
                          <th className="text-right py-3 px-4 font-bold text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {payouts.map((payout) => {
                          const isProcessing = processingPayouts.has(payout.id);
                          const isPending = payout.status === 'pending';

                          return (
                            <tr key={payout.id} className="hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-4 text-gray-900">
                                {new Date(payout.created_at).toLocaleDateString()}
                              </td>
                              <td className="py-3 px-4 text-gray-600 font-mono text-xs">
                                {payout.order_id?.substring(0, 8)}...
                              </td>
                              <td className="py-3 px-4">
                                {payout.source_uid ? (
                                  <span className="font-mono text-xs font-bold text-purple-700">
                                    {payout.source_uid}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-xs">No UID</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-gray-900">
                                {formatMoney(payout.total_amount || 0)}
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-green-700">
                                {formatMoney(payout.retailer_cut || 0)}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                                    payout.status === 'paid'
                                      ? 'bg-green-100 text-green-700'
                                      : payout.status === 'priority_display'
                                      ? 'bg-purple-100 text-purple-700'
                                      : 'bg-yellow-100 text-yellow-700'
                                  }`}
                                >
                                  {payout.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                {isPending && (
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => onProcessPayout(payout.id)}
                                    disabled={isProcessing}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                      isProcessing
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-green-400 to-emerald-500 text-white hover:shadow-lg'
                                    }`}
                                  >
                                    {isProcessing ? (
                                      <span className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                                        Processing...
                                      </span>
                                    ) : (
                                      '✓ Approve'
                                    )}
                                  </motion.button>
                                )}
                                {payout.status === 'paid' && payout.date_paid && (
                                  <span className="text-xs text-gray-500">
                                    Paid {new Date(payout.date_paid).toLocaleDateString()}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No payout transactions yet
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
