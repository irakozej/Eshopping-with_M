import { useState, useEffect } from 'react';
import { Plus, Trash2, Truck, Check, X, Pencil, Info } from 'lucide-react';
import api from '../../lib/api';
import { formatPrice } from '../../lib/formatPrice';
import { DELIVERY_FREE_THRESHOLD_RWF } from '../../lib/config';

const EMPTY_FORM = { id: null, name: '', fee: '', active: true };

export default function AdminSettings() {
  const [zones, setZones]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]     = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const fetchZones = () => {
    api.get('/delivery/admin/zones')
      .then(res => setZones(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchZones(); }, []);

  const updateForm = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const openCreate = () => { setForm(EMPTY_FORM); setError(''); setShowForm(true); };
  const openEdit = (z) => {
    setForm({ id: z.id, name: z.name, fee: String(z.fee), active: !!z.active });
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Zone name is required'); return; }
    if (form.fee === '' || Number(form.fee) < 0) { setError('A valid fee (RWF, 0 or more) is required'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = { name: form.name.trim(), fee: Number(form.fee), active: form.active ? 1 : 0 };
      if (form.id) await api.put(`/delivery/admin/zones/${form.id}`, payload);
      else await api.post('/delivery/admin/zones', payload);
      setShowForm(false);
      setForm(EMPTY_FORM);
      fetchZones();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save zone');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (z) => {
    try {
      await api.put(`/delivery/admin/zones/${z.id}`, { active: z.active ? 0 : 1 });
      fetchZones();
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this delivery zone?')) return;
    try {
      await api.delete(`/delivery/admin/zones/${id}`);
      fetchZones();
    } catch {}
  };

  const hasPlaceholders = zones.some(z => z.is_placeholder);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-light tracking-wide text-stone-900">Delivery Zones</h1>
          <p className="text-sm text-stone-400 mt-1">{zones.length} zone{zones.length !== 1 ? 's' : ''} · Kigali</p>
        </div>
        <button onClick={openCreate} className="btn-primary gap-2">
          <Plus size={16} /> New Zone
        </button>
      </div>

      {/* Placeholder + free-delivery hint */}
      <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-2xl mb-6 flex items-start gap-2.5">
        <Info size={15} className="mt-0.5 flex-shrink-0" />
        <div>
          {hasPlaceholders && (
            <p className="mb-1">
              <strong>Placeholder zones in use.</strong> The zones marked “Placeholder” are sample values —
              edit each one with the client’s real Kigali zone names and fees.
            </p>
          )}
          <p>
            Free delivery is applied automatically when a cart subtotal reaches{' '}
            <strong>{formatPrice(DELIVERY_FREE_THRESHOLD_RWF)}</strong> (set via
            <code className="bg-amber-100 px-1 rounded mx-1">DELIVERY_FREE_THRESHOLD_RWF</code>).
            Customers can also choose <strong>Pickup at store (free)</strong> at checkout.
          </p>
        </div>
      </div>

      {/* Create / edit form */}
      {showForm && (
        <div className="bg-white border border-stone-200 p-6 mb-8 shadow-sm animate-fade-in rounded-2xl">
          <h2 className="text-base font-semibold text-stone-800 mb-5">
            {form.id ? 'Edit Delivery Zone' : 'New Delivery Zone'}
          </h2>
          {error && <p className="text-red-500 text-sm mb-4 bg-red-50 border border-red-200 px-3 py-2.5 rounded">{error}</p>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">Zone Name *</label>
              <input
                value={form.name}
                onChange={e => updateForm('name', e.target.value)}
                className="input-field"
                placeholder="e.g. Kicukiro"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">Fee (RWF) *</label>
              <input
                type="number"
                value={form.fee}
                onChange={e => updateForm('fee', e.target.value)}
                className="input-field"
                placeholder="e.g. 1500"
                min={0}
                required
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <input
                type="checkbox"
                id="zone-active"
                checked={form.active}
                onChange={e => updateForm('active', e.target.checked)}
                className="w-4 h-4 accent-stone-900"
              />
              <label htmlFor="zone-active" className="text-sm text-stone-700">Active (shown to customers at checkout)</label>
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5">
                {saving ? 'Saving...' : form.id ? 'Save Changes' : 'Create Zone'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost px-6 py-2.5">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-stone-400">Loading...</div>
      ) : zones.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck size={24} className="text-stone-300" />
          </div>
          <p className="text-stone-400">No delivery zones yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="bg-white border border-stone-100 shadow-sm overflow-hidden rounded-2xl">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                {['Zone', 'Fee', 'Type', 'Status', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold uppercase tracking-wider text-stone-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {zones.map(z => (
                <tr key={z.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-4 py-3.5 font-medium text-stone-800">{z.name}</td>
                  <td className="px-4 py-3.5 text-stone-800 font-semibold">
                    {z.fee > 0 ? formatPrice(z.fee) : 'Free'}
                  </td>
                  <td className="px-4 py-3.5">
                    {z.is_placeholder ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Placeholder</span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">Custom</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => toggleActive(z)}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                        z.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                      }`}
                    >
                      {z.active ? <Check size={11} /> : <X size={11} />}
                      {z.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(z)} className="text-stone-300 hover:text-stone-700 transition-colors p-1" title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(z.id)} className="text-stone-300 hover:text-red-500 transition-colors p-1" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
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
