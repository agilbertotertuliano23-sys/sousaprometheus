/**
 * STUB — Épico E4 / Should S4. Endpoint estático do Astro: gera dist/sitemap.xml
 * no build. Referenciado por public/robots.txt (linha `Sitemap:`).
 *
 * Escopo pequeno de propósito: a raiz `/` e uma URL por nicho (`/n/<slug>`).
 * Sem libs — o site é curto (ADR-005 vale de espírito também aqui).
 *
 * TODO(você):
 *   1. Ler PUBLIC_SITE_URL (sem barra final) — abortar/avisar se ausente.
 *   2. Emitir `/` + um `<url>` por slug de SLUGS.
 *   3. `lastmod` — opcional; se entrar, vir de uma fonte real (git ou build time).
 *   4. Decidir se `/n/<slug>` entra agora (depende de E4/C-3) ou só a raiz.
 */
import type { APIRoute } from 'astro';
import { SLUGS } from '../data/nichos';

export const GET: APIRoute = () => {
  // TODO(E4): montar o XML de verdade. Placeholder mínimo e válido abaixo.
  const base = import.meta.env.PUBLIC_SITE_URL ?? '';
  void SLUGS;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${base}/</loc></url>
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
};
