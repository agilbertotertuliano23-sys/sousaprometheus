# 02 — Modelo de dados e nichos

## Fonte da verdade

`src/data/tipos.ts` define `Produto`, `Nicho` e `ContextoPersonalizacao`. Todo o
resto (console, componentes, personalização) importa desses tipos ou os espelha.
Detalhe campo a campo em [`../prd/03-nichos-e-catalogo.md`](../prd/03-nichos-e-catalogo.md).

## O índice

`src/data/nichos.ts`:

```ts
import { exemplo } from './nichos/exemplo';

export const NICHOS: Record<string, Nicho> = { exemplo /*, pet, skincare, ... */ };
export const SLUGS = Object.keys(NICHOS);
export const NICHO_PADRAO = import.meta.env.PUBLIC_NICHO_PADRAO || 'exemplo';
export function resolverNicho(slug): Nicho { /* slug válido ? NICHOS[slug] : padrão */ }
```

- O registro é **manual e proposital** — `niche new` cria o arquivo, mas você
  revisa e adiciona a linha no índice antes de o nicho existir para o app.
- `NICHOS` é um objeto estático: o Astro faz tree-shaking do que a página não
  usa, mas todos os módulos de nicho entram no grafo do build. Ver R-06 se a
  contagem de nichos crescer muito (migrar para carga por rota `/n/<slug>`).

## Resolução de assets

Caminhos em `Produto.imagem`/`video`/`poster` são **relativos** a
`src/assets/catalog/<slug>/`. `src/lib/catalogo/carregar.ts` resolve para a URL
final com hash:

```ts
const MODULOS = import.meta.glob('/src/assets/catalog/**/*', { eager: true, import: 'default' });
export function urlAsset(slug, rel) { return MODULOS[`/src/assets/catalog/${slug}/${rel}`] ?? ''; }
```

Mesmo padrão do ARES (`src/lib/imagens/catalogo.ts`). Em `DEV`, um asset ausente
loga um `warn`; no build, o gate do console já barrou antes (RF-08.3).

## Validação (gate)

`prometeus catalog validate` (→ `npm run validate` → `prebuild`):

1. `slug` do objeto == nome do arquivo.
2. `nome` e `acento` (#RRGGBB) presentes.
3. Por produto: `sku` único; `precoCentavos` inteiro > 0; `url` `https?://`;
   `imagem` existe no disco; `video`/`poster`, se declarados, existem.
4. Exit 1 em qualquer erro → `npm run build` aborta (RNF-10).

A leitura é um **scanner de texto**, não um parser de TS (ADR-005, R-04). Cobre o
schema do template; `astro check` e o próprio build pegam erros de tipo.
