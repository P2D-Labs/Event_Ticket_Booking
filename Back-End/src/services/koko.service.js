/**
 * Koko BNPL integration (Sri Lanka).
 * Stub: replace with real API when credentials and docs are available.
 * Expected: create order → return redirect URL for customer to complete payment.
 */

export async function createOrder(bookingId, amountLkr, metadata = {}) {
  const apiUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;
  const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';

  // Stub: real implementation would POST to Koko API and get checkout URL
  if (process.env.KOKO_CHECKOUT_URL) {
    return { redirectUrl: process.env.KOKO_CHECKOUT_URL.replace('{bookingId}', bookingId).replace('{amount}', amountLkr), reference: `EB-${bookingId}` };
  }

  // Dev stub: redirect to our callback so booking gets confirmed, then user is sent to success page
  const redirectUrl = `${apiUrl}/api/checkout/koko/callback?bookingId=${encodeURIComponent(bookingId)}&status=success`;
  return { redirectUrl, reference: `EB-${bookingId}` };
}
