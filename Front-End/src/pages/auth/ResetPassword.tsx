import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../../api/client';
import { SITE_CONTENT_CLASS } from '../../lib/layout';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!token) {
      setError('Invalid reset link. Request a new one from the forgot password page.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { token, newPassword });
      setSuccess(true);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Helmet><title>Password reset | NUIT</title></Helmet>
        <div className={`min-h-screen flex items-center justify-center pt-20 pb-12 ${SITE_CONTENT_CLASS}`}>
          <div className="w-full max-w-md mx-auto text-center">
            <h1 className="font-header text-4xl tracking-wide text-[var(--color-text)] mb-2">Password reset</h1>
            <p className="text-[var(--color-text-muted)] mb-6">Your password has been updated. You can now sign in.</p>
            <Link to="/auth/login" className="inline-block bg-[var(--color-primary)] text-[var(--color-bg)] px-6 py-3 text-sm font-medium hover:bg-[var(--color-primary-light)]">Sign in</Link>
          </div>
        </div>
      </>
    );
  }

  if (!token) {
    return (
      <>
        <Helmet><title>Invalid reset link | NUIT</title></Helmet>
        <div className={`min-h-screen flex items-center justify-center pt-20 pb-12 ${SITE_CONTENT_CLASS}`}>
          <div className="w-full max-w-md mx-auto text-center">
            <h1 className="font-header text-4xl tracking-wide text-[var(--color-text)] mb-2">Invalid link</h1>
            <p className="text-[var(--color-text-muted)] mb-6">This reset link is missing or invalid. Request a new one from the forgot password page.</p>
            <Link to="/auth/forgot-password" className="text-[var(--color-primary)] hover:underline">Forgot password</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet><title>Set new password | NUIT</title></Helmet>
      <div className={`min-h-screen flex items-center justify-center pt-20 pb-12 ${SITE_CONTENT_CLASS}`}>
        <div className="w-full max-w-md mx-auto">
          <h1 className="font-header text-4xl tracking-wide text-[var(--color-text)] mb-2">Set new password</h1>
          <p className="text-sm text-[var(--color-text-muted)] mb-8">Enter your new password below.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div>
              <label className="block text-[9px] tracking-widest uppercase text-[var(--color-primary)]/80 mb-2">New password *</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-3 focus:border-[var(--color-primary)] outline-none"
              />
            </div>
            <div>
              <label className="block text-[9px] tracking-widest uppercase text-[var(--color-primary)]/80 mb-2">Confirm password *</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-3 focus:border-[var(--color-primary)] outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-primary)] text-[var(--color-bg)] py-4 text-sm font-medium tracking-widest uppercase hover:bg-[var(--color-primary-light)] transition disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update password'}
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
