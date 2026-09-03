/**
 * STUB — Épico E3, story principal. Passo 7 de
 * docs/architecture/03-personalizacao-por-url.md.
 *
 * `contexto.ts` já troca `--acento` e os `data-*` do <html>. FALTA reescrever,
 * no cliente e sem recarregar, o conteúdo que muda por nicho:
 *   - os [data-slot] do cabeçalho: "kicker", "titulo", "subtitulo"
 *     (já presentes em src/pages/index.astro e src/pages/n/[slug].astro)
 *   - a grade de produtos (section.grade) — recriar os cards a partir de
 *     NICHOS[nicho].produtos, reusando o mesmo HTML que CardProduto.astro gera.
 *
 * Regras (ver RF-05.1, RNF-04):
 *   - Se o nicho da URL == NICHO_PADRAO, não faz nada (o HTML já está certo).
 *   - Degradação graciosa: qualquer erro aqui deve deixar a página do nicho
 *     padrão intacta. Nunca lançar.
 *   - Sem framework: manipulação de DOM direta, é caminho crítico no webview.
 *
 * TODO(você):
 *   1. `reescreverCabecalho(nicho)` — setar textContent dos [data-slot].
 *   2. `reescreverGrade(nicho)` — montar os cards (extrair um template comum
 *      com CardProduto.astro para não duplicar marcação).
 *   3. Religar o vídeo vertical nos cards novos (ligarVideoVertical(section)).
 *   4. Chamar daqui de contexto.ts, depois de aplicar os data-*.
 */
import type { Nicho } from '../../data/tipos';

export function reescreverSlots(_nicho: Nicho): void {
  // TODO(E3): implementar. Ver cabeçalho deste arquivo.
}
