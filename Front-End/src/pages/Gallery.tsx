import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import SEO from '../components/SEO';
import PageContainer, { PageHeading } from '../components/layout/PageContainer';
import ClickableImage from '../components/ui/ClickableImage';
import api from '../api/client';

type Banner = { id: string; title?: string; imageUrl: string; linkUrl?: string };
type Event = { id: string; title: string; slug: string; coverImage: string };

export default function Gallery() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    api.get('/api/public/banners').then((r) => setBanners(r.data.banners || [])).catch(() => {});
    api.get('/api/events').then((r) => setEvents(r.data.events || [])).catch(() => {});
  }, []);

  const images = [
    ...banners.map((b) => ({ id: b.id, url: b.imageUrl, title: b.title, link: b.linkUrl })),
    ...events.slice(0, 12).map((e) => ({ id: e.id, url: e.coverImage, title: e.title, link: `/events/${e.slug}` })),
  ];

  return (
    <>
      <SEO title="Gallery" description="Past events and moments. NUIT event gallery." ogUrl="/gallery" />
      <Helmet><title>Gallery | NUIT</title></Helmet>
      <PageContainer>
        <PageHeading label="Moments" title="Gallery" intro="A glimpse of our events and experiences." />
        <section className="mb-10 md:mb-14" aria-labelledby="gallery-images">
          <h2 id="gallery-images" className="font-header text-xl text-[var(--color-text)] mb-6">Images</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.length === 0 ? (
            <p className="text-[var(--color-text-muted)] col-span-full">No images yet.</p>
          ) : (
            images.map((img) => (
              img.link ? (
                <Link key={img.id} to={img.link} className="block aspect-[4/3] overflow-hidden border border-[var(--color-border)] group">
                  <ClickableImage src={img.url} alt={img.title || ''} className="w-full h-full">
                    <img src={img.url} alt={img.title || ''} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy" />
                  </ClickableImage>
                  {img.title && <span className="sr-only">{img.title}</span>}
                </Link>
              ) : (
                <div key={img.id} className="aspect-[4/3] overflow-hidden border border-[var(--color-border)]">
                  <ClickableImage src={img.url} alt={img.title || ''} className="w-full h-full">
                    <img src={img.url} alt={img.title || ''} className="w-full h-full object-cover" loading="lazy" />
                  </ClickableImage>
                </div>
              )
            ))
          )}
          </div>
        </section>
      </PageContainer>
    </>
  );
}
