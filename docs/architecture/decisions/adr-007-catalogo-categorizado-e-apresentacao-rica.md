# ADR-007 — Catálogo categorizado e camada de apresentação rica

**Status:** aceito · **Data:** 2026-09-02 · **Decide sobre:** `docs/ideacao/entrada-e-pagina-virtual.md` (Direção A)
**Revisto por:** [ADR-008](adr-008-catalogo-como-pagina-rica-de-secoes.md) (Fase 0 aceita 2026-09-02) — itens 3 e 4 (tela de entrada e tela do meio). Itens 1, 2 e 5 (categorias, `prioridade`, `catalog validate`) seguem valendo.

## Contexto

Os ADRs 001–006 fixaram a base: um HTML estático buildado uma vez com o nicho
padrão, personalização client-side por `?n=/?c=/?o=`, zero backend, orçamento de
peso duro, degradação graciosa sem JS, console sem dependências.

Sobre essa base, o dono consolidou uma mudança de direção de produto (partindo da
Direção A da ideação — Capa editorial **E4** + Vitrine em foco **C4** + seção
única **T-A**):

1. **O catálogo de cada nicho é curado e categorizado.** Os produtos são
   escolhidos por pesquisa + potencial de venda (trabalho humano, fora do
   código) e organizados em **categorias dentro do nicho**. A página navega por
   categoria. O modelo de dados precisa carregar: a categoria, a ordem curada e
   um campo de "potencial" (score manual) que influencia ordenação e destaque.
2. **A apresentação é o diferencial do domínio.** Não é "grade + vídeo". Cada
   produto tem **galeria de mídia** (várias imagens + vídeo(s) 9:16),
   **benefícios**, **specs** (pares chave-valor) e um **array de blocos
   declarativos** que o criador do nicho fornece no arquivo do nicho
   (`depoimento`, `como-usar`, `comparativo`, `bonus`, `faq`, `texto`, `midia`,
   `specs`), cada tipo renderizado por um componente Astro dedicado. Sistema
   extensível: tipo novo = componente novo + entrada num registry.
3. **Fluxo de 3 telas:** tela de entrada (capa editorial) → página virtual
   (1 produto em foco + trilha de categorias / miniaturas) → detalhe rico do
   produto (os blocos) → CTA de saída externa. Encaixe entrada→vitrine→detalhe
   como estado no cliente numa seção única, degradando para conteúdo empilhado
   sem JS.

Nada disso quebra os ADRs 001–006. O que muda é a **forma** do dado e a
**estrutura** da página — não a stack, não o modelo de deploy, não a fronteira
de privacidade.

## Decisão

### 1. Categoria é uma entidade declarada no nicho, referenciada por id

`Nicho.categorias?: Categoria[]` — lista ordenada, curada. `Produto.categoria?:
string` aponta o `Categoria.id`. Sem categoria declarada, o nicho opera com uma
trilha única sintética; produto sem `categoria` cai numa categoria sintética
`_outros` no fim da trilha.

### 2. Potencial de venda é um score inteiro no produto

`Produto.prioridade?: number` — inteiro `0..100`, default `50`. Ordena os
produtos dentro da categoria (maior primeiro) e elege o herói da vitrine quando
nenhum produto está marcado `destaque: true`. `destaque` continua existindo como
override manual do herói + borda de acento (compat com o schema atual).

### 3. Apresentação rica: galeria + benefícios + specs + blocos

- `Produto.galeria?: ItemMidia[]` — imagens e vídeos 9:16. Ausente → derivada de
  `[imagem, (video)]`. `Produto.imagem` continua **obrigatório** (LCP, fallback
  sem-JS, base do OG).
- `Produto.beneficios?: string[]` e `Produto.specs?: ParSpec[]`.
- `Produto.blocos?: BlocoApresentacao[]` — **union discriminada por `tipo`**,
  renderizada na ordem por um `RenderBlocos.astro` que consulta um registry
  `tipo → componente` (`src/lib/apresentacao/registry.ts`). O vocabulário de
  tipos vive em `src/lib/apresentacao/tipos-bloco.json` (fonte única, lida
  também pelo console).

### 4. Fluxo de 3 telas como estado no cliente numa seção única

`index.astro` e `n/[slug].astro` passam a renderizar **uma** seção com três
`<section>` filhas (`#tela-entrada`, `#tela-vitrine`, `#tela-detalhe`). O HTML
buildado contém **tudo** do nicho padrão: entrada, trilha, vitrine (como grade
por categoria) e uma `<section>` de detalhe por produto. O JS
(`src/lib/navegacao/telas.ts`) só: esconde o que não é a tela ativa, alterna
`data-tela` e empurra `history.pushState` com `#hash` **preservando
`location.search`**. Sem JS, as três telas ficam visíveis e empilhadas, ligadas
por âncoras — RNF-04 continua limpo.

### 5. `catalog validate` cobre o novo schema

Continua sendo um scanner de texto (ADR-005). Ganha: ids de categoria
referenciados existem; `prioridade` é inteiro no range; `tipo` de bloco está no
vocabulário (`tipos-bloco.json`); assets de galeria/bloco (`src`, `avatar`,
`poster`) existem no disco. A profundidade estrutural fica com `astro check` +
`src/lib/catalogo/validar.ts` (função pura, sem deps, backstop em DEV — caminho
ajustado de `src/data/validar.ts` na E2-03).

## Alternativas consideradas

| # | Alternativa | Por que não |
|---|---|---|
| A | **`Produto.categoria` como string livre; categorias derivadas por `Set`.** Zero redundância. | Perde ordem curada e metadados da categoria (kicker, descrição editorial da "capa"). Divergência de digitação (`Cozinha` vs `cozinha`) vira bug silencioso. A vitrine precisa de uma lista estável de categorias mesmo quando alguma está vazia. |
| B | **Categorias como entidade global (`src/data/categorias.ts`), compartilhada entre nichos.** | Acopla nichos entre si (fere "zero coupling"). Categoria de "pet-shop" não tem sentido em "home-office". Cada nicho é uma vitrine independente por ADR-002. |
| C | **`prioridade` como enum `alta|media|baixa`.** Mais legível na curadoria. | Granularidade insuficiente para ordenar 8 produtos e para desempate. Um inteiro cobre os dois usos (ordem + eleição de herói) com uma regra só. |
| D | **Blocos como HTML/Markdown livre num campo `corpo`.** Máxima flexibilidade para o criador do nicho. | Fura o orçamento de peso (parser MD no cliente), abre XSS na reescrita client-side de `?n=`, e mata a consistência visual que é o diferencial. Blocos tipados + componentes dedicados garantem ritmo e a11y. |
| E | **Blocos com `component:` apontando um caminho de arquivo.** | Quebra o build estático (import dinâmico arbitrário) e o tree-shaking. O registry fechado é a fronteira de extensão correta. |
| F | **3 telas como 3 rotas estáticas (`/`, `/n/<slug>`, `/n/<slug>/<sku>`).** SEO por produto. | Sem JS, o `<a href>` estático perde `?c=/?o=` na navegação → quebra atribuição por criativo (R-08 / ideação T-C). Seção única + `#hash` mantém documento único e os params íntegros. |
| G | **Grade viva (C8) / expandir-no-lugar em vez de tela de detalhe dedicada.** Menor mudança. | O dono rejeitou a grade. A tela de detalhe é onde os blocos declarativos ganham espaço; expandir-no-lugar não comporta um `comparativo` + `faq` + galeria sem virar modal gigante. |

## Consequências

- **+** O modelo passa a expressar o diferencial do domínio (curadoria +
  apresentação), não só um feed de cards.
- **+** Extensão de apresentação é aditiva e local: novo bloco = 1 componente +
  1 linha no registry + 1 linha no vocabulário. Núcleo intocado (RNF-14).
- **+** Compatibilidade retroativa total: `exemplo.ts` atual continua válido —
  todos os campos novos são opcionais e têm derivação por default.
- **+** Continuidade de personalização preservada: seção única, `?n/?c/?o` nunca
  saem da URL.
- **−** O HTML da página cresce (todas as telas do nicho padrão embutidas).
  Mitigado: só entrada + capa do herói carregam assets eager; galeria e vídeos
  de detalhe são `loading="lazy"` / `preload="none"` (RNF-13). O 1º paint
  continua dentro de 1,2 MB.
- **−** `catalog validate` fica mais frágil (scanner de texto lendo estrutura
  aninhada — R-04 cresce). Mitigado por `astro check` + `validarNicho()`.
- **−** E3-01 cresce: `slots.ts` monolítico vira `slots/entrada.ts` +
  `slots/vitrine.ts` + `slots/detalhe.ts`.
- **−** `slots.ts` client-side agora reconstrói galeria e blocos no DOM ao trocar
  `?n=` — mais superfície de código no caminho crítico. Mitigado mantendo os
  blocos como texto/estrutura simples e reusando `<template>` do HTML buildado.

## O que fica fora do escopo atual

- **Filtro/busca dentro da categoria.** Catálogo é curto por design (2–8). A
  trilha de categorias é navegação, não busca.
- **Categorias aninhadas / subcategorias.** Um nível só. Se doer, ADR futuro.
- **Blocos com estado ou lógica** (calculadora, configurador). Blocos são
  declarativos e renderizam estático. Interatividade de bloco = ilha dedicada,
  decisão à parte.
- **Blocos com mídia pesada fora do orçamento** (vídeo por bloco além do vídeo
  do produto). `assets check` continua valendo; a curadoria decide o que cabe.
- **Score de potencial calculado / dinâmico.** `prioridade` é um número que o
  humano escreve no arquivo. Sem backend, não há de onde calcular (ADR-004).
- **Rota estática por produto para SEO.** Fora por R-08 (ver alternativa F). A
  rota `/n/<slug>` (E4) renderiza a mesma seção única.
- **Persistência da categoria escolhida** entre visitas. Só o último nicho vai
  para `localStorage` (RNF-09 / ADR-003).
