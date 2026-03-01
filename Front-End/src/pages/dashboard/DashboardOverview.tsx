import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../../api/client';
import MetricCard from '../../components/ui/MetricCard';
import { IconEvents, IconTicket } from '../../components/icons/PanelIcons';

type Event = { id: string; title: string; status: string; eventDate: string };
type BookingStats = { total: number; confirmed: number; pending: number };

export default function DashboardOverview() {
  const [events, setEvents] = useState<Event[]>([]);
  const [bookingStats, setBookingStats] = useState<BookingStats>({ total: 0, confirmed: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/api/events/organizer/mine').then((r) => r.data.events || []).catch(() => []),
      api.get('/api/events/organizer/bookings/list?limit=500').then((r) => {
        const bookings = r.data.bookings || [];
        const total = r.data.total ?? 0;
        const confirmed = bookings.filter((b: { status: string }) => b.status === 'CONFIRMED').length;
        const pending = bookings.filter((b: { status: string }) => b.status === 'PENDING').length;
        return { total, confirmed, pending };
      }).catch(() => ({ total: 0, confirmed: 0, pending: 0 })),
    ]).then(([evs, stats]) => {
      setEvents(evs);
      setBookingStats(stats);
    }).finally(() => setLoading(false));
  }, []);

  const totalEvents = events.length;
  const pendingEvents = events.filter((e) => e.status === 'PENDING').length;
  const approvedEvents = events.filter((e) => e.status === 'APPROVED').length;

  return (
    <>
      <Helmet><title>Dashboard | NUIT</title></Helmet>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Events"
            value={loading ? '–' : totalEvents}
            icon={<IconEvents />}
            barPercent={totalEvents ? (approvedEvents / totalEvents) * 100 : 0}
            barColor="primary"
          />
          <MetricCard
            title="Pending Approval"
            value={loading ? '–' : pendingEvents}
            icon={<IconEvents />}
            barColor="orange"
            barPercent={totalEvents ? (pendingEvents / totalEvents) * 100 : 0}
          />
          <MetricCard
            title="Total Bookings"
            value={loading ? '–' : bookingStats.total}
            icon={<IconTicket />}
            barPercent={bookingStats.total ? Math.min(100, (bookingStats.total / 50) * 100) : 0}
            barColor="green"
          />
          <MetricCard
            title="Confirmed Bookings"
            value={loading ? '–' : bookingStats.confirmed}
            icon={<IconTicket />}
            barPercent={bookingStats.total ? (bookingStats.confirmed / bookingStats.total) * 100 : 0}
            barColor="green"
          />
        </div>
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-6">
          <h2 className="font-header text-xl text-[var(--color-text)] mb-4">Quick actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link to="/dashboard/events/new" className="bg-[var(--color-primary)] text-[var(--color-bg)] px-5 py-2.5 text-sm font-medium tracking-widest uppercase hover:bg-[var(--color-primary-light)] transition">
              Create event
            </Link>
            <Link to="/dashboard/my-events" className="border border-[var(--color-primary)] text-[var(--color-primary)] px-5 py-2.5 text-sm tracking-widest uppercase hover:bg-[var(--color-primary)]/10 transition">
              My Events
            </Link>
            <Link to="/dashboard/bookings" className="border border-[var(--color-primary)] text-[var(--color-primary)] px-5 py-2.5 text-sm tracking-widest uppercase hover:bg-[var(--color-primary)]/10 transition">
              View Bookings
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
