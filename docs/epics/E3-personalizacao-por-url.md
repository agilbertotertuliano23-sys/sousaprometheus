# E3 — Personalização por URL (`?n=` / `?c=` / `?o=`)

**Estado:** 🟠 parcial. `contexto.ts` troca `--acento` e os `data-*`; o efeito
sobre o conteúdo ainda não existe. É o épico com mais valor pendente.
**Revisão ADR-007:** o núcleo (hash, memória, degradação) fica igual; o
**efeito** cresce — `?n=` reescreve **as 3 telas**, `?c=` reordena também
categorias.

## Objetivo

Um link divulgado (`/?n=pet-shop&c=tt-039&o=frete`) muda o que o visitante vê —
nicho, categorias/ordem/herói por criativo, selo e teaser de oferta — no cliente,
sem recarregar, sem tirar os params da URL ao navegar entre telas, com
degradação graciosa se o JS falhar.

## Escopo

- **M6 / RF-05** *(ampliado)* — `?n=` troca nicho: acento, `data-nicho` **e**
  reescreve entrada + vitrine + detalhe a partir de `NICHOS[slug]` + `resolver.ts`.
  Fallback: `localStorage` → nicho padrão.
- **S1 / RF-06** *(ampliado)* — `?c=` → bucket `a`/`b` estável (FNV-1a); regra
  `nicho.variantes.b` reordena categorias, reordena produtos, troca herói e troca
  a chamada da entrada.
- **S2 / RF-07** *(ampliado)* — `?o=` → tarja/selo global + troca opcional do
  CTA + teaser opcional na tela de entrada.
- **S3 / RF-05.3 / RF-15.4** — memória do último nicho no `localStorage`;
  revisita pode começar na vitrine. ✅ memória já feita.

## Feito

- `src/data/personalizacao.ts` — `resolverContexto()`, hash FNV-1a, bucket a/b.
- `src/lib/personalizacao/contexto.ts` — lê URL, `localStorage`, aplica
  `--acento` + `data-nicho/variante/oferta`.
- `data-slot` do cabeçalho já no HTML (`index.astro`, `n/[slug].astro`).

## Aberto — stubs criados, falta implementar

- [ ] `src/lib/personalizacao/slots/` — substitui o `slots.ts` monolítico:
  - `index.ts` — orquestra; chamado por `contexto.ts` depois dos `data-*`.
  - `entrada.ts` — reescreve os `[data-slot]` da capa editorial.
  - `vitrine.ts` — reconstrói trilha de categorias + herói + miniaturas
    (via `resolver.ts` + `variante`).
  - `detalhe.ts` — substitui as `<article>` de detalhe clonando os
    `<template id="tpl-detalhe">` / `tpl-bloco-*` buildados (não gerar marcação
    em JS). **Story principal — E3-01, reescopada.**
- [ ] `src/lib/personalizacao/criativo.ts` — `ordenarProdutos`,
      `ordenarCategorias(nicho, variante)`, `heroi(nicho, variante)`; `Nicho`
      ganha `variantes` (feito em E2); `catalog validate` cobre SKUs/ids citados.
- [ ] `src/lib/personalizacao/oferta.ts` + `components/TarjaOferta/` — tarja,
      troca de CTA e `teaserEntrada` na capa; `Nicho` ganha `ofertas` (feito em E2).
- [ ] Ligar os três em `contexto.ts`; devolver o contexto para `telas.ts`.
- [ ] `data-variante` / `data-sku` prontos para o pixel do anunciante (R-08).
- [ ] Teste manual da degradação graciosa (JS off → nicho padrão íntegro, RNF-04)
      **nas 3 telas**.
- [ ] Teste: `pushState`/`popstate` mantêm `?n/?c/?o` ao longo do fluxo.

## Depende de

E1 destravado. **E6** (as 3 telas existirem no HTML) e **E5** (componentes/
templates de detalhe). O núcleo de `criativo.ts`/`oferta.ts` pode ser
desenvolvido contra `exemplo` sem D-02/D-06.
