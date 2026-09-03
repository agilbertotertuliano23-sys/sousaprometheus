# Ideação — O catálogo como página web (porta + catálogo dinâmico + trilhas)

**Data:** 2026-09-02 · **Autor:** Atlas (AIOX Analyst) · **Status:** leque de ideias para decisão do dono
**Escopo:** ideação estruturada. Nada aqui é implementação. Não altera código.
**Decide-se em:** [ADR-008](../architecture/decisions/adr-008-catalogo-como-pagina-rica-de-secoes.md).

Contexto: a [ideação anterior](entrada-e-pagina-virtual.md) e o
[ADR-007](../architecture/decisions/adr-007-catalogo-categorizado-e-apresentacao-rica.md)
fixaram um fluxo de 3 telas: **capa editorial de um herói (E4)** → **vitrine em
foco: 1 herói + gaveta de miniaturas (C4)** → detalhe rico. O dono revisou a
direção: a tela do meio não deve ser "1 produto em foco por vez", e sim um
**catálogo como página web** — um site de vitrine com **design de apresentação
dedicado**, montado em blocos:

1. uma **tela de entrada ao catálogo** que apresenta a **proposta** e a
   **organização** (em imagem, elemento e copy) — não a capa de um único produto;
2. um **catálogo dinâmico** que mostra as **categorias nichadas por grupos e por
   estilos**, com **carrossel de referenciamento** e **uma imagem âncora ao
   lado**, cards personalizados e efeitos;
3. abaixo, **trilhas de produtos** em sessões — **em alta / destaques**, depois
   **por categoria**, depois **o catálogo inteiro**;
4. abaixo, um bloco de **informações**;
5. tudo enquadrado com **design, efeitos de transição e personalização dedicada**
   — por componente e por nicho.

Este documento entrega o leque, a matriz de decisão e uma recomendação, e fecha
com o que isto muda nos documentos existentes.

---

## 1. Resumo da leitura — o que continua travado

Toda ideia abaixo respeita as mesmas restrições duras da ideação anterior (§1 de
[entrada-e-pagina-virtual.md](entrada-e-pagina-virtual.md)):

1. **Um HTML, buildado uma vez com o nicho padrão.** Personalização client-side
   por `?n=` / `?c=` / `?o=` + `localStorage['prometeus:ultimo-nicho']`. Sem rota
   dinâmica, sem servidor, sem SSR (ADR-003 / ADR-004).
2. **Orçamento de peso é lei.** ≤ 1,2 MB no 1º paint; imagem 180 KB, poster
   60 KB, vídeo 400 KB. LCP ≤ 2,5 s / TTI ≤ 3,5 s em 4G no webview
   (RNF-01 / RNF-02 / RNF-13).
3. **Funciona inteira sem JS.** Nicho padrão renderizado, links de saída ativos,
   navegável por âncora (RNF-04 / RF-16).
4. **`prefers-reduced-motion: reduce` zera animação e transição** (RNF-08).
   Qualquer carrossel, referenciamento, parallax ou entrada escalonada precisa de
   um caminho estático equivalente.
5. **Proibido three.js / WebGL / `.glb` (R-05).** CSS transforms, CSS 3D e
   parallax leve são permitidos — mas pagam CPU no webview; testar em device.
6. **Sem framework no caminho crítico.** HTML Astro puro no 1º paint. Embla
   Carousel (`^8.6`, já na stack) ou uma ilha Preact (~4 KB) só onde a interação
   justificar, `type="module"` no fim do `<body>` (RNF-03).
7. **Fundo quase-preto fixo (`#0A0B0C`).** A única cor variável é `--acento`, por
   nicho, com contraste AA (`--acento-texto` quando reprovar). Sem 2ª cor
   cromática por estado. Fontes com fallback de sistema (`prd/05`, `design/01`).
8. **Catálogo curto por design (2–8 produtos por nicho).** Alvo de toque ≥ 44px,
   `--largura-pagina: 480px`. Conversão é sempre link de saída externo
   (`target="_blank" rel="noopener nofollow"` + `data-sku`/`data-variante`). Sem
   carrinho, sem login, sem PII.

**O que este documento revisita** (e só isto): a **tela do meio** do fluxo de
ADR-007. A entrada deixa de ser "capa de um herói" e vira "porta do catálogo"; a
"vitrine em foco (C4)" vira o "catálogo dinâmico + trilhas". A tela de **detalhe
(E5) não muda**. O modelo de seção única, o `#hash` com `?n/?c/?o` intactos, a
degradação sem JS e o orçamento de peso **seguem como estão**.

**Implicação de projeto:** o diferencial continua vindo de **enquadramento, ritmo
e copy** — agora com mais superfície de layout (blocos, trilhas, referenciamento)
e uma disciplina de lazy-load mais rígida, porque a página fica mais longa.

### 1.1 O descompasso de escala — a ressalva central

O produto é desenhado para **2 a 8 produtos por nicho** (RF-03.1, "catálogo curto
por design"). A página proposta tem **5 a 7 seções grandes** (porta + dois eixos
de categoria + trilha "em alta" + trilha por categoria + grade + info) para
apresentar, no limite, 8 produtos:

- carrossel de 3 itens não é carrossel, é uma fila;
- "grupos" com 2 categorias de 2 produtos cada parece vazio;
- a estrutura tem mais recipiente do que conteúdo.

Essa arquitetura rica encaixa num catálogo de ~40–200 SKUs. Com 2–8 ela lê como
sobre-engenharia. **Resolução: encenar em fases** (§12), com dois portões:

1. **Decisão D-02** — quais nichos e quantos produtos por nicho (pendente). Se os
   nichos forem mesmo de 2–8 → só a Fase 0. Se forem de ~20+ → a Fase 1 se
   justifica.
2. **Slice de medição em device** — LCP/TTI/peso do `index.html`/jank num Android
   médio real no webview do TikTok, antes de aceitar o ADR-008.

O eixo duplo (grupos + estilos) e o carrossel de referenciamento **só entram na
Fase 1**, e só se os dois portões passarem.

---

## 2. Anatomia da página — bloco a bloco

Uma página longa (`index.astro` / `n/[slug].astro`), ainda dentro do `#app` de
seção única de ADR-007. Os três estados de tela permanecem: `entrada`, `vitrine`,
`detalhe`. O que muda é o **conteúdo de `entrada` e `vitrine`**.

```
#app[data-tela]
│
├─ #tela-entrada ─── BLOCO 0  PORTA DO CATÁLOGO
│                    proposta + organização, em imagem/elemento/copy
│                    CTA → #catalogo
│
├─ #tela-vitrine ─┬─ BLOCO 1  CATÁLOGO DINÂMICO DE CATEGORIAS   ── FASE 1 (condicional)
│                 │           trilhas "por grupos" e "por estilos"
│                 │           carrossel de referenciamento + imagem âncora ao lado
│                 │           cards de categoria personalizados
│                 │           (Fase 0: substituído pelas trilhas rotuladas do Bloco 2b)
│                 │
│                 ├─ BLOCO 2  TRILHAS DE PRODUTOS  (sessões, nesta ordem)
│                 │           2a. Em alta / Destaques   (carrossel, cross-nicho)
│                 │           2b. Por categoria         (uma trilha rotulada por categoria efetiva)
│                 │           2c. Catálogo inteiro      (grade — e o fallback sem-JS)
│                 │
│                 └─ BLOCO 3  INFORMAÇÕES
│                             curadoria, como comprar, prova social estática, avisos
│
└─ #tela-detalhe ── (INALTERADO — E5: galeria + benefícios + specs + blocos + CTA saída)
```

**Regra de ouro (RNF-04 / RF-16):** o HTML buildado é essa página inteira do
nicho padrão, empilhada e navegável por âncora (`#catalogo`, `#grupo-<id>`,
`#cat-<id>`, `#produto-<sku>`). O JS só transforma a pilha em estados de tela e
liga os carrosséis. Sem JS, tudo aparece e todos os links funcionam.

---

## 3. Bloco 0 — Porta do catálogo (tela de entrada)

**Job:** transição de contexto vindo do TikTok + enquadrar **o que é esta
vitrine** e **como ela está organizada**, antes de a pessoa rolar. Precisa
carregar conteúdo real (produto, preço, prévia de categoria) para merecer o
toque — a regra transversal da ideação anterior continua valendo (nada de
interstício puro).

Três peças, sempre presentes:

- **Copy** — `kicker` (nicho + edição, ex.: "VITRINE Nº 07 · PET"), `título
  display` (a promessa do nicho, de `nicho.titulo`), **1 parágrafo de proposta**
  (o que a pessoa vai encontrar e por que foi curado), **1 linha de organização**
  ("N grupos · M estilos · seleção de K produtos") e o **CTA** ("Entrar no
  catálogo").
- **Imagem / elemento** — um **mosaico curado** (3–5 miniaturas: uma capa por
  grupo, ou os produtos herói de cada grupo), sangrando na borda, com o `--acento`
  como moldura. Sem vídeo pesado; se houver movimento, é 1 poster ≤ 60 KB
  (o LCP mora aqui).
- **Estado** — 1ª visita vê a porta; revisita (`localStorage`, sem `?n=` novo,
  sem hash) pode cair direto no `#catalogo` (RF-15.4).

### Conceitos (P-1 a P-4)

Convenção de custo: **baixo** = HTML + CSS. **médio** = estado JS leve e/ou 1
asset no orçamento e/ou coreografia com fallback. **alto** = ilha, asset por
criativo, ou risco de perf que exige teste em device.

#### P-1 — Sumário editorial ("O que tem aqui")
**O que é:** título display + parágrafo de proposta + uma **tira das
categorias-grupo** como pastilhas grandes tappáveis (cada uma → `#grupo-<id>`).
A "organização" fica explícita: a pessoa vê os grupos antes de entrar.
**Com `?n=/?c=/?o=`:** `?n=` → título + acento + os grupos listados; `?c=` →
ordem das pastilhas / qual vem destacada; `?o=` → tarja de oferta já na porta.
**JS-off:** pastilhas são âncoras nativas `href="#grupo-<id>"`.
**Custo:** baixo. **Risco:** parecer um índice seco — mitigar com 1 imagem herói
sangrando ao lado da lista.

#### P-2 — Mosaico de capas (colagem de curadoria)
**O que é:** uma grade irregular de 4–6 capas (produtos herói / capas de
categoria) ocupando a viewport, com o título e a proposta sobrepostos num canto,
CTA no acento. Comunica "curadoria" e "variedade" numa olhada.
**Com `?n=/?c=/?o=`:** `?n=` → o conjunto de capas + acento; `?c=` → qual capa é
a maior / ordem; `?o=` → selo numa das capas.
**JS-off:** grade estática de `<a>` — cada capa linka `#cat-<id>`.
**Custo:** baixo–médio (peso: só 1–2 capas eager, resto `lazy`).
**Risco:** peso se todas as capas forem eager; disciplina de `loading="lazy"`
obrigatória abaixo da 1ª linha.

#### P-3 — Porta com prévia do carrossel
**O que é:** a porta já mostra a **primeira trilha do catálogo** (o carrossel "por
grupos") parcialmente visível na base da tela, com o título/proposta acima. O CTA
é opcional — rolar ou arrastar o carrossel já entra.
**Com `?n=/?c=/?o=`:** `?n=` → trilha + acento; `?c=` → grupo que abre em foco;
`?o=` → tarja fixa.
**JS-off:** o carrossel é `scroll-snap` nativo; a porta é só a 1ª seção acima.
**Custo:** médio. **Risco:** a "prévia" conta como conteúdo abaixo da dobra —
cuidar do LCP (a imagem âncora do 1º grupo é o único asset pesado eager).

#### P-4 — Declaração + número
**O que é:** fundo escuro, **1 frase de proposta forte** + **1 número curado e
verdadeiro** em mono ("a partir de R$ 39,90" · "3 grupos, 24 seleções"), CTA.
Minimalista, rápido, pattern interrupt.
**Com `?n=/?c=/?o=`:** `?n=` → a frase + número; `?o=` → troca para o número da
oferta; `?c=` → variante da frase.
**JS-off:** trivial — é texto + link.
**Custo:** baixo. **Risco:** sem imagem real pode parecer anúncio e ser pulada;
número tem de ser defensável pelo dono (nada de "ao vivo" — não há backend).

---

## 4. Bloco 1 — Catálogo dinâmico de categorias

> **Fase 1 — condicional.** Este bloco só entra se D-02 fechar com nichos de
> conteúdo suficiente (ordem de ~20+ produtos, ≥ 3 grupos) **e** o slice de
> medição passar (§12). Na Fase 0, as categorias aparecem como trilhas rotuladas
> simples (Bloco 2b), sem cards de categoria nem imagem âncora.

O coração da revisão. Categorias **nichadas em dois eixos**:

- **Grupos** — famílias temáticas dentro do nicho. Ex. "pet-shop": *Cães · Gatos
  · Aquário · Pássaros*. É a `Categoria[]` curada de ADR-007 (`nicho.categorias`),
  com um campo de agrupamento novo (ver §12, handoff).
- **Estilos** — cortes transversais de curadoria que atravessam os grupos. Ex.:
  *Mais vendidos · Econômico · Premium · Para presentear*. Derivam de `tags` /
  `prioridade` / `precoCentavos` (regra pura no `resolver.ts`), **sem novo dado
  obrigatório** — ou de uma lista curada opcional por nicho.

Cada eixo é uma **trilha** (faixa horizontal) de **cards de categoria** num
**carrossel**, e cada trilha tem **uma imagem âncora ao lado** que **referencia**
o card em foco (a "animação de referenciamento": ao mover o carrossel, o painel
de imagem faz cross-fade para a capa da categoria/grupo que entrou no centro).

### Cards de categoria — personalização

Cada card carrega: capa (`Categoria` ganha `capa?: ItemMidia`), `kicker`,
`rotulo`, `descricao` (1 frase), contagem de produtos, e um `--cat-acento`
opcional (herda `--acento` do nicho; um grupo pode ter um tint próprio). Efeitos:
o card central é maior (`scale` sutil), vizinhos angulados/esmaecidos, borda no
acento no foco. Toque no card → trilha de produtos daquele grupo (`#cat-<id>`) ou
tela de detalhe do produto herói do grupo.

### Padrões de layout (1a / 1b / 1c)

#### 1a — Imagem fixa à esquerda + carrossel à direita, por trilha
**O que é:** cada trilha ocupa uma faixa; à esquerda (~40%) o **painel de imagem
âncora** (capa da categoria/grupo em foco), à direita (~60%) o carrossel
horizontal de cards. Rolar/arrastar o carrossel troca a imagem por cross-fade.
**Referenciamento:** 1:1 — 1 imagem por trilha, segue o card central.
**JS-off:** imagem = capa do 1º card; carrossel = `scroll-snap` horizontal.
**Custo:** médio. **Risco:** em telas estreitas (< 480px) o split 40/60 aperta —
empilhar (imagem em cima, carrossel embaixo) abaixo de um breakpoint.

#### 1b — Card-herói central com imagem embutida
**O que é:** carrossel full-width; o card no centro é grande e **contém** a
imagem da categoria + kicker + descrição + CTA; os vizinhos são cards estreitos
só com rótulo. Uma trilha por grupo, empilhadas verticalmente; os "estilos" viram
uma faixa de chips acima.
**Referenciamento:** a imagem está *dentro* do card em foco — o "ao lado" vira
"em foco". Menos literal, mas mais simples.
**JS-off:** `scroll-snap`; o card central perde o destaque de escala mas continua
legível.
**Custo:** baixo–médio. **Risco:** menos do efeito "imagem ao lado" que o dono
pediu; é a opção conservadora.

#### 1c — Painel de imagem sticky compartilhado + duas faixas
**O que é:** no topo do bloco, **um painel de imagem grande sticky**; abaixo,
**duas faixas** de carrossel — "Por grupos" e "Por estilos". Qualquer card que
entre em foco em qualquer das faixas atualiza o painel sticky (cross-fade +
kicker + rótulo). É o "referenciamento" no sentido mais forte: um visor único que
reage à navegação nas duas trilhas.
**JS-off:** o painel sticky vira uma capa estática (1ª categoria); as duas faixas
são `scroll-snap`.
**Custo:** alto. **Risco:** `position: sticky` + cross-fade + dois Embla no
webview = teste em device obrigatório; maior superfície de JS. É o de maior "uau"
e o de maior risco de perf.

### Efeito de referenciamento — mecânica permitida

- **Cross-fade da imagem âncora** ao mudar o card central: `opacity` transition
  ≤ 200 ms sobre duas `<img>` empilhadas (a que sai e a que entra), disparado por
  `IntersectionObserver` no card ou pelo evento `select` do Embla.
- **Sem reflow:** o painel de imagem tem tamanho fixo; só a `<img>` de dentro
  troca. Zero layout shift (CLS).
- **`prefers-reduced-motion`:** troca instantânea, sem fade.
- **Peso:** só a imagem âncora da **1ª trilha** é eager. As demais capas de
  categoria são `loading="lazy"` + `decoding="async"`; ao focar um card, se a
  capa ainda não carregou, o painel mostra um placeholder no `--acento` até o
  `load`.

---

## 5. Bloco 2 — Trilhas de produtos (as sessões)

Abaixo do catálogo de categorias, nesta ordem (pedido do dono):

### 2a — Em alta / Destaques
Uma trilha (carrossel) com os produtos de maior `prioridade` e os marcados
`destaque: true`, **atravessando todas as categorias** do nicho. Rótulo de seção
tipográfico ("EM ALTA", mono, `--tracking-label`) — sem depender de emoji
(forma + tipografia comunicam, princípio herdado do ARES). Máx. ~6 cards.
**`?c=`** pode trocar quem entra e a ordem; **`?o=`** põe a tarja em todos.

### 2b — Por categoria
Para **cada categoria efetiva** (na ordem curada de `resolverCategorias`), uma
trilha rotulada:

```
<section id="cat-<id>">
  <h2>rotulo</h2>  <p class="kicker">kicker</p>  <p>descricao</p>
  <trilha carrossel>  produtosPorCategoria(id) ordenados por prioridade  </trilha>
</section>
```

Reusa `resolver.ts` de ADR-007 **sem mudança de contrato**. Sem-JS: as trilhas
viram cards empilhados sob cada `<h2 id="cat-<id>">` — que é exatamente o
fallback já especificado em `architecture/09` §2.

### 2c — Catálogo inteiro
Uma **grade** com todos os produtos do nicho (a `GradeCatalogo` de hoje,
agrupada por categoria). Serve de "ver tudo" e **é a degradação sem-JS** de todo
o Bloco 2. Nada novo aqui — só posicionada por último.

### Card de produto

Inalterado no conteúdo (capa da galeria, nome, preço + tarja `-NN%`,
`data-sku`/`data-categoria`/`data-prioridade`, toque → `#produto-<sku>`). O átomo
visual (`CardProduto`) é o mesmo reusado nas trilhas e na grade. O CTA de **saída
externa** continua no detalhe e na capa do herói — não em cada card (RF-04.3).

---

## 6. Bloco 3 — Informações

Faixa de conteúdo curto, tipográfico, no fim da página. O que entra:

- **Sobre a curadoria** — 2–3 linhas: por que estes produtos, como foram
  escolhidos (pesquisa + potencial de venda). Sobe o valor percebido.
- **Como comprar** — deixa explícito que o toque leva à loja/afiliado de destino
  e que **preço e estoque são de lá** (gerencia expectativa, reduz atrito
  pós-clique).
- **Prova social estática e verificável** — se o dono fornecer: "mais levado da
  seção", "esgotou 2x". Rótulo mono pequeno. **Nunca contador "ao vivo"** (sem
  backend).
- **Utilitários** — link de compartilhar (Web Share API, RF-09.2), voltar ao
  topo, e o aviso de que a vitrine não coleta dados (RNF-09).
- **Sem formulário, sem newsletter, sem PII.**

Sem-JS: é só um `<footer>` de texto e links — degrada sozinho.

---

## 7. Efeitos e transições — catálogo do que é permitido

Todos sob guarda de `prefers-reduced-motion: reduce` → **versão estática
equivalente** (RNF-08). Nada bloqueia o 1º paint.

| Efeito | Onde | Mecânica | Custo perf | Fallback reduced-motion |
|---|---|---|:--:|---|
| **Referenciamento** (imagem âncora segue o carrossel) | Bloco 1 | cross-fade `opacity` ≤ 200 ms entre 2 `<img>` | médio | troca instantânea |
| **Entrada escalonada de cards** | Blocos 1, 2 | `IntersectionObserver` + `transition` de `translateY`/`opacity`, `stagger` por índice | baixo | cards já visíveis, sem transform |
| **Foco no card central** (escala + vizinhos angulados) | carrosséis | `transform: scale()` + `rotateY()` leve no CSS, classe no card central | médio | sem transform; card central só ganha borda |
| **Snap do carrossel** | trilhas | `scroll-snap-type: x` nativo; Embla só se o feel exigir | baixo | idêntico (nativo) |
| **Sticky do painel de imagem** | Bloco 1 padrão 1c | `position: sticky` | médio (webview) | vira capa estática no topo do bloco |
| **Parallax leve no cabeçalho de bloco** | entre blocos | `translate3d` no scroll ou `animation-timeline: scroll()` c/ fallback | médio | camadas planas |
| **Transição entre telas** (`entrada`↔`vitrine`↔`detalhe`) | `telas.ts` | troca de `data-tela` + fade curto | baixo | troca sem fade (já é assim em ADR-007) |
| **Cross-fade de capa** ao trocar produto em foco | Bloco 2a | `opacity` ≤ 200 ms | baixo | instantâneo |

**Proibido:** scroll-jacking `mandatory` que brigue com o momentum do webview
(usar `proximity`); qualquer animação que segure conteúdo > 0,5 s; libs de física
de drag; `.glb`/WebGL (R-05).

---

## 8. Personalização dedicada — por componente e por nicho

### Por componente

Cada bloco expõe tokens próprios que **herdam** de `--acento` mas podem ser
afinados sem tocar o núcleo:

| Token | Escopo | Default | Uso |
|---|---|---|---|
| `--cat-acento` | card / trilha de categoria | `var(--acento)` | tint de um grupo específico |
| `--bloco-espaco` | por bloco | `var(--sp-6)` | densidade vertical do bloco |
| `--trilha-gap` | carrossel | `var(--sp-3)` | respiro entre cards |
| `--card-raio` | card | `var(--raio)` | forma do card por nicho/bloco |
| `--ref-fade` | referenciamento | `200ms` | duração do cross-fade (0 em reduced-motion) |

São variáveis CSS declaradas no `:root` do nicho padrão (build) e sobrescritas
por `data-nicho` / `data-grupo` — mesma mecânica de `--acento` (ADR-007 /
`design/README` princípio 4). Nenhum componente hard-coda cor ou espaçamento.

### Por nicho (`?n=` / `?c=` / `?o=`)

Evolução da story **E3-01** (que já cresceu de "cabeçalho + grade" para "entrada
+ vitrine + detalhe"). Agora `slots/vitrine.ts` reescreve **os blocos 0–2**:

- **`?n=`** — reescreve: proposta e mosaico da porta; os **grupos** e **estilos**
  do Bloco 1; as capas âncora; as trilhas do Bloco 2; o texto do Bloco 3. Tudo a
  partir de `NICHOS[n]` + `resolver.ts`, clonando `<template>` buildado (evita
  gerar marcação em JS — decisão de ADR-007 mantida).
- **`?c=`** — bucket `a`/`b`: reordena grupos (`variantes.b.ordemGrupos`, novo),
  reordena estilos, reordena produtos nas trilhas (`variantes.b.ordem`, já
  existe), troca o grupo/produto que abre em foco, troca a chamada da porta
  (`chamadaEntrada`, já existe).
- **`?o=`** — tarja/selo global visível na porta e em todas as trilhas; troca o
  texto do CTA de saída; injeta o `teaserEntrada` na porta (já especificado).

`?n/?c/?o` **nunca saem da URL** — todo `pushState` concatena `location.search`
intacto (RF-15.2, inalterado).

---

## 9. Degradação sem JS — bloco a bloco

| Bloco | Com JS | Sem JS |
|---|---|---|
| **0 Porta** | 1ª tela; CTA alterna `data-tela` | 1ª `<section>` no topo; CTA é âncora `href="#catalogo"`; mosaico = `<a>` estáticos |
| **1 Categorias** | carrossel Embla/snap + imagem âncora com cross-fade | `scroll-snap` horizontal nativo (ou `flex-wrap` para grade); imagem âncora = capa estática do 1º card; cards linkam `#cat-<id>` |
| **2a Em alta** | trilha carrossel | cards empilhados sob `<h2>EM ALTA</h2>` |
| **2b Por categoria** | trilha por categoria | `<h2 id="cat-<id>">` + cards empilhados (já é o fallback de `architecture/09`) |
| **2c Catálogo** | grade | grade (idêntico) |
| **3 Informações** | `<footer>` + botão compartilhar | `<footer>` de texto/links; botão de compartilhar escondido (sem API) |
| **Detalhe** | inalterado (E5) | inalterado — todas as `<section id="produto-<sku>">` visíveis, empilhadas |

Regra geral (RF-16, inalterada): o HTML buildado é a página longa e completa do
nicho padrão; o JS só a converte em telas trocáveis e liga os carrosséis.

---

## 10. Orçamento de peso — o que carrega quando

A página fica mais longa → a disciplina de lazy-load aperta (RNF-13):

| Asset | Estratégia |
|---|---|
| Poster/mosaico da **porta** | **eager** (LCP) — 1 imagem ≤ 180 KB ou poster ≤ 60 KB |
| Imagem âncora da **1ª trilha** do Bloco 1 | **eager** — 1 imagem ≤ 180 KB |
| Capas das demais categorias / grupos | `loading="lazy"` `decoding="async"` — placeholder no `--acento` até `load` |
| Capas dos cards das trilhas do Bloco 2 | `loading="lazy"` |
| Vídeos (qualquer trilha) | `preload="none"`, autoplay só ≥ 60% visível (RNF-05); nunca autoplay em trilha abaixo da dobra |
| Galerias de **detalhe** | `loading="lazy"` / `preload="none"` (E5, inalterado) |
| Embla | só carrega se `html.js` **e** a trilha entrou em viewport (import dinâmico); `scroll-snap` nativo cobre o resto |

Nova métrica no `assets check` (já sugerida em ADR-007 / RNF-13): peso **gzip do
`dist/index.html`** — a página longa não pode estourar um teto (proposta:
avisar > 60 KB gzip, falhar > 90 KB no `--strict`).

---

## 11. Matriz de decisão

Escala 1–5, **maior = melhor**: Impacto (retenção/conversão), Esforço
(5 = barato/rápido), Risco (5 = baixo risco), Aderência (5 = dentro das
restrições). "Total" = soma bruta (máx. 20), só para ordenar.

### Tela de entrada (porta)

| # | Conceito | Impacto | Esforço | Risco | Aderência | Total | Justificativa (1 frase) |
|---|---|:--:|:--:|:--:|:--:|:--:|---|
| P-1 | Sumário editorial | 4 | 5 | 4 | 5 | **18** | Torna a organização explícita por quase nada; risco de parecer índice seco. |
| P-2 | Mosaico de capas | 4 | 4 | 3 | 5 | **16** | Comunica curadoria e variedade numa olhada; exige disciplina de `lazy` nas capas. |
| P-4 | Declaração + número | 3 | 5 | 3 | 4 | **15** | Rápido e forte se o número for real; sem imagem, arrisca cheiro de anúncio. |
| P-3 | Porta com prévia do carrossel | 4 | 3 | 3 | 4 | **14** | Elimina o toque de fricção; a prévia abaixo da dobra pressiona o LCP. |

### Catálogo dinâmico de categorias (Bloco 1)

| # | Conceito | Impacto | Esforço | Risco | Aderência | Total | Justificativa (1 frase) |
|---|---|:--:|:--:|:--:|:--:|:--:|---|
| 1a | Imagem fixa + carrossel por trilha | 5 | 4 | 4 | 5 | **18** | Entrega o "imagem ao lado" ao pé da letra; só exige empilhar em telas estreitas. |
| 1b | Card-herói com imagem embutida | 3 | 5 | 4 | 5 | **17** | Mais simples e seguro; entrega menos do efeito de referenciamento pedido. |
| 1c | Painel sticky + duas faixas | 5 | 2 | 2 | 3 | **12** | Maior "uau" e referenciamento mais forte; dois Embla + sticky = teste em device e mais JS. |

### Trilhas de produtos (Bloco 2)

| Item | Impacto | Esforço | Risco | Aderência | Nota |
|---|:--:|:--:|:--:|:--:|---|
| 2a Em alta (carrossel cross-nicho) | 4 | 4 | 4 | 5 | Alavanca de conversão barata; reusa `prioridade`/`destaque`. |
| 2b Por categoria (trilha rotulada) | 4 | 5 | 5 | 5 | Reusa `resolver.ts` sem mudança; já é o fallback sem-JS. |
| 2c Catálogo inteiro (grade) | 2 | 5 | 5 | 5 | Zero novo; é a degradação. |

---

## 12. Recomendação — plano em fases

**Princípio:** não construir estrutura que o catálogo não preenche. O tamanho
real do catálogo (D-02, pendente) e a medição em device decidem até onde ir. A
tela de **detalhe (E5) fica intacta** em todas as fases; tudo mora na seção única
de ADR-007.

### Fase 0 — entra já (baixo risco, quase todo reuso)

Só os blocos que um catálogo de 2–8 produtos preenche bem:

| Bloco | O que é | Origem |
|---|---|---|
| **Porta P-1** | Sumário editorial: proposta + linha de organização + mosaico curado + CTA | novo, HTML+CSS |
| **2a — Em alta** | 1 trilha dos produtos de maior `prioridade`/`destaque`, cross-categoria | trilha nova sobre dado existente |
| **2b — Por categoria** | 1 trilha rotulada por categoria efetiva (`<h2 id="cat-<id>">` + `produtosPorCategoria`) | **reuso** de `resolver.ts`, já especificado em `arch/09` §2 |
| **2c — Catálogo** | grade completa agrupada por categoria — e o fallback sem-JS | `GradeCatalogo` de hoje |
| **3 — Informações** | `<footer>` de curadoria / como comprar / prova social estática / compartilhar | novo, HTML+CSS |

**Não entra na Fase 0:** o navegador de dois eixos (grupos + estilos), os cards
de categoria com imagem âncora e o carrossel de referenciamento. As categorias
são as trilhas simples de 2b.
**Custo:** `VitrineFoco` (C4) sai; `MiniProduto` / `CardProduto` / `GradeCatalogo`
/ `telas.ts` / `slots/*` ficam. Retrabalho sobre E6-01/E6-02 limitado à troca da
`VitrineFoco` pelos blocos 2a–3.

### Slice de medição — portão antes do aceite do ADR-008 e antes da Fase 1

Prototipar, com o nicho padrão: **porta + Bloco 1 no padrão 1a (carrossel +
imagem âncora) + 1 trilha de produto**. Medir num **Android médio real no webview
do TikTok**:

| Métrica | Alvo |
|---|---|
| LCP | ≤ 2,5 s (RNF-02) |
| TTI | ≤ 3,5 s (RNF-02) |
| `dist/index.html` gzip | teto proposto 90 KB |
| jank de `scroll-snap` + cross-fade | subjetivo — sem travar o scroll |

O número decide: **1a** · versão enxuta do Bloco 1 (sem imagem âncora) · ou
adiar o Bloco 1 de vez.

### Fase 1 — condicional (só com os dois portões verdes)

- **Portão A — D-02** fechada com nichos de conteúdo suficiente (ordem de ~20+
  produtos, ≥ 3 grupos).
- **Portão B — slice de medição** dentro dos alvos acima.

Então entra o **Bloco 1 completo**: catálogo dinâmico de categorias em dois eixos
(grupos + estilos), carrossel + imagem âncora com referenciamento, cards de
categoria personalizados — no **padrão 1a** (§4). Requer os campos de dado do
§12.1.

### Fase 2 — ambição (só após 1a medido e estável)

Trocar 1a por **1c** (painel de imagem sticky compartilhado + duas faixas), com
**nova medição em device**. É a versão premium do referenciamento e a de maior
risco de perf.

### 12.1 Mudanças de dado (a partir da Fase 1)

Todas **opcionais e retrocompatíveis** — o `exemplo.ts` atual continua válido. A
Fase 0 **não precisa de nenhuma delas**.

| Onde | Campo | Tipo | Nota |
|---|---|---|---|
| `Categoria` | `grupo?` | `string` | id do grupo temático; ausente → categoria é seu próprio grupo |
| `Categoria` | `capa?` | `ItemMidia` | imagem âncora do card; ausente → capa do produto herói da categoria |
| `Nicho` | `grupos?` | `Array<{ id; rotulo; kicker?; capa? }>` | rótulos/ordem dos grupos; ausente → derivado dos `grupo` das categorias |
| `Nicho` | `estilos?` | `Array<{ id; rotulo; regra }>` | trilhas transversais curadas; ausente → derivadas por `resolver.ts` de `tags`/`prioridade`/preço |
| `Nicho.variantes.b` | `ordemGrupos?` | `string[]` | `?c=` reordena grupos |

Resolução nova, tudo **puro** em `resolver.ts` (mesmo padrão de ADR-007):
`resolverGrupos(nicho, variante)`, `categoriasPorGrupo(nicho)`,
`resolverEstilos(nicho)`, `capaDaCategoria(categoria)`.

---

## 13. Fora do escopo desta ideação

- **Mudar a tela de detalhe (E5).** Galeria + benefícios + specs + blocos + CTA
  de saída seguem exatamente como ADR-007 / E5 especificam.
- **Sair da seção única / do modelo de `#hash`.** Continua um documento só,
  `?n/?c/?o` intactos (ADR-007 item 4, RF-15).
- **Rota estática por categoria ou por produto** para SEO — fora por R-08
  (`<a>` perde `?c=/?o=` sem JS). A rota `/n/<slug>` (E4) renderiza a mesma
  página longa.
- **Subcategorias / grupos aninhados.** Um nível de grupo + um de categoria. Se
  doer, ADR futuro (ADR-007 já fechou "um nível só").
- **Filtro/busca dentro do catálogo.** Catálogo é curto (2–8). Grupos e estilos
  são navegação curada, não busca.
- **Estilos calculados por dado dinâmico.** As trilhas de "estilo" saem de regra
  pura sobre dado estático (`tags`/`prioridade`/preço) ou de lista curada — sem
  backend (ADR-004).
- **Carrossel com física de arraste / lib de gestos.** `scroll-snap` nativo +
  Embla (já na stack) e nada além.
- **Contador regressivo / prova social "ao vivo".** Só claim estático curado e
  verdadeiro (mesma regra da ideação anterior).

---

## 14. Handoff — o que isto muda nos documentos existentes

O cascade é **faseado** junto com o §12. A **Fase 0** só precisa de um cascade
pequeno (não mexe no schema); a **Fase 1** puxa o resto, e só depois dos dois
portões (D-02 + slice de medição).

**Cascade da Fase 0** (após aceite do ADR-008): `architecture/09` §1/§4 —
`#tela-vitrine` = porta (em `#tela-entrada`) + blocos 2a/2b/2c + informações;
`VitrineFoco` sai. `epics/E6` reescopado (troca a `VitrineFoco` pelos blocos
2a–3). `epics/PLANO-PROXIMO-PASSO` e índices. **Nenhuma mudança de schema, nenhum
`architecture/08`, nenhum `prd` novo.**

**Cascade da Fase 1** (após D-02 + medição): tudo o mais da tabela abaixo.

| Documento | Mudança |
|---|---|
| **[ADR-008](../architecture/decisions/adr-008-catalogo-como-pagina-rica-de-secoes.md)** | **Escrito junto com esta ideação** (status: proposto). Formaliza: a tela do meio de ADR-007 vira "catálogo como página de blocos"; a entrada vira "porta do catálogo"; detalhe intacto. |
| `architecture/09` | §1 e §4: `#tela-vitrine` deixa de ser `TrilhaCategorias + VitrineFoco + GradeCatalogo` e passa a ser `PortaCatalogo` (na verdade em `#tela-entrada`) + `CatalogoCategorias` (bloco 1) + `TrilhasProduto` (bloco 2) + `BlocoInformacoes` (bloco 3). `VitrineFoco` (C4) sai; `GradeCatalogo` fica como bloco 2c / fallback. |
| `architecture/08` | §2: campos novos opcionais em `Categoria` (`grupo`, `capa`) e `Nicho` (`grupos`, `estilos`, `variantes.b.ordemGrupos`). §4: novas funções puras (`resolverGrupos`, `categoriasPorGrupo`, `resolverEstilos`, `capaDaCategoria`). |
| `architecture/10` (novo) | "Anatomia do catálogo em blocos" — o layout 1a, o efeito de referenciamento, os tokens por componente do §8, a tabela de lazy-load do §10. |
| `epics/E5` | Inalterado (detalhe). Confirmar que nada de E5 depende de `VitrineFoco`. |
| `epics/E6` | Reescopado: a "casca de 3 telas" ganha os blocos 0–3 no lugar de `VitrineFoco`. `TrilhaCategorias`/`MiniProduto` (feitos em E6-01) são reaproveitados nos novos blocos ou aposentados. |
| `epics/E7` (novo) ou extensão de E5/E6 | "Catálogo dinâmico": `CatalogoCategorias` + carrossel de referenciamento + `TrilhasProduto` + `BlocoInformacoes` + Embla sob demanda + os efeitos do §7. |
| `epics/PLANO-PROXIMO-PASSO` | Reordenar: E6 muda de forma; E7 entra depois de E5-02 (precisa de `GaleriaMidia`/capas) e do schema estendido de `08`. |
| `prd/01` e `prd/02` | M-novo e RF-novos para: porta do catálogo (revisa RF-15.5), catálogo por grupos/estilos, trilhas de produto, bloco de informações, efeito de referenciamento. RNF-13 ganha a métrica de gzip do `index.html`. |
| `docs/README` / `ESTADO-ATUAL` | Trocar o diagrama "Fluxo do produto" e a nota de estado para refletir os blocos. |

> Ordem sugerida:
> **Fase 0:** ADR-008 (aceite) → `09` (Fase 0) → reescopar E6 →
> `PLANO-PROXIMO-PASSO` → slice de medição → índices.
> **Fase 1 (após D-02 + medição verde):** `08` + `09` (Fase 1) + `10` → E7 novo →
> `PLANO-PROXIMO-PASSO` → `prd/01` + `prd/02` → índices.
> Nenhuma story de Fase 1 antes de `08`/`09` fecharem.
