# 07 — O console (CLI)

`prometeus` é como o projeto é operado: criar nichos, validar o catálogo,
conferir peso, processar vídeo, checar o ambiente. Substitui os scripts soltos do
ARES (`validate-catalog.ts`, `process-video.sh`, `comprime-glb.mjs`) por uma
interface única.

## Princípios

- **Zero dependências** (ADR-005 / RNF-12) — só APIs nativas do Node >= 22.12:
  `node:util` (`parseArgs`), `node:fs`, `node:path`, `node:child_process`,
  `node:url`. Nada de instalar, nada de `node_modules` para operar.
- **Exit codes honestos:** `0` sucesso, `1` falha. `catalog validate` no
  `prebuild` faz `npm run build` abortar (RNF-10).
- **Saída legível em pipe e CI:** cores só quando `stdout.isTTY` e sem `NO_COLOR`.
- **Erro previsível ≠ bug:** mensagem limpa via `throw new ErroConsole(...)`;
  qualquer outra exceção estoura com stack (é bug do console).

## Arquitetura

```
bin/prometeus.mjs
   └─ import estático ../scripts/console/index.mjs   (import relativo — Windows-safe)
        ├─ ALIAS  { n: 'niche', cat: 'catalog', a: 'assets', v: 'video', -h/--help: 'help' }
        ├─ COMANDOS { help, doctor, niche, catalog, assets, video }
        ├─ parseArgs(args, cmd.options, { allowPositionals: true, strict: true })
        └─ cmd.run({ positionals, flags }) -> número (exit code)
   ui.mjs   → c.*, sym.*, log.*, ErroConsole
   lib.mjs  → RAIZ, DIR_NICHOS/ASSETS/PUBLICO, ORCAMENTO,
              listarArquivosNicho, lerNicho, lerTodosNichos, tamanhoKB,
              assetDoNicho, ehHex, ehUrl
```

`lerNicho` é um **scanner de texto** do módulo `.ts` — acha `slug:`/`nome:`/
`acento:` e fatia por `sku:` para extrair cada produto. Não é um parser de TS
(ADR-005). Cobre o schema do template e endurece conforme o schema cresce.

## Comandos

### `prometeus help`
Lista de uso. Também `-h`, `--help`, sem argumento.

### `prometeus doctor`
Checa: versão do Node, `ffmpeg` no PATH, existência de `src/`, `src/data/`,
`src/data/nichos/`, `docs/`, `scripts/console/`, contagem de nichos, `node_modules/`.
Exit 1 se algo bloqueante faltar.

### `prometeus niche new <slug>` · `prometeus niche list`
`new` valida o slug (`[a-z][a-z0-9-]+`), cria `src/data/nichos/<slug>.ts` do
template e `src/assets/catalog/<slug>/.gitkeep`. Não mexe no índice — lembra você
de registrar em `src/data/nichos.ts`.
`list` mostra slug, contagem de produtos e acento de cada nicho.

### `prometeus catalog validate [--niche <slug>] [--json]`
Gate de integridade (ver [02](02-modelo-de-dados-e-nichos.md#validação-gate)).
Exit 1 em erro. `--json` para CI. Chamado por `npm run validate` no `prebuild`.

### `prometeus assets check [--niche <slug>] [--strict]`
Peso de `imagem`/`poster`/`video` de cada produto vs `ORCAMENTO`. Raio-x: por
padrão exit 0 mesmo com estouros; `--strict` → exit 1.

### `prometeus video <entrada.mp4> [--sku <sku> --niche <slug>] [--out <arquivo>]`
ffmpeg wrapper: 9:16 mudo, H.264 High, `+faststart`, CRF 26→30→34→38 até caber em
`ORCAMENTO.videoKB`. Com `--sku`+`--niche`, grava em
`public/nichos/<slug>/<sku>.mp4`. Exige `ffmpeg` no PATH.

## Como estender

1. `commands/<nome>.mjs` exportando `{ descricao, options?, run({positionals,flags}) }`.
2. Registrar em `index.mjs` (`COMANDOS`, e `ALIAS` se útil).
3. Documentar em `commands/help.mjs` e aqui.
4. `run` devolve o exit code. Erro de uso → `throw new ErroConsole('...')`.
