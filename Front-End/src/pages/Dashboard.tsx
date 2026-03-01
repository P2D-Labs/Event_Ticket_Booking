import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

type Event = {
  id: string;
  title: string;
  slug: string;
  status: string;
  eventDate: string;
  ticketTypes: { name: string; price: string; quantity: number; soldCount: number }[];
};

export default function Dashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    api.get('/api/events/organizer/mine').then((r) => setEvents(r.data.events || [])).catch(() => setEvents([]));
  }, []);

  const isOrganizer = user?.role === 'ORGANIZER' || user?.role === 'SUPER_ADMIN';
  if (!isOrganizer) {
    return (
      <div className="pt-28 px-6">
        <p className="text-[var(--color-text-muted)]">Organizer dashboard. Switch to an organizer account or go to <Link to="/" className="text-[var(--color-primary)]">Home</Link>.</p>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Dashboard | NUIT</title></Helmet>
      <div className="pt-28 pb-16 px-6 md:px-12">
        <div className="max-w-8xl mx-auto">
          <h1 className="font-header text-4xl text-[var(--color-text)] mb-2">My Events</h1>
          <p className="text-[var(--color-text-muted)] mb-8">Create and manage your events. Pending events require admin approval.</p>

          <Link
            to="/dashboard/create"
            className="inline-block bg-[var(--color-primary)] text-[var(--color-bg)] px-6 py-3 text-sm font-medium tracking-widest uppercase mb-8"
          >
            Create Event
          </Link>

          {events.length === 0 ? (
            <p className="text-[var(--color-text-muted)]">No events yet.</p>
          ) : (
            <ul className="space-y-4">
              {events.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
                  <div>
                    <Link to={`/events/${e.slug}`} className="font-header text-xl text-[var(--color-text)] hover:text-[var(--color-primary)]">
                      {e.title}
                    </Link>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {new Date(e.eventDate).toLocaleDateString('en-GB')} · Status: <span className={e.status === 'APPROVED' ? 'text-green-400' : e.status === 'REJECTED' ? 'text-red-400' : 'text-yellow-400'}>{e.status}</span>
                    </p>
                  </div>
                  <Link to={`/dashboard/events/${e.id}/edit`} className="text-sm text-[var(--color-primary)]">Edit</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
