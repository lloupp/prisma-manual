import { MetadataRoute } from 'next';
import { getSystems, getParts, getGuides } from '../lib/selectors';

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const [systems, parts, guides] = await Promise.all([getSystems(), getParts(), getGuides()]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: 'monthly' },
    { url: `${baseUrl}/search`, changeFrequency: 'monthly' },
  ];

  const systemRoutes = systems.map((s) => ({ url: `${baseUrl}/systems/${s.id}`, changeFrequency: 'yearly' as const }));
  const partRoutes = parts.map((p) => ({ url: `${baseUrl}/parts/${p.id}`, changeFrequency: 'yearly' as const }));
  const guideRoutes = guides.map((g) => ({ url: `${baseUrl}/guides/${g.id}`, changeFrequency: 'yearly' as const }));

  return [...staticRoutes, ...systemRoutes, ...partRoutes, ...guideRoutes];
}
