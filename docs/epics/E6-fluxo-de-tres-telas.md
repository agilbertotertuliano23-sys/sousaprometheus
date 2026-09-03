# E6 — Fluxo de 3 telas (porta → catálogo → detalhe)

**Estado:** 🟠 em andamento. **Novo (ADR-007); reescopado por
[ADR-008](../architecture/decisions/adr-008-catalogo-como-pagina-rica-de-secoes.md)
Fase 0 (aceita 2026-09-02).**

- E6-01 ✅ (casca estática de 3 telas) e E6-02 ✅ (`telas.ts` + `html.js` +
  `pushState`/`popstate`/`hashchange` + gate CSS) — **a máquina de telas e a
  navegação por `#hash` continuam valendo**.
- **Superseded pela ADR-008 Fase 0:** `TelaEntrada` (vira `PortaCatalogo`),
  `VitrineFoco` (removido), `TrilhaCategorias` (aposentada — `@deprecated` até a
  Fase 1). Ver `architecture/09` §4.
- **Aberto:** E6-03 (`n/[slug].astro`), E6-04 (`PortaCatalogo`), E6-05 (trilhas +
  informações, remove `VitrineFoco`), E6-06 (slice de medição em device).

## Objetivo

Montar a seção única com as três telas como estados no cliente — **porta do
catálogo → catálogo em blocos → detalhe** — com navegação que preserva `?n/?c/?o`
e degradação sem JS para conteúdo empilhado navegável por âncora. Buildada com o
nicho padrão; a reescrita por `?n=` é E3. O Bloco 1 (navegador de categorias em
dois eixos) **não** está neste épico — é Fase 1 (ADR-008 §7); se aprovado, entra
num E7 novo.

## Escopo (Fase 0)

- **M10 / RF-15.1** — `index.astro` e `n/[slug].astro` renderizam
  `<div id="app" data-tela="entrada">` com `#tela-entrada`, `#tela-vitrine`,
  `#tela-detalhe` (ver `architecture/09` §1).
- **RF-15.5 (revisto)** — `PortaCatalogo.astro`: kicker, título display,
  parágrafo de proposta, **linha de organização** ("N grupos · M estilos · K
  produtos"), **mosaico curado de capas** (≤ 5), CTA no `--acento` → `#vitrine`,
  slot da `TarjaOferta`. Defaults derivados de `nicho.entrada`.
- **M10** — `Vitrine/TrilhaProdutos.astro` (`<h2>` + kicker/descrição + `<ol
  class="trilha-carrossel">` de `MiniProduto`), usada pelo **Bloco 2a** (em alta,
  cross-categoria por `prioridade`/`destaque`) e por **cada categoria efetiva**
  (Bloco 2b). `MiniProduto.astro` mantido de E6-01.
- **M10** — `Info/BlocoInformacoes.astro` (Bloco 3): curadoria, como comprar,
  prova social estática, compartilhar, aviso de privacidade. Astro puro.
- **M10 / RF-15.2/3** — `src/lib/navegacao/telas.ts` (E6-02): mantém `html.js`,
  `data-tela`, `pushState`/`popstate`/`hashchange`; passa a **rolar até
  `<section id="cat-<id>">`** em vez de ativar chips de `TrilhaCategorias`.
- **M10 / RF-15.4** — revisita (localStorage do último nicho, sem `?n=`, sem
  hash) começa na vitrine.
- **RF-16** — degradação sem JS: `GradeCatalogo.astro` (Bloco 2c) com headings
  `id="grade-cat-<id>"`; todas as `<article id="produto-<sku>">` presentes; CSS
  de ocultar telas sob `html.js`.
- **RNF-13** — só a porta eager (mosaico: 1–2 capas eager, resto `lazy`); medir
  `dist/index.html` gzip (teto proposto 90 KB).
- **RNF-08** — troca de tela sem transição quando `prefereMenosMovimento()`;
  trilhas sem animação de entrada.
- **Base.astro** — inclui `TarjaOferta`; carrega `telas.ts`; `class="js"` cedo.

## Stories

| Story | Estado | Nota |
|---|---|---|
| E6-01 — casca de 3 telas + `TelaEntrada`/`VitrineFoco`/`TrilhaCategorias`/`MiniProduto` + grade por categoria | ✅ feito | `MiniProduto` e a grade seguem; `TelaEntrada`/`VitrineFoco`/`TrilhaCategorias` superseded |
| E6-02 — `telas.ts` (navegação, `pushState`/`popstate`, `html.js`, revisita, religar vídeo) | ✅ feito | contrato intacto; só muda o alvo do scroll de categoria |
| [**E6-03**](../stories/E6-03-rota-por-nicho-secao-unica.md) — `n/[slug].astro` usa a seção única (extrai `SecaoUnica.astro`) | 🔵 detalhada | layout compartilhado com `index.astro`, nicho da rota |
| [**E6-04**](../stories/E6-04-porta-do-catalogo.md) — `PortaCatalogo.astro` (substitui `TelaEntrada`) | 🔵 detalhada — **próxima** | mosaico + linha de organização + `[data-slot]` |
| [**E6-05**](../stories/E6-05-trilhas-e-informacoes.md) — `TrilhaProdutos.astro` (Bloco 2a + 2b) + `BlocoInformacoes.astro` (Bloco 3); remove `VitrineFoco`; `TrilhaCategorias` → `@deprecated` | 🔵 detalhada | `scroll-snap` nativo; Embla por import dinâmico só em viewport |
| [**E6-06**](../stories/E6-06-slice-de-medicao-em-device.md) — slice de medição em device (porta + 1 trilha, e o protótipo do Bloco 1 no padrão 1a) num Android médio no webview do TikTok | 🔵 detalhada | **é o Portão B da Fase 1** (ADR-008 §7): LCP ≤ 2,5 s, TTI ≤ 3,5 s, `index.html` gzip ≤ 90 KB, jank |

## Aberto (arquivos)

- [ ] `src/components/Porta/PortaCatalogo.astro` — E6-04.
- [ ] `src/components/Vitrine/TrilhaProdutos.astro` — E6-05.
- [ ] `src/components/Info/BlocoInformacoes.astro` — E6-05.
- [ ] `src/pages/index.astro` — trocar `TelaEntrada + TrilhaCategorias + VitrineFoco`
      pelos blocos novos; manter `GradeCatalogo` como Bloco 2c — E6-04/E6-05.
- [ ] `src/pages/n/[slug].astro` — E6-03.
- [ ] `src/components/GradeCatalogo/GradeCatalogo.astro` — headings
      `id="grade-cat-<id>"` — E6-05.
- [ ] `src/lib/navegacao/telas.ts` — alvo do scroll de categoria vira
      `<section id="cat-<id>">` — E6-05.
- [ ] `src/components/Vitrine/VitrineFoco.astro` — **remover** — E6-05.
- [ ] `src/components/Vitrine/TrilhaCategorias.astro` — marcar `@deprecated`
      (some da página; volta só se a Fase 1 quiser) — E6-05.
- [x] `src/components/Vitrine/MiniProduto.astro` — E6-01 (mantido).
- [x] `src/lib/navegacao/telas.ts` — máquina de estados — E6-02 (mantida).
- [x] `src/styles/global.css` — gate `html.js` — E6-02 (mantido).
- [x] `src/layouts/Base.astro` — `telas.ts` + `html.js` — E6-02 (mantido).

## Depende de

**E2** (schema + `resolver.ts` — E2-03 ✅). Usa a saída de **E5**
(`DetalheProduto`, `RenderBlocos`, `GaleriaMidia`) nas `<article>` de detalhe.

## Fora de escopo

Reescrita das telas por `?n=/?c=/?o=` (E3). OG/rota `/n/<slug>` para SEO (E4).
**Bloco 1 — navegador de categorias em dois eixos (grupos + estilos) + carrossel
de referenciamento (ADR-008 Fase 1 — E7 novo, atrás dos portões D-02 + E6-06).**
