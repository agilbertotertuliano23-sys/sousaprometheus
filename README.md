# PROMETEUS

Página de catálogo web **de nichos**, otimizada para tráfego de **TikTok** e
**superpersonalizada** pela URL. Sem backend, sem banco: o build gera
HTML/CSS/JS estáticos publicáveis em qualquer CDN estática (Netlify, Cloudflare
Pages, Vercel static).

Um repositório serve **muitos nichos**. O nicho ativo, o criativo de origem e a
oferta vêm da URL (`?n=`, `?c=`, `?o=`) e são aplicados no cliente — o HTML é
buildado uma vez com o nicho padrão e reescrito sem recarregar.

Arquitetura completa em [`docs/architecture/`](docs/architecture/README.md).
Produto em [`docs/README.md`](docs/README.md). Este README cobre só o essencial
para rodar.

## Requisitos

- Node.js >= 22.12
- npm
- `ffmpeg`/`ffprobe` no PATH — **só** para `prometeus video`

## Instalar

```bash
npm install
```

## O console (CLI de operação)

Tudo que se opera no dia a dia passa pelo console (`bin/prometeus.mjs`, zero
dependências). Ver [`docs/architecture/07-o-console-cli.md`](docs/architecture/07-o-console-cli.md).

```bash
npm run console -- help              # ou: npx prometeus help
npm run doctor                       # checa ambiente e árvore do projeto
npx prometeus niche new pet-shop     # scaffold de um nicho
npx prometeus niche list             # nichos registrados
npm run validate                     # gate de catálogo (roda no prebuild)
npx prometeus assets check           # peso dos assets vs orçamento (RNF-01)
npx prometeus video clipe.mp4 --sku pet-01 --niche pet-shop
```

## Desenvolvimento

```bash
npm run dev        # servidor de desenvolvimento
npm run typecheck  # astro check
npm run build      # build estático em dist/ (valida o catálogo antes)
npm run preview    # pré-visualiza o build
```

## ⚠️ Assets brutos — nunca commitar

`raw-assets/` e qualquer `.mp4` fora de `public/` estão no `.gitignore` (R-11).
Só as derivadas já processadas pelo console entram no repositório, dentro de
`public/nichos/<slug>/`.
