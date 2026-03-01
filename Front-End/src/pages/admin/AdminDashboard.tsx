import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../../api/client';
import MetricCard from '../../components/ui/MetricCard';
import { IconEvents, IconCategory } from '../../components/icons/PanelIcons';

type Event = { id: string; status: string };

export default function AdminDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/events/admin/events').then((r) => setEvents(r.data.events || [])).catch(() => []).finally(() => setLoading(false));
  }, []);

  const pending = events.filter((e) => e.status === 'PENDING').length;
  const approved = events.filter((e) => e.status === 'APPROVED').length;
  const rejected = events.filter((e) => e.status === 'REJECTED').length;

  return (
    <>
      <Helmet><title>Admin Dashboard | NUIT</title></Helmet>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Total Events" value={loading ? '–' : events.length} icon={<IconEvents />} barPercent={events.length ? 100 : 0} barColor="primary" />
          <MetricCard title="Pending Approval" value={loading ? '–' : pending} icon={<IconEvents />} barColor="orange" barPercent={events.length ? (pending / events.length) * 100 : 0} />
          <MetricCard title="Approved" value={loading ? '–' : approved} icon={<IconEvents />} barColor="green" barPercent={events.length ? (approved / events.length) * 100 : 0} />
          <MetricCard title="Rejected" value={loading ? '–' : rejected} icon={<IconCategory />} barColor="red" barPercent={events.length ? (rejected / events.length) * 100 : 0} />
        </div>
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-6">
          <h2 className="font-header text-xl text-[var(--color-text)] mb-4">Quick links</h2>
          <div className="flex flex-wrap gap-4">
            <Link to="/admin/events" className="bg-[var(--color-primary)] text-[var(--color-bg)] px-5 py-2.5 text-sm font-medium tracking-widest uppercase hover:bg-[var(--color-primary-light)] transition">Event approvals</Link>
            <Link to="/admin/events/new" className="border border-[var(--color-primary)] text-[var(--color-primary)] px-5 py-2.5 text-sm tracking-widest uppercase hover:bg-[var(--color-primary)]/10 transition">Create event</Link>
            <Link to="/admin/categories" className="border border-[var(--color-primary)] text-[var(--color-primary)] px-5 py-2.5 text-sm tracking-widest uppercase hover:bg-[var(--color-primary)]/10 transition">Categories</Link>
            <Link to="/admin/banners" className="border border-[var(--color-primary)] text-[var(--color-primary)] px-5 py-2.5 text-sm tracking-widest uppercase hover:bg-[var(--color-primary)]/10 transition">Banners</Link>
            <Link to="/admin/testimonials" className="border border-[var(--color-primary)] text-[var(--color-primary)] px-5 py-2.5 text-sm tracking-widest uppercase hover:bg-[var(--color-primary)]/10 transition">Testimonials</Link>
            <Link to="/admin/promotions" className="border border-[var(--color-primary)] text-[var(--color-primary)] px-5 py-2.5 text-sm tracking-widest uppercase hover:bg-[var(--color-primary)]/10 transition">Promotions</Link>
            <Link to="/admin/coupons" className="border border-[var(--color-primary)] text-[var(--color-primary)] px-5 py-2.5 text-sm tracking-widest uppercase hover:bg-[var(--color-primary)]/10 transition">Coupons</Link>
            <Link to="/admin/plans" className="border border-[var(--color-primary)] text-[var(--color-primary)] px-5 py-2.5 text-sm tracking-widest uppercase hover:bg-[var(--color-primary)]/10 transition">Premium plans</Link>
          </div>
        </div>
      </div>
    </>
  );
}
