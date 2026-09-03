# 05 — Identidade Visual

Herda a base escura do ARES. A diferença estrutural: **a cor de acento não é
fixa — é uma propriedade do nicho** (`--acento`), trocada em runtime.

## Direção

- **Fundo escuro, quase preto** (`--c-preto: #0A0B0C`). O webview do TikTok abre
  de dentro de uma tela preta; a página não deve "piscar branco".
- **Tipografia:** Space Grotesk (display/rótulos), Archivo (corpo), JetBrains
  Mono (preço, SKU, rótulos técnicos). Todas com fallback de sistema — nenhuma
  fonte é bloqueante para o LCP.
- **Densidade baixa:** 1 coluna no celular, respiro generoso, card grande. A
  pessoa está com o polegar; alvo de toque ≥ 44px (RNF-06).
- **Acento com parcimônia:** CTA, tarja de desconto, borda do card em destaque.
  Nunca como cor de texto corrido — se precisar de acento em texto pequeno, usar
  `--acento-texto` (tint mais claro, AA-safe sobre o fundo escuro).

## Acento por nicho

- Cada `Nicho.acento` é um `#RRGGBB`. `src/lib/personalizacao/contexto.ts`
  aplica `document.documentElement.style.setProperty('--acento', nicho.acento)`.
- O nicho padrão fixa um acento no `<html>` já no HTML buildado, então não há
  "flash" de cor errada.
- **Regra de contraste (RNF-07):** texto branco (`#F2F3F5`) sobre o acento
  precisa de ≥ 4.5:1. Acentos muito claros (amarelo, ciano claro) reprovam —
  nesses casos o CTA usa texto escuro. Checar cada nicho novo antes de publicar.

## Tokens

Fonte: [`../design/tokens.css`](../design/tokens.css) (copiado byte a byte para
`src/styles/tokens.css` — ver ADR-006 do ARES, mesma regra aqui). Três camadas:
primitivos → semânticos → componente.

## O que NÃO fazer

- Não introduzir uma segunda cor cromática por estado (erro/sucesso/aviso). Erro
  e vazio se comunicam por forma + tipografia + escala de cinza. (Herdado do ARES.)
- Não usar animação de entrada sem guarda de `prefers-reduced-motion`.
- Não carregar web font antes do primeiro paint.
