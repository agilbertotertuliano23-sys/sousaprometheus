# 02 — Requisitos

> **Revisão 2026-09-02 (ADR-007).** Novos: **RF-10** a **RF-16**, **RNF-13**,
> **RNF-14**. Ajustados: **RF-04**, **RF-05.1**, **RF-06.2**, **RF-08.3**.
> Trilha do modelo em [`../architecture/08`](../architecture/08-catalogo-categorizado.md);
> trilha do fluxo em [`../architecture/09`](../architecture/09-fluxo-de-telas-e-apresentacao.md).

> **Revisão 2026-09-02 ([ADR-008](../architecture/decisions/adr-008-catalogo-como-pagina-rica-de-secoes.md) Fase 0).**
> Só **texto** ajustado (nenhum RF novo na Fase 0): **RF-05.1**, **RF-10.4** e
> **RF-15.5** trocam "capa editorial / herói em foco / chips" por "porta do
> catálogo / trilha em alta + trilhas por categoria / `<h2 id="cat-<id>">`".
> Os RF novos da Fase 1 (grupos, estilos, referenciamento) entram no cascade
> pós-portões (ADR-008 §7).

## Funcionais

### RF-01 — Página única
- RF-01.1 — Uma rota (`/`). Sem navegação interna; toda saída é um link externo.
- RF-01.2 — Renderizada estaticamente no build com o **nicho padrão**
  (`PUBLIC_NICHO_PADRAO`, default `exemplo`).
- RF-01.3 — Mobile-first: largura de leitura de 1 coluna até ~560px, 2 colunas acima.

### RF-02 — Modelo de nicho
- RF-02.1 — Cada nicho é um módulo `src/data/nichos/<slug>.ts` exportando um `Nicho`.
- RF-02.2 — `src/data/nichos.ts` é o índice — a única lista que o app enxerga; registro manual.
- RF-02.3 — `slug` do objeto == nome do arquivo (validado por `catalog validate`).
- RF-02.4 — Campos obrigatórios do nicho: `slug`, `nome`, `titulo`, `subtitulo`,
  `acento` (#RRGGBB), `cta`, `produtos`.

### RF-03 — Catálogo do nicho
- RF-03.1 — 2 a 8 produtos por nicho (aviso abaixo de 2; sem limite duro no alto, mas o design assume ≤ 8).
- RF-03.2 — Produto: `sku` (único no nicho), `nome`, `descricaoCurta`, `precoCentavos`
  (inteiro > 0), `imagem`, `url` (saída, `https?://`). Opcionais: `precoDeCentavos`,
  `video`, `poster`, `tags`, `destaque`.
- RF-03.3 — Preços sempre em centavos; formatação `pt-BR`/BRL só na renderização.

### RF-04 — Produto na vitrine e no detalhe *(ajustado — ADR-007)*
- RF-04.1 — **Mini** na vitrine: capa (1ª mídia da galeria; imagem, nunca vídeo
  autoplay), nome e preço. Toque abre a **tela de detalhe** do produto (não sai
  do site). `data-sku`, `data-categoria`, `data-prioridade` no elemento.
- RF-04.2 — Preço; se `precoDeCentavos > precoCentavos`, mostra o "de" riscado e
  tarja `-NN%` (na mini e no detalhe).
- RF-04.3 — O **CTA de saída** (`url`, `target="_blank" rel="noopener nofollow"`,
  `data-sku`) fica na tela de detalhe (sticky) e na capa do herói da vitrine.
  No fallback sem-JS, também em cada card da grade.
- RF-04.4 — `destaque: true` marca a borda de acento **e** é o override manual do
  herói da vitrine (RF-11.4).
- RF-04.5 — A mini reusa o átomo visual do card (`CardProduto`); vídeo do card
  só toca na regra do RNF-05 quando o produto é o herói em foco.

### RF-05 — Personalização: nicho (`?n=`)
- RF-05.1 *(ajustado — ADR-008 F0)* — `?n=<slug>` válido troca, no cliente:
  `--acento`, `data-nicho`, e reescreve **as 3 telas** — entrada (**porta do
  catálogo**), vitrine (**trilha "em alta" + uma trilha por categoria + grade +
  informações**) e detalhe (galeria + blocos) — a partir de `NICHOS[slug]`
  resolvido.
- RF-05.2 — Ausente ou inválido → nicho padrão; a página buildada continua
  válida (degradação graciosa).
- RF-05.3 — Sem `?n=`, tenta o último nicho salvo em `localStorage`
  (`prometeus:ultimo-nicho`).

### RF-06 — Personalização: criativo (`?c=`)
- RF-06.1 — `?c=<id>` gera um bucket `a`/`b` por hash estável (FNV-1a) — mesmo
  criativo, mesmo bucket.
- RF-06.2 *(ajustado)* — O bucket `b`, por regra `nicho.variantes.b`, pode:
  reordenar categorias (`ordemCategorias`), reordenar produtos dentro da
  categoria (`ordem`), trocar o herói (`destaque`) e trocar a chamada da tela de
  entrada (`chamadaEntrada`). Sem regra → `b` idêntico a `a`.
- RF-06.3 — `data-variante` no `<html>` para CSS/analytics.

### RF-07 — Personalização: oferta (`?o=`)
- RF-07.1 — `?o=<id>` exibe uma tarja/selo global e pode trocar o texto do `cta`.
- RF-07.2 — `data-oferta` no `<html>`.
- RF-07.3 *(novo)* — Por regra `nicho.ofertas[id].teaserEntrada`, pode injetar
  um teaser na tela de entrada. `?o=` sem entrada correspondente = silencioso.

### RF-08 — Console
- RF-08.1 — `prometeus niche new <slug>` cria o módulo e a pasta de assets a partir do template.
- RF-08.2 — `prometeus niche list` lista slug, contagem de produtos e acento.
- RF-08.3 *(ajustado)* — `prometeus catalog validate` valida schema + existência
  dos assets; exit 1 em erro; `--niche <slug>` e `--json`. Chamado por
  `npm run validate` (prebuild). Passa a cobrir o schema de ADR-007: ids de
  `categoria` referenciados existem; `prioridade` inteiro em `0..100`; `tipo` de
  bloco no vocabulário (`src/lib/apresentacao/tipos-bloco.json`); assets de
  galeria e de bloco (`src`, `avatar`, `poster`) existem no disco.
- RF-08.4 — `prometeus assets check` compara o peso de cada asset ao `ORCAMENTO`; `--strict` → exit 1.
- RF-08.5 — `prometeus video <in>` transcodifica para 9:16 mudo H.264 faststart ≤ `videoKB`.
- RF-08.6 — `prometeus doctor` checa Node, ffmpeg, árvore, nichos, `node_modules`.

### RF-09 — Compartilhamento
- RF-09.1 — `<meta og:*>` por nicho (`nicho.og`), com fallback para `titulo`/`subtitulo`.
- RF-09.2 *(novo)* — Botão de compartilhar (Web Share API) na vitrine/detalhe:
  `navigator.share({ url: location.href })`; o link carrega `?n/?c/?o` + o
  `#hash` da tela atual. Escondido se a API não existir. Sem PII.

### RF-10 — Catálogo categorizado *(novo — ADR-007)*
- RF-10.1 — Um nicho pode declarar `categorias: Categoria[]` — lista ordenada e
  curada. Campos: `id` (`[a-z][a-z0-9-]+`, único no nicho), `rotulo`,
  `kicker?`, `descricao?`, `ordem?`.
- RF-10.2 — Cada `Produto` pode declarar `categoria` = um `Categoria.id`.
- RF-10.3 — Produto sem `categoria` (ou com id inexistente) entra numa categoria
  sintética `_outros`, sempre ao fim da trilha. Nicho sem `categorias`
  declaradas opera com uma trilha única sintética `_tudo`.
- RF-10.4 *(ajustado — ADR-008 F0)* — A vitrine navega por categoria: cada
  categoria efetiva é uma **trilha de produtos** `<section id="cat-<id>">` com
  seu `<h2>` (rótulo ≥ 44px de alvo tocável). As âncoras (`#cat-<id>`, do mosaico
  da porta e de `telas.ts`) apontam essa `<section>`. Sem JS, é a mesma pilha de
  trilhas + a grade (Bloco 2c). *(Chips/abas de `TrilhaCategorias` saem na Fase 0;
  podem voltar como navegação do Bloco 1 na Fase 1.)*

### RF-11 — Ordenação curada *(novo — ADR-007)*
- RF-11.1 — Cada `Produto` pode declarar `prioridade` — inteiro `0..100`,
  default `50`.
- RF-11.2 — Dentro da categoria, os produtos ordenam por `prioridade` desc;
  desempate pela ordem de declaração no arquivo (estável).
- RF-11.3 — `prioridade` nunca move produto entre categorias.
- RF-11.4 — Herói da vitrine (1ª peça em foco): `variantes.b.destaque` →
  primeiro `destaque: true` → maior `prioridade` da 1ª categoria → `produtos[0]`.

### RF-12 — Galeria de mídia *(novo — ADR-007)*
- RF-12.1 — `Produto.galeria: ItemMidia[]` — imagens e vídeos 9:16.
  `ItemMidia = { tipo:'imagem'|'video', src, poster?, alt }`.
- RF-12.2 — `galeria` ausente → derivada de `[imagem, (video)]`.
  `Produto.imagem` continua **obrigatório** (capa/LCP/OG/fallback sem-JS).
- RF-12.3 — Na vitrine só a capa do herói carrega eager; toda outra mídia é
  `loading="lazy"` / `preload="none"` (RNF-13).
- RF-12.4 — Sem JS, a galeria é uma pilha vertical (`<img>` + `<video controls>`).

### RF-13 — Benefícios e specs *(novo — ADR-007)*
- RF-13.1 — `Produto.beneficios: string[]` — bullets no topo do detalhe.
- RF-13.2 — `Produto.specs: ParSpec[]` — pares `{ chave, valor }` ordenados;
  renderizados como `<dl>` e/ou como um `BlocoSpecs` no topo dos blocos.

### RF-14 — Blocos de apresentação *(novo — ADR-007)*
- RF-14.1 — `Produto.blocos: BlocoApresentacao[]` — union discriminada por
  `tipo`, renderizada na ordem no detalhe.
- RF-14.2 — Vocabulário inicial: `texto`, `midia`, `depoimento`, `como-usar`,
  `comparativo`, `bonus`, `faq`, `specs`. Fonte única:
  `src/lib/apresentacao/tipos-bloco.json`.
- RF-14.3 — Cada `tipo` mapeia para um componente Astro dedicado via
  `src/lib/apresentacao/registry.ts`. `RenderBlocos.astro` itera e resolve.
- RF-14.4 — Extensível: tipo novo = interface na union + componente + linha no
  vocabulário + linha no registry. Nenhum arquivo de núcleo muda (RNF-14).
- RF-14.5 — `tipo` fora do vocabulário: `catalog validate` falha (erro); em
  runtime, `RenderBlocos` ignora (DEV: `console.warn`).
- RF-14.6 — Blocos são declarativos e renderizam estático (funcionam sem JS).
  Sem estado, sem lógica.

### RF-15 — Fluxo de 3 telas *(novo — ADR-007)*
- RF-15.1 — `index.astro` e `n/[slug].astro` renderizam uma seção única com três
  `<section>`: entrada, vitrine, detalhe. Estado no atributo `#app[data-tela]`.
- RF-15.2 — Navegação client-side por `history.pushState` com `#hash`
  (`#vitrine`, `#vitrine&cat=<id>`, `#produto=<sku>`), **preservando
  `location.search`** (`?n/?c/?o` nunca saem da URL).
- RF-15.3 — `popstate`/`hashchange` reaplicam o estado (botão "voltar" do webview
  anda entrada ↔ vitrine ↔ detalhe sem sair da página).
- RF-15.4 — Numa revisita (há `localStorage['prometeus:ultimo-nicho']`, sem `?n=`
  novo e sem hash), o fluxo pode começar na vitrine. 1ª visita sempre vê a
  entrada.
- RF-15.5 *(ajustado — ADR-008 F0)* — A tela de entrada é a **porta do catálogo**
  (`nicho.entrada`): kicker, título display, **parágrafo de proposta**, **linha de
  organização** ("N produtos · M categorias"), **mosaico curado de capas**
  (derivado dos produtos herói de cada categoria), CTA no `--acento`. Todos os
  campos têm default derivado. *(O "herói sangrando" e o "teaser de preço" da
  redação anterior — conceito E4 — foram substituídos.)*

### RF-16 — Degradação do fluxo sem JS *(novo — ADR-007)*
- RF-16.1 — O HTML buildado contém todas as telas do nicho padrão: entrada +
  trilha + grade por categoria + uma `<section id="produto-<sku>">` por produto,
  com galeria, specs e blocos já renderizados.
- RF-16.2 — Sem JS, as três telas ficam visíveis e empilhadas, ligadas por
  âncoras (`#vitrine`, `#cat-<id>`, `#produto-<sku>`). Todos os links de saída
  ativos. RNF-04 mantido.
- RF-16.3 — As regras CSS que ocultam telas ficam sob `html.js` — a classe é
  adicionada pelo controlador de telas na 1ª linha; sem JS, nada é ocultado.

## Não-funcionais

| ID | Requisito |
|---|---|
| RNF-01 | Peso da página no 1º paint ≤ 1,2 MB. Orçamento por asset: imagem 180 KB, poster 60 KB, vídeo 400 KB. |
| RNF-02 | LCP ≤ 2,5 s em 4G simulado no webview; TTI ≤ 3,5 s. |
| RNF-03 | Zero JS bloqueante no `<head>`; scripts de personalização são `type="module"` no fim do `<body>`. |
| RNF-04 | Funciona com JS desabilitado: mostra o nicho padrão, cards com imagem, links de saída ativos. |
| RNF-05 | Vídeos: `muted`, `playsinline`, `loop`, autoplay só quando ≥ 60% visível; pausa fora da viewport. |
| RNF-06 | Alvo de toque ≥ 44px em todo elemento interativo. |
| RNF-07 | Contraste AA (≥ 4.5:1 texto normal) — inclui texto sobre o `--acento` de cada nicho (usar `--acento-texto` quando falhar). |
| RNF-08 | `prefers-reduced-motion: reduce` zera animações e transições. |
| RNF-09 | Sem cookies, sem PII, sem fingerprint. `localStorage` só para o último nicho. |
| RNF-10 | `npm run build` falha se o catálogo estiver inválido (gate no prebuild). |
| RNF-11 | Deploy 100% estático; nenhuma dependência de runtime de servidor. |
| RNF-12 | O console não tem dependências de terceiros (ADR-005). |
| RNF-13 | A seção única embute todas as telas do nicho padrão. Só a tela de entrada e a capa do herói da vitrine carregam assets **eager**; galeria de detalhe, miniaturas e vídeos de bloco são `loading="lazy"` / `preload="none"`. O 1º paint continua ≤ 1,2 MB (RNF-01) e o `dist/index.html` gzip é medido pelo `assets check`. |
| RNF-14 | Extensibilidade sem acoplamento: um tipo de bloco novo é um componente + uma linha no vocabulário + uma linha no registry. Nenhum arquivo de núcleo (`contexto`, `telas`, `resolver`, páginas) muda. |
