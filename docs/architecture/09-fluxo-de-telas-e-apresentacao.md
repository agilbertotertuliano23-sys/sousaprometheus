# 09 — Fluxo de telas: porta → catálogo → detalhe

Decisão de origem: [ADR-007](decisions/adr-007-catalogo-categorizado-e-apresentacao-rica.md)
item 4, **revisto pela [ADR-008](decisions/adr-008-catalogo-como-pagina-rica-de-secoes.md)
(Fase 0 aceita 2026-09-02)**. Modelo de dados: [08](08-catalogo-categorizado.md).

> **O que a ADR-008 Fase 0 mudou neste doc:** a tela de entrada deixou de ser a
> "capa editorial de um herói (E4)" e virou a **porta do catálogo**; a tela do
> meio deixou de ser a "vitrine em foco: 1 herói + gaveta (C4)" e virou um
> **catálogo em blocos** — trilha "em alta", uma trilha por categoria, a grade
> completa (fallback sem-JS) e um bloco de informações. `VitrineFoco` saiu. A
> tela de **detalhe (E5) não mudou**. O modelo de seção única, o `#hash` com
> `?n/?c/?o` intactos e a degradação sem JS **seguem iguais**.
>
> **Fase 1 (fora deste doc até os portões D-02 + slice de medição):** um Bloco 1
> "catálogo dinâmico de categorias" em dois eixos (grupos + estilos) com carrossel
> de referenciamento entra **acima** do Bloco 2. Ver ADR-008 §7 e
> `ideacao/catalogo-como-pagina-web.md` §4/§12.

## 1. As 3 telas como estados de uma seção única

`src/pages/index.astro` (e `src/pages/n/[slug].astro`) renderizam **uma**
`<main class="pagina">` contendo um `<div id="app" data-tela="entrada">` com três
filhas:

```
<main class="pagina">
  <div id="app" data-tela="entrada">

    <section id="tela-entrada" class="tela">
      <!-- PORTA DO CATÁLOGO (ADR-008 §1):
           kicker, título display, 1 parágrafo de proposta,
           1 linha de organização ("N grupos · M estilos · K produtos"),
           mosaico curado de capas (<= 5, sangrando, --acento como moldura),
           CTA no --acento -> #vitrine, tarja de oferta (hidden). -->
      <a class="entrada-cta" href="#vitrine">...</a>
    </section>

    <section id="tela-vitrine" class="tela">

      <!-- BLOCO 2a - EM ALTA / DESTAQUES  (carrossel, cross-categoria) -->
      <section class="trilha" aria-label="Em alta">
        <h2 class="trilha-titulo">EM ALTA</h2>
        <ol class="trilha-carrossel">
          <!-- MiniProduto[] - maior prioridade + destaque:true, de todas as categorias -->
        </ol>
      </section>

      <!-- BLOCO 2b - UMA TRILHA POR CATEGORIA EFETIVA -->
      <section id="cat-<id>" class="trilha">
        <h2 class="trilha-titulo">rotulo</h2>
        <p class="trilha-kicker">kicker</p>
        <p class="trilha-descricao">descricao</p>
        <ol class="trilha-carrossel">
          <!-- produtosPorCategoria(<id>) ordenados por prioridade -->
        </ol>
      </section>
      <!-- ... uma <section id="cat-<id>"> por categoria de resolverCategorias() -->

      <!-- BLOCO 2c - CATALOGO INTEIRO  (grade - e o fallback sem-JS de todo o Bloco 2) -->
      <GradeCatalogo />

      <!-- BLOCO 3 - INFORMACOES -->
      <footer class="info">
        <!-- sobre a curadoria; como comprar (o clique leva a loja de destino;
             preco/estoque sao de la); prova social estatica e verificavel;
             botao compartilhar (Web Share API); aviso "sem coleta de dados" -->
      </footer>

    </section>

    <section id="tela-detalhe" class="tela">
      <!-- INALTERADO (E5) - uma <article id="produto-<sku>"> POR PRODUTO -->
      <article id="produto-exemplo-01">
        <DetalheProduto />   <!-- nome, preco, beneficios, specs, GaleriaMidia,
                                  RenderBlocos, CTA de saida sticky, "voltar" -->
      </article>
      <article id="produto-exemplo-02"> ... </article>
      ...
    </section>

  </div>
</main>
```

### O que é buildado

**Tudo do nicho padrão**, estático:

- a **porta** preenchida com `nicho.entrada` (+ defaults derivados); o mosaico
  deriva das capas dos produtos herói de cada categoria;
- o **Bloco 2a** com os produtos de maior `prioridade`/`destaque` do nicho;
- **uma trilha `<section id="cat-<id>">` por categoria efetiva** (doc 08 §4.1),
  com os produtos da categoria na ordem resolvida;
- a **grade completa** (Bloco 2c) — que serve de fallback sem-JS de todo o
  Bloco 2;
- o **bloco de informações**;
- **uma `<article>` de detalhe por produto**, com galeria, benefícios, specs e
  todos os blocos já renderizados pelos componentes Astro (E5).

Consequência de peso (RNF-01 / RNF-13): só carregam **eager** os assets da porta
(1 imagem/poster ≤ 180 KB / 60 KB — o mosaico usa 1–2 capas eager, o resto
`lazy`). Todo o resto — minis das trilhas, capas da grade, galerias de detalhe,
vídeos de bloco — é `loading="lazy"` e `preload="none"`. O 1º paint continua
sendo ~a porta.

### O que o JS revela / reescreve

`src/lib/navegacao/telas.ts` (E6-02, **inalterado no contrato**, `type="module"`
no fim do `<body>`):

1. No load, lê o `#hash` da URL:
   - vazio ou `#entrada` → `data-tela="entrada"`;
   - `#vitrine` [`#vitrine&cat=<id>`] → `data-tela="vitrine"` (+ rola até a
     `<section id="cat-<id>">`);
   - `#produto=<sku>` → `data-tela="detalhe"` + revela só `#produto-<sku>`.
   - Revisita (há `localStorage['prometeus:ultimo-nicho']` e **sem** `?n=` novo e
     hash vazio) → começa em `#vitrine` (pula a porta). Tráfego frio de primeira
     sempre vê a porta.
2. CSS: as regras que ocultam telas ficam sob `html.js #app[data-tela] .tela { … }`;
   `telas.ts` adiciona `document.documentElement.classList.add('js')` como
   **primeira** linha. Sem JS → sem `.js` → todas as telas visíveis e empilhadas.
3. Navegação: cliques em `[data-ir="vitrine"]`, `[data-ir="detalhe"][data-sku]`,
   `[data-ir="entrada"]`, os `<h2>`/âncoras de categoria e o botão "voltar" da
   tela de detalhe → `irPara(estado)` que:
   - seta `#app.dataset.tela`;
   - `history.pushState(null, '', '#' + hashDoEstado + location.search)`;
   - dá `scrollIntoView` no topo da tela (ou da `<section id="cat-<id>">`);
   - para detalhe: religa `ligarVideoVertical(article)` e a galeria daquele produto.
4. `window.addEventListener('popstate' | 'hashchange', …)` → relê o hash e
   reaplica o estado (o botão "voltar" do webview anda porta ↔ catálogo ↔ detalhe
   sem sair da página).
5. **`?n=/?c=/?o=` nunca são tocados.** `location.search` é concatenado intacto em
   todo `pushState`.

Quando `?n=<nicho ≠ padrão>`: `src/lib/personalizacao/contexto.ts` resolve o
contexto e chama, **antes** de `telas.ts` fixar a tela inicial:

- `slots/entrada.ts` → reescreve os `[data-slot]` da porta (kicker, título,
  parágrafo de proposta, linha de organização, mosaico) a partir de
  `NICHOS[n].entrada` + resolver;
- `slots/vitrine.ts` → reconstrói o Bloco 2a (em alta), as trilhas `#cat-<id>` e
  a grade a partir de `resolver.ts`, clonando o `<template id="tpl-trilha">` e o
  `<template id="tpl-mini">` buildados;
- `slots/detalhe.ts` → substitui as `<article>` de detalhe pelas do novo nicho,
  clonando o `<template id="tpl-detalhe">` e os `<template id="tpl-bloco-*">` (E5);
- `oferta.ts` → tarja + troca de CTA + teaser na porta;
- religa `ligarVideoVertical()` no que ficou visível.

Isto é a evolução da story **E3-01**: de "reescrever cabeçalho + grade" para
"reescrever porta + blocos do catálogo + detalhe", em três módulos sob
`src/lib/personalizacao/slots/`.

## 2. Degradação sem JS — bloco a bloco

| Bloco | Com JS | Sem JS |
|---|---|---|
| **Porta** | 1ª `<section>` visível; CTA `#vitrine` alterna `data-tela` | 1ª `<section>` visível no topo; CTA é âncora nativa `href="#vitrine"` que **rola** até o catálogo. Mosaico = `<a>` estáticos para `#cat-<id>`. Linha de organização e proposta são texto buildado. |
| **2a Em alta** | `<ol class="trilha-carrossel">` com `scroll-snap` (Embla só se o feel exigir) | mesma `<ol>` — `scroll-snap` horizontal nativo; sem Embla continua arrastável |
| **2b Por categoria** | trilha por categoria; `<h2>` navega | `<section id="cat-<id>">` com `<h2>` + minis empilhadas (imagem, preço, tarja, link `href="#produto-<sku>"`) |
| **2c Grade** | pode ficar `hidden` quando as trilhas dão conta | **visível** — `GradeCatalogo` agrupada por categoria efetiva. É o fallback canônico. |
| **3 Informações** | `<footer>` + botão compartilhar | `<footer>` de texto/links; botão de compartilhar `hidden` (sem `navigator.share`) |
| **Detalhe** | `<article>` do produto ativo revelada; resto `hidden` | **todas** as `<article id="produto-<sku>">` visíveis, empilhadas após a grade. Galeria = pilha de `<img loading="lazy">` + `<video controls>`. Specs = `<dl>`. Blocos = componentes Astro estáticos. CTA de saída = `<a target="_blank" rel="noopener nofollow" data-sku>`. |
| **CTA de saída** | sticky no rodapé da tela de detalhe | link inline em cada mini das trilhas e em cada `<article>` de detalhe |

> **Nota de id de categoria:** o `id="cat-<id>"` pertence à `<section>` de trilha
> (Bloco 2b). A grade (Bloco 2c) usa `id="grade-cat-<id>"` nos seus headings para
> não duplicar. As âncoras de navegação apontam a trilha (`#cat-<id>`).

Regra geral: **o HTML buildado é uma página longa e completa do nicho padrão**
(porta + trilha em alta + trilhas por categoria + grade + informações + todos os
detalhes), toda navegável por âncora. O JS só transforma essa página longa em
três telas trocáveis. RNF-04 e R-03 seguem satisfeitos por construção.

## 3. Continuidade da personalização ao longo do fluxo

```
abre  /?n=pet-shop&c=tt-039&o=frete
  |
  v
Base.astro -> contexto.ts roda UMA vez:
  - resolverContexto(location.search + localStorage) -> { nicho, criativo, oferta, variante }
  - aplica --acento, data-nicho/variante/oferta no <html>
  - slots/entrada|vitrine|detalhe reescrevem porta + blocos do catalogo + detalhe
    a partir de NICHOS[nicho] + resolver(variante)
  - oferta.ts aplica tarja + CTA + teaser na porta
  - telas.ts assume a navegacao
  |
  v
navegacao interna (porta -> catalogo -> categoria -> detalhe -> voltar):
  - so history.pushState('#estado' + location.search)  <- search intacto
  - popstate/hashchange releem o hash; o nicho JA esta resolvido em memoria
  |
  v
compartilhar (Web Share API, opcional): navigator.share({ url: location.href })
  -> o link compartilhado carrega ?n/?c/?o + o #hash da tela atual
```

- **`contexto.ts` roda uma vez.** As três telas leem o mesmo `Nicho` resolvido e
  a mesma `variante`. Não há re-resolução por navegação.
- **Os params nunca saem da URL** — nem em `pushState`, nem em `popstate`. Um
  screenshot da URL a qualquer momento do fluxo reproduz o estado.
- **`localStorage['prometeus:ultimo-nicho']`** (único estado persistido, RNF-09)
  é gravado por `contexto.ts` e lido por `telas.ts` só para decidir se pula a
  porta numa revisita.
- **Deep-link para produto:** `#produto=<sku>` opcionalmente com `&b=<idBloco>` →
  `telas.ts` revela a `<article>` e dá `scrollIntoView` no bloco.

## 4. Componentes — novos e alterados (Fase 0)

### Novos

| Componente | Arquivo | Papel |
|---|---|---|
| `PortaCatalogo` | `src/components/Porta/PortaCatalogo.astro` | Porta (ADR-008 §1): kicker, título display, parágrafo de proposta, linha de organização, mosaico curado de capas, CTA no `--acento`, slot da tarja de oferta. `[data-slot]` para reescrita client-side. |
| `TrilhaProdutos` | `src/components/Vitrine/TrilhaProdutos.astro` | `<section class="trilha">` genérica: `<h2>` + kicker/descrição opcionais + `<ol class="trilha-carrossel">` de `MiniProduto`. Usada pelo Bloco 2a e por cada categoria (2b). `scroll-snap` nativo; Embla por import dinâmico só quando a trilha entra em viewport. |
| `BlocoInformacoes` | `src/components/Info/BlocoInformacoes.astro` | `<footer>` de conteúdo: curadoria, como comprar, prova social estática, compartilhar, aviso de privacidade. Astro puro. |

### Mantidos de E5/E6

`MiniProduto` (E6-01), `DetalheProduto` / `GaleriaMidia` / `RenderBlocos` /
`Bloco<Tipo>` (E5) — **inalterados**. Os `<template id="tpl-trilha">`,
`tpl-mini`, `tpl-detalhe`, `tpl-bloco-*` embutidos em `index.astro` são a fonte
de clonagem para `slots/*` ao trocar `?n=`.

### Alterados

| Arquivo | Mudança |
|---|---|
| `src/pages/index.astro` | Do `#app` com `TelaEntrada + TrilhaCategorias + VitrineFoco + GradeCatalogo` para: `PortaCatalogo` na tela de entrada; `TrilhaProdutos` (em alta) + `TrilhaProdutos[]` (por categoria) + `GradeCatalogo` + `BlocoInformacoes` na tela de vitrine. Embute os `<template>`. |
| `src/pages/n/[slug].astro` | Mesma seção única, buildada com o nicho da rota; ganha OG/canonical por nicho (E4). |
| `src/layouts/Base.astro` | Inclui `TarjaOferta` após `<body>`; carrega `telas.ts` + `slots/index.ts` além de `contexto.ts` e `video-vertical.ts`. Adiciona `class="js"` cedo via `telas.ts`. |
| `src/components/GradeCatalogo/GradeCatalogo.astro` | Continua agrupando por categoria efetiva, mas com headings `id="grade-cat-<id>"` (nota do §2). Vira explicitamente o Bloco 2c / fallback sem-JS. |
| `src/components/CardProduto/CardProduto.astro` | Mantém `data-categoria/prioridade/sku` + link `href="#produto-<sku>"`. Continua o átomo visual reusado por `MiniProduto` e pela grade. |
| `src/lib/personalizacao/contexto.ts` | Orquestra: após `data-*`, chama `slots/index.ts` (porta + blocos do catálogo + detalhe), `aplicarOferta`, e devolve o contexto para `telas.ts`. |
| `src/lib/personalizacao/slots.ts` | Vira `slots/index.ts` + `slots/{entrada,vitrine,detalhe}.ts`. `slots/vitrine.ts` reconstrói o Bloco 2a + as trilhas `#cat-<id>` + a grade (não mais "herói + miniaturas"). |
| `src/lib/personalizacao/criativo.ts` | `ordenarProdutos` + `ordenarCategorias(nicho, variante)`. `heroi()` deixa de ser necessário na Fase 0; fica para a Fase 1 se o Bloco 1 quiser um card de grupo em foco. |
| `src/lib/personalizacao/oferta.ts` | `aplicarOferta` mostra a tarja, troca o CTA e injeta o `teaserEntrada` na porta. |
| `scripts/console/lib.mjs` + `commands/catalog.mjs` | Text-scan do schema (doc 08 §6) — **inalterado na Fase 0** (sem campo novo). |

### Removidos / aposentados

| Arquivo | Motivo |
|---|---|
| `src/components/Vitrine/VitrineFoco.astro` | O herói em foco (C4) saiu da direção (ADR-008). |
| `src/components/Vitrine/TrilhaCategorias.astro` | A trilha de chips/abas some na Fase 0 (as categorias são as trilhas de produto 2b, cada uma com seu `<h2>`). **Pode voltar na Fase 1** como navegação do Bloco 1. Manter no repo marcado `@deprecated` até a Fase 1 decidir. |

### Inalterados (confirmar)

`src/lib/navegacao/telas.ts` (contrato intacto — só passa a rolar até
`<section id="cat-<id>">` em vez de ativar chips), `src/lib/midia/video-vertical.ts`,
`src/lib/motion/reduced-motion.ts`, `src/data/personalizacao.ts` (hash),
`src/data/nichos.ts` (índice), `src/lib/catalogo/resolver.ts` (as funções de E2-03
cobrem tudo da Fase 0), `src/lib/catalogo/validar.ts`, `src/components/blocos/*`,
`src/components/Detalhe/*`.

## 5. Riscos específicos deste fluxo

| Risco | Mitigação |
|---|---|
| **Descompasso de escala** — trilha em alta + 1 trilha por categoria + grade, tudo para 2–8 produtos | ADR-008 §7. Na Fase 0 as trilhas com 2–3 itens funcionam como "prateleira curta"; a grade (2c) sempre mostra tudo junto. O eixo duplo (grupos + estilos) é Fase 1, atrás dos portões. |
| HTML da seção única fica grande | RNF-13: só a porta eager; resto `lazy`/`preload=none`. Blocos são majoritariamente texto. `assets check` mede o `dist/index.html` gzip (nova métrica — teto proposto 90 KB). |
| `scroll-snap` das trilhas briga com o gesto "voltar" do webview | Trilha horizontal **dentro** de container com `overscroll-behavior-x: contain`; a navegação entre telas é por hash, não por scroll. |
| `pushState` + webview do TikTok: `popstate` inconsistente | Já mitigado em E6-02 (ouve `popstate` **e** `hashchange`). Reconfirmar no slice de medição. |
| Porta "parece um índice seco" e a pessoa não entra | ADR-008 §1: a porta carrega mosaico de capas reais + linha de organização concreta, não só tipografia + botão. |
| Reduced-motion | `telas.ts` troca `data-tela` sem transição quando `prefereMenosMovimento()`; trilhas sem animação de entrada; `scroll-snap` continua (é navegação, não decoração). |
| Embla no caminho crítico | Import dinâmico só quando a trilha entra em viewport **e** `html.js`. `scroll-snap` nativo é o baseline. |
