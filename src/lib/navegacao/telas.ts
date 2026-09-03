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
 * `estadoInicial`: hash > revisita (recorrente, sem ?n=, sem hash) > entrada.
 */

const CHAVE_MEMORIA = 'prometeus:ultimo-nicho';

/**
 * Snapshot da memória de revisita ANTES de `aplicarPersonalizacao()` (chamado no
 * <script> de Base.astro) gravar a chave nesta carga. ES modules avaliam este
 * top-level na FASE DE IMPORT — que acontece antes de qualquer chamada de função
 * no <script>. `contexto.ts` não grava nada em top-level, então a leitura é
 * limpa. Ver E6-02 Riscos nota 3. Se um dia `contexto.ts` gravar em top-level,
 * migrar para uma API explícita (`capturarRevisita()` como 1ª linha do <script>).
 */
const eraRecorrente: boolean = (() => {
  try {
    return (
      typeof localStorage !== 'undefined' &&
      localStorage.getItem(CHAVE_MEMORIA) != null
    );
  } catch {
    return false;
  }
})();

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

/** Estado inicial: hash > revisita (recorrente, sem ?n=, sem hash) > entrada. */
export function estadoInicial(): EstadoTela {
  if (typeof location === 'undefined') return { tela: 'entrada' };

  const h = location.hash;
  if (h && h !== '#') return estadoDeHash(h);

  try {
    if (!new URLSearchParams(location.search).has('n') && eraRecorrente) {
      // [AUTO-DECISION] D-11: a revisita começa na vitrine (pula a entrada).
      // Isolado neste único ramo para virar um flip de 1 linha quando E2-02
      // trouxer dado de tráfego.
      return { tela: 'vitrine' };
    }
  } catch {
    /* modo privado / URL exótica — cai no default */
  }
  return { tela: 'entrada' };
}

// -- DOM helpers -----------------------------------------------------------

function elTela(tela: Tela): HTMLElement | null {
  return document.getElementById(`tela-${tela}`);
}

/**
 * Limpa `.ativo`/`aria-current` de todos os chips. Se `naVitrine`, marca o chip
 * de `cat` (ou o primeiro, quando `cat` ausente) — CA 6.
 */
function marcarChip(naVitrine: boolean, cat?: string): void {
  const chips = document.querySelectorAll<HTMLElement>(
    '#tela-vitrine .trilha .chip',
  );
  chips.forEach((c) => {
    c.classList.remove('ativo');
    c.removeAttribute('aria-current');
  });
  if (!naVitrine) return;
  const alvo = cat
    ? document.querySelector<HTMLElement>(
        `#tela-vitrine .trilha .chip[data-cat="${esc(cat)}"]`,
      )
    : chips[0] ?? null;
  if (alvo) {
    alvo.classList.add('ativo');
    alvo.setAttribute('aria-current', 'true');
  }
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

  // `cat` que não casa nenhum chip → mantém a vitrine, cai no primeiro chip.
  let catEfetiva = efetivo.tela === 'vitrine' ? efetivo.cat : undefined;
  if (catEfetiva) {
    const chip = document.querySelector(
      `#tela-vitrine .trilha .chip[data-cat="${esc(catEfetiva)}"]`,
    );
    if (!chip) catEfetiva = undefined;
  }

  app.dataset.tela = efetivo.tela;
  marcarChip(efetivo.tela === 'vitrine', catEfetiva);

  if (efetivo.tela === 'detalhe' && articleAtivo) {
    religarVideo(articleAtivo);
  }

  const tela = elTela(efetivo.tela);
  const alvoScroll: HTMLElement | null =
    efetivo.tela === 'detalhe' && articleAtivo ? articleAtivo : tela;
  const alvoFoco: HTMLElement | null =
    efetivo.tela === 'detalhe' && articleAtivo
      ? articleAtivo
      : tela?.querySelector<HTMLElement>('h1, h2, h3') ?? tela;

  focar(alvoFoco);

  if (opts?.rolar !== false && alvoScroll) {
    const suave = Boolean(opts?.suave) && !prefereMenosMovimento();
    alvoScroll.scrollIntoView({
      block: 'start',
      behavior: suave ? 'smooth' : 'auto',
    });
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

/** Transição por interação: aplicarEstado + history.pushState preservando search. */
export function irPara(estado: EstadoTela): void {
  if (mesmoEstado(estado, estadoAtual)) return;
  aplicarEstado(estado, { rolar: true, suave: true });
  // URL = pathname + search + hash — `location.search` concatenado INTACTO e
  // antes do fragmento (R-08 / RF-15.2). `hashDe` usa o estado efetivo aplicado.
  const url =
    location.pathname + location.search + hashDe(estadoAtual);
  history.pushState({ ...estadoAtual }, '', url);
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

  // Swap da vitrine, uma vez e IMPERATIVAMENTE (não por CSS): com JS a
  // `VitrineFoco` assume; a `GradeCatalogo` (fallback sem-JS) sai. Se `telas.ts`
  // falhar depois, a grade continua sendo o fallback.
  document
    .querySelector('#tela-vitrine .vitrine-foco')
    ?.removeAttribute('hidden');
  (
    document.querySelector(
      '#tela-vitrine .grade-catalogo',
    ) as HTMLElement | null
  )?.setAttribute('hidden', '');

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
