# _arquivo

Componentes tirados da página, mantidos aqui pra voltar quando quiser.

Arquivados em 2026-09-26 — pedido: "arquive dos dois banners abaixo da hero até o
fim do flowing menu [de baixo], e neste espaço deixe o espaço vazio". Em
`SecaoUnica.astro` o lugar deles agora é ocupado pelas 3 seções de
`components/Continuacao/` (referência HAUS Studio; antes foi um vão vazio).

Da faixa logo abaixo da Hero até o menu de categorias, na ordem em que apareciam:

1. `CardsDuplos/CardsDuplos.astro` — banner SOUSAYL + card de vídeo (os "dois banners")
2. `FlowingMenu/FlowingMenuDivulgacao.astro` — faixa "Divulgação"
3. legenda "Destaques da semana" — não é arquivo: era um `<LegendaStreetwear texto="Destaques da semana" linha />`
4. `TiltedCard/TresCardsInclinados.astro` (+ `FiosDestaques.tsx`, `TiltedCard.tsx`) — 3 cards inclinados
5. `FlowingMenu/FlowingMenuCategorias.astro` (+ `FlowingMenu.tsx`) — menu de categorias

Continuam na página, logo depois do vão: legenda "Bastidores em vídeo", `CardsVidro`, as
trilhas de produtos, etc.

7. `Hero/HeroPoster.astro` — composição do pôster de referência (palavra gigante cortada,
   cacos de vidro, grade, vinco, grão, legendas, selo) desenhada por cima/entre as fotos da
   Hero. Arquivada a pedido ("retire todas as figuras"). ATENÇÃO: os asteriscos metálicos e
   as estrelas animadas já tinham sido removidos ANTES de arquivar (pedido anterior), então
   esta cópia não os tem — se quiser de volta, precisam ser redesenhados. Pra voltar: mover
   pra `components/Hero/`, importar em `HeroCamadas.astro`, renderizar 2× por cena
   (`camada="atras"` depois do fundo, `camada="frente"` no fim) e definir no template os
   gradientes SVG `#hp-borda` e `#hp-vidro` que ela usa (hoje não existem mais lá).

A Hero em fotos por camadas (`Hero/HeroCamadas.astro`) está de volta ao estado original,
com todos os efeitos por imagem e por seção (neon, riscos, névoa, brasas, estrelas, luz,
poeira, paralaxe de mouse e de scroll).

## Pra restaurar

1. Mover as pastas de volta pra `components/CardsDuplos/`, `components/FlowingMenu/` e
   `components/TiltedCard/` (os imports relativos perdem um `../`).
2. Reimportar em `SecaoUnica.astro` e recolocar, na ordem acima, no lugar das 3 seções
   de `components/Continuacao/` (ou depois delas, se quiser manter as duas).

Assets e vídeos ficaram onde estavam: `src/assets/cards-duplos/`, `src/assets/tres-cards/`,
`src/assets/hero/divulgacao-banner.jpeg`, `public/cards-duplos/*.mp4`.

Nota: `FiosDestaques.tsx` carrega o erro de tipo do `motion` que já existia antes de arquivar.
