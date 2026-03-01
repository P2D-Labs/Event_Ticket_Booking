import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import PageContainer from '../components/layout/PageContainer';
import LoadingSpinner from '../components/ui/LoadingSpinner';

type Booking = {
  bookingNumber: string;
  status: string;
  total: string;
  items: { quantity: number; ticketType: { name: string }; unitPrice: string }[];
  event: { title: string; eventDate: string; eventTime?: string; location: string };
};

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const number = searchParams.get('number');
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!number) {
      setLoading(false);
      return;
    }
    const email = searchParams.get('guestEmail') || '';
    const params = user ? '' : `?guestEmail=${encodeURIComponent(email)}`;
    api.get(`/api/checkout/bookings/number/${encodeURIComponent(number)}${params}`)
      .then((r) => setBooking(r.data.booking))
      .catch(() => setBooking(null))
      .finally(() => setLoading(false));
  }, [number, user, searchParams]);

  if (loading) return <PageContainer><LoadingSpinner fullScreen message="Loading…" /></PageContainer>;
  if (!number || !booking) {
    return (
      <PageContainer>
        <p className="text-center text-[var(--color-text-muted)] mb-4">Booking not found or invalid link.</p>
        <Link to="/events" className="text-[var(--color-primary)]">Browse events</Link>
      </PageContainer>
    );
  }

  return (
    <>
      <Helmet><title>Booking confirmed | NUIT</title></Helmet>
      <PageContainer narrow className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 text-green-400 mb-6" aria-hidden="true">✓</div>
        <h1 className="font-header text-4xl text-[var(--color-text)] mb-2">Booking confirmed</h1>
        <p className="text-[var(--color-primary)] font-medium mb-8">#{booking.bookingNumber}</p>
        <section className="text-left mb-8" aria-labelledby="booking-details-heading">
          <h2 id="booking-details-heading" className="sr-only">Booking details</h2>
          <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] p-6 rounded-lg">
          <p className="font-medium text-[var(--color-text)] mb-1">{booking.event.title}</p>
          <p className="text-sm text-[var(--color-text-muted)]">
            {new Date(booking.event.eventDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {booking.event.eventTime && ` · ${booking.event.eventTime}`}
          </p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">{booking.event.location}</p>
          <ul className="mt-4 space-y-2 border-t border-[var(--color-border)] pt-4">
            {booking.items.map((item, i) => (
              <li key={i} className="flex justify-between text-sm">
                <span className="text-[var(--color-text-muted)]">{item.ticketType.name} × {item.quantity}</span>
                <span className="text-[var(--color-text)]">LKR {(Number(item.unitPrice) * item.quantity).toLocaleString()}</span>
              </li>
            ))}
          </ul>
          <p className="flex justify-between font-medium text-[var(--color-text)] mt-3 pt-3 border-t border-[var(--color-border)]">
            Total <span>LKR {Number(booking.total).toLocaleString()}</span>
          </p>
          </div>
        </section>
        <Link to="/events" className="inline-block bg-[var(--color-primary)] text-[var(--color-bg)] px-8 py-3 text-sm font-medium tracking-widest uppercase">
          Browse more events
        </Link>
        {user && (
          <p className="mt-4">
            <Link to="/account/bookings" className="text-sm text-[var(--color-primary)]">View my bookings</Link>
          </p>
        )}
      </PageContainer>
    </>
  );
}
