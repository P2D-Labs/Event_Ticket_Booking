import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import EventForm, { initialEventFormState, type EventFormState } from '../../components/event/EventForm';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import BackLink from '../../components/ui/BackLink';
import { SITE_MAX_WIDTH, SITE_PADDING_X } from '../../lib/layout';

type Category = { id: string; name: string; slug: string };
type Event = {
  id: string;
  title: string;
  description: string;
  location: string;
  venue?: string | null;
  eventDate: string;
  eventTime?: string | null;
  bookingOpensAt?: string | null;
  coverImage: string;
  seatingImage?: string | null;
  status: string;
  categoryId?: string | null;
  category?: { id: string; name: string; slug: string } | null;
  ticketTypes: { id: string; name: string; price: string; quantity: number; soldCount: number }[];
  eventPaymentMethods?: { paymentMethod: string; enabled: boolean }[];
};

function eventToForm(e: Event, availablePaymentMethods: string[]): EventFormState {
  const d = new Date(e.eventDate);
  const eventDate = d.toISOString().slice(0, 10);
  const bookingOpensAt = e.bookingOpensAt
    ? new Date(e.bookingOpensAt).toISOString().slice(0, 16)
    : '';
  const paymentMethods = e.eventPaymentMethods?.length
    ? e.eventPaymentMethods.filter((ep) => ep.enabled).map((ep) => ep.paymentMethod)
    : availablePaymentMethods;
  return {
    title: e.title,
    description: e.description,
    location: e.location,
    venue: e.venue ?? '',
    eventDate,
    eventTime: e.eventTime ?? '',
    bookingOpensAt,
    coverImage: e.coverImage,
    seatingImage: e.seatingImage ?? '',
    categoryId: e.categoryId ?? e.category?.id ?? '',
    ticketTypes: e.ticketTypes.length
      ? e.ticketTypes.map((t) => ({ name: t.name, price: String(t.price), quantity: String(t.quantity) }))
      : [{ name: '', price: '', quantity: '' }],
    paymentMethods: paymentMethods.length ? paymentMethods : availablePaymentMethods,
  };
}

export default function DashboardEventEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<string[]>([]);
  const [form, setForm] = useState<EventFormState>(initialEventFormState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const isAdmin = user?.role === 'SUPER_ADMIN';
    const url = isAdmin ? `/api/events/admin/events/${id}` : `/api/events/organizer/${id}`;
    Promise.all([
      api.get(url).then((r) => r.data.event),
      api.get('/api/public/categories').then((r) => r.data.categories || []),
      api.get('/api/public/payment-methods').then((r) => r.data.paymentMethods || []),
    ]).then(([ev, cats, methods]) => {
      setEvent(ev);
      setCategories(cats);
      setAvailablePaymentMethods(methods);
      if (ev) setForm(eventToForm(ev, methods));
    }).catch(() => setEvent(null)).finally(() => setLoading(false));
  }, [id, user?.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !event) return;
    setError('');
    const ticketTypes = form.ticketTypes
      .map((t) => ({ name: t.name.trim(), price: Number(t.price) || 0, quantity: Number(t.quantity) || 0 }))
      .filter((t) => t.name && t.price > 0 && t.quantity > 0);
    if (ticketTypes.length === 0) {
      setError('Add at least one ticket type.');
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/api/events/${id}`, {
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        venue: form.venue.trim() || undefined,
        eventDate: form.eventDate,
        eventTime: form.eventTime.trim() || undefined,
        bookingOpensAt: form.bookingOpensAt.trim() ? form.bookingOpensAt.trim() : null,
        coverImage: form.coverImage.trim(),
        seatingImage: form.seatingImage.trim() || undefined,
        categoryId: form.categoryId || null,
        ticketTypes,
        paymentMethods: form.paymentMethods?.length ? form.paymentMethods : undefined,
      });
      navigate(`/dashboard/events/${id}`, { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen message="Loading…" />;
  if (!event) return <div className="p-6 text-[var(--color-text-muted)]">Event not found. <BackLink to="/dashboard/my-events">My Events</BackLink></div>;

  const canEdit = user?.role === 'SUPER_ADMIN' || (user?.role === 'ORGANIZER' && event.status === 'PENDING');
  if (!canEdit) return <div className="p-6 text-[var(--color-text-muted)]">You cannot edit this event. <Link to={`/dashboard/events/${id}`} className="text-[var(--color-primary)]">View event</Link></div>;

  return (
    <>
      <Helmet><title>Edit {event.title} | Dashboard | NUIT</title></Helmet>
      <div className={`w-full ${SITE_MAX_WIDTH} ${SITE_PADDING_X} mx-auto max-w-8xl`}>
        <BackLink to={`/dashboard/events/${id}`} className="inline-block mb-6">Back to event</BackLink>
        <h1 className="font-header text-2xl text-[var(--color-text)] mb-6">Edit event</h1>
        <EventForm form={form} setForm={setForm} categories={categories} availablePaymentMethods={availablePaymentMethods} loading={saving} error={error} onSubmit={handleSubmit} cancelTo={`/dashboard/events/${id}`} submitLabel="Save changes" />
      </div>
    </>
  );
}
