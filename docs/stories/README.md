# PROMETEUS — Stories

Unidade de trabalho. Cada story pertence a um épico
([`../epics/`](../epics/README.md)) e cita os `RF-*`/`RNF-*` que satisfaz.

Nomeação: `E<n>-<nn>-<slug>.md`.

**Revisão 2026-09-02 — ADR-007.** O caminho crítico e as dependências entre
stories estão em [`../epics/PLANO-PROXIMO-PASSO.md`](../epics/PLANO-PROXIMO-PASSO.md).
**E2-03 está feita** ([arquivo](E2-03-schema-catalogo-categorizado.md)): schema
ADR-007 em `tipos.ts`, `resolver.ts` + `validar.ts` (puros), vocabulário +
`registry.ts`, e `exemplo.ts` virou fixture rica.

**E5-01, E6-01 e E6-02 estão feitas.** E6-02 ligou a máquina de estados de telas
no cliente (`src/lib/navegacao/telas.ts` + `html.js` + `pushState`/`popstate`/
`hashchange`) como progressive enhancement, sem regredir a degradação por âncora
de E6-01. A **máquina de telas e a navegação por `#hash` seguem valendo**.

**Reescopo — [ADR-008](../architecture/decisions/adr-008-catalogo-como-pagina-rica-de-secoes.md)
Fase 0 (aceita 2026-09-02):** `TelaEntrada`/`VitrineFoco`/`TrilhaCategorias` de
E6-01 são superseded. A tela de entrada vira **porta do catálogo** (`E6-04`); a
tela do meio vira **trilha "em alta" + trilha por categoria + grade +
informações** (`E6-05`, remove `VitrineFoco`). A **próxima de E6** é **E6-04**
(∥ **E6-03** `n/[slug].astro`, ∥ **E5-02**). O slice de medição é **E6-06** (=
Portão B da Fase 1). O **Bloco 1** (navegador de categorias em dois eixos) é
**Fase 1 → E7 novo**, atrás de D-02 + E6-06. Ver
[`../epics/E6-fluxo-de-tres-telas.md`](../epics/E6-fluxo-de-tres-telas.md).

| Story | Épico | Estado |
|---|---|---|
| E1-01 — scaffold Astro + tokens | E1 | ✅ feito (retroativa) |
| E1-02 — console CLI (comandos base) | E1 | ✅ feito (retroativa) |
| E1-03 — destravar build (`npm install` limpo, `check`, `build`) | E1 | ✅ feito |
| [E2-03 — schema categorizado + `resolver.ts` + `validar.ts` + fixture](E2-03-schema-catalogo-categorizado.md) | E2 | ✅ feito |
| E2-04 — `catalog validate` + `niche.ts.tmpl` cobrindo o schema novo | E2 | ⬜ aberto |
| E2-01 — primeiro nicho real (pós D-02/D-06) | E2 | ⬜ bloqueado por decisão |
| E2-02 — medição de peso/LCP no webview (pós E5+E6) | E2 | ⬜ aberto |
| [E5-01 — registry + `RenderBlocos` + `DetalheProduto` + blocos texto/mídia/depoimento](E5-01-registry-blocos-e-detalhe.md) | E5 | ✅ feito |
| E5-02 — `GaleriaMidia` + benefícios + specs (`<dl>` + `BlocoSpecs`) | E5 | ⬜ aberto |
| E5-03 — blocos `como-usar` / `comparativo` / `bonus` / `faq` | E5 | ⬜ aberto |
| [E6-01 — seção única (casca) + `TelaEntrada` + `VitrineFoco` + `TrilhaCategorias` + `MiniProduto` + grade por categoria](E6-01-casca-tres-telas.md) | E6 | ✅ feito |
| [E6-02 — `telas.ts` (navegação, `pushState`/`popstate`, `html.js`, revisita, religar vídeo)](E6-02-maquina-de-telas-no-cliente.md) | E6 | ✅ feito |
| [E5-02 — `GaleriaMidia` + benefícios + specs (`<dl>` + `BlocoSpecs`)](E5-02-galeria-midia-e-specs.md) | E5 | ✅ feito (build verde; QA de device é E6-06) |
| [E6-03 — `n/[slug].astro` usa a seção única (extrai `SecaoUnica.astro`)](E6-03-rota-por-nicho-secao-unica.md) | E6 | ✅ feito |
| [E6-04 — `PortaCatalogo.astro` (porta do catálogo — substitui `TelaEntrada`)](E6-04-porta-do-catalogo.md) | E6 | ✅ feito |
| [E6-05 — `TrilhaProdutos` (em alta + por categoria) + `BlocoInformacoes`; remove `VitrineFoco`](E6-05-trilhas-e-informacoes.md) | E6 | ✅ feito |
| [E6-06 — slice de medição em device (= Portão B da Fase 1 do ADR-008)](E6-06-slice-de-medicao-em-device.md) | E6 | ⬜ aberto — **próxima de E6** |
| [E3-01 — reescrever entrada + vitrine + detalhe no cliente (`?n=`)](E3-01-reescrever-slots-e-grade.md) | E3 | ⬜ aberto — **reescopada** (era "cabeçalho + grade") |
| E3-02 — variante por criativo (`?c=`): categorias, ordem, herói, chamada | E3 | ⬜ aberto |
| E3-03 — tarja de oferta (`?o=`) + teaser na entrada | E3 | ⬜ aberto |
| E4-01 — OG por nicho | E4 | ⬜ aberto |
| E4-02 — rota `/n/<slug>` + sitemap + robots | E4 | ⬜ aberto |
| E4-03 — `prometeus deploy-check` (schema + peso + OG) | E4 | ⬜ aberto |
| E4-04 — Web Share API na vitrine/detalhe | E4 | ⬜ aberto |

> As stories retroativas de E1 não têm arquivo próprio — o código já está no
> repo e o [`../ESTADO-ATUAL.md`](../ESTADO-ATUAL.md) descreve o que existe.
> Detalhar as demais sob demanda (handoff `aiox-sm`), começando por **E2-04**.
