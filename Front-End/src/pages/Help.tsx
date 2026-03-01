import { Helmet } from 'react-helmet-async';
import SEO from '../components/SEO';
import PageContainer, { PageHeading } from '../components/layout/PageContainer';

export default function Help() {
  return (
    <>
      <SEO title="Help" description="FAQs and support for NUIT event booking." ogUrl="/help" />
      <Helmet><title>Help | NUIT</title></Helmet>
      <PageContainer>
        <PageHeading label="Support" title="Help" intro="Frequently asked questions and how to get support with your bookings." />
        <section className="mb-10 md:mb-14" aria-labelledby="faq">
          <h2 id="faq" className="font-header text-xl text-[var(--color-text)] mb-6">FAQs</h2>
          <dl className="space-y-6 max-w-8xl">
            <div>
              <dt className="font-medium text-[var(--color-text)] mb-1">How do I book tickets?</dt>
              <dd className="text-sm text-[var(--color-text-muted)]">Browse events, select your tickets, and complete checkout. You’ll receive a confirmation email with your booking number.</dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--color-text)] mb-1">Can I cancel or get a refund?</dt>
              <dd className="text-sm text-[var(--color-text-muted)]">Refund policy depends on the event. Contact us with your booking number for assistance.</dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--color-text)] mb-1">I didn’t receive my confirmation. What should I do?</dt>
              <dd className="text-sm text-[var(--color-text-muted)]">Check your spam folder. You can also view your bookings in My Bookings when logged in, or contact support with your email.</dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--color-text)] mb-1">How do I become an organizer?</dt>
              <dd className="text-sm text-[var(--color-text-muted)]">Register with an organizer account. After approval, you can create and manage events from your dashboard.</dd>
            </div>
          </dl>
        </section>
        <section className="mb-10 md:mb-14" aria-labelledby="contact">
          <h2 id="contact" className="font-header text-xl text-[var(--color-text)] mb-6">Still need help?</h2>
          <p className="text-[var(--color-text-muted)] mb-4">Reach out for booking support or general enquiries.</p>
          <a href="mailto:support@eventbooking.lk" className="text-[var(--color-primary)] font-medium hover:underline">support@eventbooking.lk</a>
          <p className="mt-4"><a href="/contact" className="text-[var(--color-primary)] hover:underline">Contact page →</a></p>
        </section>
      </PageContainer>
    </>
  );
}
