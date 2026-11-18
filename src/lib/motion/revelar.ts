/**
 * Entrada das seções ao rolar — UMA configuração pro site todo, a da Basic
 * Agency (movimento.ts: curva cubic-bezier(0.72, 0, 0.28, 1), 1 s), reproduzindo
 * as 3 entradas da intro do case Beats by Dre:
 *
 *  - `titulo`  — o texto sobe de dentro de uma MÁSCARA, letra a letra (títulos
 *    curtos) ou palavra a palavra (frases), escalonado;
 *  - `janela`  — imagens/painéis: o quadro ABRE de baixo pra cima (clip-path) e a
 *    mídia de dentro assenta com zoom-out (1,25 → 1);
 *  - `sobe`    — blocos de texto/controles: sobem 48 px e aparecem.
 * Itens de uma grade (`GRUPOS`) entram escalonados (70 ms entre eles).
 *
 * Como: Web Animations (`element.animate`) pausadas no 1º quadro e disparadas por
 * IntersectionObserver quando o elemento entra pela borda de baixo da tela.
 * Sem CSS de "esconder": ao terminar, a animação some e o elemento volta ao estilo
 * natural (nada de estado residual, nada de brigar com hover/transform próprios —
 * por isso usa as propriedades `translate`/`scale` individuais). Sem JS, sem
 * IntersectionObserver ou com `prefers-reduced-motion`, nada é escondido.
 *
 * Quais elementos: a tabela `REGRAS`/`GRUPOS` abaixo (seletores dos componentes) —
 * assim os componentes não precisam de atributo nenhum. Também dá pra marcar
 * direto no HTML: `data-mov="titulo|janela|sobe"`. Seletores são de FOLHA (sem
 * pai + filho animando junto); o guarda `data-mov` evita aninhamento. Elementos
 * em telas escondidas (`display:none`) só disparam quando a tela aparece.
 */
import { prefereMenosMovimento } from './reduced-motion';
import { MOV, EASE_CSS } from './movimento';

type Tipo = 'titulo' | 'sobe' | 'janela';

/** itens de cada um destes contêineres entram como `sobe`, escalonados */
const GRUPOS = [
  '.secao-grid',
  '.grade-grid',
  '.hx-escada',
  '.faq-lista',
  '.rodape-links',
  '.pd-relacionados-trilha',
];

const TITULOS = [
  '.hx-marca',
  '.hx-gigante',
  '.faq-titulo',
  '.grade-cat-titulo',
  '[data-loja-titulo]',
  '.rodape-cta-texto',
  '.legenda-streetwear-texto',
  '.pd-titulo',
  '.lp-titulo',
  '.tt-copy-kicker',
];

const JANELAS = ['.hx-foto', '.secao-banner', '.hx-painel', '.grade-cat-arte'];

const BLOCOS = [
  '.hx-lema',
  '.hx-linha',
  '.hx-texto',
  '.hx-cta',
  '.hx-sobre',
  '.hx-rodape',
  '.faq-descricao',
  '.lp-sub',
  '.lp-acao',
  '.loja-kicker',
  '.loja-chips',
  '.loja-busca',
  '.grade-cat-num',
  '.grade-cat-desc',
  '.grade-sub-titulo',
  '.rodape-cta-seta',
  '.rodape-marca',
  '.rodape-base',
  '.tt-copy-sub',
  '.tt-copy-desc',
  '.galeria-tiktok-contadores',
  '.pd-relacionados-cab',
];

let ligada = false;
const pendentes = new WeakMap<Element, Animation[]>();
let observador: IntersectionObserver;

const opcoes = (atraso: number): KeyframeAnimationOptions => ({
  duration: MOV.tempo,
  easing: EASE_CSS,
  delay: atraso,
  fill: 'backwards',
});

/** Divide o texto do título em máscaras (letras ou palavras) e devolve as unidades a animar. */
function dividirTitulo(el: HTMLElement): HTMLElement[] {
  const texto = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
  if (!texto) return [];
  const modo = texto.length <= 16 ? 'letras' : 'palavras';
  if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', texto);

  const unidades: HTMLElement[] = [];
  const criar = (classe: string, conteudo?: string): HTMLElement => {
    const s = document.createElement('span');
    s.className = classe;
    s.setAttribute('aria-hidden', 'true');
    if (conteudo !== undefined) s.textContent = conteudo;
    return s;
  };
  const mascara = (conteudo: string): HTMLElement => {
    const m = criar('mov-m');
    const u = criar('mov-u', conteudo);
    m.append(u);
    unidades.push(u);
    return m;
  };

  const percorrer = (no: Node): void => {
    Array.from(no.childNodes).forEach((filho) => {
      if (filho.nodeType === Node.TEXT_NODE) {
        const txt = filho.textContent ?? '';
        if (!txt.trim()) return;
        const frag = document.createDocumentFragment();
        txt.split(/(\s+)/).forEach((parte) => {
          if (!parte) return;
          if (/^\s+$/.test(parte)) {
            frag.append(' ');
            return;
          }
          if (modo === 'palavras') {
            frag.append(mascara(parte));
          } else {
            const palavra = criar('mov-p');
            Array.from(parte).forEach((letra) => palavra.append(mascara(letra)));
            frag.append(palavra);
          }
        });
        filho.parentNode?.replaceChild(frag, filho);
      } else if (filho.nodeType === Node.ELEMENT_NODE && !(filho as Element).classList.contains('mov-m')) {
        percorrer(filho);
      }
    });
  };
  percorrer(el);
  return unidades;
}

function registrar(el: HTMLElement, tipo: Tipo, atraso = 0): void {
  if (pendentes.has(el) || el.dataset.mov) return;
  // sem pai + filho animando juntos
  if (el.parentElement?.closest('[data-mov]')) return;

  let anims: Animation[] = [];
  if (tipo === 'sobe') {
    anims = [
      el.animate(
        [
          { opacity: 0, translate: '0 48px' },
          { opacity: 1, translate: '0 0' },
        ],
        opcoes(atraso),
      ),
    ];
  } else if (tipo === 'janela') {
    anims = [
      el.animate([{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)' }], opcoes(atraso)),
    ];
    const midia = el.querySelector<HTMLElement>('img, video, canvas');
    if (midia) anims.push(midia.animate([{ scale: '1.25' }, { scale: '1' }], opcoes(atraso)));
  } else {
    const unidades = dividirTitulo(el);
    // no máximo ~0,9 s de escalonamento no total, por mais letras que tenha
    const passo = Math.min(MOV.escalonar, 900 / Math.max(1, unidades.length));
    anims = unidades.map((u, i) =>
      u.animate(
        [{ transform: 'translateY(115%)' }, { transform: 'translateY(0)' }],
        opcoes(atraso + i * passo),
      ),
    );
  }
  if (anims.length === 0) return;

  anims.forEach((a) => a.pause()); // segura o 1º quadro até entrar na tela
  el.dataset.mov = tipo;
  pendentes.set(el, anims);
  observador.observe(el);
}

/** Liga as entradas ao rolar. Idempotente. Chamada uma vez pelo <script> de Base.astro. */
export function ligarRevelar(): void {
  if (ligada) return;
  if (typeof document === 'undefined' || typeof IntersectionObserver === 'undefined') return;
  if (typeof Element.prototype.animate !== 'function') return;
  ligada = true;
  if (prefereMenosMovimento()) return;

  observador = new IntersectionObserver(
    (entradas, obs) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        pendentes.get(e.target)?.forEach((a) => a.play());
        obs.unobserve(e.target);
      });
    },
    // dispara assim que a borda de cima entra pela base da tela (sem faixa
    // excluída: o último bloco da página nunca chega a 92% da altura da tela)
    { rootMargin: '0px', threshold: 0 },
  );

  // 1º os marcados à mão no HTML (`data-mov="…"`), antes de qualquer registro
  // automático — que também escreve `data-mov` nos elementos que já tratou.
  document.querySelectorAll<HTMLElement>('[data-mov]:not([data-mov=""])').forEach((el) => {
    const tipo = el.dataset.mov as Tipo;
    delete el.dataset.mov;
    if (tipo === 'titulo' || tipo === 'sobe' || tipo === 'janela') registrar(el, tipo);
  });

  GRUPOS.forEach((seletor) => {
    document.querySelectorAll<HTMLElement>(seletor).forEach((grupo) => {
      Array.from(grupo.children).forEach((filho, i) =>
        registrar(filho as HTMLElement, 'sobe', (i % 6) * MOV.escalonar),
      );
    });
  });
  TITULOS.forEach((s) => document.querySelectorAll<HTMLElement>(s).forEach((el) => registrar(el, 'titulo')));
  JANELAS.forEach((s) => document.querySelectorAll<HTMLElement>(s).forEach((el) => registrar(el, 'janela')));
  BLOCOS.forEach((s) => document.querySelectorAll<HTMLElement>(s).forEach((el) => registrar(el, 'sobe')));
}
