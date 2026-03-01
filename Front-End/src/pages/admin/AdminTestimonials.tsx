import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import api, { uploadImage } from '../../api/client';
import StatusBadge from '../../components/ui/StatusBadge';
import ActionButton from '../../components/ui/ActionButton';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ImageInput from '../../components/event/ImageInput';
import { IconAdd, IconSearch, IconDelete } from '../../components/icons/PanelIcons';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

type Testimonial = {
  id: string;
  author: string;
  content: string;
  avatarUrl: string | null;
  rating: number | null;
  isActive: boolean;
};

export default function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ author: '', content: '', avatarUrl: '', rating: 5, isActive: true });
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchTestimonials = () => {
    api.get('/api/testimonials').then((r) => setTestimonials(r.data.testimonials || [])).catch(() => setTestimonials([])).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'' | 'active' | 'inactive'>('');
  const [sortKey, setSortKey] = useState<'author' | 'rating'>('author');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filtered = testimonials
    .filter((t) => {
      const matchSearch = !search || t.author.toLowerCase().includes(search.toLowerCase()) || t.content.toLowerCase().includes(search.toLowerCase());
      const matchActive = activeFilter === '' || (activeFilter === 'active' && t.isActive) || (activeFilter === 'inactive' && !t.isActive);
      return matchSearch && matchActive;
    })
    .sort((a, b) => {
      if (sortKey === 'author') {
        const cmp = a.author.localeCompare(b.author);
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      const ra = a.rating ?? 0;
      const rb = b.rating ?? 0;
      return sortOrder === 'asc' ? ra - rb : rb - ra;
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let avatarUrl = form.avatarUrl.trim() || null;
      if (pendingAvatarFile) {
        avatarUrl = await uploadImage(pendingAvatarFile);
        setForm((f) => ({ ...f, avatarUrl }));
        setPendingAvatarFile(null);
      }
      await api.post('/api/testimonials', {
        author: form.author.trim(),
        content: form.content.trim(),
        avatarUrl,
        rating: form.rating,
        isActive: form.isActive,
      });
      setShowForm(false);
      setForm({ author: '', content: '', avatarUrl: '', rating: 5, isActive: true });
      fetchTestimonials();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await api.patch(`/api/testimonials/${id}`, { isActive });
      setTestimonials((prev) => prev.map((t) => (t.id === id ? { ...t, isActive } : t)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/testimonials/${id}`);
      setTestimonials((prev) => prev.filter((t) => t.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Helmet><title>Admin – Testimonials | NUIT</title></Helmet>
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="font-header text-3xl text-[var(--color-text)]">Testimonials</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">Customer quotes shown on the homepage.</p>
          </div>
          <ActionButton icon={<IconAdd />} label={showForm ? 'Cancel' : 'Add testimonial'} onClick={() => setShowForm(!showForm)} variant={showForm ? 'default' : 'primary'} />
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"><IconSearch /></span>
            <input type="text" placeholder="Search by author or content..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] pl-10 pr-4 py-2 rounded text-sm" />
          </div>
          <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as typeof activeFilter)} className="bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded text-sm">
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select value={`${sortKey}-${sortOrder}`} onChange={(e) => { const [k, o] = (e.target.value as string).split('-'); setSortKey(k as 'author' | 'rating'); setSortOrder(o as 'asc' | 'desc'); }} className="bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-3 py-2 rounded text-sm">
            <option value="author-asc">Author A–Z</option>
            <option value="author-desc">Author Z–A</option>
            <option value="rating-desc">Rating (high first)</option>
            <option value="rating-asc">Rating (low first)</option>
          </select>
        </div>

        {showForm && (
          <section className="p-6 border border-[var(--color-border)] bg-[var(--color-bg-card)] rounded-lg">
            <h2 className="font-header text-xl text-[var(--color-text)] mb-4">New testimonial</h2>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-8xl">
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1">Author *</label>
                <input required value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded" placeholder="Customer name" />
              </div>
              <ImageInput label="Avatar image (optional)" value={form.avatarUrl} onChange={(url) => setForm((f) => ({ ...f, avatarUrl: url }))} onPendingFileChange={setPendingAvatarFile} placeholder="https://... or upload" />
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1">Content *</label>
                <textarea required rows={3} value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded" placeholder="Quote text" />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1">Rating (1–5)</label>
                <input type="number" min={1} max={5} value={form.rating} onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) || 5 }))} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded" />
              </div>
              <label className="flex items-center gap-2 text-[var(--color-text)]">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
                Active
              </label>
              <button type="submit" className="bg-[var(--color-primary)] text-[var(--color-bg)] px-6 py-2 text-sm font-medium">Create testimonial</button>
            </form>
          </section>
        )}

        {loading ? (
          <LoadingSpinner message="Loading testimonials…" />
        ) : filtered.length === 0 ? (
          <p className="text-[var(--color-text-muted)]">No testimonials match.</p>
        ) : (
          <section>
            <h2 className="font-header text-xl text-[var(--color-text)] mb-4">Current testimonials</h2>
            <ul className="space-y-4">
              {filtered.map((t) => (
                <li key={t.id} className="p-4 border border-[var(--color-border)] bg-[var(--color-bg-elevated)] rounded-lg">
                  <blockquote className="text-[var(--color-text-muted)] text-sm mb-2">&ldquo;{t.content}&rdquo;</blockquote>
                  <footer className="text-[var(--color-primary)] font-medium">{t.author}</footer>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {t.rating != null && <span className="text-xs text-[var(--color-text-muted)]">Rating: {t.rating}/5</span>}
                    <StatusBadge variant={t.isActive ? 'success' : 'neutral'}>{t.isActive ? 'Active' : 'Inactive'}</StatusBadge>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <label className="flex items-center gap-2 text-sm text-[var(--color-text)]">
                      <input type="checkbox" checked={t.isActive} onChange={(e) => toggleActive(t.id, e.target.checked)} aria-label="Toggle active" />
                      <span className="hidden md:inline">Active</span>
                    </label>
                    <ActionButton icon={<IconDelete />} label="Delete" onClick={() => setDeleteConfirm(t.id)} variant="danger" />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
        <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)} title="Remove testimonial" message="Remove this testimonial?" confirmLabel="Remove" variant="danger" />
      </div>
    </>
  );
}
