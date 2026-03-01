import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../context/AuthContext';
import { SITE_CONTENT_CLASS } from '../../lib/layout';

export default function Register() {
  const { register, registerVerifyOtp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', organization: '' });
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [pendingEmail, setPendingEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { email } = await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        organization: form.organization || undefined,
      });
      setPendingEmail(email);
      setStep('otp');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerVerifyOtp(pendingEmail, otp.trim());
      navigate('/');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <>
        <Helmet><title>Verify email | NUIT</title></Helmet>
        <div className={`min-h-screen flex items-center justify-center pt-20 pb-12 ${SITE_CONTENT_CLASS}`}>
          <div className="w-full max-w-md mx-auto">
            <h1 className="font-header text-4xl tracking-wide text-[var(--color-text)] mb-2">Verify your email</h1>
            <p className="text-sm text-[var(--color-text-muted)] mb-8">We sent a 6-digit code to <strong>{pendingEmail}</strong>. Enter it below. Valid for 24 hours.</p>

            <form onSubmit={handleVerifyOtp} className="space-y-5">
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div>
                <label className="block text-[9px] tracking-widest uppercase text-[var(--color-primary)]/80 mb-2">Verification code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  placeholder="000000"
                  className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-3 focus:border-[var(--color-primary)] outline-none text-center text-2xl tracking-[0.5em]"
                />
              </div>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-[var(--color-primary)] text-[var(--color-bg)] py-4 text-sm font-medium tracking-widest uppercase hover:bg-[var(--color-primary-light)] transition disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify and create account'}
              </button>
            </form>

            <p className="mt-6 text-sm text-[var(--color-text-muted)]">
              <button type="button" onClick={() => { setStep('form'); setError(''); setOtp(''); }} className="text-[var(--color-primary)] hover:underline">← Use a different email</button>
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet><title>Register | NUIT</title></Helmet>
      <div className={`min-h-screen flex items-center justify-center pt-20 pb-12 ${SITE_CONTENT_CLASS}`}>
        <div className="w-full max-w-md mx-auto">
          <h1 className="font-header text-4xl tracking-wide text-[var(--color-text)] mb-2">Register</h1>
          <p className="text-sm text-[var(--color-text-muted)] mb-8">Create your account. We&apos;ll send a verification code to your email.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div>
              <label className="block text-[9px] tracking-widest uppercase text-[var(--color-primary)]/80 mb-2">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-3 focus:border-[var(--color-primary)] outline-none"
              />
            </div>
            <div>
              <label className="block text-[9px] tracking-widest uppercase text-[var(--color-primary)]/80 mb-2">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
                className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-3 focus:border-[var(--color-primary)] outline-none"
              />
            </div>
            <div>
              <label className="block text-[9px] tracking-widest uppercase text-[var(--color-primary)]/80 mb-2">Phone *</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                required
                className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-3 focus:border-[var(--color-primary)] outline-none"
              />
            </div>
            <div>
              <label className="block text-[9px] tracking-widest uppercase text-[var(--color-primary)]/80 mb-2">Password *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
                minLength={8}
                className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-3 focus:border-[var(--color-primary)] outline-none"
              />
            </div>
            <div>
              <label className="block text-[9px] tracking-widest uppercase text-[var(--color-primary)]/80 mb-2">Organization (optional)</label>
              <input
                type="text"
                value={form.organization}
                onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))}
                className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-3 focus:border-[var(--color-primary)] outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-primary)] text-[var(--color-bg)] py-4 text-sm font-medium tracking-widest uppercase hover:bg-[var(--color-primary-light)] transition disabled:opacity-50"
            >
              {loading ? 'Sending code...' : 'Send verification code'}
            </button>
          </form>

          <p className="mt-6 text-sm text-[var(--color-text-muted)]">
            Already have an account? <Link to="/auth/login" className="text-[var(--color-primary)]">Login</Link>
          </p>
        </div>
      </div>
    </>
  );
}
