import { prisma } from '../utils/prisma.js';
import { clearSettingsCache } from '../utils/settings.js';

const ALLOWED_KEYS = [
  'featured_event_price',
  'featured_event_duration_days',
  'payment_stripe_enabled',
  'payment_koko_enabled',
  'payment_mintpay_enabled',
  'payment_on_entry_enabled',
];

export async function getSettingsHandler(req, res, next) {
  try {
    const rows = await prisma.systemSettings.findMany({
      where: { key: { in: ALLOWED_KEYS } },
    });
    const data = {};
    for (const r of rows) {
      try {
        data[r.key] = JSON.parse(r.value);
      } catch {
        data[r.key] = r.value;
      }
    }
    res.json({ success: true, settings: data });
  } catch (e) {
    next(e);
  }
}

export async function updateSettingsHandler(req, res, next) {
  try {
    const body = req.body || {};
    for (const key of ALLOWED_KEYS) {
      if (body[key] !== undefined) {
        let value;
        if (key === 'featured_event_duration_days') value = String(Math.max(1, Math.min(365, Number(body[key]) || 14)));
        else if (key === 'featured_event_price') value = String(Math.max(0, Number(body[key]) || 0));
        else if (key.startsWith('payment_') && key.endsWith('_enabled')) value = body[key] ? 'true' : 'false';
        else value = String(body[key]);
        await prisma.systemSettings.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        });
      }
    }
    clearSettingsCache();
    const rows = await prisma.systemSettings.findMany({
      where: { key: { in: ALLOWED_KEYS } },
    });
    const settings = {};
    for (const r of rows) {
      try {
        settings[r.key] = JSON.parse(r.value);
      } catch {
        settings[r.key] = r.value;
      }
    }
    res.json({ success: true, settings });
  } catch (e) {
    next(e);
  }
}
