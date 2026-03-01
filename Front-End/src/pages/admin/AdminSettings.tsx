import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import api from '../../api/client';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const PAYMENT_LABELS: Record<string, string> = { STRIPE: 'Stripe (card)', KOKO: 'Koko', MINTPAY: 'MintPay', ON_ENTRY: 'Pay on entry' };

type Settings = {
  featured_event_price?: number;
  featured_event_duration_days?: number;
  payment_stripe_enabled?: boolean;
  payment_koko_enabled?: boolean;
  payment_mintpay_enabled?: boolean;
  payment_on_entry_enabled?: boolean;
};

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [price, setPrice] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [paymentEnabled, setPaymentEnabled] = useState<Record<string, boolean>>({
    payment_stripe_enabled: true,
    payment_koko_enabled: false,
    payment_mintpay_enabled: false,
    payment_on_entry_enabled: true,
  });

  useEffect(() => {
    api.get('/api/settings').then((r) => {
      const s = r.data.settings || {};
      setSettings(s);
      setPrice(String(s.featured_event_price ?? 5000));
      setDurationDays(String(s.featured_event_duration_days ?? 14));
      setPaymentEnabled({
        payment_stripe_enabled: s.payment_stripe_enabled !== false,
        payment_koko_enabled: s.payment_koko_enabled === true,
        payment_mintpay_enabled: s.payment_mintpay_enabled === true,
        payment_on_entry_enabled: s.payment_on_entry_enabled !== false,
      });
    }).catch(() => setSettings({})).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.patch('/api/settings', {
        featured_event_price: Number(price) || 0,
        featured_event_duration_days: Math.max(1, Math.min(365, Number(durationDays) || 14)),
        ...paymentEnabled,
      });
      setMessage('Settings saved.');
    } catch {
      setMessage('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentToggle = (key: string, checked: boolean) => {
    setPaymentEnabled((prev) => ({ ...prev, [key]: checked }));
  };

  if (loading) return <LoadingSpinner message="Loading settings…" />;

  return (
    <>
      <Helmet><title>Settings | Admin | NUIT</title></Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="font-header text-3xl text-[var(--color-text)]">Settings</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">System configuration. Featured event pricing is used when organizers pay to feature an event on the homepage.</p>
        </div>

        {message && (
          <div className={`p-4 rounded border ${message.includes('Failed') ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-[var(--color-bg-elevated)] border-[var(--color-primary)]/30 text-[var(--color-text)]'}`}>
            {message}
          </div>
        )}

        <section className="border border-[var(--color-border)] bg-[var(--color-bg-card)] rounded-lg p-6 max-w-8xl">
          <h2 className="font-header text-xl text-[var(--color-text)] mb-4">Featured event</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">Organizers can pay to show their approved event in the &quot;Featured&quot; section on the homepage for a set number of days.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="featured_price" className="block text-xs text-[var(--color-text-muted)] mb-1">Price (LKR)</label>
              <input
                id="featured_price"
                type="number"
                min="0"
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded"
              />
            </div>
            <div>
              <label htmlFor="featured_duration" className="block text-xs text-[var(--color-text-muted)] mb-1">Duration (days)</label>
              <input
                id="featured_duration"
                type="number"
                min="1"
                max="365"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded"
              />
            </div>
            <button type="submit" disabled={saving} className="bg-[var(--color-primary)] text-[var(--color-bg)] px-6 py-2.5 text-sm font-medium rounded hover:bg-[var(--color-primary-light)] disabled:opacity-50">
              {saving ? 'Saving…' : 'Save settings'}
            </button>
          </form>
        </section>

        <section className="border border-[var(--color-border)] bg-[var(--color-bg-card)] rounded-lg p-6 max-w-8xl">
          <h2 className="font-header text-xl text-[var(--color-text)] mb-4">Payment methods</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">Enable payment methods globally. Organizers then choose which of these to offer per event when creating or editing events.</p>
          <div className="space-y-3">
            {(['payment_stripe_enabled', 'payment_koko_enabled', 'payment_mintpay_enabled', 'payment_on_entry_enabled'] as const).map((key) => (
              <label key={key} className="flex items-center gap-3 text-[var(--color-text)]">
                <input type="checkbox" checked={paymentEnabled[key] ?? false} onChange={(e) => handlePaymentToggle(key, e.target.checked)} className="rounded" />
                <span>{PAYMENT_LABELS[key.replace('payment_', '').replace('_enabled', '').toUpperCase()] || key}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-4">Save using the button above to apply both Featured and Payment settings.</p>
        </section>
      </div>
    </>
  );
}
