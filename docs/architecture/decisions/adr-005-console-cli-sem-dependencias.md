# ADR-005 — Console CLI sem dependências de terceiros

**Status:** aceito · **Data:** 2026-09-02

## Contexto

A operação (criar nicho, validar, conferir peso, processar vídeo) precisa de
ferramenta. Opções: (a) scripts soltos como no ARES; (b) um CLI com libs
(commander, chalk, zod, execa); (c) um CLI só com Node nativo.

## Decisão

(c). `bin/prometeus.mjs` + `scripts/console/` usando apenas `node:*`
(`parseArgs`, `fs`, `path`, `child_process`, `url`). A validação de catálogo é um
scanner de texto do módulo do nicho, não um parser de TS.

## Consequências

- **+** `npx prometeus ...` funciona sem `npm install`; nada para auditar,
  nada para atualizar, nada quebra por semver de dependência.
- **+** Máquina com RAM limitada não paga por um grafo de deps de CLI.
- **−** Sem parser de TS: erros sutis de schema podem passar (R-04). Mitigado por
  `astro check` + build e por endurecer o scanner ao longo do tempo.
- **−** Reimplementamos coisas pequenas (cores, parse de args) — custo baixo e
  estável.
