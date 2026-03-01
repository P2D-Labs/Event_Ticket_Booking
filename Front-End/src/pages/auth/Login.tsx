import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../context/AuthContext';
import { SITE_CONTENT_CLASS } from '../../lib/layout';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await login(email, password);
      if (u?.role === 'SUPER_ADMIN') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>Login | NUIT</title></Helmet>
      <div className={`min-h-screen flex items-center justify-center pt-20 pb-12 ${SITE_CONTENT_CLASS}`}>
        <div className="w-full max-w-md mx-auto">
          <h1 className="font-header text-4xl tracking-wide text-[var(--color-text)] mb-2">Login</h1>
          <p className="text-sm text-[var(--color-text-muted)] mb-8">Sign in to your account</p>

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
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[9px] tracking-widest uppercase text-[var(--color-primary)]/80">Password</label>
                <Link to="/auth/forgot-password" className="text-xs text-[var(--color-primary)] hover:underline">Forgot password?</Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-3 focus:border-[var(--color-primary)] outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-primary)] text-[var(--color-bg)] py-4 text-sm font-medium tracking-widest uppercase hover:bg-[var(--color-primary-light)] transition disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {API_URL && (
            <a
              href={`${API_URL}/api/auth/google`}
              className="mt-4 flex items-center justify-center gap-2 w-full border border-[var(--color-border)] py-3 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
            >
              Sign in with Google
            </a>
          )}

          <p className="mt-6 text-sm text-[var(--color-text-muted)]">
            Don&apos;t have an account? <Link to="/auth/register" className="text-[var(--color-primary)]">Register</Link>
          </p>
        </div>
      </div>
    </>
  );
}
