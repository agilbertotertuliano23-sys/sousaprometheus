# E6-01 — Casca da seção única (3 telas) + `TelaEntrada` + `VitrineFoco` + `TrilhaCategorias` + `MiniProduto` + grade por categoria

**Épico:** [E6](../epics/E6-fluxo-de-tres-telas.md) · **Estado:** 🔵 detalhada — **pegar depois de E5-01**
**Esforço:** G (3–5 dias)
**Depende de:** E2-03 ✔ (`resolver.ts` + fixture) · **E5-01** (consome `DetalheProduto.astro`; se pega antes, usa placeholder marcado — ver CA 12)
**Destrava:** E6-02 (`telas.ts` — navegação), E6-03 (`n/[slug].astro`), E3-01 (reescrita das 3 telas por `?n=`)

**Requisitos cobertos:**
RF-15.1 (seção única com 3 `<section>` + `#app[data-tela]`), RF-15.5 (tela de entrada = capa editorial com defaults derivados),
RF-16.1 (HTML buildado contém todas as telas do nicho padrão), RF-16.2 (sem JS as 3 telas ficam visíveis e navegáveis por âncora),
RF-10.4 (trilha de categorias; sem JS = `<nav>` de âncoras), RF-11.4 (herói via `heroiDaVitrine`),
RF-04.1 (mini: capa+nome+preço, `data-sku`/`data-categoria`/`data-prioridade`), RF-04.3 (CTA de saída no herói da vitrine e — sem JS — no card da grade),
RF-12.3 (só a capa do herói eager; resto `lazy`/`preload=none`),
RNF-04 (funciona sem JS), RNF-06 (alvos ≥ 44px), RNF-08 (`prefers-reduced-motion`), RNF-13 (medir `dist/index.html` gzip).

**NÃO cobre nesta story:** RF-15.2/15.3/15.4 (navegação `pushState`/`popstate`/revisita — **E6-02**), RF-16.3 (`html.js` + CSS que oculta telas — **E6-02**).

**Arquivos-guia (ler antes de implementar):**
- [architecture/09](../architecture/09-fluxo-de-telas-e-apresentacao.md) — **§1** (markup da seção única + "O que é buildado"), **§2** (degradação sem JS — tela a tela), **§4** ("Novos" e "Alterados" — quem é quem), **§5** (riscos do fluxo)
- [ADR-007](../architecture/decisions/adr-007-catalogo-categorizado-e-apresentacao-rica.md) — item 4
- [architecture/08](../architecture/08-catalogo-categorizado.md) — **§4.1** (categorias efetivas), **§4.2** (`produtosPorCategoria`), **§4.3** (herói)
- [prd/02-requisitos](../prd/02-requisitos.md) — RF-15, RF-16, RF-10.4, RF-11.4, RF-04, RF-12.3, RNF-04/06/08/13
- [design/01-fundamentos](../design/01-fundamentos.md) + [design/tokens.css](../design/tokens.css)
- Código a consumir (NÃO reescrever): `src/lib/catalogo/resolver.ts` (`resolverCategorias`, `produtosPorCategoria`, `heroiDaVitrine`, `galeriaDe`, `categoriaEfetivaDe`, `prioridadeDe`), `src/lib/catalogo/carregar.ts` (`urlAsset`), `src/lib/utils.ts`, `src/data/nichos.ts` (`NICHO_PADRAO`, `resolverNicho`)
- Código a alterar: `src/pages/index.astro`, `src/components/GradeCatalogo/GradeCatalogo.astro`, `src/components/CardProduto/CardProduto.astro`, `src/layouts/Base.astro` (mínimo)
- Referência: `src/components/VideoVertical/VideoVertical.astro`, `src/components/TarjaOferta/TarjaOferta.astro` (stub), `src/data/nichos/exemplo.ts` (fixture)

---

## Contexto

A UI atual é a antiga: `index.astro` = cabeçalho + `GradeCatalogo` plana. O
ADR-007 redesenhou a página como **uma seção única com 3 telas** — entrada
editorial → vitrine em foco → detalhe — que **sem JS** viram uma página longa e
completa do nicho padrão, navegável por âncora, e **com JS** (E6-02) viram
estados trocáveis.

Esta story entrega **só a casca estática**: o HTML das 3 telas buildado com o
`NICHO_PADRAO`, os 4 componentes novos de tela/vitrine, e a `GradeCatalogo`
reescrita para agrupar por categoria efetiva. **Nenhuma lógica de cliente**: sem
`telas.ts`, sem `html.js`, sem `pushState`, sem esconder telas, sem reescrita por
`?n=`. No fim desta story, abrir `/` mostra as 3 telas **empilhadas e visíveis**,
ligadas por âncoras — que é exatamente o alvo de degradação sem JS (RF-16). E6-02
põe o JS por cima disso.

O detalhe de cada produto usa o `DetalheProduto.astro` de **E5-01**. Se E6-01 for
implementada antes de E5-01, a tela de detalhe usa um **placeholder marcado**
(CA 12) e a integração vira um follow-up de 1 arquivo.

### História

> Como **dono do produto**, quero que `/` já renderize a capa editorial, a
> vitrine com trilha de categorias e o detalhe rico de cada produto do nicho
> padrão — tudo no HTML buildado, navegável por âncora mesmo sem JS — para ter a
> estrutura das 3 telas de pé antes de ligar a navegação client-side (E6-02) e a
> personalização por `?n=` (E3-01).

> Como **visitante no webview do TikTok com JS lento/quebrado**, quero rolar a
> página e chegar a qualquer produto e a qualquer link de saída por âncora, sem
> depender de script (RNF-04 / RF-16).

---

## Critérios de aceite

Numerados e verificáveis. Onde há comando, o comando **é** o critério.

### Estrutura da seção única (`src/pages/index.astro`)

1. `index.astro` renderiza, dentro de `<main class="pagina">`, **um**
   `<div id="app" data-tela="entrada">` com **exatamente 3** filhos diretos, nesta ordem:
   - `<section id="tela-entrada" class="tela">` → `<TelaEntrada nicho={nicho} />`
   - `<section id="tela-vitrine" class="tela">` → `<TrilhaCategorias />` + `<VitrineFoco />` + `<GradeCatalogo />`
   - `<section id="tela-detalhe" class="tela">` → um `<article id="produto-<sku>" data-sku="<sku>">` por produto de `nicho.produtos`, cada um contendo o detalhe do produto (CA 12).
   `const nicho = resolverNicho(NICHO_PADRAO)` (o `exemplo`).
2. O `<div id="app">` tem `data-tela="entrada"` **estático** no HTML buildado.
   **Nenhuma** regra CSS desta story oculta `.tela` — as 3 seções ficam visíveis
   e empilhadas (o gate `html.js` + o CSS de ocultar são **E6-02**).
3. Os `data-slot` que E3-01 espera continuam presentes no HTML buildado:
   `kicker`, `titulo`, `subtitulo` (na `TelaEntrada`). Adicionais desta story:
   `entrada-teaser`, `entrada-heroi`, `entrada-cta`, `vitrine-heroi`, e um
   `data-slot="detalhe-galeria"` já vem de E5-01.
4. O `<footer class="rodape">` atual é preservado como irmão de `#app` dentro de
   `.pagina` (sempre visível).
5. `index.astro` **não** ganha `<script>`, `class="js"`, nem import de
   `telas.ts`/`slots*`/`criativo`/`oferta`. Sem dependência nova.

### `TelaEntrada.astro` (`src/components/TelaEntrada/TelaEntrada.astro`) — RF-15.5

6. Props `{ nicho: Nicho }`. Renderiza a capa editorial com **defaults
   derivados** (nada obrigatório em `nicho.entrada`):
   - **kicker:** `nicho.entrada?.kicker ?? 'VITRINE · ' + nicho.nome` →
     `<p class="rotulo" data-slot="kicker">`.
   - **título display:** `nicho.titulo` → `<h1 data-slot="titulo">` (`font-size: var(--fs-4)`).
   - **subtítulo:** `nicho.subtitulo` → `<p data-slot="subtitulo">` (mantém o slot que E3 usa).
   - **herói sangrando:** produto = `nicho.entrada?.heroiSku` resolvido para um
     produto existente, senão `heroiDaVitrine(nicho, 'a')`. Capa =
     `galeriaDe(heroi)[0]` (imagem). `<img data-slot="entrada-heroi"
     src={urlAsset(nicho.slug, capa.src)} alt={capa.alt}
     loading="eager" fetchpriority="high" decoding="async">` — **é o único
     asset eager da página** (RNF-13). "Sangrando" = largura total /
     `object-fit: cover`, pode extrapolar o `--largura-pagina` via
     `margin-inline: calc(-1 * var(--sp-4))` ou wrapper full-bleed.
   - **teaser de preço:** `nicho.entrada?.teaserPreco ?? 'a partir de ' +
     formatarPreco(menorPrecoCentavos)` onde `menorPrecoCentavos =
     Math.min(...nicho.produtos.map(p => p.precoCentavos))` →
     `<p data-slot="entrada-teaser">`.
   - **CTA:** `<a class="entrada-cta" href="#tela-vitrine" data-ir="vitrine"
     data-slot="entrada-cta">{nicho.entrada?.chamada ?? 'Ver a vitrine'} ›</a>` —
     `min-height: var(--toque-min)`, fundo `--acento`, texto AA (RNF-07).
   - **slot da tarja de oferta:** um ponto de inserção vazio/`hidden` para E3-03
     (`<div data-slot="entrada-oferta" hidden></div>`) — inerte nesta story.
7. `TelaEntrada` não tem `<script>` nem dependência nova. Sem JS, o CTA é uma
   âncora nativa que rola até `#tela-vitrine` (§2 do doc 09).

### `TrilhaCategorias.astro` (`src/components/Vitrine/TrilhaCategorias.astro`) — RF-10.4

8. Props `{ nicho: Nicho; variante?: 'a' | 'b' }` (default `'a'`). Renderiza
   `<nav class="trilha" aria-label="Categorias">` com um item por elemento de
   `resolverCategorias(nicho, variante)`:
   - cada item é `<a class="chip" href={`#cat-${cat.id}`} data-cat={cat.id}
     data-ir="vitrine">{cat.rotulo}</a>`;
   - o **primeiro** item recebe `aria-current="true"` + classe ativa;
   - alvo de toque **≥ 44px** (`min-height: var(--toque-min)`; `padding-inline`
     confortável) — RNF-06;
   - faixa horizontal com `overflow-x: auto`, `scroll-snap-type: x proximity`,
     `-webkit-overflow-scrolling: touch`; `scroll-behavior: smooth` **só** sob
     `@media (prefers-reduced-motion: no-preference)`.
9. Sem JS a trilha **já funciona**: os `href="#cat-<id>"` apontam para os
   headings de categoria da grade (CA 14). Os `data-cat`/`data-ir` são hooks
   para E6-02 ligar filtro/estado — inertes nesta story.

### `VitrineFoco.astro` (`src/components/Vitrine/VitrineFoco.astro`)

10. Props `{ nicho: Nicho; variante?: 'a' | 'b' }` (default `'a'`). Elemento raiz
    `<section class="vitrine-foco" hidden>` — **`hidden` estático** (doc 09 §2:
    "`VitrineFoco` recebe `hidden` estático e é revelada pelo JS; sem JS fica a
    grade"). Conteúdo:
    - **herói grande:** `heroi = heroiDaVitrine(nicho, variante)`. Capa =
      `galeriaDe(heroi)[0]`; imagem `loading="lazy"` (a versão eager do herói é a
      da `TelaEntrada`; aqui é `lazy` porque a vitrine não é o 1º paint enquanto
      não há JS — RNF-13). `data-slot="vitrine-heroi"`. Nome, preço (+ `<s>` +
      tarja como no card), e **CTA de saída**: `<a href={heroi.url}
      target="_blank" rel="noopener nofollow" data-sku={heroi.sku}>{nicho.cta} ›</a>`
      (`min-height: var(--toque-min)`).
    - **faixa de miniaturas:** `<MiniProduto>` para cada produto na ordem
      resolvida — usar a concatenação dos grupos de `produtosPorCategoria(nicho,
      variante)` na ordem das categorias (todos os produtos, sem repetir).
      Faixa horizontal com scroll-snap (mesmas regras de reduced-motion do CA 8).
11. `VitrineFoco` não tem `<script>` nem dependência nova. Como está `hidden`,
    nesta story ela **não aparece** em `/` — está pronta para E6-02 revelar.

### `MiniProduto.astro` (`src/components/Vitrine/MiniProduto.astro`) — RF-04.1

12. Props `{ produto: Produto; slug: string }`. Renderiza
    `<a class="mini" href={`#produto-${produto.sku}`} data-ir="detalhe"
    data-sku={produto.sku} data-categoria={produto.categoria ?? ''}
    data-prioridade={String(produto.prioridade ?? 50)}>`:
    - capa = `galeriaDe(produto)[0]` **como imagem** (nunca vídeo autoplay —
      RF-04.1); `<img loading="lazy" decoding="async">`, `aspect-ratio: 9/16`;
    - `<span class="mini-nome">{produto.nome}</span>`;
    - `<span class="mini-preco">{formatarPreco(produto.precoCentavos)}</span>`;
    - a área tocável inteira ≥ 44px (RNF-06).
13. `MiniProduto` é um componente próprio, pequeno, usando só tokens — **não**
    importa `CardProduto`. (Unificar `MiniProduto`/`CardProduto` num átomo comum
    é evolução opcional de E6/E3 — fora desta story para não inflar o diff.)

### Detalhe dentro de `#tela-detalhe` (`index.astro`)

14. Para cada `p` de `nicho.produtos`, `index.astro` renderiza
    `<article id={`produto-${p.sku}`} class="detalhe-wrap" data-sku={p.sku}>` e,
    dentro:
    - **se E5-01 já mergeada:** `<DetalheProduto produto={p} slug={nicho.slug} cta={nicho.cta} />`;
    - **se E5-01 ainda não:** um **placeholder marcado** —
      `<!-- E5-01: <DetalheProduto> --> <h2>{p.nome}</h2>
      <img src={urlAsset(nicho.slug, p.imagem)} alt={p.nome} loading="lazy" />
      <a href={p.url} target="_blank" rel="noopener nofollow" data-sku={p.sku}>{nicho.cta} ›</a>`
    — e um `TODO(E5-01)` no arquivo. A ordem recomendada é **E5-01 primeiro**;
    o placeholder é só a saída de emergência.
15. Todas as `<article id="produto-<sku>">` ficam **visíveis e empilhadas** nesta
    story (sem CSS de ocultar). As âncoras `#produto-<sku>` resolvem (usadas pela
    trilha? não — pela grade e pelas minis).

### Grade por categoria (`src/components/GradeCatalogo/GradeCatalogo.astro`) — RF-16.2, RF-11.2

16. `[AUTO-DECISION]` **Alterar `GradeCatalogo.astro` no lugar** (doc 09 §4
    "Alterados" lista-a como modificada, não como arquivo novo). Props passam a
    ser `{ nicho: Nicho; variante?: 'a' | 'b' }` (default `'a'`). Deixa de iterar
    `nicho.produtos` plano e passa a iterar `produtosPorCategoria(nicho,
    variante)` + `resolverCategorias(nicho, variante)` para os rótulos:
    - para **cada** categoria efetiva (na ordem do `Map`):
      `<section class="grade-cat"><h2 id={`cat-${cat.id}`} class="grade-cat-titulo">{cat.rotulo}</h2>`
      + (se `cat.descricao`) `<p class="grade-cat-desc">{cat.descricao}</p>`
      + `<div class="grade">{produtos.map((p) => <CardProduto produto={p} slug={nicho.slug} cta={nicho.cta} />)}</div>`
      `</section>`;
    - o heading `<h2 id="cat-<id>">` é renderizado **mesmo se o grupo estiver
      vazio** (a âncora da trilha precisa resolver); grupo vazio → sem cards.
    - a classe `.grade` mantém o grid atual (1 coluna até 560px, 2 acima).
17. `GradeCatalogo` continua sendo **o fallback sem-JS da vitrine** (doc 09 §1).
    Sem JS ela fica visível; E6-02 a marca `display:none` sob `html.js` quando a
    `VitrineFoco` assume.
18. `src/pages/n/[slug].astro` **não é tocado** nesta story (migração para a
    seção única = **E6-03**). Ele chama `<GradeCatalogo nicho={nicho} />` sem
    `variante` — como o default é `'a'`, `/n/exemplo/` continua buildando e
    válido (agora com a grade agrupada). Confirmar no build.

### `CardProduto.astro` — RF-04.1, RF-04.3, RF-16.2

19. `<article>` raiz ganha `data-sku={produto.sku}`,
    `data-categoria={produto.categoria ?? ''}`,
    `data-prioridade={String(produto.prioridade ?? 50)}`.
20. O card ganha **navegação interna** para o detalhe: a mídia e o nome ficam
    dentro de `<a class="card-ir" href={`#produto-${produto.sku}`}
    data-ir="detalhe" data-sku={produto.sku}>` (ou um `<a>` que cobre o card).
21. O card **mantém** o CTA de saída externo no rodapé — `<a class="cta"
    href={produto.url} target="_blank" rel="noopener nofollow"
    data-sku={produto.sku}>{cta} ›</a>` — porque, **sem JS**, o link de saída tem
    de estar em cada card da grade (doc 09 §2, linha "CTA de saída"). Props do
    `CardProduto` seguem `{ produto, slug, cta }` (inalteradas).
22. `precoDeCentavos`/tarja `-NN%`/imagem/`VideoVertical` seguem como hoje. Sem
    `<script>` novo. Alvos ≥ 44px mantidos.

### Degradação sem JS — tela a tela (RF-16.2 / RNF-04)

23. Com JS **desabilitado**, abrindo `/`:
    - a `TelaEntrada` aparece no topo; o CTA `#tela-vitrine` rola até a vitrine;
    - a `TrilhaCategorias` aparece como `<nav>` de links; clicar um chip rola até
      `#cat-<id>` na grade;
    - a `VitrineFoco` **não** aparece (`hidden` estático); a `GradeCatalogo`
      agrupada por categoria aparece e é a vitrine efetiva;
    - abaixo, todas as `<article id="produto-<sku>">` de detalhe aparecem
      empilhadas; um link `#produto-<sku>` (card ou mini) rola até a certa;
    - todos os links de saída (`target="_blank" rel="noopener nofollow"`, com
      `data-sku`) estão presentes e ativos: um por card da grade, um no herói da
      vitrine (que está `hidden`, então efetivamente os da grade + os dos
      detalhes), um por `<article>` de detalhe.
24. Nenhuma animação de troca de tela existe nesta story; o que houver de
    `scroll-behavior: smooth` / transição de chip fica sob
    `@media (prefers-reduced-motion: no-preference)` (RNF-08). O reset global de
    `global.css` já zera o resto.

### `Base.astro` — mínimo indispensável

25. `[AUTO-DECISION]` Única mudança em `Base.astro`: incluir `<TarjaOferta />`
    logo após `<body>` e antes do `<slot />`. A tarja é o stub existente
    (`<div id="tarja-oferta" hidden>`) — **inerte** (nada a mostra nesta story).
    Motivo: deixar o nó no DOM para E3-03/E6-02 sem reabrir `Base.astro` depois;
    é 1 import + 1 tag, reversível. **Não** adicionar `class="js"`, **não**
    carregar `telas.ts` nem `slots` (E6-02/E3). Se o time preferir adiar até
    E6-02, remover esta linha não afeta mais nada.

### Peso / RNF-13

26. Após `npm run build`: no `dist/index.html`, **a única** `<img>`/mídia com
    `loading="eager"` (ou sem `loading`) é a capa do herói da `TelaEntrada`
    (`data-slot="entrada-heroi"`). Toda outra `<img>` é `loading="lazy"`; todo
    `<video>` é `preload="none"` (ou `preload="metadata"` só no `VideoVertical`
    do card, como já é hoje). Verificar por inspeção/grep do `dist/index.html`.
27. Registrar no PR o tamanho de `dist/index.html` **cru e gzip** (referência
    para o `assets check` de E4-03 e a medição de E2-02). Não há teto duro nesta
    story — só o registro. Alvo informativo: 1º paint (entrada + capa do herói)
    dentro de 1,2 MB (RNF-01); a aferição real de LCP/peso em device é **E2-02**.

### Portão final

28. Os quatro comandos, do zero, passam nesta ordem, todos **exit 0**:
    ```
    npm run validate      # catalog validate — exemplo íntegro (aviso do exemplo-05 órfão é esperado)
    npm run typecheck      # astro check — strict, sem erro nem warning novo
    npm run build          # prebuild roda o validate; astro build gera / , /404.html , /n/exemplo/ , /sitemap.xml
    npm run doctor         # ambiente ok
    ```
    `npm run dev` sobe sem erro e serve `/` com as 3 telas.
29. As 4 rotas continuam existindo e válidas: `dist/index.html`,
    `dist/404.html`, `dist/n/exemplo/index.html`, `dist/sitemap.xml`. `/` agora
    tem a seção única; `/n/exemplo/` segue no layout antigo (grade agrupada);
    `/404` e `/sitemap.xml` inalterados.
30. `git diff --stat` altera/cria **apenas**:
    `src/pages/index.astro`,
    `src/components/TelaEntrada/TelaEntrada.astro` (novo),
    `src/components/Vitrine/VitrineFoco.astro` (novo),
    `src/components/Vitrine/TrilhaCategorias.astro` (novo),
    `src/components/Vitrine/MiniProduto.astro` (novo),
    `src/components/GradeCatalogo/GradeCatalogo.astro`,
    `src/components/CardProduto/CardProduto.astro`,
    `src/layouts/Base.astro` (1 import + 1 tag),
    e docs (`docs/stories/README.md`, este arquivo, `docs/ESTADO-ATUAL.md`,
    nota em `docs/epics/PLANO-PROXIMO-PASSO.md`).
    **Nada** em `src/data/*`, `src/lib/*`, `src/pages/n/[slug].astro`,
    `src/pages/sitemap.xml.ts`, `src/pages/404.astro`.

---

## Plano de tarefas (ordenado, arquivo por arquivo)

> Sequência pensada para manter `astro check` verde a cada passo. Se E5-01 já
> estiver mergeada, a Tarefa 6 usa `DetalheProduto`; senão, o placeholder.

### Tarefa 1 — `src/components/Vitrine/MiniProduto.astro` (novo)

Props `{ produto: Produto; slug: string }`. `<a class="mini">` com `data-*` (CA 12),
`galeriaDe(produto)[0]` como `<img loading="lazy">`, nome, preço. Estilo: coluna
estreita (~140–160px), `aspect-ratio: 9/16` na imagem, `min-height` da área
tocável ≥ 44px.

### Tarefa 2 — `src/components/Vitrine/TrilhaCategorias.astro` (novo)

Props `{ nicho: Nicho; variante?: 'a' | 'b' }`. `resolverCategorias(nicho, variante ?? 'a')`
→ `<nav class="trilha">` de `<a class="chip" href="#cat-<id>" data-cat data-ir>`.
Primeiro chip ativo (`aria-current="true"`). Faixa com `overflow-x:auto` +
`scroll-snap-type:x proximity`. `scroll-behavior:smooth` só sob
`prefers-reduced-motion: no-preference`.

### Tarefa 3 — `src/components/Vitrine/VitrineFoco.astro` (novo)

Props `{ nicho: Nicho; variante?: 'a' | 'b' }`. Raiz `<section class="vitrine-foco" hidden>`.
`heroiDaVitrine(nicho, variante ?? 'a')` → bloco herói (capa `lazy`, nome, preço,
CTA de saída `target="_blank" rel="noopener nofollow" data-sku`). Faixa de
`<MiniProduto>` para todos os produtos na ordem de `produtosPorCategoria` (achatar
os grupos na ordem das categorias). `data-slot="vitrine-heroi"` na capa.

### Tarefa 4 — `src/components/TelaEntrada/TelaEntrada.astro` (novo)

Props `{ nicho: Nicho }`. Implementar CA 6 inteiro: kicker/título/subtítulo com
`data-slot` que E3 usa; herói resolvido (`entrada.heroiSku` → produto, senão
`heroiDaVitrine(nicho,'a')`); capa **`loading="eager" fetchpriority="high"`**
(única eager); teaser de preço (default = menor preço via `formatarPreco`);
CTA `#tela-vitrine` com `--acento` e `min-height: var(--toque-min)`; slot de
oferta `hidden`. Full-bleed do herói via wrapper ou `margin-inline` negativo.

### Tarefa 5 — `src/components/GradeCatalogo/GradeCatalogo.astro` (alterar)

Trocar a iteração plana por agrupada (CA 16). Novo import:
`import { resolverCategorias, produtosPorCategoria } from '../../lib/catalogo/resolver';`
Props `{ nicho: Nicho; variante?: 'a' | 'b' }`. Para cada categoria:
`<section class="grade-cat"><h2 id={`cat-${c.id}`}>…</h2>[desc]<div class="grade">…cards…</div></section>`.
Manter o `<style>` do grid; adicionar estilos de `.grade-cat`/`.grade-cat-titulo`
(usar `--fs-2`, `--linha`, `--sp-*`). Heading sempre presente (âncora da trilha).

### Tarefa 6 — `src/pages/index.astro` (alterar)

Reescrever o corpo para a seção única (CA 1–4). Imports novos:
`TelaEntrada`, `TrilhaCategorias`, `VitrineFoco` e — se E5-01 mergeada —
`DetalheProduto` (`../components/Detalhe/DetalheProduto.astro`). `const nicho =
resolverNicho(NICHO_PADRAO)`. Estrutura:

```astro
<Base>
  <main class="pagina">
    <div id="app" data-tela="entrada">
      <section id="tela-entrada" class="tela"><TelaEntrada nicho={nicho} /></section>
      <section id="tela-vitrine" class="tela">
        <TrilhaCategorias nicho={nicho} />
        <VitrineFoco nicho={nicho} />
        <GradeCatalogo nicho={nicho} />
      </section>
      <section id="tela-detalhe" class="tela">
        {nicho.produtos.map((p) => (
          <article id={`produto-${p.sku}`} class="detalhe-wrap" data-sku={p.sku}>
            <DetalheProduto produto={p} slug={nicho.slug} cta={nicho.cta} />
            {/* SEM E5-01: substituir a linha acima pelo placeholder do CA 14 */}
          </article>
        ))}
      </section>
    </div>
    <footer class="rodape"><p class="rotulo">Catálogo de vitrine · sem checkout próprio</p></footer>
  </main>
</Base>
```

`<style>` local: `.tela { margin-block: var(--sp-8); }` e o mínimo de layout.
**Nenhuma** regra que dê `display:none` em `.tela`. Sem `<script>`.

### Tarefa 7 — `src/components/CardProduto/CardProduto.astro` (alterar)

`data-sku`/`data-categoria`/`data-prioridade` no `<article>` (CA 19). Envolver
mídia+nome num `<a class="card-ir" href={`#produto-${produto.sku}`} data-ir="detalhe"
data-sku={produto.sku}>` (CA 20). Manter o `.cta` de saída externo no rodapé
(CA 21). Props inalteradas. Ajustar o `<style>` só o necessário para o novo `<a>`
não quebrar o layout (bloco, sem sublinhado — já herda de `global.css`).

### Tarefa 8 — `src/layouts/Base.astro` (alterar — mínimo)

`import TarjaOferta from '../components/TarjaOferta/TarjaOferta.astro';` e
`<TarjaOferta />` logo após `<body>`, antes de `<slot />`. Nada mais.

### Tarefa 9 — Portão + docs + medição

- `npm run validate && npm run typecheck && npm run build && npm run doctor` — exit 0 (CA 28).
- Verificar `dist/`: 4 rotas presentes (CA 29); grep do `dist/index.html` para o
  CA 26 (só a capa do herói eager). Registrar tamanho cru+gzip do `dist/index.html` (CA 27).
- `npm run dev` + roteiro do CA 23 no navegador **sem JS** (as 3 telas empilhadas,
  âncoras funcionando, links de saída presentes).
- `git diff --stat` confere o CA 30.
- `docs/stories/README.md`: E6-01 → 🔵 detalhada; nota "pega depois de E5-01".
- `docs/ESTADO-ATUAL.md` ("O que NÃO existe ainda" / "Andaime"): `index.astro`
  virou seção única de 3 telas; `TelaEntrada`/`VitrineFoco`/`TrilhaCategorias`/
  `MiniProduto` existem; `GradeCatalogo` agrupa por categoria; navegação
  client-side segue pendente (E6-02).
- `docs/epics/PLANO-PROXIMO-PASSO.md`: nota de sequência E5-01 → E6-01 (ver
  seção nova ao fim do arquivo).

---

## Definição de Pronto

- [ ] `npm run validate` / `npm run typecheck` / `npm run build` / `npm run doctor` — todos exit 0.
- [ ] `npm run dev` serve `/` com `<div id="app" data-tela="entrada">` + as 3
      `<section id="tela-*" class="tela">` na ordem entrada/vitrine/detalhe.
- [ ] **Sem JS**: as 3 telas ficam visíveis e empilhadas; CTA da entrada rola até
      a vitrine; chips da trilha rolam até `#cat-<id>`; cards/minis rolam até
      `#produto-<sku>`; todo link de saída presente e com `data-sku` (RF-16.2 / RNF-04).
- [ ] `VitrineFoco` tem `hidden` estático (não aparece sem JS). `GradeCatalogo`
      aparece agrupada por categoria, um `<h2 id="cat-<id>">` por categoria efetiva.
- [ ] `TelaEntrada` usa defaults derivados quando `nicho.entrada` não traz o
      campo (testável: nada quebra se `entrada` for `undefined`).
- [ ] `dist/index.html`: única mídia eager = capa do herói da entrada; resto
      `lazy`/`preload=none` (CA 26). Tamanho cru+gzip registrado no PR (CA 27).
- [ ] `/n/exemplo/`, `/404.html`, `/sitemap.xml` continuam gerados e válidos.
- [ ] Sem dependência nova; sem `<script>` em nenhum componente/arquivo desta
      story; `index.astro` sem `class="js"` nem import de `telas.ts`/`slots`.
- [ ] `git diff --stat` não toca `src/data/*`, `src/lib/*`, `n/[slug].astro`,
      `sitemap.xml.ts`, `404.astro`.
- [ ] Os `data-slot` (`kicker`/`titulo`/`subtitulo`/`entrada-teaser`/
      `entrada-heroi`/`entrada-cta`/`vitrine-heroi`) e os `data-ir`/`data-cat`/
      `data-sku`/`data-categoria`/`data-prioridade` estão no HTML buildado (hooks
      para E6-02 e E3-01).
- [ ] PR descreve: (a) grade alterada no lugar (não novo arquivo); (b)
      `VitrineFoco` entra `hidden`; (c) detalhe usa `DetalheProduto` de E5-01 (ou
      placeholder, se E5-01 pendente); (d) `Base.astro` só ganhou a `TarjaOferta` inerte.

---

## Fora de escopo (fica para E6-02 / E6-03 / E5-01 / E5-02 / E3-01 / E4)

- **`src/lib/navegacao/telas.ts`**, `html.js`, o CSS que oculta `.tela` sob
  `html.js`, `pushState`/`popstate`/`hashchange`, revelar/esconder telas, marcar
  categoria ativa por clique, religar `ligarVideoVertical()` ao entrar no
  detalhe, revisita começando na vitrine (RF-15.2/15.3/15.4, RF-16.3) — **E6-02**.
- **Esquema de hash curto** (`#vitrine`, `#vitrine&cat=<id>`, `#produto=<sku>`) —
  **E6-02**. `[AUTO-DECISION]` esta story usa **ids de elemento reais**
  (`#tela-vitrine`, `#cat-<id>`, `#produto-<sku>`) para a navegação por âncora
  sem JS; E6-02 intercepta os `data-ir` e gerencia seu próprio hash + `search`.
- **`src/pages/n/[slug].astro` migrando para a seção única** (layout compartilhado
  com `index.astro`) — **E6-03**.
- **`DetalheProduto` / `RenderBlocos` / blocos** — **E5-01** (esta story só
  consome; ou usa placeholder).
- **`GaleriaMidia` rica** (scroll-snap + dots) e **`BlocoSpecs`/`<dl>` de specs** —
  **E5-02**. Blocos `como-usar`/`comparativo`/`bonus`/`faq` — **E5-03**.
- **Reescrita das 3 telas por `?n=`/`?c=`/`?o=`** clonando `<template
  id="tpl-*">` — **E3-01/02/03**. Esta story **não** cria nenhum `<template>`
  (E5/E6-02/E3 decidem onde eles entram).
- **OG por nicho, rota no sitemap, `deploy-check`, Web Share** — **E4**.
- **Medição de LCP/peso/TTI em device (4G simulado, webview do TikTok)** —
  **E2-02** (a story só registra o tamanho do `dist/index.html`).
- **Ilha Preact de vitrine** — Could C1, fora.

---

## Riscos / notas de implementação

1. **Ordem entre E5-01 e E6-01.** `[AUTO-DECISION]` **E5-01 primeiro.** E6-01
   consome `DetalheProduto`; fazer E5-01 antes elimina o placeholder e um
   follow-up. O grafo do PLANO-PROXIMO-PASSO já põe E5-01 e E6-01 em paralelo
   depois de E2-03, mas há um acoplamento de consumo (E6-01 → `DetalheProduto`)
   que torna E5-01 o passo natural anterior. Se E6-01 for pega antes por
   capacidade de time, o placeholder do CA 14 mantém a story fechável e a
   integração vira 1 diff.

2. **`VitrineFoco` `hidden` + nenhum JS = vitrine "é" a grade.** Nesta story a
   `VitrineFoco` nunca aparece em `/`. É intencional (doc 09 §2). Quem valida
   visualmente a `VitrineFoco` nesta story usa o `astro dev` e remove o `hidden`
   à mão, ou espera E6-02. Documentar no PR para não parecer bug.

3. **Grade agrupada afeta `/n/[slug].astro` sem ele ser tocado.** `n/[slug].astro`
   chama `<GradeCatalogo nicho={nicho} />`; com o default `variante='a'` ele
   passa a renderizar agrupado. É aceitável (ainda válido, ainda no orçamento) e
   a migração real é E6-03. Confirmar `/n/exemplo/` no `npm run build`.

4. **HTML de `/` cresce (todos os detalhes embutidos).** RNF-13: só a capa do
   herói da entrada é eager; todo o resto é `lazy`/`preload=none`. Os blocos são
   majoritariamente texto. Registrar o tamanho gzip do `dist/index.html` (CA 27)
   — é a linha de base para o `assets check` de E4-03. Se já nesta story o
   `dist/index.html` cru passar de ~250–300 KB, sinalizar no PR (não reprova,
   mas é dado para E2-02).

5. **`data-prioridade` como número vs. string.** Atributos HTML são string;
   usar `String(produto.prioridade ?? 50)` para o `astro check` não reclamar e o
   valor no DOM ser estável para o CSS/analytics de E6-02/E3.

6. **`scroll-snap` da trilha/faixa e o gesto "voltar" do webview.** Doc 09 §5:
   faixas horizontais com `overscroll-behavior-x: contain` para não sequestrar o
   swipe de navegação. Aplicar em `.trilha` e na faixa de minis.

7. **Contraste sobre `--acento` (RNF-07).** CTA da entrada e do herói usam
   `color:#fff` sobre `--acento` (ok para `#1E6FFF` do `exemplo`); anotar que
   nichos de acento claro precisarão de `--acento-texto`/texto escuro — sem gate
   automático (R-07).

8. **`Base.astro` — `TarjaOferta` inerte.** Ela é `position: sticky; top: 0` no
   stub; com `hidden` não ocupa espaço. Conferir que, `hidden`, não empurra o
   layout nem cria scroll fantasma no `dist/index.html`.

9. **Sem runner de teste.** Verificação = `astro check` + `npm run build` +
   roteiro manual do CA 23 (com JS **desligado**) + grep do `dist/index.html`
   (CA 26). A aferição de performance é E2-02.
</content>
