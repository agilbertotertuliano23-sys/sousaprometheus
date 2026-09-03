/**
 * STUB — Épico E4 / Should S4. Requisito RF-09.
 *
 * Monta as meta tags de compartilhamento (Open Graph) de um nicho, com
 * fallback para `titulo`/`subtitulo`. Helper puro: quem renderiza é
 * src/layouts/Base.astro (raiz `/`, buildada com o nicho padrão) e
 * src/pages/n/[slug].astro (uma por nicho).
 *
 * Lembrar: a raiz `/` é buildada UMA vez com o nicho padrão; a troca por `?n=`
 * é client-side e NÃO reescreve `<meta>` (crawlers não rodam o JS). OG dinâmica
 * de verdade por nicho só existe via a rota estática `/n/<slug>` — decidir no E4
 * se isso basta ou se a raiz precisa de um OG "neutro".
 *
 * TODO(você):
 *   1. Definir o formato de retorno (lista de {property|name, content}).
 *   2. `og:image` — precisa de imagem por nicho (nicho.og.imagem) + tamanho
 *      recomendado 1200x630; sem ela, cair num asset padrão em /public.
 *   3. Adicionar og:url/canonical usando PUBLIC_SITE_URL.
 */
import type { Nicho } from '../../data/tipos';

export interface MetaTag {
  property?: string;
  name?: string;
  content: string;
}

export function tagsOg(_nicho: Nicho, _siteUrl = ''): MetaTag[] {
  // TODO(E4/RF-09): montar as tags. Ver cabeçalho.
  return [];
}
