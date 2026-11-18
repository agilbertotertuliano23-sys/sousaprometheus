/**
 * Clipe no hover dos cards de vitrine (MiniProduto, CardLoja).
 *
 * Dinâmica: ao entrar com o mouse a 2ª foto já troca por CSS; se o mouse
 * continuar no card por mais ATRASO_MS, o <video data-video-hover> carrega,
 * toca mudo em loop e cobre a foto (classe `video-ativo` no card). Ao sair,
 * pausa, volta ao início e some. O `src` só é atribuído no 1º uso
 * (`data-src`), então nenhum clipe é baixado sem hover.
 *
 * Fora de cena em toque (sem hover) e com prefers-reduced-motion.
 */
import { prefereMenosMovimento } from './reduced-motion';

const ATRASO_MS = 1000;

export function ligarVideoHover(raiz: ParentNode = document): void {
  if (prefereMenosMovimento() || !window.matchMedia('(hover: hover)').matches) return;

  raiz.querySelectorAll<HTMLVideoElement>('video[data-video-hover]').forEach((video) => {
    const card = video.closest<HTMLElement>('a');
    if (!card || card.dataset.videoHoverLigado) return;
    card.dataset.videoHoverLigado = '1';
    let timer: number | undefined;

    card.addEventListener('mouseenter', () => {
      timer = window.setTimeout(() => {
        if (!video.src && video.dataset.src) video.src = video.dataset.src;
        video.play().then(() => card.classList.add('video-ativo')).catch(() => {});
      }, ATRASO_MS);
    });

    card.addEventListener('mouseleave', () => {
      window.clearTimeout(timer);
      card.classList.remove('video-ativo');
      video.pause();
      video.currentTime = 0;
    });
  });
}
