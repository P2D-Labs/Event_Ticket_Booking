import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import api from '../../api/client';
import ActionButton from '../../components/ui/ActionButton';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { IconAdd, IconSearch, IconDelete } from '../../components/icons/PanelIcons';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

type Coupon = {
  id: string;
  code: string;
  maxUses: number | null;
  usedCount: number;
  promotion: { id: string; name: string; type: string };
};

type Promotion = { id: string; name: string; type: string };

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', promotionId: '', maxUses: '' });
  const [search, setSearch] = useState('');
  const [promoFilter, setPromoFilter] = useState('');
  const [formError, setFormError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    api.get('/api/promotions/coupons').then((r) => setCoupons(r.data.coupons || [])).catch(() => setCoupons([]));
    api.get('/api/promotions').then((r) => setPromotions((r.data.promotions || []).filter((p: Promotion) => p.type === 'COUPON'))).catch(() => setPromotions([])).finally(() => setLoading(false));
  }, []);

  const filtered = coupons.filter((c) => {
    const matchSearch = !search || c.code.toLowerCase().includes(search.toLowerCase()) || c.promotion.name.toLowerCase().includes(search.toLowerCase());
    const matchPromo = !promoFilter || c.promotion.id === promoFilter;
    return matchSearch && matchPromo;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.code.trim() || !form.promotionId) return;
    try {
      await api.post('/api/promotions/coupons', {
        code: form.code.trim(),
        promotionId: form.promotionId,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
      });
      setShowForm(false);
      setForm({ code: '', promotionId: '', maxUses: '' });
      const { data } = await api.get('/api/promotions/coupons');
      setCoupons(data.coupons || []);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg || 'Failed to create coupon');
    }
  };

  const removeCoupon = async (id: string) => {
    try {
      await api.delete(`/api/promotions/coupons/${id}`);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Helmet><title>Admin – Coupons | NUIT</title></Helmet>
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h1 className="font-header text-3xl text-[var(--color-text)]">Coupons</h1>
          <ActionButton icon={<IconAdd />} label={showForm ? 'Cancel' : 'Add coupon'} onClick={() => setShowForm(!showForm)} variant={showForm ? 'default' : 'primary'} />
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"><IconSearch /></span>
            <input type="text" placeholder="Search by code or promotion..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] pl-10 pr-4 py-2 rounded text-sm" />
          </div>
          <select value={promoFilter} onChange={(e) => setPromoFilter(e.target.value)} className="bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded text-sm">
            <option value="">All promotions</option>
            {promotions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 border border-[var(--color-border)] space-y-4 max-w-8xl">
          {formError && <p className="text-sm text-red-400">{formError}</p>}
          <input required placeholder="Code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2" />
          <select required value={form.promotionId} onChange={(e) => setForm((f) => ({ ...f, promotionId: e.target.value }))} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2">
            <option value="">Select promotion (COUPON type)</option>
            {promotions.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input type="number" min="1" placeholder="Max uses (optional)" value={form.maxUses} onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2" />
          <button type="submit" className="bg-[var(--color-primary)] text-[var(--color-bg)] px-4 py-2 text-sm font-medium">Create</button>
        </form>
      )}

      {loading ? (
          <LoadingSpinner message="Loading…" />
        ) : filtered.length === 0 ? (
          <p className="text-[var(--color-text-muted)]">No coupons match. Create a COUPON-type promotion first, then add coupons.</p>
        ) : (
          <div className="space-y-4">
            {filtered.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg">
                <div>
                  <p className="font-medium text-[var(--color-text)]">{c.code}</p>
                  <p className="text-sm text-[var(--color-text-muted)]">{c.promotion.name} · Used: {c.usedCount}{c.maxUses != null ? ` / ${c.maxUses}` : ''}</p>
                </div>
                <ActionButton icon={<IconDelete />} label="Delete" onClick={() => setDeleteConfirm(c.id)} variant="danger" />
              </div>
            ))}
          </div>
        )}
        <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={() => deleteConfirm && removeCoupon(deleteConfirm)} title="Delete coupon" message="Delete this coupon? It cannot be undone." confirmLabel="Delete" variant="danger" />
      </div>
    </>
  );
}
