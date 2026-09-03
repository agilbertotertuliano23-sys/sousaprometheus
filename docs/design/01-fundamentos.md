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
