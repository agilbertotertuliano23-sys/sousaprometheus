# E2 — Catálogo categorizado + curadoria

**Estado:** 🟠 componentes de grade/card prontos; **schema novo a implementar**.
**Substitui:** o antigo "E2 — Modelo de nicho, grade e card" (ADR-007).

## Objetivo

Um nicho = um arquivo de dados + assets, agora com **categorias curadas** e
**score de potencial** por produto. `catalog validate` é o gate do schema novo.
A grade/card de hoje continua viva como fallback sem-JS.

## Escopo

- **M2 / RF-02, RF-03** — `src/data/nichos/<slug>.ts` + índice; 2 a 8 produtos.
- **M8 / RF-10** — `Nicho.categorias: Categoria[]` (`id`, `rotulo`, `kicker?`,
  `descricao?`, `ordem?`); `Produto.categoria` referencia um id. Categoria
  sintética `_outros` / `_tudo` quando falta (RF-10.3).
- **M8 / RF-11** — `Produto.prioridade` (inteiro `0..100`, default 50); ordena
  dentro da categoria; elege o herói (RF-11.4).
- **RF-12/13/14 (dado, não render)** — `tipos.ts` ganha `ItemMidia`, `ParSpec`,
  `Categoria`, a union `BlocoApresentacao`, `RegraVariante`, `RegraOferta`, e os
  campos novos de `Produto`/`Nicho`. O **render** desses campos é E5.
- **RF-08.3** — `catalog validate` cobre: id de categoria referenciado existe;
  `prioridade` inteiro no range; `tipo` de bloco no vocabulário
  (`src/lib/apresentacao/tipos-bloco.json`); assets de galeria/bloco existem.
- **RNF-14** — `src/lib/apresentacao/tipos-bloco.json` como fonte única do
  vocabulário, lida pelo registry (E5) e pelo console.
- Backstop de tipo: `src/lib/catalogo/validar.ts` — `validarNicho(n): string[]`,
  pura, sem deps; chamada em DEV no carregamento do índice. (Caminho ajustado de
  `src/data/validar.ts` na E2-03: fica ao lado de `resolver.ts`.)

## Feito (base que permanece)

- `CardProduto.astro`, `GradeCatalogo.astro`, `VideoVertical.astro`.
- `src/lib/catalogo/carregar.ts` (`import.meta.glob` dos assets).
- `src/lib/midia/video-vertical.ts` (autoplay ≥ 60% visível, pausa fora).
- `assets check` compara peso ao `ORCAMENTO`.
- `exemplo.ts` — 3 produtos, placeholders SVG (será estendido como fixture).

## Aberto

- [x] `src/data/tipos.ts` — interfaces de ADR-007 (ver `architecture/08` §2). **(E2-03)**
- [x] `src/lib/catalogo/validar.ts` — `validarNicho()` pura. **(E2-03)**
- [x] `src/lib/apresentacao/tipos-bloco.json` — vocabulário. **(E2-03)**
- [x] `src/lib/apresentacao/registry.ts` — 8 chaves, valores `null` (E5 preenche). **(E2-03)**
- [x] `src/lib/catalogo/resolver.ts` — `resolverCategorias`,
      `produtosPorCategoria`, `heroiDaVitrine`, `galeriaDe`, `blocosDe`,
      `categoriaEfetivaDe`, `prioridadeDe` (ver `architecture/08` §4). **(E2-03)**
- [x] `scripts/console/lib.mjs` — `lerNicho` extrai `categorias`/`id`,
      `categoria`/`prioridade` por produto, `tipo`/`src`/`avatar`/`poster` nos
      `blocos` e `galeria`; novo `lerVocabularioBlocos()`. **(E2-03)**
- [x] `scripts/console/commands/catalog.mjs` — checagens novas (`architecture/08` §6). **(E2-03)**
- [ ] `scripts/console/templates/niche.ts.tmpl` — 2 categorias, `prioridade`,
      `galeria`, `entrada`, 1 bloco de exemplo. **(E2-04)**
- [x] `exemplo.ts` estendido: fixture rica — 3 categorias, 5 produtos, galeria
      explícita/derivada, 1 bloco de cada tipo do vocabulário (fixture de E5/E6). **(E2-03)**
- [ ] `carregar.ts` — `urlAsset` deixa passar caminho iniciado por `/` (vídeo de
      `public/`). **(adiado p/ E2-04 — fixture E2-03 usa `.mp4` versionado, sem caminho absoluto)**
- [ ] **D-02** — lista de nichos de lançamento (bloqueio de negócio).
- [ ] **D-06** — modelo do link de saída (afiliado / loja própria / ambos).
- [ ] Medir peso/LCP no webview real depois de E5+E6 (era E2-02, agora depende do
      fluxo montado).

## Depende de

E1 destravado (build verificado — spawn/ESTADO-ATUAL indicam verde).

## Fora de escopo

Render de galeria/blocos (E5). Montagem das 3 telas (E6). Efeito client-side de
`?n=/?c=/?o=` (E3). Subcategorias, score dinâmico (ADR-007, "fora de escopo").
