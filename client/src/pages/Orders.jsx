import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronDown, ArrowRight, MapPin, ShoppingBag, Clock, Check } from 'lucide-react';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatPrice } from '../lib/formatPrice';

const STATUS_CONFIG = {
  pending:         { label: 'Pending',        color: 'bg-amber-100 text-amber-700 border-amber-200',       dot: 'bg-amber-400' },
  pending_payment: { label: 'Awaiting Pymt',  color: 'bg-orange-100 text-orange-700 border-orange-200',    dot: 'bg-orange-400' },
  processing:      { label: 'Processing',     color: 'bg-blue-100 text-blue-700 border-blue-200',          dot: 'bg-blue-500' },
  shipped:         { label: 'Shipped',        color: 'bg-purple-100 text-purple-700 border-purple-200',    dot: 'bg-purple-500' },
  delivered:       { label: 'Delivered',      color: 'bg-green-100 text-green-700 border-green-200',       dot: 'bg-green-500' },
  cancelled:       { label: 'Cancelled',      color: 'bg-red-100 text-red-600 border-red-200',             dot: 'bg-red-400' },
};

export default function Orders() {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get('/orders')
      .then(res => setOrders(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  return (
    <div className="min-h-screen bg-cream">
      {/* Page header */}
      <div className="page-header">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl font-heading font-semibold text-stone-900">My Orders</h1>
          <p className="text-sm text-stone-400 mt-1 font-medium">
            {orders.length} order{orders.length !== 1 ? 's' : ''} placed
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {orders.length === 0 ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center text-center py-16">
            <div className="w-24 h-24 bg-stone-100 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-scale-in">
              <Package size={36} className="text-stone-300" />
            </div>
            <h2 className="text-xl font-heading font-semibold text-stone-700 mb-2">No orders yet</h2>
            <p className="text-stone-400 text-sm mb-8 max-w-xs">You haven't placed any orders. Start exploring our collection!</p>
            <Link to="/products" className="btn-primary px-8 py-4 group">
              Start Shopping <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, idx) => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const isOpen = expanded === order.id;
              return (
                <div key={order.id}
                  className="card overflow-hidden animate-fade-in"
                  style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'backwards' }}>

                  {/* Order header */}
                  <button
                    className="w-full flex flex-wrap items-center justify-between gap-3 px-5 py-4 cursor-pointer hover:bg-stone-50/60 transition-colors text-left"
                    onClick={() => setExpanded(isOpen ? null : order.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                        ${order.status === 'delivered' ? 'bg-green-50' : 'bg-stone-100'}`}>
                        {order.status === 'delivered'
                          ? <Check size={16} className="text-green-600" strokeWidth={2.5} />
                          : <Clock size={16} className="text-stone-400" />
                        }
                      </div>
                      <div>
                        <p className="font-heading font-bold text-stone-900 text-sm">Order #{order.id}</p>
                        <p className="text-xs text-stone-400 font-medium">
                          {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-heading font-bold text-stone-900">{formatPrice(order.total)}</span>
                      <span className={`text-xs px-3 py-1.5 capitalize font-semibold rounded-full border ${cfg.color}`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1.5`} />
                        {cfg.label}
                      </span>
                      <ChevronDown size={15} className={`text-stone-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isOpen && (
                    <div className="border-t border-stone-100 animate-slide-up">
                      {/* Item list */}
                      <div className="px-5 py-5 space-y-4">
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex items-center gap-4">
                            <div className="w-14 flex-shrink-0 overflow-hidden rounded-xl bg-stone-100" style={{ height: '72px' }}>
                              <img
                                src={item.images?.[0]}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-stone-800 truncate font-heading">{item.name}</p>
                              <div className="flex gap-1.5 mt-1">
                                {item.color && (
                                  <span className="text-[10px] font-semibold bg-stone-100 text-stone-600 px-2 py-0.5 rounded-lg">{item.color}</span>
                                )}
                                {item.size && (
                                  <span className="text-[10px] font-semibold bg-stone-100 text-stone-600 px-2 py-0.5 rounded-lg">Size {item.size}</span>
                                )}
                                <span className="text-[10px] font-semibold text-stone-400">×{item.quantity}</span>
                              </div>
                            </div>
                            <p className="text-sm font-bold text-stone-900 flex-shrink-0 font-heading">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="border-t border-stone-50 bg-stone-50/60 px-5 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          {order.shipping_address && (
                            <div className="flex items-start gap-2 text-stone-500">
                              <MapPin size={13} className="text-stone-400 mt-0.5 flex-shrink-0" />
                              <span>
                                {order.shipping_address.name && (
                                  <span className="font-semibold text-stone-700">{order.shipping_address.name}, </span>
                                )}
                                {order.shipping_address.street}, {order.shipping_address.city}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-3 sm:justify-end">
                            <Link to={`/orders/${order.id}`}
                              className="inline-flex items-center gap-1 text-xs text-accent font-semibold hover:underline">
                              View full details <ArrowRight size={11} />
                            </Link>
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${cfg.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                              {cfg.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {orders.length > 0 && (
          <div className="mt-10 text-center">
            <Link to="/products"
              className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-accent transition-colors font-medium group">
              <ShoppingBag size={14} />
              Continue Shopping
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
