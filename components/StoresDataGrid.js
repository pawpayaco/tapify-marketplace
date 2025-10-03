import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import AddressInput from './AddressInput';

/**
 * Helper function to detect potentially invalid addresses
 * Returns true if address looks incomplete or invalid
 */
function isAddressInvalid(address) {
  if (!address || address === '-') return true;
  
  // Check for basic patterns that indicate a proper address
  const hasNumber = /\d/.test(address);
  const hasComma = /,/.test(address);
  const hasState = /\b[A-Z]{2}\b/.test(address); // Two-letter state code
  const hasZip = /\d{5}/.test(address); // 5-digit ZIP
  
  // Valid address should have at least: number, comma, and either state or zip
  return !(hasNumber && hasComma && (hasState || hasZip));
}

/**
 * StoresDataGrid Component - Redesigned
 * 
 * Simplified admin interface for managing retailers:
 * - Clean columns: Name, Address, Phone, Email, Status, Actions
 * - Inline "Email Sent" toggle for each row
 * - Edit Profile button (replaces Add Owner)
 * - Status: Prospect → Converted (when registration completes)
 * - Removed redundant Register button
 * - Address validation with warnings for invalid addresses
 */
export default function StoresDataGrid({ onRefresh }) {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'prospect', 'converted'
  const [emailSentFilter, setEmailSentFilter] = useState('all'); // 'all', 'sent', 'not-sent'
  
  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  
  // Toast notifications
  const [toast, setToast] = useState(null);

  // Fetch stores from Supabase
  const fetchStores = async () => {
    if (!supabase) {
      setError('Supabase client not initialized');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('retailers')
        .select('id, name, address, phone, email, owner_name, cold_email_sent, cold_email_sent_at, converted, converted_at, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setStores(data || []);
    } catch (err) {
      console.error('[StoresDataGrid] Error fetching stores:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  // Filter stores
  const filteredStores = useMemo(() => {
    return stores.filter(store => {
      // Text search (name, address, email, phone)
      const searchLower = searchText.toLowerCase();
      const matchesSearch = !searchText || 
        store.name?.toLowerCase().includes(searchLower) ||
        store.address?.toLowerCase().includes(searchLower) ||
        store.email?.toLowerCase().includes(searchLower) ||
        store.phone?.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'prospect' && !store.converted) ||
        (statusFilter === 'converted' && store.converted);

      // Email sent filter
      const matchesEmailSent =
        emailSentFilter === 'all' ||
        (emailSentFilter === 'sent' && store.cold_email_sent) ||
        (emailSentFilter === 'not-sent' && !store.cold_email_sent);

      return matchesSearch && matchesStatus && matchesEmailSent;
    });
  }, [stores, searchText, statusFilter, emailSentFilter]);

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Toggle email sent status
  const handleToggleEmailSent = async (store) => {
    const newStatus = !store.cold_email_sent;
    
    try {
      const { error } = await supabase
        .from('retailers')
        .update({
          cold_email_sent: newStatus,
          cold_email_sent_at: newStatus ? new Date().toISOString() : null
        })
        .eq('id', store.id);

      if (error) throw error;

      // Update local state
      setStores(prev => prev.map(s =>
        s.id === store.id ? { ...s, cold_email_sent: newStatus, cold_email_sent_at: newStatus ? new Date().toISOString() : null } : s
      ));

      showToast(newStatus ? '✅ Marked as email sent' : '📧 Marked as email not sent');
    } catch (err) {
      console.error('[StoresDataGrid] Error updating email status:', err);
      showToast('Failed to update status', 'error');
    }
  };

  // Open edit modal
  const handleEditClick = (store) => {
    setSelectedStore(store);
    setShowEditModal(true);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Name', 'Address', 'Phone', 'Email', 'Status', 'Email Sent'];
    const rows = filteredStores.map(store => [
      store.name || '',
      store.address || '',
      store.phone || '',
      store.email || '',
      store.converted ? 'Converted' : 'Prospect',
      store.cold_email_sent ? 'Yes' : 'No'
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stores-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`✅ Exported ${filteredStores.length} stores`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#ff7a4a] border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading stores...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-3xl shadow-xl border-2 border-red-200 p-8">
        <div className="text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-red-900 mb-2">Error Loading Stores</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchStores}
            className="px-6 py-3 bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white rounded-2xl font-bold"
          >
            Try Again
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 overflow-hidden">
        
        {/* Filters Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 p-6">
          <div className="flex flex-wrap items-center gap-4">
            
            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, address, email, or phone..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full px-4 py-3 pl-11 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent text-gray-900 placeholder-gray-500"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent text-gray-900 font-medium"
            >
              <option value="all">All Status</option>
              <option value="prospect">🟡 Prospect</option>
              <option value="converted">✅ Converted</option>
            </select>

            {/* Email Sent Filter */}
            <select
              value={emailSentFilter}
              onChange={(e) => setEmailSentFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent text-gray-900 font-medium"
            >
              <option value="all">All Emails</option>
              <option value="sent">📧 Email Sent</option>
              <option value="not-sent">📭 Not Sent</option>
            </select>

            {/* Export Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExportCSV}
              disabled={filteredStores.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </motion.button>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-gray-600 font-medium">
            Showing {filteredStores.length} of {stores.length} stores
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead className="bg-gradient-to-r from-gray-100 to-gray-200 border-b-2 border-gray-300">
              <tr>
                <th className="w-[20%] px-4 py-4 text-left font-bold text-gray-700 text-sm">Name</th>
                <th className="w-[25%] px-4 py-4 text-left font-bold text-gray-700 text-sm">Address</th>
                <th className="w-[15%] px-4 py-4 text-left font-bold text-gray-700 text-sm">Phone</th>
                <th className="w-[20%] px-4 py-4 text-left font-bold text-gray-700 text-sm">Email</th>
                <th className="w-[10%] px-2 py-4 text-center font-bold text-gray-700 text-sm">Cold Email</th>
                <th className="w-[10%] px-2 py-4 text-center font-bold text-gray-700 text-sm">Status</th>
                <th className="w-[15%] px-2 py-4 text-center font-bold text-gray-700 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStores.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="text-gray-400 text-lg font-medium">
                      {searchText || statusFilter !== 'all' || emailSentFilter !== 'all'
                        ? '🔍 No stores match your filters'
                        : '📦 No stores yet'}
                    </div>
                    {(searchText || statusFilter !== 'all' || emailSentFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setSearchText('');
                          setStatusFilter('all');
                          setEmailSentFilter('all');
                        }}
                        className="mt-4 text-[#ff6fb3] font-bold hover:underline"
                      >
                        Clear all filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredStores.map((store, idx) => (
                  <motion.tr
                    key={store.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* Name */}
                    <td className="w-[20%] px-4 py-4">
                      <div className="font-bold text-gray-900 truncate" title={store.name}>
                        {store.name || '-'}
                      </div>
                      {store.owner_name && (
                        <div className="text-xs text-gray-500 mt-1 truncate" title={store.owner_name}>
                          Owner/Management: {store.owner_name}
                        </div>
                      )}
                    </td>

                    {/* Address */}
                    <td className="w-[25%] px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="text-gray-700 text-sm truncate flex-1" title={store.address}>
                          {store.address || '-'}
                        </div>
                        {isAddressInvalid(store.address) && (
                          <div 
                            className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-100 flex items-center justify-center"
                            title="⚠️ Address appears incomplete or invalid. Click Edit to verify with USPS."
                          >
                            <svg className="w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="w-[15%] px-4 py-4">
                      <div className="text-gray-700 text-sm truncate" title={store.phone}>
                        {store.phone || '-'}
                      </div>
                    </td>

                    {/* Email */}
                    <td className="w-[20%] px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="text-gray-700 text-sm truncate flex-1" title={store.email}>
                          {store.email || '-'}
                        </div>
                        {store.email && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(store.email);
                              showToast('Email copied to clipboard');
                            }}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                            title="Copy email"
                          >
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Cold Email Toggle */}
                    <td className="w-[10%] px-2 py-4 text-center">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleToggleEmailSent(store)}
                        className={[
                          "relative inline-flex items-center h-6 w-12 rounded-full transition-colors",
                          store.cold_email_sent ? "bg-green-500" : "bg-gray-300"
                        ].join(" ")}
                        title={store.cold_email_sent ? "Email sent" : "Email not sent"}
                      >
                        <span
                          className={[
                            "inline-block w-4 h-4 bg-white rounded-full shadow-lg transform transition-transform",
                            store.cold_email_sent ? "translate-x-6" : "translate-x-1"
                          ].join(" ")}
                        />
                      </motion.button>
                      {store.cold_email_sent && store.cold_email_sent_at && (
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(store.cold_email_sent_at).toLocaleDateString()}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="w-[10%] px-2 py-4 text-center">
                      <span className={[
                        "inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold min-w-[80px]",
                        store.converted
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      ].join(" ")}>
                        {store.converted ? 'Converted' : 'Prospect'}
                      </span>
                      {store.converted && store.converted_at && (
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(store.converted_at).toLocaleDateString()}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="w-[15%] px-2 py-4">
                      <div className="flex items-center justify-center">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleEditClick(store)}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold hover:shadow-lg flex items-center gap-1"
                          title="Edit store profile and owner info"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedStore(null);
        }}
        store={selectedStore}
        onSuccess={() => {
          fetchStores();
          onRefresh?.();
          showToast('✅ Profile updated successfully');
        }}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-8 right-8 z-50"
          >
            <div className={[
              "px-6 py-4 rounded-2xl shadow-2xl font-bold text-white flex items-center gap-3",
              toast.type === 'error' ? "bg-red-500" : "bg-green-500"
            ].join(" ")}>
              <span className="text-2xl">{toast.type === 'error' ? '❌' : '✅'}</span>
              {toast.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Edit Profile Modal Component
 */
function EditProfileModal({ isOpen, onClose, store, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    owner_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name || '',
        address: store.address || '',
        phone: store.phone || '',
        email: store.email || '',
        owner_name: store.owner_name || ''
      });
    }
  }, [store]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Update retailers table
      const { error: updateError } = await supabase
        .from('retailers')
        .update({
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          owner_name: formData.owner_name
        })
        .eq('id', store.id);

      if (updateError) throw updateError;

      // If email is provided, also update retailer_owners table
      if (formData.email) {
        const { error: ownerError } = await supabase
          .from('retailer_owners')
          .upsert({
            retailer_id: store.id,
            owner_name: formData.owner_name || null,
            owner_email: formData.email,
            owner_phone: formData.phone || null,
            collected_by: 'admin',
            collected_at: new Date().toISOString()
          }, {
            onConflict: 'retailer_id,owner_email',
            ignoreDuplicates: false
          });

        if (ownerError) {
          console.warn('[EditProfile] Owner upsert warning:', ownerError);
          // Don't fail the whole operation
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('[EditProfile] Error:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-5 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">Edit Store Profile</h2>
                <p className="text-white/80 text-sm">Update store and owner information</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Store Name */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Store Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Starbucks Coffee"
            />
          </div>

          {/* Address */}
          <AddressInput
            value={formData.address}
            onChange={(address) => setFormData({ ...formData, address })}
            onValidated={(validated) => {
              // When USPS validates, use the full standardized address
              const fullAddress = [
                validated.address1,
                validated.address2,
                validated.city,
                validated.state,
                validated.zip5
              ].filter(Boolean).join(', ');
              setFormData({ ...formData, address: fullAddress });
            }}
            required={false}
            googleApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
            label="Address"
            className="mb-0"
          />

          {/* Owner Name */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Owner / Management Group's Name
            </label>
            <input
              type="text"
              value={formData.owner_name}
              onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., John Smith or Management Group"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Owner Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="owner@example.com"
            />
            <p className="text-xs text-gray-500 mt-1">This will be used for login when they register</p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Owner Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="(555) 123-4567"
            />
          </div>


          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-800 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50"
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
