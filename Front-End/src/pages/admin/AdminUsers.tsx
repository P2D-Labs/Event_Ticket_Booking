import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SortableTh from '../../components/ui/SortableTh';
import { IconSearch, IconView } from '../../components/icons/PanelIcons';

type User = {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: string;
  isPremium: boolean;
  organization?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
};

const PAGE_SIZE = 15;

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<string | null>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(pagination.page));
    params.set('limit', String(PAGE_SIZE));
    if (search) params.set('search', search);
    api.get(`/api/users/admin?${params}`)
      .then((r) => {
        setUsers(r.data.users || []);
        setPagination(r.data.pagination || { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
      })
      .catch(() => {
        setUsers([]);
        setPagination((p) => ({ ...p, total: 0, totalPages: 1 }));
      })
      .finally(() => setLoading(false));
  }, [pagination.page, search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const setPage = (p: number) => {
    setPagination((prev) => ({ ...prev, page: Math.max(1, Math.min(prev.totalPages, p)) }));
  };

  const totalPages = pagination.totalPages || 1;
  const page = pagination.page;

  const handleSort = (key: string) => {
    if (sortKey === key) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortOrder('asc'); }
  };

  const sortedUsers = [...users].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
    else if (sortKey === 'email') cmp = a.email.localeCompare(b.email);
    else if (sortKey === 'role') cmp = a.role.localeCompare(b.role);
    else if (sortKey === 'isPremium') cmp = (a.isPremium ? 1 : 0) - (b.isPremium ? 1 : 0);
    else if (sortKey === 'createdAt') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  return (
    <>
      <Helmet><title>User management | Admin | NUIT</title></Helmet>
      <div className="space-y-6">
        <h1 className="font-header text-3xl text-[var(--color-text)]">User management</h1>

        <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"><IconSearch /></span>
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] pl-10 pr-4 py-2 rounded text-sm"
            />
          </div>
          <button type="submit" className="bg-[var(--color-primary)] text-[var(--color-bg)] px-4 py-2 rounded text-sm font-medium hover:bg-[var(--color-primary-light)]">
            Search
          </button>
        </form>

        {loading ? (
          <LoadingSpinner message="Loading users…" />
        ) : users.length === 0 ? (
          <p className="text-[var(--color-text-muted)]">No users found.</p>
        ) : (
          <div className="space-y-4">
            <div className="border border-[var(--color-border)] rounded-lg overflow-hidden bg-[var(--color-bg-card)]">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--color-bg-elevated)] border-b border-[var(--color-border)]">
                    <tr>
                      <th className="p-3 text-[var(--color-text-muted)] font-medium w-14"> </th>
                      <SortableTh sortKey={sortKey} thisKey="name" sortOrder={sortOrder} onSort={handleSort}>Name</SortableTh>
                      <SortableTh sortKey={sortKey} thisKey="email" sortOrder={sortOrder} onSort={handleSort}>Email</SortableTh>
                      <SortableTh sortKey={sortKey} thisKey="role" sortOrder={sortOrder} onSort={handleSort}>Role</SortableTh>
                      <SortableTh sortKey={sortKey} thisKey="isPremium" sortOrder={sortOrder} onSort={handleSort}>Premium</SortableTh>
                      <SortableTh sortKey={sortKey} thisKey="createdAt" sortOrder={sortOrder} onSort={handleSort}>Joined</SortableTh>
                      <th className="text-right p-3 text-[var(--color-text-muted)] font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUsers.map((u) => (
                      <tr
                        key={u.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/admin/users/${u.id}`)}
                        onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); navigate(`/admin/users/${u.id}`); } }}
                        className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-elevated)]/50 cursor-pointer"
                      >
                        <td className="p-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-[var(--color-bg-elevated)] shrink-0 flex items-center justify-center">
                            {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-sm font-header text-[var(--color-text-muted)]">{u.name?.charAt(0)?.toUpperCase() ?? '?'}</span>}
                          </div>
                        </td>
                        <td className="p-3 text-[var(--color-text)] font-medium">{u.name}</td>
                        <td className="p-3 text-[var(--color-text)]">{u.email}</td>
                        <td className="p-3 text-[var(--color-text)]">{u.role}</td>
                        <td className="p-3 text-[var(--color-text)]">{u.isPremium ? 'Yes' : 'No'}</td>
                        <td className="p-3 text-[var(--color-text-muted)]">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="p-3 text-right" onClick={(ev) => ev.stopPropagation()}>
                          <Link to={`/admin/users/${u.id}`} className="inline-flex items-center gap-1 px-3 py-2 rounded text-sm border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg)]">
                            <IconView /> View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setPage(page - 1); }}
                  disabled={page <= 1 || loading}
                  className="p-2 border border-[var(--color-border)] text-[var(--color-text)] disabled:opacity-50 rounded inline-flex items-center justify-center"
                  aria-label="Previous page"
                >
                  ‹
                </button>
                <span className="text-sm text-[var(--color-text-muted)] px-4">Page {page} of {totalPages} ({pagination.total} total)</span>
                <button
                  type="button"
                  onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setPage(page + 1); }}
                  disabled={page >= totalPages || loading}
                  className="p-2 border border-[var(--color-border)] text-[var(--color-text)] disabled:opacity-50 rounded inline-flex items-center justify-center"
                  aria-label="Next page"
                >
                  ›
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
