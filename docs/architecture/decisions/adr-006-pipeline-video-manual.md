# ADR-006 — Pipeline de vídeo é passo manual, não roda no build

**Status:** aceito · **Data:** 2026-09-02 · **Herdado de:** ARES ADR-005

## Contexto

Os vídeos verticais dos cards são curados uma vez por produto e não mudam. Rodar
ffmpeg a cada `npm run build` seria lento, exigiria ffmpeg no CI e reprocessaria
o que não mudou.

## Decisão

`prometeus video <entrada>` é executado **manualmente** na curadoria. A saída
(`public/nichos/<slug>/<sku>.mp4`) é commitada. O build só copia `public/`.
`prometeus assets check` confere o peso depois; não transcodifica.

## Consequências

- **+** Build rápido e sem dependência de ffmpeg.
- **+** O `.mp4` versionado é exatamente o que vai pro ar.
- **−** Esquecer de rodar o comando = vídeo fora do orçamento chega ao deploy.
  Mitigado por `assets check` antes de publicar (e por `--strict` em CI).
- **−** `*.mp4` precisa da exceção no `.gitignore` (`!public/**/*.mp4`).
