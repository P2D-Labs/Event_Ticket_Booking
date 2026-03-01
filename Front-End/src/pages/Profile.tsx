import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import api, { uploadImage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import PageContainer, { PageHeading } from '../components/layout/PageContainer';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ImageInput from '../components/event/ImageInput';
import ClickableImage from '../components/ui/ClickableImage';
import ConfirmDialog from '../components/ui/ConfirmDialog';

type Plan = { id: string; name: string; price: string; duration: string };
type Subscription = {
  id: string;
  status: string;
  currentPeriodEnd: string | null;
  plan: Plan;
};

export default function Profile() {
  const [searchParams] = useSearchParams();
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [testimonialContent, setTestimonialContent] = useState('');
  const [testimonialRating, setTestimonialRating] = useState<number | ''>(5);
  const [testimonialSubmitting, setTestimonialSubmitting] = useState(false);
  const [testimonialSent, setTestimonialSent] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('');
  const [profileOrganization, setProfileOrganization] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [pendingAvatarPreviewUrl, setPendingAvatarPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!pendingAvatarFile) {
      setPendingAvatarPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingAvatarFile);
    setPendingAvatarPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingAvatarFile]);
  const [becomeOrgOrganization, setBecomeOrgOrganization] = useState('');
  const [becomeOrgSubmitting, setBecomeOrgSubmitting] = useState(false);
  const [becomeOrgError, setBecomeOrgError] = useState<string | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);

  useEffect(() => {
    api.get('/api/subscription/plans').then((r) => setPlans(r.data.plans || [])).catch(() => setPlans([]));
    if (user) {
      api.get('/api/subscription/me').then((r) => setSubscription(r.data.subscription || null)).catch(() => setSubscription(null)).finally(() => setLoading(false));
      if (success === '1') refreshUser?.();
    } else {
      setLoading(false);
    }
  }, [user, success, refreshUser]);

  useEffect(() => {
    if (success === '1') setMessage('Thank you! You are now a Premium member. No handling fees on your tickets.');
    if (canceled === '1') setMessage('Checkout was canceled.');
  }, [success, canceled]);

  useEffect(() => {
    if (user) {
      setProfileName(user.name ?? '');
      setProfilePhone(user.phone ?? '');
      setProfileAvatarUrl(user.avatarUrl ?? '');
      setProfileOrganization(user.organization ?? '');
    }
  }, [user]);

  const handleSubscribe = async (planId: string) => {
    if (!user) return;
    setSubmitting(planId);
    try {
      const { data } = await api.post('/api/subscription/checkout-session', { planId });
      if (data.url) window.location.href = data.url;
    } catch {
      setMessage('Could not start checkout.');
      setSubmitting(null);
    }
  };

  const handleTestimonialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testimonialContent.trim() || testimonialSubmitting) return;
    setTestimonialSubmitting(true);
    setMessage(null);
    try {
      await api.post('/api/testimonials/submit', {
        content: testimonialContent.trim(),
        rating: testimonialRating === '' ? undefined : Number(testimonialRating),
      });
      setTestimonialSent(true);
      setTestimonialContent('');
      setTestimonialRating(5);
      setMessage('Thank you! Your testimonial will appear on the site after review.');
    } catch {
      setMessage('Could not submit testimonial. Please try again.');
    } finally {
      setTestimonialSubmitting(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setMessage(null);
    try {
      let avatarUrl = profileAvatarUrl.trim() || null;
      if (pendingAvatarFile) {
        avatarUrl = await uploadImage(pendingAvatarFile);
        setProfileAvatarUrl(avatarUrl);
        setPendingAvatarFile(null);
      }
      const { data } = await api.patch('/api/users/me', {
        name: profileName.trim(),
        phone: profilePhone.trim(),
        avatarUrl,
        organization: profileOrganization.trim() || null,
      });
      if (data.user) refreshUser?.();
      setMessage('Profile updated.');
    } catch {
      setMessage('Could not update profile. Please try again.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleBecomeOrganizer = async (e: React.FormEvent) => {
    e.preventDefault();
    setBecomeOrgError(null);
    setBecomeOrgSubmitting(true);
    try {
      const { data } = await api.post('/api/users/me/become-organizer', {
        organization: becomeOrgOrganization.trim() || undefined,
      });
      if (data.user) refreshUser?.();
      setMessage(data.message ?? 'You are now an organizer.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setBecomeOrgError(msg ?? 'Could not switch to organizer. Please try again.');
    } finally {
      setBecomeOrgSubmitting(false);
    }
  };

  const handleCancel = async () => {
    try {
      await api.post('/api/subscription/cancel');
      setMessage('Subscription will cancel at end of period.');
      const { data } = await api.get('/api/subscription/me');
      setSubscription(data.subscription || null);
      refreshUser?.();
      setCancelConfirm(false);
    } catch {
      setMessage('Could not cancel.');
    }
  };

  if (!user) {
    return (
      <PageContainer>
        <p className="text-[var(--color-text-muted)]">
          <Link to="/auth/login" className="text-[var(--color-primary)]">Log in</Link> to view your profile.
        </p>
      </PageContainer>
    );
  }

  return (
    <>
      <Helmet><title>My Profile | NUIT</title></Helmet>
      <PageContainer>
        <PageHeading label="Account" title="My Profile" />

        {/* Profile info – editable */}
        <section className="mb-12 max-w-8xl">
          <h2 className="font-header text-xl text-[var(--color-text)] mb-4">Profile</h2>
          {message && message.includes('Profile updated') && (
            <div className="mb-4 p-4 bg-[var(--color-bg-elevated)] border border-[var(--color-primary)]/30 text-[var(--color-text)]">
              {message}
            </div>
          )}
          <form onSubmit={handleProfileSave} className="border border-[var(--color-border)] p-6 bg-[var(--color-bg-card)] rounded-lg space-y-4">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="shrink-0">
                {(pendingAvatarPreviewUrl || profileAvatarUrl) ? (
                  <ClickableImage src={pendingAvatarPreviewUrl || profileAvatarUrl} alt="Avatar" className="shrink-0">
                    <img src={pendingAvatarPreviewUrl || profileAvatarUrl} alt="" className="w-24 h-24 rounded-full object-cover border-2 border-[var(--color-border)]" />
                  </ClickableImage>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-bg)] font-header text-2xl">
                    {user.name?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-4">
                <ImageInput label="Avatar" value={profileAvatarUrl} onChange={setProfileAvatarUrl} onPendingFileChange={setPendingAvatarFile} placeholder="Avatar image URL or upload" />
                <div>
                  <label htmlFor="profile-name" className="block text-sm text-[var(--color-text-muted)] mb-1">Name</label>
                  <input
                    id="profile-name"
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--color-text-muted)] mb-1">Email</label>
                  <p className="text-[var(--color-text)]">{user.email}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Email cannot be changed here.</p>
                </div>
                <div>
                  <label htmlFor="profile-phone" className="block text-sm text-[var(--color-text-muted)] mb-1">Phone</label>
                  <input
                    id="profile-phone"
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="Phone number"
                    className="w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
                {(user.role === 'ORGANIZER' || user.role === 'SUPER_ADMIN') && (
                  <div>
                    <label htmlFor="profile-organization" className="block text-sm text-[var(--color-text-muted)] mb-1">Organization</label>
                    <input
                      id="profile-organization"
                      type="text"
                      value={profileOrganization}
                      onChange={(e) => setProfileOrganization(e.target.value)}
                      placeholder="Your organization or brand name"
                      className="w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={profileSaving}
                className="bg-[var(--color-primary)] text-[var(--color-bg)] px-6 py-2.5 text-sm font-medium tracking-widest uppercase hover:bg-[var(--color-primary-light)] transition disabled:opacity-50"
              >
                {profileSaving ? 'Saving…' : 'Save profile'}
              </button>
              <p className="text-sm text-[var(--color-text-muted)]">Role: {user.role}{user.isPremium ? ' · Premium' : ''}</p>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                <Link to="/auth/forgot-password" className="text-[var(--color-primary)] hover:underline">Forgot password?</Link> Reset it via email.
              </p>
            </div>
          </form>
          <Link to="/account/bookings" className="inline-block mt-4 text-sm text-[var(--color-primary)] hover:underline">View my bookings →</Link>
        </section>

        {/* Become an organizer – only for customers */}
        {user.role === 'CUSTOMER' && (
          <section className="mb-12 max-w-8xl">
            <h2 className="font-header text-xl text-[var(--color-text)] mb-4">Become an organizer</h2>
            <p className="text-[var(--color-text-muted)] text-sm mb-4">Create and manage your own events. After you become an organizer, you can add events from the Dashboard; they will go live after admin approval.</p>
            {becomeOrgError && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{becomeOrgError}</div>
            )}
            <form onSubmit={handleBecomeOrganizer} className="border border-[var(--color-border)] p-6 bg-[var(--color-bg-card)] rounded-lg space-y-4">
              <div>
                <label htmlFor="become-org-organization" className="block text-sm text-[var(--color-text-muted)] mb-1">Organization name (optional)</label>
                <input
                  id="become-org-organization"
                  type="text"
                  value={becomeOrgOrganization}
                  onChange={(e) => setBecomeOrgOrganization(e.target.value)}
                  placeholder="Your brand or organization"
                  className="w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <button
                type="submit"
                disabled={becomeOrgSubmitting}
                className="bg-[var(--color-primary)] text-[var(--color-bg)] px-6 py-2.5 text-sm font-medium tracking-widest uppercase hover:bg-[var(--color-primary-light)] transition disabled:opacity-50"
              >
                {becomeOrgSubmitting ? 'Upgrading…' : 'Become an organizer'}
              </button>
            </form>
          </section>
        )}

        {/* Leave a testimonial */}
        <section className="mb-12 max-w-8xl">
          <h2 className="font-header text-xl text-[var(--color-text)] mb-4">Leave a testimonial</h2>
          <p className="text-[var(--color-text-muted)] text-sm mb-4">Share your experience with the app. Your testimonial may be shown on the homepage after review.</p>
          {testimonialSent ? (
            <div className="border border-[var(--color-border)] p-4 rounded-lg bg-[var(--color-bg-elevated)]">
              <p className="text-[var(--color-primary)]">Thank you! Your testimonial has been submitted and will appear after review.</p>
              <button type="button" onClick={() => setTestimonialSent(false)} className="mt-3 text-sm text-[var(--color-primary)] hover:underline">Submit another</button>
            </div>
          ) : (
            <form onSubmit={handleTestimonialSubmit} className="border border-[var(--color-border)] p-6 bg-[var(--color-bg-card)] rounded-lg space-y-4">
              <div>
                <label htmlFor="testimonial-content" className="block text-sm text-[var(--color-text-muted)] mb-1">Your message</label>
                <textarea
                  id="testimonial-content"
                  value={testimonialContent}
                  onChange={(e) => setTestimonialContent(e.target.value)}
                  placeholder="What did you like about the app?"
                  rows={4}
                  className="w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  required
                  maxLength={2000}
                />
                <p className="text-xs text-[var(--color-text-muted)] mt-1">{testimonialContent.length}/2000</p>
              </div>
              <div>
                <label className="block text-sm text-[var(--color-text-muted)] mb-1">Rating (optional)</label>
                <select
                  value={testimonialRating}
                  onChange={(e) => setTestimonialRating(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full max-w-[120px] px-3 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>{n} star{n !== 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={!testimonialContent.trim() || testimonialSubmitting}
                className="bg-[var(--color-primary)] text-[var(--color-bg)] px-6 py-2.5 text-sm font-medium tracking-widest uppercase hover:bg-[var(--color-primary-light)] transition disabled:opacity-50"
              >
                {testimonialSubmitting ? 'Sending…' : 'Submit testimonial'}
              </button>
            </form>
          )}
        </section>

        {/* Premium (inside profile) */}
        <section id="premium" className="max-w-8xl">
          <h2 className="font-header text-xl text-[var(--color-text)] mb-2">Premium</h2>
          <p className="text-[var(--color-text-muted)] text-sm mb-6">No handling fees on every ticket. Subscribe and save.</p>

          {message && (
            <div className="mb-6 p-4 bg-[var(--color-bg-elevated)] border border-[var(--color-primary)]/30 text-[var(--color-text)]">
              {message}
            </div>
          )}

          {subscription && (
            <div className="mb-8 p-6 border border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
              <p className="text-[9px] tracking-widest uppercase text-[var(--color-primary)] mb-1">Current plan</p>
              <p className="font-medium text-[var(--color-text)]">{subscription.plan.name}</p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Renews {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : '—'}
              </p>
              <button type="button" onClick={() => setCancelConfirm(true)} className="mt-3 text-sm text-red-400 hover:underline">
                Cancel at period end
              </button>
            </div>
          )}

          {loading ? (
            <LoadingSpinner message="Loading plans…" />
          ) : plans.length === 0 ? (
            <p className="text-[var(--color-text-muted)]">No plans available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plans.map((plan) => (
                <div key={plan.id} className="border border-[var(--color-border)] p-6 bg-[var(--color-bg-elevated)]">
                  <p className="font-header text-xl text-[var(--color-text)]">{plan.name}</p>
                  <p className="text-2xl font-accent text-[var(--color-primary)] mt-2">LKR {Number(plan.price).toLocaleString()}<span className="text-sm text-[var(--color-text-muted)]">/{plan.duration === 'YEARLY' ? 'year' : 'month'}</span></p>
                  <p className="text-sm text-[var(--color-text-muted)] mt-2">No handling fees on all bookings</p>
                  <button
                    type="button"
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={!!subscription || submitting !== null}
                    className="mt-4 w-full bg-[var(--color-primary)] text-[var(--color-bg)] py-3 text-sm font-medium tracking-widest uppercase hover:bg-[var(--color-primary-light)] transition disabled:opacity-50"
                  >
                    {submitting === plan.id ? 'Redirecting…' : subscription ? 'Current plan' : 'Subscribe'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </PageContainer>
      <ConfirmDialog open={cancelConfirm} onClose={() => setCancelConfirm(false)} onConfirm={handleCancel} title="Cancel subscription" message="Cancel at end of billing period? You will keep Premium until then." confirmLabel="Cancel subscription" variant="danger" />
    </>
  );
}
