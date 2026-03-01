import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api, { uploadImage } from '../../api/client';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import BackLink from '../../components/ui/BackLink';
import SortableTh from '../../components/ui/SortableTh';
import { IconEdit, IconCheck, IconClose } from '../../components/icons/PanelIcons';
import StatusBadge, { statusToVariant } from '../../components/ui/StatusBadge';
import ImageInput from '../../components/event/ImageInput';
import ClickableImage from '../../components/ui/ClickableImage';

type User = {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: string;
  isPremium: boolean;
  avatarUrl?: string | null;
  organization?: string | null;
  createdAt: string;
  updatedAt: string;
};

type BookingRow = {
  id: string;
  bookingNumber: string;
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  eventDate: string;
  status: string;
  total: number;
  createdAt: string;
};

type EventRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  eventDate: string;
  createdAt: string;
  category?: { id: string; name: string; slug: string } | null;
};

const BOOKINGS_PAGE_SIZE = 10;
const EVENTS_PAGE_SIZE = 10;

export default function AdminUserView() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [bookingsPagination, setBookingsPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [eventsPagination, setEventsPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [eventsLoading, setEventsLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [bookingsSortKey, setBookingsSortKey] = useState<string | null>('createdAt');
  const [bookingsSortOrder, setBookingsSortOrder] = useState<'asc' | 'desc'>('desc');
  const [eventsSortKey, setEventsSortKey] = useState<string | null>('createdAt');
  const [eventsSortOrder, setEventsSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [editForm, setEditForm] = useState<Pick<User, 'name' | 'phone' | 'organization' | 'role' | 'isPremium' | 'avatarUrl'>>({
    name: '',
    phone: '',
    organization: '',
    role: 'CUSTOMER',
    isPremium: false,
    avatarUrl: '',
  });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/api/users/admin/${id}`)
      .then((r) => {
        const u = r.data.user;
        setUser(u);
        setEditForm({
          name: u.name,
          phone: u.phone,
          organization: u.organization || '',
          role: u.role,
          isPremium: u.isPremium,
          avatarUrl: u.avatarUrl || '',
        });
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setBookingsLoading(true);
    const page = bookingsPagination.page;
    api.get(`/api/users/admin/${id}/bookings?page=${page}&limit=${BOOKINGS_PAGE_SIZE}`)
      .then((r) => {
        setBookings(r.data.bookings || []);
        setBookingsPagination(r.data.pagination || { page: 1, total: 0, totalPages: 1 });
      })
      .catch(() => { setBookings([]); setBookingsPagination((p) => ({ ...p, total: 0, totalPages: 1 })); })
      .finally(() => setBookingsLoading(false));
  }, [id, bookingsPagination.page]);

  useEffect(() => {
    if (!id) return;
    setEventsLoading(true);
    const page = eventsPagination.page;
    api.get(`/api/users/admin/${id}/events?page=${page}&limit=${EVENTS_PAGE_SIZE}`)
      .then((r) => {
        setEvents(r.data.events || []);
        setEventsPagination(r.data.pagination || { page: 1, total: 0, totalPages: 1 });
      })
      .catch(() => { setEvents([]); setEventsPagination((p) => ({ ...p, total: 0, totalPages: 1 })); })
      .finally(() => setEventsLoading(false));
  }, [id, eventsPagination.page]);

  const handleSaveProfile = async () => {
    if (!id) return;
    setSaving(true);
    try {
      let avatarUrl = editForm.avatarUrl || '';
      if (pendingAvatarFile) {
        avatarUrl = await uploadImage(pendingAvatarFile);
        setEditForm((f) => ({ ...f, avatarUrl }));
        setPendingAvatarFile(null);
      }
      const r = await api.patch(`/api/users/admin/${id}`, { ...editForm, avatarUrl });
      setUser(r.data.user);
      setEditing(false);
    } catch {
      // keep form open
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || resetNewPassword.length < 8 || resetNewPassword !== resetConfirm) {
      setResetMessage(resetNewPassword !== resetConfirm ? 'Passwords do not match' : 'Password must be at least 8 characters');
      return;
    }
    setResetMessage(null);
    setResetLoading(true);
    try {
      await api.patch(`/api/users/admin/${id}/reset-password`, { newPassword: resetNewPassword });
      setResetMessage('Password has been reset.');
      setResetPasswordOpen(false);
      setResetNewPassword('');
      setResetConfirm('');
    } catch (err: unknown) {
      setResetMessage((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen message="Loading user…" />;
  if (!user) {
    return (
      <div className="p-6 text-[var(--color-text-muted)]">
        User not found. <BackLink to="/admin/users">User management</BackLink>
      </div>
    );
  }

  const setBookingsPage = (p: number) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setBookingsPagination((prev) => ({ ...prev, page: Math.max(1, Math.min(prev.totalPages, p)) }));
  };
  const setEventsPage = (p: number) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setEventsPagination((prev) => ({ ...prev, page: Math.max(1, Math.min(prev.totalPages, p)) }));
  };

  return (
    <>
      <Helmet><title>{user.name} | User management | Admin | NUIT</title></Helmet>
      <div className="max-w-8xl space-y-8">
        <BackLink to="/admin/users">User management</BackLink>

        {/* Profile */}
        <div className="border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-card)] overflow-hidden">
          <div className="p-6 border-b border-[var(--color-border)] flex flex-wrap items-center gap-6">
            <div className="shrink-0">
              {editing ? (
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
                  {editForm.avatarUrl ? <img src={editForm.avatarUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[var(--color-text-muted)] text-2xl font-header">{user.name?.charAt(0)?.toUpperCase() ?? '?'}</div>}
                </div>
              ) : user.avatarUrl ? (
                <ClickableImage src={user.avatarUrl} alt="" className="block w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--color-border)]">
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                </ClickableImage>
              ) : (
                <div className="w-20 h-20 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-bg)] font-header text-2xl">{user.name?.charAt(0)?.toUpperCase() ?? '?'}</div>
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-wrap items-center justify-between gap-4">
              <h1 className="font-header text-2xl text-[var(--color-text)]">Profile</h1>
            {!editing ? (
              <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded text-sm border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10">
                <IconEdit /> Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button type="button" onClick={() => { setEditing(false); setEditForm({ name: user.name, phone: user.phone, organization: user.organization || '', role: user.role, isPremium: user.isPremium, avatarUrl: user.avatarUrl || '' }); }} className="inline-flex items-center gap-2 px-4 py-2 rounded text-sm border border-[var(--color-border)] text-[var(--color-text)]">
                  <IconClose /> Cancel
                </button>
                <button type="button" onClick={handleSaveProfile} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded text-sm bg-[var(--color-primary)] text-[var(--color-bg)] hover:bg-[var(--color-primary-light)] disabled:opacity-50">
                  <IconCheck /> {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            )}
            </div>
          </div>
          <div className="p-6">
            {editing ? (
              <div className="grid gap-4 max-w-8xl">
                <ImageInput label="Profile image" value={editForm.avatarUrl} onChange={(url) => setEditForm((f) => ({ ...f, avatarUrl: url }))} onPendingFileChange={setPendingAvatarFile} placeholder="Avatar URL or upload" />
                <label className="block">
                  <span className="text-sm text-[var(--color-text-muted)]">Name</span>
                  <input type="text" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className="mt-1 w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-3 py-2 rounded text-sm" />
                </label>
                <label className="block">
                  <span className="text-sm text-[var(--color-text-muted)]">Phone</span>
                  <input type="text" value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} className="mt-1 w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-3 py-2 rounded text-sm" />
                </label>
                <label className="block">
                  <span className="text-sm text-[var(--color-text-muted)]">Organization</span>
                  <input type="text" value={editForm.organization} onChange={(e) => setEditForm((f) => ({ ...f, organization: e.target.value }))} className="mt-1 w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-3 py-2 rounded text-sm" />
                </label>
                <label className="block">
                  <span className="text-sm text-[var(--color-text-muted)]">Role</span>
                  <select value={editForm.role} onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value as User['role'] }))} className="mt-1 w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-3 py-2 rounded text-sm">
                    <option value="CUSTOMER">CUSTOMER</option>
                    <option value="ORGANIZER">ORGANIZER</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={editForm.isPremium} onChange={(e) => setEditForm((f) => ({ ...f, isPremium: e.target.checked }))} className="rounded border-[var(--color-border)]" />
                  <span className="text-sm text-[var(--color-text)]">Premium</span>
                </label>
              </div>
            ) : (
              <dl className="grid gap-3 text-sm">
                <div><dt className="text-[var(--color-text-muted)]">Email</dt><dd className="text-[var(--color-text)]">{user.email}</dd></div>
                <div><dt className="text-[var(--color-text-muted)]">Name</dt><dd className="text-[var(--color-text)]">{user.name}</dd></div>
                <div><dt className="text-[var(--color-text-muted)]">Phone</dt><dd className="text-[var(--color-text)]">{user.phone || '—'}</dd></div>
                <div><dt className="text-[var(--color-text-muted)]">Organization</dt><dd className="text-[var(--color-text)]">{user.organization || '—'}</dd></div>
                <div><dt className="text-[var(--color-text-muted)]">Role</dt><dd className="text-[var(--color-text)]">{user.role}</dd></div>
                <div><dt className="text-[var(--color-text-muted)]">Premium</dt><dd className="text-[var(--color-text)]">{user.isPremium ? 'Yes' : 'No'}</dd></div>
                <div><dt className="text-[var(--color-text-muted)]">Profile image</dt><dd className="text-[var(--color-text)]">{user.avatarUrl ? 'Set' : '—'}</dd></div>
                <div><dt className="text-[var(--color-text-muted)]">Joined</dt><dd className="text-[var(--color-text)]">{new Date(user.createdAt).toLocaleString()}</dd></div>
              </dl>
            )}
          </div>
        </div>

        {/* Reset password (admin) */}
        <div className="border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-card)] overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border)] flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-header text-xl text-[var(--color-text)]">Reset password</h2>
            {!resetPasswordOpen ? (
              <button type="button" onClick={() => { setResetPasswordOpen(true); setResetMessage(null); }} className="inline-flex items-center gap-2 px-4 py-2 rounded text-sm border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10">
                Set new password
              </button>
            ) : null}
          </div>
          {resetPasswordOpen && (
            <div className="p-4">
              {resetMessage && <p className={`text-sm mb-3 ${resetMessage.startsWith('Password has') ? 'text-green-600' : 'text-red-400'}`}>{resetMessage}</p>}
              <form onSubmit={handleResetPassword} className="grid gap-3 max-w-md">
                <label className="block">
                  <span className="text-sm text-[var(--color-text-muted)]">New password</span>
                  <input type="password" value={resetNewPassword} onChange={(e) => setResetNewPassword(e.target.value)} minLength={8} className="mt-1 w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-3 py-2 rounded text-sm" />
                </label>
                <label className="block">
                  <span className="text-sm text-[var(--color-text-muted)]">Confirm password</span>
                  <input type="password" value={resetConfirm} onChange={(e) => setResetConfirm(e.target.value)} minLength={8} className="mt-1 w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-3 py-2 rounded text-sm" />
                </label>
                <div className="flex gap-2">
                  <button type="submit" disabled={resetLoading || resetNewPassword.length < 8 || resetNewPassword !== resetConfirm} className="px-4 py-2 rounded text-sm bg-[var(--color-primary)] text-[var(--color-bg)] hover:bg-[var(--color-primary-light)] disabled:opacity-50">Reset password</button>
                  <button type="button" onClick={() => { setResetPasswordOpen(false); setResetMessage(null); setResetNewPassword(''); setResetConfirm(''); }} className="px-4 py-2 rounded text-sm border border-[var(--color-border)] text-[var(--color-text)]">Cancel</button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Bookings */}
        <div className="border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-card)] overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border)]">
            <h2 className="font-header text-xl text-[var(--color-text)]">Bookings</h2>
            <p className="text-sm text-[var(--color-text-muted)]">{bookingsPagination.total} total</p>
          </div>
          <div className="p-4">
            {bookingsLoading ? (
              <LoadingSpinner message="Loading bookings…" />
            ) : bookings.length === 0 ? (
              <p className="text-[var(--color-text-muted)] text-sm">No bookings.</p>
            ) : (
              (() => {
                const handleBookingsSort = (key: string) => {
                  if (bookingsSortKey === key) setBookingsSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
                  else { setBookingsSortKey(key); setBookingsSortOrder('asc'); }
                };
                const sortedBookings = [...bookings].sort((a, b) => {
                  let cmp = 0;
                  if (bookingsSortKey === 'bookingNumber') cmp = a.bookingNumber.localeCompare(b.bookingNumber);
                  else if (bookingsSortKey === 'eventTitle') cmp = (a.eventTitle || '').localeCompare(b.eventTitle || '');
                  else if (bookingsSortKey === 'status') cmp = a.status.localeCompare(b.status);
                  else if (bookingsSortKey === 'total') cmp = a.total - b.total;
                  else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                  return bookingsSortOrder === 'asc' ? cmp : -cmp;
                });
                return (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                        <SortableTh sortKey={bookingsSortKey} thisKey="bookingNumber" sortOrder={bookingsSortOrder} onSort={handleBookingsSort}>Booking #</SortableTh>
                        <SortableTh sortKey={bookingsSortKey} thisKey="eventTitle" sortOrder={bookingsSortOrder} onSort={handleBookingsSort}>Event</SortableTh>
                        <SortableTh sortKey={bookingsSortKey} thisKey="status" sortOrder={bookingsSortOrder} onSort={handleBookingsSort}>Status</SortableTh>
                        <SortableTh sortKey={bookingsSortKey} thisKey="total" sortOrder={bookingsSortOrder} onSort={handleBookingsSort}>Total</SortableTh>
                        <SortableTh sortKey={bookingsSortKey} thisKey="createdAt" sortOrder={bookingsSortOrder} onSort={handleBookingsSort}>Date</SortableTh>
                        <th className="p-2 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedBookings.map((b) => (
                        <tr key={b.id} className="border-b border-[var(--color-border)] last:border-0">
                          <td className="p-2 text-[var(--color-text)]">{b.bookingNumber}</td>
                          <td className="p-2 text-[var(--color-text)]">{b.eventTitle}</td>
                          <td className="p-2"><StatusBadge variant={statusToVariant(b.status)}>{b.status}</StatusBadge></td>
                          <td className="p-2 text-[var(--color-text)]">LKR {b.total.toLocaleString()}</td>
                          <td className="p-2 text-[var(--color-text-muted)]">{new Date(b.createdAt).toLocaleDateString()}</td>
                          <td className="p-2">
                            <Link to={`/admin/events/${b.eventId}`} className="text-[var(--color-primary)] hover:underline text-xs">View event</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {bookingsPagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4 mt-4 border-t border-[var(--color-border)]">
                    <button type="button" onClick={() => setBookingsPage(bookingsPagination.page - 1)} disabled={bookingsPagination.page <= 1 || bookingsLoading} className="p-2 border border-[var(--color-border)] text-[var(--color-text)] disabled:opacity-50 rounded">‹</button>
                    <span className="text-sm text-[var(--color-text-muted)] px-4">Page {bookingsPagination.page} of {bookingsPagination.totalPages}</span>
                    <button type="button" onClick={() => setBookingsPage(bookingsPagination.page + 1)} disabled={bookingsPagination.page >= bookingsPagination.totalPages || bookingsLoading} className="p-2 border border-[var(--color-border)] text-[var(--color-text)] disabled:opacity-50 rounded">›</button>
                  </div>
                )}
              </>
                );
              })()
            )}
          </div>
        </div>

        {/* Events organized */}
        <div className="border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-card)] overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border)]">
            <h2 className="font-header text-xl text-[var(--color-text)]">Events organized</h2>
            <p className="text-sm text-[var(--color-text-muted)]">{eventsPagination.total} total</p>
          </div>
          <div className="p-4">
            {eventsLoading ? (
              <LoadingSpinner message="Loading events…" />
            ) : events.length === 0 ? (
              <p className="text-[var(--color-text-muted)] text-sm">No events organized.</p>
            ) : (
              (() => {
                const handleEventsSort = (key: string) => {
                  if (eventsSortKey === key) setEventsSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
                  else { setEventsSortKey(key); setEventsSortOrder('asc'); }
                };
                const sortedEvents = [...events].sort((a, b) => {
                  let cmp = 0;
                  if (eventsSortKey === 'title') cmp = a.title.localeCompare(b.title);
                  else if (eventsSortKey === 'category') cmp = (a.category?.name ?? '').localeCompare(b.category?.name ?? '');
                  else if (eventsSortKey === 'status') cmp = a.status.localeCompare(b.status);
                  else if (eventsSortKey === 'eventDate') cmp = new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
                  else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                  return eventsSortOrder === 'asc' ? cmp : -cmp;
                });
                return (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                        <SortableTh sortKey={eventsSortKey} thisKey="title" sortOrder={eventsSortOrder} onSort={handleEventsSort}>Title</SortableTh>
                        <SortableTh sortKey={eventsSortKey} thisKey="category" sortOrder={eventsSortOrder} onSort={handleEventsSort}>Category</SortableTh>
                        <SortableTh sortKey={eventsSortKey} thisKey="status" sortOrder={eventsSortOrder} onSort={handleEventsSort}>Status</SortableTh>
                        <SortableTh sortKey={eventsSortKey} thisKey="eventDate" sortOrder={eventsSortOrder} onSort={handleEventsSort}>Event date</SortableTh>
                        <th className="p-2 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedEvents.map((e) => (
                        <tr key={e.id} className="border-b border-[var(--color-border)] last:border-0">
                          <td className="p-2 text-[var(--color-text)] font-medium">{e.title}</td>
                          <td className="p-2 text-[var(--color-text)]">{e.category?.name ?? '—'}</td>
                          <td className="p-2"><StatusBadge variant={statusToVariant(e.status)}>{e.status}</StatusBadge></td>
                          <td className="p-2 text-[var(--color-text-muted)]">{new Date(e.eventDate).toLocaleDateString()}</td>
                          <td className="p-2">
                            <Link to={`/admin/events/${e.id}`} className="text-[var(--color-primary)] hover:underline text-xs">View</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {eventsPagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4 mt-4 border-t border-[var(--color-border)]">
                    <button type="button" onClick={() => setEventsPage(eventsPagination.page - 1)} disabled={eventsPagination.page <= 1 || eventsLoading} className="p-2 border border-[var(--color-border)] text-[var(--color-text)] disabled:opacity-50 rounded">‹</button>
                    <span className="text-sm text-[var(--color-text-muted)] px-4">Page {eventsPagination.page} of {eventsPagination.totalPages}</span>
                    <button type="button" onClick={() => setEventsPage(eventsPagination.page + 1)} disabled={eventsPagination.page >= eventsPagination.totalPages || eventsLoading} className="p-2 border border-[var(--color-border)] text-[var(--color-text)] disabled:opacity-50 rounded">›</button>
                  </div>
                )}
              </>
                );
              })()
            )}
          </div>
        </div>
      </div>
    </>
  );
}
