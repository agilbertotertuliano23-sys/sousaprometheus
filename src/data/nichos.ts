/**
 * Índice de nichos. Registre cada nicho novo aqui — é a única lista que o
 * app enxerga. `prometeus niche new <slug>` cria o arquivo; o registro é manual
 * e proposital (revisar antes de publicar).
 */
import type { Nicho } from './tipos';
import { exemplo } from './nichos/exemplo';
import { validarNicho } from '../lib/catalogo/validar';

export const NICHOS: Record<string, Nicho> = {
  exemplo,
};

export const SLUGS = Object.keys(NICHOS);

export const NICHO_PADRAO = import.meta.env.PUBLIC_NICHO_PADRAO || 'exemplo';

export function resolverNicho(slug: string | null | undefined): Nicho {
  if (slug && slug in NICHOS) return NICHOS[slug];
  return NICHOS[NICHO_PADRAO] ?? NICHOS[SLUGS[0]];
}

// Backstop estrutural em DEV (ADR-007 / doc 08 §6): aplica `validarNicho` a cada
// nicho e derruba o `npm run dev` com as mensagens. Em produção o bloco nem
// entra no bundle (`import.meta.env.DEV` é estaticamente falso).
if (import.meta.env.DEV) {
  const problemas = Object.entries(NICHOS).flatMap(([slug, n]) =>
    validarNicho(n).map((m) => `[${slug}] ${m}`),
  );
  if (problemas.length) {
    throw new Error(`Nichos inválidos:\n  ${problemas.join('\n  ')}`);
  }
}
