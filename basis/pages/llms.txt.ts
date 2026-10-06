// /llms.txt – Steckbrief für KI-Assistenten (Inhalt aus inhalt.yaml, Logik in lib/seo.ts).
import type { APIRoute } from 'astro';
import { llmsText } from '../lib/seo';
export const GET: APIRoute = ({ site }) => new Response(llmsText(site), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
