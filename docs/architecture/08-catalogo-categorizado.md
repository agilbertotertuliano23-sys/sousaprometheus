# 08 — Catálogo categorizado e modelo de apresentação

Decisão de origem: [ADR-007](decisions/adr-007-catalogo-categorizado-e-apresentacao-rica.md).
Este documento é a especificação do modelo de dados novo. A fonte da verdade em
código é `src/data/tipos.ts`; o que segue é a proposta a implementar (épico E2).

## 1. Visão

```
Nicho
 ├─ categorias: Categoria[]        (curadas, ordenadas — navegação da vitrine)
 ├─ entrada: {...}                 (conteúdo da capa editorial — tela 1)
 ├─ variantes: { b?: RegraVariante }   (?c= reordena)
 ├─ ofertas: Record<id, RegraOferta>   (?o= tarja + CTA)
 └─ produtos: Produto[]
      ├─ categoria: string        (→ Categoria.id; ausente → "_outros")
      ├─ prioridade: number       (0..100, default 50 — ordena + elege herói)
      ├─ galeria: ItemMidia[]     (imagens + vídeos 9:16)
      ├─ beneficios: string[]
      ├─ specs: ParSpec[]
      └─ blocos: BlocoApresentacao[]   (union por `tipo` — render por registry)
```

## 2. Interfaces TypeScript propostas

```ts
// ─────────────────────────────────────────────────────────────────
// src/data/tipos.ts  (proposta E2 — tudo que é novo está marcado NOVO)
// ─────────────────────────────────────────────────────────────────

/** Item de mídia da galeria e de blocos de mídia. */              // NOVO
export interface ItemMidia {
  tipo: 'imagem' | 'video';
  /** imagem: relativo a src/assets/catalog/<slug>/.
   *  video: URL absoluta servida de public/ (ex.: /nichos/<slug>/<sku>.mp4). */
  src: string;
  /** obrigatório quando tipo === 'video'. Relativo a src/assets/catalog/<slug>/. */
  poster?: string;
  /** texto alternativo — obrigatório (a11y, RNF-07). */
  alt: string;
}

/** Par chave-valor de especificação. */                           // NOVO
export interface ParSpec {
  chave: string;
  valor: string;
}

/** Categoria dentro de um nicho. */                               // NOVO
export interface Categoria {
  /** [a-z][a-z0-9-]+ ; único no nicho; referenciado por Produto.categoria. */
  id: string;
  /** rótulo exibido na trilha e no cabeçalho da seção. */
  rotulo: string;
  /** rótulo mono curto acima do título (ex.: "SELEÇÃO"). Opcional. */
  kicker?: string;
  /** 1 frase editorial na "capa" da categoria. Opcional. */
  descricao?: string;
  /** menor = mais cedo na trilha. Default: ordem de declaração no array. */
  ordem?: number;
}

// ── Blocos de apresentação — union discriminada por `tipo` ──────── // NOVO

interface BlocoBase {
  /** âncora opcional para deep-link dentro do detalhe (#<sku>-<id>). */
  id?: string;
}

export interface BlocoTexto extends BlocoBase {
  tipo: 'texto';
  titulo?: string;
  /** parágrafos em texto puro. Sem HTML (segurança na reescrita client-side). */
  corpo: string[];
}

export interface BlocoMidia extends BlocoBase {
  tipo: 'midia';
  titulo?: string;
  itens: ItemMidia[];
  legenda?: string;
}

export interface BlocoDepoimento extends BlocoBase {
  tipo: 'depoimento';
  citacao: string;
  autor: string;
  /** "compradora verificada", cidade, data — texto livre curto. */
  contexto?: string;
  /** 1..5. Opcional. */
  nota?: number;
  /** asset relativo a src/assets/catalog/<slug>/. Opcional. */
  avatar?: string;
}

export interface BlocoComoUsar extends BlocoBase {
  tipo: 'como-usar';
  titulo?: string;
  passos: Array<{ titulo: string; descricao?: string; midia?: ItemMidia }>;
}

export interface BlocoComparativo extends BlocoBase {
  tipo: 'comparativo';
  titulo?: string;
  /** cabeçalhos das colunas (a 1ª costuma ser ""). */
  colunas: string[];
  linhas: Array<{ rotulo: string; valores: string[] }>;
}

export interface BlocoBonus extends BlocoBase {
  tipo: 'bonus';
  titulo?: string;
  itens: Array<{ nome: string; descricao?: string; valorCentavos?: number }>;
}

export interface BlocoFaq extends BlocoBase {
  tipo: 'faq';
  titulo?: string;
  itens: Array<{ pergunta: string; resposta: string }>;
}

export interface BlocoSpecs extends BlocoBase {
  tipo: 'specs';
  titulo?: string;
  pares: ParSpec[];
}

export type BlocoApresentacao =
  | BlocoTexto
  | BlocoMidia
  | BlocoDepoimento
  | BlocoComoUsar
  | BlocoComparativo
  | BlocoBonus
  | BlocoFaq
  | BlocoSpecs;

export type TipoBloco = BlocoApresentacao['tipo'];

// ── Produto ─────────────────────────────────────────────────────

export interface Produto {
  sku: string;
  nome: string;
  descricaoCurta: string;
  precoCentavos: number;
  precoDeCentavos?: number;
  /** capa: LCP, fallback sem-JS, base do OG. Relativo a src/assets/catalog/<slug>/. */
  imagem: string;
  video?: string;
  poster?: string;
  url: string;
  tags?: string[];
  /** herói manual da vitrine + borda de acento. */
  destaque?: boolean;

  /** id de uma Categoria do nicho. Ausente/inválido → categoria "_outros". */   // NOVO
  categoria?: string;
  /** 0..100, default 50. Score curado: ordena na categoria + elege herói. */    // NOVO
  prioridade?: number;
  /** galeria rica. Ausente → derivada de [imagem, (video)]. */                  // NOVO
  galeria?: ItemMidia[];
  /** bullets de benefício no topo do detalhe. */                               // NOVO
  beneficios?: string[];
  /** atalho: vira um BlocoSpecs no topo dos blocos se `blocos` não trouxer um. */ // NOVO
  specs?: ParSpec[];
  /** blocos declarativos, renderizados na ordem no detalhe. */                  // NOVO
  blocos?: BlocoApresentacao[];
}

// ── Regras de variação ──────────────────────────────────────────

/** Reordenação por bucket de criativo (?c=). */                    // NOVO (estende criativo.ts)
export interface RegraVariante {
  /** nova ordem de categorias por id. */
  ordemCategorias?: string[];
  /** nova ordem de produtos por sku (aplicada dentro de cada categoria). */
  ordem?: string[];
  /** sku que vira herói da vitrine. */
  destaque?: string;
  /** sobrescreve a chamada da tela de entrada. */
  chamadaEntrada?: string;
}

/** Efeito de uma oferta (?o=). */                                  // NOVO (estende oferta.ts)
export interface RegraOferta {
  /** texto da tarja/selo global. */
  selo: string;
  /** troca o rótulo do CTA de saída. Opcional. */
  cta?: string;
  /** teaser exibido também na tela de entrada. Opcional. */
  teaserEntrada?: string;
}

// ── Nicho ───────────────────────────────────────────────────────

export interface Nicho {
  slug: string;
  nome: string;
  titulo: string;
  subtitulo: string;
  acento: string;
  cta: string;
  produtos: Produto[];
  og?: { titulo?: string; descricao?: string; imagem?: string };

  /** categorias curadas, na ordem de navegação. Ausente → trilha única sintética. */ // NOVO
  categorias?: Categoria[];
  /** conteúdo da tela de entrada (capa editorial). Tudo opcional, com defaults. */   // NOVO
  entrada?: {
    /** ex.: "VITRINE Nº 07". Default: "VITRINE · " + nome. */
    kicker?: string;
    /** sku que sangra na capa. Default: herói da vitrine. */
    heroiSku?: string;
    /** ex.: "a partir de R$ 39,90". Default: derivado do menor preço. */
    teaserPreco?: string;
    /** rótulo do CTA da capa. Default: "Ver a vitrine". */
    chamada?: string;
  };
  /** regra por bucket de criativo. Sem `b` → variante 'b' idêntica à 'a'. */          // NOVO
  variantes?: { b?: RegraVariante };
  /** regra por oferta. Chave = id passado em ?o=. `?o=` sem entrada = silencioso. */  // NOVO
  ofertas?: Record<string, RegraOferta>;
}

/** Inalterado. */
export interface ContextoPersonalizacao {
  nicho: string;
  criativo: string | null;
  oferta: string | null;
  variante: 'a' | 'b';
}
```

## 3. Diff conceitual vs. `src/data/tipos.ts` atual

### Adiciona

| Onde | Campo | Tipo | Nota |
|---|---|---|---|
| `Produto` | `categoria` | `string?` | → `Categoria.id` |
| `Produto` | `prioridade` | `number?` | 0..100, default 50 |
| `Produto` | `galeria` | `ItemMidia[]?` | derivada se ausente |
| `Produto` | `beneficios` | `string[]?` | |
| `Produto` | `specs` | `ParSpec[]?` | atalho para `BlocoSpecs` |
| `Produto` | `blocos` | `BlocoApresentacao[]?` | union por `tipo` |
| `Nicho` | `categorias` | `Categoria[]?` | trilha única se ausente |
| `Nicho` | `entrada` | objeto | defaults derivados |
| `Nicho` | `variantes` | `{ b?: RegraVariante }?` | estende contrato de `criativo.ts` |
| `Nicho` | `ofertas` | `Record<string, RegraOferta>?` | estende contrato de `oferta.ts` |
| novo | `Categoria`, `ItemMidia`, `ParSpec`, `Bloco*`, `BlocoApresentacao`, `TipoBloco`, `RegraVariante`, `RegraOferta` | — | interfaces novas |

### Vira opcional / muda de papel

- **Nada obrigatório vira opcional.** Todos os campos atuais de `Produto` e
  `Nicho` continuam com a mesma obrigatoriedade. `imagem` **continua
  obrigatório** — é a capa/LCP/OG e a 1ª entrada da galeria derivada.
- `Produto.video` / `Produto.poster` passam a ser **redundantes quando há
  `galeria`** (a galeria já pode conter o vídeo), mas seguem aceitos e usados
  pelo card sem-JS.
- `Produto.destaque` ganha um segundo dono: além da borda de acento, é o
  override manual do herói da vitrine (antes o "herói" não existia como conceito).

### Compatibilidade com o `exemplo.ts` existente

O `exemplo.ts` atual (3 produtos, sem `categoria`, sem `blocos`) **continua
válido sem uma linha de mudança**:

- `resolverCategorias()` vê `nicho.categorias` ausente → cria a trilha única
  sintética `{ id: '_tudo', rotulo: nicho.nome }`.
- Cada produto sem `categoria` entra em `_tudo`.
- `prioridade` ausente → todos valem 50 → ordem = ordem do arquivo.
- `galeria` ausente → derivada: `[{ tipo:'imagem', src: imagem, alt: nome }]`
  (+ vídeo se houver).
- `blocos` ausente → o detalhe mostra só cabeçalho (nome, preço, descrição,
  benefícios/specs se houver) + galeria + CTA. Sem bloco nenhum, ainda é uma
  tela de detalhe válida.

A story E2 **atualiza** `exemplo.ts` para exercitar o schema novo (2 categorias,
1 produto com `galeria` + `blocos` de cada tipo), mas isso é para ter fixture —
não é exigência de compatibilidade.

## 4. Regras de resolução

Implementação proposta: `src/lib/catalogo/resolver.ts` (puro, sem DOM, usado no
build e reusado pelo client em `slots/*`).

### 4.1 Categorias efetivas

```
resolverCategorias(nicho, variante) -> Categoria[]
```

1. Base = `nicho.categorias ?? []`, ordenada por `ordem ?? índice`.
2. Se algum produto tem `categoria` ausente **ou** apontando um id inexistente
   → anexa `{ id: '_outros', rotulo: 'Mais itens' }` ao fim.
3. Se a base ficou vazia (nenhuma categoria declarada) → substitui tudo por
   `{ id: '_tudo', rotulo: nicho.nome }`; todos os produtos entram nela.
4. Se `variante === 'b'` e `nicho.variantes?.b?.ordemCategorias` existe →
   reordena por essa lista; ids não citados vão para o fim, na ordem anterior;
   `_outros`/`_tudo` sempre por último.

### 4.2 Produtos por categoria

```
produtosPorCategoria(nicho, variante) -> Map<idCategoria, Produto[]>
```

1. Agrupa os produtos pelo `categoria` (fallback `_outros` / `_tudo`).
2. Dentro do grupo, ordena por:
   1. `prioridade` desc (default 50);
   2. ordem de declaração no `produtos[]` (estável) como desempate.
3. Se `variante === 'b'` e `nicho.variantes?.b?.ordem` existe → aplica essa
   ordem por sku **dentro de cada grupo**; skus não citados seguem depois, na
   ordem do passo 2.
4. `prioridade` **não** move produto entre categorias — só ordena dentro.

### 4.3 Herói da vitrine

```
heroiDaVitrine(nicho, variante) -> Produto
```

Primeiro match:
1. `nicho.variantes?.b?.destaque` (quando `variante === 'b'`) resolve para um sku existente;
2. primeiro produto com `destaque === true` (na ordem do arquivo);
3. produto de maior `prioridade` da **primeira** categoria efetiva;
4. `produtos[0]`.

O herói também é o default de `entrada.heroiSku` (capa editorial).

### 4.4 Fallback quando um produto não tem categoria

Vai para `_outros` (categoria sintética, sempre no fim da trilha). Nunca é
descartado. `catalog validate` emite **aviso** (não erro) quando há produto sem
`categoria` num nicho que **declara** `categorias` — é provável esquecimento de
curadoria, mas não invalida o catálogo.

### 4.5 O que `?c=` (variante) pode reordenar

| Alvo | Campo | Efeito |
|---|---|---|
| ordem das categorias na trilha | `variantes.b.ordemCategorias` | 4.1 passo 4 |
| ordem dos produtos na vitrine | `variantes.b.ordem` | 4.2 passo 3 |
| herói da vitrine + herói da capa | `variantes.b.destaque` | 4.3 passo 1 |
| chamada (CTA) da tela de entrada | `variantes.b.chamadaEntrada` | texto do botão da capa |

Sem `variantes.b`, a variante `b` é idêntica à `a` (contrato já esboçado em
`src/lib/personalizacao/criativo.ts`, agora estendido).

### 4.6 Galeria efetiva

```
galeriaDe(produto) -> ItemMidia[]
```

- `produto.galeria` presente e não-vazia → usa como está.
- senão → `[{ tipo:'imagem', src: produto.imagem, alt: produto.nome }]`
  seguido de `{ tipo:'video', src: produto.video, poster: produto.poster, alt: produto.nome }`
  se `produto.video` existir.
- A **primeira** imagem da galeria é a capa (eager na vitrine quando o produto é
  o herói; `lazy` caso contrário). Vídeos são sempre `preload="none"` fora do
  card do herói (RNF-13).

### 4.7 Blocos efetivos

```
blocosDe(produto) -> BlocoApresentacao[]
```

- Se `produto.specs` existe e `produto.blocos` **não** contém um `BlocoSpecs` →
  prepend de `{ tipo:'specs', pares: produto.specs }`.
- Caso contrário, `produto.blocos ?? []` na ordem declarada.

## 5. O registry de blocos

### Fonte única do vocabulário

`src/lib/apresentacao/tipos-bloco.json`:

```json
["texto", "midia", "depoimento", "como-usar", "comparativo", "bonus", "faq", "specs"]
```

Lido por **dois** consumidores, sem acoplamento entre eles:

- `src/lib/apresentacao/registry.ts` — importa o JSON e mapeia cada tipo para o
  componente Astro:

  ```ts
  import BlocoTexto from '../../components/blocos/BlocoTexto.astro';
  import BlocoMidia from '../../components/blocos/BlocoMidia.astro';
  // ...
  import type { TipoBloco } from '../../data/tipos';

  export const REGISTRY: Record<TipoBloco, any> = {
    'texto': BlocoTexto,
    'midia': BlocoMidia,
    'depoimento': BlocoDepoimento,
    'como-usar': BlocoComoUsar,
    'comparativo': BlocoComparativo,
    'bonus': BlocoBonus,
    'faq': BlocoFaq,
    'specs': BlocoSpecs,
  };
  ```

- `scripts/console/lib.mjs` — `JSON.parse(readFileSync('src/lib/apresentacao/tipos-bloco.json'))`
  para validar `tipo:` no `catalog validate` sem importar TS (ADR-005).

### Onde o registry é usado

`src/components/blocos/RenderBlocos.astro` recebe `blocos: BlocoApresentacao[]` +
`slug`, itera, e para cada um resolve `REGISTRY[bloco.tipo]`:

```astro
---
import { REGISTRY } from '../../lib/apresentacao/registry';
const { blocos, slug } = Astro.props;
---
{blocos.map((b) => {
  const Comp = REGISTRY[b.tipo];
  return Comp ? <Comp bloco={b} slug={slug} /> : null;  // tipo fora do vocabulário: nada (DEV: warn)
})}
```

### Adicionar um tipo de bloco (extensibilidade — RNF-14)

1. Nova interface `Bloco<Tipo> extends BlocoBase` + entrada na union `BlocoApresentacao` em `tipos.ts`.
2. `src/components/blocos/Bloco<Tipo>.astro` (Astro puro, sem ilha, funciona sem JS).
3. Uma linha em `tipos-bloco.json`.
4. Uma linha em `registry.ts`.
5. (Se a reescrita client-side de `?n=` precisar recriar o bloco) um caso em
   `src/lib/personalizacao/slots/detalhe.ts` — ou, melhor, clonar do `<template>`
   já buildado.

Nenhum arquivo de núcleo (`contexto.ts`, `telas.ts`, `resolver.ts`, páginas)
muda. É o teste de "zero coupling" para esta feature.

## 6. Impacto no console (`catalog validate`)

`scripts/console/lib.mjs#lerNicho` passa a extrair, além do que já lê:

- região `categorias:` → lista de `id:` declarados;
- por produto: `categoria:`, `prioridade:`;
- região `blocos:` de cada produto → lista de `tipo:` e de `src:` / `avatar:` / `poster:`.

`commands/catalog.mjs` passa a checar:

| Checagem | Nível |
|---|---|
| `produto.categoria` não está entre os ids declarados | **erro** |
| produto sem `categoria` num nicho que declara `categorias` | aviso |
| `prioridade` presente e não é inteiro em `0..100` | **erro** |
| `tipo` de bloco fora de `tipos-bloco.json` | **erro** |
| `src` / `avatar` / `poster` de galeria/bloco não existe no disco | **erro** |
| `?o=` divulgado sem entrada em `nicho.ofertas` | (fora — não dá para saber no build) |

Profundidade estrutural (campos obrigatórios de cada bloco, forma da union) fica
com `astro check` + `src/lib/catalogo/validar.ts` — `validarNicho(n: Nicho):
string[]`, função pura sem dependências, chamada em DEV no carregamento do índice
(`throw` em DEV com as mensagens concatenadas). Ver R-04: o scanner de texto
endurece com o tempo; o backstop de tipo cobre o resto.

> Nota de implementação (E2-03): o caminho é `src/lib/catalogo/validar.ts` (ao
> lado de `resolver.ts` — ambos lógica pura de catálogo, mesmo consumidor no
> E3), não `src/data/validar.ts`. Decisão registrada na story E2-03.
