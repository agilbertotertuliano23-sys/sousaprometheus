/**
 * Revelação das seções — agora só uma PONTE: a entrada ao rolar do site todo
 * (banners, cards, títulos, blocos) vive em `revelar.ts`, com a configuração
 * única da Basic Agency (`movimento.ts`). Este arquivo existe pra o `<script>`
 * de Base.astro continuar chamando `ligarRevelacaoSecoes()` sem mudança.
 *
 * O que havia aqui (banner "caindo" com mola + cards com scale, cada um com
 * tempo/curva próprios, via classe `.revelado` + CSS em TrilhaProdutos.astro)
 * foi substituído pelo sistema unificado (título em máscara, imagem em janela,
 * blocos que sobem) — o CSS antigo saiu de TrilhaProdutos.astro.
 */
import { ligarRevelar } from './revelar';

/** Liga a revelação das seções. Idempotente. Chamada uma vez pelo <script> de Base.astro. */
export function ligarRevelacaoSecoes(): void {
  ligarRevelar();
}
