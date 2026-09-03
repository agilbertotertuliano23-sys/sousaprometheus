# E5-02 — `GaleriaMidia.astro` + benefícios (`<ul>`) + specs (`<dl>` + `BlocoSpecs`)

**Épico:** [E5](../epics/E5-camada-de-apresentacao-rica.md) · **Estado:** 🔵 detalhada — **pode andar ∥ E6-04**
**Esforço:** M (1–3 dias)
**Base:** [ADR-007](../architecture/decisions/adr-007-catalogo-categorizado-e-apresentacao-rica.md) item 3 · [architecture/08](../architecture/08-catalogo-categorizado.md) §4.6 (`galeriaDe`), §4.7 (`blocosDe`) · [architecture/09](../architecture/09-fluxo-de-telas-e-apresentacao.md) §4
**Depende de:** **E5-01** ✔ (`DetalheProduto.astro` casca + `RenderBlocos` + `REGISTRY`), E2-03 ✔ (`resolver.ts` + `tipos.ts`)
**Destrava:** E6-05 (a `#tela-vitrine` da Fase 0 leva ao detalhe), E5-03 (blocos restantes)

**Requisitos cobertos:**
RF-12.1 (`Produto.galeria: ItemMidia[]` — imagens + vídeos 9:16), RF-12.2 (galeria ausente → derivada de `[imagem, (video)]`), RF-12.3 (só a capa do herói eager; resto `lazy`/`preload=none`), RF-12.4 (sem JS = pilha vertical),
RF-13.1 (`beneficios: string[]` → `<ul>` no topo do detalhe), RF-13.2 (`specs: ParSpec[]` → `<dl>` e/ou `BlocoSpecs` no topo dos blocos),
RNF-06 (dots ≥ 44px), RNF-08 (`prefers-reduced-motion` sem transição), RNF-13, RNF-14 (`specs` fecha 4/8 chaves do `REGISTRY`).

**NÃO cobre nesta story:** blocos `como-usar` / `comparativo` / `bonus` / `faq` — **E5-03**. Montagem/navegação das 3 telas — **E6**. Reescrita por `?n=` — **E3**.

**Arquivos-guia:**
- [architecture/08](../architecture/08-catalogo-categorizado.md) — §2 (`ItemMidia`, `ParSpec`, `BlocoSpecs`), §4.6 (`galeriaDe`), §4.7 (`blocosDe` — `specs` vira `BlocoSpecs` no topo se `blocos` não trouxer um), §5 (registry)
- [architecture/09](../architecture/09-fluxo-de-telas-e-apresentacao.md) — §4 (`GaleriaMidia` em "Novos"; `DetalheProduto` em "Mantidos de E5")
- [prd/02-requisitos](../prd/02-requisitos.md) — RF-12, RF-13, RNF-06/08/13
- [design/01-fundamentos](../design/01-fundamentos.md) — "Trilha / carrossel" (mesmas regras de `scroll-snap` + `overscroll-behavior-x` + reduced-motion), `--card-raio`, `--raio-sm`
- Código a consumir: `src/lib/catalogo/resolver.ts` (`galeriaDe`, `blocosDe`), `src/lib/catalogo/carregar.ts` (`urlAsset`), `src/lib/apresentacao/registry.ts` (`REGISTRY`), `src/lib/apresentacao/tipos-bloco.json`
- Código a alterar: `src/components/Detalhe/DetalheProduto.astro`, `src/lib/apresentacao/registry.ts` (chave `specs` → `BlocoSpecs`)
- Novos: `src/components/Detalhe/GaleriaMidia.astro`, `src/components/blocos/BlocoSpecs.astro`
- Fixture: `src/data/nichos/exemplo.ts` (≥ 1 produto com `galeria` de 3+ itens incl. 1 vídeo; ≥ 1 com `beneficios`; ≥ 1 com `specs` sem `BlocoSpecs`; ≥ 1 com `BlocoSpecs` explícito)

---

## Contexto

E5-01 entregou o `DetalheProduto.astro` como **casca**: galeria simples (só a 1ª
imagem), nome, preço, `beneficios` como texto, `RenderBlocos` com 3 de 8 chaves
(`texto`/`midia`/`depoimento`) e os CTAs. Esta story completa a apresentação do
produto:

1. **`GaleriaMidia.astro`** — a galeria rica: `galeriaDe(produto)` (imagens +
   vídeos 9:16) numa faixa `scroll-snap` horizontal com dots; sem JS vira pilha
   vertical; `prefers-reduced-motion` sem transição.
2. **Benefícios** — `produto.beneficios` como `<ul>` no topo do detalhe.
3. **Specs** — `produto.specs` como `<dl>` **e** como bloco: a chave `specs` do
   `REGISTRY` (a 4ª de 8) ganha o `BlocoSpecs.astro`; `blocosDe(produto)` já
   prepend de `{ tipo:'specs' }` quando `produto.specs` existe e `blocos` não
   traz um (doc 08 §4.7 — lógica pura, já em `resolver.ts`).

Tudo **Astro puro, sem ilha**. A `GaleriaMidia` tem um `<script type="module">`
mínimo **opcional** só para acender o dot ativo (CA 7) — funciona 100% sem ele.

### História

> Como **visitante decidindo comprar**, quero ver o produto por vários ângulos e
> num vídeo curto, ler os benefícios em bullets e conferir as specs numa tabela —
> na mesma tela, sem sair — antes de tocar no link de saída.

> Como **visitante sem JS**, quero que a galeria seja uma pilha de imagens/vídeos
> que eu rolo, e que benefícios e specs apareçam como lista e tabela normais.

---

## Decisões desta story

- **[AUTO-DECISION] Dots da galeria.** Renderizados como **âncoras**
  (`<a href="#g-<sku>-<i>">`) que apontam cada item — funcionam **sem JS**. Um
  `<script type="module">` de ~15 linhas, **local ao componente**, marca o dot
  ativo via `IntersectionObserver`. Sem o script, os dots ainda navegam; só não
  se "acendem". Não usa Embla.
- **[AUTO-DECISION] Specs em dois lugares.** `produto.specs` aparece como `<dl>`
  no **cabeçalho** do detalhe (resumo, abaixo do preço) **e**, via `blocosDe`,
  como `BlocoSpecs` no fluxo dos blocos (posição curada). Redundância deliberada
  e barata. Se virar ruído, o `<dl>` do cabeçalho vira `<details>` recolhido —
  opção, não implementada.
- **[AUTO-DECISION] Capa da galeria.** `galeriaDe(produto)[0]` (sempre imagem —
  doc 08 §4.6). No detalhe, `loading="lazy"` (o detalhe nunca é o 1º paint —
  RNF-13). Vídeos: `preload="none"`, `muted`, `playsinline`, `loop`, autoplay só
  ≥ 60% visível (RNF-05) reusando `ligarVideoVertical` (religado por E6-02).

---

## Critérios de aceite

### `GaleriaMidia.astro` (`src/components/Detalhe/GaleriaMidia.astro`) — novo · RF-12

1. Props: `{ itens: ItemMidia[]; slug: string; sku: string }`. Sem dependência
   nova. Raiz `<figure class="galeria" role="group" aria-label="Galeria do
   produto">`.
2. **Faixa:** `<ol class="galeria-faixa">` — `display: flex; overflow-x: auto;
   scroll-snap-type: x mandatory; overscroll-behavior-x: contain;
   -webkit-overflow-scrolling: touch`. Um `<li id="g-<sku>-<i>"
   class="galeria-item">` por item (`scroll-snap-align: center; flex: 0 0 100%;
   aspect-ratio: 9/16`).
3. **Imagem:** `<img src={urlAsset(slug, item.src)} alt={item.alt}
   loading="lazy" decoding="async" width height style="object-fit:cover">`.
4. **Vídeo:** `<video src={urlAsset(slug, item.src)}
   poster={item.poster && urlAsset(slug, item.poster)} muted playsinline loop
   preload="none" controls data-video-vertical aria-label={item.alt}>` — **sem**
   `autoplay` no HTML; autoplay é do `ligarVideoVertical` (RNF-05).
5. **Dots:** `<nav class="galeria-dots" aria-label="Ir para item">` com um
   `<a href="#g-<sku>-<i>" class="dot" aria-label={`Item ${i+1}`}>` por item.
   Área tocável ≥ 44px (RNF-06). Um só item → sem dots.
6. **Reduced-motion:** sob `@media (prefers-reduced-motion: reduce)` a faixa é
   `scroll-snap-type: none` e `scroll-behavior: auto`; nenhuma transição de
   `opacity`/`transform` (RNF-08).
7. **Script opcional** (`<script type="module">` local, ~15 linhas): um
   `IntersectionObserver` sobre os `.galeria-item` marca `aria-current="true"` +
   classe no `.dot`. **Guarda:** só roda se
   `!matchMedia('(prefers-reduced-motion: reduce)').matches`. Se falhar/não
   rodar, os dots seguem navegando. Nada de `history`/`pushState`.
8. **Sem JS (RF-12.4):** a `<ol>` é uma faixa/pilha rolável de `<img>` +
   `<video controls>`. **Decisão:** `<video>` leva `controls` **sempre** (não
   conflita com o autoplay do observer; no webview o usuário pode pausar).
   Alternativa rejeitada: dois `<video>` (peso).

### `BlocoSpecs.astro` (`src/components/blocos/BlocoSpecs.astro`) — novo · RF-13.2 / RNF-14

9. Props `{ bloco: BlocoSpecs; slug: string }` (assinatura dos `Bloco<Tipo>` de
   E5-01). `<section class="bloco bloco-specs">` com `<h2>{bloco.titulo ??
   'Especificações'}</h2>` + `<dl class="specs">` (um `<div><dt><dd>` por
   `bloco.pares`). Astro puro, sem JS. Zebra opcional via `--linha`.
10. `src/lib/apresentacao/registry.ts`: `'specs'` deixa de ser `null` e aponta
    `BlocoSpecs`. Nenhuma outra chave muda. `RenderBlocos` já ignora `null` com
    `console.warn` em DEV (E5-01) — agora não avisa para `specs`.
11. `tipos-bloco.json` **já** tem `"specs"` (E2-03); `tipos.ts` **já** tem
    `BlocoSpecs` na union (E2-03) — **não mexer**.

### `DetalheProduto.astro` — alterado

12. Trocar a galeria simples de E5-01 por `<GaleriaMidia itens={galeriaDe(produto)}
    slug={slug} sku={produto.sku} />`.
13. Abaixo do preço (+ tarja de E5-01), se `produto.beneficios?.length`:
    `<ul class="beneficios">` (um `<li>` por item — RF-13.1). ≤ 6 recomendado.
14. Abaixo, se `produto.specs?.length`: `<dl class="specs-resumo">` (RF-13.2) — o
    resumo do cabeçalho.
15. `RenderBlocos` recebe `blocosDe(produto)` (não `produto.blocos ?? []`) para o
    `BlocoSpecs` sintético entrar (doc 08 §4.7). Se E5-01 já usa `blocosDe`,
    confirmar.
16. Nada de `<script>` novo no `DetalheProduto`.

### Fixture — `exemplo.ts`

17. Garantir no `exemplo`:
    - **1 produto** com `galeria` explícita de **≥ 3 itens** (2 imagens + 1
      vídeo com `poster`), assets em `src/assets/catalog/exemplo/<sku>/`;
    - **1 produto** com `beneficios` (3–5 bullets);
    - **1 produto** com `specs` (3–5 pares) **sem** `BlocoSpecs` em `blocos`;
    - **1 produto** com um `BlocoSpecs` **explícito** em `blocos`.
    Pode ser o mesmo produto acumulando casos. `catalog validate` + `assets
    check` verdes.

### Degradação sem JS (RF-12.4 / RNF-04)

18. Com JS **desabilitado**, abrir a rota `/dev/[amostra]` (E5-01) para um
    produto rico:
    - galeria = faixa/pilha rolável de `<img>` + `<video controls>`;
    - dots rolam para cada item por âncora;
    - benefícios = `<ul>`; specs = `<dl>` (resumo) + `BlocoSpecs` no fluxo;
    - sem salto de layout — `width`/`height` em toda `<img>`, `aspect-ratio` no `<li>`.

### Peso / RNF-13

19. Após `npm run build`: nenhuma mídia da `GaleriaMidia` é `eager`; todo `<img>`
    `lazy`, todo `<video>` `preload="none"`. Verificar por grep.
20. Registrar no PR o peso do detalhe de um produto rico (dado para E6-06).

### Portão final

21. Os quatro comandos, do zero, **exit 0**:
    ```
    npm run validate
    npm run typecheck
    npm run build
    npm run doctor
    ```
22. `REGISTRY` com **4/8** chaves vivas (`texto`/`midia`/`depoimento`/`specs`).
    `RenderBlocos` não avisa para `specs`; ainda avisa (DEV) para
    `como-usar`/`comparativo`/`bonus`/`faq`.
23. `git diff --stat` toca **apenas**:
    `src/components/Detalhe/GaleriaMidia.astro` (novo),
    `src/components/blocos/BlocoSpecs.astro` (novo),
    `src/components/Detalhe/DetalheProduto.astro`,
    `src/lib/apresentacao/registry.ts` (1 chave),
    `src/data/nichos/exemplo.ts` + assets em `src/assets/catalog/exemplo/`,
    e docs. **Nada** em `tipos.ts`, `resolver.ts`, `tipos-bloco.json`,
    `telas.ts`, páginas, `src/components/Vitrine/*`, `src/components/Porta/*`.

---

## Plano de tarefas

1. **`BlocoSpecs.astro`** (assinatura de bloco de E5-01; `<h2>` + `<dl>`; zebra
   `--linha`).
2. **`registry.ts`** — `'specs': BlocoSpecs`.
3. **`GaleriaMidia.astro`** — CA 1–8 (faixa `scroll-snap` + itens 100% +
   dots-âncora + `<script>` opcional com guarda de reduced-motion).
4. **`DetalheProduto.astro`** — trocar galeria (CA 12), `<ul>` benefícios (CA 13),
   `<dl>` resumo (CA 14), `blocosDe` no `RenderBlocos` (CA 15).
5. **`exemplo.ts` + assets** — casos do CA 17; `npm run validate && assets check
   --niche exemplo`.
6. **Portão + docs** — `validate/typecheck/build/doctor` exit 0; rota
   `/dev/[amostra]` + roteiro sem-JS; grep de `eager`/`preload`; registrar peso;
   `docs/stories/README.md`, `docs/ESTADO-ATUAL.md`, nota em `PLANO-PROXIMO-PASSO.md`.

---

## Definição de Pronto

- [ ] `npm run validate` / `typecheck` / `build` / `doctor` — exit 0.
- [ ] Um produto rico do `exemplo` mostra: galeria (2 imagens + 1 vídeo) com dots
      navegáveis, `<ul>` de benefícios, `<dl>` de specs no cabeçalho **e**
      `BlocoSpecs` no fluxo dos blocos.
- [ ] **Sem JS**: galeria é faixa/pilha rolável de `<img>` + `<video controls>`;
      dots rolam por âncora; benefícios/specs como lista/tabela.
- [ ] `prefers-reduced-motion: reduce`: `scroll-snap` desligado, sem transições.
- [ ] `REGISTRY` com 4/8 chaves; `RenderBlocos` não avisa para `specs`.
- [ ] `blocosDe(produto)` faz o prepend sintético de `BlocoSpecs` quando há
      `produto.specs` e nenhum `BlocoSpecs` explícito; **não** duplica quando já há.
- [ ] Nenhuma mídia da galeria `eager`; `<video preload="none">`. Peso do detalhe
      rico registrado no PR.
- [ ] `git diff --stat` conforme CA 23.

---

## Fora de escopo

- Blocos `como-usar` / `comparativo` / `bonus` / `faq` — **E5-03** (fecham 8/8).
- Lightbox / zoom de imagem — não pedido (RF-12).
- Feel de arraste com física (Embla) na galeria — `scroll-snap` nativo basta.
- Montagem do detalhe dentro das 3 telas — **E6**.
- Reescrita da galeria por `?n=` — **E3-01**.

---

## Riscos / notas

1. **CLS da galeria.** `aspect-ratio: 9/16` no `<li>` + `width`/`height` na
   `<img>` são obrigatórios.
2. **`<video controls>` + autoplay do observer.** `controls` visível não impede o
   `ligarVideoVertical` de dar `play()`/`pause()` por viewport. Observers da
   `GaleriaMidia` (dots) e de vídeo são distintos — conferir que não brigam.
3. **`scroll-snap-type: x mandatory` na galeria vs. `proximity` nas trilhas de
   E6-05.** Componentes diferentes, objetivos diferentes — ok.
4. **`overscroll-behavior-x: contain`** também na galeria (gesto "voltar" do
   webview — doc 09 §5).
5. **Prepend sintético de `BlocoSpecs`.** Lógica **pura** de `resolver.ts`
   (`blocosDe`, doc 08 §4.7) — esta story **não** a reimplementa; só passa
   `blocosDe(produto)` ao `RenderBlocos`.
6. **Sem runner de teste.** Verificação = `astro check` + `build` + rota
   `/dev/[amostra]` + roteiro sem-JS + grep de `eager`/`preload`.
