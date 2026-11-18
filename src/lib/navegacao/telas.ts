/**
 * Máquina de telas no cliente (E6-02). Progressive enhancement sobre a casca
 * estática de E6-01. Adiciona `html.js`, alterna `#app[data-tela]`, faz
 * `history.pushState` com `#hash` PRESERVANDO `location.search`, e ouve
 * `popstate`/`hashchange`.
 *
 * Sem JS (ou se este módulo falhar): nada disso roda e a página segue navegável
 * por âncora nativa (RF-16 / RNF-04). O gate CSS que oculta telas fica todo sob
 * `html.js` (src/styles/global.css) — enquanto o controlador não roda, nenhuma
 * regra casa e as 3 telas ficam empilhadas e visíveis.
 *
 * Ver docs/architecture/09 §1–§5 e docs/stories/E6-02-maquina-de-telas-no-cliente.md.
 */
import { prefereMenosMovimento } from '../motion/reduced-motion';
import { ligarVideoVertical } from '../midia/video-vertical';
import { rolarPara } from '../motion/rolagem';

export type Tela = 'entrada' | 'vitrine' | 'detalhe';

export interface EstadoTela {
  tela: Tela;
  /** presente só quando tela === 'vitrine' e a transição veio de um chip */
  cat?: string;
  /** presente só quando tela === 'detalhe' */
  sku?: string;
}

/*
 * Casos de referência (handoff aiox-qa — funções puras, entrada → saída).
 * `hashDe`:
 *   { tela: 'entrada' }                       -> ''
 *   { tela: 'vitrine' }                       -> '#vitrine'
 *   { tela: 'vitrine', cat: 'x' }             -> '#vitrine&cat=x'
 *   { tela: 'detalhe', sku: 'x' }             -> '#produto=x'
 * `estadoDeHash`:
 *   ''            | '#'            -> { tela: 'entrada' }
 *   'entrada'     | '#tela-entrada'-> { tela: 'entrada' }
 *   'vitrine'     | '#tela-vitrine'-> { tela: 'vitrine' }
 *   '#vitrine&cat=k'               -> { tela: 'vitrine', cat: 'k' }
 *   '#cat-k'                       -> { tela: 'vitrine', cat: 'k' }
 *   '#produto=s' | '#produto-s'    -> { tela: 'detalhe', sku: 's' }
 *   '#tela-detalhe'               -> { tela: 'detalhe' }        (sem sku -> rebaixa)
 *   '#qualquer-outra-coisa'       -> { tela: 'entrada' }
 * `estadoInicial`: hash > entrada. [AUTO-DECISION D-11 revertida — confirmado
 * com o dono (Vinicius): a 1ª tela ao iniciar é sempre a entrada (main),
 * mesmo em revisita. Ver V-8 em docs/VALIDACAO-PO.md.]
 */

let ligada = false;
let estadoAtual: EstadoTela = { tela: 'entrada' };

/**
 * Guarda anti-duplicação: `ligarVideoVertical` cria um IntersectionObserver novo
 * e um listener de `click` novo a cada chamada. Religar o mesmo <article>
 * empilharia observers/listeners — por isso só religamos um `sku` inédito.
 */
const skusComVideoLigado = new Set<string>();

/** Escapa um valor para uso seguro dentro de um seletor de atributo. */
function esc(valor: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(valor);
  }
  return valor.replace(/["\\\]]/g, '\\$&');
}

// -- Hash <-> estado ---------------------------------------------------------

/** '' para entrada; '#vitrine' [+ '&cat=<id>']; '#produto=<sku>'. */
export function hashDe(estado: EstadoTela): string {
  switch (estado.tela) {
    case 'vitrine':
      return estado.cat ? `#vitrine&cat=${estado.cat}` : '#vitrine';
    case 'detalhe':
      return estado.sku ? `#produto=${estado.sku}` : '';
    default:
      return '';
  }
}

/** Parse de `location.hash` → EstadoTela. Hash vazio/desconhecido → { tela: 'entrada' }. Nunca lança. */
export function estadoDeHash(hash: string): EstadoTela {
  const raw = (hash ?? '').replace(/^#/, '').trim();

  if (raw === '' || raw === 'entrada' || raw === 'tela-entrada') {
    return { tela: 'entrada' };
  }
  if (raw === 'vitrine' || raw === 'tela-vitrine') {
    return { tela: 'vitrine' };
  }
  if (raw.startsWith('vitrine&')) {
    let cat: string | null = null;
    try {
      cat = new URLSearchParams(raw.slice('vitrine&'.length)).get('cat');
    } catch {
      cat = null;
    }
    return cat ? { tela: 'vitrine', cat } : { tela: 'vitrine' };
  }
  if (raw.startsWith('cat-')) {
    // ignora qualquer `&…` extra (fora de escopo desta story)
    const cat = raw.slice('cat-'.length).split('&')[0];
    return cat ? { tela: 'vitrine', cat } : { tela: 'vitrine' };
  }
  if (raw === 'tela-detalhe') {
    return { tela: 'detalhe' };
  }
  if (raw.startsWith('produto=') || raw.startsWith('produto-')) {
    // `#produto=<sku>` pode carregar `&b=<bloco>` (deep-link para bloco — E5-02+).
    // Esta story ignora o `&b=` e resolve só o produto.
    const sku = raw.slice('produto='.length).split('&')[0];
    return sku ? { tela: 'detalhe', sku } : { tela: 'detalhe' };
  }
  return { tela: 'entrada' };
}

/**
 * Estado inicial: hash > entrada. Sempre entrada (main) na 1ª tela, mesmo em
 * revisita — [AUTO-DECISION D-11] revertida, confirmado com o dono (V-8 em
 * docs/VALIDACAO-PO.md). Deep-link explícito (`#vitrine`, `#produto=<sku>`)
 * continua funcionando normalmente via `estadoDeHash`.
 */
export function estadoInicial(): EstadoTela {
  if (typeof location === 'undefined') return { tela: 'entrada' };

  const h = location.hash;
  if (h && h !== '#') return estadoDeHash(h);

  return { tela: 'entrada' };
}

// -- DOM helpers -----------------------------------------------------------

function elTela(tela: Tela): HTMLElement | null {
  return document.getElementById(`tela-${tela}`);
}

/**
 * Elemento da trilha de uma categoria: `<section id="cat-<id>">` do Bloco 2b
 * (ADR-008 Fase 0). Null se a categoria não existe nesta build. Substitui o
 * `marcarChip` de E6-01 — na Fase 0 não há chips de `TrilhaCategorias`.
 */
function elCategoria(cat: string): HTMLElement | null {
  return document.getElementById(`cat-${cat}`);
}

/**
 * Filtro de catálogo por categoria (pedido: "uma sessao dedicada a cada
 * uma, e nao mais todas juntas ... cada catalogo abra o seu respectivo").
 * `cat` presente → esconde (`hidden`) as demais `<section class="grade-cat">`
 * de `GradeCatalogo`, deixando só a categoria de destino; `cat` ausente
 * (ex.: "Ver catálogo completo" do Rodapé) → reexibe todas. Puro DOM, sem
 * CSS cross-component — `.grade-cat` é escopado a `GradeCatalogo.astro`.
 */
function aplicarFiltroCategoria(cat: string | undefined): void {
  document
    .querySelectorAll<HTMLElement>('#tela-vitrine .grade-cat')
    .forEach((secao) => {
      secao.hidden = Boolean(cat) && secao.id !== `cat-${cat}`;
    });
}

/** Limpa `.ativo` de todos os <article> de detalhe; devolve o <article> do `sku` (ou null). */
function marcarArtigo(sku?: string): HTMLElement | null {
  document
    .querySelectorAll<HTMLElement>('#tela-detalhe > article[data-sku]')
    .forEach((a) => a.classList.remove('ativo'));
  if (!sku) return null;
  const alvo = document.querySelector<HTMLElement>(
    `#tela-detalhe > article[data-sku="${esc(sku)}"]`,
  );
  if (alvo) alvo.classList.add('ativo');
  return alvo;
}

function religarVideo(article: HTMLElement | null): void {
  if (!article) return;
  const sku = article.dataset.sku;
  if (!sku || skusComVideoLigado.has(sku)) return;
  skusComVideoLigado.add(sku);
  ligarVideoVertical(article);
}

function focar(alvo: HTMLElement | null): void {
  if (!alvo) return;
  if (!alvo.hasAttribute('tabindex')) alvo.setAttribute('tabindex', '-1');
  try {
    alvo.focus({ preventScroll: true });
  } catch {
    /* jsdom / motores antigos — ignora */
  }
}

// -- Aplicar / navegar ----------------------------------------------------

/**
 * Aplica o estado ao DOM (data-tela, chip ativo, artigo ativo, foco, scroll,
 * religa o vídeo do detalhe). NÃO toca no history.
 */
export function aplicarEstado(
  estado: EstadoTela,
  opts?: { rolar?: boolean; suave?: boolean },
): void {
  const app = document.getElementById('app');
  if (!app) return;

  // Deep-link inválido para detalhe → rebaixa para entrada (CA 8).
  let efetivo: EstadoTela = estado;
  let articleAtivo: HTMLElement | null = null;
  if (estado.tela === 'detalhe') {
    articleAtivo = marcarArtigo(estado.sku);
    if (!articleAtivo) {
      efetivo = { tela: 'entrada' };
    }
  } else {
    // Ao sair para entrada/vitrine, limpa `.ativo` que sobrou do detalhe.
    marcarArtigo(undefined);
  }

  // `cat` que não casa nenhuma trilha → mantém a vitrine, sem alvo de categoria.
  let catEfetiva = efetivo.tela === 'vitrine' ? efetivo.cat : undefined;
  if (catEfetiva && !elCategoria(catEfetiva)) catEfetiva = undefined;

  if (efetivo.tela === 'vitrine') aplicarFiltroCategoria(catEfetiva);

  app.dataset.tela = efetivo.tela;

  if (efetivo.tela === 'detalhe' && articleAtivo) {
    religarVideo(articleAtivo);
  }

  const tela = elTela(efetivo.tela);
  const secaoCat = catEfetiva ? elCategoria(catEfetiva) : null;
  const alvoScroll: HTMLElement | null =
    efetivo.tela === 'detalhe' && articleAtivo
      ? articleAtivo
      : secaoCat ?? tela;
  const alvoFoco: HTMLElement | null =
    efetivo.tela === 'detalhe' && articleAtivo
      ? articleAtivo
      : secaoCat ?? tela?.querySelector<HTMLElement>('h1, h2, h3') ?? tela;

  focar(alvoFoco);

  if (opts?.rolar !== false && alvoScroll) {
    const suave = Boolean(opts?.suave) && !prefereMenosMovimento();
    if (suave) {
      // passagem entre seções com a curva/tempo do site (movimento.ts)
      void rolarPara(alvoScroll);
    } else {
      alvoScroll.scrollIntoView({ block: 'start', behavior: 'auto' });
    }
  }

  estadoAtual =
    efetivo.tela === 'vitrine'
      ? catEfetiva
        ? { tela: 'vitrine', cat: catEfetiva }
        : { tela: 'vitrine' }
      : efetivo.tela === 'detalhe' && articleAtivo
        ? { tela: 'detalhe', sku: articleAtivo.dataset.sku }
        : { tela: 'entrada' };
}

function mesmoEstado(a: EstadoTela, b: EstadoTela): boolean {
  return (
    a.tela === b.tela &&
    (a.cat ?? '') === (b.cat ?? '') &&
    (a.sku ?? '') === (b.sku ?? '')
  );
}

type DocumentoComTransicao = Document & { startViewTransition?: (cb: () => void) => unknown };

/** View Transitions disponíveis E o usuário não pediu menos movimento? */
function podeTransicionar(): boolean {
  return (
    typeof (document as DocumentoComTransicao).startViewTransition === 'function' &&
    !prefereMenosMovimento()
  );
}

/**
 * Transição por interação: aplicarEstado + history.pushState preservando search.
 *
 * Com View Transitions (regras em global.css): a tela que sai recua e some, a que
 * entra sobe e assenta — e a rolagem é instantânea, porque o próprio crossfade é a
 * transição. O callback da API roda de forma ASSÍNCRONA (após capturar o estado
 * antigo), então tudo que depende do estado novo — inclusive o `pushState` — fica
 * dentro dele. Sem suporte: rolagem suave, como sempre foi.
 */
export function irPara(estado: EstadoTela): void {
  if (mesmoEstado(estado, estadoAtual)) return;
  const comVT = podeTransicionar();
  const aplicar = (): void => {
    aplicarEstado(estado, { rolar: true, suave: !comVT });
    // URL = pathname + search + hash — `location.search` concatenado INTACTO e
    // antes do fragmento (R-08 / RF-15.2). `hashDe` usa o estado efetivo aplicado.
    const url = location.pathname + location.search + hashDe(estadoAtual);
    history.pushState({ ...estadoAtual }, '', url);
  };
  if (comVT) (document as DocumentoComTransicao).startViewTransition!(aplicar);
  else aplicar();
}

// -- Listeners -----------------------------------------------------------

function aoClicar(ev: MouseEvent): void {
  if (ev.defaultPrevented) return;
  if (ev.button !== 0) return;
  if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;

  const origem = ev.target as Element | null;
  const alvo = origem?.closest?.('[data-ir]') as HTMLElement | null;
  if (!alvo) return;

  const tipo = alvo.getAttribute('data-ir');
  if (tipo === 'vitrine') {
    ev.preventDefault();
    irPara({
      tela: 'vitrine',
      cat: alvo.getAttribute('data-cat') ?? undefined,
    });
  } else if (tipo === 'detalhe') {
    const sku = alvo.getAttribute('data-sku');
    if (sku) {
      ev.preventDefault();
      irPara({ tela: 'detalhe', sku });
    }
  } else if (tipo === 'entrada') {
    ev.preventDefault();
    irPara({ tela: 'entrada' });
  }
}

function aoHistorico(): void {
  // Scroll instantâneo no voltar/avançar — sensação de "voltar" nativo.
  aplicarEstado(estadoDeHash(location.hash), { rolar: true, suave: false });
}

/** Liga a máquina de telas. Idempotente. Chamada uma vez pelo <script> de Base.astro. */
export function ligarNavegacaoTelas(): void {
  if (ligada) return;
  if (typeof document === 'undefined') return;

  const app = document.getElementById('app');
  if (!app) {
    if (import.meta.env.DEV) {
      console.warn('[telas] #app não encontrado — navegação de telas inativa.');
    }
    return;
  }
  ligada = true;

  // 1ª ação efetiva: liga o gate CSS. Se este módulo falhasse antes daqui, o
  // gate nunca ativaria e a página seguiria empilhada (resiliência — CA 10).
  document.documentElement.classList.add('js');

  // ADR-008 Fase 0: sem swap de TELA (`#tela-vitrine` continua os mesmos
  // blocos 2a/2b/2c + informações; `VitrineFoco` não existe). Dentro do
  // Bloco 2c (`GradeCatalogo`), porém, `aplicarFiltroCategoria` ESCONDE as
  // categorias que não são o alvo quando a navegação chega com `cat` —
  // pedido: "uma sessao dedicada a cada uma ... cada catalogo abra o seu
  // respectivo". Sem `cat` (ex.: "Ver catálogo completo"), todas voltam.

  const inicial = estadoInicial();
  aplicarEstado(inicial, {
    rolar: inicial.tela !== 'entrada',
    suave: false,
  });

  // Normaliza a URL SEM criar entrada no history. Usa `estadoAtual` (pós-apply)
  // para que um deep-link inválido (#produto=inexistente) caia na URL canônica
  // limpa, sem fragmento (CA 8).
  history.replaceState(
    { ...estadoAtual },
    '',
    location.pathname + location.search + hashDe(estadoAtual),
  );

  document.addEventListener('click', aoClicar);
  window.addEventListener('popstate', aoHistorico);
  window.addEventListener('hashchange', aoHistorico);
}
