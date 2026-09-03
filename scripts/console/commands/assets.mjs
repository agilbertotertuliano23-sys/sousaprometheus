import { c, log } from '../ui.mjs';
import { lerTodosNichos, assetDoNicho, tamanhoKB, ORCAMENTO } from '../lib.mjs';

// Confere o peso dos assets contra o orçamento (RNF-01). NÃO falha o build por
// padrão — é um raio-x. O que falha o build é o `catalog validate`.
export default {
  descricao: 'Confere o peso dos assets contra o orçamento (RNF-01)',
  options: {
    niche: { type: 'string' },
    strict: { type: 'boolean', default: false },
  },
  run({ flags }) {
    const nichos = lerTodosNichos({ soNicho: flags.niche });
    let estouros = 0;

    for (const n of nichos) {
      log.head(`${n.slugArquivo} ${c.dim(`(${n.produtos.length} produto(s))`)}`);
      let somaKB = 0;

      for (const p of n.produtos) {
        for (const [campo, tipo] of [['imagem', 'imagemKB'], ['poster', 'posterKB'], ['video', 'videoKB']]) {
          const rel = p[campo];
          if (!rel) continue;
          const kb = tamanhoKB(assetDoNicho(n.slugArquivo, rel));
          if (kb == null) {
            log.warn(`${p.sku ?? '?'} · ${campo}: arquivo ausente (${rel})`);
            continue;
          }
          somaKB += kb;
          const lim = ORCAMENTO[tipo];
          if (kb > lim) {
            estouros++;
            log.fail(`${p.sku ?? '?'} · ${campo}: ${kb} KB ${c.dim(`> ${lim} KB`)} (${rel})`);
          } else {
            log.ok(`${p.sku ?? '?'} · ${campo}: ${kb} KB ${c.dim(`/ ${lim} KB`)}`);
          }
        }
      }

      const media = n.produtos.length ? Math.round(somaKB / n.produtos.length) : 0;
      log.info(`total do nicho: ${somaKB} KB · média por produto: ${media} KB`);
    }

    log.line();
    if (estouros > 0) {
      log.warn(`${estouros} asset(s) acima do orçamento`);
      return flags.strict ? 1 : 0;
    }
    log.ok('todos os assets dentro do orçamento');
    return 0;
  },
};
