/** @jsxImportSource react */
import * as React from 'react';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { prefereMenosMovimento } from '@/lib/motion/reduced-motion';

interface StickyBannerProps extends React.ComponentProps<'div'> {
  /** Espera (ms) antes de a tarja entrar animada. Default: entra imediatamente. */
  delayMs?: number;
  /** Mostra o botão de fechar. Default: true. */
  dismissible?: boolean;
}

/**
 * Tarja de aviso no topo da página, entra com animação (abre + fade) após
 * `delayMs`. Baseada no padrão Aceternity `StickyBanner`, adaptada à stack
 * do projeto (motion/react já usado em TiltedCard.tsx; `prefereMenosMovimento`
 * corta a animação sob `prefers-reduced-motion`).
 */
export function StickyBanner({ className, children, delayMs = 0, dismissible = true, ...props }: StickyBannerProps) {
  const [visivel, setVisivel] = useState(delayMs <= 0);
  const [fechada, setFechada] = useState(false);

  useEffect(() => {
    if (delayMs <= 0) return;
    const id = setTimeout(() => setVisivel(true), delayMs);
    return () => clearTimeout(id);
  }, [delayMs]);

  const aberta = visivel && !fechada;
  const semMovimento = typeof window !== 'undefined' && prefereMenosMovimento();

  // Skin "sufgang": faixa de aviso ACIMA do cabeçalho fixo (Cabecalho.astro),
  // que rola junto com a página — não é mais `sticky` (cobria o cabeçalho).
  // Fechada ela colapsa a altura (0), sem deixar faixa vazia no topo.
  return (
    <motion.div
      role="status"
      initial={false}
      animate={
        semMovimento
          ? { height: aberta ? 'auto' : 0, opacity: aberta ? 1 : 0 }
          : { height: aberta ? 'auto' : 0, opacity: aberta ? 1 : 0, y: aberta ? 0 : -12 }
      }
      transition={{ duration: semMovimento ? 0 : 0.4, ease: 'easeOut' }}
      style={{ pointerEvents: aberta ? 'auto' : 'none', overflow: 'hidden' }}
      aria-hidden={!aberta}
      className={cn('relative w-full bg-[var(--acento)] text-white', className)}
      {...props}
    >
      <div className="relative flex min-h-10 w-full items-center justify-center gap-3 px-10 py-2 text-center text-xs uppercase tracking-[0.14em] [font-family:var(--f-display)]">
        {children}
        {dismissible && (
          <button
            type="button"
            onClick={() => setFechada(true)}
            aria-label="Fechar aviso"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 transition hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
