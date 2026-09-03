# 03 — Nichos e Catálogo

## O que é um nicho

Um **nicho** é uma vitrine completa configurada por dados: um tema (pet, skincare,
cozinha, home office…), um título e subtítulo que vendem a promessa daquele tema,
uma cor de acento, e uma lista curta de produtos, cada um com seu link de saída.

Um nicho **não** é um fork do código. É um arquivo:

```
src/data/nichos/<slug>.ts   →  export const <slug>: Nicho = { ... }
src/assets/catalog/<slug>/  →  imagens/vídeos referenciados por caminho relativo
```

E uma linha no índice `src/data/nichos.ts`.

## Schema

Ver `src/data/tipos.ts` para a fonte da verdade. Resumo:

### `Nicho`

| Campo | Tipo | Obrigatório | Nota |
|---|---|---|---|
| `slug` | string | sim | == nome do arquivo; `[a-z][a-z0-9-]+` |
| `nome` | string | sim | rótulo curto (aparece em `niche list`, OG) |
| `titulo` | string | sim | H1 da página |
| `subtitulo` | string | sim | uma linha de reforço |
| `acento` | string | sim | `#RRGGBB` — vira `--acento` em runtime |
| `cta` | string | sim | rótulo do botão de saída dos cards |
| `produtos` | `Produto[]` | sim | 2 a 8 |
| `og` | `{ titulo?, descricao?, imagem? }` | não | metadados de compartilhamento |

### `Produto`

| Campo | Tipo | Obrigatório | Nota |
|---|---|---|---|
| `sku` | string | sim | único no nicho; convenção `<slug>-NN` |
| `nome` | string | sim | |
| `descricaoCurta` | string | sim | 1 frase |
| `precoCentavos` | number | sim | inteiro > 0 (ex.: `9990` = R$ 99,90) |
| `precoDeCentavos` | number | não | > `precoCentavos` para virar tarja de desconto |
| `imagem` | string | sim | relativo a `src/assets/catalog/<slug>/` |
| `video` | string | não | clipe 9:16; substitui a imagem no card |
| `poster` | string | não | 1º frame do vídeo |
| `url` | string | sim | link de saída (`https?://`) |
| `tags` | string[] | não | uso futuro (filtro) |
| `destaque` | boolean | não | borda no acento |

## Ciclo de vida de um nicho

```
1. prometeus niche new <slug>          # cria o módulo + pasta de assets
2. editar src/data/nichos/<slug>.ts    # título, acento, produtos, links
3. curar assets → src/assets/catalog/<slug>/   (webp/avif; vídeo via `prometeus video`)
4. registrar "<slug>" em src/data/nichos.ts
5. prometeus catalog validate --niche <slug>   # tem que passar
6. prometeus assets check --niche <slug>       # peso dentro do orçamento
7. npm run build && deploy
8. divulgar links: https://site/?n=<slug>&c=<criativo>&o=<oferta>
```

## Convenções de asset

- **Imagem do card:** 9:16 (ex.: 720×1280), webp ou avif, ≤ 180 KB.
- **Vídeo do card:** 9:16, H.264, mudo, `+faststart`, ≤ 400 KB, 4–8 s em loop.
  Gerar sempre pelo console: `prometeus video entrada.mp4 --sku <sku> --niche <slug>`.
- **Poster:** 1º frame do vídeo, webp, ≤ 60 KB.
- Um subdiretório por produto dentro do nicho é a convenção do template
  (`01/card.webp`, `01/clipe.mp4`), mas o schema aceita qualquer caminho relativo.

## Nicho de exemplo

`src/data/nichos/exemplo.ts` — 3 produtos, imagens placeholder SVG, links
fictícios. Serve de referência de schema e faz o `npm run dev` renderizar algo.
Não publicar.
