/**
 * Painel "próxima categoria" (ProximaSecao.astro) — a passagem entre categorias
 * do catálogo. Enquanto o painel está preso (sticky) na tela, a rolagem vira
 * PROGRESSO: `--p` (0→1) empurra o título da cor da categoria atual para a cor
 * da próxima. O avanço em si é sempre um toque no botão — nunca rolagem
 * sequestrada: no webview do TikTok o gesto de voltar e o arrasto vertical não
 * podem ser disputados (docs/architecture/09 §5).
 *
 * Progressive enhancement: sem JS o painel é um bloco estático com um link
 * `#cat-<id>` funcional; com `prefers-reduced-motion` o `--p` não é animado
 * (o título fica na cor atual) e o botão continua funcionando.
 *
 * Desempenho: um IntersectionObserver liga só os painéis perto da viewport; a
 * leitura (getBoundingClientRect) e a escrita (--p) ficam em fases separadas no
 * mesmo frame, e só escreve se o valor (arredondado a 0,01) mudou.
 */
import { prefereMenosMovimento } from './reduced-motion';
import { irPara } from '../navegacao/telas';
import { rolarPara } from './rolagem';

let ligada = false;

/** A vitrine está mostrando UMA categoria (filtro de telas.ts) em vez de todas? */
function emModoFiltro(): boolean {
  return document.querySelector('#tela-vitrine .grade-cat[hidden]') !== null;
}

function irParaCategoria(id: string): void {
  // Modo filtro: o "avanço" é trocar a categoria visível — passa pela máquina de
  // telas para manter hash, history e a transição entre telas coerentes.
  if (emModoFiltro()) {
    irPara({ tela: 'vitrine', cat: id });
    return;
  }
  // Catálogo completo: as categorias já estão empilhadas; só rola até a próxima.
  const alvo = document.getElementById(`cat-${id}`);
  if (!alvo) return;
  // Rolagem com a curva/tempo do site (movimento.ts), não a do navegador.
  void rolarPara(alvo);
  if (!alvo.hasAttribute('tabindex')) alvo.setAttribute('tabindex', '-1');
  try {
    alvo.focus({ preventScroll: true });
  } catch {
    /* motores antigos — ignora */
  }
}

/** Liga os painéis "próxima categoria". Idempotente. Chamada uma vez pelo <script> de Base.astro. */
export function ligarProximaSecao(): void {
  if (ligada) return;
  if (typeof document === 'undefined') return;
  const paineis = document.querySelectorAll<HTMLElement>('[data-proxima]');
  if (paineis.length === 0) return;
  ligada = true;

  document.addEventListener('click', (ev) => {
    if (ev.defaultPrevented || ev.button !== 0) return;
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    const link = (ev.target as Element | null)?.closest?.('[data-proxima-ir]') as HTMLElement | null;
    const id = link?.dataset.proximaIr;
    if (!link || !id) return;
    ev.preventDefault();
    irParaCategoria(id);
  });

  if (typeof IntersectionObserver === 'undefined' || prefereMenosMovimento()) return;

  const vivos = new Set<HTMLElement>();
  const ultimo = new WeakMap<HTMLElement, number>();
  let pendente = false;

  function atualizar(): void {
    pendente = false;
    if (vivos.size === 0) return;

    // Fase 1 — leitura (nenhuma escrita entre as leituras).
    const alturaJanela = window.innerHeight;
    const leituras: Array<[HTMLElement, number]> = [];
    vivos.forEach((el) => {
      const fixo = el.firstElementChild as HTMLElement | null;
      const rect = el.getBoundingClientRect();
      const pista = rect.height - (fixo?.offsetHeight ?? alturaJanela);
      const p = pista > 0 ? Math.min(1, Math.max(0, -rect.top / pista)) : 0;
      leituras.push([el, Math.round(p * 100) / 100]);
    });

    // Fase 2 — escrita.
    leituras.forEach(([el, p]) => {
      if (ultimo.get(el) === p) return;
      ultimo.set(el, p);
      el.style.setProperty('--p', String(p));
    });
  }

  const agendar = (): void => {
    if (pendente) return;
    pendente = true;
    requestAnimationFrame(atualizar);
  };

  const obs = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((e) => {
        const el = e.target as HTMLElement;
        if (e.isIntersecting) vivos.add(el);
        else vivos.delete(el);
      });
      agendar();
    },
    { rootMargin: '25% 0px 25% 0px' },
  );

  paineis.forEach((p) => obs.observe(p));
  window.addEventListener('scroll', agendar, { passive: true });
  window.addEventListener('resize', agendar);
}
