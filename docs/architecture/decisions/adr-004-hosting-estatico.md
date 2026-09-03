# ADR-004 — Deploy 100% estático em CDN

**Status:** aceito · **Data:** 2026-09-02 · **Herdado de:** ARES ADR-006

## Contexto

O produto é vitrine: não processa pagamento, não guarda estado, não autentica. A
conversão é um link de saída. Não há nada que exija um servidor.

## Decisão

`astro build` gera `dist/` estático, publicado em CDN (Netlify / Cloudflare Pages
/ Vercel static). Sem SSR, sem funções serverless, sem banco. `RNF-11` trava isso.

## Consequências

- **+** Custo próximo de zero, escala trivial, superfície de ataque mínima.
- **+** Cache de CDN cobre picos de tráfego de um vídeo viralizando.
- **−** Personalização e métricas têm que viver no cliente (ADR-003).
- **−** Republicar um nicho = rebuild + redeploy do site inteiro.
