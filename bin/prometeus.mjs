#!/usr/bin/env node
// PROMETEUS — ponto de entrada do console (CLI de operação dos nichos).
//
// Fino de propósito: só delega para scripts/console/index.mjs.
// Registrado como `bin` no package.json → `npx prometeus ...` e `npm run console`.
// Import relativo estático (não montar caminho absoluto à mão — no Windows o
// import() dinâmico exige file:// URL).
import { main } from '../scripts/console/index.mjs';

process.exit(await main(process.argv.slice(2)));
