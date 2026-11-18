/** @jsxImportSource react */
import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

// Componente Link fallback para ambientes sem react-router-dom (ex: Astro)
const Link = ({ to, children, ...props }: { to: string; children?: React.ReactNode; [key: string]: any }) => (
  <a href={to} {...props}>
    {children}
  </a>
);

export type PillNavItem = {
  label: string;
  href: string;
  ariaLabel?: string;
};

export interface PillNavProps {
  logo?: string;
  logoAlt?: string;
  items: PillNavItem[];
  activeHref?: string;
  className?: string;
  ease?: string;
  baseColor?: string;
  pillColor?: string;
  hoveredPillTextColor?: string;
  pillTextColor?: string;
  onMobileMenuClick?: () => void;
  initialLoadAnimation?: boolean;
}

const PillNav: React.FC<PillNavProps> = ({
  logo,
  logoAlt = 'Logo',
  items,
  activeHref,
  className = '',
  ease = 'power3.out',
  baseColor = '#fff',
  pillColor = '#120F17',
  hoveredPillTextColor = '#120F17',
  pillTextColor = '#ffffff',
  onMobileMenuClick,
  initialLoadAnimation = true
}) => {
  const resolvedPillTextColor = pillTextColor ?? '#ffffff';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const circleRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const tlRefs = useRef<Array<gsap.core.Timeline | null>>([]);
  const activeTweenRefs = useRef<Array<gsap.core.Tween | null>>([]);
  const logoImgRef = useRef<HTMLImageElement | null>(null);
  const logoTweenRef = useRef<gsap.core.Tween | null>(null);
  const hamburgerRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const navItemsRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLAnchorElement | HTMLElement | null>(null);

  useEffect(() => {
    const layout = () => {
      circleRefs.current.forEach(circle => {
        if (!circle?.parentElement) return;

        const pill = circle.parentElement as HTMLElement;
        const rect = pill.getBoundingClientRect();
        const { width: w, height: h } = rect;
        if (!w || !h || h === 0) return;

        const R = ((w * w) / 4 + h * h) / (2 * h);
        const D = Math.ceil(2 * R) + 2;
        const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
        const originY = D - delta;

        circle.style.width = `${D}px`;
        circle.style.height = `${D}px`;
        circle.style.bottom = `-${delta}px`;

        gsap.set(circle, {
          xPercent: -50,
          scale: 0,
          transformOrigin: `50% ${originY}px`
        });

        const label = pill.querySelector<HTMLElement>('.pill-label');
        const white = pill.querySelector<HTMLElement>('.pill-label-hover');

        if (label) gsap.set(label, { y: 0 });
        if (white) gsap.set(white, { y: h + 12, opacity: 0 });

        const index = circleRefs.current.indexOf(circle);
        if (index === -1) return;

        tlRefs.current[index]?.kill();
        const tl = gsap.timeline({ paused: true });

        tl.to(circle, { scale: 1.2, xPercent: -50, duration: 2, ease, overwrite: 'auto' }, 0);

        if (label) {
          tl.to(label, { y: -(h + 12), duration: 2, ease, overwrite: 'auto' }, 0);
        }

        if (white) {
          gsap.set(white, { y: h + 12, opacity: 0 });
          tl.to(white, { y: 0, opacity: 1, duration: 2, ease, overwrite: 'auto' }, 0);
        }

        tlRefs.current[index] = tl;
      });
    };

    layout();

    const onResize = () => layout();
    window.addEventListener('resize', onResize);

    if (document.fonts) {
      document.fonts.ready.then(layout).catch(() => {});
    }

    const menu = mobileMenuRef.current;
    if (menu) {
      gsap.set(menu, { visibility: 'hidden', opacity: 0, scaleY: 1, y: 0 });
    }

    if (initialLoadAnimation) {
      const logoEl = logoRef.current;
      const navItems = navItemsRef.current;

      if (logoEl) {
        gsap.set(logoEl, { scale: 0 });
        gsap.to(logoEl, {
          scale: 1,
          duration: 0.6,
          ease
        });
      }

      if (navItems) {
        gsap.set(navItems, { opacity: 0, y: -5 });
        gsap.to(navItems, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease
        });
      }
    }

    return () => window.removeEventListener('resize', onResize);
  }, [items, ease, initialLoadAnimation]);

  const handleEnter = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(tl.duration(), {
      duration: 0.3,
      ease,
      overwrite: 'auto'
    });
  };

  const handleLeave = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(0, {
      duration: 0.2,
      ease,
      overwrite: 'auto'
    });
  };

  const handleLogoEnter = () => {
    const img = logoImgRef.current;
    if (!img) return;
    logoTweenRef.current?.kill();
    gsap.set(img, { rotate: 0 });
    logoTweenRef.current = gsap.to(img, {
      rotate: 360,
      duration: 0.2,
      ease,
      overwrite: 'auto'
    });
  };

  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);

    const hamburger = hamburgerRef.current;
    const menu = mobileMenuRef.current;

    if (hamburger) {
      const lines = hamburger.querySelectorAll('.hamburger-line');
      if (newState) {
        gsap.to(lines[0], { rotation: 45, y: 3, duration: 0.3, ease });
        gsap.to(lines[1], { rotation: -45, y: -3, duration: 0.3, ease });
      } else {
        gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.3, ease });
        gsap.to(lines[1], { rotation: 0, y: 0, duration: 0.3, ease });
      }
    }

    if (menu) {
      if (newState) {
        gsap.set(menu, { visibility: 'visible' });
        gsap.fromTo(
          menu,
          { opacity: 0, y: 10, scaleY: 1 },
          {
            opacity: 1,
            y: 0,
            scaleY: 1,
            duration: 0.3,
            ease,
            transformOrigin: 'top center'
          }
        );
      } else {
        gsap.to(menu, {
          opacity: 0,
          y: 10,
          scaleY: 1,
          duration: 0.2,
          ease,
          transformOrigin: 'top center',
          onComplete: () => {
            gsap.set(menu, { visibility: 'hidden' });
          }
        });
      }
    }

    onMobileMenuClick?.();
  };

  const isExternalLink = (href: string) =>
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('//') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('#');

  const isRouterLink = (href?: string) => href && !isExternalLink(href);

  const cssVars = {
    ['--base']: baseColor,
    ['--pill-bg']: pillColor,
    ['--hover-text']: hoveredPillTextColor,
    ['--pill-text']: resolvedPillTextColor,
    ['--nav-h']: '40px',
    ['--logo']: '32px',
    ['--pill-pad-x']: 'clamp(10px, 1.2vw, 20px)',
    ['--pill-gap']: 'clamp(8px, 1.6vw, 22px)'
  } as React.CSSProperties;

  return (
    <div className="relative w-full flex items-center z-[1000] m-0 p-0">
      <nav
        className={`relative w-full flex items-center justify-between box-border rounded-full border border-white/60 px-3 py-1 bg-[#0A0B0C] overflow-hidden ${className}`}
        aria-label="Primary"
        style={cssVars}
      >
        {/* Logo na ponta esquerda com respiro */}
        <div className="flex items-center flex-none mr-3">
          {logo && (
            isRouterLink(items?.[0]?.href) ? (
              <Link
                to={items[0].href}
                aria-label="Home"
                onMouseEnter={handleLogoEnter}
                role="menuitem"
                ref={(el: HTMLAnchorElement | HTMLElement | null) => {
                  logoRef.current = el;
                }}
                className="rounded-full p-1 inline-flex items-center justify-center overflow-hidden flex-none"
                style={{
                  width: 'var(--logo)',
                  height: 'var(--logo)',
                  background: 'transparent'
                }}
              >
                <img src={logo} alt={logoAlt} ref={logoImgRef} className="w-full h-full object-cover block" />
              </Link>
            ) : (
              <a
                href={items?.[0]?.href || '#'}
                aria-label="Home"
                onMouseEnter={handleLogoEnter}
                ref={(el: HTMLAnchorElement | HTMLElement | null) => {
                  logoRef.current = el;
                }}
                className="rounded-full p-1 inline-flex items-center justify-center overflow-hidden flex-none"
                style={{
                  width: 'var(--logo)',
                  height: 'var(--logo)',
                  background: 'transparent'
                }}
              >
                <img src={logo} alt={logoAlt} ref={logoImgRef} className="w-full h-full object-cover block" />
              </a>
            )
          )}
        </div>

        {/* Nomes das categorias centralizados na linha (pedido: "quero que os
            nomes na linha fiquem centralizados") — cada pill agora tem
            largura pelo próprio conteúdo (`flex-none`), agrupados ao centro
            (`justify-center`), em vez de esticados de ponta a ponta. */}
        <div
          ref={navItemsRef}
          className="relative items-center rounded-full hidden md:flex flex-1 min-w-0 h-full overflow-hidden"
          style={{
            height: 'var(--nav-h)'
          }}
        >
          <ul
            role="menubar"
            className="list-none flex items-stretch m-0 p-0 h-full w-full justify-center overflow-hidden"
            style={{ gap: 'var(--pill-gap)' }}
          >
            {items.map((item, i) => {
              const isActive = activeHref === item.href;

              const pillStyle: React.CSSProperties = {
                background: 'transparent',
                color: '#ffffff',
                paddingLeft: 'var(--pill-pad-x)',
                paddingRight: 'var(--pill-pad-x)'
              };

              const PillContent = (
                <>
                  <span
                    className="hover-circle absolute left-1/2 bottom-0 rounded-full z-[1] block pointer-events-none"
                    style={{
                      background: 'var(--base, #fff)',
                      willChange: 'transform'
                    }}
                    aria-hidden="true"
                    ref={(el: HTMLSpanElement | null) => {
                      circleRefs.current[i] = el;
                    }}
                  />
                  <span className="label-stack relative inline-flex items-center justify-center h-full w-full overflow-hidden z-[2]">
                    <span
                      className="pill-label relative z-[2] inline-flex items-center justify-center text-white font-semibold text-[clamp(11px,0.8vw,14px)] uppercase tracking-tight whitespace-nowrap"
                      style={{ willChange: 'transform', color: '#ffffff' }}
                    >
                      {item.label}
                    </span>
                    <span
                      className="pill-label-hover absolute inset-0 z-[3] inline-flex items-center justify-center font-semibold text-[clamp(11px,0.8vw,14px)] uppercase tracking-tight whitespace-nowrap pointer-events-none"
                      style={{
                        color: 'var(--hover-text, #120F17)',
                        willChange: 'transform, opacity'
                      }}
                      aria-hidden="true"
                    >
                      {item.label}
                    </span>
                  </span>
                  {isActive && (
                    <span
                      className="absolute left-1/2 -bottom-[6px] -translate-x-1/2 w-3 h-3 rounded-full z-[4]"
                      style={{ background: 'var(--base, #fff)' }}
                      aria-hidden="true"
                    />
                  )}
                </>
              );

              const basePillClasses =
                'relative overflow-hidden inline-flex items-center justify-center h-full w-full no-underline rounded-full box-border font-semibold text-[clamp(11px,0.8vw,14px)] uppercase tracking-tight whitespace-nowrap cursor-pointer px-0 text-white';

              return (
                <li key={item.href} role="none" className="flex-none flex h-full min-w-0 overflow-hidden">
                  {isRouterLink(item.href) ? (
                    <Link
                      role="menuitem"
                      to={item.href}
                      className={basePillClasses}
                      style={pillStyle}
                      aria-label={item.ariaLabel || item.label}
                      onMouseEnter={() => handleEnter(i)}
                      onMouseLeave={() => handleLeave(i)}
                    >
                      {PillContent}
                    </Link>
                  ) : (
                    <a
                      role="menuitem"
                      href={item.href}
                      className={basePillClasses}
                      style={pillStyle}
                      aria-label={item.ariaLabel || item.label}
                      onMouseEnter={() => handleEnter(i)}
                      onMouseLeave={() => handleLeave(i)}
                    >
                      {PillContent}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Ícones de busca/carrinho/usuário — mesmos da topbar da página de
            produto (`.pd-icones` em DetalheProduto.astro), pedido: "coloque
            nele os símbolos que tem na página de produto dedicado, usuário,
            carrinho e a barra de pesquisa". Decorativos por enquanto (a
            página de produto também não liga nenhum deles a uma ação). */}
        <div className="hidden md:flex items-center flex-none gap-3 ml-3 text-white" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 7h12l-1 13H7L6 7z" /><path d="M9 7a3 3 0 016 0" /></svg>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
        </div>

        {/* BotÃ£o hambÃºrguer no mobile */}
        <button
          ref={hamburgerRef}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
          className="md:hidden rounded-full border-0 flex flex-col items-center justify-center gap-1 cursor-pointer p-0 relative flex-none ml-auto"
          style={{
            width: 'var(--logo)',
            height: 'var(--logo)',
            background: 'transparent'
          }}
        >
          <span
            className="hamburger-line w-4 h-0.5 rounded origin-center transition-all duration-[10ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]"
            style={{ background: '#fff' }}
          />
          <span
            className="hamburger-line w-4 h-0.5 rounded origin-center transition-all duration-[10ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]"
            style={{ background: '#fff' }}
          />
        </button>
      </nav>

      {/* Menu mobile */}
      <div
        ref={mobileMenuRef}
        className="md:hidden absolute top-[calc(100%+8px)] left-0 right-0 rounded-[27px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-[998] origin-top border border-white/60"
        style={{
          ...cssVars,
          background: '#0A0B0C'
        }}
      >
        <ul className="list-none m-0 p-[3px] flex flex-col gap-[3px]">
          {items.map(item => {
            const defaultStyle: React.CSSProperties = {
              background: 'transparent',
              color: '#ffffff'
            };
            const hoverIn = (e: React.MouseEvent<HTMLAnchorElement>) => {
              e.currentTarget.style.background = 'var(--base)';
              e.currentTarget.style.color = 'var(--hover-text, #120F17)';
            };
            const hoverOut = (e: React.MouseEvent<HTMLAnchorElement>) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#ffffff';
            };

            const linkClasses =
              'block py-3 px-4 text-[16px] font-medium rounded-[50px] transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)] text-white';

            return (
              <li key={item.href}>
                {isRouterLink(item.href) ? (
                  <Link
                    to={item.href}
                    className={linkClasses}
                    style={defaultStyle}
                    onMouseEnter={hoverIn}
                    onMouseLeave={hoverOut}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    href={item.href}
                    className={linkClasses}
                    style={defaultStyle}
                    onMouseEnter={hoverIn}
                    onMouseLeave={hoverOut}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default PillNav;
