/**
 * Mapa tipo-de-bloco → componente Astro.
 *
 * DONOS DE PREENCHER: E5-01 (texto/mídia/depoimento) ✔, E5-02 (specs — via
 * GaleriaMidia/benefícios/specs), E5-03 (como-usar/comparativo/bonus/faq).
 *
 * E5-01 preencheu `texto`/`midia`/`depoimento` com componentes reais de
 * `../../components/blocos/Bloco*.astro`. Faltam `specs` (E5-02) e
 * `como-usar`/`comparativo`/`bonus`/`faq` (E5-03) — seguem `null`.
 *
 * O valor real deste módulo é GARANTIR que o vocabulário (`tipos-bloco.json`), o
 * union (`TipoBloco` em `tipos.ts`) e este registry não divirjam (RNF-14).
 * `RenderBlocos` faz `REGISTRY[tipo] ?? (warn + null)`.
 */
import type { TipoBloco } from '../../data/tipos';
import VOCABULARIO from './tipos-bloco.json';
import BlocoTexto from '../../components/blocos/BlocoTexto.astro';
import BlocoMidia from '../../components/blocos/BlocoMidia.astro';
import BlocoDepoimento from '../../components/blocos/BlocoDepoimento.astro';
import BlocoSpecs from '../../components/blocos/BlocoSpecs.astro';

/** Vocabulário de tipos de bloco (fonte única — `tipos-bloco.json`). */
export const TIPOS_BLOCO = VOCABULARIO as readonly TipoBloco[];

export const REGISTRY: Record<TipoBloco, unknown> = {
  texto: BlocoTexto,
  midia: BlocoMidia,
  depoimento: BlocoDepoimento,
  'como-usar': null, // E5-03
  comparativo: null, // E5-03
  bonus: null, // E5-03
  faq: null, // E5-03
  specs: BlocoSpecs, // E5-02 ✔
};
