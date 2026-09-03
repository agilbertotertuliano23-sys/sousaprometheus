# E6-04 — `PortaCatalogo.astro` (a porta do catálogo — substitui `TelaEntrada`)

**Épico:** [E6](../epics/E6-fluxo-de-tres-telas.md) · **Estado:** 🔵 detalhada — **próxima de E6** (∥ E6-03)
**Esforço:** M (1–3 dias)
**Base:** [ADR-008](../architecture/decisions/adr-008-catalogo-como-pagina-rica-de-secoes.md) Fase 0, item 1 · [architecture/09](../architecture/09-fluxo-de-telas-e-apresentacao.md) §1, §2, §4
**Depende de:** E2-03 ✔ (`resolver.ts` + fixture). **Não** depende de E5.
**Destrava:** E6-05 (que reescreve o resto de `#tela-vitrine`), E3-01 (reescrita da porta por `?n=`)

**Requisitos cobertos:**
RF-15.1 (a `#tela-entrada` da seção única), **RF-15.5 revisto** (a tela de entrada é a **porta do catálogo**: kicker, título display, parágrafo de proposta, linha de organização, mosaico de capas, CTA — com defaults derivados de `nicho.entrada`),
RF-16.1/16.2 (a porta está no HTML buildado e navega por âncora sem JS), RF-12.3 / RNF-13 (só 1–2 capas do mosaico eager; resto `lazy`/`preload=none`),
RNF-04 (funciona sem JS), RNF-06 (CTA ≥ 44px), RNF-07 (contraste sobre `--acento`), RNF-08 (`prefers-reduced-motion`).

**NÃO cobre nesta story:** o Bloco 2 (trilhas), o Bloco 3 (informações), remover `VitrineFoco` — tudo **E6-05**. Reescrita por `?n=/?c=/?o=` — **E3**. `html.js` / esconder telas / `pushState` — já em **E6-02** (contrato intacto).

**Arquivos-guia (ler antes de implementar):**
- [architecture/09](../architecture/09-fluxo-de-telas-e-apresentacao.md) — **§1** (markup da seção única + "O que é buildado"), **§2** (linha "Porta" da degradação), **§4** (`PortaCatalogo` em "Novos"; `index.astro` em "Alterados")
- [ADR-008](../architecture/decisions/adr-008-catalogo-como-pagina-rica-de-secoes.md) — **item 1** (o que a porta apresenta)
- [architecture/08](../architecture/08-catalogo-categorizado.md) — **§4.1** (`resolverCategorias`), **§4.2** (`produtosPorCategoria`) — para o mosaico e a linha de organização
- [prd/02-requisitos](../prd/02-requisitos.md) — RF-15.5, RF-16, RNF-04/06/07/08/13
- [design/01-fundamentos](../design/01-fundamentos.md) + [design/tokens.css](../design/tokens.css) — `--fs-4`, `--acento`, `--toque-min`, escala `--sp-*`, `--tracking-label`
- Código a consumir (**não** reescrever): `src/lib/catalogo/resolver.ts` (`resolverCategorias`, `produtosPorCategoria`, `galeriaDe`, `prioridadeDe`), `src/lib/catalogo/carregar.ts` (`urlAsset`), `src/lib/utils.ts` (`formatarPreco`), `src/data/nichos.ts` (`NICHO_PADRAO`, `resolverNicho`)
- Código a alterar: `src/pages/index.astro` (só a `#tela-entrada`)
- Substitui: `src/components/TelaEntrada/TelaEntrada.astro` (de E6-01)

---

## Contexto

E6-01 entregou a `TelaEntrada.astro` como **capa editorial de um herói** (conceito
E4 do ADR-007). A [ADR-008](../architecture/decisions/adr-008-catalogo-como-pagina-rica-de-secoes.md)
Fase 0 mudou a direção: a tela de entrada não apresenta **um produto**, apresenta
**o catálogo** — a proposta ("o que tem aqui, e por que foi curado") e a
organização ("como está arrumado"), em copy + um mosaico de capas.

Esta story troca `TelaEntrada` por `PortaCatalogo` e reescreve **só** a
`<section id="tela-entrada">` de `index.astro`. O resto de `#tela-vitrine`
(`TrilhaCategorias` + `VitrineFoco` + `GradeCatalogo`) fica **como está** até
E6-05 — a página continua buildando e válida no meio do caminho.

A `PortaCatalogo` é **Astro puro, sem `<script>`, sem ilha**. Sem JS, é a 1ª
`<section>` da página longa; o CTA é uma âncora nativa para `#tela-vitrine`.

### História

> Como **visitante que veio de um anúncio no TikTok**, quero, ao abrir o link,
> entender em 1 segundo o que é esta vitrine, o que vou encontrar e como está
> organizada — vendo capas reais, não só um botão — para decidir entrar.

> Como **dono do produto**, quero que a porta se preencha sozinha a partir do
> nicho (título, número de categorias, capas dos produtos herói), com todo campo
> de `nicho.entrada` opcional, para publicar um nicho novo sem escrever a porta à
> mão.

---

## Decisões desta story

- **[AUTO-DECISION] D-14 (linha de organização).** Na Fase 0 **não há grupos nem
  estilos** (isso é Fase 1). A linha de organização diz:
  `"{K} produtos · {C} {categoria|categorias}"` onde `K = nicho.produtos.length`
  e `C = resolverCategorias(nicho, 'a').length`. Ex.: `"7 produtos · 3
  categorias"`. Se `C === 1` e a categoria é sintética (`id` começa com `_`), cai
  para só `"{K} produtos"`. Quando a Fase 1 entrar, a linha ganha `"· {G} grupos
  · {E} estilos"` — fora desta story.
- **[AUTO-DECISION] Mosaico.** 3 a 5 capas. Fonte: para cada categoria efetiva
  (ordem de `resolverCategorias`), a capa do **produto herói da categoria** =
  `produtosPorCategoria(nicho,'a').get(cat.id)?.[0]` (o 1º já vem ordenado por
  `prioridade` desc — doc 08 §4.2); `galeriaDe(heroiCat)[0]` como imagem. Se
  houver < 3 categorias, completa com os produtos de maior `prioridade` do nicho
  que ainda não entraram, até 4. Máx. 5. Sem categoria nenhuma → mosaico dos 3
  primeiros produtos.
- **[AUTO-DECISION] Eager vs lazy no mosaico.** As **2 primeiras** capas do
  mosaico são `loading="eager" fetchpriority="high"` (o LCP mora aqui); as demais
  `loading="lazy" decoding="async"`. É a **única** mídia eager da página inteira
  (RNF-13).
- **[AUTO-DECISION] Hash do CTA.** `href="#tela-vitrine"` (id de elemento real —
  navegação por âncora sem JS). E6-02 já intercepta `[data-ir="vitrine"]` e
  gerencia o hash curto (`#vitrine` + `location.search`). A porta **não** conhece
  o hash curto.
- **`TelaEntrada.astro` é removida** (não deixada `@deprecated`) — nada mais a
  consome depois que `index.astro` troca o import. Seu `<style>` útil migra para
  `PortaCatalogo`.

---

## Critérios de aceite

Numerados e verificáveis. Onde há comando, o comando **é** o critério.

### `PortaCatalogo.astro` (`src/components/Porta/PortaCatalogo.astro`) — novo

1. Props: `{ nicho: Nicho }`. Nenhuma outra. Sem `variante` (a variação por `?c=`
   é E3). Sem `<script>`, sem import de ilha, sem dependência nova.
2. Elemento raiz `<div class="porta">` (a `<section id="tela-entrada">` fica em
   `index.astro`, não aqui). Layout: coluna única, `max-width:
   var(--largura-pagina)`, centrada, respiro `var(--sp-6)`+.
3. **Kicker:** `nicho.entrada?.kicker ?? ('VITRINE · ' + nicho.nome.toUpperCase())`
   → `<p class="porta-kicker" data-slot="kicker">` — mono, `--tracking-label`,
   `--fs-00`.
4. **Título display:** `nicho.titulo` → `<h1 class="porta-titulo" data-slot="titulo">`
   — `font-size: var(--fs-4)`, `line-height: 1.05`.
5. **Parágrafo de proposta:** `nicho.entrada?.proposta ?? nicho.subtitulo` →
   `<p class="porta-proposta" data-slot="subtitulo">` — `--fs-0`, `max-width: 34ch`.
   Mantém o `data-slot="subtitulo"` que E3 já espera. `nicho.entrada.proposta` é
   campo **opcional** — se não existir em `tipos.ts`, ver CA 15.
6. **Linha de organização:** `<p class="porta-org" data-slot="entrada-org">` com o
   texto do D-14 acima. Números em `<span class="num">` (mono). Nunca renderiza
   string vazia.
7. **Mosaico:** `<ul class="porta-mosaico" aria-label="Amostra do catálogo">` com
   3–5 `<li><a class="porta-capa" href={`#cat-${cat.id}`} data-ir="vitrine">` (a
   capa vinda de "completar com produtos" linka `#produto-<sku>` com
   `data-ir="detalhe"`):
   - `<img>` com `src={urlAsset(nicho.slug, item.src)}`, `alt={item.alt}`,
     `width`/`height` **explícitos** (evita CLS), `aspect-ratio: 9/16`,
     `object-fit: cover`;
   - as **2 primeiras**: `loading="eager" fetchpriority="high" decoding="async"`;
   - as demais: `loading="lazy" decoding="async"`;
   - área tocável ≥ 44px (RNF-06).
   Layout: `display: grid`, 2–3 colunas, a 1ª capa ocupa 2 linhas
   (`grid-row: span 2`); sangra até a borda via wrapper full-bleed **ou**
   `margin-inline: calc(-1 * var(--sp-4))`.
8. **CTA:** `<a class="porta-cta" href="#tela-vitrine" data-ir="vitrine"
   data-slot="entrada-cta">{nicho.entrada?.chamada ?? 'Entrar no catálogo'} ›</a>`
   — `min-height: var(--toque-min)`, fundo `var(--acento)`, `color: #fff` (nota
   RNF-07: acentos claros vão precisar de `--acento-texto`/texto escuro — sem gate
   automático, R-07).
9. **Slot da tarja de oferta:** `<div class="porta-oferta" data-slot="entrada-oferta" hidden></div>`
   — ponto de inserção inerte para E3-03.
10. Todos os `data-slot` no HTML buildado: `kicker`, `titulo`, `subtitulo`,
    `entrada-org`, `entrada-cta`, `entrada-oferta`.

### Derivações e defaults

11. `PortaCatalogo` **nunca** quebra se `nicho.entrada` for `undefined` ou vazio:
    todo campo tem default derivado (CA 3–8). Testável: `resolverNicho` de um
    nicho sem `entrada` renderiza a porta inteira.
12. `nicho.entrada?.teaserPreco` **não** é renderizado nesta story — a porta da
    Fase 0 mostra a **linha de organização**, não preço. Fica como hook para E3.
13. O mosaico deriva 100% do catálogo — nenhum asset novo exigido. Se um produto
    herói de categoria não tiver imagem válida (`galeriaDe` vazio — não deve
    acontecer, `imagem` é obrigatório), essa capa é pulada e o mosaico tenta a
    próxima fonte.

### `index.astro` — só a `#tela-entrada`

14. Em `src/pages/index.astro`, trocar
    `<section id="tela-entrada" class="tela"><TelaEntrada nicho={nicho} /></section>`
    por `<section id="tela-entrada" class="tela"><PortaCatalogo nicho={nicho} /></section>`.
    Atualizar o import. **Mais nada** em `index.astro` muda (`#tela-vitrine` e
    `#tela-detalhe` intactas).
15. **[AUTO-DECISION] Campo `entrada.proposta`.** Se `src/data/tipos.ts` já tem
    `entrada.proposta?: string`, usar. Se **não**, adicionar **só** essa linha
    (dentro do objeto `entrada` de `Nicho`) — aditivo, opcional, retrocompatível,
    **não** conta como "schema novo" da Fase 1 (é texto de porta, não
    categorização). Registrar no PR. `catalog validate` não precisa cobrir.

### Degradação sem JS (RF-16.2 / RNF-04)

16. Com JS **desabilitado**, abrindo `/`: a `.porta` aparece no topo; o CTA
    `#tela-vitrine` **rola** até a vitrine; cada capa do mosaico rola até
    `#cat-<id>` (ou `#produto-<sku>`). Nada depende de script.
17. Nenhuma animação obrigatória. `transition`/`transform` de hover no mosaico
    ficam sob `@media (prefers-reduced-motion: no-preference)` (RNF-08).

### Peso / RNF-13

18. Após `npm run build`: no `dist/index.html`, as **únicas** `<img>` com
    `loading="eager"` são as **2 primeiras** capas do mosaico. Toda outra `<img>`
    da página é `loading="lazy"`. Verificar por grep.
19. Registrar no PR o tamanho **cru e gzip** do `dist/index.html` antes/depois.

### Portão final

20. Os quatro comandos, do zero, **exit 0**:
    ```
    npm run validate
    npm run typecheck
    npm run build
    npm run doctor
    ```
    `npm run dev` serve `/` com a porta no topo.
21. As 4 rotas seguem geradas e válidas: `dist/index.html`, `dist/404.html`,
    `dist/n/exemplo/index.html`, `dist/sitemap.xml`.
22. `git diff --stat` toca **apenas**:
    `src/components/Porta/PortaCatalogo.astro` (novo),
    `src/components/TelaEntrada/TelaEntrada.astro` (removido),
    `src/pages/index.astro` (1 import + 1 tag),
    `src/data/tipos.ts` (**só** se o CA 15 exigir a linha `proposta?`),
    e docs (`docs/stories/README.md`, este arquivo, `docs/ESTADO-ATUAL.md`).
    **Nada** em `src/lib/*`, `src/pages/n/[slug].astro`, `src/components/Vitrine/*`,
    `src/components/Detalhe/*`.

---

## Plano de tarefas (ordenado)

### Tarefa 1 — `src/components/Porta/PortaCatalogo.astro` (novo)

Frontmatter: importar `resolverCategorias`, `produtosPorCategoria`, `galeriaDe` de
`../../lib/catalogo/resolver`; `urlAsset` de `../../lib/catalogo/carregar`. Props
`{ nicho }`. Calcular:

```ts
const cats = resolverCategorias(nicho, 'a');
const porCat = produtosPorCategoria(nicho, 'a');
const K = nicho.produtos.length;
const C = cats.length;
const usados = new Set<string>();
const mosaico: { src: string; alt: string; href: string; ir: 'vitrine' | 'detalhe' }[] = [];
for (const c of cats) {
  const h = porCat.get(c.id)?.[0];
  if (h && !usados.has(h.sku)) {
    const capa = galeriaDe(h)[0];
    if (capa?.tipo === 'imagem') {
      mosaico.push({ src: capa.src, alt: capa.alt, href: `#cat-${c.id}`, ir: 'vitrine' });
      usados.add(h.sku);
    }
  }
  if (mosaico.length >= 5) break;
}
if (mosaico.length < 3) {
  const resto = [...nicho.produtos]
    .filter((p) => !usados.has(p.sku))
    .sort((a, b) => (b.prioridade ?? 50) - (a.prioridade ?? 50));
  for (const p of resto) {
    const capa = galeriaDe(p)[0];
    if (capa?.tipo === 'imagem') {
      mosaico.push({ src: capa.src, alt: capa.alt, href: `#produto-${p.sku}`, ir: 'detalhe' });
      if (mosaico.length >= 4) break;
    }
  }
}
const cat0Sintetica = cats[0]?.id.startsWith('_') ?? true;
const linhaOrg = (C > 1 || !cat0Sintetica)
  ? `${K} produto${K === 1 ? '' : 's'} · ${C} categoria${C === 1 ? '' : 's'}`
  : `${K} produto${K === 1 ? '' : 's'}`;
```

Markup: `.porta` > kicker, `<h1>`, proposta, `.porta-org`, `<ul class="porta-mosaico">`,
CTA, slot de oferta. `<style>` local (tokens; full-bleed do mosaico; grid 2–3 col
com 1ª capa `span 2`; CTA no `--acento` ≥ 44px; hover só sob
`prefers-reduced-motion: no-preference`).

### Tarefa 2 — `src/data/tipos.ts` (só se necessário — CA 15)

Se `Nicho['entrada']` não tem `proposta?: string`, adicionar a linha. Nada mais.

### Tarefa 3 — `src/pages/index.astro` (alterar `#tela-entrada`)

Trocar import e tag (CA 14). Conferir que o `<style>` de `index.astro` que mirava
classes da `TelaEntrada` não deixa regra órfã.

### Tarefa 4 — remover `src/components/TelaEntrada/TelaEntrada.astro`

`git rm`. Migrar para `PortaCatalogo` o que servir do `<style>` (full-bleed, CTA).
`astro check` para pegar import pendente.

### Tarefa 5 — Portão + docs

- `npm run validate && npm run typecheck && npm run build && npm run doctor` — exit 0.
- grep do `dist/index.html`: só 2 `<img loading="eager">`. Registrar cru+gzip.
- `npm run dev` + roteiro do CA 16 **sem JS**.
- `git diff --stat` confere o CA 22.
- `docs/stories/README.md` + `docs/ESTADO-ATUAL.md`: `TelaEntrada` saiu,
  `PortaCatalogo` de pé; `#tela-vitrine` ainda no formato E6-01 até E6-05.

---

## Definição de Pronto

- [ ] `npm run validate` / `typecheck` / `build` / `doctor` — todos exit 0.
- [ ] `/` serve a porta: kicker, `<h1>`, parágrafo de proposta, linha
      `"K produtos · C categorias"`, mosaico de 3–5 capas, CTA "Entrar no catálogo".
- [ ] **Sem JS**: CTA rola até `#tela-vitrine`; capas do mosaico rolam até
      `#cat-<id>` / `#produto-<sku>`.
- [ ] Nicho **sem** `entrada` renderiza a porta inteira por defaults derivados.
- [ ] `dist/index.html`: só as **2 primeiras** capas do mosaico são eager; resto
      `lazy`. Tamanho cru+gzip registrado no PR.
- [ ] `data-slot` presentes: `kicker`, `titulo`, `subtitulo`, `entrada-org`,
      `entrada-cta`, `entrada-oferta`.
- [ ] `TelaEntrada.astro` removida; `astro check` sem import órfão.
- [ ] `git diff --stat` não toca `src/lib/*`, `src/components/Vitrine/*`,
      `src/components/Detalhe/*`, `n/[slug].astro`.
- [ ] PR descreve: (a) porta ≠ capa de herói; (b) mosaico derivado, zero asset
      novo; (c) `entrada.proposta?` adicionada? (s/n); (d) `#tela-vitrine` ainda no
      formato de E6-01 — E6-05 fecha.

---

## Fora de escopo (E6-05 / E6-03 / E3 / Fase 1)

- Bloco 2 (`TrilhaProdutos`), Bloco 3 (`BlocoInformacoes`), remoção de
  `VitrineFoco`, `GradeCatalogo` com `id="grade-cat-<id>"`, alvo de scroll de
  categoria em `telas.ts` — **E6-05**.
- `n/[slug].astro` na seção única — **E6-03**.
- Reescrita da porta por `?n=/?c=/?o=` (clonar `<template>`), teaser de preço,
  variação de headline — **E3-01/02/03**.
- Grupos + estilos na linha de organização, mosaico por grupo — **Fase 1 / E7**.
- Medição de LCP/peso em device — **E6-06**.

---

## Riscos / notas de implementação

1. **Mosaico eager e o LCP.** As 2 capas eager **são** o LCP. Mantê-las pequenas
   (`assets check` já limita imagem a 180 KB). Se a 1ª for `span 2` (maior),
   garantir `fetchpriority="high"` só nela e na 2ª.
2. **CLS do mosaico.** `width`/`height` explícitos + `aspect-ratio` em toda `<img>`.
   O grid não pode "pular" quando as capas `lazy` carregam.
3. **Full-bleed dentro de `.pagina`.** Sangrar via `width: 100vw; margin-inline:
   calc(50% - 50vw)` **ou** `margin-inline: calc(-1 * var(--sp-4))` — o que não
   criar scroll-x horizontal no `dist/index.html` (conferir no build).
4. **`overscroll-behavior`.** Se o mosaico virar faixa rolável em telas estreitas,
   `overscroll-behavior-x: contain` (doc 09 §5).
5. **`entrada.proposta` vs `subtitulo`.** Reusar `data-slot="subtitulo"` mantém
   E3-01 simples. Se o time preferir slot próprio, criar `entrada-proposta` e
   alinhar com E3-01 antes.
6. **Contraste (RNF-07).** `#fff` sobre `#1E6FFF` passa AA. Nichos de acento claro
   exigem `--acento-texto` — sem gate (R-07).
7. **Sem runner de teste.** Verificação = `astro check` + `build` + roteiro
   manual do CA 16 (JS **off**) + grep do `dist/index.html` (CA 18).
