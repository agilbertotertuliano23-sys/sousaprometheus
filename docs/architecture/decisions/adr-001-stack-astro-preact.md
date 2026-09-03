# ADR-001 — Stack: Astro estático + ilhas Preact

**Status:** aceito · **Data:** 2026-09-02 · **Herdado de:** ARES ADR-001

## Contexto

PROMETEUS parte da mesma base do ARES e tem o mesmo requisito central: HTML
mínimo no caminho crítico, JS só onde há interação real. O alvo (webview do
TikTok em 4G) é ainda mais sensível a peso que o do ARES.

## Decisão

Astro com `output: 'static'`. Ilhas Preact como padrão; React só quando uma ilha
específica já trouxer a dependência, declarado por `/** @jsxImportSource ... */`
no topo do `.tsx`. Tailwind v4 via `@tailwindcss/vite`, sem Preflight global.

## Consequências

- **+** Grafo de build conhecido, HTML servível sem runtime.
- **+** Reaproveita padrões e memória de agente do ARES.
- **−** Duas engines de JSX no mesmo repo — mitigado pela convenção do pragma.
- **−** Sem SSR: personalização tem que ser client-side (ADR-003).
