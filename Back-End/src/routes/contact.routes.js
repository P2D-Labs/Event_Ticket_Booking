import { Router } from 'express';
import { sendContactForm } from '../services/mail.service.js';

const router = Router();

function isValidEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s).trim()) && String(s).length <= 255;
}

router.post('/', async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email and message are required.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address.' });
    }
    const sub = (subject || 'Contact form').toString().trim().slice(0, 200);
    await sendContactForm({
      name: String(name).trim().slice(0, 200),
      email: String(email).trim().slice(0, 255).toLowerCase(),
      subject: sub,
      message: String(message).trim().slice(0, 5000),
    });
    res.json({ success: true, message: 'Message sent. We will get back to you soon.' });
  } catch (e) {
    next(e);
  }
});

export default router;
