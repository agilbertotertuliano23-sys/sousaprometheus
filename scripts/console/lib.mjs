// Utilidades compartilhadas entre comandos do console.
// Zero dependências (ADR-005).
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { resolve, join, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ErroConsole } from './ui.mjs';

// lib.mjs -> scripts/console/ -> scripts/ -> raiz do projeto
export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const DIR_NICHOS = join(RAIZ, 'src/data/nichos');
export const DIR_ASSETS = join(RAIZ, 'src/assets/catalog');
export const DIR_PUBLICO = join(RAIZ, 'public/nichos');

// Orcamento de peso (RNF-01). Numeros conservadores para o webview do TikTok.
export const ORCAMENTO = {
  imagemKB: 180, // foto de produto no card (webp/avif)
  posterKB: 60, //  1o frame do video
  videoKB: 400, //  clipe vertical por produto
  paginaKB: 1200, // soma de tudo que a pagina carrega no 1o paint
};

export function listarArquivosNicho() {
  if (!existsSync(DIR_NICHOS)) return [];
  return readdirSync(DIR_NICHOS)
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts'))
    .map((f) => join(DIR_NICHOS, f));
}

// Extracao de um valor string: acha "nome:" e le a proxima string entre
// aspas simples, duplas ou crase. Sem regex dinamica (heredoc/escape-safe).
function valorString(txt, nome) {
  const marca = nome + ':';
  const i = txt.indexOf(marca);
  if (i === -1) return null;
  const resto = txt.slice(i + marca.length).replace(/^\s+/, '');
  const aspa = resto[0];
  if (aspa !== "'" && aspa !== '"' && aspa !== '`') return null;
  const fim = resto.indexOf(aspa, 1);
  return fim === -1 ? null : resto.slice(1, fim);
}

function valorNumero(txt, nome) {
  const marca = nome + ':';
  const i = txt.indexOf(marca);
  if (i === -1) return null;
  // aceita decimal p/ o gate flagrar `prioridade` nao-inteira (ver catalog.mjs).
  const m = txt.slice(i + marca.length, i + marca.length + 40).match(/^\s*(-?\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

// Fatia o array literal que segue `nome:` casando colchetes (heuristica —
// contagem simples de `[`/`]`, sem entender strings; ver R-04 / ADR-007 §6).
// Devolve o texto do array (com os colchetes) ou null se `nome:` nao aparece.
function regiaoArray(txt, nome) {
  const i = txt.indexOf(nome + ':');
  if (i === -1) return null;
  const abre = txt.indexOf('[', i + nome.length + 1);
  if (abre === -1) return null;
  let profundidade = 0;
  for (let j = abre; j < txt.length; j++) {
    const ch = txt[j];
    if (ch === '[') profundidade++;
    else if (ch === ']' && --profundidade === 0) return txt.slice(abre, j + 1);
  }
  return txt.slice(abre); // nao fechou — devolve o resto (permissivo)
}

// Todas as ocorrencias de `nome:` seguidas de string entre aspas ('/"/`).
function todasStrings(txt, nome) {
  const marca = nome + ':';
  const out = [];
  let from = 0;
  for (;;) {
    const i = txt.indexOf(marca, from);
    if (i === -1) break;
    from = i + marca.length;
    const resto = txt.slice(from).replace(/^\s+/, '');
    const aspa = resto[0];
    if (aspa === "'" || aspa === '"' || aspa === '`') {
      const fim = resto.indexOf(aspa, 1);
      if (fim !== -1) out.push(resto.slice(1, fim));
    }
  }
  return out;
}

// Vocabulario de tipos de bloco — fonte unica (RNF-14), lida do JSON, nunca
// hard-coded aqui. Consumida pelo `catalog validate`.
export function lerVocabularioBlocos() {
  return JSON.parse(
    readFileSync(join(RAIZ, 'src/lib/apresentacao/tipos-bloco.json'), 'utf8'),
  );
}

// Leitura estrutural (nao e um parser de TS - e um gate, ADR-005).
// Varre o texto do modulo de nicho. Endurece com o tempo.
export function lerNicho(arquivo) {
  const txt = readFileSync(arquivo, 'utf8');
  const slugArquivo = basename(arquivo, '.ts');

  const slug = valorString(txt, 'slug');
  const nome = valorString(txt, 'nome');
  const acento = valorString(txt, 'acento');

  // Regiao `categorias:` de nivel do nicho -> ids declarados. Ausente no schema
  // antigo (fica []), o que sinaliza "nicho sem categorias" ao catalog.mjs.
  const regCategorias = regiaoArray(txt, 'categorias');
  const categoriasIds = regCategorias ? todasStrings(regCategorias, 'id') : [];

  // Cada produto e um objeto que contem "sku:". Fatiamos o texto por "sku:".
  // O split ja delimita ate o proximo `sku:`; cap generoso so por seguranca.
  const produtos = txt
    .split(/\bsku\s*:/)
    .slice(1)
    .map((parte) => {
      const trecho = 'sku:' + parte.slice(0, 8000);

      // Escalares do produto sao lidos so do prefixo ANTES de `galeria:`/`blocos:`
      // para nao capturar `poster:`/`src:` de dentro dessas regioes.
      const marcasRegiao = ['galeria:', 'blocos:']
        .map((m) => trecho.indexOf(m))
        .filter((k) => k !== -1);
      const corte = marcasRegiao.length ? Math.min(...marcasRegiao) : trecho.length;
      const cabeca = trecho.slice(0, corte);

      const regBlocos = regiaoArray(trecho, 'blocos');
      const regGaleria = regiaoArray(trecho, 'galeria');

      // `tipo:` dentro de `blocos:` — mistura tipo de bloco e tipo de ItemMidia
      // ('imagem'/'video'); o catalog.mjs separa. Permissivo de proposito.
      const tiposBloco = regBlocos ? todasStrings(regBlocos, 'tipo') : [];

      // candidatos a asset: src/avatar/poster de blocos + src/poster de galeria.
      const caminhosMidia = [
        ...(regBlocos
          ? [
              ...todasStrings(regBlocos, 'src'),
              ...todasStrings(regBlocos, 'avatar'),
              ...todasStrings(regBlocos, 'poster'),
            ]
          : []),
        ...(regGaleria
          ? [...todasStrings(regGaleria, 'src'), ...todasStrings(regGaleria, 'poster')]
          : []),
      ];

      return {
        sku: valorString(cabeca, 'sku'),
        precoCentavos: valorNumero(cabeca, 'precoCentavos'),
        imagem: valorString(cabeca, 'imagem'),
        video: valorString(cabeca, 'video'),
        poster: valorString(cabeca, 'poster'),
        url: valorString(cabeca, 'url'),
        categoria: valorString(cabeca, 'categoria'),
        prioridade: valorNumero(cabeca, 'prioridade'),
        tiposBloco,
        caminhosMidia,
      };
    });

  return { arquivo, slugArquivo, slug, nome, acento, categoriasIds, produtos };
}

export function lerTodosNichos({ soNicho } = {}) {
  let arquivos = listarArquivosNicho();
  if (soNicho) {
    arquivos = arquivos.filter((f) => basename(f, '.ts') === soNicho);
    if (arquivos.length === 0) {
      throw new ErroConsole(`nicho nao encontrado: ${soNicho} (procurei em src/data/nichos/)`);
    }
  }
  return arquivos.map(lerNicho);
}

export function tamanhoKB(caminho) {
  try {
    return Math.round(statSync(caminho).size / 1024);
  } catch {
    return null;
  }
}

export function assetDoNicho(slug, rel) {
  return join(DIR_ASSETS, slug, rel);
}

export const ehHex = (s) => typeof s === 'string' && /^#[0-9a-fA-F]{6}$/.test(s);
export const ehUrl = (s) => typeof s === 'string' && /^https?:\/\/.+/.test(s);
