/**
 * Prepara as camadas da Hero (cenário / modelo / letreiro) a partir da pasta de
 * origem (Downloads/flay/hero) → src/assets/hero/cenas/<secao>/*.webp.
 *
 * Uso:  node scripts/montar-cenas-hero.mjs [pastaOrigem]
 *
 * NÃO recompõe nada: cada camada entra como veio, só convertida pra WebP
 * (cenário 1920 de largura; modelo e letreiro no tamanho original, com alfa).
 * O empilhamento e a posição são feitos no navegador (Hero/HeroCamadas.astro).
 * Grava `cenas.json` com as dimensões de cada letreiro (os recortados —
 * Old Money e Minimal — não vêm em quadro cheio e são posicionados por CSS).
 */
import sharp from 'sharp';
import { readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

sharp.concurrency(1);
sharp.cache(false);

const ORIGEM = process.argv[2] ?? 'C:/Users/agilb/Downloads/flay/hero';
const SAIDA = 'src/assets/hero/cenas';
const FUNDO_W = 1920;

const ls = (d) => readdirSync(join(ORIGEM, d)).sort().map((f) => join(ORIGEM, d, f));
const cenarios = ls('cenario');
const letreiros = ls('letreiro');
const modelos = ls('modelos');

// [cenário, modelo, letreiro] — índices 0-based na ordem alfabética de cada subpasta.
const SECOES = {
  streetwear: [1, 3, 1],
  gym: [3, 2, 0],
  y2k: [4, 1, 4],
  'old-money': [2, 0, 2],
  minimal: [0, 4, 3],
};

mkdirSync(SAIDA, { recursive: true });
const relatorio = {};

for (const [nome, [c, m, l]] of Object.entries(SECOES)) {
  const dir = join(SAIDA, nome);
  mkdirSync(dir, { recursive: true });
  const cm = await sharp(cenarios[c]).metadata();
  const lm = await sharp(letreiros[l]).metadata();
  const mm = await sharp(modelos[m]).metadata();

  await sharp(cenarios[c]).resize({ width: FUNDO_W }).webp({ quality: 76 }).toFile(join(dir, 'fundo.webp'));
  await sharp(modelos[m]).webp({ quality: 84, alphaQuality: 92 }).toFile(join(dir, 'modelo.webp'));
  await sharp(letreiros[l]).webp({ quality: 88, alphaQuality: 95 }).toFile(join(dir, 'letreiro.webp'));

  relatorio[nome] = {
    fundo: { w: cm.width, h: cm.height },
    modelo: { w: mm.width, h: mm.height },
    letreiro: { w: lm.width, h: lm.height, quadroCheio: lm.width === mm.width && lm.height === mm.height },
  };
  console.log(nome.padEnd(11), JSON.stringify(relatorio[nome]));
}

writeFileSync(join(SAIDA, 'cenas.json'), JSON.stringify(relatorio, null, 2));
