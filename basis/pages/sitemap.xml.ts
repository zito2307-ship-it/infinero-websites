// /sitemap.xml – alle öffentlichen Seiten (Startseite + Leistungs-Unterseiten). Ohne Domain (site) bleibt sie leer.
import type { APIRoute } from 'astro';
import { seitenListe } from '../lib/seo';
export const GET: APIRoute = ({ site }) => {
  const heute = new Date().toISOString().slice(0, 10);
  const urls = site ? seitenListe().map((p) => `  <url><loc>${new URL(p, site).href}</loc><lastmod>${heute}</lastmod></url>`) : [];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
