/**
 * Intro de entrada (ver components/Intro/IntroEntrada.astro). Só age se o
 * `<script is:inline>` de Base.astro já pôs `html.intro-on`. Espera a fonte do
 * título, dispara a sequência CSS (`html.intro-go`) e limpa tudo no fim.
 */

/** duração total da sequência CSS (--i-hero 3.4s + 1.1s de subida) + folga */
const DURACAO_MS = 4800;
/** não segura a intro esperando fonte lenta */
const ESPERA_FONTE_MS = 900;

export function ligarIntroEntrada(): void {
  const raiz = document.documentElement;
  if (!raiz.classList.contains('intro-on')) return;

  const encerrar = () => {
    raiz.classList.remove('intro-on', 'intro-go');
    document.querySelector('.intro')?.remove();
  };

  const iniciar = () => {
    window.scrollTo(0, 0);
    raiz.classList.add('intro-go');
    window.setTimeout(encerrar, DURACAO_MS);
  };

  const fonte = document.fonts?.load("1em 'Bigerside'").catch(() => undefined) ?? Promise.resolve();
  const limite = new Promise<void>((ok) => window.setTimeout(ok, ESPERA_FONTE_MS));
  void Promise.race([fonte, limite]).then(iniciar);
}
