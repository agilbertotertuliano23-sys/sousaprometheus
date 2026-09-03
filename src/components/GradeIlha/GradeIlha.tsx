/** @jsxImportSource preact */
/**
 * STUB — Could C-1. Ilha Preact para a grade com filtro por `tag`.
 *
 * Só entra se a grade estática (GradeCatalogo.astro) não bastar. Preact, não
 * React: é caminho crítico no webview do TikTok (ver astro.config.ts). Hidratar
 * com `client:visible` para não pesar no 1º paint (RNF-02/RNF-03).
 *
 * Cuidado com E3: se `slots.ts` reescreve a grade no cliente a partir do nicho
 * da URL, e esta ilha também mexe na grade, definir QUEM manda. Provável: a ilha
 * recebe `produtos` já resolvidos (nicho + variante) via props e só filtra.
 *
 * TODO(você):
 *   1. Props: { produtos: Produto[]; cta: string; slug: string }.
 *   2. Estado: tag selecionada (ou null = todas). Derivar as tags de produtos.
 *   3. Reusar a marcação do card (extrair um <Card/> Preact espelhando
 *      CardProduto.astro, ou renderizar via o mesmo template de slots.ts).
 *   4. Acessibilidade: os filtros são <button> com aria-pressed; alvo ≥ 44px
 *      (RNF-06). `prefers-reduced-motion` para qualquer transição (RNF-08).
 */
import type { Produto } from '../../data/tipos';

interface Props {
  produtos: Produto[];
  cta: string;
  slug: string;
}

export default function GradeIlha(_props: Props) {
  // TODO(C-1): implementar filtro por tag. Ver cabeçalho.
  return null;
}
