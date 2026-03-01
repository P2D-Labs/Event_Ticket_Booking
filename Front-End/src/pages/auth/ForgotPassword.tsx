import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../../api/client';
import { SITE_CONTENT_CLASS } from '../../lib/layout';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email });
      setSent(true);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <>
        <Helmet><title>Check your email | NUIT</title></Helmet>
        <div className={`min-h-screen flex items-center justify-center pt-20 pb-12 ${SITE_CONTENT_CLASS}`}>
          <div className="w-full max-w-md mx-auto text-center">
            <h1 className="font-header text-4xl tracking-wide text-[var(--color-text)] mb-2">Check your email</h1>
            <p className="text-[var(--color-text-muted)] mb-6">If an account exists for <strong>{email}</strong>, you will receive a link to reset your password. The link is valid for 24 hours.</p>
            <Link to="/auth/login" className="text-[var(--color-primary)] hover:underline">Back to login</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet><title>Forgot password | NUIT</title></Helmet>
      <div className={`min-h-screen flex items-center justify-center pt-20 pb-12 ${SITE_CONTENT_CLASS}`}>
        <div className="w-full max-w-md mx-auto">
          <h1 className="font-header text-4xl tracking-wide text-[var(--color-text)] mb-2">Forgot password</h1>
          <p className="text-sm text-[var(--color-text-muted)] mb-8">Enter your email and we will send you a link to reset your password.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div>
              <label className="block text-[9px] tracking-widest uppercase text-[var(--color-primary)]/80 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-3 focus:border-[var(--color-primary)] outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-primary)] text-[var(--color-bg)] py-4 text-sm font-medium tracking-widest uppercase hover:bg-[var(--color-primary-light)] transition disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>

          <p className="mt-6 text-sm text-[var(--color-text-muted)]">
            <Link to="/auth/login" className="text-[var(--color-primary)]">Back to login</Link>
          </p>
        </div>
      </div>
    </>
  );
}
