import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { c, log } from '../ui.mjs';
import { RAIZ, listarArquivosNicho } from '../lib.mjs';

function versaoFfmpeg() {
  try {
    const out = execFileSync('ffmpeg', ['-version'], { encoding: 'utf8' });
    return out.split('\n')[0].trim();
  } catch {
    return null;
  }
}

export default {
  descricao: 'Checa o ambiente e a árvore do projeto',
  run() {
    let falhas = 0;

    const [maj, min] = process.versions.node.split('.').map(Number);
    const nodeOk = maj > 22 || (maj === 22 && min >= 12);
    (nodeOk ? log.ok : (s) => { falhas++; log.fail(s); })(
      `Node ${process.versions.node} ${nodeOk ? '' : c.dim('(precisa >= 22.12)')}`
    );

    const ff = versaoFfmpeg();
    if (ff) log.ok(ff);
    else log.warn(`ffmpeg não encontrado no PATH — ${c.dim('necessário só para o comando `video`')}`);

    for (const dir of ['src', 'src/data', 'src/data/nichos', 'docs', 'scripts/console']) {
      const existe = existsSync(join(RAIZ, dir));
      (existe ? log.ok : (s) => { falhas++; log.fail(s); })(`${dir}/ ${existe ? '' : c.dim('faltando')}`);
    }

    const n = listarArquivosNicho().length;
    (n > 0 ? log.ok : log.warn)(
      `${n} nicho(s) em src/data/nichos/ ${n === 0 ? c.dim('— rode `prometeus niche new <slug>`') : ''}`
    );

    const temNodeModules = existsSync(join(RAIZ, 'node_modules'));
    (temNodeModules ? log.ok : log.warn)(
      `node_modules/ ${temNodeModules ? 'presente' : c.dim('ausente — rode `npm install` antes de `npm run dev`')}`
    );

    log.line();
    if (falhas > 0) {
      log.fail(`${falhas} problema(s) bloqueante(s)`);
      return 1;
    }
    log.ok('ambiente pronto');
    return 0;
  },
};
