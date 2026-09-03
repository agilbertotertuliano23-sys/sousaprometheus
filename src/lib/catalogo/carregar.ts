/**
 * Resolve o caminho relativo de um asset de nicho (ex.: "01/card.svg") para a
 * URL final com hash que o Vite gera no build. Os arquivos vivem em
 * src/assets/catalog/<slug>/** e entram via import.meta.glob (mesmo padrão do ARES).
 */
// `query: '?url'` força o Vite a devolver a URL final (com hash) do asset. Sem
// isso, o `default` de um .svg no Astro 7 é um COMPONENTE, não uma string — e o
// `src` do <img> sai corrompido. Ver docs/epics/PLANO-PROXIMO-PASSO.md.
const MODULOS = import.meta.glob('/src/assets/catalog/**/*', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export function urlAsset(slug: string, rel: string): string {
  const chave = `/src/assets/catalog/${slug}/${rel}`;
  const url = MODULOS[chave];
  if (!url && import.meta.env.DEV) {
    console.warn(`[catalogo] asset não encontrado: ${chave}`);
  }
  return url ?? '';
}
