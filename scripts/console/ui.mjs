// Helpers de saída do console. Zero dependências (ADR-005): só process/tty.
// Respeita NO_COLOR e saída não-interativa (pipe / CI).

const cor = process.stdout.isTTY && !process.env.NO_COLOR;
const env = (a, b) => (cor ? a : b);

export const c = {
  dim: (s) => env(`\x1b[2m${s}\x1b[0m`, s),
  bold: (s) => env(`\x1b[1m${s}\x1b[0m`, s),
  red: (s) => env(`\x1b[31m${s}\x1b[0m`, s),
  green: (s) => env(`\x1b[32m${s}\x1b[0m`, s),
  yellow: (s) => env(`\x1b[33m${s}\x1b[0m`, s),
  blue: (s) => env(`\x1b[34m${s}\x1b[0m`, s),
  cyan: (s) => env(`\x1b[36m${s}\x1b[0m`, s),
};

export const sym = {
  ok: env('\x1b[32m✓\x1b[0m', '[ok]'),
  fail: env('\x1b[31m✗\x1b[0m', '[erro]'),
  warn: env('\x1b[33m!\x1b[0m', '[aviso]'),
  info: env('\x1b[36m·\x1b[0m', '-'),
};

export const log = {
  line: (s = '') => console.log(s),
  ok: (s) => console.log(`${sym.ok} ${s}`),
  fail: (s) => console.error(`${sym.fail} ${s}`),
  warn: (s) => console.log(`${sym.warn} ${s}`),
  info: (s) => console.log(`${sym.info} ${s}`),
  head: (s) => console.log(`\n${c.bold(s)}`),
};

// Erro previsível de uso do console (mensagem limpa, sem stack).
export class ErroConsole extends Error {}
