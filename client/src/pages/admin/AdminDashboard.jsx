import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, Users, TrendingUp, ChevronRight, AlertCircle, Tag, AlertTriangle } from 'lucide-react';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatPrice } from '../../lib/formatPrice';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  reviewing: 'bg-blue-100 text-blue-700',
  fulfilled: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lowStock, setLowStock] = useState([]);

  useEffect(() => {
    api.get('/admin/stats')
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
    api.get('/admin/low-stock')
      .then(res => setLowStock(res.data))
      .catch(() => {});
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-light tracking-wide">Admin Dashboard</h1>
          <p className="text-sm text-stone-400 mt-0.5">Welcome back, Admin</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/requests" className="btn-secondary py-2 px-4 text-sm">
            Requests
            {stats?.pendingRequests > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs w-5 h-5 rounded-full inline-flex items-center justify-center font-bold">
                {stats.pendingRequests}
              </span>
            )}
          </Link>
          <Link to="/admin/discounts" className="btn-secondary py-2 px-4 text-sm flex items-center gap-1.5"><Tag size={13} /> Discounts</Link>
          <Link to="/admin/products" className="btn-secondary py-2 px-4 text-sm">Products</Link>
          <Link to="/admin/orders" className="btn-primary py-2 px-4 text-sm">Orders</Link>
        </div>
      </div>

      {/* Stat Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Products', value: stats.totalProducts, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', link: '/admin/products' },
            { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingCart, color: 'text-purple-600', bg: 'bg-purple-50', link: '/admin/orders' },
            { label: 'Customers', value: stats.totalUsers, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50', link: null },
            { label: 'Revenue', value: formatPrice(stats.revenue), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', link: null },
          ].map(card => (
            <div key={card.label} className={`bg-white border border-stone-100 p-5 shadow-sm ${card.link ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}>
              {card.link ? (
                <Link to={card.link} className="block">
                  <StatCardContent card={card} />
                </Link>
              ) : <StatCardContent card={card} />}
            </div>
          ))}
        </div>
      )}

      {/* Pending Requests Alert */}
      {stats?.pendingRequests > 0 && (
        <div className="bg-amber-50 border border-amber-200 px-5 py-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="text-amber-600" />
            <p className="text-sm text-amber-800 font-medium">
              {stats.pendingRequests} pending product request{stats.pendingRequests !== 1 ? 's' : ''} need your review
            </p>
          </div>
          <Link to="/admin/requests" className="btn-accent py-2 px-4 text-xs">
            Review Now <ChevronRight size={13} />
          </Link>
        </div>
      )}

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="bg-white border border-orange-200 shadow-sm mb-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-orange-100 bg-orange-50">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-500" />
              <h2 className="font-semibold text-orange-800">Low Stock Alert</h2>
              <span className="bg-orange-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {lowStock.length}
              </span>
            </div>
            <Link to="/admin/products" className="text-xs text-orange-600 hover:text-orange-800 flex items-center gap-1 transition-colors">
              Manage <ChevronRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-stone-50">
            {lowStock.map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <p className="text-sm font-medium text-stone-800 line-clamp-1">{p.name}</p>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                    {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        {stats?.recentOrders?.length > 0 && (
          <div className="bg-white border border-stone-100 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
              <h2 className="font-semibold text-stone-800">Recent Orders</h2>
              <Link to="/admin/orders" className="text-xs text-stone-400 hover:text-stone-700 flex items-center gap-1 transition-colors">
                View all <ChevronRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-stone-50">
              {stats.recentOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-stone-800">#{order.id} · {order.user_name}</p>
                    <p className="text-xs text-stone-400">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold text-stone-900">{formatPrice(order.total)}</p>
                    <span className={`text-xs px-2.5 py-1 capitalize font-medium rounded-full ${STATUS_COLORS[order.status] || 'bg-stone-100 text-stone-600'}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Product Requests */}
        {stats?.recentRequests?.length > 0 && (
          <div className="bg-white border border-stone-100 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-stone-800">Product Requests</h2>
                {stats.pendingRequests > 0 && (
                  <span className="bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {stats.pendingRequests}
                  </span>
                )}
              </div>
              <Link to="/admin/requests" className="text-xs text-stone-400 hover:text-stone-700 flex items-center gap-1 transition-colors">
                View all <ChevronRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-stone-50">
              {stats.recentRequests.map(req => (
                <div key={req.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-stone-800 line-clamp-1">{req.name}</p>
                    <p className="text-xs text-stone-400">{req.user_name} · {new Date(req.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 capitalize font-medium rounded-full ${STATUS_COLORS[req.status] || 'bg-stone-100 text-stone-600'}`}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCardContent({ card }) {
  return (
    <>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${card.bg}`}>
        <card.icon size={18} className={card.color} />
      </div>
      <p className="text-xl font-bold text-stone-900">{card.value}</p>
      <p className="text-xs text-stone-500 uppercase tracking-wider mt-1">{card.label}</p>
    </>
  );
}
