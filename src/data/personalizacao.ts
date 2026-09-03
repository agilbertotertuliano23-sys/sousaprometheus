import type { ContextoPersonalizacao } from './tipos';
import { NICHO_PADRAO, NICHOS } from './nichos';

/**
 * Hash estável (FNV-1a 32 bits) — mesmo criativo, mesmo bucket, sempre.
 * Nada de Math.random: a personalização precisa ser reprodutível.
 */
function hash(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function resolverContexto(params: URLSearchParams): ContextoPersonalizacao {
  const nBruto = params.get('n');
  const nicho = nBruto && nBruto in NICHOS ? nBruto : NICHO_PADRAO;
  const criativo = params.get('c');
  const oferta = params.get('o');
  const variante: 'a' | 'b' = criativo && hash(criativo) % 2 === 1 ? 'b' : 'a';
  return { nicho, criativo, oferta, variante };
}
