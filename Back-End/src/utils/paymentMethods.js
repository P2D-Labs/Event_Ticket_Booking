import { prisma } from './prisma.js';
import { isPaymentMethodEnabled } from './settings.js';

const ALL_METHODS = ['STRIPE', 'KOKO', 'MINTPAY', 'ON_ENTRY'];
const SETTING_KEY = { STRIPE: 'stripe', KOKO: 'koko', MINTPAY: 'mintpay', ON_ENTRY: 'on_entry' };

/**
 * Get list of payment methods enabled for an event.
 * Global setting must be on; per-event override can disable a method for that event.
 * If event has no EventPaymentMethod rows, all globally enabled methods are allowed.
 */
export async function getEnabledPaymentMethodsForEvent(eventId) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
    include: { eventPaymentMethods: true },
  });
  if (!event) return [];

  const globalEnabled = {};
  for (const method of ALL_METHODS) {
    globalEnabled[method] = await isPaymentMethodEnabled(SETTING_KEY[method]);
  }

  const overrides = event.eventPaymentMethods || [];
  if (overrides.length === 0) {
    return ALL_METHODS.filter((m) => globalEnabled[m]);
  }

  return ALL_METHODS.filter((method) => {
    if (!globalEnabled[method]) return false;
    const row = overrides.find((r) => r.paymentMethod === method);
    return !row || row.enabled;
  });
}
