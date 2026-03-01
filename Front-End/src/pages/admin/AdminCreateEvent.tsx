import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import EventForm, { initialEventFormState, type EventFormState } from '../../components/event/EventForm';
import { SITE_MAX_WIDTH, SITE_PADDING_X } from '../../lib/layout';

type Category = { id: string; name: string; slug: string };
type Organizer = { id: string; name: string; email: string; role: string };

export default function AdminCreateEvent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [organizerId, setOrganizerId] = useState('');
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<string[]>([]);
  const [form, setForm] = useState<EventFormState>(initialEventFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/public/categories').then((r) => setCategories(r.data.categories || [])).catch(() => []);
    api.get('/api/organizers').then((r) => {
      setOrganizers(r.data.organizers || []);
      if (user?.id) setOrganizerId(user.id);
    }).catch(() => []);
    api.get('/api/public/payment-methods').then((r) => {
      const methods = r.data.paymentMethods || [];
      setAvailablePaymentMethods(methods);
      setForm((f) => ({ ...f, paymentMethods: methods }));
    }).catch(() => {});
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent, formState?: EventFormState) => {
    e.preventDefault();
    setError('');
    const state = formState ?? form;
    const ticketTypes = state.ticketTypes
      .map((t) => ({
        name: t.name.trim(),
        price: Number(t.price) || 0,
        quantity: Number(t.quantity) || 0,
      }))
      .filter((t) => t.name && t.price > 0 && t.quantity > 0);
    if (ticketTypes.length === 0) {
      setError('Add at least one ticket type with name, price, and quantity.');
      return;
    }
    if (!state.title.trim() || !state.description.trim() || !state.location.trim() || !state.coverImage.trim() || !state.eventDate) {
      setError('Title, description, location, cover image, and event date are required.');
      return;
    }
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
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
      };
      if (organizerId) payload.organizerId = organizerId;
      if (state.paymentMethods?.length) payload.paymentMethods = state.paymentMethods;
      await api.post('/api/events', payload);
      navigate('/admin/events', { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>Create event | Admin | NUIT</title></Helmet>
      <div className={`w-full ${SITE_MAX_WIDTH} ${SITE_PADDING_X} mx-auto max-w-8xl`}>
        <h1 className="font-header text-2xl text-[var(--color-text)] mb-6">Create event</h1>
        <EventForm
          form={form}
          setForm={setForm}
          categories={categories}
          availablePaymentMethods={availablePaymentMethods}
          showOrganizerDropdown
          organizers={organizers}
          organizerId={organizerId}
          setOrganizerId={setOrganizerId}
          currentUser={user ? { id: user.id, name: user.name ?? '' } : null}
          loading={loading}
          error={error}
          onSubmit={handleSubmit}
          cancelTo="/admin/events"
        />
      </div>
    </>
  );
}
