import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronDown, MessageSquarePlus } from 'lucide-react';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatPrice } from '../../lib/formatPrice';

const STATUSES = ['pending', 'reviewing', 'fulfilled', 'rejected'];
const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  reviewing: 'bg-blue-100 text-blue-700',
  fulfilled: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [noteInputs, setNoteInputs] = useState({});
  const [msgInputs, setMsgInputs] = useState({});
  const [updating, setUpdating] = useState(null);

  const fetchRequests = () => {
    setLoading(true);
    const params = statusFilter ? `?status=${statusFilter}` : '';
    api.get(`/requests/admin${params}`)
      .then(res => setRequests(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, [statusFilter]);

  // status_message is the OPTIONAL in-app comment shown to the customer.
  // Falls back to whatever is already saved; always allowed to be blank.
  const updateRequest = async (id, status, opts = {}) => {
    const current = requests.find(r => r.id === id);
    const payload = {
      status,
      admin_note: opts.admin_note ?? noteInputs[id] ?? current?.admin_note,
      status_message: opts.status_message ?? msgInputs[id] ?? current?.status_message ?? '',
    };
    setUpdating(id);
    try {
      const res = await api.put(`/requests/admin/${id}`, payload);
      setRequests(prev => prev.map(r => r.id === id ? res.data : r));
    } catch {
      alert('Failed to update request');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="text-stone-500 hover:text-stone-900 flex items-center gap-1 text-sm">
            <ChevronLeft size={16} /> Dashboard
          </Link>
          <h1 className="text-2xl font-light tracking-wide">Product Requests</h1>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs uppercase tracking-wider text-stone-500">Filter:</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input-field py-2 w-40"
          >
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : requests.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <MessageSquarePlus size={40} className="mx-auto mb-3 opacity-40" />
          <p>No product requests found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div key={req.id} className="border border-stone-200 bg-white">
              {/* Header */}
              <div
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 cursor-pointer hover:bg-stone-50 transition-colors"
                onClick={() => setExpanded(expanded === req.id ? null : req.id)}
              >
                <div className="flex items-center gap-3">
                  <ChevronDown size={16} className={`text-stone-400 transition-transform ${expanded === req.id ? 'rotate-180' : ''}`} />
                  {req.images?.[0] && (
                    <div className="w-10 h-10 bg-stone-100 overflow-hidden flex-shrink-0">
                      <img src={req.images[0]} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">{req.name}</p>
                    <p className="text-xs text-stone-400">{req.user_name} · {req.user_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-xs text-stone-400">{new Date(req.created_at).toLocaleDateString()}</p>
                  {req.budget && <p className="text-sm font-medium">{formatPrice(req.budget)}</p>}
                  <select
                    value={req.status}
                    onChange={e => { e.stopPropagation(); updateRequest(req.id, e.target.value); }}
                    disabled={updating === req.id}
                    className={`text-xs px-2 py-1 font-medium border-0 capitalize cursor-pointer focus:outline-none ${STATUS_COLORS[req.status]}`}
                    onClick={e => e.stopPropagation()}
                  >
                    {STATUSES.map(s => <option key={s} value={s} className="capitalize bg-white text-stone-900">{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Expanded */}
              {expanded === req.id && (
                <div className="border-t border-stone-100 px-5 py-5 bg-stone-50 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">Description</p>
                    <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">{req.description}</p>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-stone-400">Category</p>
                        <p className="capitalize font-medium">{req.category}</p>
                      </div>
                      {req.budget && (
                        <div>
                          <p className="text-xs text-stone-400">Budget</p>
                          <p className="font-medium">{formatPrice(req.budget)}</p>
                        </div>
                      )}
                    </div>

                    {/* Admin Note */}
                    <div className="mt-5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">Admin Note</label>
                      <textarea
                        className="input-field text-sm"
                        rows={3}
                        placeholder="Add a note visible to admin only..."
                        defaultValue={req.admin_note || ''}
                        onChange={e => setNoteInputs(prev => ({ ...prev, [req.id]: e.target.value }))}
                      />
                      <button
                        onClick={() => updateRequest(req.id, req.status)}
                        disabled={updating === req.id}
                        className="mt-2 btn-primary py-2 px-4 text-xs"
                      >
                        {updating === req.id ? 'Saving...' : 'Save Note'}
                      </button>
                    </div>

                    {/* Status comment — optional, shown in-app to the customer */}
                    <div className="mt-5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                        Note to customer <span className="text-stone-400 normal-case font-normal">(optional, shown in their account)</span>
                      </label>
                      <textarea
                        className="input-field text-sm"
                        rows={2}
                        placeholder="e.g. We've sourced this — restocking next week. Leave blank to send no note."
                        defaultValue={req.status_message || ''}
                        onChange={e => setMsgInputs(prev => ({ ...prev, [req.id]: e.target.value }))}
                      />
                      <button
                        onClick={() => updateRequest(req.id, req.status)}
                        disabled={updating === req.id}
                        className="mt-2 btn-secondary py-2 px-4 text-xs"
                      >
                        {updating === req.id ? 'Saving...' : 'Save Note to Customer'}
                      </button>
                    </div>
                  </div>

                  {/* Images */}
                  {req.images?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">Reference Photos</p>
                      <div className="grid grid-cols-3 gap-2">
                        {req.images.map((img, i) => (
                          <a key={i} href={img} target="_blank" rel="noreferrer" className="aspect-square bg-stone-200 overflow-hidden block">
                            <img src={img} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
