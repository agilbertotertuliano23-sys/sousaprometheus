/** @jsxImportSource react */
import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { prefereMenosMovimento } from '../../../lib/motion/reduced-motion';

interface MenuItemData {
  link: string;
  text: string;
  image: string;
  fontFamily?: string;
  textColor?: string;
  marqueeBgColor?: string;
  marqueeTextColor?: string;
  marqueeText?: string;
}

interface FlowingMenuProps {
  items?: MenuItemData[];
  speed?: number;
  textColor?: string;
  bgColor?: string;
  marqueeBgColor?: string;
  marqueeTextColor?: string;
  borderColor?: string;
  /** Painel do marquee nasce fechado e só abre no mouseenter (com fallback
   * de scroll pra telas sem hover). Default: false — nasce sempre aberto,
   * sem reagir a mouse (pedido anterior, ainda vale pra FlowingMenuDivulgacao). */
  interativo?: boolean;
}

interface MenuItemProps extends MenuItemData {
  speed: number;
  textColor: string;
  marqueeBgColor: string;
  marqueeTextColor: string;
  borderColor: string;
  isFirst: boolean;
  interativo: boolean;
}

const FlowingMenu: React.FC<FlowingMenuProps> = ({
  items = [],
  speed = 15,
  textColor = '#fff',
  bgColor = '#120F17',
  marqueeBgColor = '#fff',
  marqueeTextColor = '#120F17',
  borderColor = '#fff',
  interativo = false
}) => {
  return (
    <div className="w-full h-full overflow-hidden" style={{ backgroundColor: bgColor }}>
      <nav className="flex flex-col h-full m-0 p-0">
        {items.map((item, idx) => (
          <MenuItem
            key={idx}
            {...item}
            speed={speed}
            textColor={item.textColor ?? textColor}
            marqueeBgColor={item.marqueeBgColor ?? marqueeBgColor}
            marqueeTextColor={item.marqueeTextColor ?? marqueeTextColor}
            borderColor={borderColor}
            isFirst={idx === 0}
            interativo={interativo}
          />
        ))}
      </nav>
    </div>
  );
};

const MenuItem: React.FC<MenuItemProps> = ({
  link,
  text,
  image,
  fontFamily,
  speed,
  textColor,
  marqueeBgColor,
  marqueeTextColor,
  borderColor,
  isFirst,
  marqueeText,
  interativo
}) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const marqueeInnerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);
  const repetitions = 6;

  const animationDefaults = { duration: 0.6, ease: 'expo' };

  const findClosestEdge = (mouseX: number, mouseY: number, width: number, height: number): 'top' | 'bottom' => {
    const topEdgeDist = Math.pow(mouseX - width / 2, 2) + Math.pow(mouseY, 2);
    const bottomEdgeDist = Math.pow(mouseX - width / 2, 2) + Math.pow(mouseY - height, 2);
    return topEdgeDist < bottomEdgeDist ? 'top' : 'bottom';
  };

  const openMarquee = (edge: 'top' | 'bottom') => {
    if (!marqueeRef.current || !marqueeInnerRef.current) return;
    gsap
      .timeline({ defaults: animationDefaults })
      .set(marqueeRef.current, { y: edge === 'top' ? '-101%' : '101%' }, 0)
      .set(marqueeInnerRef.current, { y: edge === 'top' ? '101%' : '-101%' }, 0)
      .to([marqueeRef.current, marqueeInnerRef.current], { y: '0%' }, 0);
  };

  const closeMarquee = (edge: 'top' | 'bottom') => {
    if (!marqueeRef.current || !marqueeInnerRef.current) return;
    gsap
      .timeline({ defaults: animationDefaults })
      .to(marqueeRef.current, { y: edge === 'top' ? '-101%' : '101%' }, 0)
      .to(marqueeInnerRef.current, { y: edge === 'top' ? '101%' : '-101%' }, 0);
  };

  const handleMouseEnter = (ev: React.MouseEvent<HTMLAnchorElement>) => {
    if (!itemRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    openMarquee(findClosestEdge(ev.clientX - rect.left, ev.clientY - rect.top, rect.width, rect.height));
  };

  const handleMouseLeave = (ev: React.MouseEvent<HTMLAnchorElement>) => {
    if (!itemRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    closeMarquee(findClosestEdge(ev.clientX - rect.left, ev.clientY - rect.top, rect.width, rect.height));
  };

  // `interativo`: fallback de scroll pra telas sem hover real (`(hover: none)`,
  // o caso comum aqui: catálogo pensado pra abrir no webview do TikTok) — sem
  // isso o marquee nunca abriria em mobile (só reage a mouseenter/mouseleave).
  useEffect(() => {
    if (!interativo) return;
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(hover: none)').matches) return;
    if (prefereMenosMovimento()) return;
    const el = itemRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) openMarquee('bottom');
        else closeMarquee('bottom');
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [interativo]);

  useEffect(() => {
    const setupMarquee = () => {
      if (!marqueeInnerRef.current) return;
      const marqueeContent = marqueeInnerRef.current.querySelector('.marquee-part') as HTMLElement;
      if (!marqueeContent) return;
      const contentWidth = marqueeContent.offsetWidth;
      if (!contentWidth || contentWidth <= 0) return;

      if (animationRef.current) {
        animationRef.current.kill();
      }

      animationRef.current = gsap.to(marqueeInnerRef.current, {
        x: -contentWidth,
        duration: speed,
        ease: 'none',
        repeat: -1
      });
    };

    let resizeObserver: ResizeObserver | null = null;
    const marqueeContent = marqueeInnerRef.current?.querySelector('.marquee-part') as HTMLElement;

    if (marqueeContent && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        setupMarquee();
      });
      resizeObserver.observe(marqueeContent);
    }

    const timer = setTimeout(setupMarquee, 50);

    return () => {
      clearTimeout(timer);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, [text, marqueeText, image, speed]);

  return (
    <div
      className="flex-1 relative overflow-hidden text-center group"
      ref={itemRef}
      style={{ borderTop: isFirst ? 'none' : `1px solid ${borderColor}` }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="w-full h-full bg-black transition-transform duration-700 ease-out group-hover:scale-105" />
      </div>
      <a
        className="flex items-center justify-center h-full relative z-10 cursor-pointer uppercase no-underline font-semibold text-[4vh]"
        href={link}
        onMouseEnter={interativo ? handleMouseEnter : undefined}
        onMouseLeave={interativo ? handleMouseLeave : undefined}
        style={{ color: textColor, fontFamily: fontFamily ?? 'inherit', textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}
      >
        {text}
      </a>
      {/* `interativo`: painel nasce fechado (fora da tela) e só abre no
          mouseenter/scroll — ver `handleMouseEnter`/fallback acima. Sem
          `interativo`: nasce sempre visível, sem reagir a mouse. */}
      <div
        className={`absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-20 ${interativo ? 'translate-y-[101%]' : ''}`}
        ref={marqueeRef}
        style={{ backgroundColor: marqueeBgColor }}
      >
        <div className="h-full w-fit flex" ref={marqueeInnerRef}>
          {[...Array(repetitions)].map((_, idx) => (
            <div className="marquee-part flex items-center flex-shrink-0" key={idx} style={{ color: marqueeTextColor, fontFamily: fontFamily ?? 'inherit' }}>
              <span className="whitespace-nowrap uppercase font-normal text-[4vh] leading-[1] px-[1vw]">{marqueeText ?? text}</span>
              <div
                className="w-[200px] h-[7vh] my-[2em] mx-[2vw] py-[1em] rounded-[50px] bg-cover bg-center"
                style={{ backgroundImage: `url(${image})` }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FlowingMenu;
