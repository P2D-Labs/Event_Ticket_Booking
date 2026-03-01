import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    }
    navigate('/', { replace: true });
  }, [navigate]);

  return <div className="min-h-screen flex items-center justify-center text-[var(--color-text-muted)]">Signing you in...</div>;
}
