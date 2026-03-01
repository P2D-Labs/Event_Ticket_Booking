import { prisma } from './prisma.js';

let cache = {};
const CACHE_MS = 60 * 1000; // 1 min
let cacheTime = 0;

async function getSettings() {
  if (Date.now() - cacheTime < CACHE_MS && Object.keys(cache).length > 0) {
    return cache;
  }
  const rows = await prisma.systemSettings.findMany();
  cache = {};
  for (const r of rows) {
    try {
      cache[r.key] = JSON.parse(r.value);
    } catch {
      cache[r.key] = r.value;
    }
  }
  cacheTime = Date.now();
  return cache;
}

export async function getHandlingFeeConfig() {
  const s = await getSettings();
  return {
    type: s.handling_fee_type || 'percentage',
    value: Number(s.handling_fee_value) || 0,
  };
}

export async function getRewardPointsConfig() {
  const s = await getSettings();
  return {
    type: s.reward_points_type || 'percentage',
    value: Number(s.reward_points_value) || 0,
  };
}

export async function isPaymentMethodEnabled(method) {
  const s = await getSettings();
  const key = `payment_${method.toLowerCase()}_enabled`;
  return s[key] === true || s[key] === 'true';
}

export async function getFeaturedEventConfig() {
  const s = await getSettings();
  return {
    price: Number(s.featured_event_price) || 0,
    durationDays: Number(s.featured_event_duration_days) || 14,
  };
}

const PAYMENT_METHOD_KEYS = ['STRIPE', 'KOKO', 'MINTPAY', 'ON_ENTRY'];

export async function getEnabledPaymentMethodsList() {
  const s = await getSettings();
  return PAYMENT_METHOD_KEYS.filter((method) => {
    const key = `payment_${method.toLowerCase()}_enabled`;
    return s[key] === true || s[key] === 'true';
  });
}

export function clearSettingsCache() {
  cache = {};
  cacheTime = 0;
}
