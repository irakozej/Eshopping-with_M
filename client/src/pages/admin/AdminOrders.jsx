import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatPrice } from '../../lib/formatPrice';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [updating, setUpdating] = useState(null);

  const fetchOrders = () => {
    setLoading(true);
    const params = statusFilter ? `?status=${statusFilter}` : '';
    api.get(`/admin/orders${params}`)
      .then(res => setOrders(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  const updateStatus = async (orderId, status) => {
    setUpdating(orderId);
    try {
      const res = await api.put(`/admin/orders/${orderId}`, { status });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...res.data } : o));
    } catch {
      alert('Failed to update order status');
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
          <h1 className="text-2xl font-light tracking-wide">Orders</h1>
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

      {loading ? <LoadingSpinner /> : orders.length === 0 ? (
        <div className="text-center py-16 text-stone-400">No orders found</div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} className="border border-stone-200">
              {/* Header Row */}
              <div
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 cursor-pointer hover:bg-stone-50 transition-colors"
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              >
                <div className="flex items-center gap-4">
                  <ChevronDown size={16} className={`text-stone-400 transition-transform ${expanded === order.id ? 'rotate-180' : ''}`} />
                  <div>
                    <p className="text-sm font-medium">#{order.id}</p>
                    <p className="text-xs text-stone-400">{order.user_name} · {order.user_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-xs text-stone-400">{new Date(order.created_at).toLocaleDateString()}</p>
                  <p className="text-sm font-medium">{formatPrice(order.total)}</p>
                  <select
                    value={order.status}
                    onChange={e => { e.stopPropagation(); updateStatus(order.id, e.target.value); }}
                    disabled={updating === order.id}
                    className={`text-xs px-2 py-1 font-medium border-0 capitalize cursor-pointer focus:outline-none ${STATUS_COLORS[order.status]}`}
                    onClick={e => e.stopPropagation()}
                  >
                    {STATUSES.map(s => <option key={s} value={s} className="capitalize bg-white text-stone-900">{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Expanded Details */}
              {expanded === order.id && (
                <div className="border-t border-stone-100 px-5 py-4 bg-stone-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-stone-500 mb-3">Items</p>
                      <div className="space-y-2">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-8 h-10 bg-stone-200 flex-shrink-0 overflow-hidden">
                              <img src={item.images?.[0]} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 text-sm">
                              <p className="font-medium">{item.name}</p>
                              <p className="text-xs text-stone-400">{item.color} · {item.size} · ×{item.quantity}</p>
                            </div>
                            <p className="text-sm">{formatPrice(item.price * item.quantity)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-stone-500 mb-3">Shipping Address</p>
                      <div className="text-sm text-stone-600 space-y-1">
                        <p>{order.shipping_address?.name}</p>
                        <p>{order.shipping_address?.street}</p>
                        <p>{order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.zip}</p>
                        <p>{order.shipping_address?.country}</p>
                      </div>
                      {order.stripe_payment_id && (
                        <p className="text-xs text-stone-400 mt-4">Payment: {order.stripe_payment_id}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
