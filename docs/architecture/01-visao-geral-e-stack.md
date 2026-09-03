# 01 — Visão geral e stack

## O que é

Um site estático de **uma página** que funciona como catálogo de vitrine para
vários nichos, servido de CDN, personalizado no cliente pela URL, com um
**console** para operar os nichos.

## O que não é

- Não é uma loja: não há carrinho, checkout, estoque ou conta. A conversão é um
  link de saída (`Produto.url`).
- Não tem backend: nenhum endpoint, nenhuma função serverless, nenhum banco.
- Não tem CMS: nichos são arquivos versionados; o console cria e valida.

## Stack e por quê

| Peça | Versão-alvo | Por quê |
|---|---|---|
| Astro | ^7.2 | `output: 'static'`; ilhas sob demanda; HTML enxuto no caminho crítico. Herdado do ARES (ADR-001). |
| Preact | ^10 | Runtime de ilha leve (~4 KB) — a grade/carrossel quando virarem interativos. |
| React | ^19 | Só entra se uma ilha específica já trouxer a dependência; declarada por pragma no topo do `.tsx`. |
| Embla Carousel | ^8.6 | Carrossel de produtos quando E2 precisar; sem peso de framework. |
| TypeScript | ^5.9 | `astro/tsconfigs/strict`. |
| Tailwind | ^4.3 | Via `@tailwindcss/vite`; utilitário pontual, sem Preflight global. |
| **Console** | — | Node nativo, **zero dependências** (ADR-005). |

## Coexistência Preact + React

Mesma convenção do ARES: sem `include`/`exclude` no `astro.config.ts`. Cada `.tsx`
de ilha declara o runtime no topo:

```ts
/** @jsxImportSource preact */   // ilha Preact
/** @jsxImportSource react */    // ilha React
```

Sem o pragma, o transform de JSX do Preact captura o arquivo mesmo ele sendo
hidratado pelo renderer do React.

## Ambiente

- Node >= 22.12 (o console usa `parseArgs` nativo).
- `ffmpeg`/`ffprobe` no PATH só para `prometeus video`.
- `PUBLIC_NICHO_PADRAO` e `PUBLIC_SITE_URL` opcionais (`.env.example`).
