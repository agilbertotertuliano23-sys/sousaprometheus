/** @jsxImportSource react */
/**
 * PixelFundoHero — camada de pixels (efeito Uiverse.io "PixelCard", colado
 * pelo usuário) sobre TODO o banner da Hero.
 *
 * Renderizada como filho absoluto do próprio `<header class="hero">`
 * (`Hero.astro`), em `z-index: 1` — ACIMA do `background-image` cru do
 * banner, mas ABAIXO de tudo que já é interativo/visível ali (`.hero-in`
 * z2, `.hero-media-carrossel`/`.hero-media-central` z4) — por isso nunca
 * cobre visualmente o ExpositorCard/card central/textos (pedido antigo:
 * "nao pegue em expositor").
 *
 * Gatilho: NÃO é mais hover na área do banner — é hover/foco no botão
 * "Abrir catálogo" (`.hero-card-cta`, em `HeroCarrosselCard.astro`), que
 * continua estático (sem canvas dentro, pedido: "o botao ainda aparaça
 * como antes"). Este componente escuta esse botão via DOM nativo (são
 * ilhas/árvores React diferentes) e faz a onda de pixels NASCER na posição
 * do botão, se espalhando daí pro resto do banner — pedido: "o efeito abra
 * no botao, ele deve sair do botao". Por isso o próprio `<div>` desta
 * camada leva `pointer-events:none`: só decora, não escuta mais o mouse.
 *
 * Cor lida de `--acento` no momento do hover — a mesma variável que
 * `Hero.astro` já atualiza a partir de `cat.cor` (streetwear/gym/y2k/
 * old-money/minimal, ver `src/data/nichos/exemplo.ts`).
 */
import { useEffect, useRef } from 'react';
import { type JSX } from 'react';

class Pixel {
  width: number;
  height: number;
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  color: string;
  speed: number;
  size: number;
  sizeStep: number;
  minSize: number;
  maxSizeInteger: number;
  maxSize: number;
  delay: number;
  counter: number;
  counterStep: number;
  isIdle: boolean;
  isReverse: boolean;
  isShimmer: boolean;

  constructor(
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    speed: number,
    delay: number,
  ) {
    this.width = canvas.width;
    this.height = canvas.height;
    this.ctx = context;
    this.x = x;
    this.y = y;
    this.color = color;
    this.speed = this.getRandomValue(0.1, 0.9) * speed;
    this.size = 0;
    this.sizeStep = Math.random() * 0.4;
    this.minSize = 0.5;
    this.maxSizeInteger = 2;
    this.maxSize = this.getRandomValue(this.minSize, this.maxSizeInteger);
    this.delay = delay;
    this.counter = 0;
    this.counterStep = Math.random() * 4 + (this.width + this.height) * 0.01;
    this.isIdle = false;
    this.isReverse = false;
    this.isShimmer = false;
  }

  getRandomValue(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  draw() {
    const centerOffset = this.maxSizeInteger * 0.5 - this.size * 0.5;
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(this.x + centerOffset, this.y + centerOffset, this.size, this.size);
  }

  appear() {
    this.isIdle = false;
    if (this.counter <= this.delay) {
      this.counter += this.counterStep;
      return;
    }
    if (this.size >= this.maxSize) {
      this.isShimmer = true;
    }
    if (this.isShimmer) {
      this.shimmer();
    } else {
      this.size += this.sizeStep;
    }
    this.draw();
  }

  disappear() {
    this.isShimmer = false;
    this.counter = 0;
    if (this.size <= 0) {
      this.isIdle = true;
      return;
    } else {
      this.size -= 0.1;
    }
    this.draw();
  }

  shimmer() {
    if (this.size >= this.maxSize) {
      this.isReverse = true;
    } else if (this.size <= this.minSize) {
      this.isReverse = false;
    }
    if (this.isReverse) {
      this.size -= this.speed;
    } else {
      this.size += this.speed;
    }
  }
}

function getEffectiveSpeed(value: number, reducedMotion: boolean) {
  const min = 0;
  const max = 100;
  const throttle = 0.001;

  if (value <= min || reducedMotion) {
    return min;
  } else if (value >= max) {
    return max * throttle;
  } else {
    return value * throttle;
  }
}

function clamp255(v: number) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

/** Clareia (quantidade > 0) ou escurece (quantidade < 0) um hex, -1..1. */
function sombrear(hex: string, quantidade: number): string {
  const m = hex.replace('#', '');
  const r = parseInt(m.slice(0, 2), 16) || 0;
  const g = parseInt(m.slice(2, 4), 16) || 0;
  const b = parseInt(m.slice(4, 6), 16) || 0;
  const ajustar = (c: number) =>
    quantidade >= 0 ? clamp255(c + (255 - c) * quantidade) : clamp255(c * (1 + quantidade));
  const toHex = (c: number) => ajustar(c).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Cor ativa da seção: `--acento` (atualizada por Hero.astro a partir de `cat.cor`). */
function corAtiva(): string {
  if (typeof document === 'undefined') return '#1E6FFF';
  const v = getComputedStyle(document.documentElement).getPropertyValue('--acento').trim();
  return v || '#1E6FFF';
}

function paletaDe(cor: string): string[] {
  return [sombrear(cor, 0.35), cor, sombrear(cor, -0.3)];
}

// Grade mais espaçada que um botão (banner é bem maior — mantém a contagem
// de pixels/perf razoável mesmo em telas grandes).
const GAP = 10;
const VELOCIDADE = 35;

export default function PixelFundoHero(): JSX.Element {
  const areaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelsRef = useRef<Pixel[]>([]);
  const animationRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const timePreviousRef = useRef(performance.now());
  const reducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  ).current;

  /** origem: ponto (coords do canvas) de onde a onda nasce — o botão. */
  const initPixels = (origem?: { x: number; y: number }) => {
    const area = areaRef.current;
    const canvas = canvasRef.current;
    if (!area || !canvas) return;

    const rect = area.getBoundingClientRect();
    const width = Math.floor(rect.width);
    const height = Math.floor(rect.height);
    const ctx = canvas.getContext('2d');
    if (!ctx || width === 0 || height === 0) return;

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const origemX = origem?.x ?? width / 2;
    const origemY = origem?.y ?? height / 2;

    const cores = paletaDe(corAtiva());
    const pxs: Pixel[] = [];
    for (let x = 0; x < width; x += GAP) {
      for (let y = 0; y < height; y += GAP) {
        const cor = cores[Math.floor(Math.random() * cores.length)];
        const dx = x - origemX;
        const dy = y - origemY;
        const distancia = Math.sqrt(dx * dx + dy * dy);
        const delay = reducedMotion ? 0 : distancia;
        pxs.push(new Pixel(canvas, ctx, x, y, cor, getEffectiveSpeed(VELOCIDADE, reducedMotion), delay));
      }
    }
    pixelsRef.current = pxs;
  };

  const animar = (nome: 'appear' | 'disappear') => {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);

    const passo = () => {
      animationRef.current = requestAnimationFrame(passo);
      const agora = performance.now();
      const decorrido = agora - timePreviousRef.current;
      const intervalo = 1000 / 60;
      if (decorrido < intervalo) return;
      timePreviousRef.current = agora - (decorrido % intervalo);

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let todosOciosos = true;
      for (const pixel of pixelsRef.current) {
        pixel[nome]();
        if (!pixel.isIdle) todosOciosos = false;
      }
      if (todosOciosos && animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
    animationRef.current = requestAnimationFrame(passo);
  };

  /** Centro do botão, em coordenadas relativas à própria área (o banner). */
  const origemDoBotao = (botao: HTMLElement): { x: number; y: number } => {
    const areaRect = areaRef.current!.getBoundingClientRect();
    const botaoRect = botao.getBoundingClientRect();
    return {
      x: botaoRect.left + botaoRect.width / 2 - areaRect.left,
      y: botaoRect.top + botaoRect.height / 2 - areaRect.top,
    };
  };

  useEffect(() => {
    // O botão "Abrir catálogo" mora em outra árvore (HeroCarrosselCard.astro,
    // renderizado como HTML estático pelo Astro) — busca no DOM em vez de
    // props/contexto React, já que este componente não tem acesso a ele de
    // outra forma.
    const botao = document.querySelector<HTMLElement>('.hero-card-cta');
    if (!botao) return;

    const aoEntrar = () => {
      initPixels(origemDoBotao(botao));
      animar('appear');
    };
    const aoSair = () => animar('disappear');

    botao.addEventListener('mouseenter', aoEntrar);
    botao.addEventListener('mouseleave', aoSair);
    botao.addEventListener('focus', aoEntrar);
    botao.addEventListener('blur', aoSair);

    const area = areaRef.current;
    const observer = area
      ? new ResizeObserver(() => {
          // Só reposiciona a grade se o efeito já estiver ativo (evita init
          // à toa em cada resize antes de qualquer hover).
          if (pixelsRef.current.length > 0) initPixels(origemDoBotao(botao));
        })
      : null;
    if (area && observer) observer.observe(area);

    return () => {
      botao.removeEventListener('mouseenter', aoEntrar);
      botao.removeEventListener('mouseleave', aoSair);
      botao.removeEventListener('focus', aoEntrar);
      botao.removeEventListener('blur', aoSair);
      observer?.disconnect();
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={areaRef}
      aria-hidden="true"
      // Estilo inline, não CSS scoped do Astro: este <div> é montado pelo
      // React dentro do wrapper `<astro-island>`, sem o atributo de escopo
      // que o compilador Astro carimba nos elementos do próprio template —
      // uma regra `.pixel-fundo-hero {...}` em Hero.astro NUNCA bateria
      // aqui (foi o que causava o efeito só aparecer nos ~150px default do
      // <canvas> sem width/height, em vez do banner inteiro). `pointer-events:
      // none` porque quem dispara o efeito agora é o botão, não esta camada.
      style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}
