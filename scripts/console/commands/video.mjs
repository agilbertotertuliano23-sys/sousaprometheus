import { existsSync, mkdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { c, log, ErroConsole } from '../ui.mjs';
import { RAIZ, DIR_PUBLICO, ORCAMENTO } from '../lib.mjs';

function temFfmpeg() {
  try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true; }
  catch { return false; }
}

// Curadoria de vídeo — passo MANUAL (ADR-006), não roda a cada build.
// Alvo: clipe vertical 9:16, sem áudio, H.264 High, faststart, <= orçamento.
// O CRF sobe em degraus até caber no orçamento de peso.
export default {
  descricao: 'Transcodifica um .mp4 para 9:16 mudo, web-safe, dentro do orçamento',
  options: {
    out: { type: 'string' },
    sku: { type: 'string' },
    niche: { type: 'string' },
  },
  run({ positionals, flags }) {
    const entrada = positionals[0];
    if (!entrada) throw new ErroConsole('uso: prometeus video <entrada.mp4> [--sku <sku> --niche <slug>] [--out <arquivo>]');
    const src = resolve(entrada);
    if (!existsSync(src)) throw new ErroConsole(`entrada não encontrada: ${src}`);
    if (!temFfmpeg()) throw new ErroConsole('ffmpeg não está no PATH — instale e tente de novo (`prometeus doctor` confirma)');

    let destino;
    if (flags.sku) {
      if (!flags.niche) throw new ErroConsole('--sku exige --niche <slug>');
      const dir = join(DIR_PUBLICO, flags.niche);
      mkdirSync(dir, { recursive: true });
      destino = join(dir, `${flags.sku}.mp4`);
    } else if (flags.out) {
      destino = resolve(flags.out);
    } else {
      const b = basename(src, extname(src));
      destino = join(dirname(src), `${b}-web.mp4`);
    }

    const escala =
      "scale='if(gt(a,9/16),-2,720)':'if(gt(a,9/16),1280,-2)',crop=720:1280,setsar=1";

    for (const crf of [26, 30, 34, 38]) {
      execFileSync('ffmpeg', [
        '-y', '-i', src,
        '-an',
        '-vf', escala,
        '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow',
        '-crf', String(crf),
        '-movflags', '+faststart',
        '-pix_fmt', 'yuv420p',
        destino,
      ], { stdio: 'ignore' });

      const kb = Math.round(statSync(destino).size / 1024);
      if (kb <= ORCAMENTO.videoKB) {
        log.ok(`${c.bold(destino.replace(RAIZ + '/', ''))} — ${kb} KB (crf ${crf})`);
        return 0;
      }
      log.info(`crf ${crf} → ${kb} KB, ainda acima de ${ORCAMENTO.videoKB} KB; subindo compressão`);
    }

    const kb = Math.round(statSync(destino).size / 1024);
    log.warn(`não coube no orçamento nem com crf 38 (${kb} KB) — encurte o clipe ou reduza o movimento`);
    return 1;
  },
};
