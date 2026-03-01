import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../../api/client';

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY) : null;

function FeaturePaymentForm({
  clientSecret,
  amount,
  onSuccess,
  onCancel,
}: {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
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
    const { error: err } = await stripe.confirmCardPayment(clientSecret, { payment_method: { card } });
    setLoading(false);
    if (err) {
      setError(err.message || 'Payment failed');
      return;
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-[var(--color-text)]">Amount: <strong>LKR {amount.toLocaleString()}</strong></p>
      <div className="p-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded">
        <CardElement
          options={{
            style: {
              base: { color: 'var(--color-text)', fontFamily: 'var(--font-body)', '::placeholder': { color: 'var(--color-text-muted)' } },
              invalid: { color: 'var(--color-error, #ef4444)' },
            },
          }}
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={!stripe || loading} className="bg-[var(--color-primary)] text-[var(--color-bg)] px-4 py-2 text-sm font-medium rounded disabled:opacity-50">
          {loading ? 'Processing…' : 'Pay'}
        </button>
        <button type="button" onClick={onCancel} className="border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 text-sm rounded hover:bg-[var(--color-bg-elevated)]">
          Cancel
        </button>
      </div>
    </form>
  );
}

type Props = {
  eventId: string;
  eventTitle: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function FeatureEventModal({ eventId, eventTitle, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<'config' | 'pay' | 'done'>('config');
  const [config, setConfig] = useState<{ price: number; durationDays: number } | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/api/events/feature-config').then((r) => {
      const c = r.data.config || {};
      setConfig({ price: c.price ?? 0, durationDays: c.durationDays ?? 14 });
    }).catch(() => setError('Could not load featured pricing')).finally(() => setLoading(false));
  }, []);

  const handleStartPayment = async () => {
    if (!config || config.price <= 0) {
      setError('Featured pricing is not configured. Ask admin to set it in Settings.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post(`/api/events/${eventId}/feature-payment-intent`);
      setClientSecret(data.clientSecret);
      setAmount(data.amount ?? config.price);
      setStep('pay');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Could not start payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setStep('done');
    onSuccess?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-header text-xl text-[var(--color-text)] mb-2">Feature this event</h3>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">{eventTitle}</p>

        {loading && step === 'config' && <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>}
        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

        {step === 'config' && config && !loading && (
          <>
            <p className="text-sm text-[var(--color-text)] mb-4">
              Show this event in the <strong>Featured</strong> section on the homepage for <strong>{config.durationDays} days</strong>.
              {config.price > 0 ? (
                <> Price: <strong>LKR {config.price.toLocaleString()}</strong>.</>
              ) : (
                <> Featured pricing is not set by admin.</>
              )}
            </p>
            <div className="flex gap-3">
              {config.price > 0 && (
                <button type="button" onClick={handleStartPayment} className="bg-[var(--color-primary)] text-[var(--color-bg)] px-4 py-2 text-sm font-medium rounded hover:bg-[var(--color-primary-light)]">
                  Pay LKR {config.price.toLocaleString()}
                </button>
              )}
              <button type="button" onClick={onClose} className="border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 text-sm rounded hover:bg-[var(--color-bg-elevated)]">
                Cancel
              </button>
            </div>
          </>
        )}

        {step === 'pay' && clientSecret && stripePromise && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <FeaturePaymentForm
              clientSecret={clientSecret}
              amount={amount}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setStep('config')}
            />
          </Elements>
        )}

        {step === 'done' && (
          <>
            <p className="text-[var(--color-primary)] font-medium mb-4">Payment successful. Your event will appear in the Featured section on the homepage shortly.</p>
            <button type="button" onClick={onClose} className="bg-[var(--color-primary)] text-[var(--color-bg)] px-4 py-2 text-sm font-medium rounded">
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}
