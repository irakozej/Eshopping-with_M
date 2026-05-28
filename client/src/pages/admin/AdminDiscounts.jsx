import { useState, useEffect } from 'react';
import { Plus, Trash2, Tag, Check, X } from 'lucide-react';
import api from '../../lib/api';
import { formatPrice } from '../../lib/formatPrice';

const EMPTY_FORM = { code: '', type: 'percent', value: '', min_order: '', max_uses: '', expires_at: '', active: true };

export default function AdminDiscounts() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchDiscounts = () => {
    api.get('/discounts/admin')
      .then(res => setDiscounts(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDiscounts(); }, []);

  const updateForm = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code.trim() || !form.value) { setError('Code and value are required'); return; }
    setSaving(true);
    setError('');
    try {
      await api.post('/discounts/admin', {
        code: form.code.toUpperCase().trim(),
        type: form.type,
        value: Number(form.value),
        min_order: form.min_order ? Number(form.min_order) : 0,
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        expires_at: form.expires_at || null,
        active: form.active ? 1 : 0,
      });
      setShowForm(false);
      setForm(EMPTY_FORM);
      fetchDiscounts();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create discount');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (discount) => {
    try {
      await api.put(`/discounts/admin/${discount.id}`, { ...discount, active: discount.active ? 0 : 1 });
      fetchDiscounts();
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this discount code?')) return;
    try {
      await api.delete(`/discounts/admin/${id}`);
      fetchDiscounts();
    } catch {}
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-light tracking-wide text-stone-900">Discount Codes</h1>
          <p className="text-sm text-stone-400 mt-1">{discounts.length} code{discounts.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setShowForm(true); setForm(EMPTY_FORM); setError(''); }} className="btn-primary gap-2">
          <Plus size={16} /> New Code
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white border border-stone-200 p-6 mb-8 shadow-sm animate-fade-in">
          <h2 className="text-base font-semibold text-stone-800 mb-5">Create Discount Code</h2>
          {error && <p className="text-red-500 text-sm mb-4 bg-red-50 border border-red-200 px-3 py-2.5 rounded">{error}</p>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">Code *</label>
              <input
                value={form.code}
                onChange={e => updateForm('code', e.target.value.toUpperCase())}
                className="input-field font-mono"
                placeholder="e.g. SUMMER20"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">Type *</label>
              <select value={form.type} onChange={e => updateForm('type', e.target.value)} className="input-field">
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed Amount (RWF)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
                Value * {form.type === 'percent' ? '(%)' : '(RWF)'}
              </label>
              <input
                type="number"
                value={form.value}
                onChange={e => updateForm('value', e.target.value)}
                className="input-field"
                placeholder={form.type === 'percent' ? 'e.g. 10' : 'e.g. 5000'}
                min={1}
                max={form.type === 'percent' ? 100 : undefined}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">Min. Order (RWF)</label>
              <input
                type="number"
                value={form.min_order}
                onChange={e => updateForm('min_order', e.target.value)}
                className="input-field"
                placeholder="0 (no minimum)"
                min={0}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">Max Uses</label>
              <input
                type="number"
                value={form.max_uses}
                onChange={e => updateForm('max_uses', e.target.value)}
                className="input-field"
                placeholder="Leave blank for unlimited"
                min={1}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">Expires At</label>
              <input
                type="date"
                value={form.expires_at}
                onChange={e => updateForm('expires_at', e.target.value)}
                className="input-field"
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <input
                type="checkbox"
                id="active"
                checked={form.active}
                onChange={e => updateForm('active', e.target.checked)}
                className="w-4 h-4 accent-stone-900"
              />
              <label htmlFor="active" className="text-sm text-stone-700">Active (usable by customers)</label>
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5">
                {saving ? 'Creating...' : 'Create Code'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost px-6 py-2.5">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-stone-400">Loading...</div>
      ) : discounts.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Tag size={24} className="text-stone-300" />
          </div>
          <p className="text-stone-400">No discount codes yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="bg-white border border-stone-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                {['Code', 'Discount', 'Min. Order', 'Uses', 'Expires', 'Status', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold uppercase tracking-wider text-stone-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {discounts.map(d => (
                <tr key={d.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-4 py-3.5">
                    <span className="font-mono font-semibold text-stone-800 bg-stone-100 px-2 py-0.5 rounded text-xs">{d.code}</span>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-stone-800">
                    {d.type === 'percent' ? `${d.value}% off` : `${formatPrice(d.value)} off`}
                  </td>
                  <td className="px-4 py-3.5 text-stone-500">
                    {d.min_order > 0 ? formatPrice(d.min_order) : '—'}
                  </td>
                  <td className="px-4 py-3.5 text-stone-500">
                    {d.uses || 0}{d.max_uses ? ` / ${d.max_uses}` : ''}
                  </td>
                  <td className="px-4 py-3.5 text-stone-500 text-xs">
                    {d.expires_at ? new Date(d.expires_at).toLocaleDateString('en-GB') : 'Never'}
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => toggleActive(d)}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                        d.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                      }`}
                    >
                      {d.active ? <Check size={11} /> : <X size={11} />}
                      {d.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3.5">
                    <button onClick={() => handleDelete(d.id)} className="text-stone-300 hover:text-red-500 transition-colors p-1">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
