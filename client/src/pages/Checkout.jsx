import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Lock, Tag, Smartphone, CreditCard, ChevronDown, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { formatPrice } from '../lib/formatPrice';
import { trackEvent } from '../lib/analytics';
import { stripePromise, stripeConfigured } from '../lib/stripe';
import { DELIVERY_FREE_THRESHOLD_RWF, PAYMENTS_STRIPE_ENABLED } from '../lib/config';

const DELIVERY_ZONES = [
  { label: 'Kigali City (Nyarugenge, Gasabo, Kicukiro)', fee: 2000 },
  { label: 'Bugesera / Rwamagana / Rulindo',              fee: 3500 },
  { label: 'Musanze / Rubavu / Burera',                   fee: 5000 },
  { label: 'Huye / Muhanga / Nyanza',                     fee: 5000 },
  { label: 'Rusizi / Nyamagabe / Karongi',                fee: 6000 },
  { label: 'Rest of Rwanda',                              fee: 6000 },
];

const FREE_THRESHOLD = DELIVERY_FREE_THRESHOLD_RWF;
const INIT_ADDRESS = {
  firstName: '', lastName: '', street: '', city: 'Kigali',
  state: 'Kigali City', zip: '', country: 'Rwanda', phone: '',
};

function CardPaymentForm({ total, loading, setLoading, setError, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError('');
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + '/orders' },
      redirect: 'if_required',
    });
    if (error) {
      setError(error.message || 'Card payment failed.');
      setLoading(false);
      return;
    }
    if (paymentIntent && paymentIntent.status === 'succeeded') {
      await onSuccess(paymentIntent.id);
    } else {
      setError(`Unexpected payment status: ${paymentIntent?.status || 'unknown'}`);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-3 flex items-start gap-2 rounded-2xl">
        <Lock size={13} className="mt-0.5 flex-shrink-0" />
        <span><strong>Test mode</strong> — Use card <code className="bg-amber-100 px-1.5 py-0.5 rounded-lg">4242 4242 4242 4242</code>, any future date, any CVC, any ZIP.</span>
      </div>
      <PaymentElement options={{ layout: 'tabs' }} />
      <button
        type="submit"
        disabled={!stripe || loading}
        className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2.5 font-semibold rounded-2xl active:scale-[0.98] cursor-pointer"
      >
        {loading
          ? (<><Loader2 size={18} className="animate-spin" /> Processing…</>)
          : (<><Lock size={16} /> Pay {formatPrice(total)}</>)}
      </button>
    </form>
  );
}

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep]           = useState(1);
  const [address, setAddress]     = useState(INIT_ADDRESS);
  const [zoneIndex, setZoneIndex] = useState(0);
  // Card (Stripe) is gated behind a flag; default to MoMo when it's off.
  const [paymentMethod, setPaymentMethod] = useState(PAYMENTS_STRIPE_ENABLED ? 'card' : 'mtn');
  const [mtnPhone, setMtnPhone]   = useState('');
  const [clientSecret, setClientSecret] = useState(null);
  const [intentLoading, setIntentLoading] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [orderId, setOrderId]     = useState(null);

  const [momoReferenceId, setMomoReferenceId] = useState(null);
  const [momoStatus, setMomoStatus]           = useState('PENDING');
  const [momoConfigured, setMomoConfigured]   = useState(true);
  const pollRef = useRef(null);

  const [discountCode, setDiscountCode]         = useState('');
  const [discount, setDiscount]                 = useState(null);
  const [discountLoading, setDiscountLoading]   = useState(false);
  const [discountError, setDiscountError]       = useState('');

  const zone          = DELIVERY_ZONES[zoneIndex];
  const shipping      = subtotal >= FREE_THRESHOLD ? 0 : zone.fee;
  const discountAmount = discount?.amount || 0;
  const total         = Math.max(0, subtotal + shipping - discountAmount);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  useEffect(() => {
    if (items.length > 0) {
      trackEvent('begin_checkout', {
        items: items.length,
        subtotal,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateAddr = (f, v) => setAddress(p => ({ ...p, [f]: v }));

  // Fetch a fresh PaymentIntent whenever the card step is active and total changes
  useEffect(() => {
    if (step !== 2 || paymentMethod !== 'card' || !user || !stripeConfigured || total < 50) return;
    let cancelled = false;
    setIntentLoading(true);
    setError('');
    api.post('/payments/create-intent', { amount: total })
      .then(res => { if (!cancelled) setClientSecret(res.data.clientSecret); })
      .catch(err => {
        if (!cancelled) setError(err.response?.data?.error || 'Could not initialize card payment.');
      })
      .finally(() => { if (!cancelled) setIntentLoading(false); });
    return () => { cancelled = true; };
  }, [step, paymentMethod, total, user]);

  const shippingAddressPayload = () => ({
    name: `${address.firstName} ${address.lastName}`,
    street: address.street, city: address.city,
    state: address.state, zip: address.zip,
    country: address.country, phone: address.phone, zone: zone.label,
  });

  const finalizeCardOrder = async (paymentIntentId) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/orders', {
        shipping_address: shippingAddressPayload(),
        stripe_payment_id: paymentIntentId,
        payment_method: 'Card',
        discount_code: discount?.code || null,
        shipping_fee: shipping,
      });
      trackEvent('purchase', {
        order_id: String(res.data.id),
        total,
        payment_method: 'Card',
      });
      setOrderId(res.data.id);
      await clearCart();
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Order creation failed after payment. Contact support with your card statement.');
    } finally {
      setLoading(false);
    }
  };

  const applyDiscount = async () => {
    if (!discountCode.trim()) return;
    setDiscountLoading(true);
    setDiscountError('');
    try {
      const res = await api.post('/discounts/validate', { code: discountCode, subtotal });
      setDiscount(res.data);
    } catch (err) {
      setDiscountError(err.response?.data?.error || 'Invalid discount code');
      setDiscount(null);
    } finally {
      setDiscountLoading(false);
    }
  };
  const removeDiscount = () => { setDiscount(null); setDiscountCode(''); setDiscountError(''); };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (['firstName', 'lastName', 'street', 'city'].some(f => !address[f].trim())) {
      setError('Please fill in all required fields');
      return;
    }
    setError('');
    setStep(2);
  };

  const startPolling = (referenceId) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/payments/momo-status/${referenceId}`);
        const { status } = res.data;
        setMomoStatus(status);
        if (status === 'SUCCESSFUL') {
          clearInterval(pollRef.current);
          await clearCart();
          setStep(3);
        } else if (status === 'FAILED') {
          clearInterval(pollRef.current);
        }
      } catch {}
    }, 4000);
  };

  const handleMtnSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!mtnPhone.trim()) {
      setError('Please enter your MTN Mobile Money number');
      return;
    }

    setLoading(true);
    try {
      let orderData;
      if (user) {
        const res = await api.post('/orders', {
          shipping_address: shippingAddressPayload(),
          stripe_payment_id: null,
          payment_method: 'MTN Mobile Money',
          discount_code: discount?.code || null,
          shipping_fee: shipping,
          mtn_phone: mtnPhone,
        });
        orderData = res.data;
      } else {
        orderData = { id: `GUEST-${Date.now()}`, total };
      }

      setOrderId(orderData.id);

      if (orderData.momoReferenceId) {
        setMomoReferenceId(orderData.momoReferenceId);
        setMomoStatus('PENDING');
        setMomoConfigured(true);
        setStep(2.5);
        startPolling(orderData.momoReferenceId);
      } else {
        trackEvent('purchase', {
          order_id: String(orderData.id),
          total,
          payment_method: 'MTN Mobile Money',
        });
        await clearCart();
        setMomoConfigured(orderData.momoConfigured !== false);
        setStep(3);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && step !== 3 && step !== 2.5) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <p className="text-stone-500 mb-4">Your bag is empty.</p>
        <Link to="/products" className="btn-primary">Shop Now</Link>
      </div>
    );
  }

  /* ── MoMo Waiting ── */
  if (step === 2.5) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center animate-fade-in">
          {momoStatus === 'PENDING' && (
            <div className="card p-10">
              <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-yellow-100">
                <Loader2 size={36} className="text-yellow-500 animate-spin" />
              </div>
              <h1 className="text-2xl font-heading font-semibold mb-3 text-stone-900">Awaiting Payment</h1>
              <p className="text-stone-500 mb-2">
                A payment of <span className="font-bold text-stone-900">{formatPrice(total)}</span> was sent to:
              </p>
              <p className="text-lg font-mono font-bold text-stone-900 bg-stone-100 inline-block px-5 py-2.5 rounded-2xl mb-6">
                {mtnPhone}
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-4 text-sm text-left space-y-2 mb-8">
                <p className="font-semibold text-yellow-800 text-sm">Steps to approve:</p>
                <ol className="list-decimal list-inside text-yellow-700 space-y-1 text-sm">
                  <li>Check your phone for an MTN MoMo prompt</li>
                  <li>Enter your MoMo PIN to approve</li>
                  <li>This page will update automatically</li>
                </ol>
              </div>
              <p className="text-xs text-stone-400">Checking for payment every few seconds…</p>
            </div>
          )}

          {momoStatus === 'FAILED' && (
            <div className="card p-10">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-red-100">
                <AlertCircle size={36} className="text-red-500" />
              </div>
              <h1 className="text-2xl font-heading font-semibold mb-3 text-red-700">Payment Failed</h1>
              <p className="text-stone-500 mb-6">
                The MTN Mobile Money payment was declined or timed out. Please check your balance and try again.
              </p>
              <div className="space-y-3">
                <button onClick={() => { setStep(2); setError(''); }} className="btn-primary w-full py-4">
                  Try Again
                </button>
                <Link to="/products" className="btn-secondary w-full py-4">Continue Shopping</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Order Confirmed ── */
  if (step === 3) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center animate-fade-in">
          <div className="card p-10">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-100 shadow-sm">
              <Check size={36} className="text-green-600" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-heading font-light mb-2 text-stone-900">Order Confirmed!</h1>
            <p className="text-stone-500 mb-1">Thank you for shopping with Beyond Beauty Boutique.</p>
            <p className="text-xs text-stone-400 bg-stone-100 inline-block px-5 py-2.5 mt-2 mb-6 font-mono rounded-2xl">
              Order #{orderId}
            </p>

            {paymentMethod === 'mtn' && !momoConfigured && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3 text-sm text-yellow-800 mb-6 text-left">
                <p className="font-semibold mb-1">Demo Mode</p>
                <p className="text-xs">MTN MoMo credentials are not yet configured. No real payment was charged.</p>
              </div>
            )}

            <p className="text-sm text-stone-500 mb-8">
              {paymentMethod === 'mtn' && momoConfigured
                ? "Your payment was received. We'll prepare your order for delivery."
                : "We'll contact you via phone once your order is ready for delivery."}
            </p>
            <div className="space-y-3">
              {user && <Link to="/orders" className="btn-primary w-full py-4 group">View My Orders <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" /></Link>}
              <Link to="/products" className="btn-secondary w-full py-4">Continue Shopping</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const STEPS = ['Shipping', 'Payment', 'Confirmed'];

  return (
    <div className="min-h-screen bg-cream">
      <div className="page-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl font-heading font-semibold text-stone-900">Checkout</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* ── Step indicator ── */}
        <div className="flex items-center mb-10">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className="flex items-center gap-2">
                <div className={`step-dot ${
                  step > i + 1  ? 'step-dot-done'
                  : step === i + 1 ? 'step-dot-active'
                  : 'step-dot-idle'}`}>
                  {step > i + 1 ? <Check size={14} strokeWidth={2.5} /> : i + 1}
                </div>
                <span className={`text-sm hidden sm:inline font-semibold transition-colors ${step === i + 1 ? 'text-stone-900' : 'text-stone-400'}`}>
                  {s}
                </span>
              </div>
              {i < 2 && (
                <div className={`mx-3 flex-1 h-0.5 rounded-full transition-colors duration-500 ${step > i + 1 ? 'bg-green-400' : 'bg-stone-200'}`}
                  style={{ minWidth: '2rem' }} />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* ── Form ── */}
          <div className="lg:col-span-2">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3.5 mb-6 rounded-2xl flex items-start gap-2">
                <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Step 1 — Address */}
            {step === 1 && (
              <form onSubmit={handleAddressSubmit} className="space-y-5 animate-fade-in">
                <div className="card p-6 space-y-5">
                  <h2 className="text-base font-heading font-bold text-stone-800">Shipping Address</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">First Name *</label>
                      <input value={address.firstName} onChange={e => updateAddr('firstName', e.target.value)} className="input-field" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Last Name *</label>
                      <input value={address.lastName} onChange={e => updateAddr('lastName', e.target.value)} className="input-field" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Phone Number</label>
                    <input value={address.phone} onChange={e => updateAddr('phone', e.target.value)} className="input-field" placeholder="e.g. 078 000 0000" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Street / Area *</label>
                    <input value={address.street} onChange={e => updateAddr('street', e.target.value)} className="input-field" required placeholder="e.g. KG 11 Ave, Nyamirambo" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">City *</label>
                      <input value={address.city} onChange={e => updateAddr('city', e.target.value)} className="input-field" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">District</label>
                      <input value={address.state} onChange={e => updateAddr('state', e.target.value)} className="input-field" placeholder="Kigali City" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Country</label>
                    <select value={address.country} onChange={e => updateAddr('country', e.target.value)} className="input-field cursor-pointer">
                      {['Rwanda', 'Uganda', 'Kenya', 'Tanzania', 'DRC'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Delivery Zone *</label>
                    <div className="relative">
                      <select value={zoneIndex} onChange={e => setZoneIndex(Number(e.target.value))} className="input-field appearance-none pr-8 cursor-pointer">
                        {DELIVERY_ZONES.map((z, i) => (
                          <option key={i} value={i}>{z.label} — {subtotal >= FREE_THRESHOLD ? 'FREE' : formatPrice(z.fee)}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                    </div>
                    {subtotal >= FREE_THRESHOLD && (
                      <p className="text-xs text-green-600 font-semibold mt-1.5">Free delivery applied (order over {formatPrice(FREE_THRESHOLD)})</p>
                    )}
                  </div>
                </div>
                <button type="submit" className="btn-primary w-full py-4 text-base group">
                  Continue to Payment <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            )}

            {/* Step 2 — Payment */}
            {step === 2 && (
              <div className="space-y-5 animate-fade-in">
                <div className="card p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-heading font-bold text-stone-800">Payment Method</h2>
                    <button type="button" onClick={() => setStep(1)}
                      className="text-sm text-stone-400 hover:text-stone-700 transition-colors font-medium cursor-pointer">
                      ← Edit Address
                    </button>
                  </div>

                  {/* Payment method selector */}
                  <div className={`grid gap-3 ${PAYMENTS_STRIPE_ENABLED ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {PAYMENTS_STRIPE_ENABLED && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`flex items-center gap-3 p-4 border-2 rounded-2xl transition-all cursor-pointer
                        ${paymentMethod === 'card'
                          ? 'border-stone-900 bg-stone-50 shadow-sm'
                          : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/50'}`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                        ${paymentMethod === 'card' ? 'bg-stone-900' : 'bg-stone-100'}`}>
                        <CreditCard size={16} className={paymentMethod === 'card' ? 'text-white' : 'text-stone-400'} />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-stone-800">Card</p>
                        <p className="text-[10px] text-stone-400">Visa, Mastercard</p>
                      </div>
                    </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('mtn')}
                      className={`flex items-center gap-3 p-4 border-2 rounded-2xl transition-all cursor-pointer
                        ${paymentMethod === 'mtn'
                          ? 'border-yellow-400 bg-yellow-50 shadow-sm'
                          : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/50'}`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                        ${paymentMethod === 'mtn' ? 'bg-yellow-400' : 'bg-stone-100'}`}>
                        <Smartphone size={16} className={paymentMethod === 'mtn' ? 'text-stone-900' : 'text-stone-400'} />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-stone-800">MTN MoMo</p>
                        <p className="text-[10px] text-stone-400">Rwanda MoMo</p>
                      </div>
                    </button>
                  </div>

                  {PAYMENTS_STRIPE_ENABLED && paymentMethod === 'card' && (
                    !stripeConfigured ? (
                      <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl p-4">
                        <p className="font-semibold mb-1">Stripe is not configured</p>
                        <p className="text-xs">Set <code className="bg-red-100 px-1 rounded">VITE_STRIPE_PUBLISHABLE_KEY</code> in <code>client/.env</code> and <code>STRIPE_SECRET_KEY</code> in <code>server/.env</code>, then restart the dev server.</p>
                      </div>
                    ) : intentLoading || !clientSecret ? (
                      <div className="flex items-center justify-center py-10 text-stone-400 text-sm">
                        <Loader2 size={18} className="animate-spin mr-2" /> Preparing secure payment…
                      </div>
                    ) : (
                      <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#CA8A04' } } }}>
                        <CardPaymentForm
                          total={total}
                          loading={loading}
                          setLoading={setLoading}
                          setError={setError}
                          onSuccess={finalizeCardOrder}
                        />
                      </Elements>
                    )
                  )}

                  {paymentMethod === 'mtn' && (
                    <form onSubmit={handleMtnSubmit} className="space-y-4">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-4">
                        <p className="text-sm font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                          <Smartphone size={15} /> How MTN MoMo works
                        </p>
                        <ol className="text-xs text-yellow-700 space-y-1 list-decimal list-inside">
                          <li>Enter your MTN number below and click Pay</li>
                          <li>You'll instantly receive a payment prompt on your phone</li>
                          <li>Enter your MoMo PIN to approve</li>
                          <li>Your order is confirmed automatically</li>
                        </ol>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">MTN Mobile Money Number *</label>
                        <input
                          value={mtnPhone}
                          onChange={e => setMtnPhone(e.target.value)}
                          className="input-field font-mono text-lg tracking-widest"
                          placeholder="e.g. 078 000 0000"
                          inputMode="tel"
                        />
                        <p className="text-[10px] text-stone-400 mt-1.5">Make sure this is your active MTN MoMo number with sufficient balance.</p>
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-mtn w-full py-4 text-base flex items-center justify-center gap-2.5 font-semibold rounded-2xl active:scale-[0.98] cursor-pointer"
                      >
                        {loading
                          ? (<><Loader2 size={18} className="animate-spin" /> Processing…</>)
                          : (<><Smartphone size={18} /> Send MoMo Request — {formatPrice(total)}</>)}
                      </button>
                    </form>
                  )}
                </div>

                {/* Discount code */}
                <div className="card p-5">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
                    <Tag size={12} /> Discount Code
                  </label>
                  {discount ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 px-4 py-3 rounded-2xl">
                      <div>
                        <p className="text-sm font-bold text-green-800 flex items-center gap-1.5">
                          <Check size={13} /> {discount.code}
                        </p>
                        <p className="text-xs text-green-600 mt-0.5">Saving {formatPrice(discountAmount)}</p>
                      </div>
                      <button type="button" onClick={removeDiscount}
                        className="text-xs font-semibold text-stone-400 hover:text-red-500 transition-colors cursor-pointer">
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={discountCode}
                        onChange={e => setDiscountCode(e.target.value.toUpperCase())}
                        className="input-field flex-1"
                        placeholder="Enter code (e.g. WELCOME10)"
                      />
                      <button type="button" onClick={applyDiscount}
                        disabled={discountLoading || !discountCode.trim()}
                        className="btn-secondary px-4 py-2 text-sm whitespace-nowrap cursor-pointer">
                        {discountLoading ? '...' : 'Apply'}
                      </button>
                    </div>
                  )}
                  {discountError && <p className="text-xs text-red-500 mt-2 font-medium">{discountError}</p>}
                </div>
              </div>
            )}
          </div>

          {/* ── Order Summary ── */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="text-base font-heading font-bold text-stone-900 mb-5">Order Summary</h2>
              <div className="space-y-3 mb-5 max-h-52 overflow-y-auto pr-1">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-14 bg-stone-100 flex-shrink-0 overflow-hidden aspect-[3/4] rounded-xl">
                      <img src={item.images?.[0]} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate text-stone-800">{item.name}</p>
                      <p className="text-xs text-stone-400 mt-0.5">{item.color} · {item.size} · ×{item.quantity}</p>
                      <p className="text-xs font-bold text-stone-900 mt-1">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-stone-100 pt-4 space-y-2.5 text-sm">
                <div className="flex justify-between text-stone-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-stone-800">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Delivery ({zone.label.split('(')[0].trim()})</span>
                  <span className={`font-semibold ${shipping === 0 ? 'text-green-600' : 'text-stone-800'}`}>
                    {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                  </span>
                </div>
                {discount && (
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Discount ({discount.code})</span>
                    <span>−{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-heading font-bold text-stone-900 border-t border-stone-100 pt-3 mt-1 text-base">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
