import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, MapPin, Phone, CreditCard, Smartphone, Check, Clock, Truck, Package, XCircle, Tag } from 'lucide-react';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatPrice } from '../lib/formatPrice';

const STATUS_CONFIG = {
  pending:         { label: 'Pending',           color: 'bg-amber-100 text-amber-700 border-amber-200',    dot: 'bg-amber-400' },
  pending_payment: { label: 'Awaiting Payment',  color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-400' },
  processing:      { label: 'Processing',        color: 'bg-blue-100 text-blue-700 border-blue-200',       dot: 'bg-blue-500' },
  shipped:         { label: 'Shipped',           color: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  delivered:       { label: 'Delivered',         color: 'bg-green-100 text-green-700 border-green-200',    dot: 'bg-green-500' },
  cancelled:       { label: 'Cancelled',         color: 'bg-red-100 text-red-600 border-red-200',          dot: 'bg-red-400' },
};

// Progress timeline for the happy path; cancelled orders get a banner instead.
const TIMELINE = [
  { key: 'placed',     label: 'Order Placed', icon: Check },
  { key: 'processing', label: 'Processing',   icon: Package },
  { key: 'shipped',    label: 'Shipped',      icon: Truck },
  { key: 'delivered',  label: 'Delivered',    icon: Check },
];
const STATUS_STEP = { pending: 1, pending_payment: 1, processing: 2, shipped: 3, delivered: 4 };

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/orders/${id}`)
      .then(res => setOrder(res.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  if (notFound || !order) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <Package size={36} className="mx-auto mb-4 text-stone-300" />
        <h1 className="text-xl font-heading font-semibold text-stone-700 mb-2">Order not found</h1>
        <p className="text-stone-400 text-sm mb-8">This order doesn't exist or doesn't belong to your account.</p>
        <Link to="/orders" className="btn-primary px-8 py-3">Back to My Orders</Link>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const step = STATUS_STEP[order.status] ?? 1;
  const isCancelled = order.status === 'cancelled';
  const subtotal = (order.items || []).reduce((s, i) => s + i.price * i.quantity, 0);
  const isMtn = order.payment_method === 'MTN Mobile Money';
  const addr = order.shipping_address || {};

  return (
    <div className="min-h-screen bg-cream">
      {/* Page header */}
      <div className="page-header">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <Link to="/orders" className="text-stone-400 hover:text-stone-700 flex items-center gap-1 text-sm font-medium mb-3 transition-colors">
            <ChevronLeft size={15} /> My Orders
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-heading font-semibold text-stone-900">Order #{order.id}</h1>
              <p className="text-sm text-stone-400 mt-1 font-medium">
                Placed {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 font-semibold rounded-full border ${cfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        {/* Status timeline / cancelled banner */}
        {isCancelled ? (
          <div className="card p-5 flex items-center gap-3 border-red-100 bg-red-50/50">
            <XCircle size={20} className="text-red-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-600">This order was cancelled</p>
              <p className="text-xs text-stone-500 mt-0.5">If you didn't request this, contact us on WhatsApp and we'll help.</p>
            </div>
          </div>
        ) : (
          <div className="card p-6">
            <div className="flex items-center">
              {TIMELINE.map((t, i) => {
                const done = i < step;
                const active = i === step - 1;
                const Icon = t.icon;
                return (
                  <div key={t.key} className={`flex items-center ${i < TIMELINE.length - 1 ? 'flex-1' : ''}`}>
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors
                        ${done ? 'bg-stone-900 text-white' : active ? 'bg-accent text-white' : 'bg-stone-100 text-stone-300'}`}>
                        {done ? <Check size={15} strokeWidth={2.5} /> : <Icon size={15} />}
                      </div>
                      <span className={`text-[10px] font-bold whitespace-nowrap ${done || active ? 'text-stone-700' : 'text-stone-300'}`}>
                        {t.label}
                      </span>
                    </div>
                    {i < TIMELINE.length - 1 && (
                      <div className={`h-0.5 flex-1 mx-2 mb-5 rounded-full ${i < step - 1 ? 'bg-stone-900' : 'bg-stone-200'}`} />
                    )}
                  </div>
                );
              })}
            </div>
            {order.status === 'pending_payment' && (
              <p className="text-xs text-orange-600 font-medium mt-4 flex items-center gap-1.5">
                <Clock size={12} /> Waiting for your MTN MoMo payment to be confirmed.
              </p>
            )}
          </div>
        )}

        {/* Items */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="px-5 py-5 space-y-4">
            {order.items?.map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-14 flex-shrink-0 overflow-hidden rounded-xl bg-stone-100" style={{ height: '72px' }}>
                  <img src={item.images?.[0]} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-800 truncate font-heading">{item.name}</p>
                  <div className="flex gap-1.5 mt-1">
                    {item.color && <span className="text-[10px] font-semibold bg-stone-100 text-stone-600 px-2 py-0.5 rounded-lg">{item.color}</span>}
                    {item.size && <span className="text-[10px] font-semibold bg-stone-100 text-stone-600 px-2 py-0.5 rounded-lg">Size {item.size}</span>}
                    <span className="text-[10px] font-semibold text-stone-400">×{item.quantity}</span>
                  </div>
                </div>
                <p className="text-sm font-bold text-stone-900 flex-shrink-0 font-heading">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          {/* Price breakdown */}
          <div className="border-t border-stone-100 bg-stone-50/60 px-5 py-4 space-y-2 text-sm">
            <div className="flex justify-between text-stone-500">
              <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-green-600">
                <span className="flex items-center gap-1.5"><Tag size={12} /> Discount{order.discount_code ? ` (${order.discount_code})` : ''}</span>
                <span>−{formatPrice(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-stone-500">
              <span>Delivery{addr.zone ? ` — ${addr.zone}` : ''}</span>
              <span className={order.shipping_fee === 0 ? 'text-green-600 font-semibold' : ''}>
                {order.shipping_fee === 0 ? 'FREE' : formatPrice(order.shipping_fee)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-stone-900 pt-2 border-t border-stone-200 font-heading">
              <span>Total</span><span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Delivery + payment info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">Delivery</p>
            <div className="space-y-2 text-sm text-stone-600">
              <p className="flex items-start gap-2">
                <MapPin size={14} className="text-stone-400 mt-0.5 flex-shrink-0" />
                <span>
                  {addr.name && <span className="font-semibold text-stone-800 block">{addr.name}</span>}
                  {addr.street}{addr.street ? ', ' : ''}{addr.city}
                  {addr.zone && <span className="block text-xs text-stone-400 mt-0.5">Zone: {addr.zone}</span>}
                </span>
              </p>
              {addr.phone && (
                <p className="flex items-center gap-2"><Phone size={13} className="text-stone-400" /> {addr.phone}</p>
              )}
            </div>
          </div>
          <div className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">Payment</p>
            <p className="flex items-center gap-2 text-sm text-stone-600">
              {isMtn ? <Smartphone size={14} className="text-yellow-500" /> : <CreditCard size={14} className="text-stone-400" />}
              {order.payment_method || 'Card'}
            </p>
            {order.stripe_payment_id && (
              <p className="text-[10px] text-stone-400 mt-2 font-mono break-all">Ref: {order.stripe_payment_id}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
