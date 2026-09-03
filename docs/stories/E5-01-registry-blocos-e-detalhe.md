# E5-01 — Registry vivo + `RenderBlocos` + blocos `texto`/`midia`/`depoimento` + `DetalheProduto`

**Épico:** [E5](../epics/E5-camada-de-apresentacao-rica.md) · **Estado:** 🔵 detalhada — **pegar primeiro** (E6-01 consome `DetalheProduto`)
**Esforço:** M (1–3 dias)
**Depende de:** E2-03 ✔ (schema ADR-007 + `resolver.ts` + `registry.ts` com 8 chaves `null` + fixture `exemplo.ts`)
**Destrava:** E5-02, E5-03, E6-01

**Requisitos cobertos:**
RF-14 (14.1 render na ordem, 14.3 registry resolve `tipo → componente`, 14.5 *parte runtime* — `RenderBlocos` ignora com `warn` em DEV, 14.6 blocos declarativos sem estado/sem JS),
RF-13.1 (benefícios `<ul>` no topo do detalhe),
RF-12.4 *(versão simples — pilha)*, RF-04.3 (CTA de saída no detalhe),
RNF-03 (nada de JS bloqueante), RNF-04 (funciona sem JS), RNF-06 (toque ≥ 44px no CTA/voltar), RNF-07 (contraste sobre `--acento`), RNF-08 (`prefers-reduced-motion`), RNF-14 (preenche 3 linhas do registry sem tocar núcleo).

**Arquivos-guia (ler antes de implementar):**
- [architecture/09](../architecture/09-fluxo-de-telas-e-apresentacao.md) — **§4** ("Novos": `RenderBlocos`, `DetalheProduto`, `Bloco<Tipo>`), **§2** (degradação sem JS — linha "Detalhe" e "CTA de saída")
- [architecture/08](../architecture/08-catalogo-categorizado.md) — **§2** (forma dos blocos `BlocoTexto`/`BlocoMidia`/`BlocoDepoimento`, `ItemMidia`), **§4.6/§4.7** (`galeriaDe`/`blocosDe` — já implementados, só consumir), **§5** (o registry e o checklist RNF-14)
- [ADR-007](../architecture/decisions/adr-007-catalogo-categorizado-e-apresentacao-rica.md) — item 3
- [prd/02-requisitos](../prd/02-requisitos.md) — RF-14, RF-13, RF-12.4, RF-04.3, RNF-03/04/06/07/08/14
- [design/01-fundamentos](../design/01-fundamentos.md) + [design/tokens.css](../design/tokens.css) — escala, `--acento`, `--toque-min`, `--largura-pagina`
- Código a consumir (NÃO reescrever): `src/lib/catalogo/resolver.ts` (`galeriaDe`, `blocosDe`), `src/lib/apresentacao/registry.ts` (`REGISTRY`, `TIPOS_BLOCO`), `src/lib/catalogo/carregar.ts` (`urlAsset`), `src/lib/utils.ts` (`formatarPreco`, `percentualDesconto`), `src/data/tipos.ts` (tipos dos blocos), `src/data/nichos/exemplo.ts` (fixture), `src/components/CardProduto/CardProduto.astro` + `src/components/VideoVertical/VideoVertical.astro` (referência de estilo/markup)

---

## Contexto

O schema ADR-007 e a resolução pura já estão em código (E2-03). `blocosDe(produto)`
devolve a lista de blocos na ordem (com o `BlocoSpecs` sintético quando há
`produto.specs`); `galeriaDe(produto)` devolve a galeria efetiva. **Nada renderiza
isso ainda** — `REGISTRY` tem as 8 chaves com valor `null`.

Esta story entrega a **camada de render de blocos** e a **casca do detalhe do
produto**, tudo Astro puro, estático, funcionando sem JS. É a superfície de menor
risco de E5: sem ilha, sem estado, sem navegação. Cobre **só 3 tipos de bloco**
(`texto`, `midia`, `depoimento`); os outros 5 continuam `null` no registry e são
deliberadamente exercitados aqui como prova de que `RenderBlocos` **ignora com
aviso** um tipo sem componente (RF-14.5 runtime).

A galeria do detalhe entra numa **versão mínima** (capa + pilha vertical). A
`GaleriaMidia` rica (scroll-snap + dots + religar vídeo) e o `BlocoSpecs`
dedicado + o `<dl>` de specs são **E5-02**. Os blocos `como-usar`, `comparativo`,
`bonus`, `faq` são **E5-03**.

Esta story **não liga nada em `src/pages/index.astro`** — isso é E6-01. Para ver
os componentes, entrega uma rota **só de desenvolvimento** (`/dev/detalhe`) que
**não é gerada no build de produção**.

### História

> Como **dev de UI prestes a montar a tela de detalhe rica**, quero um
> `RenderBlocos.astro` que resolva `tipo → componente` pelo `REGISTRY` e os 3
> componentes de bloco mais simples já prontos, mais um `DetalheProduto.astro`
> que empilhe galeria + nome + benefícios + blocos — para poder desenvolver E6-01
> consumindo um componente estável, e para E5-02/E5-03 só preencherem as linhas
> que faltam no registry sem reabrir a arquitetura de render.

> Como **operador que roda `npm run build`**, quero que um `tipo` de bloco sem
> componente (registry `null`) **não quebre o build nem a página** — só suma da
> renderização, com um `console.warn` em DEV — para a introdução incremental de
> tipos (E5-02/03) ser segura.

---

## Critérios de aceite

Numerados e verificáveis. Onde há comando, o comando **é** o critério.

### Registry (`src/lib/apresentacao/registry.ts`)

1. `REGISTRY` passa a mapear **3** chaves para componentes Astro reais:
   `texto → BlocoTexto`, `midia → BlocoMidia`, `depoimento → BlocoDepoimento`
   (imports de `../../components/blocos/Bloco*.astro`). As **outras 5**
   (`como-usar`, `comparativo`, `bonus`, `faq`, `specs`) continuam `null`.
2. O tipo exportado continua `Record<TipoBloco, unknown>` — as 8 chaves seguem
   presentes; `TIPOS_BLOCO` e o import de `./tipos-bloco.json` **não mudam**. O
   comentário de topo é atualizado: E5-01 preencheu 3, faltam `specs` (E5-02) e
   `como-usar`/`comparativo`/`bonus`/`faq` (E5-03).
3. `registry.ts` **não** ganha nenhum outro import nem lógica. Nenhum arquivo de
   núcleo (`resolver.ts`, `validar.ts`, `tipos.ts`, `contexto.ts`, páginas) é
   tocado (RNF-14 — `git diff --stat` prova).

### `RenderBlocos.astro` (`src/components/blocos/RenderBlocos.astro`)

4. Props: `{ blocos: BlocoApresentacao[]; slug: string }`. Sem outras props
   obrigatórias.
5. Itera `blocos` na ordem recebida; para cada bloco resolve
   `const Comp = REGISTRY[bloco.tipo]`:
   - `Comp` truthy → renderiza `<Comp bloco={bloco} slug={slug} />`;
   - `Comp` nullish → **não renderiza nada** para esse bloco e, **sob
     `import.meta.env.DEV`**, emite
     `console.warn` mencionando `bloco.tipo` e que não há componente registrado.
6. Nunca lança. Um `blocos` vazio renderiza vazio (nenhum wrapper obrigatório).
7. Não importa nenhum `Bloco*.astro` diretamente — só `REGISTRY`. (O acoplamento
   tipo→componente vive **só** no registry, RNF-14.)

### Componentes de bloco (`src/components/blocos/`)

8. `BlocoTexto.astro` — props `{ bloco: BlocoTexto; slug?: string }`. Renderiza,
   dentro de um `<section class="bloco bloco-texto">` (com `id={bloco.id}` quando
   houver): `bloco.titulo` como `<h3>` **se presente**; cada string de
   `bloco.corpo` como um `<p>`. Texto puro — **nada de `set:html`** (RF-14.6 /
   ADR-007 alternativa D).
9. `BlocoMidia.astro` — props `{ bloco: BlocoMidia; slug: string }`. Para cada
   `ItemMidia` de `bloco.itens`:
   - `tipo === 'imagem'` → `<img src={urlAsset(slug, item.src)} alt={item.alt}
     loading="lazy" decoding="async">`, `aspect-ratio: 9/16`, `object-fit: cover`;
   - `tipo === 'video'` → `<video controls preload="none"
     poster={item.poster ? urlAsset(slug, item.poster) : undefined}
     src={urlAsset(slug, item.src)} playsinline aria-label={item.alt}>` (vídeo de
     bloco **não** faz autoplay — é `controls`, RNF-05 + degradação §2).
   - `bloco.titulo` como `<h3>` se presente; `bloco.legenda` como `<p class="legenda">` se presente.
   - Layout: pilha vertical, `gap` da escala. Sem scroll-snap nesta story (isso é `GaleriaMidia`, E5-02).
10. `BlocoDepoimento.astro` — props `{ bloco: BlocoDepoimento; slug: string }`.
    `<figure class="bloco bloco-depoimento">`: `bloco.citacao` num
    `<blockquote>`; `<figcaption>` com `bloco.autor` (obrigatório), `bloco.contexto`
    se presente, `bloco.avatar` (se presente) como `<img
    src={urlAsset(slug, bloco.avatar)} alt="" width="40" height="40"
    loading="lazy">`, e `bloco.nota` (se presente) como estrelas com
    `aria-label={`nota ${n} de 5`}` — clampar `n` a `0..5` inteiro antes de
    repetir o caractere.
11. Os 3 componentes: sem `<script>`, sem import de framework, sem dependência
    nova. Usam **só** tokens de `src/styles/tokens.css` (`--sp-*`, `--fs-*`,
    `--linha`, `--superficie`, `--texto-fraco`, `--raio*`, `--acento`,
    `--acento-texto`). Nenhum token novo em `docs/design/tokens.css` (se algum
    primitivo faltar mesmo, adicionar em `docs/design/tokens.css` **e** na cópia
    `src/styles/tokens.css` — as duas — e registrar no PR; preferir reusar).
12. Toda animação/transição declarada nos blocos fica sob
    `@media (prefers-reduced-motion: no-preference)` **ou** depende só do reset
    global de `global.css` (que já zera `transition`/`animation` sob `reduce`).

### `DetalheProduto.astro` (`src/components/Detalhe/DetalheProduto.astro`)

13. Props: `{ produto: Produto; slug: string; cta: string }`.
14. Renderiza um `<article class="detalhe" data-sku={produto.sku}>` contendo, **nesta ordem**:
    1. **Galeria (versão simples — E5-02 substitui):** `const g = galeriaDe(produto)`.
       `g[0]` como imagem/`<video controls>` de capa; `g.slice(1)` empilhado
       abaixo (mesmas regras de mídia do CA 9). Tudo `loading="lazy"` /
       `preload="none"` — **nada eager** no detalhe (RNF-13). Envolver num
       `<div class="detalhe-galeria" data-slot="detalhe-galeria">` com um
       comentário `<!-- E5-02: trocar por <GaleriaMidia> -->`.
    2. **Nome:** `<h2 class="detalhe-nome" data-slot="detalhe-nome">{produto.nome}</h2>`.
    3. **Preço:** `formatarPreco(produto.precoCentavos)` + `<s>` do
       `precoDeCentavos` quando maior + tarja `-{percentualDesconto(...)}%` quando
       `> 0` (mesma semântica do `CardProduto`).
    4. **Benefícios:** se `produto.beneficios?.length`, um
       `<ul class="detalhe-beneficios">` com um `<li>` por item. Ausente → não
       renderiza o `<ul>`.
    5. **Blocos:** `<RenderBlocos blocos={blocosDe(produto)} slug={slug} />`.
    6. **CTA de saída:** `<a class="detalhe-cta" href={produto.url}
       target="_blank" rel="noopener nofollow" data-sku={produto.sku}>{cta} ›</a>`
       — `min-height: var(--toque-min)`, fundo `--acento`, texto AA (usar
       `--acento-texto`/texto escuro se o par reprovar — RNF-07). `position:
       sticky; bottom: 0` é aceitável (degrada limpo sem JS).
    7. **Voltar:** `<a class="detalhe-voltar" href="#tela-vitrine"
       data-ir="vitrine">← Voltar à vitrine</a>` — `min-height:
       var(--toque-min)`. (O `data-ir` é hook inerte para E6-02.)
15. `DetalheProduto` **não** renderiza o `<dl>` de specs nem um `BlocoSpecs`
    dedicado — quando `blocosDe` devolver um bloco `tipo:'specs'` (fixture:
    `exemplo-02`, `exemplo-04`), `RenderBlocos` o **ignora com `warn`** (registry
    `specs === null`). Isso é **esperado** nesta story; E5-02 preenche.
16. `DetalheProduto` não tem `<script>` nem dependência nova. Funciona 100% sem
    JS (RNF-04): imagens visíveis, `<video controls>` operável, CTA de saída é
    `<a>` nativo.
17. O elemento raiz **não** inclui `id="produto-<sku>"` — a âncora por produto é
    responsabilidade de E6-01 (que envolve cada `DetalheProduto` num
    `<article id="produto-<sku>">`). `DetalheProduto` expõe só `data-sku`.

### Rota de desenvolvimento (`src/pages/dev/[amostra].astro`)

18. Arquivo novo, **rota dinâmica** cujo `getStaticPaths()`:
    - retorna `[]` quando `!import.meta.env.DEV` → **nenhuma página gerada em
      `astro build`**;
    - retorna `[{ params: { amostra: 'detalhe' } }]` em `astro dev`.
19. Em `astro dev`, `GET /dev/detalhe` renderiza, dentro de `<main class="pagina">`,
    um `<article id="produto-<sku>">` por produto de `NICHOS['exemplo']`, cada um
    com `<DetalheProduto produto={p} slug="exemplo" cta={exemplo.cta} />`. É só
    andaime de visualização — não precisa de estilo além do herdado.
20. `npm run build` **não** cria `dist/dev/**` (verificar: `dist/dev` não existe).
    As rotas `/`, `/404.html`, `/n/exemplo/`, `/sitemap.xml` continuam geradas e
    íntegras; o conteúdo de `dist/index.html` não muda de forma observável —
    E5-01 não toca `index.astro` nem seus imports.

### Verificação funcional (sem runner de teste)

21. `npm run dev` sobe sem erro. Em `/dev/detalhe`:
    - aparecem **5 artigos** (um por produto do `exemplo`);
    - `exemplo-01` mostra os blocos **`texto`** ("Por que ele bombou"), **`midia`**
      ("De perto", com `<img>` + `<video controls>`) e **`depoimento`** (citação
      de "Marina R.", 5 estrelas, avatar);
    - `exemplo-01` e `exemplo-04` mostram o `<ul>` de benefícios;
    - os blocos **`como-usar`**, **`faq`** (`exemplo-02`), **`comparativo`**,
      **`bonus`** (`exemplo-03`) e **`specs`** (`exemplo-02` via prepend,
      `exemplo-04` explícito) **não aparecem**; o console do navegador mostra um
      `console.warn` de `RenderBlocos` para **cada** um desses blocos ignorados;
    - nenhuma exceção no terminal do `astro dev` nem no console do navegador.
22. Com JS desabilitado no navegador, `/dev/detalhe` continua legível: imagens,
    `<video controls>`, textos e o `<a>` de saída funcionam (RNF-04).

### Portão final

23. Os quatro comandos, do zero, passam nesta ordem, todos **exit 0**:
    ```
    npm run validate      # catalog validate — exemplo íntegro (aviso do produto órfão exemplo-05 é esperado)
    npm run typecheck      # astro check — strict, sem erro nem warning novo
    npm run build          # prebuild roda o validate; astro build gera / , /404.html , /n/exemplo/ , /sitemap.xml ; NADA em dist/dev
    npm run doctor         # ambiente ok
    ```
    `npm run dev` sobe sem erro (CA 21).
24. `git diff --stat` mostra alteração/criação **apenas** em:
    `src/lib/apresentacao/registry.ts` (3 linhas),
    `src/components/blocos/RenderBlocos.astro` (novo),
    `src/components/blocos/BlocoTexto.astro` (novo),
    `src/components/blocos/BlocoMidia.astro` (novo),
    `src/components/blocos/BlocoDepoimento.astro` (novo),
    `src/components/Detalhe/DetalheProduto.astro` (novo),
    `src/pages/dev/[amostra].astro` (novo),
    e docs (`docs/stories/README.md`, este arquivo, `docs/ESTADO-ATUAL.md`).
    **Nada** em `src/data/*`, `src/lib/catalogo/*`, `src/lib/personalizacao/*`,
    `src/lib/navegacao/`, `src/pages/index.astro`, `src/pages/n/[slug].astro`,
    `src/layouts/Base.astro`, `src/components/GradeCatalogo/`,
    `src/components/CardProduto/`.

---

## Plano de tarefas (ordenado, arquivo por arquivo)

> Sequência pensada para manter `astro check` verde a cada passo.

### Tarefa 1 — `src/components/blocos/BlocoTexto.astro` (novo)

```astro
---
import type { BlocoTexto } from '../../data/tipos';
interface Props { bloco: BlocoTexto; slug?: string }
const { bloco } = Astro.props;
---
<section class="bloco bloco-texto" id={bloco.id}>
  {bloco.titulo && <h3 class="bloco-titulo">{bloco.titulo}</h3>}
  {bloco.corpo.map((p) => <p>{p}</p>)}
</section>
<style>
  .bloco { margin-block: var(--sp-6); }
  .bloco-titulo { font-size: var(--fs-2); margin-bottom: var(--sp-2); }
  .bloco-texto p { color: var(--texto); margin: var(--sp-2) 0; }
</style>
```

### Tarefa 2 — `src/components/blocos/BlocoMidia.astro` (novo)

Props `{ bloco: BlocoMidia; slug: string }`. Iterar `bloco.itens`; `urlAsset(slug, …)`
para `src`/`poster`. Imagem `loading="lazy" decoding="async"`; vídeo
`controls preload="none" playsinline` (nunca `autoplay`). `titulo` → `<h3>`,
`legenda` → `<p class="legenda">` (`color: var(--texto-fraco); font-size: var(--fs-00)`).
Cada mídia `aspect-ratio: 9/16; object-fit: cover; border-radius: var(--raio-sm);
background: var(--superficie-alta)`.

### Tarefa 3 — `src/components/blocos/BlocoDepoimento.astro` (novo)

Props `{ bloco: BlocoDepoimento; slug: string }`. `<figure>` + `<blockquote>` +
`<figcaption>`. Avatar opcional (`urlAsset`, `alt=""`, `width/height=40`,
`loading="lazy"`, `border-radius: 999px`). Nota:
`const n = Math.max(0, Math.min(5, Math.round(bloco.nota ?? 0)))` e só renderiza o
bloco de estrelas se `bloco.nota != null`. `contexto` em `--texto-fraco`.

### Tarefa 4 — `src/components/blocos/RenderBlocos.astro` (novo)

```astro
---
import { REGISTRY } from '../../lib/apresentacao/registry';
import type { BlocoApresentacao } from '../../data/tipos';
interface Props { blocos: BlocoApresentacao[]; slug: string }
const { blocos, slug } = Astro.props;
---
{blocos.map((bloco) => {
  // REGISTRY é Record<TipoBloco, unknown>; E5-01 preenche texto/midia/depoimento.
  const Comp = REGISTRY[bloco.tipo] as any;
  if (!Comp) {
    if (import.meta.env.DEV) {
      console.warn(`[RenderBlocos] tipo "${bloco.tipo}" sem componente no REGISTRY — bloco ignorado (E5-02/E5-03 preenchem).`);
    }
    return null;
  }
  return <Comp bloco={bloco} slug={slug} />;
})}
```

O cast `as any` é local e comentado — o contrato tipado (`Record<TipoBloco,
unknown>`) fica no `registry.ts`; aqui a garantia é o `if (!Comp)`. `astro check`
aceita `any` explícito sob `strict`.

### Tarefa 5 — `src/lib/apresentacao/registry.ts` (alterar — 3 linhas + comentário)

```ts
import type { TipoBloco } from '../../data/tipos';
import VOCABULARIO from './tipos-bloco.json';
import BlocoTexto from '../../components/blocos/BlocoTexto.astro';
import BlocoMidia from '../../components/blocos/BlocoMidia.astro';
import BlocoDepoimento from '../../components/blocos/BlocoDepoimento.astro';

export const TIPOS_BLOCO = VOCABULARIO as readonly TipoBloco[];

export const REGISTRY: Record<TipoBloco, unknown> = {
  texto: BlocoTexto,
  midia: BlocoMidia,
  depoimento: BlocoDepoimento,
  'como-usar': null,   // E5-03
  comparativo: null,   // E5-03
  bonus: null,         // E5-03
  faq: null,           // E5-03
  specs: null,         // E5-02
};
```

Atualizar o comentário de topo: E5-01 preencheu `texto`/`midia`/`depoimento`.
Se `astro check` reclamar do import de `.astro` num `.ts`, confirmar que
`src/env.d.ts` / os tipos do Astro trazem `declare module '*.astro'` (trazem por
padrão via `astro/client`). **Não** adicionar shim manual sem necessidade.

### Tarefa 6 — `src/components/Detalhe/DetalheProduto.astro` (novo)

```astro
---
import type { Produto } from '../../data/tipos';
import { galeriaDe, blocosDe } from '../../lib/catalogo/resolver';
import { urlAsset } from '../../lib/catalogo/carregar';
import { formatarPreco, percentualDesconto } from '../../lib/utils';
import RenderBlocos from '../blocos/RenderBlocos.astro';

interface Props { produto: Produto; slug: string; cta: string }
const { produto, slug, cta } = Astro.props;
const galeria = galeriaDe(produto);
const blocos = blocosDe(produto);
const desconto = percentualDesconto(produto.precoCentavos, produto.precoDeCentavos);
---
<article class="detalhe" data-sku={produto.sku}>
  <div class="detalhe-galeria" data-slot="detalhe-galeria">
    {/* E5-02: trocar por <GaleriaMidia produto={produto} slug={slug} /> */}
    {galeria.map((m, i) => (
      m.tipo === 'video'
        ? <video controls preload="none" playsinline
                 src={urlAsset(slug, m.src)}
                 poster={m.poster ? urlAsset(slug, m.poster) : undefined}
                 aria-label={m.alt}></video>
        : <img src={urlAsset(slug, m.src)} alt={m.alt}
               loading="lazy" decoding="async" data-capa={i === 0 ? '' : undefined} />
    ))}
  </div>

  <h2 class="detalhe-nome" data-slot="detalhe-nome">{produto.nome}</h2>

  <div class="detalhe-preco">
    <strong>{formatarPreco(produto.precoCentavos)}</strong>
    {produto.precoDeCentavos && <s>{formatarPreco(produto.precoDeCentavos)}</s>}
    {desconto > 0 && <span class="tarja">-{desconto}%</span>}
  </div>

  {produto.beneficios?.length ? (
    <ul class="detalhe-beneficios">
      {produto.beneficios.map((b) => <li>{b}</li>)}
    </ul>
  ) : null}

  <RenderBlocos blocos={blocos} slug={slug} />

  <a class="detalhe-cta" href={produto.url} target="_blank"
     rel="noopener nofollow" data-sku={produto.sku}>{cta} ›</a>
  <a class="detalhe-voltar" href="#tela-vitrine" data-ir="vitrine">← Voltar à vitrine</a>
</article>
```

Estilos: `min-height: var(--toque-min)` em `.detalhe-cta`/`.detalhe-voltar`;
`.detalhe-cta` fundo `--acento`, cor de texto AA (checar par por nicho — RNF-07);
`.detalhe-galeria img, .detalhe-galeria video { width:100%; aspect-ratio:9/16;
object-fit:cover }`. Nada eager.

### Tarefa 7 — `src/pages/dev/[amostra].astro` (novo — rota só de DEV)

```astro
---
import Base from '../../layouts/Base.astro';
import DetalheProduto from '../../components/Detalhe/DetalheProduto.astro';
import { NICHOS } from '../../data/nichos';

export function getStaticPaths() {
  // Andaime de visualização: em `astro build` (produção) não gera nada.
  if (!import.meta.env.DEV) return [];
  return [{ params: { amostra: 'detalhe' } }];
}

const nicho = NICHOS.exemplo;
---
<Base titulo="DEV — DetalheProduto">
  <main class="pagina">
    {nicho.produtos.map((p) => (
      <article id={`produto-${p.sku}`} style="margin-block:2rem;border-top:1px solid var(--linha)">
        <DetalheProduto produto={p} slug={nicho.slug} cta={nicho.cta} />
      </article>
    ))}
  </main>
</Base>
```

Se `astro build` imprimir um aviso "getStaticPaths ... returned no paths" para
esta rota, é **aceitável** (não é erro; exit 0). Ver Riscos/nota 3.

### Tarefa 8 — Portão + docs

- `npm run validate && npm run typecheck && npm run build && npm run doctor` — exit 0 (CA 23).
- Confirmar `dist/dev` inexistente e `dist/index.html` inalterado (CA 20).
- `npm run dev` + roteiro do CA 21/22 no navegador (com e sem JS).
- `git diff --stat` confere o CA 24.
- Atualizar `docs/stories/README.md` — E5-01 → 🔵 detalhada; nota "dev pega E5-01 antes de E6-01".
- Atualizar `docs/ESTADO-ATUAL.md` ("O que NÃO existe ainda"): `RenderBlocos` +
  3 blocos + `DetalheProduto` implementados; `REGISTRY` com 3 de 8 chaves vivas.

---

## Definição de Pronto

- [ ] `npm run validate` / `npm run typecheck` / `npm run build` / `npm run doctor` — todos exit 0.
- [ ] `npm run dev` sobe; `/dev/detalhe` renderiza os 5 detalhes; blocos
      `texto`/`midia`/`depoimento` aparecem; os outros 5 tipos somem com
      `console.warn` (um por bloco). Nenhuma exceção.
- [ ] `dist/dev/**` não existe após `npm run build`. `/`, `/404.html`,
      `/n/exemplo/`, `/sitemap.xml` intactas; `dist/index.html` inalterado.
- [ ] Sem JS, `/dev/detalhe` continua legível e o `<a>` de saída funciona (RNF-04).
- [ ] `RenderBlocos` importa **só** `REGISTRY` (não importa nenhum `Bloco*.astro`).
- [ ] `REGISTRY` tem as 8 chaves; 3 apontam componente, 5 são `null`;
      `TIPOS_BLOCO` e `tipos-bloco.json` inalterados.
- [ ] Nenhuma dependência nova (`package.json` diff vazio). Nenhum `<script>` nos
      componentes desta story.
- [ ] `git diff --stat` não toca núcleo (`src/data/*`, `src/lib/catalogo/*`,
      `src/lib/personalizacao/*`, `src/lib/navegacao/`, `index.astro`,
      `n/[slug].astro`, `Base.astro`, `GradeCatalogo/`, `CardProduto/`).
- [ ] PR descreve: (a) decisão de caminho `blocos/` + `Detalhe/`; (b) galeria em
      versão simples com gancho `data-slot="detalhe-galeria"` para E5-02;
      (c) `specs` propositalmente ignorado até E5-02.

---

## Fora de escopo (fica para E5-02 / E5-03 / E6-01 / E6-02 / E3-01)

- **`GaleriaMidia.astro`** (scroll-snap horizontal + dots + `prefers-reduced-motion`
  + capa eager quando herói + religar vídeo) — **E5-02**. Nesta story a galeria do
  detalhe é capa + pilha vertical, com o gancho `data-slot="detalhe-galeria"`.
- **`BlocoSpecs.astro`** + o `<dl>` de specs no cabeçalho do detalhe + o
  refinamento visual de benefícios — **E5-02**. Até lá, `blocosDe` devolve o
  bloco `specs` e `RenderBlocos` o ignora (registry `null`).
- **`BlocoComoUsar` / `BlocoComparativo` / `BlocoBonus` / `BlocoFaq`** + preencher
  essas 4 chaves do registry — **E5-03**.
- **Ligar `DetalheProduto` na página** (seção `#tela-detalhe`, `<article
  id="produto-<sku>">`, trilha, vitrine, `index.astro`) — **E6-01**.
- **Navegação client-side** (`data-ir`, `telas.ts`, `pushState`, revelar/esconder
  telas, religar vídeo ao entrar no detalhe) — **E6-02**. Os `data-ir`/`data-slot`
  desta story são hooks inertes.
- **Reescrita por `?n=`** clonando `<template id="tpl-detalhe">` / `tpl-bloco-*` —
  **E3-01**. Esta story não cria nenhum `<template>`.
- **Botão de compartilhar** (Web Share) — **E4-04**.
- **Medição de peso/LCP em device** — **E2-02**.

---

## Riscos / notas de implementação

1. **Caminho dos componentes — divergência entre o handoff e os docs.**
   `[AUTO-DECISION]` O prompt de spawn sugeriu `src/components/apresentacao/`;
   **architecture/09 §4** e o **épico E5** dizem `src/components/blocos/`
   (RenderBlocos + `Bloco<Tipo>`) e `src/components/Detalhe/` (DetalheProduto,
   GaleriaMidia). → **Decisão: seguir os docs** (`blocos/` + `Detalhe/`). Motivo:
   os dois documentos de arquitetura concordam entre si, E3/E6 já referenciam
   `tpl-bloco-*`/`Detalhe` nesses termos, e o próprio spawn manda "confirmar/
   ajustar contra doc 09 e o épico E5". Se o time preferir `apresentacao/`, é um
   `git mv` + ajuste de 4 imports.

2. **`specs` fica `null` até E5-02 — não é bug.**
   `[AUTO-DECISION]` O spawn tem uma contradição interna (uma linha põe `specs`
   em E5-03, outra em E5-02). O **PLANO-PROXIMO-PASSO** (tabela) põe
   `GaleriaMidia + benefícios + specs (<dl> + BlocoSpecs)` em **E5-02** e
   `como-usar/comparativo/bonus/faq` em **E5-03**. → **Decisão: `BlocoSpecs` é
   E5-02.** Nesta story `RenderBlocos` ignora o bloco `specs` com `warn` — CA 21
   trata isso como comportamento esperado e o converte em prova viva do RF-14.5.

3. **`getStaticPaths` retornando `[]` em produção.**
   É o mecanismo escolhido para a rota `/dev/detalhe` **não** vazar para `dist/`.
   Astro aceita (zero páginas geradas); pode logar um aviso informativo no
   `build`. Não é erro, `npm run build` continua exit 0 (CA 23). Alternativas
   rejeitadas: `src/pages/_dev/…` (prefixo `_` também bloqueia no `astro dev` —
   não dá para visualizar); página fixa `dev/detalhe.astro` sem gate (vaza um
   `/dev/detalhe/` para produção). Se o aviso incomodar, o dev pode, localmente,
   importar `DetalheProduto` num rascunho sob `npm run dev` e reverter — mas a
   rota versionada é a entrega.

4. **Import de `.astro` dentro de `registry.ts` (`.ts`).**
   Funciona no pipeline do Astro/Vite e o `astro check` entende
   `declare module '*.astro'` (vem de `astro/client`). Foi deliberadamente adiado
   na E2-03 justamente para esta story (quando os componentes existem). Se
   `astro check` reclamar, verificar `src/env.d.ts` antes de qualquer shim.

5. **Sem runner de teste.** ADR-005 (zero-dep no console) + o app evita peso ⇒
   nada de vitest. A verificação é `astro check` + o roteiro manual do CA 21/22
   em `/dev/detalhe`. A cobertura determinística de `galeriaDe`/`blocosDe` já é
   handoff de `aiox-qa` desde E2-03 — esta story só as **consome**.

6. **Contraste sobre `--acento` (RNF-07).** O `exemplo` usa `#1E6FFF` (texto
   branco passa). O CTA do detalhe deve usar a mesma salvaguarda do card
   (`color:#fff`) e o dev anota que nichos de acento claro exigem `--acento-texto`
   / texto escuro — sem gate automático ainda (R-07).

7. **`<video controls>` nos blocos vs. `VideoVertical` (autoplay).**
   `BlocoMidia` e a galeria simples usam `<video controls preload="none">`
   (degradação §2: "Galeria = pilha de `<img>` + `<video controls>`"). O autoplay
   mudo com `IntersectionObserver` (`ligarVideoVertical`) é religado só na tela de
   detalhe ativa — isso é **E6-02**, não esta story.
</content>
</invoke>
