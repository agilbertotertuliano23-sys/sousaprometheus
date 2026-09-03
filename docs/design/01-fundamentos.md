# 01 — Fundamentos

## Cor

### Escala neutra (fixa)

| Token | Valor | Uso |
|---|---|---|
| `--c-preto` | `#0A0B0C` | fundo de página |
| `--c-carbono-900` | `#141618` | superfície de card |
| `--c-carbono-800` | `#1C1F22` | superfície elevada (hover/ativo) |
| `--c-carbono-700` | `#2A2E33` | linha, borda |
| `--c-branco-100` | `#F2F3F5` | texto primário |
| `--c-cinza-400` | `#8B9096` | texto secundário / metadado |

### Acento (variável por nicho)

- `--acento` — default `#1E6FFF`; sobrescrito em runtime por `Nicho.acento`.
- `--acento-texto` — default `#5B93FF`; tint para texto pequeno sobre fundo
  escuro quando o próprio `--acento` não atinge AA.

**Contraste (RNF-07):**

| Par | Mínimo | Nota |
|---|---|---|
| `--c-branco-100` sobre `--c-preto` | 4.5:1 | ok (~17:1) |
| `--c-cinza-400` sobre `--c-preto` | 4.5:1 | ok para texto ≥ 13px |
| texto branco sobre `--acento` | 4.5:1 | **checar por nicho** — acentos claros reprovam; nesses casos o CTA usa texto escuro |

Todo nicho novo passa por esse check antes de publicar (não há gate automático
ainda — ver R-07).

## Tipografia

| Token | px | Uso |
|---|---|---|
| `--fs-00` | 13 | rótulo técnico, metadado |
| `--fs-0` | 15 | corpo |
| `--fs-1` | 18 | nome do produto no card |
| `--fs-2` | 24 | título de seção |
| `--fs-3` | 32 | — |
| `--fs-4` | 40 | título do nicho (H1) |

`--tracking-label: 0.16em` para rótulos em caixa alta (mono).

## Espaçamento

Escala de 4px: `--sp-1` (4) … `--sp-8` (32). Raio: `--raio` (14px) para card,
`--raio-sm` (8px) para botão/mídia.

## Toque

`--toque-min: 44px` — piso para qualquer elemento interativo (RNF-06). O CTA do
card já nasce com `min-height: var(--toque-min)`.

## Layout

`--largura-pagina: 480px` — coluna de leitura. `.pagina` centraliza e aplica
padding. Grade: 1 coluna até 560px, 2 acima.

## Trilha / carrossel (ADR-008 Fase 0)

A `#tela-vitrine` é uma pilha de **blocos** ([`architecture/09`](../architecture/09-fluxo-de-telas-e-apresentacao.md)
§1). Cada bloco de produtos é uma **trilha**: `<h2>` + faixa horizontal rolável
de minis.

- **Faixa:** `display: flex; gap: var(--trilha-gap); overflow-x: auto;
  scroll-snap-type: x proximity; overscroll-behavior-x: contain`. Cada mini
  `scroll-snap-align: start; flex: 0 0 auto`.
- **`scroll-behavior: smooth`** e qualquer `transform` de foco de card ficam sob
  `@media (prefers-reduced-motion: no-preference)` (RNF-08). Sem movimento, a
  faixa continua rolável (é navegação, não decoração).
- **`overscroll-behavior-x: contain`** é obrigatório — sem ele o `scroll-snap`
  horizontal sequestra o gesto "voltar" do webview do TikTok
  ([`architecture/09`](../architecture/09-fluxo-de-telas-e-apresentacao.md) §5).
- **Carrossel com biblioteca (Embla, `^8.6`)** só quando o `scroll-snap` nativo
  não bastar, por **import dinâmico** ao entrar em viewport — nunca no caminho
  crítico (RNF-03). A decisão fica com a medição de **E6-06**.
- **Espaço entre blocos:** `margin-block: var(--bloco-espaco)`.
- **Trilha vazia:** o `<h2 id="cat-<id>">` é renderizado mesmo assim (âncora de
  navegação) + uma linha de estado vazio.

### Tokens de componente

Camada `COMPONENTE` de [`tokens.css`](tokens.css). Herdam de um semântico/
primitivo e podem ser afinados por `data-nicho` / `data-grupo` — o componente
**nunca** hard-coda cor ou espaçamento (princípio 4 do [`README`](README.md)).

| Token | Herda | Uso |
|---|---|---|
| `--bloco-espaco` | `--sp-6` | respiro vertical entre blocos |
| `--trilha-gap` | `--sp-3` | gap entre minis na faixa |
| `--card-raio` | `--raio` | forma do card/mini por nicho/bloco |
| `--cat-acento` *(Fase 1)* | `--acento` | tint de um grupo de categoria |
| `--ref-fade` *(Fase 1)* | `200ms` | cross-fade do referenciamento (0 em reduced-motion) |

> **Sync:** ao implementar (E6-05), `src/styles/tokens.css` recebe a cópia
> byte a byte desta camada nova (ADR-006 / [`architecture/06`](../architecture/06-estrutura-de-diretorios.md)).
