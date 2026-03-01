import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

// Placeholder images (Unsplash, stable URLs)
const IMG = {
  event1: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80',
  event2: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80',
  event3: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80',
  event4: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&q=80',
  event5: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&q=80',
  event6: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80',
  banner1: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1920&q=80',
  banner2: 'https://images.unsplash.com/photo-1470229722913-7c0d2dbbafd3?w=1920&q=80',
};

async function main() {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);

  // ---------- Users ----------
  const adminEmail = 'admin@eventbooking.lk';
  let admin = await prisma.user.findFirst({ where: { email: adminEmail } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Super Admin',
        phone: '+94771234567',
        passwordHash: await bcrypt.hash('Admin@123', salt),
        role: 'SUPER_ADMIN',
      },
    });
    console.log('Created super admin:', admin.email);
  }

  let organizer = await prisma.user.findFirst({ where: { email: 'organizer@eventbooking.lk' } });
  if (!organizer) {
    organizer = await prisma.user.create({
      data: {
        email: 'organizer@eventbooking.lk',
        name: 'Colombo Events Co',
        phone: '+94772233445',
        passwordHash: await bcrypt.hash('Organizer@123', salt),
        role: 'ORGANIZER',
        organization: 'Colombo Events Co',
      },
    });
    console.log('Created organizer:', organizer.email);
  }

  let customer = await prisma.user.findFirst({ where: { email: 'customer@eventbooking.lk' } });
  if (!customer) {
    customer = await prisma.user.create({
      data: {
        email: 'customer@eventbooking.lk',
        name: 'Test Customer',
        phone: '+94773334456',
        passwordHash: await bcrypt.hash('Customer@123', salt),
        role: 'CUSTOMER',
      },
    });
    console.log('Created customer:', customer.email);
  }

  // ---------- Categories ----------
  const categoryData = [
    { name: 'Music', slug: 'music', description: 'Music concerts and live performances' },
    { name: 'Nightlife', slug: 'nightlife', description: 'Clubs, parties and night events' },
    { name: 'Comedy', slug: 'comedy', description: 'Stand-up and comedy shows' },
    { name: 'Arts & Culture', slug: 'arts-culture', description: 'Theatre, exhibitions and cultural events' },
    { name: 'Sports', slug: 'sports', description: 'Sports events and fitness' },
    { name: 'Food & Drink', slug: 'food-drink', description: 'Food festivals and tastings' },
  ];
  const categories = {};
  for (const c of categoryData) {
    let cat = await prisma.category.findFirst({ where: { slug: c.slug } });
    if (!cat) {
      cat = await prisma.category.create({ data: c });
      console.log('Created category:', cat.name);
    }
    categories[c.slug] = cat;
  }

  // ---------- Events (approved, with ticket types) ----------
  const now = new Date();
  const nextMonth = (n) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() + n);
    return d;
  };

  const eventsData = [
    {
      title: 'Sunset Beach Party',
      slug: 'sunset-beach-party',
      description: 'Join us for an unforgettable evening by the sea. Live DJ, cocktails and the best sunset views in Colombo. Dress code: smart casual.',
      location: 'Colombo',
      venue: 'Galle Face Green',
      eventDate: nextMonth(1),
      eventTime: '18:00',
      coverImage: IMG.event1,
      categorySlug: 'nightlife',
      ticketTypes: [
        { name: 'General Entry', price: 2500, quantity: 200 },
        { name: 'VIP (front row)', price: 5500, quantity: 50 },
      ],
    },
    {
      title: 'Jazz Night at the Gallery',
      slug: 'jazz-night-at-the-gallery',
      description: 'An intimate evening of jazz and blues in one of Colombo\'s finest art spaces. Featuring local and international musicians.',
      location: 'Colombo',
      venue: 'The Gallery Café',
      eventDate: nextMonth(0),
      eventTime: '19:30',
      coverImage: IMG.event2,
      categorySlug: 'music',
      ticketTypes: [
        { name: 'Standard', price: 3500, quantity: 80 },
        { name: 'Table for 2', price: 8000, quantity: 20 },
      ],
    },
    {
      title: 'Stand-Up Comedy Night',
      slug: 'stand-up-comedy-night',
      description: 'Laugh out loud with Sri Lanka\'s best comedians. An evening of jokes, stories and good vibes. 18+ only.',
      location: 'Colombo',
      venue: 'British Council Colombo',
      eventDate: nextMonth(0),
      eventTime: '20:00',
      coverImage: IMG.event3,
      categorySlug: 'comedy',
      ticketTypes: [
        { name: 'Early Bird', price: 1500, quantity: 100 },
        { name: 'Regular', price: 2000, quantity: 150 },
      ],
    },
    {
      title: 'Electronic Music Festival',
      slug: 'electronic-music-festival',
      description: 'A full-day outdoor electronic music festival. Multiple stages, international and local DJs. Food stalls and bars on site.',
      location: 'Negombo',
      venue: 'Negombo Beach Park',
      eventDate: nextMonth(2),
      eventTime: '14:00',
      coverImage: IMG.event4,
      categorySlug: 'music',
      ticketTypes: [
        { name: 'Day Pass', price: 4500, quantity: 500 },
        { name: 'VIP (backstage access)', price: 12000, quantity: 100 },
      ],
    },
    {
      title: 'Wine & Dine Experience',
      slug: 'wine-dine-experience',
      description: 'A curated five-course dinner paired with premium wines. Chef\'s special menu in an exclusive setting. Limited seats.',
      location: 'Colombo',
      venue: 'Shangri-La Colombo',
      eventDate: nextMonth(1),
      eventTime: '19:00',
      coverImage: IMG.event5,
      categorySlug: 'food-drink',
      ticketTypes: [
        { name: 'Per person', price: 15000, quantity: 40 },
      ],
    },
    {
      title: 'Yoga & Wellness Morning',
      slug: 'yoga-wellness-morning',
      description: 'Start your weekend with an outdoor yoga session followed by a healthy brunch. All levels welcome. Mats provided.',
      location: 'Colombo',
      venue: 'Viharamahadevi Park',
      eventDate: nextMonth(0),
      eventTime: '07:00',
      coverImage: IMG.event6,
      categorySlug: 'sports',
      ticketTypes: [
        { name: 'Single session', price: 1200, quantity: 60 },
      ],
    },
  ];

  for (const e of eventsData) {
    let event = await prisma.event.findFirst({ where: { slug: e.slug } });
    if (!event) {
      const categoryId = categories[e.categorySlug]?.id ?? null;
      event = await prisma.event.create({
        data: {
          title: e.title,
          slug: e.slug,
          description: e.description,
          location: e.location,
          venue: e.venue,
          eventDate: e.eventDate,
          eventTime: e.eventTime,
          coverImage: e.coverImage,
          status: 'APPROVED',
          organizerId: organizer.id,
          categoryId,
        },
      });
      for (const tt of e.ticketTypes) {
        await prisma.ticketType.create({
          data: {
            name: tt.name,
            price: tt.price,
            quantity: tt.quantity,
            eventId: event.id,
          },
        });
      }
      console.log('Created event:', event.title);
    }
  }

  // ---------- Featured & Coming soon (demo) ----------
  const featuredSlugs = ['sunset-beach-party', 'jazz-night-at-the-gallery', 'stand-up-comedy-night', 'wine-dine-experience'];
  const featureStarts = new Date(now);
  const featureEnds = new Date(now);
  featureEnds.setDate(featureEnds.getDate() + 14);
  for (const slug of featuredSlugs) {
    const ev = await prisma.event.findFirst({ where: { slug, status: 'APPROVED', deletedAt: null } });
    if (ev) {
      const existingFeature = await prisma.eventFeature.findFirst({ where: { eventId: ev.id } });
      if (!existingFeature) {
        await prisma.eventFeature.create({
          data: { eventId: ev.id, startsAt: featureStarts, endsAt: featureEnds },
        });
        console.log('Created featured event:', ev.title);
      }
    }
  }
  const emfEvent = await prisma.event.findFirst({ where: { slug: 'electronic-music-festival', status: 'APPROVED', deletedAt: null } });
  if (emfEvent && !emfEvent.bookingOpensAt) {
    const bookingOpens = new Date(now);
    bookingOpens.setDate(bookingOpens.getDate() + 7);
    await prisma.event.update({
      where: { id: emfEvent.id },
      data: { bookingOpensAt: bookingOpens },
    });
    console.log('Set Electronic Music Festival as coming soon (booking opens in 7 days)');
  }

  // ---------- Banners ----------
  const bannersData = [
    { title: 'Exclusive Events', imageUrl: IMG.banner1, linkUrl: '/events', sortOrder: 0 },
    { title: 'Live Music', imageUrl: IMG.banner2, linkUrl: '/events?categoryId=', sortOrder: 1 },
  ];
  for (const b of bannersData) {
    const exists = await prisma.banner.findFirst({ where: { imageUrl: b.imageUrl } });
    if (!exists) {
      await prisma.banner.create({ data: b });
      console.log('Created banner:', b.title);
    }
  }

  // ---------- Testimonials ----------
  const testimonialsData = [
    { author: 'Nadeesha M.', content: 'Smooth booking and instant confirmation. Will use again for sure!', rating: 5 },
    { author: 'Raj K.', content: 'Great variety of events. The premium subscription is worth it for no handling fees.', rating: 5 },
    { author: 'Sarah J.', content: 'First time booking tickets online in Sri Lanka. Very easy and secure.', rating: 4 },
  ];
  for (const t of testimonialsData) {
    const exists = await prisma.testimonial.findFirst({ where: { author: t.author, content: t.content } });
    if (!exists) {
      await prisma.testimonial.create({ data: t });
      console.log('Created testimonial:', t.author);
    }
  }

  // ---------- Premium plans ----------
  let planMonthly = await prisma.premiumPlan.findFirst({ where: { name: 'Premium Monthly' } });
  if (!planMonthly) {
    planMonthly = await prisma.premiumPlan.create({
      data: { name: 'Premium Monthly', price: 999, duration: 'MONTHLY', isActive: true },
    });
    console.log('Created premium plan: Premium Monthly');
  }
  let planYearly = await prisma.premiumPlan.findFirst({ where: { name: 'Premium Yearly' } });
  if (!planYearly) {
    planYearly = await prisma.premiumPlan.create({
      data: { name: 'Premium Yearly', price: 9990, duration: 'YEARLY', isActive: true },
    });
    console.log('Created premium plan: Premium Yearly');
  }

  // ---------- Promotions & Coupons ----------
  const promoStart = new Date(now);
  promoStart.setDate(1);
  const promoEnd = new Date(now);
  promoEnd.setMonth(promoEnd.getMonth() + 3);

  let promoAuto = await prisma.promotion.findFirst({ where: { name: '10% Off Music Events' } });
  if (!promoAuto) {
    promoAuto = await prisma.promotion.create({
      data: {
        name: '10% Off Music Events',
        type: 'PERCENTAGE',
        value: 10,
        minOrderAmount: 2000,
        maxDiscount: 500,
        startDate: promoStart,
        endDate: promoEnd,
        restrictCustomerType: 'ALL',
        isActive: true,
      },
    });
    console.log('Created promotion: 10% Off Music Events');
  }

  let promoCoupon = await prisma.promotion.findFirst({ where: { name: 'Early Bird Coupon' } });
  if (!promoCoupon) {
    promoCoupon = await prisma.promotion.create({
      data: {
        name: 'Early Bird Coupon',
        type: 'COUPON',
        value: 500,
        minOrderAmount: 3000,
        maxDiscount: 500,
        startDate: promoStart,
        endDate: promoEnd,
        restrictCustomerType: 'ALL',
        isActive: true,
      },
    });
    console.log('Created promotion: Early Bird Coupon');
  }

  let coupon = await prisma.coupon.findFirst({ where: { code: 'EARLY500' } });
  if (!coupon) {
    await prisma.coupon.create({
      data: { code: 'EARLY500', promotionId: promoCoupon.id, maxUses: 100 },
    });
    console.log('Created coupon: EARLY500');
  }

  // ---------- System settings ----------
  const settings = [
    { key: 'handling_fee_type', value: '"percentage"' },
    { key: 'handling_fee_value', value: '5' },
    { key: 'reward_points_type', value: '"percentage"' },
    { key: 'reward_points_value', value: '2' },
    { key: 'payment_stripe_enabled', value: 'true' },
    { key: 'payment_koko_enabled', value: 'false' },
    { key: 'payment_mintpay_enabled', value: 'false' },
    { key: 'payment_on_entry_enabled', value: 'true' },
    { key: 'featured_event_price', value: '5000' },
    { key: 'featured_event_duration_days', value: '14' },
  ];
  for (const s of settings) {
    await prisma.systemSettings.upsert({
      where: { key: s.key },
      create: s,
      update: { value: s.value },
    });
  }
  console.log('Seeded system settings');

  console.log('\n--- Seed complete ---');
  console.log('Logins:');
  console.log('  Admin:    admin@eventbooking.lk / Admin@123');
  console.log('  Organizer: organizer@eventbooking.lk / Organizer@123');
  console.log('  Customer: customer@eventbooking.lk / Customer@123');
  console.log('Coupon: EARLY500 (LKR 500 off on orders LKR 3000+)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
