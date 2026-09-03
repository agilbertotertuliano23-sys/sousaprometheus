import { c, log } from '../ui.mjs';

export default {
  descricao: 'Mostra esta ajuda',
  run() {
    log.line(`
${c.bold('PROMETEUS console')} — operação dos nichos

  ${c.cyan('prometeus')} ${c.dim('<comando> [opções]')}

${c.bold('Comandos')}
  ${c.cyan('niche new')} ${c.dim('<slug>')}      scaffold de um nicho novo em src/data/nichos/<slug>.ts
  ${c.cyan('niche list')}            lista os nichos registrados e a contagem de produtos
  ${c.cyan('catalog validate')}      valida todos os nichos (schema + assets referenciados existem)
       ${c.dim('--niche <slug>')}    valida só um nicho
       ${c.dim('--json')}            saída em JSON (para CI)
  ${c.cyan('assets check')}          confere o peso dos assets contra o orçamento (RNF-01)
       ${c.dim('--niche <slug>')}
  ${c.cyan('video')} ${c.dim('<entrada.mp4>')}     transcodifica para 9:16 mudo, H.264, faststart, <= orçamento
       ${c.dim('--out <arquivo>')}   destino (padrão: ao lado da entrada, sufixo -web)
       ${c.dim('--sku <sku>')}       grava direto em public/nichos/<nicho>/<sku>.mp4
  ${c.cyan('doctor')}                checa o ambiente (Node, ffmpeg, árvore do projeto)
  ${c.cyan('help')}                  esta ajuda

${c.bold('Atalhos')}  n=niche  cat=catalog  a=assets  v=video

${c.dim('Docs: docs/architecture/07-o-console-cli.md')}
`);
    return 0;
  },
};
