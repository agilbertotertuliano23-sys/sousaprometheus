/**
 * STUB — Épico E3 / Should S1. Requisito RF-06.
 *
 * `?c=<id>` já vira um bucket estável `a`/`b` (src/data/personalizacao.ts,
 * hash FNV-1a) e chega no <html> como `data-variante`. FALTA o efeito:
 * a variante pode reordenar a lista de produtos e/ou trocar qual recebe
 * `destaque`, por uma regra POR NICHO (RF-06.2).
 *
 * Ideia de contrato (defina ao implementar):
 *   Nicho.variantes?: {
 *     b?: { ordem?: string[]; destaque?: string }  // SKUs
 *   }
 *   — sem regra declarada, a variante 'b' é idêntica à 'a'.
 *
 * TODO(você):
 *   1. Estender o tipo Nicho em src/data/tipos.ts com o mapa de variantes.
 *   2. `ordenarProdutos(nicho, variante)` — retorna Produto[] reordenado.
 *   3. Ligar em slots.ts (a grade reescrita já usa a ordem da variante).
 *   4. `catalog validate` deve conferir que os SKUs citados em `variantes` existem.
 */
import type { Nicho, Produto } from '../../data/tipos';

export function ordenarProdutos(nicho: Nicho, _variante: 'a' | 'b'): Produto[] {
  // TODO(E3/RF-06): aplicar a regra da variante. Por ora, ordem do arquivo.
  return nicho.produtos;
}
