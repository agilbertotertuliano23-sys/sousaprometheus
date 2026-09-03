/**
 * Autoplay resiliente para o webview do TikTok: mudo, inline, tocando quando
 * entra na viewport e pausando quando sai (economia de CPU no celular).
 * Um toque no vídeo alterna o mudo.
 */
export function ligarVideoVertical(root: ParentNode = document) {
  const videos = root.querySelectorAll<HTMLVideoElement>('video[data-vertical]');
  if (videos.length === 0) return;

  const io = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        const v = e.target as HTMLVideoElement;
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      }
    },
    { threshold: 0.6 },
  );

  for (const v of videos) {
    v.muted = true;
    v.playsInline = true;
    v.loop = true;
    io.observe(v);
    v.addEventListener('click', () => {
      v.muted = !v.muted;
      v.dataset.som = v.muted ? 'off' : 'on';
    });
  }
}
