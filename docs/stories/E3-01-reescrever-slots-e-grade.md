# E3-01 — Reescrever entrada + vitrine + detalhe no cliente (`?n=`)

> **Reescopada em 2026-09-02 (ADR-007).** Era "reescrever cabeçalho + grade".
> Agora reescreve **as 3 telas** (entrada editorial, vitrine com trilha de
> categorias + herói + miniaturas, detalhe com galeria + blocos), em módulos
> `src/lib/personalizacao/slots/{index,entrada,vitrine,detalhe}.ts`, clonando os
> `<template>` buildados. **Depende de E5-01 + E6-01 + E6-02.** Arquivos-guia:
> [`architecture/09`](../architecture/09-fluxo-de-telas-e-apresentacao.md) §1 e
> [`architecture/08`](../architecture/08-catalogo-categorizado.md) §4. Os
> critérios abaixo (do escopo antigo) serão substituídos quando o `aiox-sm`
> detalhar a versão reescopada — ficam aqui como histórico.

**Épico:** [E3](../epics/E3-personalizacao-por-url.md) · **Estado:** ⬜ aberto
**Requisitos:** RF-05.1, RF-05.2, RF-15, RF-16, RNF-03, RNF-04

## Contexto

O HTML é buildado uma vez com o nicho padrão. `contexto.ts` já resolve o
contexto da URL e aplica `--acento` + `data-*`. Falta a parte que muda o que o
visitante lê quando a URL traz `?n=<outro-nicho>`.

## História

> Como operador que divulga `/?n=pet-shop` num anúncio, quero que quem abrir o
> link veja o título, o subtítulo e os produtos do **pet-shop** (não os do nicho
> padrão), sem recarregar — e, se o JS falhar, veja o nicho padrão inteiro.

## Critérios de aceite

1. Com `?n=<slug válido>` diferente do padrão:
   - os `[data-slot="kicker|titulo|subtitulo"]` passam a refletir o nicho;
   - a `section.grade` passa a listar os produtos do nicho (mesma marcação do
     `CardProduto.astro` — imagem/vídeo, preço, tarja, CTA com `data-sku`);
   - o vídeo vertical dos cards novos volta a funcionar (autoplay/pausa).
2. Com `?n=` ausente/inválido: nada muda visualmente além do que já acontece
   hoje (nicho padrão renderizado no build).
3. `?n=<slug>` == nicho padrão: função não faz nada (sem "flash").
4. Qualquer exceção interna é engolida; a página do nicho padrão continua
   válida e interativa (RNF-04).
5. Sem framework novo no caminho crítico; script continua `type="module"` no
   fim do `<body>` (RNF-03).

## Notas de implementação

- Preencher `src/lib/personalizacao/slots.ts` (stub já criado).
- Extrair um template de card compartilhado para não duplicar a marcação entre
  `CardProduto.astro` e o JS — opções: (a) função que devolve string HTML;
  (b) `<template>` no HTML buildado.
- Reusar `urlAsset()` — atenção: no cliente os assets já têm URL com hash do
  build; garantir que o mapa de `import.meta.glob` está disponível no bundle.
- Chamar de `contexto.ts` **depois** de aplicar os `data-*`; passar o `Nicho`
  resolvido.
- Religar vídeo: `ligarVideoVertical(section)` após montar os cards.

## Fora de escopo

`?c=` (E3-02) e `?o=` (E3-03). Esta story assume ordem do arquivo e sem oferta.

## Teste

- Manual: `?n=exemplo`, `?n=inexistente`, sem query, JS desabilitado.
- Quando houver 2+ nichos reais, repetir a matriz com um deles.
