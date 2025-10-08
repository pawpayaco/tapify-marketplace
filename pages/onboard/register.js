import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function RegisterRetailer() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [managerReferral, setManagerReferral] = useState(null);

  const [formData, setFormData] = useState({
    storeName: '',
    ownerName: '',
    email: '',
    phone: '',
    storeAddress: '',
    password: ''
  });

  useEffect(() => {
    if (router.query.ref) {
      setManagerReferral(router.query.ref);
    }
  }, [router.query.ref]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.storeName || !formData.ownerName || !formData.email || !formData.password) {
        throw new Error('Please fill in all required fields');
      }

      const response = await fetch('/api/onboard/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_name: formData.storeName,
          owner_name: formData.ownerName,
          owner_email: formData.email,
          owner_phone: formData.phone || null,
          address: formData.storeAddress,
          password: formData.password,
          manager_referral: managerReferral
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Registration failed');

      // Auto sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        router.push('/login?message=Please log in with your new account');
        return;
      }

      router.push('/onboard/shopify-connect');
    } catch (err) {
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20" style={{ backgroundColor: '#FFF1E6' }}>
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-4">
            You're Almost Done!
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-8">
            Let's get your free display shipped.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left: Trust Builders */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-gray-100">
              <h3 className="text-2xl font-black text-gray-900 mb-6">Why Register?</h3>
              <div className="space-y-4">
                {[
                  { icon: '🛡️', title: 'Zero Risk', text: 'No upfront costs, no commitments' },
                  { icon: '🎨', title: 'Professionally Designed', text: 'Beautiful display ready to place' },
                  { icon: '💰', title: 'Passive Profit', text: 'Earn commissions automatically' },
                  { icon: '🚀', title: 'Backed by Tapify Tech', text: 'Enterprise-grade platform' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="text-3xl">{item.icon}</div>
                    <div>
                      <h4 className="font-bold text-gray-900">{item.title}</h4>
                      <p className="text-gray-600 text-sm">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right: Registration Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-gray-100"
          >
            <h2 className="text-2xl font-black text-gray-900 mb-6">Registration Form</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Store Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="storeName"
                  value={formData.storeName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Pet Supplies Plus - Downtown"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="owner@store.com"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Store Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="storeAddress"
                  value={formData.storeAddress}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="123 Main St, City, State 12345"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Create Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="At least 6 characters"
                />
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl font-black text-lg text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(to right, #FFA08A, #FF8FCF)' }}
              >
                {loading ? 'Processing...' : 'Finish & Claim My Display →'}
              </motion.button>

              <p className="text-xs text-gray-500 text-center">
                By submitting, you agree to receive your free display and marketing emails.
              </p>
            </form>
          </motion.div>
        </div>

        <div className="text-center mt-8">
          <Link href="/onboard" className="text-gray-600 hover:text-gray-900 font-bold">
            ← Back
          </Link>
        </div>
      </div>
    </div>
  );
}
