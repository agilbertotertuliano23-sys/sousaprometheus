# 05 — Pipeline de assets

Mesma filosofia do ARES: material bruto **nunca** entra no git; só as derivadas
já curadas e comprimidas.

```
raw-assets/<slug>/            ← entrada de trabalho (NO .gitignore, nunca deployada)
   video.mp4, fotos cruas, referências

        │  curadoria manual + console
        ▼
src/assets/catalog/<slug>/    ← imagens do card (webp/avif), resolvidas por import.meta.glob
public/nichos/<slug>/         ← vídeos .mp4 já processados (servidos como estão)
```

## Imagens

- Curadas à mão para 9:16, webp ou avif, ≤ 180 KB.
- Ficam em `src/assets/catalog/<slug>/` e são referenciadas por caminho relativo
  no módulo do nicho. O Vite gera a URL com hash no build.

## Vídeos

- **Sempre** pelo console:
  `prometeus video raw-assets/<slug>/prod01.mp4 --sku <slug>-01 --niche <slug>`
- O comando: remove áudio, faz `crop` central para 720×1280, H.264 High,
  `+faststart`, `yuv420p`; testa CRF 26 → 30 → 34 → 38 e para no primeiro que
  couber em 400 KB. Se nem CRF 38 couber, avisa (encurtar o clipe).
- Saída: `public/nichos/<slug>/<sku>.mp4`. No módulo do nicho:
  `video: '../../../public/nichos/<slug>/<sku>.mp4'`? **Não** — vídeos são
  servidos de `public/` por URL absoluta: `video: '/nichos/<slug>/<sku>.mp4'`.
  (O `carregar.ts` só resolve imagens de `src/assets/`; para `public/` o caminho
  é a própria URL.)

> Nota de implementação: alinhar `urlAsset` para deixar passar caminhos que já
> começam com `/` (servidos de `public/`) — story de E2.

## `.gitignore` (R-11)

- `raw-assets/` inteira.
- `*.mp4` em qualquer lugar, **exceto** `public/**/*.mp4`.
- `*.log`, `.env*` (menos `.env.example`), `dist/`, `.astro/`, `node_modules/`.

Um `git add .` distraído em `raw-assets/` é praticamente irreversível no
histórico. As regras existem desde o primeiro commit.
