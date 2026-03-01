import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../../api/client';
import EventForm, { initialEventFormState, type EventFormState } from '../../components/event/EventForm';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import BackLink from '../../components/ui/BackLink';

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
  const bookingOpensAt = e.bookingOpensAt ? new Date(e.bookingOpensAt).toISOString().slice(0, 16) : '';
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
    ticketTypes: e.ticketTypes.length ? e.ticketTypes.map((t) => ({ name: t.name, price: String(t.price), quantity: String(t.quantity) })) : [{ name: '', price: '', quantity: '' }],
    paymentMethods: paymentMethods.length ? paymentMethods : availablePaymentMethods,
  };
}

export default function AdminEventEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<string[]>([]);
  const [form, setForm] = useState<EventFormState>(initialEventFormState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(`/api/events/admin/events/${id}`).then((r) => r.data.event),
      api.get('/api/public/categories').then((r) => r.data.categories || []),
      api.get('/api/public/payment-methods').then((r) => r.data.paymentMethods || []),
    ]).then(([ev, cats, methods]) => {
      setEvent(ev);
      setCategories(cats);
      setAvailablePaymentMethods(methods);
      if (ev) setForm(eventToForm(ev, methods));
    }).catch(() => setEvent(null)).finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent, formState?: EventFormState) => {
    e.preventDefault();
    if (!id || !event) return;
    setError('');
    const state = formState ?? form;
    const ticketTypes = state.ticketTypes
      .map((t) => ({ name: t.name.trim(), price: Number(t.price) || 0, quantity: Number(t.quantity) || 0 }))
      .filter((t) => t.name && t.price > 0 && t.quantity > 0);
    if (ticketTypes.length === 0) {
      setError('Add at least one ticket type.');
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/api/events/${id}`, {
        title: state.title.trim(),
        description: state.description.trim(),
        location: state.location.trim(),
        venue: state.venue.trim() || undefined,
        eventDate: state.eventDate,
        eventTime: state.eventTime.trim() || undefined,
        bookingOpensAt: state.bookingOpensAt.trim() ? state.bookingOpensAt.trim() : null,
        coverImage: state.coverImage.trim(),
        seatingImage: state.seatingImage.trim() || undefined,
        categoryId: state.categoryId || null,
        ticketTypes,
        paymentMethods: state.paymentMethods?.length ? state.paymentMethods : undefined,
      });
      navigate(`/admin/events/${id}`, { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen message="Loading…" />;
  if (!event) return <div className="p-6 text-[var(--color-text-muted)]">Event not found. <BackLink to="/admin/events">Events</BackLink></div>;

  return (
    <>
      <Helmet><title>Edit {event.title} | Admin | NUIT</title></Helmet>
      <div className="max-w-8xl">
        <BackLink to={`/admin/events/${id}`} className="inline-block mb-6">Back to event</BackLink>
        <h1 className="font-header text-2xl text-[var(--color-text)] mb-6">Edit event</h1>
        <EventForm form={form} setForm={setForm} categories={categories} availablePaymentMethods={availablePaymentMethods} loading={saving} error={error} onSubmit={handleSubmit} cancelTo={`/admin/events/${id}`} submitLabel="Save changes" />
      </div>
    </>
  );
}
