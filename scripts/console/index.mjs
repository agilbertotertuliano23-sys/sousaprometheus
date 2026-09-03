// PROMETEUS console — parser de argumentos e despacho de comandos.
// Zero dependências (ADR-005). Node >= 22.12 (usa parseArgs nativo).
import { parseArgs } from 'node:util';
import { c, log, ErroConsole } from './ui.mjs';

import help from './commands/help.mjs';
import doctor from './commands/doctor.mjs';
import niche from './commands/niche.mjs';
import catalog from './commands/catalog.mjs';
import assets from './commands/assets.mjs';
import video from './commands/video.mjs';

const COMANDOS = { help, doctor, niche, catalog, assets, video };

// Aliases curtos — conveniência de quem opera muitos nichos por dia.
const ALIAS = { n: 'niche', nicho: 'niche', cat: 'catalog', 'catálogo': 'catalog', a: 'assets', v: 'video', '--help': 'help', '-h': 'help' };

export async function main(argv) {
  const bruto = argv[0];
  const nome = ALIAS[bruto] ?? bruto ?? 'help';
  const cmd = COMANDOS[nome];

  if (!cmd) {
    log.fail(`comando desconhecido: ${c.bold(bruto)}`);
    log.info(`rode ${c.cyan('prometeus help')} para a lista`);
    return 1;
  }

  // Cada comando declara seu próprio schema de flags via `cmd.options`.
  let parsed;
  try {
    parsed = parseArgs({
      args: argv.slice(1),
      options: cmd.options ?? {},
      allowPositionals: true,
      strict: true,
    });
  } catch (e) {
    log.fail(e.message);
    return 1;
  }

  try {
    const codigo = await cmd.run({
      positionals: parsed.positionals,
      flags: parsed.values,
    });
    return codigo ?? 0;
  } catch (e) {
    if (e instanceof ErroConsole) {
      log.fail(e.message);
      return 1;
    }
    throw e; // bug de verdade → deixa estourar com stack
  }
}
