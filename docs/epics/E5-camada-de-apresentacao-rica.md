# E5 — Camada de apresentação rica

**Estado:** ⬜ não iniciado. **Novo (ADR-007).**

## Objetivo

Transformar o dado de apresentação (galeria, benefícios, specs, blocos) em tela.
Tudo Astro puro — renderiza estático, funciona sem JS, risco de performance
baixo. É o diferencial do domínio: cada produto é **apresentado**, não listado.

## Escopo

- **M9 / RF-12** — `GaleriaMidia.astro`: imagens + vídeos 9:16 em scroll-snap
  horizontal com dots; sem-JS = pilha vertical; `prefers-reduced-motion` sem
  transição. Só a capa do herói é eager; resto `lazy`/`preload=none` (RNF-13).
- **M9 / RF-13** — benefícios (`<ul>` no topo do detalhe) e specs (`<dl>` +
  `BlocoSpecs`).
- **M9 / RF-14** — sistema de blocos:
  - `src/lib/apresentacao/registry.ts` — `Record<TipoBloco, ComponenteAstro>`,
    importando `tipos-bloco.json` (fonte única, criada em E2).
  - `src/components/blocos/RenderBlocos.astro` — itera `blocos[]`, resolve pelo
    registry, ignora tipo desconhecido (DEV: `warn`).
  - `src/components/blocos/Bloco<Tipo>.astro` para: `texto`, `midia`,
    `depoimento`, `como-usar`, `comparativo`, `bonus`, `faq`, `specs`.
- **M9** — `DetalheProduto.astro`: cabeçalho (nome, preço + tarja, benefícios,
  specs) + `GaleriaMidia` + `RenderBlocos` + CTA de saída sticky + botão "voltar
  à vitrine". `data-sku`.
- **RNF-14** — checklist de "adicionar um tipo de bloco" documentado no topo do
  `registry.ts` (5 passos, nenhum toca núcleo).
- **RNF-06/07/08** — toque ≥ 44px, contraste AA sobre `--acento`, animação sob
  guarda de `prefers-reduced-motion` em toda a apresentação.

## Aberto

- [ ] `src/lib/apresentacao/registry.ts`.
- [ ] `src/components/blocos/RenderBlocos.astro`.
- [ ] `src/components/blocos/{BlocoTexto,BlocoMidia,BlocoDepoimento,BlocoComoUsar,BlocoComparativo,BlocoBonus,BlocoFaq,BlocoSpecs}.astro`.
- [ ] `src/components/Detalhe/GaleriaMidia.astro`.
- [ ] `src/components/Detalhe/DetalheProduto.astro`.
- [ ] `<template>` dos blocos e do detalhe embutidos na página (fonte de
      clonagem para `slots/detalhe.ts` em E3).
- [ ] Tokens/estilos de bloco em `docs/design/tokens.css` se precisar de
      primitivo novo (evitar; reusar a escala existente).
- [ ] Fixture: `exemplo.ts` (de E2) exercitando cada bloco pelo menos uma vez.

## Depende de

**E2** (schema + `tipos-bloco.json` + `resolver.ts` + `exemplo.ts` fixture).

## Fora de escopo

Montagem/navegação das 3 telas (E6). Reescrita client-side por `?n=` (E3).
Blocos interativos/com estado (ADR-007). Ilha Preact de vitrine (E6/Could C1).
