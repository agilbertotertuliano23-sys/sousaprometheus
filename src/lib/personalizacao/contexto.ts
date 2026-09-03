/**
 * Ponte client-side: lê a URL do navegador e aplica o contexto de
 * personalização à página já renderizada (estática). Ver
 * docs/architecture/03-personalizacao-por-url.md.
 *
 * O HTML é buildado uma vez com o nicho padrão; este script troca o que muda
 * por nicho/criativo sem recarregar. Se o JS falhar, a página do nicho padrão
 * continua válida (degradação graciosa).
 */
import { resolverContexto } from '../../data/personalizacao';
import { NICHOS } from '../../data/nichos';

const CHAVE_MEMORIA = 'prometeus:ultimo-nicho';

export function aplicarPersonalizacao() {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);

  if (!params.get('n')) {
    try {
      const salvo = localStorage.getItem(CHAVE_MEMORIA);
      if (salvo) params.set('n', salvo);
    } catch {
      /* modo privado / storage bloqueado — segue com o padrão */
    }
  }

  const ctx = resolverContexto(params);
  const nicho = NICHOS[ctx.nicho];
  if (!nicho) return;

  try {
    localStorage.setItem(CHAVE_MEMORIA, ctx.nicho);
  } catch {
    /* ignora */
  }

  document.documentElement.style.setProperty('--acento', nicho.acento);
  document.documentElement.dataset.nicho = ctx.nicho;
  document.documentElement.dataset.variante = ctx.variante;
  if (ctx.oferta) document.documentElement.dataset.oferta = ctx.oferta;

  return ctx;
}
