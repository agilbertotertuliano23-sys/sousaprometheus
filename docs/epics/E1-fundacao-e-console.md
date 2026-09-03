# E1 — Fundação estática + console CLI

**Estado:** ✅ de pé (código); ⚠️ build ainda não verificado uma vez.

## Objetivo

Ter o esqueleto Astro `output: 'static'` renderizando o nicho padrão e o console
`prometeus` operando o dia a dia sem dependências de terceiros.

## Escopo (Must)

- **M1 / RF-01** — Página única (`/`), mobile-first, buildada com o nicho padrão.
- **M4 / RF-08** — Console: `help`, `doctor`, `niche new`, `niche list`,
  `catalog validate`, `assets check`, `video`.
- **M5 / RF-08.3 / RNF-10** — `catalog validate` roda no `prebuild`; build falha
  com asset faltando.
- **RNF-11 / RNF-12** — Deploy 100% estático; console sem deps.

## Feito

- `astro.config.ts` (`static`, Preact+React, Tailwind v4 via Vite).
- `src/layouts/Base.astro`, `src/pages/index.astro`, `src/styles/{tokens,global}.css`.
- `src/data/{tipos,nichos,personalizacao}.ts` + `nichos/exemplo.ts`.
- `src/lib/{catalogo,personalizacao,midia,motion,utils}`.
- `src/components/{CardProduto,GradeCatalogo,VideoVertical}`.
- Console completo em `scripts/console/` — `doctor`, `catalog validate`,
  `assets check`, `niche list/new` verdes; `video` escrito.

## Aberto

- [ ] `npm install` limpo (o `node_modules/` atual veio incompleto — sem
      `.bin/`, sem lockfile, faltam arquivos internos do Astro).
- [ ] `npm run typecheck` (`astro check`) passar uma vez.
- [ ] `npm run build` gerar `dist/` uma vez.
- [ ] `prometeus video` exercitado com um clipe real (baixa prioridade).

## Fora de escopo

Painel web (ADR-005), SSR/backend (ADR-004), i18n, 3D (R-05).
