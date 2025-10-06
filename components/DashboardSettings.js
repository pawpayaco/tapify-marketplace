/**
 * Dashboard Settings Component
 *
 * Location: /components/DashboardSettings.js (or .jsx)
 *
 * This component displays in the retailer dashboard and includes:
 * 1. Account settings
 * 2. Priority Display upgrade button and status
 * 3. Other retailer preferences
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function DashboardSettings({ retailerId }) {
  const [retailer, setRetailer] = useState(null);
  const [uid, setUid] = useState(null);
  const [priorityDisplayActive, setPriorityDisplayActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (retailerId) {
      loadRetailerSettings();
    }
  }, [retailerId]);

  async function loadRetailerSettings() {
    try {
      setLoading(true);

      // Load retailer data
      const { data: retailerData, error: retailerError } = await supabase
        .from('retailers')
        .select('*')
        .eq('id', retailerId)
        .single();

      if (retailerError) throw retailerError;

      setRetailer(retailerData);
      setPriorityDisplayActive(retailerData?.priority_display_active || false);

      // Load retailer's primary UID
      const { data: uidData, error: uidError } = await supabase
        .from('uids')
        .select('uid')
        .eq('retailer_id', retailerId)
        .eq('is_claimed', true)
        .limit(1)
        .single();

      if (!uidError && uidData) {
        setUid(uidData.uid);
      }

      // Check orders table for priority display purchase
      const { data: orderData } = await supabase
        .from('orders')
        .select('is_priority_display')
        .eq('retailer_id', retailerId)
        .eq('is_priority_display', true)
        .maybeSingle();

      if (orderData) {
        setPriorityDisplayActive(true);

        // Update retailer record if not already marked
        if (!retailerData.priority_display_active) {
          await supabase
            .from('retailers')
            .update({ priority_display_active: true })
            .eq('id', retailerId);
        }
      }

    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleUpgradeClick() {
    if (!uid) {
      alert('Unable to load your tracking ID. Please contact support.');
      return;
    }

    // Open Shopify priority display product page with retailer attribution
    const shopifyUrl = `https://pawpayaco.com/products/display-setup-for-affiliate?ref=${uid}`;
    window.open(shopifyUrl, '_blank');
  }

  async function handleSaveSettings(e) {
    e.preventDefault();
    setSaving(true);

    try {
      // Save retailer settings
      const { error } = await supabase
        .from('retailers')
        .update({
          name: retailer.name,
          phone: retailer.phone,
          email: retailer.email,
          address: retailer.address,
        })
        .eq('id', retailerId);

      if (error) throw error;

      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account and upgrade options</p>
      </div>

      {/* Priority Display Upgrade Card */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] p-4">
          <h2 className="text-2xl font-bold text-white">Priority Display</h2>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">
                Featured Marketplace Placement
              </h3>
              <p className="text-gray-700 mb-4">
                Upgrade to Priority Display for just <strong className="text-2xl">$50</strong> and
                get featured placement in our marketplace, increasing your visibility
                and conversion rates.
              </p>

              {/* Status Display */}
              <div className="mb-4">
                {priorityDisplayActive ? (
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div>
                      <div className="text-green-800 font-semibold text-lg">
                        Priority Display Active
                      </div>
                      <div className="text-green-700 text-sm">
                        Your products are featured in prime marketplace placement
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div>
                      <div className="text-gray-700 font-semibold">
                        Not purchased yet
                      </div>
                      <div className="text-gray-600 text-sm italic">
                        Upgrade now to activate priority placement
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!priorityDisplayActive && (
                <div className="space-y-2 mb-4">
                  <h4 className="font-semibold">Benefits Include:</h4>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500 font-bold">✓</span>
                      Featured placement at top of marketplace
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500 font-bold">✓</span>
                      3x more visibility to potential customers
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500 font-bold">✓</span>
                      Higher click-through and conversion rates
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500 font-bold">✓</span>
                      Priority badge on your store listing
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500 font-bold">✓</span>
                      One-time payment, ongoing benefits
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {!priorityDisplayActive && (
              <div className="flex-shrink-0">
                <button
                  onClick={handleUpgradeClick}
                  disabled={!uid}
                  className="px-8 py-4 bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white font-bold text-lg rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  Upgrade to $50<br />Priority Display
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Display Shipping Preferences */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
          <h2 className="text-2xl font-bold text-white">Display Shipping Preferences</h2>
        </div>

        <div className="p-6">
          {priorityDisplayActive ? (
            <div>
              <div className="flex items-center gap-3 mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600 flex-shrink-0"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <p className="font-bold text-green-900">Priority Display Active</p>
                  <p className="text-sm text-green-700">Your display shipping is managed through Shopify</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Shipping Status</h3>
                  <p className="text-gray-700 text-sm">
                    Your Priority Display upgrade includes expedited shipping. Track your order through your Shopify confirmation email.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
                  <p className="text-gray-700 text-sm">
                    Contact support if you have questions about your display shipment or tracking information.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Priority Display Shipping Not Active
              </h3>
              <p className="text-gray-600 mb-4">
                Upgrade to Priority Display to access premium shipping options and featured marketplace placement.
              </p>
              <button
                onClick={handleUpgradeClick}
                disabled={!uid}
                className="px-6 py-3 bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                Upgrade to Priority Display
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Account Settings Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Account Information</h2>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Store Name
            </label>
            <input
              type="text"
              value={retailer?.name || ''}
              onChange={(e) => setRetailer({ ...retailer, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={retailer?.phone || ''}
                onChange={(e) => setRetailer({ ...retailer, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={retailer?.email || ''}
                onChange={(e) => setRetailer({ ...retailer, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Store Address
            </label>
            <textarea
              value={retailer?.address || ''}
              onChange={(e) => setRetailer({ ...retailer, address: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {uid && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Your Tracking ID
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={uid}
                  readOnly
                  className="flex-1 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(uid);
                    alert('Tracking ID copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => loadRetailerSettings()}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
