import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, ChevronLeft, Upload, X, ImageIcon } from 'lucide-react';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatPrice } from '../../lib/formatPrice';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState('');

  const fetchProducts = () => {
    setLoading(true);
    api.get('/admin/products')
      .then(res => setProducts(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch {
      alert('Failed to delete product');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="text-stone-500 hover:text-stone-900 flex items-center gap-1 text-sm transition-colors">
            <ChevronLeft size={16} /> Dashboard
          </Link>
          <h1 className="text-2xl font-light tracking-wide">Products <span className="text-stone-400 text-lg">({products.length})</span></h1>
        </div>
        <button onClick={() => setModal('add')} className="btn-primary py-2.5 px-5 text-sm">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field max-w-sm"
        />
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="bg-white border border-stone-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 hidden sm:table-cell">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 hidden md:table-cell">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 hidden md:table-cell">Featured</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-12 bg-stone-100 flex-shrink-0 overflow-hidden rounded-sm">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><ImageIcon size={16} className="text-stone-300" /></div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-stone-900 line-clamp-1">{p.name}</p>
                        <p className="text-xs text-stone-400">{p.images?.length || 0} image{p.images?.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-stone-600 capitalize hidden sm:table-cell">{p.category}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-stone-900">{formatPrice(p.price)}</td>
                  <td className="px-4 py-3 text-sm hidden md:table-cell">
                    <span className={`font-semibold ${p.stock > 10 ? 'text-green-600' : p.stock > 0 ? 'text-amber-600' : 'text-red-500'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`text-xs px-2.5 py-1 font-medium rounded-full ${p.featured ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
                      {p.featured ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setModal(p)} className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deleting === p.id}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-stone-400 text-sm">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <ProductModal
          product={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={fetchProducts}
        />
      )}
    </div>
  );
}

function ProductModal({ product, onClose, onSaved }) {
  const isEdit = Boolean(product);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    category: product?.category || 'women',
    sizes: product?.sizes?.join(', ') || '',
    colors: product?.colors?.join(', ') || '',
    stock: product?.stock ?? 0,
    featured: product?.featured || false,
  });

  // Existing images (URLs from server)
  const [existingImages, setExistingImages] = useState(product?.images || []);
  // New images to upload (file + preview)
  const [newImages, setNewImages] = useState([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const totalImages = existingImages.length + newImages.length;
  const maxImages = 10;

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const remaining = maxImages - totalImages;
    const toAdd = files.slice(0, remaining).map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setNewImages(prev => [...prev, ...toAdd]);
    e.target.value = '';
  };

  const removeExisting = (url) => setExistingImages(prev => prev.filter(u => u !== url));
  const removeNew = (idx) => {
    URL.revokeObjectURL(newImages[idx].preview);
    setNewImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.description || !form.price || !form.category) {
      setError('Name, description, price, and category are required');
      return;
    }
    setSaving(true);
    try {
      const data = new FormData();
      data.append('name', form.name);
      data.append('description', form.description);
      data.append('price', form.price);
      data.append('category', form.category);
      data.append('sizes', JSON.stringify(form.sizes.split(',').map(s => s.trim()).filter(Boolean)));
      data.append('colors', JSON.stringify(form.colors.split(',').map(c => c.trim()).filter(Boolean)));
      data.append('stock', form.stock);
      data.append('featured', form.featured);

      // Send existing image URLs as JSON
      data.append('images', JSON.stringify(existingImages));

      // Append new files
      newImages.forEach(img => data.append('images', img.file));

      if (isEdit) {
        await api.put(`/admin/products/${product.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/admin/products', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-stone-900">{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded">{error}</div>}

          {/* Basic fields */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">Product Name *</label>
              <input value={form.name} onChange={e => update('name', e.target.value)} className="input-field" required />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">Description *</label>
              <textarea value={form.description} onChange={e => update('description', e.target.value)} className="input-field" rows={3} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">Price (RWF) *</label>
              <input type="number" step="1" min="0" value={form.price} onChange={e => update('price', e.target.value)} className="input-field" required placeholder="25000" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">Category *</label>
              <select value={form.category} onChange={e => update('category', e.target.value)} className="input-field">
                <option value="women">Women</option>
                <option value="men">Men</option>
                <option value="kids">Kids</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">Stock Qty</label>
              <input type="number" min="0" value={form.stock} onChange={e => update('stock', e.target.value)} className="input-field" />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input type="checkbox" id="featured" checked={form.featured} onChange={e => update('featured', e.target.checked)} className="w-4 h-4 accent-accent" />
              <label htmlFor="featured" className="text-sm text-stone-700 font-medium">Mark as Featured</label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">Sizes <span className="font-normal text-stone-400 normal-case tracking-normal">(comma separated)</span></label>
              <input value={form.sizes} onChange={e => update('sizes', e.target.value)} className="input-field" placeholder="XS, S, M, L, XL" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">Colors <span className="font-normal text-stone-400 normal-case tracking-normal">(comma separated)</span></label>
              <input value={form.colors} onChange={e => update('colors', e.target.value)} className="input-field" placeholder="Black, White, Navy" />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                Product Images
              </label>
              <span className="text-xs text-stone-400">{totalImages} / {maxImages}</span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mb-3">
              {/* Existing images */}
              {existingImages.map((url, i) => (
                <div key={url} className="relative aspect-square bg-stone-100 overflow-hidden group rounded-sm">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExisting(url)}
                    className="absolute top-1 right-1 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                  >
                    <X size={10} className="text-white" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-0 left-0 right-0 bg-stone-900/60 text-white text-[9px] text-center py-0.5">Cover</span>
                  )}
                </div>
              ))}

              {/* New images pending upload */}
              {newImages.map((img, idx) => (
                <div key={idx} className="relative aspect-square bg-stone-100 overflow-hidden group rounded-sm">
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeNew(idx)}
                    className="absolute top-1 right-1 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                  >
                    <X size={10} className="text-white" />
                  </button>
                  <span className="absolute bottom-0 left-0 right-0 bg-accent/70 text-white text-[9px] text-center py-0.5">New</span>
                </div>
              ))}

              {/* Add button */}
              {totalImages < maxImages && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-stone-300 hover:border-accent hover:bg-accent-light flex flex-col items-center justify-center gap-1 transition-colors rounded-sm"
                >
                  <Upload size={18} className="text-stone-400" />
                  <span className="text-[10px] text-stone-400">Add</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <p className="text-xs text-stone-400">Upload up to {maxImages} images. JPEG, PNG or WebP, max 5MB each. First image is the cover.</p>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-stone-100">
            <button type="button" onClick={onClose} className="btn-secondary py-2.5 px-6">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary py-2.5 px-6">
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
