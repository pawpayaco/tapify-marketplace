// pages/onboard.js
import { useState } from "react";

export default function Onboard() {
  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");

  // Field names align with /api/submit-vendor and your SQL schema
  const [form, setForm] = useState({
    name: "",
    email: "",
    storeType: "",
    websiteUrl: "",
    platformUrl: "",
    fulfillmentSpeed: "",
    inventoryCap: "",
    productPhotoUrl: "",
    collectionName: "",
    sourcedBy: "",
  });

  const onChange = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErr("");

    try {
      const res = await fetch("/api/submit-vendor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to submit");

      setOk(true);
    } catch (e) {
      setErr(e.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (ok) {
    return (
      <main className="min-h-screen bg-white relative overflow-hidden">
        {/* soft radial bg like the landing */}
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_50%_at_15%_5%,#fff3ea_0%,transparent_60%),radial-gradient(60%_60%_at_100%_0%,#fff6fb_0%,transparent_60%)]" />
        <section className="relative z-10 max-w-xl mx-auto px-6 py-24">
          <div className="rounded-2xl border border-gray-200 bg-white/90 backdrop-blur p-8 shadow-sm">
            <h1 className="text-3xl font-semibold text-[#ff7a4a]">Thanks for joining Tapify! 🎉</h1>
            <p className="mt-3 text-gray-600">
              We received your vendor application. Our team will review and reach out shortly.
            </p>
            <a
              href="/"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#ff6fb3] px-4 py-2 font-semibold text-white hover:scale-[1.02] transition"
            >
              Back to Home
            </a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white relative overflow-hidden">
      {/* soft radial background (matches your aesthetic) */}
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_50%_at_15%_5%,#fff3ea_0%,transparent_60%),radial-gradient(60%_60%_at_100%_0%,#fff6fb_0%,transparent_60%)]" />

      <section className="relative z-10 max-w-3xl mx-auto px-6 py-16 lg:py-24">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-semibold text-[#ff7a4a]">Vendor Onboarding</h1>
          <p className="mt-2 text-gray-600">
            Bridge your online shop to real-world retail. Tap into NFC displays, affiliate tracking, and automated payouts.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white/90 backdrop-blur p-6 md:p-8 shadow-sm">
          {err && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {err}
            </div>
          )}
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {/* Left column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name*</label>
                <input
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-[#ff6fb3]"
                  name="name" required value={form.name} onChange={onChange} placeholder="Jane Maker"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email*</label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-[#ff6fb3]"
                  name="email" required value={form.email} onChange={onChange} placeholder="jane@shop.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Store Type*</label>
                <input
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-[#ff6fb3]"
                  name="storeType" required value={form.storeType} onChange={onChange} placeholder="Etsy / Shopify / Other"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Website URL</label>
                <input
                  type="url"
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-[#ff6fb3]"
                  name="websiteUrl" value={form.websiteUrl} onChange={onChange} placeholder="https://yourbrand.com"
                />
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Etsy/Shopify Store Link*</label>
                <input
                  type="url"
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-[#ff6fb3]"
                  name="platformUrl" required value={form.platformUrl} onChange={onChange} placeholder="https://etsy.com/shop/…"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fulfillment Speed*</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-[#ff6fb3]"
                    name="fulfillmentSpeed" required value={form.fulfillmentSpeed} onChange={onChange} placeholder="e.g. 2–3 days"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Inventory Cap*</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-[#ff6fb3]"
                    name="inventoryCap" required value={form.inventoryCap} onChange={onChange} placeholder="e.g. 250 units"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Product Photo URL</label>
                  <input
                    type="url"
                    className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-[#ff6fb3]"
                    name="productPhotoUrl" value={form.productPhotoUrl} onChange={onChange} placeholder="https://…/photo.jpg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Collection Name*</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-[#ff6fb3]"
                    name="collectionName" required value={form.collectionName} onChange={onChange} placeholder="e.g. Summer Candles"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Sourcing Agent (optional)</label>
                <input
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-[#ff6fb3]"
                  name="sourcedBy" value={form.sourcedBy} onChange={onChange} placeholder="Who sourced you?"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="md:col-span-2 mt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center rounded-xl bg-[#ff6fb3] px-4 py-3 font-semibold text-white hover:scale-[1.02] disabled:opacity-60 transition"
              >
                {submitting ? "Submitting…" : "Submit Application"}
              </button>
              <p className="mt-3 text-xs text-gray-500">
                By submitting, you agree to be contacted about Tapify onboarding and retail placements.
              </p>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
