/**
 * MintPay BNPL integration (Sri Lanka).
 * Stub: replace with real API when credentials and docs are available.
 */

export async function createOrder(bookingId, amountLkr, metadata = {}) {
  const apiUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;

  if (process.env.MINTPAY_CHECKOUT_URL) {
    return { redirectUrl: process.env.MINTPAY_CHECKOUT_URL.replace('{bookingId}', bookingId).replace('{amount}', amountLkr), reference: `EB-${bookingId}` };
  }

  const redirectUrl = `${apiUrl}/api/checkout/mintpay/callback?bookingId=${encodeURIComponent(bookingId)}&status=success`;
  return { redirectUrl, reference: `EB-${bookingId}` };
}
