/** @jsxImportSource react */
/**
 * CardVideoPost — cabeçalho de perfil + vídeo, adaptado do modelo "Card11"
 * (post estilo Instagram) que o dono colou. Pedido explícito: "ajuste a
 * parte da imagem e perfil nos cards, mas não do corpo, como legenda e
 * ícones abaixo" — por isso NÃO tem a barra de curtir/comentar/compartilhar
 * nem a legenda do modelo original; é só CardHeader (avatar + nome/handle)
 * + a mídia, dentro de um dos 3 `CardsVidro` (glass).
 *
 * Sem o ícone de "verificado" do modelo (`BadgeCheckIcon`) — não temos
 * confirmação de que o perfil é verificado, e um selo desses é uma
 * afirmação, não só decoração.
 *
 * Sem o botão "•••" do header original: o card inteiro já é um `<a>` em
 * `CardsVidro.astro` (leva pra galeria de vídeos) — aninhar um `<button>`
 * dentro de um `<a>` é HTML inválido e brigaria com o clique do card.
 *
 * Avatar sem `AvatarImage` (não existe foto de perfil real no projeto —
 * `SigaTikTok.astro` também só usa iniciais desenhadas em canvas) — só
 * `AvatarFallback`, que é exatamente pra isso.
 *
 * Vídeo real (pedido: "ajuste esses videos nos cards", 3 clipes do dono),
 * recortados pros 6s iniciais e recomprimidos (H.264 CRF 30, sem áudio,
 * 480px) em `public/cards-vidro/`. Autoplay+loop+muted simples.
 *
 * EFEITO "câmera + zoom-troca" (pedido: recriar a gravação de tela
 * `Gravação de Tela 2026-09-25 225014.mp4`): por cima do vídeo fica um HUD de
 * câmera (selo REC com timer, mostrador de zoom com agulha, leitura amarela
 * em "×" e botão de gravar) e, em laço (~4,3 s), o vídeo faz o "zoom-punch":
 *   1. parado, leitura oscilando perto de 24×;
 *   2. recua: encolhe + desfoca até o plano aberto (leitura → 0,5×);
 *   3. no fundo do recuo troca pro PRÓXIMO vídeo da `playlist` e zera o timer;
 *   4. volta num zoom forte (passa de 1 e assenta), leitura sobe até 24×.
 * Cada card começa numa posição diferente da playlist e com um atraso, pra
 * não trocarem todos juntos. Movimento reduzido: sem laço (só HUD estático).
 * O HUD é decorativo (`aria-hidden`, `pointer-events:none` — o card é um link).
 * Tudo animado via Web Animations + refs (nenhum re-render por frame).
 */
import { useEffect, useRef } from 'react';
import { prefereMenosMovimento } from '../../lib/motion/reduced-motion';

interface Faixa {
  video: string;
  poster: string;
}

interface CardVideoPostProps {
  nome: string;
  handle: string;
  fallback: string;
  /** vídeos que o card alterna no zoom-troca (1º = o que aparece de início) */
  playlist: Faixa[];
  alt: string;
  /** índice da playlist em que este card começa (defasa os 3 cards) */
  inicio?: number;
  /** espera antes do 1º ciclo, em ms (defasa os 3 cards) */
  atrasoMs?: number;
  /** numeração editorial do card ("01/03") */
  numero?: number;
  total?: number;
}

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 24;
const ARCO = 110; // graus que o mostrador cobre
const MARCAS = [0.5, 1, 2, 4, 8, 24];

/** 0..1 na escala logarítmica do mostrador */
const posDe = (z: number) => Math.log(z / ZOOM_MIN) / Math.log(ZOOM_MAX / ZOOM_MIN);
const anguloDe = (z: number) => (posDe(z) - 0.5) * ARCO;
const easeIn = (k: number) => k * k * k;
const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);

const CX = 50;
const CY = 50;
const R = 44;
const pol = (grau: number, raio: number) => {
  const a = (grau * Math.PI) / 180;
  // arredondado: sem isso o SSR e o cliente serializam casas decimais diferentes
  // e o React acusa "hydration mismatch" nas marcas do mostrador
  return { x: +(CX + raio * Math.sin(a)).toFixed(3), y: +(CY - raio * Math.cos(a)).toFixed(3) };
};
const TICKS = Array.from({ length: 31 }, (_, i) => {
  const grau = (i / 30 - 0.5) * ARCO;
  const grande = i % 5 === 0;
  return { i, a: pol(grau, R), b: pol(grau, R - (grande ? 5 : 3)), grande };
});

const tempoTexto = (seg: number) => `00:00:${String(seg % 60).padStart(2, '0')}`;

export default function CardVideoPost({
  nome,
  handle,
  playlist,
  alt,
  inicio = 0,
  atrasoMs = 0,
  numero = 1,
  total = 1,
}: CardVideoPostProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const palcoRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const leituraRef = useRef<HTMLSpanElement>(null);
  const tempoRef = useRef<HTMLSpanElement>(null);
  const primeira = playlist[inicio % playlist.length];

  useEffect(() => {
    const video = videoRef.current;
    const palco = palcoRef.current;
    const hud = hudRef.current;
    const leitura = leituraRef.current;
    const tempo = tempoRef.current;
    if (!video || !palco || !hud || !leitura || !tempo) return;

    let vivo = true;
    let seg = 0;
    let atual: Animation | undefined;
    const timers = new Set<number>();

    const pinta = (z: number) => {
      leitura.textContent = `${z.toFixed(1)}×`;
      hud.style.setProperty('--agulha', `${anguloDe(z)}deg`);
    };
    const marca = () => {
      tempo.textContent = tempoTexto(seg);
    };
    const espera = (ms: number) =>
      new Promise<void>((ok) => {
        const id = window.setTimeout(() => {
          timers.delete(id);
          ok();
        }, ms);
        timers.add(id);
      });
    // interpola em escala log (o mostrador é log) e escreve a leitura
    const tween = (de: number, ate: number, ms: number, ease: (k: number) => number) =>
      new Promise<void>((ok) => {
        const t0 = performance.now();
        const passo = (t: number) => {
          if (!vivo) return ok();
          const k = Math.min(1, (t - t0) / ms);
          pinta(de * Math.pow(ate / de, ease(k)));
          if (k < 1) requestAnimationFrame(passo);
          else ok();
        };
        requestAnimationFrame(passo);
      });
    const roda = (frames: Keyframe[], opcoes: KeyframeAnimationOptions) => {
      const nova = palco.animate(frames, { ...opcoes, fill: 'forwards' });
      atual?.cancel(); // não acumula animações a cada ciclo
      atual = nova;
      return nova.finished.then(
        () => undefined,
        () => undefined, // cancelada na limpeza
      );
    };
    const trocar = (i: number) => {
      const faixa = playlist[i];
      video.poster = faixa.poster;
      video.src = faixa.video;
      video.load();
      void video.play().catch(() => undefined);
      seg = 0;
      marca();
    };

    pinta(23);
    marca();
    const relogio = window.setInterval(() => {
      seg += 1;
      marca();
    }, 1000);

    const laco = async () => {
      await espera(atrasoMs);
      let i = inicio % playlist.length;
      while (vivo) {
        // 1. parado: leitura oscila perto de 24× (como no vídeo)
        const fim = performance.now() + 2600;
        while (vivo && performance.now() < fim) {
          pinta(21.5 + Math.random() * 2.5);
          await espera(380);
        }
        if (!vivo) break;
        // 2. recua até o plano aberto
        await Promise.all([
          roda(
            [
              { transform: 'scale(1)', filter: 'blur(0px)', opacity: 1 },
              { transform: 'scale(0.55)', filter: 'blur(5px)', opacity: 0.6 },
            ],
            { duration: 520, easing: 'cubic-bezier(0.6, 0, 0.3, 1)' },
          ),
          tween(23, ZOOM_MIN, 520, easeIn),
        ]);
        if (!vivo) break;
        // 3. no fundo do recuo, troca o vídeo
        i = (i + 1) % playlist.length;
        trocar(i);
        await espera(220);
        if (!vivo) break;
        // 4. volta num zoom forte e assenta
        await Promise.all([
          roda(
            [
              { transform: 'scale(0.55)', filter: 'blur(5px)', opacity: 0.6 },
              { transform: 'scale(1.14)', filter: 'blur(2px)', opacity: 1, offset: 0.6 },
              { transform: 'scale(1)', filter: 'blur(0px)', opacity: 1 },
            ],
            { duration: 800, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
          ),
          tween(ZOOM_MIN, ZOOM_MAX, 700, easeOut),
        ]);
      }
    };

    if (!prefereMenosMovimento() && playlist.length > 1) void laco();
    else pinta(24);

    return () => {
      vivo = false;
      window.clearInterval(relogio);
      timers.forEach((id) => window.clearTimeout(id));
      atual?.cancel();
    };
  }, [playlist, inicio, atrasoMs]);

  return (
    <div className="flex h-full w-full flex-col">
      {/* legenda editorial: nome + handle à esquerda, numeração à direita, fio embaixo */}
      <div
        className="flex items-baseline justify-between gap-2 border-b border-white/25 px-3 py-2.5 uppercase"
        style={{ fontFamily: 'var(--ed-rotulo-fonte)' }}
      >
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-[10px] font-medium tracking-[0.14em] text-white">{nome}</span>
          <span className="truncate text-[9px] font-normal tracking-[0.1em] text-white/55">{handle}</span>
        </span>
        <span className="font-mono text-[9px] tracking-wider text-white/70">
          {String(numero).padStart(2, '0')}/{String(total).padStart(2, '0')}
        </span>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div ref={palcoRef} className="h-full w-full will-change-transform">
          <video
            ref={videoRef}
            src={primeira.video}
            poster={primeira.poster}
            aria-label={alt}
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        </div>

        {/* HUD de câmera — decorativo */}
        <div
          ref={hudRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 select-none"
          style={{ ['--agulha' as string]: `${anguloDe(24)}deg` }}
        >
          <span className="absolute left-2 top-2 rounded-none bg-[#e5252f] px-1.5 py-[2px] font-mono text-[9px] font-bold leading-none tracking-wide text-white">
            <span ref={tempoRef}>00:00:00</span>
          </span>

          <div className="absolute inset-x-0 bottom-2 flex flex-col items-center">
            <svg viewBox="0 0 100 40" className="w-[74%] overflow-visible" role="presentation">
              {TICKS.map((t) => (
                <line
                  key={t.i}
                  x1={t.a.x}
                  y1={t.a.y - 10}
                  x2={t.b.x}
                  y2={t.b.y - 10}
                  stroke="rgba(255,255,255,0.75)"
                  strokeWidth={t.grande ? 0.9 : 0.5}
                />
              ))}
              {MARCAS.map((z) => {
                const p = pol((posDe(z) - 0.5) * ARCO, R - 10);
                return (
                  <text
                    key={z}
                    x={p.x}
                    y={p.y - 10}
                    textAnchor="middle"
                    fontSize="5.2"
                    fill="rgba(255,255,255,0.85)"
                    style={{ fontFamily: 'var(--f-mono, monospace)' }}
                  >
                    {z}
                  </text>
                );
              })}
              {/* agulha amarela: gira em volta do centro do arco */}
              <g
                style={{
                  transformOrigin: `${CX}px ${CY - 10}px`,
                  transform: 'rotate(var(--agulha))',
                }}
              >
                <path
                  d={`M ${CX - 2.2} ${CY - 10 - R - 5.5} L ${CX + 2.2} ${CY - 10 - R - 5.5} L ${CX} ${CY - 10 - R - 1.5} Z`}
                  fill="#f5c542"
                />
              </g>
            </svg>
            <span
              ref={leituraRef}
              className="-mt-1 font-mono text-[10px] font-bold leading-none text-[#f5c542]"
            >
              24.0×
            </span>
            <span className="mt-1.5 grid size-[18px] place-items-center rounded-none border-2 border-white/80">
              <span className="size-2.5 rounded-none bg-[#e5252f]" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
