import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import SEO from '../components/SEO';
import PageContainer, { PageHeading } from '../components/layout/PageContainer';
import api from '../api/client';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/api/contact', { name, email, subject: subject || 'Contact form', message });
      setSent(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to send. Try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Contact" description="Get in touch with NUIT. Event booking support and enquiries." ogUrl="/contact" />
      <Helmet><title>Contact | NUIT</title></Helmet>
      <PageContainer>
        <PageHeading label="Get in touch" title="Contact" intro="Have a question about an event or need support with your booking? Use the form below or reach us by email." />
        <section className="mb-10 md:mb-14" aria-labelledby="contact-options">
          <h2 id="contact-options" className="font-header text-xl text-[var(--color-text)] mb-6">Ways to reach us</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-8xl mb-12">
            <div className="border border-[var(--color-border)] p-6 bg-[var(--color-bg-card)] rounded-lg">
              <p className="text-[9px] tracking-widest uppercase text-[var(--color-primary)] mb-2">General enquiries</p>
              <a href="mailto:hello@eventbooking.lk" className="text-[var(--color-text)] hover:text-[var(--color-primary)] font-medium">
                hello@eventbooking.lk
              </a>
              <p className="text-sm text-[var(--color-text-muted)] mt-2">For event listings, partnerships, and general questions.</p>
            </div>
            <div className="border border-[var(--color-border)] p-6 bg-[var(--color-bg-card)] rounded-lg">
              <p className="text-[9px] tracking-widest uppercase text-[var(--color-primary)] mb-2">Booking support</p>
              <a href="mailto:support@eventbooking.lk" className="text-[var(--color-text)] hover:text-[var(--color-primary)] font-medium">
                support@eventbooking.lk
              </a>
              <p className="text-sm text-[var(--color-text-muted)] mt-2">Help with existing bookings, refunds, and technical issues.</p>
            </div>
          </div>

          <h2 className="font-header text-xl text-[var(--color-text)] mb-4">Send a message</h2>
          {sent ? (
            <div className="p-6 border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 rounded-lg text-[var(--color-text)] max-w-8xl">
              <p className="font-medium text-[var(--color-primary)]">Message sent.</p>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">We will get back to you as soon as we can.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-8xl space-y-4">
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div>
                <label htmlFor="contact-name" className="block text-xs text-[var(--color-text-muted)] mb-1">Name *</label>
                <input id="contact-name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded text-sm" placeholder="Your name" />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-xs text-[var(--color-text-muted)] mb-1">Email *</label>
                <input id="contact-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded text-sm" placeholder="your@email.com" />
              </div>
              <div>
                <label htmlFor="contact-subject" className="block text-xs text-[var(--color-text-muted)] mb-1">Subject</label>
                <input id="contact-subject" type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded text-sm" placeholder="What is this about?" />
              </div>
              <div>
                <label htmlFor="contact-message" className="block text-xs text-[var(--color-text-muted)] mb-1">Message *</label>
                <textarea id="contact-message" required rows={5} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded text-sm resize-y" placeholder="Your message..." />
              </div>
              <button type="submit" disabled={loading} className="bg-[var(--color-primary)] text-[var(--color-bg)] px-6 py-2.5 text-sm font-medium rounded hover:bg-[var(--color-primary-light)] disabled:opacity-50">
                {loading ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}
        </section>
      </PageContainer>
    </>
  );
}
