// /robots.txt – Suchmaschinen und KI-Crawler ausdrücklich erlaubt (Sichtbarkeit in Google UND KI-Antworten).
// Demos/Vorschauen bleiben trotzdem aus dem Index: dafür sorgt <meta name="robots" content="noindex"> im Layout.
import type { APIRoute } from 'astro';
export const GET: APIRoute = ({ site }) => new Response(
  ['User-agent: *', 'Allow: /', '', ...(site ? [`Sitemap: ${new URL('/sitemap.xml', site).href}`] : []), ''].join('\n'),
  { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
