/** @jsxImportSource react */
/**
 * FiosDestaques — envolve os 3 `TiltedCard` de "Destaques da semana" com um
 * fio (linha SVG) por card: o fio desce animado pelo scroll (mesmo espírito
 * do `GoogleGeminiEffect` da Aceternity — `motion/react`, progresso de
 * scroll mapeado em `pathLength`) e, ao "chegar" no card, acende uma borda
 * nele (pedido: "faca um fio de linha para cada um, que ele desça e va
 * cada um para o card ... fazendo com que o card crie uma borda a chegada
 * do fio").
 *
 * O progresso de scroll é calculado manualmente (listener de `scroll` +
 * `useMotionValue`) em vez do hook `useScroll` do `motion/react`: `useScroll`
 * toca APIs de browser fora de um efeito e quebra o SSR do Astro
 * ("Unable to render FiosDestaques!" — window/document indisponíveis no
 * server). `useMotionValue`/`useTransform` sozinhos já são SSR-safe (mesmo
 * padrão usado em TiltedCard.tsx).
 *
 * Posições de origem/alvo são medidas em runtime (getBoundingClientRect),
 * não hardcoded — funciona tanto na coluna do mobile quanto na linha do
 * desktop (ver breakpoint 700px, herdado do antigo `.tres-cards`).
 */
import * as React from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'motion/react';
import TiltedCard from './TiltedCard';
import { prefereMenosMovimento } from '@/lib/motion/reduced-motion';

interface CardSpec {
  imageSrc: string;
  altText: string;
  captionText: string;
}

interface Ponto {
  x: number;
  y: number;
}

/** Altura (px) da faixa acima dos cards onde os fios são desenhados. */
const ALTURA_FIOS = 64;

/** Janela de scroll [início, fim] em que o fio do card `i` (de `n`) desenha. */
function faixaDoFio(i: number, n: number): [number, number] {
  const duracao = 0.6;
  const espalhamento = n > 1 ? 0.4 / (n - 1) : 0;
  const inicio = i * espalhamento;
  return [inicio, Math.min(1, inicio + duracao)];
}

export default function FiosDestaques({ cards }: { cards: CardSpec[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [origem, setOrigem] = useState<Ponto>({ x: 0, y: 0 });
  const [alvos, setAlvos] = useState<Ponto[]>([]);
  const [largura, setLargura] = useState(0);
  // Começa true em ambos os lados (SSR não tem `window`/matchMedia) — evita
  // mismatch de hidratação; a checagem real só roda no efeito, client-only.
  const [animado, setAnimado] = useState(true);

  useEffect(() => {
    if (prefereMenosMovimento()) setAnimado(false);
  }, []);

  useLayoutEffect(() => {
    if (!animado) return;
    const medir = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const wrapRect = wrap.getBoundingClientRect();
      setLargura(wrapRect.width);
      setOrigem({ x: wrapRect.width / 2, y: 0 });
      setAlvos(
        itemRefs.current.map((el) => {
          if (!el) return { x: wrapRect.width / 2, y: ALTURA_FIOS };
          const r = el.getBoundingClientRect();
          return { x: r.left - wrapRect.left + r.width / 2, y: ALTURA_FIOS };
        }),
      );
    };
    medir();
    const ro = new ResizeObserver(medir);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener('resize', medir);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', medir);
    };
  }, [animado, cards.length]);

  // Progresso 0→1: 0 quando o topo do wrapper está a 85% da viewport (entrando
  // por baixo), 1 quando chega a 35% — equivalente ao offset
  // `["start 0.85", "start 0.35"]` que o `useScroll` do motion/react usaria.
  const scrollYProgress = useMotionValue(0);

  useEffect(() => {
    if (!animado) return;
    const PONTO_INICIO = 0.85;
    const PONTO_FIM = 0.35;
    const atualizar = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const vh = window.innerHeight;
      const p0 = vh * PONTO_INICIO;
      const p1 = vh * PONTO_FIM;
      const top = wrap.getBoundingClientRect().top;
      const progresso = (p0 - top) / (p0 - p1);
      scrollYProgress.set(Math.min(1, Math.max(0, progresso)));
    };
    atualizar();
    window.addEventListener('scroll', atualizar, { passive: true });
    window.addEventListener('resize', atualizar);
    return () => {
      window.removeEventListener('scroll', atualizar);
      window.removeEventListener('resize', atualizar);
    };
  }, [animado]);

  return (
    <div
      ref={wrapRef}
      className="relative w-screen mx-[calc(50%-50vw)] my-10 px-[clamp(10px,3vw,32px)]"
      style={{ paddingTop: animado ? ALTURA_FIOS : 0 }}
    >
      {animado && largura > 0 && (
        <svg
          className="pointer-events-none absolute inset-x-0 top-0 z-10 w-full"
          width={largura}
          height={ALTURA_FIOS}
          viewBox={`0 0 ${largura} ${ALTURA_FIOS}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {alvos.map((alvo, i) => (
            <Fio key={i} origem={origem} alvo={alvo} scrollYProgress={scrollYProgress} faixa={faixaDoFio(i, alvos.length)} />
          ))}
        </svg>
      )}
      <div className="flex flex-col gap-4 min-[700px]:flex-row min-[700px]:gap-5">
        {cards.map((c, i) => (
          <ItemComBorda
            key={c.captionText}
            card={c}
            itemRef={(el) => {
              itemRefs.current[i] = el;
            }}
            scrollYProgress={scrollYProgress}
            faixa={faixaDoFio(i, cards.length)}
            animado={animado}
          />
        ))}
      </div>
    </div>
  );
}

function Fio({
  origem,
  alvo,
  scrollYProgress,
  faixa,
}: {
  origem: Ponto;
  alvo: Ponto;
  scrollYProgress: MotionValue<number>;
  faixa: [number, number];
}) {
  const comprimento = useTransform(scrollYProgress, faixa, [0, 1], { clamp: true });
  const meioY = (origem.y + alvo.y) / 2;
  const d = `M ${origem.x} ${origem.y} C ${origem.x} ${meioY}, ${alvo.x} ${meioY}, ${alvo.x} ${alvo.y}`;

  return (
    <motion.path
      d={d}
      strokeWidth={2}
      strokeLinecap="round"
      fill="none"
      initial={{ pathLength: 0 }}
      style={{ pathLength: comprimento, stroke: 'var(--acento)' }}
    />
  );
}

function ItemComBorda({
  card,
  itemRef,
  scrollYProgress,
  faixa,
  animado,
}: {
  card: CardSpec;
  itemRef: (el: HTMLDivElement | null) => void;
  scrollYProgress: MotionValue<number>;
  faixa: [number, number];
  animado: boolean;
}) {
  // Mesmo cálculo do <Fio> desse índice — fica em sincronia exata com o
  // desenho da linha (0 = não começou, 1 = fio completamente descido).
  const comprimento = useTransform(scrollYProgress, faixa, [0, 1], { clamp: true });
  // Binário: só acende quando o fio TERMINOU de descer (pedido: "quando a
  // linha tiver completamente descido"), não durante o percurso.
  const chegou = useTransform(comprimento, (v) => (v >= 0.999 ? 1 : 0));
  // useSpring suaviza o "snap" de 0→1 num aceso rápido, não instantâneo/seco.
  const brilho = useSpring(chegou, { stiffness: 420, damping: 26, mass: 0.6 });
  const escala = useTransform(brilho, [0, 1], [1.06, 1]);

  return (
    <div ref={itemRef} className="relative w-full aspect-[2752/1536] min-[700px]:flex-1 min-[700px]:min-w-0">
      <TiltedCard
        imageSrc={card.imageSrc}
        altText={card.altText}
        captionText={card.captionText}
        containerHeight="100%"
        containerWidth="100%"
        imageHeight="100%"
        imageWidth="100%"
        rotateAmplitude={12}
        scaleOnHover={1.05}
        displayOverlayContent
        overlayContent={
          // Vive DENTRO do motion.div com rotateX/rotateY/scale + translateZ(30px)
          // do TiltedCard — por isso a borda tilta/avança em 3D junto com o
          // card no hover (pedido: "quando ele se materializar em 3d para
          // frente a linha esteja com ele"), em vez de ficar plana por fora.
          <motion.div
            aria-hidden="true"
            className="pointer-events-none h-full w-full rounded-[15px] border-2 border-[var(--acento)] shadow-[0_0_6px_var(--acento),0_0_32px_var(--acento)]"
            style={{ opacity: animado ? brilho : 1, scale: animado ? escala : 1 }}
          />
        }
      />
    </div>
  );
}
