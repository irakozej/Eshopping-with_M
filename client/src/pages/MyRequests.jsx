import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquarePlus, Clock, CheckCircle, XCircle, Eye, ArrowRight, Plus } from 'lucide-react';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatPrice } from '../lib/formatPrice';

const STATUS_CONFIG = {
  pending:   {
    label: 'Pending Review',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    bar: 'bg-amber-400',
    icon: Clock,
    step: 1,
  },
  reviewing: {
    label: 'Under Review',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    bar: 'bg-blue-500',
    icon: Eye,
    step: 2,
  },
  fulfilled: {
    label: 'Available!',
    color: 'bg-green-100 text-green-700 border-green-200',
    bar: 'bg-green-500',
    icon: CheckCircle,
    step: 3,
  },
  rejected:  {
    label: 'Not Available',
    color: 'bg-red-100 text-red-600 border-red-200',
    bar: 'bg-red-400',
    icon: XCircle,
    step: 0,
  },
};

const STEPS = ['Submitted', 'Under Review', 'Sourced'];

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/requests')
      .then(res => setRequests(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-white border-b border-stone-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-semibold text-stone-900">My Requests</h1>
            <p className="text-sm text-stone-400 mt-1 font-medium">
              {requests.length} request{requests.length !== 1 ? 's' : ''} submitted
            </p>
          </div>
          <Link to="/request" className="btn-accent gap-2 py-2.5 cursor-pointer">
            <Plus size={15} /> New Request
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {requests.length === 0 ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center text-center py-16">
            <div className="w-24 h-24 bg-stone-100 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-scale-in">
              <MessageSquarePlus size={36} className="text-stone-300" />
            </div>
            <h2 className="text-xl font-heading font-semibold text-stone-700 mb-2">No requests yet</h2>
            <p className="text-stone-400 text-sm mb-2 max-w-xs">
              Can't find a product? Our team will source it for you!
            </p>
            <p className="text-stone-300 text-xs mb-8">Upload photos and a description — we'll handle the rest.</p>
            <Link to="/request" className="btn-accent px-8 py-4 group cursor-pointer">
              Request a Product
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {requests.map((req, idx) => {
              const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;
              return (
                <div key={req.id}
                  className="card overflow-hidden animate-fade-in"
                  style={{ animationDelay: `${idx * 60}ms`, animationFillMode: 'backwards' }}>

                  {/* Progress bar top */}
                  {req.status !== 'rejected' && (
                    <div className="h-1 bg-stone-100">
                      <div className={`h-full ${cfg.bar} transition-all duration-700`}
                        style={{ width: `${(cfg.step / 3) * 100}%` }} />
                    </div>
                  )}

                  <div className="p-5 flex items-start gap-4">
                    {/* Image or placeholder */}
                    <div className="flex-shrink-0">
                      {req.images?.length > 0 ? (
                        <div className="w-18 h-22 bg-stone-100 overflow-hidden rounded-xl" style={{ width: '72px', height: '88px' }}>
                          <img src={req.images[0]} alt={req.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-18 rounded-xl bg-stone-100 flex items-center justify-center" style={{ width: '72px', height: '88px' }}>
                          <MessageSquarePlus size={22} className="text-stone-300" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                        <div>
                          <p className="font-heading font-bold text-stone-900">{req.name}</p>
                          <p className="text-xs text-stone-400 mt-0.5 font-medium capitalize">
                            {req.category} &nbsp;·&nbsp;
                            {new Date(req.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border flex-shrink-0 ${cfg.color}`}>
                          <StatusIcon size={11} />
                          {cfg.label}
                        </span>
                      </div>

                      <p className="text-sm text-stone-500 line-clamp-2 leading-relaxed">{req.description}</p>

                      {req.budget && (
                        <p className="text-xs text-stone-400 mt-2 font-medium">
                          Budget: <span className="font-bold text-stone-600">{formatPrice(req.budget)}</span>
                        </p>
                      )}

                      {/* Admin note */}
                      {req.admin_note && (
                        <div className="mt-3 bg-accent-light border border-accent/25 rounded-xl px-4 py-3">
                          <p className="text-xs font-bold text-accent mb-1 flex items-center gap-1.5">
                            <MessageSquarePlus size={11} /> Message from our team
                          </p>
                          <p className="text-xs text-stone-700 leading-relaxed">{req.admin_note}</p>
                        </div>
                      )}

                      {/* Steps indicator (non-rejected) */}
                      {req.status !== 'rejected' && (
                        <div className="mt-4 flex items-center gap-0">
                          {STEPS.map((step, i) => {
                            const done = i < cfg.step;
                            const active = i === cfg.step - 1;
                            return (
                              <div key={step} className="flex items-center">
                                <div className={`flex items-center gap-1.5 text-[10px] font-bold
                                  ${done || active ? 'text-stone-700' : 'text-stone-300'}`}>
                                  <div className={`w-4 h-4 rounded-full flex items-center justify-center
                                    ${done ? 'bg-stone-900 text-white' : active ? `${cfg.bar} text-white` : 'bg-stone-200'}`}>
                                    {done || active ? '✓' : ''}
                                  </div>
                                  <span className="hidden sm:inline">{step}</span>
                                </div>
                                {i < STEPS.length - 1 && (
                                  <div className={`h-px w-6 sm:w-10 mx-1.5 ${i < cfg.step - 1 ? 'bg-stone-400' : 'bg-stone-200'}`} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {req.status === 'fulfilled' && (
                        <Link to="/products"
                          className="inline-flex items-center gap-1.5 mt-3 text-xs text-green-700 font-bold hover:text-green-800 transition-colors group">
                          Browse products
                          <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
