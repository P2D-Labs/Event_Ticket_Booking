import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ConfirmDialog from '../components/ui/ConfirmDialog';

type Plan = { id: string; name: string; price: string; duration: string };
type Subscription = {
  id: string;
  status: string;
  currentPeriodEnd: string | null;
  plan: Plan;
};

export default function Premium() {
  const [searchParams] = useSearchParams();
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);

  useEffect(() => {
    api.get('/api/subscription/plans').then((r) => setPlans(r.data.plans || [])).catch(() => setPlans([]));
    if (user) {
      api.get('/api/subscription/me').then((r) => setSubscription(r.data.subscription || null)).catch(() => setSubscription(null)).finally(() => setLoading(false));
      if (success === '1') refreshUser?.();
    } else {
      setLoading(false);
    }
  }, [user, success, refreshUser]);

  useEffect(() => {
    if (success === '1') setMessage('Thank you! You are now a Premium member. No handling fees on your tickets.');
    if (canceled === '1') setMessage('Checkout was canceled.');
  }, [success, canceled]);

  const handleSubscribe = async (planId: string) => {
    if (!user) return;
    setSubmitting(planId);
    try {
      const { data } = await api.post('/api/subscription/checkout-session', { planId });
      if (data.url) window.location.href = data.url;
    } catch {
      setMessage('Could not start checkout.');
      setSubmitting(null);
    }
  };

  const handleCancel = async () => {
    try {
      await api.post('/api/subscription/cancel');
      setMessage('Subscription will cancel at end of period.');
      const { data } = await api.get('/api/subscription/me');
      setSubscription(data.subscription || null);
      refreshUser?.();
      setCancelConfirm(false);
    } catch {
      setMessage('Could not cancel.');
    }
  };

  return (
    <>
      <Helmet><title>Premium | NUIT</title></Helmet>
      <div className="pt-24 pb-16 px-6 md:px-12 max-w-8xl mx-auto">
        <h1 className="font-header text-4xl md:text-5xl text-[var(--color-text)] mb-2">Premium</h1>
        <p className="text-[var(--color-text-muted)] mb-8">No handling fees on every ticket. Subscribe and save.</p>

        {message && (
          <div className="mb-6 p-4 bg-[var(--color-bg-elevated)] border border-[var(--color-primary)]/30 text-[var(--color-text)]">
            {message}
          </div>
        )}

        {user && subscription && (
          <div className="mb-8 p-6 border border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
            <p className="text-[9px] tracking-widest uppercase text-[var(--color-primary)] mb-1">Current plan</p>
            <p className="font-medium text-[var(--color-text)]">{subscription.plan.name}</p>
            <p className="text-sm text-[var(--color-text-muted)]">
              Renews {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : '—'}
            </p>
            <button type="button" onClick={() => setCancelConfirm(true)} className="mt-3 text-sm text-red-400 hover:underline">
              Cancel at period end
            </button>
          </div>
        )}

        {!user && (
          <p className="mb-6 text-[var(--color-text-muted)]">
            <Link to="/auth/login" className="text-[var(--color-primary)]">Log in</Link> to subscribe.
          </p>
        )}

        {loading ? (
          <LoadingSpinner message="Loading plans…" />
        ) : plans.length === 0 ? (
          <p className="text-[var(--color-text-muted)]">No plans available.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <div key={plan.id} className="border border-[var(--color-border)] p-6 bg-[var(--color-bg-elevated)]">
                <p className="font-header text-xl text-[var(--color-text)]">{plan.name}</p>
                <p className="text-2xl font-accent text-[var(--color-primary)] mt-2">LKR {Number(plan.price).toLocaleString()}<span className="text-sm text-[var(--color-text-muted)]">/{plan.duration === 'YEARLY' ? 'year' : 'month'}</span></p>
                <p className="text-sm text-[var(--color-text-muted)] mt-2">No handling fees on all bookings</p>
                {user ? (
                  <button
                    type="button"
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={!!subscription || submitting !== null}
                    className="mt-4 w-full bg-[var(--color-primary)] text-[var(--color-bg)] py-3 text-sm font-medium tracking-widest uppercase hover:bg-[var(--color-primary-light)] transition disabled:opacity-50"
                  >
                    {submitting === plan.id ? 'Redirecting…' : subscription ? 'Current plan' : 'Subscribe'}
                  </button>
                ) : (
                  <Link to="/auth/login" className="mt-4 inline-block w-full bg-[var(--color-primary)] text-[var(--color-bg)] py-3 text-center text-sm font-medium tracking-widest uppercase">
                    Log in to subscribe
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog open={cancelConfirm} onClose={() => setCancelConfirm(false)} onConfirm={handleCancel} title="Cancel subscription" message="Cancel at end of billing period? You will keep Premium until then." confirmLabel="Cancel subscription" variant="danger" />
    </>
  );
}
