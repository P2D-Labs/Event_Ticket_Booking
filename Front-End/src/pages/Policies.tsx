import { Helmet } from 'react-helmet-async';
import SEO from '../components/SEO';
import PageContainer, { PageHeading } from '../components/layout/PageContainer';

export default function Policies() {
  return (
    <>
      <SEO title="Policies" description="Terms of service, privacy, and refund policy for NUIT." ogUrl="/policies" />
      <Helmet><title>Policies | NUIT</title></Helmet>
      <PageContainer>
        <PageHeading label="Legal" title="Policies" intro="Terms of service, privacy, and refund policy." />
        <section className="mb-10 md:mb-14 space-y-8 max-w-8xl">
          <article aria-labelledby="terms-heading">
            <h2 id="terms-heading" className="font-header text-xl text-[var(--color-text)] mb-4">Terms of Service</h2>
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
              By using NUIT you agree to use the platform for lawful purposes only. Event listings are provided by organizers; we do not guarantee availability or accuracy of third-party content. You must be of legal age to purchase tickets where required.
            </p>
          </article>
          <article aria-labelledby="privacy-heading">
            <h2 id="privacy-heading" className="font-header text-xl text-[var(--color-text)] mb-4">Privacy</h2>
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
              We collect and process data necessary to provide booking services, process payments, and communicate with you. We do not sell your personal data. For details on data we collect and how we use it, contact us at hello@eventbooking.lk.
            </p>
          </article>
          <article aria-labelledby="refunds-heading">
            <h2 id="refunds-heading" className="font-header text-xl text-[var(--color-text)] mb-4">Refunds & Cancellations</h2>
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
              Refund eligibility depends on the event and organizer policy. Cancelled events are typically refunded. For other cases, contact support with your booking number. Handling fees may be non-refundable.
            </p>
          </article>
        </section>
      </PageContainer>
    </>
  );
}
