import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import api from '../../api/client';
import ActionButton from '../../components/ui/ActionButton';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SortableTh from '../../components/ui/SortableTh';
import { IconEdit, IconDelete, IconAdd, IconSearch } from '../../components/icons/PanelIcons';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

type Category = { id: string; name: string; slug: string; description?: string | null };

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'name' | 'slug'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchCategories = () => {
    api.get('/api/categories').then((r) => setCategories(r.data.categories || [])).catch(() => setCategories([])).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filtered = categories
    .filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.slug.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const va = sortKey === 'name' ? a.name : a.slug;
      const vb = sortKey === 'name' ? b.name : b.slug;
      const cmp = va.localeCompare(vb);
      return sortOrder === 'asc' ? cmp : -cmp;
    });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return;
    try {
      await api.post('/api/categories', { name: form.name.trim(), description: form.description.trim() || null });
      setShowForm(false);
      setForm({ name: '', description: '' });
      fetchCategories();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to create category');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !form.name.trim()) return;
    setError('');
    try {
      await api.patch(`/api/categories/${editingId}`, { name: form.name.trim(), description: form.description.trim() || null });
      setEditingId(null);
      setForm({ name: '', description: '' });
      fetchCategories();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to update category');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/categories/${id}`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      if (editingId === id) setEditingId(null);
      setDeleteConfirm(null);
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (c: Category) => {
    setEditingId(c.id);
    setForm({ name: c.name, description: c.description || '' });
  };

  const handleSort = (key: string) => {
    const k = key as 'name' | 'slug';
    if (sortKey === k) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(k); setSortOrder('asc'); }
  };

  return (
    <>
      <Helmet><title>Admin – Categories | NUIT</title></Helmet>
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h1 className="font-header text-3xl text-[var(--color-text)]">Categories</h1>
          <ActionButton icon={<IconAdd />} label="Add category" onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', description: '' }); }} variant="primary" />
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"><IconSearch /></span>
            <input
              type="text"
              placeholder="Search by name or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] pl-10 pr-4 py-2 rounded text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--color-text-muted)]">Sort:</span>
            <select
              value={`${sortKey}-${sortOrder}`}
              onChange={(e) => { const [k, o] = (e.target.value as string).split('-'); setSortKey(k as 'name' | 'slug'); setSortOrder(o as 'asc' | 'desc'); }}
              className="bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-3 py-2 rounded text-sm"
            >
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
              <option value="slug-asc">Slug A–Z</option>
              <option value="slug-desc">Slug Z–A</option>
            </select>
          </div>
        </div>

        {(showForm || editingId) && (
          <section className="p-6 border border-[var(--color-border)] bg-[var(--color-bg-card)] rounded-lg">
            <h2 className="font-header text-xl text-[var(--color-text)] mb-4">{editingId ? 'Edit category' : 'New category'}</h2>
            <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4 max-w-8xl">
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1">Name *</label>
                <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded" placeholder="Category name" />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1">Description (optional)</label>
                <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded" placeholder="Short description" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-[var(--color-primary)] text-[var(--color-bg)] px-4 py-2 text-sm font-medium rounded">{editingId ? 'Save' : 'Create'}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm({ name: '', description: '' }); setError(''); }} className="border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 text-sm rounded">Cancel</button>
              </div>
            </form>
          </section>
        )}

        {loading ? (
          <LoadingSpinner message="Loading categories…" />
        ) : filtered.length === 0 ? (
          <p className="text-[var(--color-text-muted)]">No categories match. Add one above.</p>
        ) : (
          <div className="overflow-x-auto border border-[var(--color-border)] rounded-lg">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
                  <SortableTh sortKey={sortKey} thisKey="name" sortOrder={sortOrder} onSort={handleSort}>Name</SortableTh>
                  <SortableTh sortKey={sortKey} thisKey="slug" sortOrder={sortOrder} onSort={handleSort}>Slug</SortableTh>
                  <th className="px-4 py-3 font-medium text-[var(--color-text-muted)] text-left">Description</th>
                  <th className="px-4 py-3 font-medium text-[var(--color-text-muted)] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-elevated)]/50">
                    <td className="px-4 py-3 text-[var(--color-text)] font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">{c.slug}</td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">{c.description || '–'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <ActionButton icon={<IconEdit />} label="Edit" onClick={() => startEdit(c)} variant="default" />
                        <ActionButton icon={<IconDelete />} label="Delete" onClick={() => setDeleteConfirm(c.id)} variant="danger" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)} title="Delete category" message="Delete this category? It will be hidden from the site." confirmLabel="Delete" variant="danger" />
      </div>
    </>
  );
}
