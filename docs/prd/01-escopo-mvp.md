# 01 — Escopo do MVP

Prioridização MoSCoW. IDs de requisito em [02 — Requisitos](02-requisitos.md).

> **Revisão 2026-09-02 (ADR-007):** o produto mudou de direção. A unidade de
> valor deixa de ser "grade de cards" e passa a ser **catálogo curado e
> categorizado + apresentação rica do produto + fluxo de 3 telas**. Itens novos:
> M8, M9, M10. Itens ajustados: M3 (card), M6 (o que `?n=` reescreve). Ver
> [`../architecture/08`](../architecture/08-catalogo-categorizado.md) e
> [`../architecture/09`](../architecture/09-fluxo-de-telas-e-apresentacao.md).

> **Revisão 2026-09-02 ([ADR-008](../architecture/decisions/adr-008-catalogo-como-pagina-rica-de-secoes.md) Fase 0):**
> a tela do meio deixa de ser "vitrine em foco (C4)". Só **texto** de **M10**
> ajustado — nenhum Must novo na Fase 0. Musts novos da Fase 1 (catálogo dinâmico
> de categorias em dois eixos) entram no cascade pós-portões D-02 + slice de
> medição (ADR-008 §7).

## Must

- **M1** — Página única estática, mobile-first, servida de CDN (RF-01, RNF-11).
- **M2** — Modelo de nicho: um arquivo por nicho + índice; catálogo de 2 a 8
  produtos por nicho (RF-02, RF-03).
- **M3** *(ajustado)* — Cada produto aparece como **mini** na vitrine (capa,
  preço, tarja de desconto) e como **detalhe rico** (galeria, benefícios, specs,
  blocos). O link de saída externo vive no detalhe e na capa do herói, não em
  cada card (RF-04, RF-12, RF-13).
- **M4** — Console (`prometeus`): `niche new`, `niche list`, `catalog validate`,
  `assets check`, `doctor`, `video` (RF-08).
- **M5** — Gate de catálogo no `prebuild` — build falha se um asset referenciado
  não existir, se um id de categoria for inválido ou se um bloco tiver `tipo`
  fora do vocabulário (RF-08.3, RF-14, RNF-10).
- **M6** *(ajustado)* — Personalização por URL: `?n=` troca o nicho e reescreve
  **entrada + vitrine + detalhe** no cliente; fallback para o nicho padrão se
  ausente/inválido (RF-05).
- **M7** — Orçamento de peso aplicado e medido (RNF-01, RNF-02, RNF-13).
- **M8** *(novo)* — Catálogo categorizado: o nicho declara `Categoria[]`; cada
  produto referencia uma categoria e carrega um score `prioridade` que ordena e
  destaca. A vitrine navega por categoria (RF-10, RF-11).
- **M9** *(novo)* — Apresentação rica do produto: galeria de mídia (imagens +
  vídeo 9:16), benefícios, specs e um array de **blocos declarativos** tipados,
  cada tipo com um componente Astro dedicado e uma entrada num registry
  extensível (RF-12, RF-13, RF-14).
- **M10** *(novo; texto ajustado — ADR-008 F0)* — Fluxo de 3 telas — **porta do
  catálogo** (proposta + organização + mosaico) → **catálogo em blocos** (trilha
  "em alta" + uma trilha por categoria + grade + informações) → detalhe — como
  estados de uma seção única no cliente, degradando para conteúdo empilhado
  navegável por âncora sem JS (RF-15, RF-16, RNF-04).

## Should

- **S1** *(ampliado)* — `?c=` (criativo) deriva um bucket A/B estável e pode
  reordenar categorias, reordenar produtos, trocar o herói e trocar a chamada da
  tela de entrada (RF-06).
- **S2** *(ampliado)* — `?o=` (oferta) exibe uma tarja/selo, pode trocar o texto
  do CTA e pode injetar um teaser na tela de entrada (RF-07).
- **S3** — Memória do último nicho no `localStorage`; numa revisita, o fluxo pode
  começar na vitrine e pular a entrada (RF-05.3, RF-15.4).
- **S4** — OG (title/description/image) por nicho para o card de compartilhamento
  (RF-09).
- **S5** — `assets check --strict` como passo opcional de CI; passa a conferir
  também o peso gzip do `dist/index.html` (RNF-13).
- **S6** *(novo)* — Web Share API na tela de detalhe/vitrine: `navigator.share`
  com `location.href` (carrega `?n/?c/?o` + `#hash` da tela). Sem backend, sem
  PII.

## Could

- **C1** — Ilha Preact para a vitrine (feel de swipe entre miniaturas) — só se o
  `scroll-snap` nativo não bastar.
- **C2** — `prometeus deploy-check` (lint de nicho + peso + OG + schema antes de publicar).
- **C3** — Rota estática por nicho (`/n/<slug>`) além do `?n=`, para SEO.
- **C4** — Coreografia de transição entre telas com guarda de `prefers-reduced-motion`.

## Won't (desta versão)

| Item | Por quê |
|---|---|
| Carrinho / checkout próprio | O PROMETEUS é vitrine; conversão é link de saída (D-06). |
| Contas / login | Nada de PII. Personalização é só URL + `localStorage` (D-04). |
| Busca / filtros complexos | Catálogo é curto por design (2–8). A trilha de categorias é navegação, não busca. |
| Subcategorias / categorias aninhadas | Um nível só nesta versão (ADR-007). |
| Blocos com estado/lógica (configurador, calculadora) | Blocos são declarativos e renderizam estático (ADR-007). |
| Rota estática por produto (`/n/<slug>/<sku>`) | Sem JS o `<a>` perde `?c=/?o=` → quebra atribuição (R-08). Detalhe é estado no cliente + `#hash`. |
| Score de potencial dinâmico/calculado | `prioridade` é escrito à mão no arquivo; sem backend não há de onde calcular (ADR-004). |
| Visualização 3D | Peso e CPU inviáveis no webview do TikTok (R-05). |
| i18n | PT-BR apenas nesta fase. |
| CMS / painel web | O console cobre a operação (ADR-005). |
| SSR / backend | Deploy estático travado (ADR-004). |
