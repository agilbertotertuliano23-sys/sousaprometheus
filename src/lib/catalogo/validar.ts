/**
 * PROMETEUS — backstop estrutural de tipo do catálogo (ADR-007 / doc 08 §6).
 *
 * `validarNicho` é PURA: sem `node:*`, sem `fs`, sem DOM, sem dependências.
 * Devolve mensagens legíveis em pt-BR (`[]` = íntegro). NUNCA lança.
 *
 * A existência de assets no disco é responsabilidade do `catalog validate`
 * (scanner de texto do console) — aqui só se valida a FORMA dos dados.
 *
 * Consumidores:
 *  - `src/data/nichos.ts` roda isto em DEV (`import.meta.env.DEV`) como backstop;
 *  - o QA transforma os casos em asserts.
 */
import type {
  Nicho,
  Produto,
  ItemMidia,
  BlocoApresentacao,
  ParSpec,
} from '../../data/tipos';
import VOCABULARIO from '../apresentacao/tipos-bloco.json';

const VOCAB: ReadonlySet<string> = new Set(VOCABULARIO as string[]);
const RE_ID_CATEGORIA = /^[a-z][a-z0-9-]+$/;
const IDS_RESERVADOS: ReadonlySet<string> = new Set(['_outros', '_tudo']);

/** true só para string com conteúdo não-branco. */
function textoCheio(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

export function validarNicho(nicho: Nicho): string[] {
  const msgs: string[] = [];

  const idsCategoria = validarCategorias(nicho, msgs);
  const skus = new Set<string>(
    nicho.produtos.filter((p) => textoCheio(p?.sku)).map((p) => p.sku),
  );

  nicho.produtos.forEach((produto, i) =>
    validarProduto(produto, i, idsCategoria, msgs),
  );

  validarEntrada(nicho, skus, msgs);
  validarVariantes(nicho, idsCategoria, skus, msgs);
  validarOfertas(nicho, msgs);

  return msgs;
}

function validarCategorias(nicho: Nicho, msgs: string[]): Set<string> {
  const ids = new Set<string>();
  const cats = nicho.categorias ?? [];

  cats.forEach((cat, i) => {
    const rot = `categoria #${i + 1}${textoCheio(cat?.id) ? ` ("${cat.id}")` : ''}`;

    if (!textoCheio(cat?.id)) {
      msgs.push(`${rot}: \`id\` ausente ou vazio`);
      return;
    }
    if (IDS_RESERVADOS.has(cat.id)) {
      msgs.push(
        `${rot}: usa id reservado — \`_outros\`/\`_tudo\` são sintéticos, não declaráveis`,
      );
    } else if (!RE_ID_CATEGORIA.test(cat.id)) {
      msgs.push(`${rot}: \`id\` não casa ^[a-z][a-z0-9-]+$`);
    }
    if (ids.has(cat.id)) {
      msgs.push(`${rot}: \`id\` duplicado`);
    } else {
      ids.add(cat.id);
    }
    if (!textoCheio(cat.rotulo)) {
      msgs.push(`${rot}: \`rotulo\` ausente ou vazio`);
    }
  });

  return ids;
}

function validarProduto(
  produto: Produto,
  indice: number,
  idsCategoria: ReadonlySet<string>,
  msgs: string[],
): void {
  const sku = textoCheio(produto?.sku) ? produto.sku : `#${indice + 1}`;
  const rot = `sku "${sku}"`;

  if (produto.categoria != null && !idsCategoria.has(produto.categoria)) {
    msgs.push(
      `${rot}: \`categoria\` "${produto.categoria}" não está declarada em \`nicho.categorias\``,
    );
  }

  if (produto.prioridade != null) {
    const p = produto.prioridade;
    if (typeof p !== 'number' || !Number.isInteger(p) || p < 0 || p > 100) {
      msgs.push(
        `${rot}: \`prioridade\` deve ser inteiro em 0..100 (achei ${JSON.stringify(p)})`,
      );
    }
  }

  if (produto.galeria != null) {
    if (!Array.isArray(produto.galeria) || produto.galeria.length === 0) {
      msgs.push(`${rot}: \`galeria\` presente mas vazia ou não é lista`);
    } else {
      produto.galeria.forEach((item, i) =>
        validarItemMidia(item, `${rot}, galeria[${i}]`, msgs),
      );
    }
  }

  if (produto.beneficios != null) {
    if (
      !Array.isArray(produto.beneficios) ||
      produto.beneficios.length === 0 ||
      produto.beneficios.some((b) => !textoCheio(b))
    ) {
      msgs.push(`${rot}: \`beneficios\` deve ser lista não-vazia de strings`);
    }
  }

  if (produto.specs != null) {
    validarPares(produto.specs, `${rot}, \`specs\``, msgs);
  }

  if (produto.blocos != null) {
    if (!Array.isArray(produto.blocos)) {
      msgs.push(`${rot}: \`blocos\` deve ser uma lista`);
    } else {
      produto.blocos.forEach((bloco, i) => validarBloco(bloco, i, rot, msgs));
    }
  }
}

function validarItemMidia(item: ItemMidia, ctx: string, msgs: string[]): void {
  if (item == null || typeof item !== 'object') {
    msgs.push(`${ctx}: ItemMidia ausente ou não é objeto`);
    return;
  }
  if (item.tipo !== 'imagem' && item.tipo !== 'video') {
    msgs.push(
      `${ctx}: \`tipo\` inválido — espera 'imagem' | 'video', achei ${JSON.stringify(item.tipo)}`,
    );
  }
  if (!textoCheio(item.src)) {
    msgs.push(`${ctx}: \`src\` vazio`);
  }
  if (!textoCheio(item.alt)) {
    msgs.push(`${ctx}: \`alt\` vazio (obrigatório — a11y)`);
  }
  if (item.tipo === 'video' && !textoCheio(item.poster)) {
    msgs.push(`${ctx}: \`tipo: 'video'\` exige \`poster\``);
  }
}

function validarPares(pares: ParSpec[], ctx: string, msgs: string[]): void {
  if (!Array.isArray(pares) || pares.length === 0) {
    msgs.push(`${ctx}: deve ser lista não-vazia de ParSpec`);
    return;
  }
  pares.forEach((par, i) => {
    if (!textoCheio(par?.chave) || !textoCheio(par?.valor)) {
      msgs.push(`${ctx}[${i}]: ParSpec com \`chave\` ou \`valor\` vazios`);
    }
  });
}

function validarBloco(
  bloco: BlocoApresentacao,
  indice: number,
  rotProduto: string,
  msgs: string[],
): void {
  const pos = `bloco #${indice + 1}`;

  if (bloco == null || typeof bloco !== 'object') {
    msgs.push(`${rotProduto}, ${pos}: bloco ausente ou não é objeto`);
    return;
  }

  const tipoRaw: unknown = bloco.tipo;
  if (!textoCheio(tipoRaw)) {
    msgs.push(`${rotProduto}, ${pos}: bloco sem \`tipo\``);
    return;
  }
  if (!VOCAB.has(tipoRaw)) {
    msgs.push(
      `${rotProduto}, ${pos}: \`tipo\` "${tipoRaw}" fora do vocabulário [${[...VOCAB].join(', ')}]`,
    );
    return;
  }

  const ctx = `${rotProduto}, ${pos} (${tipoRaw})`;

  switch (bloco.tipo) {
    case 'texto': {
      if (
        !Array.isArray(bloco.corpo) ||
        bloco.corpo.length === 0 ||
        bloco.corpo.some((p) => !textoCheio(p))
      ) {
        msgs.push(`${ctx}: \`corpo\` deve ser string[] não-vazio`);
      }
      break;
    }
    case 'midia': {
      if (!Array.isArray(bloco.itens) || bloco.itens.length === 0) {
        msgs.push(`${ctx}: \`itens\` deve ser ItemMidia[] não-vazio`);
      } else {
        bloco.itens.forEach((item, i) =>
          validarItemMidia(item, `${ctx}, item ${i + 1}`, msgs),
        );
      }
      break;
    }
    case 'depoimento': {
      if (!textoCheio(bloco.citacao)) msgs.push(`${ctx}: \`citacao\` vazia`);
      if (!textoCheio(bloco.autor)) msgs.push(`${ctx}: \`autor\` vazio`);
      break;
    }
    case 'como-usar': {
      if (!Array.isArray(bloco.passos) || bloco.passos.length === 0) {
        msgs.push(`${ctx}: \`passos\` deve ser lista não-vazia`);
      } else {
        bloco.passos.forEach((passo, i) => {
          if (!textoCheio(passo?.titulo)) {
            msgs.push(`${ctx}, passo ${i + 1}: \`titulo\` vazio`);
          }
          if (passo?.midia != null) {
            validarItemMidia(passo.midia, `${ctx}, passo ${i + 1} midia`, msgs);
          }
        });
      }
      break;
    }
    case 'comparativo': {
      const nColunas = Array.isArray(bloco.colunas) ? bloco.colunas.length : -1;
      if (nColunas <= 0) {
        msgs.push(`${ctx}: \`colunas\` deve ser lista não-vazia`);
      }
      if (!Array.isArray(bloco.linhas) || bloco.linhas.length === 0) {
        msgs.push(`${ctx}: \`linhas\` deve ser lista não-vazia`);
      } else if (nColunas > 0) {
        bloco.linhas.forEach((linha, i) => {
          if (!textoCheio(linha?.rotulo)) {
            msgs.push(`${ctx}, linha ${i + 1}: \`rotulo\` vazio`);
          }
          const nValores = Array.isArray(linha?.valores)
            ? linha.valores.length
            : -1;
          if (nValores !== nColunas) {
            msgs.push(
              `${ctx}, linha ${i + 1}: \`valores\` (${nValores < 0 ? 'ausente' : nValores}) deve ter o tamanho de \`colunas\` (${nColunas})`,
            );
          }
        });
      }
      break;
    }
    case 'bonus': {
      if (!Array.isArray(bloco.itens) || bloco.itens.length === 0) {
        msgs.push(`${ctx}: \`itens\` deve ser lista não-vazia`);
      } else {
        bloco.itens.forEach((item, i) => {
          if (!textoCheio(item?.nome)) {
            msgs.push(`${ctx}, item ${i + 1}: \`nome\` vazio`);
          }
        });
      }
      break;
    }
    case 'faq': {
      if (!Array.isArray(bloco.itens) || bloco.itens.length === 0) {
        msgs.push(`${ctx}: \`itens\` deve ser lista não-vazia`);
      } else {
        bloco.itens.forEach((item, i) => {
          if (!textoCheio(item?.pergunta)) {
            msgs.push(`${ctx}, item ${i + 1}: \`pergunta\` vazia`);
          }
          if (!textoCheio(item?.resposta)) {
            msgs.push(`${ctx}, item ${i + 1}: \`resposta\` vazia`);
          }
        });
      }
      break;
    }
    case 'specs': {
      validarPares(bloco.pares, `${ctx}, \`pares\``, msgs);
      break;
    }
  }
}

function validarEntrada(
  nicho: Nicho,
  skus: ReadonlySet<string>,
  msgs: string[],
): void {
  const heroiSku = nicho.entrada?.heroiSku;
  if (heroiSku != null && !skus.has(heroiSku)) {
    msgs.push(`entrada.heroiSku "${heroiSku}" não é \`sku\` de nenhum produto`);
  }
}

function validarVariantes(
  nicho: Nicho,
  idsCategoria: ReadonlySet<string>,
  skus: ReadonlySet<string>,
  msgs: string[],
): void {
  const b = nicho.variantes?.b;
  if (!b) return;

  for (const id of b.ordemCategorias ?? []) {
    if (!idsCategoria.has(id) && !IDS_RESERVADOS.has(id)) {
      msgs.push(`variantes.b.ordemCategorias: id "${id}" não existe no nicho`);
    }
  }
  for (const sku of b.ordem ?? []) {
    if (!skus.has(sku)) {
      msgs.push(`variantes.b.ordem: sku "${sku}" não existe no nicho`);
    }
  }
  if (b.destaque != null && !skus.has(b.destaque)) {
    msgs.push(`variantes.b.destaque: sku "${b.destaque}" não existe no nicho`);
  }
}

function validarOfertas(nicho: Nicho, msgs: string[]): void {
  for (const [id, regra] of Object.entries(nicho.ofertas ?? {})) {
    if (!textoCheio(regra?.selo)) {
      msgs.push(`ofertas["${id}"]: \`selo\` vazio`);
    }
  }
}
