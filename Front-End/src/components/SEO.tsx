import { Helmet } from 'react-helmet-async';
import { toAbsoluteUrl, siteName, defaultDescription } from '../lib/seo';

type SEOProps = {
  title: string;
  description?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: 'website' | 'article';
  jsonLd?: object | object[];
};

export default function SEO({ title, description, ogImage, ogUrl, ogType = 'website', jsonLd }: SEOProps) {
  const desc = description || defaultDescription;
  const image = ogImage ? toAbsoluteUrl(ogImage) : toAbsoluteUrl('/og-default.png');
  const url = ogUrl ? toAbsoluteUrl(ogUrl) : (typeof window !== 'undefined' ? window.location.href : '');

  const fullTitle = title.includes(siteName) || title.includes('|') ? title : `${title} | ${siteName}`;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc.slice(0, 160)} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc.slice(0, 160)} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content={ogType} />
      {url && <meta property="og:url" content={url} />}
      <meta property="og:site_name" content={siteName} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={desc.slice(0, 160)} />
      <meta name="twitter:image" content={image} />
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(Array.isArray(jsonLd) ? jsonLd : jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
