import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import api from '../../api/client';
import StatusBadge from '../../components/ui/StatusBadge';
import ActionButton from '../../components/ui/ActionButton';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { IconAdd, IconSearch, IconCheck, IconClose } from '../../components/icons/PanelIcons';

type Promotion = {
  id: string;
  name: string;
  type: string;
  value: string | null;
  startDate: string;
  endDate: string;
  isFlash: boolean;
  isActive: boolean;
  _count?: { coupons: number; bookings: number };
};

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'PERCENTAGE', value: '', startDate: '', endDate: '', isActive: true });
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<'' | 'active' | 'inactive'>('');

  useEffect(() => {
    api.get('/api/promotions').then((r) => setPromotions(r.data.promotions || [])).catch(() => setPromotions([])).finally(() => setLoading(false));
  }, []);

  const filtered = promotions
    .filter((p) => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.type.toLowerCase().includes(search.toLowerCase());
      const matchType = !typeFilter || p.type === typeFilter;
      const matchActive = activeFilter === '' || (activeFilter === 'active' && p.isActive) || (activeFilter === 'inactive' && !p.isActive);
      return matchSearch && matchType && matchActive;
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/promotions', {
        name: form.name,
        type: form.type,
        value: form.value ? Number(form.value) : null,
        startDate: form.startDate || new Date().toISOString().slice(0, 10),
        endDate: form.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        isActive: form.isActive,
      });
      setShowForm(false);
      setForm({ name: '', type: 'PERCENTAGE', value: '', startDate: '', endDate: '', isActive: true });
      const { data } = await api.get('/api/promotions');
      setPromotions(data.promotions || []);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await api.patch(`/api/promotions/${id}`, { isActive });
      setPromotions((prev) => prev.map((p) => (p.id === id ? { ...p, isActive } : p)));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Helmet><title>Admin – Promotions | NUIT</title></Helmet>
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h1 className="font-header text-3xl text-[var(--color-text)]">Promotions</h1>
          <ActionButton icon={<IconAdd />} label={showForm ? 'Cancel' : 'Add promotion'} onClick={() => setShowForm(!showForm)} variant={showForm ? 'default' : 'primary'} />
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"><IconSearch /></span>
            <input type="text" placeholder="Search by name or type..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] pl-10 pr-4 py-2 rounded text-sm" />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded text-sm">
            <option value="">All types</option>
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED_AMOUNT">Fixed amount</option>
            <option value="COUPON">Coupon</option>
            <option value="FLASH">Flash</option>
          </select>
          <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as typeof activeFilter)} className="bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded text-sm">
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 border border-[var(--color-border)] space-y-4 max-w-8xl">
          <input required placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2" />
          <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2">
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED_AMOUNT">Fixed amount</option>
            <option value="BUY_ONE_GET_ONE">Buy 1 Get 1</option>
            <option value="COUPON">Coupon</option>
            <option value="AUTO">Auto apply</option>
            <option value="FLASH">Flash</option>
          </select>
          <input type="number" step="0.01" placeholder="Value (% or LKR)" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2" />
          <input type="date" placeholder="Start date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2" />
          <input type="date" placeholder="End date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2" />
          <label className="flex items-center gap-2 text-[var(--color-text)]">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
            Active
          </label>
          <button type="submit" className="bg-[var(--color-primary)] text-[var(--color-bg)] px-4 py-2 text-sm font-medium">Create</button>
        </form>
      )}

      {loading ? (
          <LoadingSpinner message="Loading…" />
        ) : filtered.length === 0 ? (
          <p className="text-[var(--color-text-muted)]">No promotions match.</p>
        ) : (
          <div className="space-y-4">
            {filtered.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg">
                <div>
                  <p className="font-medium text-[var(--color-text)]">{p.name}</p>
                  <p className="text-sm text-[var(--color-text-muted)]">{p.type} · {new Date(p.startDate).toLocaleDateString()} – {new Date(p.endDate).toLocaleDateString()} · Coupons: {p._count?.coupons ?? 0}</p>
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
