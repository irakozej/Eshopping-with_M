import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Upload, X, Plus, MessageSquarePlus, ChevronRight, CheckCircle, Sparkles, Image } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../lib/formatPrice';

const CATEGORIES = [
  { value: 'women', label: "Women's Clothing" },
  { value: 'men',   label: "Men's Clothing" },
  { value: 'kids',  label: "Kids' Clothing" },
  { value: 'other', label: 'Other / Accessories' },
];

export default function ProductRequest() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({ name: '', description: '', category: 'women', budget: '' });
  const [images, setImages]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]       = useState('');

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    const remaining = 5 - images.length;
    const toAdd = files.slice(0, remaining).map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages(prev => [...prev, ...toAdd]);
    e.target.value = '';
  };

  const removeImage = (idx) => {
    URL.revokeObjectURL(images[idx].preview);
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.description) {
      setError('Please fill in the product name and description.');
      return;
    }
    setLoading(true);
    try {
      const data = new FormData();
      data.append('name', form.name);
      data.append('description', form.description);
      data.append('category', form.category);
      data.append('budget', form.budget);
      images.forEach(img => data.append('images', img.file));
      await api.post('/requests', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Not logged in ── */
  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 bg-accent/10 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-scale-in">
          <MessageSquarePlus size={32} className="text-accent" />
        </div>
        <h1 className="text-2xl font-heading font-semibold text-stone-900 mb-2">Request a Product</h1>
        <p className="text-stone-400 mb-8 text-sm max-w-xs">Sign in to submit a product request to our sourcing team.</p>
        <Link to="/login?redirect=/request" className="btn-primary px-8 py-4">Sign In to Continue</Link>
      </div>
    );
  }

  /* ── Success ── */
  if (submitted) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-24 h-24 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-scale-in">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-heading font-semibold text-stone-900 mb-2">Request Submitted!</h1>
        <p className="text-stone-500 mb-1">We've received your request.</p>
        <p className="text-stone-400 text-sm mb-8 max-w-xs">
          Our team will review it and get back to you shortly. You can track its status in My Requests.
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <Link to="/my-requests" className="btn-primary px-6 py-3">Track My Request</Link>
          <button
            onClick={() => { setSubmitted(false); setForm({ name: '', description: '', category: 'women', budget: '' }); setImages([]); }}
            className="btn-secondary px-6 py-3 cursor-pointer"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  /* ── Form ── */
  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-white border-b border-stone-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-1.5 text-xs text-stone-400 mb-4 font-medium">
            <Link to="/" className="hover:text-accent transition-colors">Home</Link>
            <ChevronRight size={12} className="text-stone-300" />
            <span className="text-stone-600">Request a Product</span>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Sparkles size={20} className="text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-semibold text-stone-900">Request a Product</h1>
              <p className="text-stone-400 mt-1 text-sm leading-relaxed">
                Can't find what you're looking for? Tell us what you need and we'll source it for you.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        {/* How it works */}
        <div className="card p-5 mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-400 mb-3">How it works</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { step: '01', label: 'Submit', desc: 'Describe what you want' },
              { step: '02', label: 'Review', desc: 'Our team sources it' },
              { step: '03', label: 'Notify', desc: 'We\'ll update you' },
            ].map(item => (
              <div key={item.step}>
                <p className="text-lg font-heading font-bold text-gradient">{item.step}</p>
                <p className="text-xs font-bold text-stone-700 mt-1">{item.label}</p>
                <p className="text-[10px] text-stone-400 mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3.5 rounded-2xl font-medium">
              {error}
            </div>
          )}

          <div className="card p-6 space-y-5">
            {/* Product Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.16em] text-stone-400 mb-2">
                Product Name <span className="text-red-400">*</span>
              </label>
              <input
                value={form.name}
                onChange={e => update('name', e.target.value)}
                className="input-field"
                placeholder="e.g. White linen dress with belt"
                required
              />
            </div>

            {/* Category + Budget */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.16em] text-stone-400 mb-2">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={e => update('category', e.target.value)}
                  className="input-field cursor-pointer"
                >
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.16em] text-stone-400 mb-2">
                  Budget (RWF)
                </label>
                <input
                  type="number"
                  value={form.budget}
                  onChange={e => update('budget', e.target.value)}
                  className="input-field"
                  placeholder="e.g. 30000"
                  min="0"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.16em] text-stone-400 mb-2">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={e => update('description', e.target.value)}
                className="input-field resize-none"
                rows={5}
                placeholder="Describe the product in detail — style, colour, fabric, size needed, occasion, etc."
                required
              />
              <p className="text-xs text-stone-400 mt-1.5 font-medium">
                The more detail, the better we can match your request.
              </p>
            </div>
          </div>

          {/* Image Upload */}
          <div className="card p-6">
            <label className="block text-xs font-bold uppercase tracking-[0.16em] text-stone-400 mb-4">
              Reference Photos
              <span className="text-stone-400 font-medium normal-case tracking-normal ml-2">(up to 5)</span>
            </label>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square bg-stone-100 overflow-hidden group rounded-2xl">
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1.5 right-1.5 bg-white rounded-full p-1 shadow-card opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <X size={11} className="text-stone-700" />
                  </button>
                </div>
              ))}

              {images.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-stone-200 hover:border-accent hover:bg-accent/5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer group"
                >
                  <Image size={18} className="text-stone-400 group-hover:text-accent transition-colors" />
                  <span className="text-[10px] text-stone-400 group-hover:text-accent transition-colors font-medium">Add photo</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleImages}
            />
            <p className="text-xs text-stone-400 mt-3 font-medium">JPEG, PNG or WebP — max 5MB each</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-accent w-full py-4 text-base cursor-pointer"
          >
            {loading ? 'Submitting...' : <><MessageSquarePlus size={17} /> Submit Request</>}
          </button>
        </form>
      </div>
    </div>
  );
}
