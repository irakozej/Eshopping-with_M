import { useState, useEffect, useRef } from 'react';
import { Bell, ShoppingBag, MessageSquarePlus, Star, X, CheckCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const TYPE_ICON = {
  order: ShoppingBag,
  request: MessageSquarePlus,
  review: Star,
};
const TYPE_COLOR = {
  order: 'bg-blue-100 text-blue-600',
  request: 'bg-accent-light text-accent',
  review: 'bg-amber-100 text-amber-600',
};

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const fetchUnread = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnread(res.data.count);
    } catch {}
  };

  const fetchAll = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
      setUnread(res.data.filter(n => !n.read).length);
    } catch {}
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) fetchAll();
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
    setUnread(0);
  };

  const markRead = async (notif) => {
    // Idempotent: only hit the API / decrement the count if it was unread.
    if (!notif.read) {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: 1 } : n));
      setUnread(prev => Math.max(0, prev - 1));
      try { await api.put(`/notifications/${notif.id}/read`); } catch {}
    }
  };

  // Click a notification: mark it read, then deep-link to its target.
  // Old rows with no link simply don't navigate (and never crash).
  const handleClick = (notif) => {
    markRead(notif);
    setOpen(false);
    if (notif.link) navigate(notif.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} className={unread > 0 ? 'text-accent' : 'text-stone-600'} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white border border-stone-200 shadow-xl rounded-xl z-50 animate-scale-in overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
            <div>
              <p className="text-sm font-semibold text-stone-900">Notifications</p>
              {unread > 0 && <p className="text-[10px] text-stone-400">{unread} unread</p>}
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] text-accent hover:underline flex items-center gap-1"
                >
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-stone-50">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-stone-400 text-sm">
                <Bell size={24} className="mx-auto mb-2 opacity-30" />
                No notifications yet
              </div>
            ) : notifications.map(n => {
              const Icon = TYPE_ICON[n.type] || Bell;
              const colorCls = TYPE_COLOR[n.type] || 'bg-stone-100 text-stone-500';
              return (
                <div
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-stone-50 transition-colors cursor-pointer ${!n.read ? 'bg-accent-light/30' : ''}`}
                  onClick={() => handleClick(n)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(n); } }}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${colorCls}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${!n.read ? 'text-stone-900' : 'text-stone-600'}`}>{n.title}</p>
                    <p className="text-[11px] text-stone-500 mt-0.5 leading-snug line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-stone-400 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-2" />}
                </div>
              );
            })}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-stone-100 bg-stone-50">
              <Link
                to={isAdmin ? '/admin/orders' : '/orders'}
                className="text-xs text-accent font-medium hover:underline"
                onClick={() => setOpen(false)}
              >
                {isAdmin ? 'View all orders →' : 'View my orders →'}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
