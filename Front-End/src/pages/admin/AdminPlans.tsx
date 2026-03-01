import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import api from '../../api/client';
import StatusBadge from '../../components/ui/StatusBadge';
import ActionButton from '../../components/ui/ActionButton';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { IconAdd, IconSearch, IconCheck, IconClose } from '../../components/icons/PanelIcons';

type Plan = { id: string; name: string; price: string; duration: string; isActive: boolean; _count?: { subscriptions: number } };

export default function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', duration: 'MONTHLY' });
  const [search, setSearch] = useState('');
  const [durationFilter, setDurationFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<'' | 'active' | 'inactive'>('');

  useEffect(() => {
    api.get('/api/plans').then((r) => setPlans(r.data.plans || [])).catch(() => setPlans([])).finally(() => setLoading(false));
  }, []);

  const filtered = plans
    .filter((p) => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      const matchDuration = !durationFilter || p.duration === durationFilter;
      const matchActive = activeFilter === '' || (activeFilter === 'active' && p.isActive) || (activeFilter === 'inactive' && !p.isActive);
      return matchSearch && matchDuration && matchActive;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/plans', { name: form.name, price: Number(form.price), duration: form.duration });
      setShowForm(false);
      setForm({ name: '', price: '', duration: 'MONTHLY' });
      const { data } = await api.get('/api/plans');
      setPlans(data.plans || []);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await api.patch(`/api/plans/${id}`, { isActive });
      setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, isActive } : p)));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Helmet><title>Admin – Premium plans | NUIT</title></Helmet>
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h1 className="font-header text-3xl text-[var(--color-text)]">Premium plans</h1>
          <ActionButton icon={<IconAdd />} label={showForm ? 'Cancel' : 'Add plan'} onClick={() => setShowForm(!showForm)} variant={showForm ? 'default' : 'primary'} />
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"><IconSearch /></span>
            <input type="text" placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] pl-10 pr-4 py-2 rounded text-sm" />
          </div>
          <select value={durationFilter} onChange={(e) => setDurationFilter(e.target.value)} className="bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded text-sm">
            <option value="">All durations</option>
            <option value="MONTHLY">Monthly</option>
            <option value="YEARLY">Yearly</option>
          </select>
          <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as typeof activeFilter)} className="bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded text-sm">
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 border border-[var(--color-border)] space-y-4 max-w-8xl">
          <input required placeholder="Plan name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2" />
          <input required type="number" step="0.01" placeholder="Price (LKR)" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2" />
          <select value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2">
            <option value="MONTHLY">Monthly</option>
            <option value="YEARLY">Yearly</option>
          </select>
          <button type="submit" className="bg-[var(--color-primary)] text-[var(--color-bg)] px-4 py-2 text-sm font-medium">Create</button>
        </form>
      )}

      {loading ? (
          <LoadingSpinner message="Loading…" />
        ) : filtered.length === 0 ? (
          <p className="text-[var(--color-text-muted)]">No plans match.</p>
        ) : (
          <div className="space-y-4">
            {filtered.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg">
                <div>
                  <p className="font-medium text-[var(--color-text)]">{p.name}</p>
                  <p className="text-sm text-[var(--color-text-muted)]">LKR {Number(p.price).toLocaleString()} / {p.duration.toLowerCase()} · Subscribers: {p._count?.subscriptions ?? 0}</p>
                  <div className="mt-2"><StatusBadge variant={p.isActive ? 'success' : 'neutral'}>{p.isActive ? 'Active' : 'Inactive'}</StatusBadge></div>
                </div>
                <ActionButton icon={p.isActive ? <IconClose /> : <IconCheck />} label={p.isActive ? 'Deactivate' : 'Activate'} onClick={() => toggleActive(p.id, !p.isActive)} variant="default" />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
