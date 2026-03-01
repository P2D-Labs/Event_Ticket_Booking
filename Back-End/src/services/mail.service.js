import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || 'noreply@eventbooking.lk';
  if (!host || !user || !pass) {
    console.warn('Mail: SMTP_HOST/SMTP_USER/SMTP_PASS not set. Emails will be logged only.');
    return null;
  }
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

/**
 * Send an email. If SMTP is not configured, logs and resolves (no throw).
 */
export async function sendMail({ to, subject, text, html }) {
  const trans = getTransporter();
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || 'noreply@eventbooking.lk';
  const payload = { from, to, subject, text: text || undefined, html: html || undefined };
  if (!trans) {
    console.log('[Mail] Would send:', { to, subject, text: (text || html || '').slice(0, 80) });
    return;
  }
  try {
    await trans.sendMail(payload);
  } catch (e) {
    console.error('[Mail] Send failed:', e.message);
  }
}

const contactTo = process.env.CONTACT_EMAIL || process.env.SMTP_USER || 'hello@eventbooking.lk';

export async function sendContactForm({ name, email, subject, message }) {
  const body = `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}`;
  await sendMail({
    to: contactTo,
    subject: `[Contact] ${subject}`,
    text: body,
    html: `<p><strong>From:</strong> ${name} &lt;${email}&gt;</p><p><strong>Subject:</strong> ${subject}</p><hr><pre>${message.replace(/</g, '&lt;')}</pre>`,
  });
}

export async function sendEventApprovedToOrganizer(event) {
  const organizer = event.organizer;
  if (!organizer?.email) return;
  const eventTitle = event.title || 'Your event';
  await sendMail({
    to: organizer.email,
    subject: `Event approved: ${eventTitle}`,
    text: `Your event "${eventTitle}" has been approved and is now visible on the platform.`,
    html: `<p>Your event <strong>${eventTitle}</strong> has been approved and is now visible on the platform.</p>`,
  });
}

export async function sendEventRejectedToOrganizer(event, rejectedReason) {
  const organizer = event.organizer;
  if (!organizer?.email) return;
  const eventTitle = event.title || 'Your event';
  const reason = rejectedReason ? ` Reason: ${rejectedReason}` : '';
  await sendMail({
    to: organizer.email,
    subject: `Event not approved: ${eventTitle}`,
    text: `Your event "${eventTitle}" was not approved.${reason}`,
    html: `<p>Your event <strong>${eventTitle}</strong> was not approved.${reason ? ` <em>${reason}</em>` : ''}</p>`,
  });
}

export async function sendRegistrationOtp({ to, otp }) {
  const text = `Your verification code is: ${otp}\n\nIt is valid for 24 hours. Enter this code to complete your registration.`;
  const html = `<p>Your verification code is: <strong>${otp}</strong></p><p>It is valid for 24 hours. Enter this code to complete your registration.</p>`;
  await sendMail({
    to,
    subject: 'Verify your email – NUIT',
    text,
    html,
  });
}

export async function sendPasswordResetLink({ to, resetLink }) {
  const text = `You requested a password reset. Click the link below to set a new password:\n\n${resetLink}\n\nThis link is valid for 24 hours. If you did not request this, ignore this email.`;
  const html = `<p>You requested a password reset. <a href="${resetLink}">Click here to set a new password</a>.</p><p>This link is valid for 24 hours. If you did not request this, ignore this email.</p>`;
  await sendMail({
    to,
    subject: 'Reset your password – NUIT',
    text,
    html,
  });
}

export async function sendBookingConfirmationToCustomer(booking) {
  const email = booking.guestEmail || (booking.user && booking.user.email);
  if (!email) return;
  const event = booking.event;
  if (!event) return;
  const eventTitle = event?.title || 'Event';
  const eventDate = event?.eventDate ? new Date(event.eventDate).toLocaleString('en-GB') : '';
  const total = Number(booking.total).toLocaleString();
  const items = (booking.items || [])
    .map((i) => `- ${i.ticketType?.name || 'Ticket'}: ${i.quantity} x LKR ${Number(i.unitPrice).toLocaleString()} = LKR ${Number(i.total).toLocaleString()}`)
    .join('\n');
  const text = `Your booking is confirmed.\n\nBooking number: ${booking.bookingNumber}\nEvent: ${eventTitle}\nDate: ${eventDate}\n\nTickets:\n${items}\nTotal: LKR ${total}`;
  await sendMail({
    to: email,
    subject: `Booking confirmed: ${booking.bookingNumber} – ${eventTitle}`,
    text,
    html: `<p>Your booking is confirmed.</p><p><strong>Booking number:</strong> ${booking.bookingNumber}</p><p><strong>Event:</strong> ${eventTitle}</p><p><strong>Date:</strong> ${eventDate}</p><p><strong>Total:</strong> LKR ${total}</p>`,
  });
}
