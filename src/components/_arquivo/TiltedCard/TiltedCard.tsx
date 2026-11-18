/** @jsxImportSource react */
import type { SpringOptions } from 'motion/react';
import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { prefereMenosMovimento } from '../../../lib/motion/reduced-motion';

interface TiltedCardProps {
  imageSrc: React.ComponentProps<'img'>['src'];
  altText?: string;
  captionText?: string;
  containerHeight?: React.CSSProperties['height'];
  containerWidth?: React.CSSProperties['width'];
  imageHeight?: React.CSSProperties['height'];
  imageWidth?: React.CSSProperties['width'];
  scaleOnHover?: number;
  rotateAmplitude?: number;
  showTooltip?: boolean;
  overlayContent?: React.ReactNode;
  displayOverlayContent?: boolean;
}

const springValues: SpringOptions = {
  damping: 30,
  stiffness: 100,
  mass: 2
};

export default function TiltedCard({
  imageSrc,
  altText = 'Tilted card image',
  captionText = '',
  containerHeight = '300px',
  containerWidth = '100%',
  imageHeight = '300px',
  imageWidth = '300px',
  scaleOnHover = 1.1,
  rotateAmplitude = 14,
  showTooltip = true,
  overlayContent = null,
  displayOverlayContent = false
}: TiltedCardProps) {
  const ref = useRef<HTMLElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useMotionValue(0), springValues);
  const rotateY = useSpring(useMotionValue(0), springValues);
  const scale = useSpring(1, springValues);
  const opacity = useSpring(0);
  const rotateFigcaption = useSpring(0, {
    stiffness: 350,
    damping: 30,
    mass: 1
  });

  const [lastY, setLastY] = useState(0);

  // Pedido (auditoria AIOX, item 1): "Efeitos-chave dependem de mouse, no
  // site mobile-first" — este card só "acorda" (tilt/escala) em
  // onMouseMove/onMouseEnter; em telas sem hover real (`(hover: none)`)
  // ele fica estático. Fallback: um `IntersectionObserver` no container
  // aplica um tilt leve fixo + escala ao entrar no centro da viewport
  // ("como se o mouse tivesse passado"), e desfaz ao sair — mesmo
  // princípio de "hover vira scroll" já usado em `CardsVidro.astro`.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(hover: none)').matches) return;
    if (prefereMenosMovimento()) return;
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          scale.set(scaleOnHover);
          rotateX.set(-6);
          rotateY.set(6);
        } else {
          scale.set(1);
          rotateX.set(0);
          rotateY.set(0);
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [scaleOnHover]);

  function handleMouse(e: React.MouseEvent<HTMLElement>) {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;

    const rotationX = (offsetY / (rect.height / 2)) * -rotateAmplitude;
    const rotationY = (offsetX / (rect.width / 2)) * rotateAmplitude;

    rotateX.set(rotationX);
    rotateY.set(rotationY);

    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);

    const velocityY = offsetY - lastY;
    rotateFigcaption.set(-velocityY * 0.6);
    setLastY(offsetY);
  }

  function handleMouseEnter() {
    scale.set(scaleOnHover);
    opacity.set(1);
  }

  function handleMouseLeave() {
    opacity.set(0);
    scale.set(1);
    rotateX.set(0);
    rotateY.set(0);
    rotateFigcaption.set(0);
  }

  return (
    <figure
      ref={ref}
      className="relative w-full h-full [perspective:800px] flex flex-col items-center justify-center"
      style={{
        height: containerHeight,
        width: containerWidth
      }}
      onMouseMove={handleMouse}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="relative [transform-style:preserve-3d]"
        style={{
          width: imageWidth,
          height: imageHeight,
          rotateX,
          rotateY,
          scale
        }}
      >
        <motion.img
          src={imageSrc}
          alt={altText}
          className="absolute top-0 left-0 object-cover rounded-[15px] will-change-transform [transform:translateZ(0)]"
          style={{
            width: imageWidth,
            height: imageHeight
          }}
        />

        {/* translateZ(0) — coplanar com a imagem (Z=0): fica preso ao
            rotateX/rotateY do pai (tilt 3D no hover) sem magnificar por
            perspectiva, senão abre fresta entre borda e imagem. */}
        {displayOverlayContent && overlayContent && (
          <motion.div className="absolute top-0 left-0 z-[2] h-full w-full will-change-transform [transform:translateZ(0px)]">
            {overlayContent}
          </motion.div>
        )}
      </motion.div>

      {captionText && (
        <figcaption className="pointer-events-none absolute bottom-3 left-1/2 z-[3] -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-[11px] font-medium text-white sm:hidden">
          {captionText}
        </figcaption>
      )}

      {showTooltip && (
        <motion.figcaption
          className="pointer-events-none absolute left-0 top-0 rounded-[4px] bg-white px-[10px] py-[4px] text-[10px] text-[#2d2d2d] opacity-0 z-[3] hidden sm:block"
          style={{
            x,
            y,
            opacity,
            rotate: rotateFigcaption
          }}
        >
          {captionText}
        </motion.figcaption>
      )}
    </figure>
  );
}
