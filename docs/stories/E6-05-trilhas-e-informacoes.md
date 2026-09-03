# E6-05 — `TrilhaProdutos` (Bloco 2a + 2b) + `BlocoInformacoes` (Bloco 3); remove `VitrineFoco`

**Épico:** [E6](../epics/E6-fluxo-de-tres-telas.md) · **Estado:** 🔵 detalhada — **pegar depois de E5-02 e E6-04**
**Esforço:** G (3–5 dias)
**Base:** [ADR-008](../architecture/decisions/adr-008-catalogo-como-pagina-rica-de-secoes.md) Fase 0, item 2 · [architecture/09](../architecture/09-fluxo-de-telas-e-apresentacao.md) §1, §2, §4
**Depende de:** E2-03 ✔ (`resolver.ts`), **E5-01** (a `#tela-detalhe` usa `DetalheProduto`), **E5-02** (galeria/specs completas — recomendado antes), **E6-04** (a `#tela-entrada` já é `PortaCatalogo`)
**Destrava:** E6-06 (slice de medição), E3-01 (reescrita da vitrine por `?n=`), E4 (OG/rota/sitemap)

**Requisitos cobertos:**
RF-15.1 (`#tela-vitrine` com os blocos 2a/2b/2c + informações), RF-10.4 (navegar por categoria; sem JS = `<h2 id="cat-<id>">` + cards), RF-11.2/11.4 (ordenação por `prioridade`; "em alta" = maiores `prioridade`/`destaque`),
RF-04.1 (mini: capa+nome+preço, `data-sku`/`data-categoria`/`data-prioridade`; toque → detalhe), RF-04.3 (CTA de saída no detalhe e — sem JS — no card da grade),
RF-16.1/16.2/16.3 (HTML buildado completo; sem JS empilhado e navegável por âncora; CSS de ocultar sob `html.js`),
RF-09.2 (botão compartilhar — no Bloco 3), RNF-04, RNF-06, RNF-08, RNF-13.

**NÃO cobre nesta story:** o **Bloco 1** (navegador de categorias em dois eixos + carrossel de referenciamento) — **Fase 1 / E7**. Reescrita por `?n=/?c=/?o=` — **E3**. `telas.ts` como um todo (só o alvo do scroll de categoria muda) — o resto é **E6-02**, intacto. OG/rota `/n/<slug>` — **E4**.

**Arquivos-guia (ler antes de implementar):**
- [architecture/09](../architecture/09-fluxo-de-telas-e-apresentacao.md) — **§1** (markup de `#tela-vitrine`: 2a → 2b[] → 2c → Bloco 3), **§2** (degradação bloco a bloco + **nota de id de categoria**), **§4** (`TrilhaProdutos`/`BlocoInformacoes` em "Novos"; `GradeCatalogo`/`telas.ts`/`index.astro` em "Alterados"; `VitrineFoco`/`TrilhaCategorias` em "Removidos"), **§5** (riscos)
- [ADR-008](../architecture/decisions/adr-008-catalogo-como-pagina-rica-de-secoes.md) — **item 2** (Fase 0) e **§7** (por que não há Bloco 1 aqui)
- [architecture/08](../architecture/08-catalogo-categorizado.md) — **§4.1** (`resolverCategorias`), **§4.2** (`produtosPorCategoria`), **§4.3** (`heroiDaVitrine`)
- [prd/02-requisitos](../prd/02-requisitos.md) — RF-10.4, RF-11, RF-04, RF-16, RF-09.2, RNF-04/06/08/13
- [design/01-fundamentos](../design/01-fundamentos.md) + [design/tokens.css](../design/tokens.css)
- Código a consumir: `src/lib/catalogo/resolver.ts` (`resolverCategorias`, `produtosPorCategoria`, `prioridadeDe`, `galeriaDe`), `src/lib/catalogo/carregar.ts`, `src/lib/utils.ts` (`formatarPreco`), `src/data/nichos.ts`
- Código a alterar: `src/pages/index.astro` (`#tela-vitrine`), `src/components/GradeCatalogo/GradeCatalogo.astro`, `src/lib/navegacao/telas.ts` (só o alvo do scroll de categoria), `src/components/Vitrine/TrilhaCategorias.astro` (`@deprecated`)
- Remover: `src/components/Vitrine/VitrineFoco.astro`
- Manter: `src/components/Vitrine/MiniProduto.astro` (de E6-01)

---

## Contexto

E6-04 já trocou a `#tela-entrada` pela `PortaCatalogo`. Esta story reescreve a
`#tela-vitrine`: de `TrilhaCategorias + VitrineFoco + GradeCatalogo` (E6-01,
conceito C4) para **os blocos da ADR-008 Fase 0**:

```
#tela-vitrine
  ├─ 2a  <section class="trilha">  EM ALTA / DESTAQUES   (cross-categoria)
  ├─ 2b  <section id="cat-<id>" class="trilha"> …  (uma por categoria efetiva)
  ├─ 2c  <GradeCatalogo />                         (= fallback sem-JS)
  └─ 3   <BlocoInformacoes />
```

`VitrineFoco` (o herói em foco) **sai**. `TrilhaCategorias` (chips) **sai da
página** e fica `@deprecated`. A `telas.ts` de E6-02 continua igual — só o **alvo
do scroll** ao ativar uma categoria muda de "chip da trilha" para
"`<section id="cat-<id>">`".

Sem JS: `#tela-vitrine` é uma pilha — trilha em alta, trilhas por categoria, grade
completa e o `<footer>` de informações — toda navegável por âncora. Com JS
(E6-02), vira a tela "vitrine" trocável, e as trilhas ganham `scroll-snap` (Embla
só se o feel exigir — CA 20).

### História

> Como **visitante que entrou pela porta**, quero ver primeiro "o que está em
> alta", depois as categorias uma a uma como prateleiras curtas, e ter uma grade
> com tudo — para escolher rápido e tocar num produto sem me perder.

> Como **visitante sem JS**, quero que a vitrine seja uma página rolável com
> títulos de categoria e todos os links de produto e de saída funcionando por
> âncora.

> Como **dono do produto**, quero que as trilhas se montem sozinhas a partir de
> `prioridade`/`categoria` e que o bloco de informações traga a mensagem de
> curadoria e "como comprar" sem eu digitar por nicho na Fase 0.

---

## Decisões desta story

- **[AUTO-DECISION] D-12 — critério do Bloco 2a "Em alta".** Regra determinística,
  calculada **inline** em `index.astro` (não muda `resolver.ts` — doc 09 §4
  mantém `resolver.ts` inalterado na Fase 0):
  1. candidatos = todos os `nicho.produtos`;
  2. ordenar por: `destaque === true` primeiro; depois `prioridade` desc
     (`?? 50`); desempate = ordem de declaração (estável);
  3. pegar os **primeiros 6** (`MAX_EM_ALTA = 6`);
  4. se o nicho tem **≤ 4 produtos**, o Bloco 2a **não é renderizado** (redundante
     com a grade — D-13). Constante `MIN_NICHO_PARA_EM_ALTA = 5`.
  Vira `emAlta(nicho): Produto[]` — função pura **local** em `index.astro` (ou
  helper em `src/lib/utils.ts` se preferir testável; **não** em `resolver.ts`).
  `TODO(D-12)` — o dono pode ajustar o corte.
- **[AUTO-DECISION] D-13 — redundância de exposição.** Na Fase 0 **aceitamos** que
  um produto apareça em 2a, na sua trilha 2b e na grade 2c. Mitigação: 2a só
  existe com ≥ 5 produtos; rótulo "EM ALTA" distinto; cap 6. A regra "2a exclui o
  que está em 2b" fica anotada como opção do dono, **não** implementada.
- **[AUTO-DECISION] D-15 — conteúdo do Bloco 3 na Fase 0.** Sem campo de schema
  novo. `BlocoInformacoes` renderiza **copy fixa/derivada**:
  - "Sobre a curadoria": "Os produtos desta vitrine foram selecionados por
    pesquisa e potencial de venda." (constante do componente);
  - "Como comprar": "Ao tocar em um produto você vai para a loja parceira. Preço
    e disponibilidade são de lá.";
  - **prova social**: **omitida** na Fase 0 (sem dado verdadeiro/verificável —
    regra da ideação: nada de claim inventado);
  - botão **compartilhar** (`data-share`), inerte no HTML, `hidden`, ligado por
    E6-02 / E4-04;
  - link "voltar ao topo" (`href="#tela-entrada"` / `data-ir="entrada"`);
  - linha de privacidade: "Esta vitrine não coleta dados." (RNF-09).
  Campo opcional `nicho.info?` fica para a **Fase 1**.
- **[AUTO-DECISION] id de categoria (doc 09 §2, nota).** A `<section>` de trilha
  (2b) é dona de `id="cat-<id>"`. A `GradeCatalogo` (2c) passa seus headings para
  `id="grade-cat-<id>"`. As âncoras de navegação (mosaico da porta, `telas.ts`)
  apontam `#cat-<id>` → a trilha 2b.
- **`VitrineFoco.astro` é removida.** `heroiDaVitrine` continua em `resolver.ts`
  (fica para E3-02/Fase 1). Remover só o componente.

---

## Critérios de aceite

### `TrilhaProdutos.astro` (`src/components/Vitrine/TrilhaProdutos.astro`) — novo

1. Props: `{ titulo: string; produtos: Produto[]; slug: string; id?: string;
   kicker?: string; descricao?: string }`. Sem `<script>`, sem ilha, sem
   dependência nova.
2. Raiz `<section class="trilha"{id ? id=id}>`. Dentro:
   - `<h2 class="trilha-titulo">{titulo}</h2>`;
   - se `kicker`: `<p class="trilha-kicker">{kicker}</p>` (mono, `--tracking-label`);
   - se `descricao`: `<p class="trilha-descricao">{descricao}</p>`;
   - `<ol class="trilha-carrossel">` com um `<li>` por produto → `<MiniProduto
     produto={p} slug={slug} />`.
3. `.trilha-carrossel`: `display: flex; gap: var(--trilha-gap, var(--sp-3));
   overflow-x: auto; scroll-snap-type: x proximity; overscroll-behavior-x:
   contain; -webkit-overflow-scrolling: touch`. Cada `<li>` `scroll-snap-align:
   start; flex: 0 0 auto`. `scroll-behavior: smooth` **só** sob
   `@media (prefers-reduced-motion: no-preference)`.
4. `produtos.length === 0`: a `<section>` **ainda é renderizada** (o `<h2
   id="cat-<id>">` precisa existir como âncora) mas sem `<ol>`; em vez disso
   `<p class="trilha-vazia">Nada nesta categoria por enquanto.</p>`.
5. Nenhuma imagem eager: `MiniProduto` já usa `loading="lazy"` (E6-01). Vídeo de
   card nunca autoplay fora de viewport (RNF-05).
6. `--trilha-gap` e `--card-raio` lidos como `var(--x, fallback-token)` (a
   declaração dos tokens em `design/tokens.css` é tarefa de UX — aqui só o
   fallback).

### `#tela-vitrine` em `index.astro`

7. `<section id="tela-vitrine" class="tela">` passa a conter, **nesta ordem**:
   - **2a** — `emAlta(nicho).length ? <TrilhaProdutos titulo="Em alta"
     produtos={emAlta(nicho)} slug={nicho.slug} /> : null`;
   - **2b** — para cada `cat` de `resolverCategorias(nicho, 'a')`:
     `<TrilhaProdutos id={`cat-${cat.id}`} titulo={cat.rotulo}
     kicker={cat.kicker} descricao={cat.descricao}
     produtos={produtosPorCategoria(nicho,'a').get(cat.id) ?? []}
     slug={nicho.slug} />`;
   - **2c** — `<GradeCatalogo nicho={nicho} />` (headings `grade-cat-<id>` — CA 12);
   - **3** — `<BlocoInformacoes nicho={nicho} />`.
8. `VitrineFoco` e `TrilhaCategorias` **não** são mais importados nem
   renderizados em `index.astro`.
9. `emAlta(nicho)` no frontmatter de `index.astro` (ou importada de `utils.ts`)
   conforme D-12. `import { resolverCategorias, produtosPorCategoria }` já existe
   de E6-01 — reusar.
10. Nenhuma regra de `<style>` desta story dá `display:none` em `.tela`/trilhas —
    o gate `html.js` de E6-02 (`html.js #app[data-tela] .tela`) continua no
    `global.css` e não depende de `VitrineFoco`.

### `BlocoInformacoes.astro` (`src/components/Info/BlocoInformacoes.astro`) — novo · RF-09.2 / RNF-09

11. Props `{ nicho: Nicho }` (só para eventual `nicho.info` na Fase 1). Raiz
    `<footer class="info" aria-label="Informações">`:
    - `<h2 class="info-titulo">Sobre esta vitrine</h2>`;
    - dois `<div class="info-item">` com `<h3>` + `<p>` (curadoria; como comprar)
      — copy fixa (constantes do componente, D-15);
    - `<button type="button" class="info-share" data-share hidden>Compartilhar</button>`
      — inerte; E6-02/E4-04 tiram o `hidden` se `navigator.share` existir;
    - `<a class="info-topo" href="#tela-entrada" data-ir="entrada">Voltar ao topo</a>`;
    - `<p class="info-privacidade">Esta vitrine não coleta dados.</p>`.
    Sem `<script>`. Alvos ≥ 44px.

### `GradeCatalogo.astro` — headings

12. `id={`cat-${c.id}`}` dos `<h2>` da grade → `id={`grade-cat-${c.id}`}` (doc 09
    §2, nota). **Nenhuma** outra mudança. Buscar no repo por `href="#cat-` — nada
    deve esperar a grade (tudo aponta a trilha 2b agora).

### `telas.ts` — alvo do scroll de categoria

13. Onde E6-02 faz `scrollIntoView` ao ativar `cat=<id>`, o alvo passa a ser
    `document.getElementById('cat-' + id)`. Se não existir, cai para o topo de
    `#tela-vitrine`. **Nenhuma** outra linha de `telas.ts` muda.
14. O contrato de hash de E6-02 (`#vitrine`, `#vitrine&cat=<id>`, `#produto=<sku>`,
    `location.search` preservado) **não muda**.

### `TrilhaCategorias.astro` — `@deprecated`

15. Comentário no topo: `{/* @deprecated ADR-008 Fase 0 — fora da página; pode
    voltar como navegação do Bloco 1 na Fase 1. Não importar. */}`. **Não**
    remover o arquivo. Remover imports dele em `index.astro`/`n/[slug].astro`.

### Degradação sem JS (RF-16 / RNF-04)

16. Com JS **desabilitado**, rolando `/`:
    - porta (E6-04), depois `#tela-vitrine`: trilha "Em alta" (se houver), depois
      uma `<section id="cat-<id>">` por categoria com `<h2>` + minis, depois a
      grade completa, depois o `<footer class="info">`;
    - cada `<a href="#cat-<id>">` (mosaico da porta) rola até a trilha 2b certa;
    - cada mini e cada card da grade `<a href="#produto-<sku>">` rola até a
      `<article>` de detalhe;
    - CTAs de saída presentes: um por card da grade (E6-01) e um por `<article>`
      de detalhe (E5). Botão compartilhar `hidden`.
17. Nenhuma animação obrigatória. `scroll-snap`/`scroll-behavior: smooth`/
    transições de foco de card ficam sob `prefers-reduced-motion: no-preference`.

### Peso / RNF-13

18. Após `npm run build`: `dist/index.html` **não** ganha nenhuma `<img
    loading="eager">` nova (as 2 da porta seguem as únicas). Minis das trilhas e
    capas da grade são `lazy`. Verificar por grep.
19. Registrar no PR o tamanho **cru e gzip** do `dist/index.html`. **Alerta:** se
    o gzip passar de **90 KB**, sinalizar no PR como bloqueio potencial da **Fase
    0** (não só da Fase 1) — E6-06 mede formalmente, mas é aqui que o HTML cresce
    mais.

### Embla — só se preciso

20. **[AUTO-DECISION]** Esta story **não** integra Embla. `scroll-snap` nativo. Se
    o `npm run dev` num device mostrar o feel do snap insuficiente, abrir
    follow-up `E6-05b` (Embla por **import dinâmico**, só em viewport + `html.js`,
    nunca no caminho crítico). Decisão final: **E6-06**.

### Portão final

21. Os quatro comandos, do zero, **exit 0**:
    ```
    npm run validate
    npm run typecheck
    npm run build
    npm run doctor
    ```
    `npm run dev` serve `/` com porta → trilhas → grade → informações → detalhes.
22. As 4 rotas seguem geradas e válidas. `/n/exemplo/` continua buildando
    (usa `<GradeCatalogo>`; a migração para a seção única é **E6-03**).
23. `git diff --stat` toca **apenas**:
    `src/components/Vitrine/TrilhaProdutos.astro` (novo),
    `src/components/Info/BlocoInformacoes.astro` (novo),
    `src/pages/index.astro` (`#tela-vitrine` + `emAlta`),
    `src/components/GradeCatalogo/GradeCatalogo.astro` (só o id do heading),
    `src/lib/navegacao/telas.ts` (só o alvo do scroll de categoria),
    `src/components/Vitrine/TrilhaCategorias.astro` (comentário `@deprecated`),
    `src/components/Vitrine/VitrineFoco.astro` (removido),
    talvez `src/lib/utils.ts` (se `emAlta` virar helper),
    e docs. **Nada** em `src/data/*`, `src/components/Porta/*`,
    `src/components/Detalhe/*`, `src/pages/n/[slug].astro`.

---

## Plano de tarefas (ordenado)

### Tarefa 1 — `src/components/Vitrine/TrilhaProdutos.astro` (novo)

Props do CA 1. `<section class="trilha">` + `<h2>` + kicker/descrição opcionais +
`<ol class="trilha-carrossel">` de `<MiniProduto>`. `<style>` local: faixa flex
`overflow-x:auto` + `scroll-snap` + `overscroll-behavior-x:contain`;
`var(--trilha-gap, var(--sp-3))`; estado vazio (CA 4); `scroll-behavior:smooth` e
`transform` de foco só sob `prefers-reduced-motion: no-preference`.

### Tarefa 2 — `src/components/Info/BlocoInformacoes.astro` (novo)

`<footer class="info">` com o conteúdo do CA 11 (copy nas constantes do
frontmatter). Botão `data-share hidden`. Link `data-ir="entrada"`. Sem `<script>`.

### Tarefa 3 — `src/components/GradeCatalogo/GradeCatalogo.astro` (alterar)

Só `id={`cat-${c.id}`}` → `id={`grade-cat-${c.id}`}` nos `<h2>`. Nada mais.

### Tarefa 4 — `src/lib/navegacao/telas.ts` (alterar — 1 ponto)

Alvo do `scrollIntoView` ao ativar `cat=<id>` → `getElementById('cat-'+id)` com
fallback ao topo de `#tela-vitrine`. Não tocar mais nada.

### Tarefa 5 — `src/pages/index.astro` (alterar `#tela-vitrine`)

`emAlta(nicho)` (D-12). Remover `VitrineFoco`/`TrilhaCategorias`. Montar 2a → 2b[]
→ 2c → 3 (CA 7). `<style>`: remover regras órfãs de `.vitrine-foco`/chips;
espaçamento entre trilhas via `var(--bloco-espaco, var(--sp-6))`.

### Tarefa 6 — `TrilhaCategorias` `@deprecated` + `git rm VitrineFoco.astro`

Comentário no topo de `TrilhaCategorias`. `git rm` da `VitrineFoco`. `astro check`
para pegar import pendente.

### Tarefa 7 — Portão + docs + medição

- `npm run validate && npm run typecheck && npm run build && npm run doctor` — exit 0.
- grep do `dist/index.html`: só as 2 capas da porta eager (CA 18). Registrar
  cru+gzip; **comparar com 90 KB** (CA 19).
- `npm run dev` + roteiro do CA 16 (JS off) + navegação com JS (âncora →
  `<section id="cat-<id>">`).
- `git diff --stat` confere o CA 23.
- `docs/stories/README.md`, `docs/ESTADO-ATUAL.md`, nota em
  `docs/epics/PLANO-PROXIMO-PASSO.md`.

---

## Definição de Pronto

- [ ] `npm run validate` / `typecheck` / `build` / `doctor` — todos exit 0.
- [ ] `/` serve: porta → (Em alta, se ≥ 5 produtos) → uma trilha por categoria com
      `<h2 id="cat-<id>">` → grade completa → `<footer class="info">` → detalhes.
- [ ] **Sem JS**: tudo empilhado e navegável por âncora; `#cat-<id>` cai na
      trilha 2b; `#produto-<sku>` cai no detalhe; CTAs de saída presentes; botão
      compartilhar `hidden`.
- [ ] Com JS: ativar uma categoria rola até `<section id="cat-<id>">` (E6-02
      intacta salvo o alvo do scroll).
- [ ] `VitrineFoco.astro` removido; `TrilhaCategorias.astro` `@deprecated` e sem
      import; `astro check` limpo.
- [ ] Grade usa `id="grade-cat-<id>"`; nenhuma âncora aponta a grade esperando
      `#cat-<id>`.
- [ ] `dist/index.html`: nenhuma `<img eager>` nova. Tamanho cru+gzip registrado;
      se gzip > 90 KB, sinalizado no PR.
- [ ] Trilha vazia renderiza o `<h2 id="cat-<id>">` + mensagem de vazio.
- [ ] `git diff --stat` conforme CA 23.
- [ ] PR descreve: (a) D-12 (corte do "Em alta") e D-13 (redundância aceita);
      (b) D-15 (Bloco 3 = copy fixa, sem prova social, sem schema); (c) `telas.ts`
      só mudou o alvo do scroll; (d) tamanho gzip do `index.html`.

---

## Fora de escopo (E6-03 / E6-06 / E3 / E4 / Fase 1)

- **Bloco 1** — navegador de categorias em dois eixos (grupos + estilos) +
  carrossel de referenciamento — **Fase 1 / E7**, atrás de D-02 + E6-06.
- `n/[slug].astro` na seção única — **E6-03**.
- Slice de medição em device — **E6-06**.
- Reescrita da vitrine por `?n=/?c=/?o=` (clonar `<template id="tpl-trilha">`) —
  **E3**. Esta story **não** cria `<template>`.
- Integração Embla — só se E6-06 pedir (`E6-05b`).
- Botão compartilhar funcional (`navigator.share`) — **E4-04**.
- Campo `nicho.info` para o Bloco 3 — **Fase 1**.
- OG por nicho, sitemap — **E4**.

---

## Riscos / notas de implementação

1. **HTML de `/` cresce mais aqui do que em qualquer story.** Todas as trilhas +
   a grade + os detalhes E5 no mesmo documento. RNF-13: só a porta é eager. Se o
   gzip passar de 90 KB, **a Fase 0 está em risco** — sinalizar no PR e escalar
   para E6-06 / decisão de cortar conteúdo embutido (ex.: detalhe sob demanda).
2. **Redundância 2a/2b/2c (D-13).** Um produto pode aparecer 3× na `#tela-vitrine`.
   Aceito na Fase 0. Se ficar repetitivo no `dev`, a opção "2a exclui o que está
   em 2b" está pré-desenhada — follow-up, não expandir esta story.
3. **`id="cat-<id>"` numa `<section>` vazia.** Categoria sem produtos ainda emite
   o `<h2 id="cat-<id>">`. Garantir que `resolverCategorias` e
   `produtosPorCategoria` concordam nas chaves (a sintética `_outros`/`_tudo`
   também).
4. **`telas.ts` — não regredir E6-02.** Única mudança = alvo do `scrollIntoView`.
   Rodar o roteiro de E6-02 (voltar do webview anda entrada↔vitrine↔detalhe;
   `?n/?c/?o` na URL) depois.
5. **`scroll-snap` horizontal × gesto "voltar" do webview.** `overscroll-behavior-x:
   contain` em toda `.trilha-carrossel` (doc 09 §5).
6. **Tokens por componente.** `--trilha-gap`, `--card-raio`, `--bloco-espaco` como
   `var(--x, fallback-token)`. A **declaração** deles em `design/tokens.css` é
   tarefa de UX (fora desta story) — o componente funciona com o fallback.
7. **Prova social omitida (D-15).** Deliberado: sem campo de dado verdadeiro, nada
   de número inventado. Anotar no PR.
8. **Ordem com E5-02.** Se E5-02 ainda não entrou, `#tela-detalhe` usa a casca de
   E5-01 — a `#tela-vitrine` desta story não depende disso, mas o "produto →
   detalhe" fica pobre. Recomendado E5-02 antes.
9. **Sem runner de teste.** Verificação = `astro check` + `build` + roteiro
   manual (CA 16, JS off; e navegação com JS) + grep do `dist/index.html`.
