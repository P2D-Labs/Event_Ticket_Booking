import { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconAdd } from '../icons/PanelIcons';
import { uploadImage } from '../../api/client';
import ImageInput from './ImageInput';

const emptyTicket = { name: '', price: '', quantity: '' };

export type EventFormState = {
  title: string;
  description: string;
  location: string;
  venue: string;
  eventDate: string;
  eventTime: string;
  bookingOpensAt: string;
  coverImage: string;
  seatingImage: string;
  categoryId: string;
  ticketTypes: { name: string; price: string; quantity: string }[];
  paymentMethods: string[];
};

export const initialEventFormState: EventFormState = {
  title: '',
  description: '',
  location: '',
  venue: '',
  eventDate: '',
  eventTime: '',
  bookingOpensAt: '',
  coverImage: '',
  seatingImage: '',
  categoryId: '',
  ticketTypes: [{ ...emptyTicket }],
  paymentMethods: [],
};

type Organizer = { id: string; name: string; email: string; role: string };
type Category = { id: string; name: string; slug: string };

const PAYMENT_LABELS: Record<string, string> = { STRIPE: 'Stripe (card)', KOKO: 'Koko', MINTPAY: 'MintPay', ON_ENTRY: 'Pay on entry' };

type Props = {
  form: EventFormState;
  setForm: React.Dispatch<React.SetStateAction<EventFormState>>;
  categories: Category[];
  availablePaymentMethods?: string[];
  showOrganizerDropdown?: boolean;
  organizers?: Organizer[];
  organizerId?: string;
  setOrganizerId?: (id: string) => void;
  currentUser?: { id: string; name: string } | null;
  loading: boolean;
  error: string;
  onSubmit: (e: React.FormEvent, formState?: EventFormState) => void;
  cancelTo: string;
  submitLabel?: string;
};

export default function EventForm({
  form,
  setForm,
  categories,
  showOrganizerDropdown = false,
  organizers = [],
  organizerId = '',
  setOrganizerId,
  currentUser,
  loading,
  error,
  onSubmit,
  cancelTo,
  submitLabel = 'Create event',
  availablePaymentMethods = [],
}: Props) {
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [pendingSeatingFile, setPendingSeatingFile] = useState<File | null>(null);

  const addTicketType = () => {
    setForm((f) => ({ ...f, ticketTypes: [...f.ticketTypes, { ...emptyTicket }] }));
  };

  const updateTicket = (index: number, field: string, value: string | number) => {
    setForm((f) => ({
      ...f,
      ticketTypes: f.ticketTypes.map((t, i) =>
        i === index ? { ...t, [field]: value } : t
      ),
    }));
  };

  const removeTicket = (index: number) => {
    if (form.ticketTypes.length <= 1) return;
    setForm((f) => ({ ...f, ticketTypes: f.ticketTypes.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let coverUrl = form.coverImage;
    let seatingUrl = form.seatingImage;
    try {
      if (pendingCoverFile) {
        coverUrl = await uploadImage(pendingCoverFile);
        setForm((f) => ({ ...f, coverImage: coverUrl }));
        setPendingCoverFile(null);
      }
      if (pendingSeatingFile) {
        seatingUrl = await uploadImage(pendingSeatingFile);
        setForm((f) => ({ ...f, seatingImage: seatingUrl }));
        setPendingSeatingFile(null);
      }
    } catch {
      return;
    }
    const finalForm: EventFormState = { ...form, coverImage: coverUrl, seatingImage: seatingUrl };
    onSubmit(e, finalForm);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-sm text-red-400">{error}</p>}

      {showOrganizerDropdown && organizers.length > 0 && setOrganizerId && currentUser && (
        <div>
          <label className="block text-xs text-[var(--color-text-muted)] mb-1">Organizer</label>
          <select
            value={organizerId}
            onChange={(e) => setOrganizerId(e.target.value)}
            className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded text-sm"
          >
            <option value={currentUser.id}>Me ({currentUser.name})</option>
            {organizers.filter((o) => o.id !== currentUser.id).map((o) => (
              <option key={o.id} value={o.id}>{o.name} ({o.email})</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-xs text-[var(--color-text-muted)] mb-1">Title *</label>
        <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded" placeholder="Event title" />
      </div>
      <div>
        <label className="block text-xs text-[var(--color-text-muted)] mb-1">Description *</label>
        <textarea required rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded" placeholder="Event description" />
      </div>
      <div>
        <label className="block text-xs text-[var(--color-text-muted)] mb-1">Location *</label>
        <input required value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded" placeholder="Venue address or place" />
      </div>
      <div>
        <label className="block text-xs text-[var(--color-text-muted)] mb-1">Venue name (optional)</label>
        <input value={form.venue} onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded" placeholder="e.g. Main Hall" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-[var(--color-text-muted)] mb-1">Event date *</label>
          <input required type="date" value={form.eventDate} onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded" />
        </div>
        <div>
          <label className="block text-xs text-[var(--color-text-muted)] mb-1">Event time (optional)</label>
          <input type="time" value={form.eventTime} onChange={(e) => setForm((f) => ({ ...f, eventTime: e.target.value }))} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-[var(--color-text-muted)] mb-1">Booking opens at (optional)</label>
        <input
          type="datetime-local"
          value={form.bookingOpensAt}
          onChange={(e) => setForm((f) => ({ ...f, bookingOpensAt: e.target.value }))}
          className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded"
          placeholder="Leave empty to allow booking immediately"
        />
        <p className="text-xs text-[var(--color-text-muted)] mt-1">If set to a future date, the event will appear in &quot;Coming soon&quot; and tickets cannot be booked until this date.</p>
      </div>

      <ImageInput
        label="Cover image"
        value={form.coverImage}
        onChange={(url) => setForm((f) => ({ ...f, coverImage: url }))}
        onPendingFileChange={setPendingCoverFile}
        required
        placeholder="https://... or drag & drop"
      />
      <ImageInput
        label="Seating / ticket positions image (optional)"
        value={form.seatingImage}
        onChange={(url) => setForm((f) => ({ ...f, seatingImage: url }))}
        onPendingFileChange={setPendingSeatingFile}
        placeholder="https://... or drag & drop"
      />

      <div>
        <label className="block text-xs text-[var(--color-text-muted)] mb-1">Category (optional)</label>
        <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded">
          <option value="">—</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {availablePaymentMethods.length > 0 && (
        <div>
          <label className="block text-xs text-[var(--color-text-muted)] mb-2">Payment methods for this event</label>
          <p className="text-xs text-[var(--color-text-muted)] mb-2">Select which payment options customers can use. Only admin-enabled methods are listed.</p>
          <div className="flex flex-wrap gap-4">
            {availablePaymentMethods.map((method) => (
              <label key={method} className="flex items-center gap-2 text-[var(--color-text)]">
                <input
                  type="checkbox"
                  checked={form.paymentMethods.includes(method)}
                  onChange={(e) => setForm((f) => ({
                    ...f,
                    paymentMethods: e.target.checked ? [...f.paymentMethods, method] : f.paymentMethods.filter((m) => m !== method),
                  }))}
                  className="rounded"
                />
                <span>{PAYMENT_LABELS[method] || method}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-[var(--color-text-muted)]">Ticket types *</label>
          <button type="button" onClick={addTicketType} className="text-sm text-[var(--color-primary)] hover:underline flex items-center gap-1">
            <IconAdd /> Add type
          </button>
        </div>
        <div className="space-y-3">
          {form.ticketTypes.map((t, i) => (
            <div key={i} className="flex flex-wrap gap-2 items-center p-3 border border-[var(--color-border)] rounded bg-[var(--color-bg-elevated)]">
              <input placeholder="Name" value={t.name} onChange={(e) => updateTicket(i, 'name', e.target.value)} className="flex-1 min-w-[100px] bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-3 py-2 rounded text-sm" />
              <input type="number" min="0" step="0.01" placeholder="Price (LKR)" value={t.price} onChange={(e) => updateTicket(i, 'price', e.target.value)} className="w-28 bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-3 py-2 rounded text-sm" />
              <input type="number" min="1" placeholder="Qty" value={t.quantity} onChange={(e) => updateTicket(i, 'quantity', e.target.value)} className="w-20 bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-3 py-2 rounded text-sm" />
              <button type="button" onClick={() => removeTicket(i)} className="text-sm text-red-400 hover:underline" disabled={form.ticketTypes.length <= 1}>Remove</button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="bg-[var(--color-primary)] text-[var(--color-bg)] px-6 py-2.5 text-sm font-medium rounded hover:bg-[var(--color-primary-light)] disabled:opacity-50">
          {loading ? 'Creating…' : submitLabel}
        </button>
        <Link to={cancelTo} className="border border-[var(--color-border)] text-[var(--color-text)] px-6 py-2.5 text-sm rounded hover:bg-[var(--color-bg-elevated)] inline-block">
          Cancel
        </Link>
      </div>
    </form>
  );
}
