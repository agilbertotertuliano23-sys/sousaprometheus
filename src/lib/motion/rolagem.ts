/**
 * Rolagem suave entre seções com a curva/tempo do site (movimento.ts: a da
 * Basic Agency, cubic-bezier(0.72, 0, 0.28, 1)). O `behavior: 'smooth'` nativo
 * tem curva e duração do navegador (e nenhum controle); aqui a passagem entre
 * seções usa a MESMA cadência da intro e das entradas ao rolar.
 *
 *  - `rolarPara(alvo)` — anima o scroll até um elemento (ou posição em px). A
 *    duração cresce com a distância (700–1600 ms). Qualquer gesto do usuário
 *    (roda, toque, tecla, clique) cancela a animação na hora — nunca "sequestra"
 *    a rolagem (docs/architecture/09 §5: no webview do TikTok o gesto não pode
 *    ser disputado). Com `prefers-reduced-motion`, salta direto.
 *  - `ligarRolagem()` — delegação de clique pra âncoras internas simples
 *    (`#secao-x`, `#faq`, `#lista-prioridade`, "voltar ao topo"…): antes o hash
 *    puro dava um salto seco (e o roteador de telas devolvia o scroll pro topo em
 *    hash não reconhecido — ver CardsVidro.astro). Agora rola suave SEM mexer no
 *    hash. Não toca em links do roteador (`data-ir`, `data-proxima-ir`) nem em
 *    `#tela-*`/`#cat-*`/`#produto*`/`#vitrine` (isso é do `telas.ts`).
 */
import { prefereMenosMovimento } from './reduced-motion';
import { easeSite } from './movimento';

let cancelarAtual: (() => void) | null = null;

const GESTOS = ['wheel', 'touchstart', 'keydown', 'mousedown'] as const;

export function rolarPara(alvo: HTMLElement | number, opcoes: { folga?: number } = {}): Promise<void> {
  const y0 = window.scrollY;
  const destinoBruto =
    typeof alvo === 'number' ? alvo : alvo.getBoundingClientRect().top + y0 - (opcoes.folga ?? 0);
  const maximo = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const y1 = Math.min(Math.max(0, destinoBruto), maximo);
  const distancia = Math.abs(y1 - y0);

  cancelarAtual?.();
  if (prefereMenosMovimento() || distancia < 4) {
    window.scrollTo(0, y1);
    return Promise.resolve();
  }

  const duracao = Math.min(1600, Math.max(700, 500 + distancia * 0.22));
  return new Promise<void>((concluir) => {
    const t0 = performance.now();
    let quadro = 0;
    let parou = false;

    const parar = () => {
      if (parou) return;
      parou = true;
      cancelAnimationFrame(quadro);
      GESTOS.forEach((g) => window.removeEventListener(g, parar));
      if (cancelarAtual === parar) cancelarAtual = null;
      concluir();
    };
    GESTOS.forEach((g) => window.addEventListener(g, parar, { passive: true }));
    cancelarAtual = parar;

    const passo = (agora: number) => {
      if (parou) return;
      const k = Math.min(1, (agora - t0) / duracao);
      window.scrollTo(0, y0 + (y1 - y0) * easeSite(k));
      if (k < 1) quadro = requestAnimationFrame(passo);
      else parar();
    };
    quadro = requestAnimationFrame(passo);
  });
}

/** ids que pertencem ao roteador de telas (`telas.ts`) — não interceptar */
const DO_ROTEADOR = /^(tela-|cat-|produto|vitrine|entrada)/;

let ligada = false;

/** Liga a rolagem suave das âncoras internas. Idempotente. Chamada pelo <script> de Base.astro. */
export function ligarRolagem(): void {
  if (ligada || typeof document === 'undefined') return;
  ligada = true;

  document.addEventListener('click', (ev) => {
    if (ev.defaultPrevented || ev.button !== 0) return;
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    const link = (ev.target as Element | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
    if (!link || link.hasAttribute('data-ir') || link.hasAttribute('data-proxima-ir')) return;

    const id = decodeURIComponent(link.getAttribute('href')!.slice(1));
    if (!id) return;

    // "Voltar ao topo" da tela de entrada: rola suave em vez do salto do roteador.
    if (id === 'tela-entrada') {
      if (document.getElementById('app')?.dataset.tela !== 'entrada') return;
      ev.preventDefault();
      void rolarPara(0);
      return;
    }
    if (DO_ROTEADOR.test(id)) return;

    const alvo = document.getElementById(id);
    if (!alvo) return;
    ev.preventDefault();
    void rolarPara(alvo);
    if (!alvo.hasAttribute('tabindex')) alvo.setAttribute('tabindex', '-1');
    try {
      alvo.focus({ preventScroll: true });
    } catch {
      /* motores antigos — ignora */
    }
  });
}
