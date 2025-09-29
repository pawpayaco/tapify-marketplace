// pages/onboard.js

import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Onboard() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    storeType: '',
    website: '',
    platformUrl: '',
    fulfillmentSpeed: '',
    inventoryCap: '',
    photoUrl: '',
    collectionName: '',
    sourcedBy: ''
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('vendors').insert([formData]);
    if (error) {
      alert('Error submitting form');
    } else {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold text-brand">Thanks for joining Tapify!</h2>
        <p className="mt-4">We'll review your application and reach out soon.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-brand">Join Tapify – Vendor Intake</h1>
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <input type="text" name="name" placeholder="Name" required onChange={handleChange} className="input" />
        <input type="email" name="email" placeholder="Email" required onChange={handleChange} className="input" />
        <input type="text" name="storeType" placeholder="Store Type (Etsy / Shopify)" required onChange={handleChange} className="input" />
        <input type="url" name="website" placeholder="Website URL" onChange={handleChange} className="input" />
        <input type="url" name="platformUrl" placeholder="Etsy/Shopify Store Link" required onChange={handleChange} className="input" />
        <input type="text" name="fulfillmentSpeed" placeholder="Fulfillment Speed (e.g. 2–3 days)" required onChange={handleChange} className="input" />
        <input type="text" name="inventoryCap" placeholder="Inventory Capacity" required onChange={handleChange} className="input" />
        <input type="url" name="photoUrl" placeholder="Product Photo URL" onChange={handleChange} className="input" />
        <input type="text" name="collectionName" placeholder="Collection Name" required onChange={handleChange} className="input" />
        <input type="text" name="sourcedBy" placeholder="Sourcing Agent (Optional)" onChange={handleChange} className="input" />

        <button type="submit" className="bg-brand text-white font-bold py-2 px-4 rounded hover:bg-brand-2 transition">
          Submit Application
        </button>
      </form>
    </div>
  );
}
