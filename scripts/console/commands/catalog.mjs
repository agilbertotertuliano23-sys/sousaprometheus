import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { c, log } from '../ui.mjs';
import {
  RAIZ,
  lerTodosNichos,
  assetDoNicho,
  lerVocabularioBlocos,
  ehHex,
  ehUrl,
} from '../lib.mjs';

// tipos de ItemMidia — validos dentro de `blocos:` (galeria/midia/como-usar),
// mas NAO sao tipos de bloco. Separados do vocabulario p/ o scanner nao acusar
// falso-positivo. A forma estrutural dos blocos fica com `validarNicho`.
const TIPOS_MIDIA = new Set(['imagem', 'video']);

// Gate de integridade do catálogo. Roda no prebuild (npm run validate).
// Falha o processo (exit 1) se qualquer nicho tiver erro estrutural ou
// referenciar um asset que não existe no disco.
export default {
  descricao: 'Valida os nichos: schema + assets referenciados existem',
  options: {
    niche: { type: 'string' },
    json: { type: 'boolean', default: false },
  },
  run({ flags }) {
    const nichos = lerTodosNichos({ soNicho: flags.niche });
    const relatorio = [];
    let erros = 0;
    let avisos = 0;

    for (const n of nichos) {
      const problemas = [];
      const push = (nivel, msg) => {
        problemas.push({ nivel, msg });
        if (nivel === 'erro') erros++;
        else avisos++;
      };

      if (n.slug !== n.slugArquivo) {
        push('erro', `slug "${n.slug ?? '(ausente)'}" != nome do arquivo "${n.slugArquivo}"`);
      }
      if (!n.nome) push('erro', 'campo `nome` ausente');
      if (!ehHex(n.acento)) push('erro', `\`acento\` inválido ou ausente: ${n.acento ?? '(ausente)'} — espera #RRGGBB`);
      if (n.produtos.length === 0) push('aviso', 'nenhum produto');

      // Vocabulário de blocos — fonte única (tipos-bloco.json), nunca hard-coded.
      const vocabBlocos = new Set(lerVocabularioBlocos());
      const idsCategoria = new Set(n.categoriasIds ?? []);
      const declaraCategorias = idsCategoria.size > 0;

      const skus = new Set();
      n.produtos.forEach((p, i) => {
        const rot = p.sku ? `sku "${p.sku}"` : `produto #${i + 1}`;
        if (!p.sku) push('erro', `${rot}: \`sku\` ausente`);
        else if (skus.has(p.sku)) push('erro', `${rot}: duplicado`);
        else skus.add(p.sku);

        if (!Number.isInteger(p.precoCentavos) || p.precoCentavos <= 0) {
          push('erro', `${rot}: \`precoCentavos\` deve ser inteiro > 0 (achei ${p.precoCentavos})`);
        }
        if (!ehUrl(p.url)) push('erro', `${rot}: \`url\` de saída inválida ou ausente`);

        if (!p.imagem) {
          push('erro', `${rot}: \`imagem\` ausente`);
        } else if (!existsSync(assetDoNicho(n.slugArquivo, p.imagem))) {
          push('erro', `${rot}: imagem não existe → src/assets/catalog/${n.slugArquivo}/${p.imagem}`);
        }
        if (p.video && !existsSync(assetDoNicho(n.slugArquivo, p.video))) {
          push('erro', `${rot}: video não existe → src/assets/catalog/${n.slugArquivo}/${p.video}`);
        }
        if (p.poster && !existsSync(assetDoNicho(n.slugArquivo, p.poster))) {
          push('aviso', `${rot}: poster não existe → src/assets/catalog/${n.slugArquivo}/${p.poster}`);
        }

        // ── Schema ADR-007 (doc 08 §6) ───────────────────────────────────
        // categoria referenciada existe entre as declaradas
        if (p.categoria != null) {
          if (!idsCategoria.has(p.categoria)) {
            push(
              'erro',
              `${rot}: \`categoria\` "${p.categoria}" fora dos ids declarados [${[...idsCategoria].join(', ') || '—'}]`,
            );
          }
        } else if (declaraCategorias) {
          push('aviso', `${rot}: sem \`categoria\` num nicho que declara \`categorias\``);
        }

        // prioridade presente e inteira em 0..100
        if (p.prioridade != null) {
          if (!Number.isInteger(p.prioridade) || p.prioridade < 0 || p.prioridade > 100) {
            push(
              'erro',
              `${rot}: \`prioridade\` deve ser inteiro em 0..100 (achei ${p.prioridade})`,
            );
          }
        }

        // tipo de bloco dentro do vocabulário (ItemMidia 'imagem'/'video' passam)
        for (const t of p.tiposBloco ?? []) {
          if (vocabBlocos.has(t) || TIPOS_MIDIA.has(t)) continue;
          push(
            'erro',
            `${rot}: bloco \`tipo\` "${t}" fora do vocabulário [${[...vocabBlocos].join(', ')}]`,
          );
        }

        // assets de galeria/bloco (src/avatar/poster) existem no disco
        for (const rel of p.caminhosMidia ?? []) {
          if (rel.startsWith('/')) {
            // caminho absoluto → servido de public/ (E2-04 / Tarefa 8)
            if (!existsSync(join(RAIZ, 'public', rel.replace(/^\/+/, '')))) {
              push('erro', `${rot}: asset de galeria/bloco não existe → public${rel}`);
            }
            continue;
          }
          if (!existsSync(assetDoNicho(n.slugArquivo, rel))) {
            push(
              'erro',
              `${rot}: asset de galeria/bloco não existe → src/assets/catalog/${n.slugArquivo}/${rel}`,
            );
          }
        }
      });

      relatorio.push({ slug: n.slugArquivo, produtos: n.produtos.length, problemas });
    }

    if (flags.json) {
      console.log(JSON.stringify({ ok: erros === 0, erros, avisos, nichos: relatorio }, null, 2));
      return erros === 0 ? 0 : 1;
    }

    for (const r of relatorio) {
      if (r.problemas.length === 0) {
        log.ok(`${c.cyan(r.slug)} ${c.dim(`(${r.produtos} produto(s))`)}`);
        continue;
      }
      log.head(`${r.slug} ${c.dim(`(${r.produtos} produto(s))`)}`);
      for (const p of r.problemas) {
        (p.nivel === 'erro' ? log.fail : log.warn)(p.msg);
      }
    }

    log.line();
    if (erros > 0) {
      log.fail(`${erros} erro(s), ${avisos} aviso(s) — catálogo reprovado`);
      return 1;
    }
    log.ok(`catálogo íntegro${avisos ? ` (${avisos} aviso(s))` : ''}`);
    return 0;
  },
};
