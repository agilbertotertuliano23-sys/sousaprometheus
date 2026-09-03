import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { c, log, ErroConsole } from '../ui.mjs';
import { DIR_NICHOS, DIR_ASSETS, lerTodosNichos } from '../lib.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const TEMPLATE = join(AQUI, '../templates/niche.ts.tmpl');

const SLUG_OK = /^[a-z][a-z0-9-]{1,38}[a-z0-9]$/;

function novo(slug) {
  if (!slug) throw new ErroConsole('uso: prometeus niche new <slug>');
  if (!SLUG_OK.test(slug)) {
    throw new ErroConsole(`slug inválido: "${slug}" — use minúsculas, dígitos e hífen (ex.: pet-shop, skincare-k)`);
  }
  const destino = join(DIR_NICHOS, `${slug}.ts`);
  if (existsSync(destino)) throw new ErroConsole(`já existe: src/data/nichos/${slug}.ts`);

  const tmpl = readFileSync(TEMPLATE, 'utf8');
  const conteudo = tmpl.replaceAll('__SLUG__', slug).replaceAll('__NOME__', slug.replace(/-/g, ' '));
  mkdirSync(DIR_NICHOS, { recursive: true });
  writeFileSync(destino, conteudo);

  const dirAssets = join(DIR_ASSETS, slug);
  mkdirSync(dirAssets, { recursive: true });
  writeFileSync(join(dirAssets, '.gitkeep'), '');

  log.ok(`nicho criado: ${c.bold(`src/data/nichos/${slug}.ts`)}`);
  log.info(`assets em: src/assets/catalog/${slug}/`);
  log.info(`registre no índice: adicione "${slug}" em ${c.cyan('src/data/nichos.ts')}`);
  log.info(`depois: ${c.cyan(`prometeus catalog validate --niche ${slug}`)}`);
  return 0;
}

function lista() {
  const nichos = lerTodosNichos();
  if (nichos.length === 0) {
    log.warn('nenhum nicho ainda — rode `prometeus niche new <slug>`');
    return 0;
  }
  log.head(`${nichos.length} nicho(s)`);
  for (const n of nichos) {
    const nProd = n.produtos.length;
    log.line(`  ${c.cyan(n.slugArquivo.padEnd(18))} ${c.dim(`${nProd} produto(s)`)}  ${n.acento ?? ''}`);
  }
  return 0;
}

export default {
  descricao: 'Scaffold e listagem de nichos',
  options: {},
  run({ positionals }) {
    const [sub, arg] = positionals;
    if (sub === 'new') return novo(arg);
    if (sub === 'list' || sub === undefined) return lista();
    throw new ErroConsole(`subcomando desconhecido: niche ${sub} (use: new | list)`);
  },
};
