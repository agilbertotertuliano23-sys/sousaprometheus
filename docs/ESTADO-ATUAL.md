# PROMETEUS — Estado Atual

**Atualizado:** 2026-09-02 · **Fase:** base + schema ADR-007 (E2-03); apresentação (E5-01) e fluxo de 3 telas (E6-01 casca + E6-02 máquina de telas no cliente) em código. **ADR-008 Fase 0 — as três telas IMPLEMENTADAS** (branch `feat/adr008-fase0-tres-telas`; `validate`/`typecheck`/`build`/`doctor` exit 0; `dist/index.html` 48 KB cru / **6 KB gzip**; só 2 imagens `eager`).
- **E6-04 ✔** `PortaCatalogo` (mosaico derivado + linha de organização) substitui `TelaEntrada`.
- **E6-05 ✔** `TrilhaProdutos` (Bloco 2a "Em alta" + 2b por categoria) + `BlocoInformacoes`; `VitrineFoco` removido; `TrilhaCategorias` `@deprecated`; grade → `id="grade-cat-<id>"`; `telas.ts` rola até `<section id="cat-<id>">` (swap removido).
- **E6-03 ✔** `SecaoUnica.astro` — fonte única de `/` e `/n/<slug>` (ambas cascas finas).
- **E5-02 ✔** `GaleriaMidia` (scroll-snap + dots) + `<dl>` specs-resumo + `BlocoSpecs` (REGISTRY 4/8).
- `tipos.ts`: `entrada.proposta?: string` (opcional). `src/styles/tokens.css` sincronizado (camada COMPONENTE).
- **Falta:** [E6-06](stories/E6-06-slice-de-medicao-em-device.md) (slice de medição = Portão B da Fase 1) · ratificar D-12/D-13/D-14/D-15 · medição em device · `n/[slug]` OG (E4). Bloco 1 é Fase 1 (D-02 + E6-06).
**Build:** ✅ verde. `npm install` limpo feito (358 pacotes, lockfile ok);
`npm run typecheck` (0 erros), `npm run build` (gera `/`, `/404.html`,
`/n/exemplo/`, `/sitemap.xml`), `npm run doctor` e `npm run validate` — todos verdes.
Stories E1-03, **E2-03**, **E5-01**, **E6-01** e **E6-02** concluídas.
Preview/`astro dev` serviram as 4 rotas (200/200/200/200).

Retrato do que existe e funciona hoje. Para o *porquê* de cada decisão, ver
[04 — Riscos e Decisões](prd/04-riscos-e-decisoes.md) e os ADRs. Para o plano de
trabalho, ver [épicos](epics/README.md) e [stories](stories/README.md).

## O que está de pé

### Scaffold Astro (igual ao ARES)

- `astro.config.ts` — `output: 'static'`, integrações Preact + React, Tailwind v4 via plugin do Vite.
- `src/layouts/Base.astro` — `<head>` com OG, viewport `viewport-fit=cover`, e o único `<script type="module">` (fim do `<body>`) que aplica personalização, liga a máquina de telas (E6-02) e liga os vídeos. `<head>` sem JS (RNF-03).
- `src/pages/index.astro` — seção única de 3 telas (`#app[data-tela]` + `#tela-entrada`/`#tela-vitrine`/`#tela-detalhe`), buildada com o nicho padrão (E6-01).
- `src/pages/404.astro` — 404 estático, mobile-first (E4).
- `src/components/` — `CardProduto`, `GradeCatalogo`, `VideoVertical` (Astro puro, sem ilha ainda).
- `src/styles/` — `tokens.css` (cópia de `docs/design/tokens.css`) + `global.css`.
- `src/data/` — `tipos.ts` (schema ADR-007: `ItemMidia`, `ParSpec`, `Categoria`, union `BlocoApresentacao`, `RegraVariante`/`RegraOferta`, campos novos opcionais em `Produto`/`Nicho`), `nichos.ts` (índice + backstop `validarNicho` sob `import.meta.env.DEV`), `nichos/exemplo.ts` (**fixture rica** E2-03: 3 categorias, 5 produtos, galeria explícita/derivada, 1 bloco de cada tipo), `personalizacao.ts` (hash FNV-1a → bucket A/B).
- `src/lib/` — `catalogo/carregar.ts` (`import.meta.glob` dos assets), `catalogo/resolver.ts` (**puro**: `resolverCategorias`, `produtosPorCategoria`, `heroiDaVitrine`, `galeriaDe`, `blocosDe`, `categoriaEfetivaDe`, `prioridadeDe` — doc 08 §4), `catalogo/validar.ts` (**puro**: `validarNicho(n): string[]`, backstop de tipo em pt-BR), `apresentacao/tipos-bloco.json` (vocabulário — fonte única RNF-14) + `apresentacao/registry.ts` (8 chaves `null`; E5 preenche), `personalizacao/contexto.ts` (ponte client), `navegacao/telas.ts` (**E6-02** — máquina de 3 telas no cliente), `midia/video-vertical.ts` (autoplay via IntersectionObserver), `motion/reduced-motion.ts`, `utils.ts`.

### O console (`bin/prometeus.mjs`)

Zero dependências. Comandos implementados e testados manualmente:

| Comando | Estado |
|---|---|
| `help` | ✓ |
| `doctor` | ✓ — Node, ffmpeg, árvore do projeto, contagem de nichos, `node_modules` |
| `niche new <slug>` | ✓ — cria `src/data/nichos/<slug>.ts` + pasta de assets a partir do template |
| `niche list` | ✓ — slug, contagem de produtos, acento |
| `catalog validate [--niche] [--json]` | ✓ — schema (inclui ADR-007: id de categoria, `prioridade` 0..100, `tipo` de bloco no vocabulário, assets de galeria/bloco) + existência dos assets; exit 1 em erro; roda no `prebuild` |
| `assets check [--niche] [--strict]` | ✓ — peso de imagem/poster/vídeo vs `ORCAMENTO` (RNF-01) |
| `video <in> [--sku --niche] [--out]` | escrito, **não** exercitado (sem clipe de teste); exige ffmpeg; CRF sobe em degraus até caber em 400 KB |

### Andaime dos épicos (stubs — não implementado)

Criados como esqueleto para o dev implementar. Cada um traz um cabeçalho com o
que falta e o requisito de origem.

- `src/pages/n/[slug].astro` — rota estática por nicho (E4 / C-3). Renderiza a grade; falta OG/canonical.
- `src/pages/sitemap.xml.ts` — endpoint do sitemap (E4). Hoje só emite `/`.
- `src/lib/personalizacao/slots.ts` — reescrita de cabeçalho + grade no cliente (E3, story principal).
- `src/lib/personalizacao/criativo.ts` — ordem/destaque por variante `?c=` (E3 / RF-06).
- `src/lib/personalizacao/oferta.ts` — tarja/selo por `?o=` (E3 / RF-07).
- `src/components/TarjaOferta/TarjaOferta.astro` — marcação da tarja (escondida até E3).
- `src/lib/seo/og.ts` — meta tags OG por nicho (E4 / RF-09).
- `src/components/GradeIlha/GradeIlha.tsx` — ilha Preact de grade com filtro por tag (C-1).
- `raw-assets/README.md` — pasta de curadoria (gitignored).

### Documentação

PRD (00–05), arquitetura (README + 9 temáticos + **8 ADRs**), design (README + fundamentos + tokens),
[épicos E1–E6](epics/README.md), [stories](stories/README.md) (E2-03, E5-01/E5-02, E6-01…E6-06, E3-01 detalhadas).
Revisão `po`: [VALIDACAO-PO.md](VALIDACAO-PO.md) — gate **CONCERNS** (Fase 0 implementável; ressalvas V-1..V-10).

## O que NÃO existe ainda

- **Render do schema ADR-007 — parcial.** **E5-01 feita:** `RenderBlocos` +
  `BlocoTexto`/`BlocoMidia`/`BlocoDepoimento` + `DetalheProduto` (casca: galeria
  simples + nome + preço + benefícios + blocos + CTAs) existem; `REGISTRY` tem 3
  de 8 chaves vivas (`texto`/`midia`/`depoimento`), faltam `specs` (E5-02) e
  `como-usar`/`comparativo`/`bonus`/`faq` (E5-03) — `RenderBlocos` ignora esses
  com `console.warn` em DEV. `GaleriaMidia`/`BlocoSpecs`/`<dl>` de specs são
  **E5-02**. **E6-01 feita:** `index.astro` virou a seção única de 3 telas
  (`#app[data-tela="entrada"]` + `#tela-entrada`/`#tela-vitrine`/`#tela-detalhe`);
  `TelaEntrada`/`VitrineFoco`(entra `hidden`)/`TrilhaCategorias`/`MiniProduto`
  existem; `GradeCatalogo` agrupa por categoria efetiva; `CardProduto` ganhou
  `data-sku`/`data-categoria`/`data-prioridade` + link `#produto-<sku>`;
  `Base.astro` inclui a `TarjaOferta` (inerte). **E6-02 feita:** a navegação
  client-side existe — `src/lib/navegacao/telas.ts` (`hashDe`/`estadoDeHash`/
  `estadoInicial`/`aplicarEstado`/`irPara`/`ligarNavegacaoTelas`): adiciona
  `html.js` (gate CSS em `global.css`), alterna `#app[data-tela]`, faz
  `pushState`/`replaceState` com `#hash` (`#vitrine`, `#vitrine&cat=<id>`,
  `#produto=<sku>`) **preservando `location.search`**, ouve `popstate`+
  `hashchange`, 1ª tela sempre a entrada/main mesmo em revisita (D-11
  revertida, V-8 confirmada com o dono), religa `ligarVideoVertical` no
  detalhe com guarda `Set<sku>`. Corrige de passagem o `[hidden]` da
  `VitrineFoco` (bug latente de E6-01). Falta a aferição em device (**E2-02**) e
  a seção única em `n/[slug].astro` (**E6-03** — o gate CSS já é global).
  `variantes.b`/`ofertas` são lidos pelo `resolver.ts` mas nada no cliente
  aplica (**E3**).
- `niche.ts.tmpl` ainda no schema antigo (sem `categorias`/`galeria`/`blocos`) — **E2-04**.
- Nenhuma ilha Preact/React de verdade em uso (a grade é estática; `GradeIlha.tsx` é stub; o carrossel do ARES não foi portado).
- Personalização (E3): `contexto.ts` troca `--acento` e `data-*`, mas **não** reescreve título/subtítulo/produtos, nem aplica variante `?c=`, nem tarja `?o=`. Os stubs existem, a lógica não.
- Rota `/n/<slug>` renderiza mas sem OG/canonical por nicho; sem `prometeus deploy-check`.
- `sitemap.xml` só com a raiz; `robots.txt` com a linha `Sitemap:` comentada.
- Sem analytics.
- Nenhum nicho real — só `exemplo` (fixture do schema, placeholders SVG + `.mp4` de poucos bytes).
- Zero testes automatizados; zero medição de performance em dispositivo.

## Divergências vs. ARES (conscientes)

| Área | ARES | PROMETEUS |
|---|---|---|
| Alvo primário | desktop, showroom cinematográfico | celular, webview do TikTok |
| 3D | three.js, rota dedicada, `.glb` | **fora de escopo** (R-05) — peso e CPU no webview |
| Catálogo | 1 marca, ~9 SKUs | N nichos, cada um com seu catálogo curto |
| Acento | 1 cor fixa (RF-08.3) | 1 cor **por nicho**, variável em runtime |
| Vídeo | toca no hover (desktop) | toca sempre, mudo; toque = som (mobile) |
| Checkout | demo interno (`PagamentoDisclosure`) | link de saída externo (afiliado/loja) |
| Operação | 3 scripts soltos | 1 console (`prometeus`) |

## Como rodar

```bash
rm -rf node_modules        # o atual está incompleto
npm install
npm run doctor             # confere o ambiente
npm run dev                # servidor de desenvolvimento (http://localhost:4321)
npm run validate           # gate de catálogo
npm run typecheck          # astro check
npm run build              # build estático (valida antes)
```

### Ver no celular (mobile web)

- `npm run dev -- --host` e abrir `http://<ip-da-máquina>:4321` no celular na
  mesma rede; ou
- DevTools do Chrome → *toggle device toolbar* (Ctrl+Shift+M) → um preset de
  celular. O layout é 1 coluna até ~560px, 2 acima (`GradeCatalogo`).

## Pendências

| # | Item | Gravidade |
|---|---|---|
| — | `npm install` limpo + verificar `astro check` e `build` (story E1-03) | **Alta — bloqueia tudo** |
| ADR-008 F0 | ✅ **aceita 2026-09-02.** Cascade aplicado: `architecture/09` reescrito, `epics/E6` reescopado (E6-03/04/05/06), `PLANO-PROXIMO-PASSO` e índices. Sem schema novo. | — |
| D-02 + E6-06 | Portões da **Fase 1** do ADR-008 (navegador de categorias em dois eixos): fechar D-02 com nichos de ~20+ produtos **e** o slice de medição (E6-06) verde num Android médio no webview. Só então saem `architecture/08`/`10`, `prd` e o **E7**. | Média — só quando a Fase 0 estiver de pé |
| D-02 | Definir a lista de nichos de lançamento | Alta para publicar |
| D-06 | Modelo do link de saída (afiliado vs loja própria) | Alta para publicar |
| — | E3-01: reescrever cabeçalho + grade no cliente | Média |
| — | E3-02 / E3-03: variante `?c=` e tarja `?o=` | Média |
| — | E4: OG por nicho, sitemap completo, `deploy-check` | Média |
| — | `video`: exercitar com um clipe real | Baixa |
