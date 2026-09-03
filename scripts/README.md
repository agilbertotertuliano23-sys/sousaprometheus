# scripts/

## `console/` — o CLI do PROMETEUS

Ponto de entrada: `bin/prometeus.mjs` (registrado como `bin` no `package.json`).
Rode via `npx prometeus <cmd>` ou `npm run console -- <cmd>`.

- **Zero dependências** (ADR-005) — só APIs nativas do Node >= 22.12
  (`node:util` `parseArgs`, `node:fs`, `node:child_process`). Nada de instalar.
- `index.mjs` — parser de argumentos e despacho.
- `ui.mjs` — helpers de saída (cores respeitam `NO_COLOR` e pipe).
- `lib.mjs` — leitura dos nichos, orçamento de peso, resolução de caminhos.
- `commands/` — um arquivo por comando (`help`, `doctor`, `niche`, `catalog`,
  `assets`, `video`). Cada um exporta `{ descricao, options?, run() }`.
- `templates/niche.ts.tmpl` — esqueleto de nicho novo (`niche new`).

### Adicionar um comando

1. Crie `commands/meu-comando.mjs` exportando `{ descricao, options, run }`.
2. Registre em `index.mjs` (`COMANDOS`) e, se fizer sentido, um alias em `ALIAS`.
3. Documente a linha de uso em `commands/help.mjs` e em
   `docs/architecture/07-o-console-cli.md`.

`run({ positionals, flags })` deve devolver o código de saída (`0` ok,
`1` falha). Erros previsíveis: lance `new ErroConsole('mensagem limpa')`.
