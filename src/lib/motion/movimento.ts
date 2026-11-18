/**
 * Configuração ÚNICA de movimento do site — a mesma lida no CÓDIGO da Basic
 * Agency (case Beats by Dre) e já usada na intro da página (IntroEntrada.astro,
 * `intro-sousayl.astro`): curva `cubic-bezier(0.72, 0, 0.28, 1)` (= `--ease-in-out-soft`
 * em tokens.css), 1 s por movimento, 0,3 s de atraso inicial e as entradas em
 * MÁSCARA (texto sobe de dentro de uma janela) / JANELA (imagem abre de baixo pra
 * cima enquanto assenta, zoom-out 1,25 → 1).
 *
 * Usado por `revelar.ts` (entrada ao rolar) e `rolagem.ts` (passagem suave entre
 * seções). Os mesmos valores existem como variáveis CSS em tokens.css (`--mov-*`).
 */

export const MOV = {
  /** duração de cada movimento, em ms (= `--bd-time-transition-1000` da Basic) */
  tempo: 1000,
  /** atraso inicial das entradas, em ms (= `--initial-animation-delay`) */
  atraso: 300,
  /** passo do escalonamento (letras/itens em sequência), em ms */
  escalonar: 70,
  /** curva (x1, y1, x2, y2) — `--ease-in-out-soft` */
  ease: [0.72, 0, 0.28, 1] as const,
} as const;

/** a mesma curva como string CSS, pra Web Animations / transições */
export const EASE_CSS = `cubic-bezier(${MOV.ease.join(', ')})`;

/**
 * Curva cubic-bezier como função t (0..1) → progresso (0..1). Mesmo algoritmo do
 * navegador: resolve x(t)=tempo por Newton-Raphson com fallback em bisseção.
 */
export function criarBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  const x = (t: number) => ((ax * t + bx) * t + cx) * t;
  const y = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

  return (progresso: number): number => {
    if (progresso <= 0) return 0;
    if (progresso >= 1) return 1;
    let t = progresso;
    for (let i = 0; i < 8; i++) {
      const erro = x(t) - progresso;
      if (Math.abs(erro) < 1e-6) return y(t);
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= erro / d;
    }
    let baixo = 0;
    let alto = 1;
    t = progresso;
    while (baixo < alto) {
      const v = x(t);
      if (Math.abs(v - progresso) < 1e-6) break;
      if (progresso > v) baixo = t;
      else alto = t;
      t = (alto - baixo) / 2 + baixo;
      if (alto - baixo < 1e-7) break;
    }
    return y(t);
  };
}

/** easing padrão do site como função (usado na rolagem por rAF) */
export const easeSite = criarBezier(...MOV.ease);
