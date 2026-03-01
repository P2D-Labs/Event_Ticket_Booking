import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Helmet } from 'react-helmet-async';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import PageContainer, { PageHeading } from '../components/layout/PageContainer';

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

type Event = {
  id: string;
  title: string;
  eventDate: string;
  eventTime?: string;
  location: string;
  ticketTypes: { id: string; name: string; price: string; quantity: number; soldCount: number }[];
};

type Booking = {
  id: string;
  bookingNumber: string;
  subtotal: number;
  handlingFee: number;
  discountAmount?: number;
  total: number;
  items: { quantity: number; unitPrice: number; total: number; ticketType: { name: string } }[];
  event: { title: string; eventDate: string; eventTime?: string; location: string };
  promotion?: { id: string; name: string } | null;
};

function PaymentForm({
  clientSecret,
  booking,
  onSuccess,
}: {
  clientSecret: string;
  booking: Booking;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError(null);
    setLoading(true);
    const card = elements.getElement(CardElement);
    if (!card) {
      setLoading(false);
      return;
    }
    const { error: err } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card },
    });
    setLoading(false);
    if (err) {
      setError(err.message || 'Payment failed');
      return;
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-[var(--color-bg-card)] border border-[var(--color-border)]">
        <p className="text-[9px] tracking-widest uppercase text-[var(--color-primary)] mb-2">Card details</p>
        <CardElement
          options={{
            style: {
              base: {
                color: 'var(--color-text)',
                fontFamily: 'var(--font-body)',
                '::placeholder': { color: 'var(--color-text-muted)' },
              },
              invalid: { color: '#fa755a' },
            },
          }}
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="space-y-2 text-sm">
        {booking.discountAmount != null && booking.discountAmount > 0 && (
          <div className="flex justify-between text-[var(--color-text-muted)]">
            <span>Discount{booking.promotion ? ` (${booking.promotion.name})` : ''}</span>
            <span className="text-green-400">- LKR {booking.discountAmount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-[var(--color-text-muted)]">Total</span>
          <span className="font-accent text-xl text-[var(--color-primary)]">LKR {booking.total.toLocaleString()}</span>
        </div>
      </div>
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-[var(--color-primary)] text-[var(--color-bg)] py-4 text-sm font-medium tracking-widest uppercase hover:bg-[var(--color-primary-light)] transition disabled:opacity-50"
      >
        {loading ? 'Processing…' : 'Pay now'}
      </button>
    </form>
  );
}

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('event');
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [enabledMethods, setEnabledMethods] = useState<string[]>(['STRIPE']);
  const [paymentMethod, setPaymentMethod] = useState<string>('STRIPE');
  const [step, setStep] = useState<'form' | 'payment'>('form');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    api.get(`/api/events/${eventId}`).then((r) => setEvent(r.data.event)).catch(() => setEvent(null));
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    api.get(`/api/events/${eventId}/payment-methods`).then((r) => {
      const methods = r.data.enabledMethods || [];
      setEnabledMethods(methods.length ? methods : ['STRIPE']);
      setPaymentMethod((prev) => (methods.includes(prev) ? prev : methods[0] || 'STRIPE'));
    }).catch(() => setEnabledMethods(['STRIPE']));
  }, [eventId]);

  const totalTickets = Object.values(quantities).reduce((a, b) => a + b, 0);
  const canProceed = totalTickets > 0 && (user || (guestEmail && guestName && guestPhone));

  const handleProceedToPayment = async () => {
    if (!event || !canProceed) return;
    setError(null);
    setLoading(true);
    const items = Object.entries(quantities)
      .filter(([, q]) => q > 0)
      .map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }));
    try {
      const payload: { eventId: string; items: { ticketTypeId: string; quantity: number }[]; guestEmail?: string; guestName?: string; guestPhone?: string; couponCode?: string; paymentMethod?: string } = {
        eventId: event.id,
        items,
        paymentMethod: paymentMethod || 'STRIPE',
      };
      if (!user) {
        payload.guestEmail = guestEmail;
        payload.guestName = guestName;
        payload.guestPhone = guestPhone;
      }
      if (couponCode.trim()) payload.couponCode = couponCode.trim();
      const { data } = await api.post('/api/checkout/prepare', payload);
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      if (data.paymentMethod === 'ON_ENTRY') {
        const params = new URLSearchParams({ number: data.booking.bookingNumber });
        if (!user && guestEmail) params.set('guestEmail', guestEmail);
        window.location.href = `/checkout/success?${params.toString()}`;
        return;
      }
      setBooking(data.booking);
      setClientSecret(data.clientSecret ?? null);
      setStep('payment');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    if (!booking?.bookingNumber) return;
    const params = new URLSearchParams({ number: booking.bookingNumber });
    if (!user && guestEmail) params.set('guestEmail', guestEmail);
    window.location.href = `/checkout/success?${params.toString()}`;
  };

  if (!eventId) {
    return (
      <PageContainer>
        <p className="text-center text-[var(--color-text-muted)]">No event selected. <Link to="/events" className="text-[var(--color-primary)]">Browse events</Link></p>
      </PageContainer>
    );
  }

  if (!event) {
    return <PageContainer><p className="text-center text-[var(--color-text-muted)]">Loading event…</p></PageContainer>;
  }

  const available = (t: { quantity: number; soldCount: number }) => t.quantity - t.soldCount;

  return (
    <>
      <Helmet><title>Checkout | NUIT</title></Helmet>
      <PageContainer narrow>
        <PageHeading title="Checkout" intro={event.title} />

        {step === 'form' && (
          <>
            <div className="space-y-4 mb-8">
              {event.ticketTypes.map((tt) => (
                <div key={tt.id} className="flex items-center justify-between py-3 border-b border-[var(--color-border)]">
                  <div>
                    <p className="font-medium text-[var(--color-text)]">{tt.name}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">{available(tt)} available · LKR {Number(tt.price).toLocaleString()}</p>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={available(tt)}
                    value={quantities[tt.id] ?? 0}
                    onChange={(e) => setQuantities((q) => ({ ...q, [tt.id]: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                    className="w-20 bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-3 py-2 text-center"
                  />
                </div>
              ))}
            </div>

            <div className="mb-8">
              <p className="text-[9px] tracking-widest uppercase text-[var(--color-primary)] mb-2">Coupon code</p>
              <input type="text" placeholder="Enter code (optional)" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-3" />
            </div>

            {enabledMethods.length > 0 && (
              <div className="mb-8">
                <p className="text-[9px] tracking-widest uppercase text-[var(--color-primary)] mb-2">Payment method</p>
                <div className="flex flex-wrap gap-3">
                  {enabledMethods.includes('STRIPE') && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="paymentMethod" value="STRIPE" checked={paymentMethod === 'STRIPE'} onChange={() => setPaymentMethod('STRIPE')} className="accent-[var(--color-primary)]" />
                      <span className="text-[var(--color-text)]">Card (Stripe)</span>
                    </label>
                  )}
                  {enabledMethods.includes('KOKO') && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="paymentMethod" value="KOKO" checked={paymentMethod === 'KOKO'} onChange={() => setPaymentMethod('KOKO')} className="accent-[var(--color-primary)]" />
                      <span className="text-[var(--color-text)]">Koko (BNPL)</span>
                    </label>
                  )}
                  {enabledMethods.includes('MINTPAY') && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="paymentMethod" value="MINTPAY" checked={paymentMethod === 'MINTPAY'} onChange={() => setPaymentMethod('MINTPAY')} className="accent-[var(--color-primary)]" />
                      <span className="text-[var(--color-text)]">MintPay (BNPL)</span>
                    </label>
                  )}
                  {enabledMethods.includes('ON_ENTRY') && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="paymentMethod" value="ON_ENTRY" checked={paymentMethod === 'ON_ENTRY'} onChange={() => setPaymentMethod('ON_ENTRY')} className="accent-[var(--color-primary)]" />
                      <span className="text-[var(--color-text)]">Pay at venue</span>
                    </label>
                  )}
                </div>
              </div>
            )}

            {!user && (
              <div className="space-y-4 mb-8">
                <p className="text-[9px] tracking-widest uppercase text-[var(--color-primary)]">Guest details</p>
                <input type="email" placeholder="Email *" required value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-3" />
                <input type="text" placeholder="Full name *" required value={guestName} onChange={(e) => setGuestName(e.target.value)} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-3" />
                <input type="tel" placeholder="Phone *" required value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-3" />
              </div>
            )}

            {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
            <button type="button" onClick={handleProceedToPayment} disabled={!canProceed || loading} className="w-full bg-[var(--color-primary)] text-[var(--color-bg)] py-4 text-sm font-medium tracking-widest uppercase hover:bg-[var(--color-primary-light)] transition disabled:opacity-50">
              {loading ? 'Preparing…' : 'Proceed to payment'}
            </button>
          </>
        )}

        {step === 'payment' && booking && clientSecret && stripePromise && paymentMethod === 'STRIPE' && (
          <div className="border border-[var(--color-border)] p-6">
            <p className="text-sm text-[var(--color-text-muted)] mb-4">Booking #{booking.bookingNumber}</p>
            <p className="text-[var(--color-text)] mb-1">Subtotal: LKR {booking.subtotal.toLocaleString()}</p>
            <p className="text-[var(--color-text)] mb-1">Handling fee: LKR {booking.handlingFee.toLocaleString()}</p>
            {booking.discountAmount != null && booking.discountAmount > 0 && (
              <p className="text-green-400 mb-1">Discount{booking.promotion ? ` (${booking.promotion.name})` : ''}: - LKR {booking.discountAmount.toLocaleString()}</p>
            )}
            <p className="text-[var(--color-text)] mb-4 font-medium">Total: LKR {booking.total.toLocaleString()}</p>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm clientSecret={clientSecret} booking={booking} onSuccess={handlePaymentSuccess} />
            </Elements>
          </div>
        )}

        {step === 'payment' && paymentMethod === 'STRIPE' && !stripePromise && (
          <p className="text-[var(--color-text-muted)]">Stripe is not configured. Set VITE_STRIPE_PUBLIC_KEY.</p>
        )}
      </PageContainer>
    </>
  );
}
