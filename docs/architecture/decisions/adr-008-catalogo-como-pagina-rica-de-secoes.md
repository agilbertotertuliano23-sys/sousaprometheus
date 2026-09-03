# ADR-008 — O catálogo como página rica de seções

**Status:** **Fase 0 aceita** (2026-09-02, Vinicius) — cascade de Fase 0 aplicado
em `architecture/09`, `epics/E6`, `epics/PLANO-PROXIMO-PASSO` e índices.
**Fase 1 proposta**, travada atrás de dois portões (decisão D-02 + slice de
medição em device) antes de qualquer código ou cascade de schema. · **Data:** 2026-09-02
**Decide sobre:** [`docs/ideacao/catalogo-como-pagina-web.md`](../../ideacao/catalogo-como-pagina-web.md) (Direção C, plano em fases)
**Revê:** [ADR-007](adr-007-catalogo-categorizado-e-apresentacao-rica.md), itens 3 e 4.

## Contexto

O ADR-007 fixou um fluxo de 3 telas como estado de uma seção única: **entrada
(capa editorial de um herói, conceito E4)** → **vitrine (1 herói em foco + faixa
de miniaturas, conceito C4)** → **detalhe rico (galeria + benefícios + specs +
blocos)**. As stories E5-01, E6-01 e E6-02 já entregaram a casca dessa direção.

O dono revisou o produto. A tela do meio não deve apresentar "um produto em foco
por vez": deve ser um **catálogo como página web** — um site de vitrine com
design de apresentação dedicado, montado em blocos empilhados:

1. uma **porta do catálogo** (a tela de entrada) que apresenta a **proposta** e a
   **organização** do catálogo — em imagem, elemento e copy — em vez da capa de
   um único produto;
2. um **catálogo dinâmico de categorias**, nichadas em dois eixos (**grupos**
   temáticos e **estilos** de curadoria transversais), cada eixo um **carrossel**
   de cards de categoria personalizados com **uma imagem âncora ao lado** que
   **referencia** (cross-fade) o card em foco;
3. **trilhas de produtos** em sessões, nesta ordem: **em alta / destaques** →
   **por categoria** → **catálogo inteiro** (grade, que também é a degradação
   sem-JS);
4. um bloco de **informações** (curadoria, como comprar, prova social estática);
5. **design, efeitos de transição e personalização dedicada** — por componente
   (tokens CSS próprios) e por nicho (`?n=/?c=/?o=`).

Nada disso quebra os ADRs 001–006 nem o núcleo do ADR-007: continua um HTML
estático buildado uma vez com o nicho padrão, personalização client-side pela
URL, zero backend, orçamento de peso duro, seção única com `#hash` preservando
`?n/?c/?o`, degradação graciosa sem JS. O que muda é a **anatomia** das telas de
`entrada` e `vitrine` — não a stack, o modelo de deploy, a fronteira de
privacidade nem a tela de `detalhe`.

## Decisão

### 1. A tela de entrada vira a "porta do catálogo"

`#tela-entrada` deixa de ser a capa editorial de um produto herói (E4) e passa a
apresentar o catálogo inteiro: um bloco com **copy de proposta** (kicker, título
display, 1 parágrafo do que a pessoa vai encontrar, 1 linha de organização
"N grupos · M estilos · K produtos"), **um mosaico curado** de capas
(≤ 5, sangrando, `--acento` como moldura) e um **CTA** para `#catalogo`.
`nicho.entrada` continua sendo a fonte, com os mesmos campos opcionais + defaults
derivados (`heroiSku` deixa de ser o centro; o mosaico deriva dos grupos).

### 2. A tela do meio vira um catálogo dinâmico em blocos — em duas fases

`#tela-vitrine` deixa de ser `TrilhaCategorias + VitrineFoco + GradeCatalogo`.
O motivo do faseamento está no §7: o produto é para 2–8 produtos/nicho e a
estrutura completa só se justifica com catálogo maior.

**Fase 0 — aceita para implementar já** (só o que um catálogo curto preenche;
quase todo reuso):

- **Porta do catálogo** (em `#tela-entrada`, item 1): proposta + linha de
  organização + mosaico curado + CTA.
- **Bloco 2 — `TrilhasProduto`**: `2a` "em alta / destaques" (carrossel
  cross-categoria por `prioridade` + `destaque`), `2b` uma trilha rotulada por
  categoria efetiva (`<section id="cat-<id>">` + `produtosPorCategoria` — **reuso**
  de `resolver.ts`), `2c` a grade completa (`GradeCatalogo` de hoje) — que **é**
  o fallback sem-JS de todo o Bloco 2.
- **Bloco 3 — `BlocoInformacoes`**: `<footer>` de conteúdo — curadoria, como
  comprar (o clique leva à loja de destino; preço/estoque são de lá), prova
  social estática e verificável, compartilhar (Web Share API), aviso de "sem
  coleta de dados". Sem formulário, sem PII.

`VitrineFoco` (C4) sai. `MiniProduto` / `CardProduto` / `GradeCatalogo` /
`telas.ts` / `slots/*` ficam. A Fase 0 **não muda o schema** (nenhum campo novo).

**Fase 1 — condicional aos dois portões do §7:**

- **Bloco 1 — `CatalogoCategorias`**: por eixo (**grupos**, **estilos**), uma
  trilha em carrossel de cards de categoria + **um painel de imagem âncora** que
  faz cross-fade (≤ 200 ms) para a capa do card central. Layout: imagem fixa
  (~40%) + carrossel (~60%) por trilha, empilhando abaixo de um breakpoint
  estreito (padrão **1a**). O padrão **1c** (painel sticky compartilhado + duas
  faixas) é a **Fase 2**, só após nova medição. Requer os campos de dado do
  item 4.
- Na Fase 0, as categorias já aparecem — como as trilhas rotuladas simples de
  `2b`. O Bloco 1 as **promove** a um navegador de dois eixos quando há conteúdo
  para tal.

### 3. A tela de detalhe não muda

`#tela-detalhe` e tudo do épico E5 (galeria, benefícios, specs, sistema de
blocos, `RenderBlocos`, registry, CTA de saída sticky) permanecem exatamente como
o ADR-007 especifica. Esta decisão não toca E5.

### 4. Campos de dado novos — só a partir da Fase 1

A Fase 0 **não precisa de nenhum campo novo**. Os campos abaixo entram com o
Bloco 1 (Fase 1). Todos aditivos ao schema do ADR-007 e opcionais; o `exemplo.ts`
atual continua válido sem mudança:

| Onde | Campo | Tipo | Default quando ausente |
|---|---|---|---|
| `Categoria` | `grupo?` | `string` | a categoria é seu próprio grupo |
| `Categoria` | `capa?` | `ItemMidia` | capa do produto herói da categoria |
| `Nicho` | `grupos?` | `Array<{ id; rotulo; kicker?; capa? }>` | derivado dos `grupo` das categorias |
| `Nicho` | `estilos?` | `Array<{ id; rotulo; regra }>` | derivado por `resolver.ts` de `tags`/`prioridade`/preço |
| `Nicho.variantes.b` | `ordemGrupos?` | `string[]` | variante `b` = `a` |

Resolução nova, **pura** (mesmo padrão do `resolver.ts` de ADR-007, sem DOM,
usada no build e reusada pelo cliente em `slots/*`): `resolverGrupos`,
`categoriasPorGrupo`, `resolverEstilos`, `capaDaCategoria`.

### 5. Efeitos, transições e personalização por componente

Carrosséis por `scroll-snap` nativo; **Embla** (`^8.6`, já na stack) só quando o
feel exigir e por **import dinâmico** quando a trilha entra em viewport — nunca no
caminho crítico. O "referenciamento" é cross-fade `opacity` entre duas `<img>` de
tamanho fixo (zero CLS). Entrada escalonada por `IntersectionObserver`. Todo
efeito tem versão estática sob `prefers-reduced-motion: reduce` (RNF-08). Cada
bloco expõe tokens CSS próprios (`--cat-acento`, `--bloco-espaco`, `--trilha-gap`,
`--card-raio`, `--ref-fade`) que herdam de `--acento` e são sobrescritíveis por
`data-nicho`/`data-grupo` — nenhum componente hard-coda cor ou espaçamento
(princípio 4 do `design/README`).

### 6. Orçamento de peso — disciplina reforçada

A página fica mais longa. Só carregam **eager**: o mosaico/poster da porta e (na
Fase 1) a imagem âncora da **1ª trilha** do Bloco 1. Todo o resto — capas das
demais categorias, cards das trilhas, galerias de detalhe, vídeos — é
`loading="lazy"` / `preload="none"` (RNF-13). O `assets check` ganha uma métrica
de **peso gzip do `dist/index.html`** (proposta: avisar > 60 KB, falhar > 90 KB
em `--strict`).

### 7. Gate de escala e medição — portões da Fase 1

A Fase 1 (Bloco 1: navegador de categorias em dois eixos + carrossel de
referenciamento) **não começa** sem os dois portões abaixo. Motivo: o produto é
para **2–8 produtos por nicho** (RF-03.1); um navegador de grupos + estilos com
carrosséis tem mais recipiente do que conteúdo nessa escala.

**Portão A — decisão D-02.** A lista de nichos de lançamento (pendente) precisa
fechar com nichos de conteúdo suficiente para o eixo duplo: ordem de **~20+
produtos** e **≥ 3 grupos**. Se os nichos forem de 2–8 → a Fase 1 não se
justifica; a Fase 0 é o produto.

**Portão B — slice de medição em device.** Prototipar `porta + Bloco 1 (padrão
1a) + 1 trilha` com o nicho padrão e medir num **Android médio real no webview
do TikTok**:

| Métrica | Alvo |
|---|---|
| LCP | ≤ 2,5 s (RNF-02) |
| TTI | ≤ 3,5 s (RNF-02) |
| `dist/index.html` gzip | ≤ 90 KB |
| jank de `scroll-snap` + cross-fade | scroll não trava |

Resultado possível: **1a** aprovado · Bloco 1 **enxuto** (sem imagem âncora) ·
ou **adiar o Bloco 1**. A Fase 2 (padrão 1c) exige nova medição depois.

## Alternativas consideradas

| # | Alternativa | Por que não |
|---|---|---|
| A | **Manter a vitrine em foco (C4) e só adicionar uma trilha de "em alta" acima.** Mínima mudança. | Não entrega o "catálogo como página" que o dono pediu; a navegação por grupos/estilos e o referenciamento em carrossel não cabem no formato "1 herói + gaveta". |
| B | **Rota estática por grupo/categoria (`/n/<slug>/<grupo>`).** SEO por grupo. | Sem JS o `<a>` estático perde `?c=/?o=` → quebra atribuição por criativo (R-08). Mesma razão que barrou a alternativa F do ADR-007. Os blocos ficam na seção única, ligados por `#hash`. |
| C | **Painel de imagem sticky compartilhado + duas faixas (padrão 1c) já como baseline.** Referenciamento mais forte. | `position: sticky` + cross-fade + dois Embla no webview do TikTok é risco de perf que só um device de baixo custo confirma. Fica como evolução opcional pós-medição; o baseline é 1a (imagem fixa por trilha). |
| D | **Estilos ("mais vendidos", "premium"…) como categorias de verdade no schema.** | Duplicaria produtos entre listas e furaria "um nível de categoria só". Estilos são cortes transversais — regra pura sobre `tags`/`prioridade`/preço, ou lista curada opcional; nunca um segundo eixo de pertencimento no dado. |
| E | **Carrossel com biblioteca de física de arraste (Swiper, Flicking).** Feel premium. | Peso e CPU no webview; Embla + `scroll-snap` nativo cobrem o caso dentro do orçamento (RNF-01). |
| F | **Blocos do catálogo como conteúdo declarativo tipado (reusar o registry de blocos de ADR-007).** Simetria com o detalhe. | Os blocos do ADR-007 são conteúdo **do produto**, renderizado estático. Os blocos do catálogo são **layout de navegação** com estado (carrossel, referenciamento) — natureza diferente. Reusar o registry acoplaria as duas coisas e engessaria o layout. |

## Consequências

- **+** A tela do meio passa a expressar "vitrine curada e navegável", não "um
  produto por vez" — alinha o produto ao que o dono quer vender.
- **+** Reuso alto: `resolver.ts`, `CardProduto`, `GradeCatalogo` (vira o bloco
  2c / fallback), a máquina de telas (`telas.ts`), o modelo de `slots/*` — tudo
  de ADR-007 continua valendo. E5 (detalhe) intocado.
- **+** Extensão aditiva: campos de dado novos são todos opcionais com derivação
  por default; `exemplo.ts` atual segue válido.
- **+** Continuidade de personalização preservada: seção única, `?n/?c/?o` nunca
  saem da URL.
- **−** `#tela-vitrine` cresce bastante (3 blocos, trilhas, painéis de imagem).
  Mitigado pela disciplina de lazy-load do item 6 e pela métrica de gzip do
  `index.html` no `assets check`.
- **−** `slots/vitrine.ts` (reescrita client-side por `?n=`) agora reconstrói os
  blocos 0–2, não só "herói + miniaturas". Mitigado clonando `<template>`
  buildado (decisão de ADR-007 mantida) e mantendo os blocos como
  estrutura/texto simples.
- **−** E6 precisa ser reescopado e provavelmente nasce um E7 ("catálogo
  dinâmico"). Retrabalho sobre E6-01/E6-02: `VitrineFoco` sai; a casca de telas e
  a navegação por `#hash` ficam.
- **−** Novo risco de perf: carrossel + referenciamento + entrada escalonada no
  webview. Exige a medição em device (E2-02) antes de commitar o padrão 1a, e de
  novo antes de considerar o 1c.
- **−** `catalog validate` cresce de novo: ids de `grupo` referenciados existem;
  `capa`/`estilos[].regra` bem-formados. Mesma mitigação de ADR-007
  (`astro check` + `validarNicho()`). **Só na Fase 1.**
- **−** **Descompasso de escala.** A estrutura completa (dois eixos de categoria +
  4 trilhas + grade + info) tem mais recipiente do que conteúdo para um catálogo
  de 2–8 produtos. **Mitigado pelo faseamento**: a Fase 0 entrega só os blocos
  que a escala curta preenche; a Fase 1 (o navegador de dois eixos) só entra com
  os portões do §7.
- **+** **Faseamento reduz o risco a quase zero na Fase 0.** Ela é porta + trilhas
  + info, sem schema novo, sem carrossel de referenciamento, com retrabalho
  mínimo sobre E6. Todo o custo e o risco de perf ficam na Fase 1, atrás de
  medição.

## O que fica fora do escopo desta decisão

- **A tela de detalhe (E5).** Não muda.
- **Sair da seção única / do modelo de `#hash`.** Continua um documento só.
- **Subcategorias / grupos aninhados.** Um nível de grupo + um de categoria.
- **Estilos calculados por dado dinâmico.** Regra pura sobre dado estático ou
  lista curada — sem backend (ADR-004).
- **Rota estática por grupo/categoria/produto para SEO.** Fora por R-08. A rota
  `/n/<slug>` (E4) renderiza a mesma página longa.
- **Filtro / busca dentro do catálogo.** Catálogo é curto (2–8); grupos e estilos
  são navegação curada.
- **O cascade em si** (arquitetura `08`/`09`/novo `10`, épicos E6/E7,
  `PLANO-PROXIMO-PASSO`, `prd/01`/`prd/02`, índices). Listado no §14 da ideação;
  a fazer **após** o aceite deste ADR.

## Se aceito — próximos passos (cascade faseado)

### Fase 0 (após aceite deste ADR — sem schema, sem `prd` novo)

1. `architecture/09` §1/§4 — `#tela-entrada` vira a porta; `#tela-vitrine` vira
   blocos 2a/2b/2c + informações; `VitrineFoco` sai.
2. `epics/E6` reescopado — troca a `VitrineFoco` pelos blocos 2a–3; a casca de
   telas e a navegação por `#hash` (E6-01/E6-02) ficam.
3. `epics/PLANO-PROXIMO-PASSO` — reordenar; incluir o **slice de medição** como
   item explícito.
4. Índices: `docs/README` (diagrama "Fluxo do produto"), `docs/ESTADO-ATUAL`.

### Portões (não são doc — são decisão + medição)

5. **D-02** fechada (Portão A do §7).
6. **Slice de medição** verde (Portão B do §7).

### Fase 1 (só com 5 e 6 cumpridos)

7. `architecture/08` §2/§4 — campos (`grupo`, `capa`, `grupos`, `estilos`,
   `variantes.b.ordemGrupos`) e funções de resolução novas.
8. `architecture/09` §1/§4 (Fase 1) + `architecture/10` (novo) — Bloco 1, layout
   1a, referenciamento, tokens por componente, tabela de lazy-load.
9. `epics/E7` novo ("catálogo dinâmico") + `epics/PLANO-PROXIMO-PASSO`.
10. `prd/01` (Musts) e `prd/02` (RF/RNF) — grupos/estilos, referenciamento;
    métrica de gzip em RNF-13.
11. Índices de novo.
