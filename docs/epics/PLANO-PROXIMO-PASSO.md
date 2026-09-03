# PLANO — Próximo passo (caminho crítico pós ADR-007)

**Data:** 2026-09-02 · **Autor:** Aria (AIOX Architect) · **Base:**
[ADR-007](../architecture/decisions/adr-007-catalogo-categorizado-e-apresentacao-rica.md),
[arch/08](../architecture/08-catalogo-categorizado.md),
[arch/09](../architecture/09-fluxo-de-telas-e-apresentacao.md).

Este documento é o roteiro de execução: a sequência de stories, o que cada uma
depende, o esforço aproximado e a entrega verificável. Não é implementação.

> **Revisão 2026-09-02 — [ADR-008](../architecture/decisions/adr-008-catalogo-como-pagina-rica-de-secoes.md)
> Fase 0 (aceita).** O **E6 foi reescopado** (ver
> [`E6-fluxo-de-tres-telas.md`](E6-fluxo-de-tres-telas.md)): a tela de entrada
> vira a **porta do catálogo** (`PortaCatalogo`, story **E6-04**); a tela do meio
> vira **trilha "em alta" + uma trilha por categoria + grade + informações**
> (`TrilhaProdutos` + `BlocoInformacoes`, story **E6-05**); `VitrineFoco` é
> removido, `TrilhaCategorias` fica `@deprecated`. A `telas.ts` (E6-02) e a
> navegação por `#hash` continuam valendo. O **slice de medição em device**
> (story **E6-06**) é agora item explícito e **é o Portão B da Fase 1**. O
> **Bloco 1** (navegador de categorias em dois eixos + carrossel de
> referenciamento) fica para um **E7 novo**, atrás dos portões D-02 + E6-06
> (ADR-008 §7) — nada de E7 antes de `architecture/08`/`10` fecharem na Fase 1.
> As linhas de E3-01/E4 abaixo que citam "capa" / "herói" leem-se como "porta" /
> "trilha em alta".

## Princípio de sequenciamento

1. **Schema primeiro** (E2): nada de UI antes do modelo de dados estar em
   `tipos.ts`, validado e com fixture. É o gargalo que destrava tudo.
2. **Conteúdo e casca em paralelo** (E5 ∥ E6): apresentação rica (Astro puro,
   baixo risco) e a casca das 3 telas (estado no cliente, risco de perf) são
   superfícies independentes depois do schema.
3. **Efeito da URL por último no núcleo** (E3): `slots/*` só faz sentido quando
   as 3 telas existem no HTML e os componentes de detalhe estão prontos.
4. **SEO/publicação encerra** (E4).

## Grafo de dependências (stories)

```
E1-03 (build verde) ✔
   │
   ▼
E2-03  schema + resolver + validar + fixture   ◄── PRIMEIRA STORY
   ├──────────────► E2-04  catalog validate + template
   │
   ├──────────────► E5-01  registry + RenderBlocos + DetalheProduto + 3 blocos
   │                   ├──► E5-02  GaleriaMidia + benefícios + specs
   │                   └──► E5-03  blocos restantes (como-usar, comparativo, bonus, faq)
   │
   └──────────────► E6-01  seção única (casca) + telas + grade por categoria
                       └──► E6-02  telas.ts (navegação, pushState/popstate, html.js)
                               └──► E6-03  n/[slug].astro usa a seção única
                       │
   (E5-01 + E6-01 + E6-02) ──► E3-01  slots/{entrada,vitrine,detalhe} — ?n= reescreve as 3 telas
                                   ├──► E3-02  ?c= (variantes: categorias, ordem, herói, chamada)
                                   └──► E3-03  ?o= (tarja + CTA + teaser na entrada)
                                           │
                                           ▼
                                       E4-01 OG · E4-02 rota/sitemap · E4-03 deploy-check · E4-04 Web Share
                                           │
                       (E5 + E6 prontos) ──► E2-02  medição peso/LCP no webview real
                       (D-02 + D-06) ──────► E2-01  primeiro nicho real
```

## Tabela story × épico × dependência × esforço × entrega

Esforço: **P** ≈ 0,5–1 dia · **M** ≈ 1–3 dias · **G** ≈ 3–5 dias.

| Story | Épico | Depende de | Esf. | Entrega verificável |
|---|---|---|:--:|---|
| **E2-03** — Schema categorizado + apresentação em `tipos.ts`; `resolver.ts`; `validar.ts`; `tipos-bloco.json`; `exemplo.ts` como fixture rico | E2 | E1-03 ✔ | **M** | `npm run typecheck` e `npm run build` verdes com o schema novo; `resolver.ts` cobre categorias sintéticas, ordenação por prioridade, herói e galeria derivada; `exemplo.ts` tem 2 categorias + 1 produto com galeria + 1 bloco de cada tipo comum |
| **E2-04** — `lerNicho`/`catalog validate` cobrem o schema novo; `niche.ts.tmpl` atualizado | E2 | E2-03 | **M** | `npm run validate` verde com o `exemplo` rico; injetar id de categoria inválido, `tipo` de bloco fora do vocabulário e asset faltando → cada um dá exit 1 com mensagem clara |
| **E5-01** — `registry.ts` + `RenderBlocos.astro` + `DetalheProduto.astro` + `BlocoTexto`/`BlocoMidia`/`BlocoDepoimento` | E5 | E2-03 | **M** | Uma página de detalhe empilhada do `exemplo` renderiza os 3 blocos **sem JS**; tipo desconhecido é ignorado (warn em DEV) |
| **E5-02** — `GaleriaMidia.astro` + benefícios (`<ul>`) + specs (`<dl>` + `BlocoSpecs`) | E5 | E5-01 | **M** | Galeria com scroll-snap + dots no `exemplo`; sem JS vira pilha; `prefers-reduced-motion` sem transição; capa eager, resto `lazy` |
| **E5-03** — Blocos `como-usar`, `comparativo`, `bonus`, `faq` | E5 | E5-01 | **P** | Cada bloco renderiza no `exemplo`; `tipos-bloco.json` + `registry.ts` + union em `tipos.ts` atualizados juntos; nenhum arquivo de núcleo tocado |
| **E6-01** — Seção única (casca): `index.astro` com `#app` 3 telas + `TelaEntrada` + `VitrineFoco` + `TrilhaCategorias` + `MiniProduto`; `GradeCatalogo` reescrita por categoria | E6 | E2-03 (detalhe pode ser placeholder até E5-01) | **G** | `npm run build` verde; **sem JS** navega entrada→vitrine→detalhe por âncora; Lighthouse mobile do 1º paint dentro de 1,2 MB / LCP ≤ 2,5 s com o `exemplo` |
| **E6-02** — `telas.ts`: `html.js`, `data-tela`, `pushState`/`popstate`/`hashchange`, revisita começa na vitrine, religa vídeo/galeria; `Base.astro` carrega e inclui `TarjaOferta` | E6 | E6-01 | **M** | Navegar as 3 telas mantém `?n/?c/?o` na URL; botão "voltar" do webview anda entrada↔vitrine↔detalhe; teste em Android médio real registrado |
| [**E6-03**](../stories/E6-03-rota-por-nicho-secao-unica.md) — `n/[slug].astro` usa a seção única; extrai `SecaoUnica.astro` (fonte única de `/` e `/n/<slug>`) | E6 | E6-01 (idealmente pós E6-04/05) | **P** | `/n/exemplo/` renderiza a seção única com o nicho da rota; `dist/index.html` byte-a-byte igual ao de antes |
| [**E6-04**](../stories/E6-04-porta-do-catalogo.md) *(ADR-008 F0)* — `PortaCatalogo.astro` substitui `TelaEntrada`: kicker, título, proposta, linha de organização, mosaico de capas, CTA → `#tela-vitrine`, slot da tarja; `[data-slot]` | E6 | E2-03 ✔ | **M** | Porta do `exemplo` renderiza sem JS; mosaico linka `#cat-<id>`; só as 2 primeiras capas eager; CTA rola até a vitrine |
| [**E6-05**](../stories/E6-05-trilhas-e-informacoes.md) *(ADR-008 F0)* — `TrilhaProdutos.astro` (Bloco 2a em alta + Bloco 2b por categoria) + `BlocoInformacoes.astro` (Bloco 3); remove `VitrineFoco`; `TrilhaCategorias` → `@deprecated`; `GradeCatalogo` headings `id="grade-cat-<id>"`; `telas.ts` rola até `<section id="cat-<id>">` | E6 | E2-03 ✔, E5-01 (E5-02 recomendado) | **G** | `npm run build` verde; sem JS: porta → trilhas → grade → informações → detalhes por âncora; `dist/index.html` gzip registrado (alvo ≤ 90 KB) |
| [**E6-06**](../stories/E6-06-slice-de-medicao-em-device.md) *(ADR-008 F0 · Portão B da Fase 1)* — slice de medição: página da Fase 0 + protótipo descartável do Bloco 1 (padrão 1a) num Android médio real no webview do TikTok | E6 | E6-04, E6-05 | **M** | `docs/stories/relatorios/E6-06-medicao.md` com LCP/TTI/peso/`index.html` gzip/jank + veredito PASS/CONCERNS/FAIL. Substitui/absorve E2-02. |
| **E3-01** — `slots/{index,entrada,vitrine,detalhe}.ts`: `?n=` reescreve as 3 telas clonando `<template>` buildado | E3 | E5-01, E6-01, E6-02 | **G** | `?n=<outro nicho>` muda capa + vitrine + detalhe sem recarregar; `?n=` ausente/inválido → padrão íntegro; JS off → padrão íntegro nas 3 telas |
| **E3-02** — `?c=`: `criativo.ts` (`ordenarCategorias`, `ordenarProdutos`, `heroi`) + `nicho.variantes`; aplicado nas 3 telas | E3 | E3-01 | **M** | Bucket `b` de um `?c=` reordena categorias, reordena produtos, troca herói e troca a chamada da entrada, de forma estável (mesmo `?c=` → mesmo resultado) |
| **E3-03** — `?o=`: `oferta.ts` + `TarjaOferta` ligada; tarja global + troca de CTA + `teaserEntrada` | E3 | E3-01 | **P** | `?o=frete` mostra a tarja, troca o texto do CTA e injeta o teaser na entrada; `?o=` sem entrada = nada acontece |
| **E4-01** — OG por nicho (`og.ts`) em `Base.astro` + `n/[slug].astro`; `og:image` cai na capa do herói | E4 | E6-03 | **P** | `view-source` de `/` e `/n/exemplo/` tem `og:title/description/image` corretos; sem `nicho.og.imagem`, usa o herói |
| **E4-02** — rota `/n/<slug>` no sitemap + `sitemap.xml.ts` (um `<url>` por slug) + `robots.txt` | E4 | E6-03 | **P** | `sitemap.xml` lista `/` e `/n/<slug>` por nicho; `robots.txt` aponta o sitemap |
| **E4-03** — `prometeus deploy-check` (schema ADR-007 + peso de asset + `dist/index.html` gzip + OG) | E4 | E2-04, E6-01 | **M** | `prometeus deploy-check` verde num nicho ok; falha com asset fora do orçamento, `index.html` gzip acima do teto, OG ausente ou schema inválido |
| **E4-04** — Web Share API na vitrine/detalhe (`navigator.share({url: location.href})`) | E4 | E6-02 | **P** | Botão aparece só onde a API existe; compartilha `?n/?c/?o` + `#hash`; escondido sem a API |
| **E2-01** — Primeiro nicho real (dados + assets `webp/avif` + vídeos via `prometeus video`) | E2 | **D-02**, **D-06**, E2-04 | **M** | `catalog validate` + `assets check` verdes no nicho real; publica |
| **E2-02** — Medição de peso/LCP/TTI no webview real (4G simulado) | E2 | E5-02, E6-02 | **P** | Relatório Lighthouse mobile + medição em device: LCP ≤ 2,5 s, TTI ≤ 3,5 s, 1º paint ≤ 1,2 MB |

## A primeira story

**`E2-03` — Schema categorizado + apresentação em `tipos.ts` + `resolver.ts` +
`validar.ts` + `tipos-bloco.json` + `exemplo.ts` fixture.**

Por que esta e não outra:

- **Destrava E5 e E6 ao mesmo tempo.** Nenhuma UI da nova direção começa sem o
  modelo de dados.
- **Risco baixo, isolável.** É TypeScript puro + uma função de resolução pura +
  um scanner. Não depende de device, não depende de decisão de negócio
  (D-02/D-06), não toca no caminho crítico de render.
- **Testável sozinha.** `resolver.ts` tem entradas e saídas determinísticas
  (categorias sintéticas, ordenação por prioridade, eleição de herói, galeria
  derivada) — dá para cobrir com um punhado de asserts antes de qualquer pixel.
- **Compatível por construção.** O `exemplo.ts` atual continua válido; a story
  só o **estende** para virar fixture das próximas.

**Handoff:** `aiox-sm` detalha `E2-03` (critérios de aceite + notas de
implementação, espelhando `architecture/08` §2 e §4). `aiox-dev` implementa
sobre o scaffold. `aiox-qa` valida contra os casos de `resolver.ts` e a matriz
de compatibilidade do `exemplo.ts`.

## Decisões ainda pendentes (não bloqueiam o caminho crítico até E2-01/E4)

- **D-02** — lista de nichos de lançamento. Bloqueia E2-01.
- **D-06** — modelo do link de saída (afiliado / loja própria / ambos). Bloqueia
  E2-01 e afina `Produto.url` + `data-*` de atribuição.
- **D-11 (nova, sugerida)** — a revisita deve mesmo pular a tela de entrada
  (RF-15.4)? Decidir com dado quando houver tráfego. Default proposto: pula.

## Sequência E5 / E6 (detalhado por `aiox-sm` — 2026-09-02)

E5-01 e E6-01 estão detalhadas ([`../stories/E5-01-registry-blocos-e-detalhe.md`](../stories/E5-01-registry-blocos-e-detalhe.md),
[`../stories/E6-01-casca-tres-telas.md`](../stories/E6-01-casca-tres-telas.md)).

- **Fazer E5-01 antes de E6-01.** Embora o grafo acima as ponha em paralelo pós
  E2-03, há um acoplamento de consumo: E6-01 monta `#tela-detalhe` com o
  `DetalheProduto.astro` que **E5-01 entrega**. Fazer E5-01 primeiro remove o
  placeholder e um follow-up de integração.
- **E5-01** entra sem tocar `index.astro`: entrega `RenderBlocos` +
  `BlocoTexto/BlocoMidia/BlocoDepoimento` + `DetalheProduto` (galeria em versão
  simples) + preenche 3 das 8 chaves do `REGISTRY`. Vê-se por uma rota só de DEV
  (`/dev/detalhe`) que não vai para `dist/` em produção.
- **E6-01** consome `DetalheProduto`, reescreve `index.astro` para a seção única
  de 3 telas (entrada/vitrine/detalhe) buildada com o `NICHO_PADRAO`, navegável
  por âncora **sem JS**. Não entra `telas.ts` (E6-02) nem reescrita por `?n=` (E3-01).
- **E2-04** (template + endurecimento do `catalog validate`) é independente e
  pode correr em paralelo com E5-01/E6-01.
- Divisão fina dentro de E5: `specs` (`<dl>` + `BlocoSpecs`) e `GaleriaMidia` são
  **E5-02**; `como-usar`/`comparativo`/`bonus`/`faq` são **E5-03**.

### Reescopo E6 — ADR-008 Fase 0 (2026-09-02)

- **E5 não muda.** A tela de detalhe e todo o E5 seguem como especificado.
- **E6-01/E6-02 valem**, mas `TelaEntrada`/`VitrineFoco`/`TrilhaCategorias` são
  superseded. Sequência nova de E6: **E6-03** (`n/[slug].astro`) ∥ **E6-04**
  (`PortaCatalogo`) → **E6-05** (`TrilhaProdutos` + `BlocoInformacoes`, remove
  `VitrineFoco`) → **E6-06** (slice de medição).
- **E6-04 depende só de E2-03** (schema atual já cobre). **E6-05 depende de
  E5-01** (usa `DetalheProduto` no `#tela-detalhe`). Podem correr após E5-01.
- **Nada de schema novo, nada de `prd` novo na Fase 0.** O cascade de schema
  (`architecture/08`/`10`, `prd/01`/`02`) e o **E7** ("catálogo dinâmico" —
  Bloco 1) só existem na **Fase 1**, atrás de **D-02** + **E6-06 verde**
  (ADR-008 §7).

### Status (2026-09-02, `aiox-dev`)

- **E5-01 ✅ entregue.** `RenderBlocos` + `BlocoTexto`/`BlocoMidia`/`BlocoDepoimento`
  + `DetalheProduto` + `REGISTRY` com 3/8 chaves vivas + rota `/dev/[amostra]` só
  de DEV. Portão (`validate`/`typecheck`/`build`/`doctor`) exit 0; `dist/dev`
  inexistente.
- **E6-01 ✅ entregue.** `index.astro` = seção única de 3 telas com o
  `NICHO_PADRAO`; `TelaEntrada`/`VitrineFoco`(`hidden`)/`TrilhaCategorias`/
  `MiniProduto`; `GradeCatalogo` agrupada por categoria; `CardProduto` com
  `data-*` + link ao detalhe; `Base.astro` com `TarjaOferta` inerte. Portão exit
  0; 4 rotas intactas. `dist/index.html`: 32,8 KB cru / 5,3 KB gzip.
- **E6-02 ✅ entregue** ([`../stories/E6-02-maquina-de-telas-no-cliente.md`](../stories/E6-02-maquina-de-telas-no-cliente.md)).
  `src/lib/navegacao/telas.ts` (progressive enhancement): `html.js` vindo do
  próprio controlador, `#app[data-tela]`, `history.pushState`/`replaceState` com
  `#hash` (`#vitrine`, `#vitrine&cat=<id>`, `#produto=<sku>`) **preservando
  `location.search`** (montada como `pathname + search + hash`),
  `popstate`+`hashchange`, revisita começa na vitrine (`eraRecorrente` capturado
  em top-level, antes de `aplicarPersonalizacao()` gravar a chave), religa
  `ligarVideoVertical` no detalhe com guarda `Set<sku>` anti-duplicação. Diff só
  em `telas.ts` (novo) + `global.css` (gate sob `html.js` + correção do
  `[hidden]` da `VitrineFoco`) + `Base.astro` (1 import + 1 chamada). **Não**
  tocou `index.astro` nem `n/[slug].astro`. Portão `validate`/`typecheck`/
  `build`/`doctor` exit 0; 4 rotas intactas; `dist/index.html` 44,1 KB cru /
  6,1 KB gzip (o gate CSS acrescenta ~0,7 KB inline; o `telas.ts` entra no bundle
  do `<script>` do `Base.astro`, não no HTML). Falta a aferição em device (E2-02).
- **Bug do `import.meta.glob` — ✅ já corrigido.** `src/lib/catalogo/carregar.ts`
  agora usa `import.meta.glob('/src/assets/catalog/**/*', { eager: true, query:
  '?url', import: 'default' })` — o `?url` força o Vite a devolver a URL final
  com hash em vez de tratar o `*.svg` como componente Astro. O `src` dos `<img>`
  buildados (`/` e `/n/exemplo/`) sai correto. Não é mais pendência.
