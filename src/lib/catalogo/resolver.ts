/**
 * PROMETEUS — resolução do catálogo categorizado (ADR-007 / doc 08 §4).
 *
 * Módulo PURO: sem DOM, sem `astro:*`, sem `node:*`, sem `import.meta.glob`,
 * sem componente. Só importa tipos de `../../data/tipos`. Determinístico —
 * nenhuma dependência de `Date`, `Math.random` ou estado de módulo mutável.
 * Reutilizável no build e no cliente (slots/* do E3).
 *
 * ── Casos de referência (entrada → saída esperada; base para asserts do QA) ──
 *
 * prioridadeDe:
 *   { }                       → 50            (default)
 *   { prioridade: 70 }        → 70
 *   { prioridade: 150 }       → 100           (clamp alto — só p/ ordenação)
 *   { prioridade: -5 }        → 0             (clamp baixo)
 *   { prioridade: 62.7 }      → 63            (arredonda)
 *
 * resolverCategorias(nicho, 'a'):
 *   sem `categorias`                         → [{ id:'_tudo', rotulo: nicho.nome }]
 *   categorias [{id:c1,ordem:1},{id:c2,ordem:0}], todos produtos com categoria válida
 *                                            → [c2, c1]                (ordena por `ordem`)
 *   idem + 1 produto sem categoria           → [c2, c1, {id:'_outros', rotulo:'Mais itens'}]
 *   variante 'b' + ordemCategorias:['c1']    → [c1, c2, _outros]       (_outros sempre no fim)
 *
 * produtosPorCategoria(nicho, 'a'):
 *   Map com as chaves NA ORDEM de resolverCategorias; cada grupo ordenado por
 *   prioridadeDe desc, desempate pela ordem de declaração em nicho.produtos.
 *   Produto sem categoria válida → grupo '_outros' (ou '_tudo').
 *   variante 'b' + variantes.b.ordem:['skuX','skuY'] → reordena por sku dentro
 *   de cada grupo; sku não citado segue depois, na ordem de prioridade.
 *
 * heroiDaVitrine(nicho, variante):
 *   'b' + variantes.b.destaque = sku existente → esse produto
 *   senão 1º produto com destaque === true (ordem do arquivo)
 *   senão produto de maior prioridade da 1ª categoria efetiva
 *   senão nicho.produtos[0]
 *
 * galeriaDe(produto):
 *   { galeria: [i1, i2] }                    → [i1, i2]                (cópia rasa)
 *   { imagem:'a.svg', nome:'X' }             → [{tipo:'imagem', src:'a.svg', alt:'X'}]
 *   { imagem:'a.svg', video:'v.mp4', poster:'p.svg', nome:'X' }
 *       → [{tipo:'imagem',src:'a.svg',alt:'X'}, {tipo:'video',src:'v.mp4',poster:'p.svg',alt:'X'}]
 *
 * blocosDe(produto):
 *   { specs:[...], blocos:[texto] }          → [{tipo:'specs',pares:[...]}, texto]
 *   { specs:[...], blocos:[specs,texto] }    → [specs, texto]          (não duplica)
 *   { blocos:[texto] }                       → [texto]
 *   { }                                      → []
 */
import type {
  Nicho,
  Produto,
  Categoria,
  ItemMidia,
  BlocoApresentacao,
} from '../../data/tipos';

/** Categoria sintética para produtos órfãos num nicho que declara categorias. */
export const CATEGORIA_OUTROS = '_outros';
/** Trilha única sintética quando o nicho não declara nenhuma categoria. */
export const CATEGORIA_TUDO = '_tudo';

const PRIORIDADE_DEFAULT = 50;

/**
 * Prioridade efetiva p/ ordenação: default 50, inteiro, clamp 0..100.
 * Valor fora de 0..100 ou não-inteiro é clampado/arredondado só para efeito de
 * ordenação — a rejeição dura de `prioridade` inválida é do `validar.ts`.
 */
export function prioridadeDe(produto: Produto): number {
  const p = produto.prioridade;
  if (p == null || !Number.isFinite(p)) return PRIORIDADE_DEFAULT;
  return Math.min(100, Math.max(0, Math.round(p)));
}

function ehSintetica(id: string): boolean {
  return id === CATEGORIA_OUTROS || id === CATEGORIA_TUDO;
}

/**
 * Categorias efetivas do nicho, na ordem de navegação. Doc 08 §4.1.
 * - base = `nicho.categorias ?? []`, ordenada por `ordem ?? índice de declaração`;
 * - anexa `_outros` ao fim SE algum produto é órfão (sem `categoria` ou com id
 *   inexistente);
 * - se a base é vazia → substitui tudo por `[_tudo]` (sem `_outros`);
 * - variante 'b' + `variantes.b.ordemCategorias` → reordena; ids não citados vão
 *   ao fim na ordem anterior; `_outros`/`_tudo` sempre por último.
 */
export function resolverCategorias(nicho: Nicho, variante: 'a' | 'b'): Categoria[] {
  const declaradas = (nicho.categorias ?? [])
    .map((cat, i) => ({ cat, i }))
    .sort((a, b) => (a.cat.ordem ?? a.i) - (b.cat.ordem ?? b.i) || a.i - b.i)
    .map((x) => x.cat);

  // Base vazia → trilha única sintética; nunca há `_outros` nesse caso.
  if (declaradas.length === 0) {
    return [{ id: CATEGORIA_TUDO, rotulo: nicho.nome }];
  }

  const idsDeclarados = new Set(declaradas.map((c) => c.id));
  const temOrfao = nicho.produtos.some(
    (p) => p.categoria == null || !idsDeclarados.has(p.categoria),
  );

  let lista: Categoria[] = [...declaradas];
  if (temOrfao) lista.push({ id: CATEGORIA_OUTROS, rotulo: 'Mais itens' });

  const ordemCat =
    variante === 'b' ? nicho.variantes?.b?.ordemCategorias : undefined;
  if (ordemCat && ordemCat.length > 0) {
    const sinteticas = lista.filter((c) => ehSintetica(c.id));
    const reais = lista.filter((c) => !ehSintetica(c.id));
    const porId = new Map(reais.map((c) => [c.id, c] as const));
    const citadas: Categoria[] = [];
    for (const id of ordemCat) {
      const c = porId.get(id);
      if (c) {
        citadas.push(c);
        porId.delete(id);
      }
    }
    const naoCitadas = reais.filter((c) => porId.has(c.id));
    lista = [...citadas, ...naoCitadas, ...sinteticas];
  }

  return lista;
}

/**
 * id efetivo da categoria de um produto: seu `categoria` se referencia uma
 * categoria declarada; senão `_outros` (ou `_tudo` se o nicho não declara
 * nenhuma categoria). Helper exportado p/ reuso em E5/E6.
 */
export function categoriaEfetivaDe(nicho: Nicho, produto: Produto): string {
  const declaradas = nicho.categorias ?? [];
  if (declaradas.length === 0) return CATEGORIA_TUDO;
  if (
    produto.categoria != null &&
    declaradas.some((c) => c.id === produto.categoria)
  ) {
    return produto.categoria;
  }
  return CATEGORIA_OUTROS;
}

/**
 * Produtos agrupados e ordenados por categoria efetiva. Doc 08 §4.2.
 * As chaves do Map seguem EXATAMENTE a ordem de `resolverCategorias` — os
 * consumidores (grade do E6, vitrine do E3) confiam nisso.
 */
export function produtosPorCategoria(
  nicho: Nicho,
  variante: 'a' | 'b',
): Map<string, Produto[]> {
  const cats = resolverCategorias(nicho, variante);
  const mapa = new Map<string, Produto[]>();
  for (const c of cats) mapa.set(c.id, []);

  const indiceDeclaracao = new Map<Produto, number>(
    nicho.produtos.map((p, i) => [p, i] as const),
  );

  for (const p of nicho.produtos) {
    const id = categoriaEfetivaDe(nicho, p);
    const bucket = mapa.get(id);
    if (bucket) bucket.push(p);
  }

  const ordemSku = variante === 'b' ? nicho.variantes?.b?.ordem : undefined;
  const posSku =
    ordemSku && ordemSku.length > 0
      ? new Map(ordemSku.map((sku, i) => [sku, i] as const))
      : undefined;

  for (const lista of mapa.values()) {
    // 1) prioridade desc, desempate estável pela ordem de declaração.
    lista.sort((a, b) => {
      const dp = prioridadeDe(b) - prioridadeDe(a);
      if (dp !== 0) return dp;
      return (indiceDeclaracao.get(a) ?? 0) - (indiceDeclaracao.get(b) ?? 0);
    });
    // 2) variante 'b': ordem explícita por sku dentro do grupo; sku não citado
    //    segue depois, preservando a ordem do passo 1 (sort estável).
    if (posSku) {
      lista.sort((a, b) => {
        const pa = posSku.has(a.sku)
          ? (posSku.get(a.sku) as number)
          : Number.POSITIVE_INFINITY;
        const pb = posSku.has(b.sku)
          ? (posSku.get(b.sku) as number)
          : Number.POSITIVE_INFINITY;
        return pa - pb;
      });
    }
  }

  return mapa;
}

/**
 * Herói da vitrine (e default de `entrada.heroiSku`). Doc 08 §4.3.
 * Invariante: o nicho tem >= 1 produto (garantido por `catalog validate` /
 * `validarNicho`). Sem produto não há vitrine — guarda defensiva com `throw`.
 */
export function heroiDaVitrine(nicho: Nicho, variante: 'a' | 'b'): Produto {
  const produtos = nicho.produtos;
  if (produtos.length === 0) {
    throw new Error('heroiDaVitrine: nicho sem produtos (invariante violado)');
  }

  if (variante === 'b') {
    const sku = nicho.variantes?.b?.destaque;
    if (sku != null) {
      const alvo = produtos.find((p) => p.sku === sku);
      if (alvo) return alvo;
    }
  }

  const marcado = produtos.find((p) => p.destaque === true);
  if (marcado) return marcado;

  const primeira = resolverCategorias(nicho, variante)[0];
  if (primeira) {
    let melhor: Produto | undefined;
    for (const p of produtos) {
      if (categoriaEfetivaDe(nicho, p) !== primeira.id) continue;
      if (!melhor || prioridadeDe(p) > prioridadeDe(melhor)) melhor = p;
    }
    if (melhor) return melhor;
  }

  return produtos[0];
}

/**
 * Galeria efetiva: a declarada (cópia rasa, sem mutação), ou derivada de
 * `[imagem, (video)]`. Doc 08 §4.6. Ao derivar, `alt` = `produto.nome`.
 */
export function galeriaDe(produto: Produto): ItemMidia[] {
  if (produto.galeria && produto.galeria.length > 0) {
    return [...produto.galeria];
  }
  const itens: ItemMidia[] = [
    { tipo: 'imagem', src: produto.imagem, alt: produto.nome },
  ];
  if (produto.video) {
    const video: ItemMidia = {
      tipo: 'video',
      src: produto.video,
      alt: produto.nome,
    };
    if (produto.poster != null) video.poster = produto.poster;
    itens.push(video);
  }
  return itens;
}

/**
 * Blocos efetivos: prepend de `BlocoSpecs` a partir de `produto.specs` quando
 * `produto.blocos` não traz nenhum bloco `tipo === 'specs'`. Doc 08 §4.7.
 * Ordem preservada. Retorna cópia rasa (não expõe `produto.blocos` p/ mutação).
 */
export function blocosDe(produto: Produto): BlocoApresentacao[] {
  const blocos = produto.blocos ?? [];
  if (produto.specs && !blocos.some((b) => b.tipo === 'specs')) {
    return [{ tipo: 'specs', pares: produto.specs }, ...blocos];
  }
  return [...blocos];
}
