import { useState } from 'react';

/**
 * Toast Hook
 *
 * Provides a simple toast notification system for user feedback.
 *
 * Usage:
 * ```
 * const { toast, Toast } = useToast();
 *
 * // Show a toast
 * toast("🎉 Display ordered successfully!");
 *
 * // Render the toast component in your JSX
 * <Toast />
 * ```
 */
export function useToast() {
  const [msg, setMsg] = useState(null);

  const toast = (m) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 3000);
  };

  const Toast = () =>
    msg ? (
      <div className="fixed bottom-5 right-5 bg-black text-white px-4 py-3 rounded-xl shadow-lg z-50 animate-fade-in">
        {msg}
      </div>
    ) : null;

  return { toast, Toast };
}
