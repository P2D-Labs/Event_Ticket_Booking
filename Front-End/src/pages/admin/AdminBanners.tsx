import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import api, { uploadImage } from '../../api/client';
import StatusBadge from '../../components/ui/StatusBadge';
import ActionButton from '../../components/ui/ActionButton';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ImageInput from '../../components/event/ImageInput';
import ClickableImage from '../../components/ui/ClickableImage';
import { IconAdd, IconSearch, IconDelete, IconEdit } from '../../components/icons/PanelIcons';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

type Banner = {
  id: string;
  title: string | null;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
  buttonLabel: string | null;
  sortOrder: number;
  isActive: boolean;
};

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', subtitle: '', imageUrl: '', linkUrl: '', buttonLabel: '', sortOrder: 0, isActive: true });
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchBanners = () => {
    api.get('/api/banners').then((r) => setBanners(r.data.banners || [])).catch(() => setBanners([])).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'sortOrder' | 'title'>('sortOrder');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filtered = banners
    .filter((b) => !search || (b.title ?? '').toLowerCase().includes(search.toLowerCase()) || (b.linkUrl ?? '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortKey === 'sortOrder') return sortOrder === 'asc' ? a.sortOrder - b.sortOrder : b.sortOrder - a.sortOrder;
      const ta = (a.title ?? '').toLowerCase();
      const tb = (b.title ?? '').toLowerCase();
      return sortOrder === 'asc' ? ta.localeCompare(tb) : tb.localeCompare(ta);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let imageUrl = form.imageUrl.trim();
      if (pendingImageFile) {
        imageUrl = await uploadImage(pendingImageFile);
        setForm((f) => ({ ...f, imageUrl }));
        setPendingImageFile(null);
      }
      if (editingId) {
        await api.patch(`/api/banners/${editingId}`, {
          title: form.title.trim() || null,
          subtitle: form.subtitle.trim() || null,
          imageUrl,
          linkUrl: form.linkUrl.trim() || null,
          buttonLabel: form.buttonLabel.trim() || null,
          sortOrder: Number(form.sortOrder) || 0,
          isActive: form.isActive,
        });
        setEditingId(null);
      } else {
        await api.post('/api/banners', {
          title: form.title.trim() || null,
          subtitle: form.subtitle.trim() || null,
          imageUrl,
          linkUrl: form.linkUrl.trim() || null,
          buttonLabel: form.buttonLabel.trim() || null,
          sortOrder: Number(form.sortOrder) || 0,
          isActive: form.isActive,
        });
        setShowForm(false);
      }
      setForm({ title: '', subtitle: '', imageUrl: '', linkUrl: '', buttonLabel: '', sortOrder: banners.length, isActive: true });
      fetchBanners();
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (b: Banner) => {
    setEditingId(b.id);
    setPendingImageFile(null);
    setForm({
      title: b.title ?? '',
      subtitle: b.subtitle ?? '',
      imageUrl: b.imageUrl,
      linkUrl: b.linkUrl ?? '',
      buttonLabel: b.buttonLabel ?? '',
      sortOrder: b.sortOrder,
      isActive: b.isActive,
    });
    setShowForm(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setPendingImageFile(null);
    setForm({ title: '', subtitle: '', imageUrl: '', linkUrl: '', buttonLabel: '', sortOrder: banners.length, isActive: true });
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await api.patch(`/api/banners/${id}`, { isActive });
      setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, isActive } : b)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/banners/${id}`);
      setBanners((prev) => prev.filter((b) => b.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Helmet><title>Admin – Banners | NUIT</title></Helmet>
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="font-header text-3xl text-[var(--color-text)]">Banners</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">Homepage hero and promo banners. Order by sort order.</p>
          </div>
          <ActionButton
            icon={<IconAdd />}
            label={editingId ? 'Cancel edit' : showForm ? 'Cancel' : 'Add banner'}
            onClick={() => { if (editingId) { cancelEdit(); } else { setShowForm(!showForm); } }}
            variant={editingId || showForm ? 'default' : 'primary'}
          />
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"><IconSearch /></span>
            <input type="text" placeholder="Search by title or link..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] pl-10 pr-4 py-2 rounded text-sm" />
          </div>
          <select value={`${sortKey}-${sortOrder}`} onChange={(e) => { const [k, o] = (e.target.value as string).split('-'); setSortKey(k as 'sortOrder' | 'title'); setSortOrder(o as 'asc' | 'desc'); }} className="bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-3 py-2 rounded text-sm">
            <option value="sortOrder-asc">Order (low first)</option>
            <option value="sortOrder-desc">Order (high first)</option>
            <option value="title-asc">Title A–Z</option>
            <option value="title-desc">Title Z–A</option>
          </select>
        </div>

        {(showForm || editingId) && (
          <section className="p-6 border border-[var(--color-border)] bg-[var(--color-bg-card)] rounded-lg">
            <h2 className="font-header text-xl text-[var(--color-text)] mb-4">{editingId ? 'Edit banner' : 'New banner'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-8xl">
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1">Title (optional)</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded" placeholder="Banner title" />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1">Subtitle (optional)</label>
                <input value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded" placeholder="Short tagline" />
              </div>
              <ImageInput label="Image" value={form.imageUrl} onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))} onPendingFileChange={setPendingImageFile} required placeholder="https://... or upload" />
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1">Link URL (optional, for button)</label>
                <input value={form.linkUrl} onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded" placeholder="/events" />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1">Button label (optional, shown when link URL is set)</label>
                <input value={form.buttonLabel} onChange={(e) => setForm((f) => ({ ...f, buttonLabel: e.target.value }))} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded" placeholder="Book now" />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1">Sort order</label>
                <input type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded" />
              </div>
              <label className="flex items-center gap-2 text-[var(--color-text)]">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
                Active
              </label>
              <div className="flex gap-3">
                <button type="submit" className="bg-[var(--color-primary)] text-[var(--color-bg)] px-6 py-2 text-sm font-medium">{editingId ? 'Save changes' : 'Create banner'}</button>
                {editingId && <button type="button" onClick={cancelEdit} className="border border-[var(--color-border)] text-[var(--color-text)] px-6 py-2 text-sm font-medium">Cancel</button>}
              </div>
            </form>
          </section>
        )}

        {loading ? (
          <LoadingSpinner message="Loading banners…" />
        ) : filtered.length === 0 ? (
          <p className="text-[var(--color-text-muted)]">No banners match. Add one to show on the homepage.</p>
        ) : (
          <section>
            <h2 className="font-header text-xl text-[var(--color-text)] mb-4">Current banners</h2>
            <ul className="space-y-4">
              {filtered.map((b) => (
                <li key={b.id} className="flex flex-wrap gap-4 p-4 border border-[var(--color-border)] bg-[var(--color-bg-elevated)] rounded-lg">
                  <div className="w-32 h-20 shrink-0 rounded overflow-hidden bg-[var(--color-bg-input)]">
                    <ClickableImage src={b.imageUrl} alt={b.title || 'Banner'} className="w-full h-full">
                      <img src={b.imageUrl} alt={b.title || 'Banner'} className="w-full h-full object-cover" />
                    </ClickableImage>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--color-text)]">{b.title || '—'}</p>
                    {b.subtitle && <p className="text-sm text-[var(--color-text-muted)]">{b.subtitle}</p>}
                    <p className="text-xs text-[var(--color-text-muted)] truncate">{b.imageUrl}</p>
                    <p className="text-xs text-[var(--color-primary)]">{b.linkUrl ? (b.buttonLabel || b.linkUrl) : 'No link'}</p>
                    <p className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-[var(--color-text-muted)]">Order: {b.sortOrder}</span>
                      <StatusBadge variant={b.isActive ? 'success' : 'neutral'}>{b.isActive ? 'Active' : 'Inactive'}</StatusBadge>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ActionButton icon={<IconEdit />} label="Edit" onClick={() => startEdit(b)} variant="default" />
                    <label className="flex items-center gap-2 text-sm text-[var(--color-text)]">
                      <input type="checkbox" checked={b.isActive} onChange={(e) => toggleActive(b.id, e.target.checked)} aria-label="Toggle active" />
                      <span className="hidden md:inline">Active</span>
                    </label>
                    <ActionButton icon={<IconDelete />} label="Delete" onClick={() => setDeleteConfirm(b.id)} variant="danger" />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
        <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)} title="Remove banner" message="Remove this banner from the homepage?" confirmLabel="Remove" variant="danger" />
      </div>
    </>
  );
}
