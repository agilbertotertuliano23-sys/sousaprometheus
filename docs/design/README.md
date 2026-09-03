# PROMETEUS — Design System

Base escura herdada do ARES. A mudança estrutural: **o acento é uma variável por
nicho** (`--acento`), aplicada em runtime por `src/lib/personalizacao/contexto.ts`.

- **Fonte dos tokens:** [`tokens.css`](tokens.css) → copiado byte a byte para
  `src/styles/tokens.css`. Editar só aqui.
- **Direção de arte:** [`../prd/05-identidade-visual.md`](../prd/05-identidade-visual.md).

| Doc | Conteúdo |
|---|---|
| [01 — Fundamentos](01-fundamentos.md) | Escalas, contraste, alvo de toque, o acento variável |
| [`tokens.css`](tokens.css) | Primitivos → semânticos → componente |

## Tipografia

Space Grotesk (display/rótulos) · Archivo (corpo) · JetBrains Mono (preço, SKU).
Todas com fallback de sistema — **nenhuma é bloqueante para o LCP** (RNF-03).

## Princípios herdados do ARES

1. Um acento cromático por vez. Sem segunda cor por estado — erro/vazio se
   comunicam por forma + tipografia + cinza.
2. Toda animação sob guarda de `prefers-reduced-motion` (RNF-08).
3. Densidade baixa, 1 coluna no celular, alvo de toque ≥ 44px (RNF-06).

## Princípio novo do PROMETEUS

4. O componente consome `--acento`; nunca uma cor de acento hard-coded. Se
   precisar de acento em texto pequeno, `--acento-texto` (tint AA-safe).
