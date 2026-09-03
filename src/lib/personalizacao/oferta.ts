/**
 * STUB — Épico E3 / Should S2. Requisito RF-07.
 *
 * `?o=<id>` já chega no <html> como `data-oferta`. FALTA o efeito visual:
 *   - uma tarja/selo global (topo da página) com o texto da oferta;
 *   - opcionalmente trocar o texto do CTA dos cards.
 *
 * A marcação da tarja vive em src/components/TarjaOferta/TarjaOferta.astro
 * (renderizada sempre, escondida via [hidden] até este código a preencher).
 *
 * Ideia de contrato (defina ao implementar):
 *   Nicho.ofertas?: Record<string, { selo: string; cta?: string }>
 *   — `?o=` sem entrada correspondente = nenhum efeito (silencioso).
 *
 * TODO(você):
 *   1. Estender o tipo Nicho em src/data/tipos.ts com o mapa de ofertas.
 *   2. `aplicarOferta(nicho, oferta)` — mostra a tarja e, se houver, reescreve
 *      o rótulo dos `a.cta[data-sku]`.
 *   3. Chamar de contexto.ts depois dos data-*.
 *   4. `catalog validate` opcional: avisar sobre `?o=` divulgado sem entrada.
 */
import type { Nicho } from '../../data/tipos';

export function aplicarOferta(_nicho: Nicho, _oferta: string | null): void {
  // TODO(E3/RF-07): implementar. Ver cabeçalho deste arquivo.
}
