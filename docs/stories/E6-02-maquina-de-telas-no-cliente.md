# E6-02 — Máquina de telas no cliente (`telas.ts`): `html.js`, `data-tela`, `pushState`/`popstate`, revisita, religar vídeo

**Épico:** [E6](../epics/E6-fluxo-de-tres-telas.md) · **Estado:** ✅ feito (`aiox-dev`, 2026-09-02) — portão `validate`/`typecheck`/`build`/`doctor` exit 0; 4 rotas intactas; diff só em `telas.ts` (novo) + `global.css` + `Base.astro` + docs. Falta a aferição em device (E2-02).
**Esforço:** M (1–3 dias)
**Depende de:** E6-01 ✔ (seção única de 3 telas + `data-ir`/`data-cat`/`data-sku` inertes no HTML buildado) · E5-01 ✔ (`DetalheProduto` dentro de `#tela-detalhe`)
**Destrava:** E6-03 (`n/[slug].astro` herda o gate CSS), E3-01 (`slots/*` reescrevem as 3 telas por `?n=` — precisa da navegação de pé), E4-04 (Web Share do `location.href` com `#hash` da tela)

**Requisitos cobertos:**
RF-15.1 (estado no `#app[data-tela]`), RF-15.2 (`pushState` com `#hash` **preservando `location.search`**), RF-15.3 (`popstate`/`hashchange` reaplicam o estado), RF-15.4 (revisita começa na vitrine),
RF-16.2 (sem JS as 3 telas seguem visíveis e navegáveis por âncora — inalterado vs. E6-01), RF-16.3 (o CSS que oculta telas fica sob `html.js`; a classe entra pelo controlador),
RF-04.1 (mini/card abrem a tela de detalhe, não saem do site), RF-05.3 (memória do último nicho decide a revisita),
RNF-03 (zero JS **bloqueante** no `<head>` — nada novo no head), RNF-04 (funciona sem JS), RNF-08 (`prefers-reduced-motion` → troca instantânea, sem scroll suave), RNF-09 (`localStorage` só do último nicho — leitura, sem gravar nada novo), RNF-13 (nenhum asset novo eager).

**NÃO cobre nesta story:** reescrita das 3 telas por `?n=/?c=/?o=` clonando `<template>` (**E3-01/02/03**); `n/[slug].astro` migrando para a seção única (**E6-03**); `GaleriaMidia` rica / blocos restantes (**E5-02/E5-03**); filtro da faixa de miniaturas por categoria com JS (deferido — ver *Fora de escopo*); Web Share (**E4-04**); medição de `popstate`/LCP/jank no webview real (**E2-02**); transição coreografada de tela (Could C4); ilha Preact (Could C1).

**Arquivos-guia (ler antes de implementar):**
- [architecture/09](../architecture/09-fluxo-de-telas-e-apresentacao.md) — **§1** ("O que o JS revela / reescreve": os 5 passos de `telas.ts`, o gate `html.js`, o CSS de ocultar), **§2** (tabela de degradação tela a tela — o alvo SEM JS não muda), **§3** (continuidade de `?n/?c/?o` no `pushState`/`popstate`; papel do `localStorage`), **§4** ("Alterados": `Base.astro`, `CardProduto`, `GradeCatalogo`; "Inalterados": `video-vertical.ts` "só passa a ser chamado também pela tela de detalhe"), **§5** (riscos: `pushState` no webview, scroll-snap vs. gesto voltar, reduced-motion)
- [ADR-007](../architecture/decisions/adr-007-catalogo-categorizado-e-apresentacao-rica.md) — item 4 e alternativa **F** (por que seção única + `#hash` e não 3 rotas: sem JS o `<a href>` estático perde `?c=/?o=` → quebra atribuição — R-08)
- [prd/02-requisitos](../prd/02-requisitos.md) — RF-15 (15.1–15.5), RF-16 (16.2/16.3), RF-05.3, RNF-03/04/08/09/13
- [E6-01](E6-01-casca-tres-telas.md) — a seção **"Fora de escopo"** lista item a item o que É esta story; CA 1–5 (estrutura do `#app`), CA 8–13 (os `data-ir`/`data-cat`/`data-sku` que esta story passa a ouvir), CA 23 (o roteiro SEM JS que esta story **não pode regredir**)
- [E5-01](E5-01-registry-blocos-e-detalhe.md) — CA 14 (forma do `DetalheProduto`, o `data-ir="vitrine"` do "voltar")
- Código a consumir (NÃO reescrever): `src/lib/motion/reduced-motion.ts` (`prefereMenosMovimento()`), `src/lib/midia/video-vertical.ts` (`ligarVideoVertical(root?: ParentNode)`), `src/lib/personalizacao/contexto.ts` (`aplicarPersonalizacao()` — roda **antes** e grava `localStorage['prometeus:ultimo-nicho']`)
- Código a alterar: `src/layouts/Base.astro` (1 import + 1 chamada no `<script>` que já existe), `src/styles/global.css` (1 bloco de regras sob `html.js`)
- Código a criar: `src/lib/navegacao/telas.ts`
- Referência de estilo de módulo client: `src/lib/personalizacao/contexto.ts` (guarda `typeof window`), `src/lib/midia/video-vertical.ts`

---

## Contexto

E6-01 entregou a **casca estática**: `src/pages/index.astro` é a seção única de 3
telas (`<div id="app" data-tela="entrada">` com `#tela-entrada` / `#tela-vitrine`
/ `#tela-detalhe` nessa ordem), buildada com o `NICHO_PADRAO`. Hoje as 3 telas
aparecem **empilhadas e visíveis** — nenhum CSS as esconde — e são navegáveis
**só por âncora nativa**: o CTA da entrada aponta `#tela-vitrine`, os chips
apontam `#cat-<id>`, minis e cards apontam `#produto-<sku>`, o "voltar" do
detalhe aponta `#tela-vitrine`. Todos os elementos carregam marcadores **inertes**
no HTML buildado: `data-ir="vitrine|detalhe"`, `data-cat` nos chips,
`data-sku`/`data-categoria`/`data-prioridade` nos produtos, `data-tela` no `#app`.
A `VitrineFoco` entra com `hidden` estático.

Esta story **liga o JS por cima disso**, como **progressive enhancement**:
`src/lib/navegacao/telas.ts` transforma a página longa em 3 estados trocáveis,
sem quebrar em nada a degradação por âncora da E6-01. O controlador:

1. adiciona `document.documentElement.classList.add('js')` como **primeira coisa**
   ao ligar — o CSS que oculta telas fica **todo** sob `html.js`, então *enquanto
   o controlador não roda (ou se falhar), nada some* (RF-16.3);
2. lê o `#hash` (e a memória de revisita) para decidir a tela inicial;
3. intercepta cliques em `[data-ir]` → troca `#app[data-tela]`, marca chip/artigo
   ativo, rola até o topo da tela, religa o vídeo do detalhe;
4. dá `history.pushState` a cada transição **preservando `location.search`**
   intacto (`?n/?c/?o` nunca saem da URL — R-08);
5. ouve `popstate` **e** `hashchange` → reaplica o estado a partir do hash (o
   botão "voltar" do webview anda entrada ↔ vitrine ↔ detalhe sem sair da página).

Nada de `?n=` aqui (isso é E3-01). Nada de `<template>` (E3). Nada em
`resolver.ts`/`validar.ts`/schema. Nada em `n/[slug].astro` (E6-03). JS puro,
pequeno (~2 KB), `type="module"` no fim do `<body>` — caminho **não** crítico.

### História

> Como **visitante no webview do TikTok**, quero tocar em "ver a vitrine", num
> produto e no "voltar", e ter as 3 telas trocando na hora — com o botão físico
> "voltar" do webview me levando de volta pela trilha entrada → vitrine → detalhe
> sem fechar a página — e com o link (`?n/?c/?o` + `#hash`) sempre reproduzindo a
> tela em que eu estou.

> Como **dono do produto**, quero que, se o JS falhar ou demorar no webview, a
> página continue sendo exatamente a página longa navegável por âncora que a
> E6-01 entregou — nenhuma tela sumindo, todo link de saída ativo (RF-16 / RNF-04).

> Como **dev de E3-01 prestes a reescrever as 3 telas por `?n=`**, quero a
> máquina de estados de tela já de pé e estável (`irPara(estado)`,
> `aplicarEstado(estado)`, hash canônico), para só plugar a reescrita de conteúdo
> por cima sem reabrir a navegação.

---

## Critérios de aceite

Numerados e verificáveis. Onde há comando, o comando **é** o critério.

### A. Módulo `src/lib/navegacao/telas.ts` (novo)

1. Arquivo novo em `src/lib/navegacao/telas.ts`. Caminho e nome seguem
   [architecture/09](../architecture/09-fluxo-de-telas-e-apresentacao.md) §1/§4,
   o épico [E6](../epics/E6-fluxo-de-tres-telas.md) e o
   [PLANO-PROXIMO-PASSO](../epics/PLANO-PROXIMO-PASSO.md) (todos dizem
   `src/lib/navegacao/telas.ts`). Sem divergência a reconciliar.
2. Exporta o tipo e as funções, com **exatamente** estas assinaturas:
   ```ts
   export type Tela = 'entrada' | 'vitrine' | 'detalhe';
   export interface EstadoTela {
     tela: Tela;
     cat?: string;   // presente só quando tela === 'vitrine' e a transição veio de um chip
     sku?: string;   // presente só quando tela === 'detalhe'
   }

   /** '' para entrada; '#vitrine' [+ '&cat=<id>']; '#produto=<sku>'. */
   export function hashDe(estado: EstadoTela): string;

   /** Parse de `location.hash` → EstadoTela. Hash vazio/desconhecido → { tela: 'entrada' }. */
   export function estadoDeHash(hash: string): EstadoTela;

   /** Estado inicial: hash > revisita (recorrente, sem ?n=, sem hash) > entrada. */
   export function estadoInicial(): EstadoTela;

   /** Aplica o estado ao DOM (data-tela, chip ativo, artigo ativo, foco, scroll,
    *  religa o vídeo do detalhe). NÃO toca no history. */
   export function aplicarEstado(
     estado: EstadoTela,
     opts?: { rolar?: boolean; suave?: boolean },
   ): void;

   /** Transição por interação: aplicarEstado + history.pushState preservando search. */
   export function irPara(estado: EstadoTela): void;

   /** Liga a máquina de telas. Idempotente. Chamada uma vez pelo <script> de Base.astro. */
   export function ligarNavegacaoTelas(): void;
   ```
3. **Formato exato do hash** (`hashDe`) — `[AUTO-DECISION]` segue RF-15.2 e
   [architecture/09](../architecture/09-fluxo-de-telas-e-apresentacao.md) §1
   (ambos explícitos), **não** o `#detalhe/<sku>`/`#entrada` que o prompt de
   spawn sugeriu:
   - `{ tela: 'entrada' }` → `''` (string vazia — a URL fica **sem** fragmento);
   - `{ tela: 'vitrine' }` → `'#vitrine'`;
   - `{ tela: 'vitrine', cat: 'x' }` → `'#vitrine&cat=x'`;
   - `{ tela: 'detalhe', sku: 's' }` → `'#produto=s'`.
   O `=` em `#produto=<sku>` é **deliberado**: não colide com o `id` de elemento
   `produto-<sku>` (hífen) que a E6-01 usa para a âncora sem JS — as duas
   convenções convivem.
4. `estadoDeHash(raw)` normaliza `raw` (tira o `#` inicial) e resolve:
   - `''`, `'entrada'`, `'tela-entrada'` → `{ tela: 'entrada' }`;
   - `'vitrine'`, `'tela-vitrine'` → `{ tela: 'vitrine' }`;
   - começa com `'vitrine&'` → `{ tela: 'vitrine', cat: <valor de `cat=`> }`;
   - começa com `'cat-'` → `{ tela: 'vitrine', cat: <resto> }` (upgrade de uma
     âncora sem-JS da E6-01);
   - começa com `'produto='` **ou** `'produto-'` → `{ tela: 'detalhe', sku: <resto> }`;
   - `'tela-detalhe'` → `{ tela: 'detalhe' }` (sem `sku` — cai no fallback do CA 8);
   - qualquer outra coisa → `{ tela: 'entrada' }`.
   Reconhecer as formas de `id` de elemento (`tela-*`, `cat-*`, `produto-*`) faz
   um link herdado de uma sessão sem-JS (ou compartilhado no meio do upgrade)
   resolver para o estado equivalente. A **saída canônica** sempre usa as formas
   do CA 3 (via `hashDe`).
5. `estadoInicial()`:
   - se `location.hash` não é vazio nem `'#'` → `estadoDeHash(location.hash)`;
   - senão, se `!new URLSearchParams(location.search).has('n')` **e** o visitante
     é **recorrente** → `{ tela: 'vitrine' }` (RF-15.4 / RF-05.3);
   - senão → `{ tela: 'entrada' }`.
   "Recorrente" = havia `localStorage['prometeus:ultimo-nicho']` **no momento em
   que `telas.ts` foi avaliado** — capturado num `const` no **top-level do
   módulo** (roda na fase de import, **antes** de `aplicarPersonalizacao()`
   gravar a chave nesta carga — ver *Riscos* nota 3). Leitura em `try/catch`
   (modo privado). `[AUTO-DECISION]` regra da revisita = **começa na vitrine**
   (D-11 do PLANO, "default proposto: pula" a entrada); fica isolada nesse único
   ramo de `estadoInicial()` para virar um flip de 1 linha quando houver dado de
   tráfego (E2-02).
6. `aplicarEstado(estado, opts)` — **puro efeito no DOM, nunca mexe no `history`**:
   - `document.getElementById('app')!.dataset.tela = estado.tela`;
   - **chip ativo:** tira `.ativo` + `aria-current` de todo `#tela-vitrine .trilha .chip`;
     se `estado.tela === 'vitrine'`, põe em `[data-cat="<estado.cat>"]` (ou no
     primeiro chip quando `cat` ausente);
   - **artigo ativo:** tira `.ativo` de todo `#tela-detalhe > article[data-sku]`;
     se `estado.tela === 'detalhe'`, acha `#tela-detalhe > article[data-sku="<estado.sku>"]`,
     põe `.ativo` nele, e chama `religarVideo(article)` (CA 9);
   - **foco (a11y):** no elemento-alvo da tela (heading da tela ativa, ou o
     `<article>` ativo no detalhe): se não tiver `tabindex`, seta `tabindex="-1"`;
     `.focus({ preventScroll: true })` dentro de `try/catch`;
   - **scroll:** se `opts?.rolar !== false`, `alvo.scrollIntoView({ block: 'start',
     behavior: (opts?.suave && !prefereMenosMovimento()) ? 'smooth' : 'auto' })`
     no topo da tela ativa (ou no `<article>` ativo, no detalhe);
   - guardar `estado` num módulo-local `estadoAtual` (para o dedupe do CA 7).
7. `irPara(estado)`:
   - se `estado` é igual ao `estadoAtual` (mesma `tela`+`cat`+`sku`) → **no-op**;
   - `aplicarEstado(estado, { rolar: true, suave: true })`;
   - `history.pushState({ ...estado }, '', location.pathname + location.search + hashDe(estado))`.
   **`location.search` é concatenado intacto e antes do fragmento** — nunca
   reescrito, nunca perdido (R-08 / RF-15.2). `[AUTO-DECISION]` a URL é montada
   como `pathname + search + hash` (ordem correta de URL); o trecho
   `'#' + hash + location.search` do doc 09 §1.3 é impreciso na ordem e fica
   reconciliado aqui.
8. **Deep-link inválido:** `estadoDeHash` devolveu `{ tela: 'detalhe' }` sem
   `sku`, ou `sku` que não casa nenhum `#tela-detalhe > article[data-sku]`, ou
   `cat` que não casa nenhum chip → `aplicarEstado` trata como
   `{ tela: 'entrada' }` e `ligarNavegacaoTelas` faz `history.replaceState` para
   a URL canônica limpa (sem fragmento). Nunca lança, nunca deixa a tela de
   detalhe vazia.
9. **Religar vídeo sem duplicar observer** (`religarVideo(article)`): mantém um
   `const skusComVideoLigado = new Set<string>()` no módulo; só chama
   `ligarVideoVertical(article)` quando o `sku` do artigo ainda não está no `Set`,
   e então adiciona. Motivo: `ligarVideoVertical` cria um `IntersectionObserver`
   **novo** e um listener de `click` **novo** a cada chamada (ver
   `src/lib/midia/video-vertical.ts`) — chamar de novo no mesmo `<article>`
   empilharia observers e listeners. **Não** alterar `video-vertical.ts` (a
   guarda vive em `telas.ts`). Nota: hoje o `DetalheProduto` de E5-01 usa
   `<video controls>` (sem `data-vertical`), então a chamada é **quase no-op**
   (`ligarVideoVertical` sai cedo com `videos.length === 0`); ela fica ligada
   agora para a `GaleriaMidia` de E5-02 funcionar sem reabrir `telas.ts` (ver
   *Riscos* nota 5).
10. `ligarNavegacaoTelas()`:
    - guarda de idempotência (`let ligada = false`) e de ambiente
      (`if (typeof document === 'undefined') return`);
    - `const app = document.getElementById('app'); if (!app) return;`
    - `document.documentElement.classList.add('js')` — **primeira ação efetiva**;
    - **swap da vitrine, uma vez:** `document.querySelector('#tela-vitrine .vitrine-foco')?.removeAttribute('hidden')`
      e `(document.querySelector('#tela-vitrine .grade-catalogo') as HTMLElement | null)?.setAttribute('hidden', '')`
      — com JS a `VitrineFoco` assume e a `GradeCatalogo` (fallback sem-JS) sai.
      Feito **imperativamente** (não por CSS) para que, se `telas.ts` falhar
      depois, a grade continue sendo o fallback;
    - `const inicial = estadoInicial(); aplicarEstado(inicial, { rolar: inicial.tela !== 'entrada', suave: false });`
    - `history.replaceState({ ...inicial }, '', location.pathname + location.search + hashDe(inicial))`
      (normaliza a URL **sem** criar entrada no history);
    - registra `document.addEventListener('click', aoClicar)` e
      `window.addEventListener('popstate', aoHistorico)` **e**
      `window.addEventListener('hashchange', aoHistorico)`.
    - `aoClicar(ev)`: `const alvo = (ev.target as Element).closest?.('[data-ir]')`;
      sai se não achou, se `ev.defaultPrevented`, se `ev.button !== 0`, ou se
      `ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey` (deixa o browser
      abrir em nova aba); senão `ev.preventDefault()` e:
      `data-ir="vitrine"` → `irPara({ tela: 'vitrine', cat: alvo.getAttribute('data-cat') ?? undefined })`;
      `data-ir="detalhe"` → `const sku = alvo.getAttribute('data-sku'); if (sku) irPara({ tela: 'detalhe', sku })`;
      `data-ir="entrada"` → `irPara({ tela: 'entrada' })`.
    - `aoHistorico()`: `aplicarEstado(estadoDeHash(location.hash), { rolar: true, suave: false })`
      (scroll **instantâneo** no voltar/avançar — sensação de "voltar" nativo).
    - `import.meta.env.DEV` opcional: um `console.warn` se `#app` não for achado.

### B. Gate `html.js` + CSS (`src/styles/global.css`)

11. `[AUTO-DECISION]` As regras que ocultam telas ficam em
    **`src/styles/global.css`** (não num `<style>` de `index.astro`). Motivo:
    RF-16.3 vale para `/` **e** `/n/<slug>`; deixar o gate global faz a E6-03 ser
    só "trocar o corpo da página", sem duplicar CSS. Fica ao lado do reset de
    `prefers-reduced-motion` que já mora nesse arquivo.
12. Bloco novo no fim de `global.css`, **todo** prefixado por `html.js` (exceto a
    regra do CA 13), comentado como E6-02:
    ```css
    /* A VitrineFoco tem `hidden` estático (E6-01). Sem esta regra, o
       `.vitrine-foco { display:flex }` do componente venceria o `[hidden]` do
       user-agent (regra de autor > UA) e a seção apareceria empilhada mesmo
       sem JS. Especificidade #id .classe[attr] vence o `.vitrine-foco` scoped. */
    #tela-vitrine .vitrine-foco[hidden] { display: none; }

    /* Só a tela ativa aparece — SÓ sob html.js. */
    html.js #app > .tela { display: none; }
    html.js #app[data-tela='entrada'] #tela-entrada,
    html.js #app[data-tela='vitrine'] #tela-vitrine,
    html.js #app[data-tela='detalhe'] #tela-detalhe { display: block; }

    /* Dentro do detalhe, só o <article> marcado `.ativo` por telas.ts. */
    html.js #tela-detalhe > article[data-sku] { display: none; }
    html.js #tela-detalhe > article[data-sku].ativo { display: block; }
    ```
13. A regra `#tela-vitrine .vitrine-foco[hidden] { display: none; }` **não** tem
    o prefixo `html.js` de propósito: ela conserta um comportamento de E6-01 (a
    `VitrineFoco` aparecia empilhada sem JS porque o `display:flex` do componente
    vencia o `[hidden]`) e vale com ou sem JS. Quando `telas.ts` remove o
    atributo `hidden` (CA 10), a regra deixa de casar e o `display:flex` do
    componente assume.
14. `global.css` **não** ganha `@import` novo, nem token novo, nem regra fora
    desse bloco. `src/styles/tokens.css` **não** é tocado.

### C. `src/layouts/Base.astro`

15. Única mudança: no `<script>` `type="module"` que **já existe** no fim do
    `<body>`, acrescentar o import e a chamada de `ligarNavegacaoTelas()`, **depois**
    de `aplicarPersonalizacao()` e antes de (ou junto a) `ligarVideoVertical()`:
    ```astro
    <script>
      import { aplicarPersonalizacao } from '../lib/personalizacao/contexto';
      import { ligarNavegacaoTelas } from '../lib/navegacao/telas';
      import { ligarVideoVertical } from '../lib/midia/video-vertical';
      aplicarPersonalizacao();
      ligarNavegacaoTelas();
      ligarVideoVertical();
    </script>
    ```
16. `Base.astro` **não** ganha `<script>` no `<head>`, **não** ganha
    `class="js"` no HTML server-render, **não** ganha `<style>` novo, **não**
    importa `slots`/`telas` em nenhum outro ponto. `<TarjaOferta />` segue inerte
    como está. RNF-03 intacto: nada novo no `<head>`, o único script novo é
    `type="module"` no fim do `<body>`.

### D. Comportamento COM JS

Roteiro manual em `npm run dev` (e conferir no `dist/` buildado), JS **ligado**:

17. Abrir `/` (1ª visita — sem `localStorage`): só a **tela de entrada** aparece
    (`#app[data-tela="entrada"]`, `html.js` presente). Vitrine e detalhe não
    ocupam espaço. A URL não tem fragmento.
18. Tocar o CTA "ver a vitrine" (`[data-ir="vitrine"]`): troca para a **vitrine**;
    aparece a `VitrineFoco` (herói + faixa de miniaturas), a `GradeCatalogo`
    **some**; a URL vira `…/#vitrine` **com o `?n/?c/?o` que houver intacto e
    antes do `#`**; a página rola até o topo da vitrine. O primeiro chip fica
    `aria-current="true"`.
19. Tocar um **chip** de categoria (`[data-ir="vitrine"][data-cat="<id>"]`): fica
    na vitrine, o chip tocado vira o ativo (`.ativo` + `aria-current`), a URL
    vira `…/#vitrine&cat=<id>`. (Filtrar a faixa por essa categoria é *Fora de
    escopo* — a faixa da E6-01 é plana.)
20. Tocar uma **mini** ou o corpo de um **card** (`[data-ir="detalhe"][data-sku]`):
    troca para o **detalhe**; **só** o `<article id="produto-<sku>">` daquele
    `sku` aparece (os outros ficam `display:none`); a URL vira `…/#produto=<sku>`;
    rola até o artigo; o foco vai para o artigo/heading; se o artigo tiver
    `<video data-vertical>` (E5-02), ele é observado uma única vez.
21. Tocar "← Voltar à vitrine" no detalhe (`[data-ir="vitrine"]`): volta para a
    vitrine; URL `…/#vitrine`.
22. **Voltar/avançar do navegador (e o botão físico do webview):**
    - após entrada → vitrine → detalhe, o **voltar** leva detalhe → vitrine →
      entrada, reaplicando cada estado a partir do `#hash` (scroll instantâneo),
      **sem recarregar a página** e **sem sair para fora**;
    - **avançar** refaz o caminho;
    - em todo passo, `?n/?c/?o` continua na URL;
    - abrir `/?n=algum&c=x#produto=<sku>` direto (deep-link) cai na tela de
      detalhe do `sku`, com `?n=algum&c=x` preservado; `#produto=<sku-inexistente>`
      cai na entrada com a URL normalizada (CA 8).

### E. Comportamento SEM JS — degradação **idêntica** à E6-01 (RF-16.2 / RNF-04)

23. Com JS **desabilitado**, abrir `/` reproduz **exatamente** o roteiro do CA 23
    da E6-01, sem regressão:
    - `<html>` **não** tem a classe `js`; **nenhuma** regra do bloco do CA 12
      casa; as 3 `<section class="tela">` ficam visíveis e empilhadas;
    - a `TelaEntrada` no topo; o CTA `#tela-vitrine` **rola** por âncora nativa
      até a vitrine;
    - a `TrilhaCategorias` é um `<nav>` de links; um chip `#cat-<id>` rola até o
      heading da categoria na `GradeCatalogo`;
    - a `VitrineFoco` **não** aparece (`hidden` estático **agora respeitado**
      graças à regra do CA 13); a `GradeCatalogo` agrupada por categoria é a
      vitrine efetiva;
    - todas as `<article id="produto-<sku>">` de detalhe aparecem empilhadas;
      um link `#produto-<sku>` (card ou mini) rola até a certa;
    - todo link de saída (`target="_blank" rel="noopener nofollow"` + `data-sku`)
      presente e ativo: um por card da grade + um por `<article>` de detalhe
      (+ o do herói da `VitrineFoco`, que está `hidden`).
24. `git`-equivalente: o HTML **buildado** de `index.astro` não muda (esta story
    não toca `index.astro`). O que muda no `dist/` é `global.css` (bloco novo) e
    o bundle do `<script>` de `Base.astro` (agora inclui `telas.ts`).
25. A regra do CA 13 é a **única** diferença observável do fallback sem-JS vs.
    E6-01: a `VitrineFoco` que na E6-01 aparecia empilhada (bug latente — o
    `[hidden]` era vencido) agora fica de fato oculta sem JS. É uma **correção**
    alinhada a [architecture/09](../architecture/09-fluxo-de-telas-e-apresentacao.md)
    §2 ("Decisão: `VitrineFoco` recebe `hidden` estático e é revelada pelo JS;
    sem JS fica a grade"). Registrar no PR.

### F. `prefers-reduced-motion`

26. Com `prefers-reduced-motion: reduce` (emular no DevTools) e JS ligado:
    - toda transição de tela é **instantânea** — `aplicarEstado` usa
      `behavior: 'auto'` no `scrollIntoView` (o `opts.suave` é ignorado quando
      `prefereMenosMovimento()` é `true`);
    - nenhuma animação nova é introduzida por esta story; o `scroll-behavior:
      smooth` das faixas (E6-01) já está sob `@media (prefers-reduced-motion:
      no-preference)` e o reset global de `global.css` zera o resto (RNF-08).

### G. Rotas e diff

27. As **4 rotas** continuam geradas e válidas após `npm run build`:
    `dist/index.html`, `dist/404.html`, `dist/n/exemplo/index.html`,
    `dist/sitemap.xml`. `/` agora tem o gate `html.js` no `global.css` embutido;
    `/n/exemplo/` **inalterado** (E6-03 é quem migra); `/404` e `/sitemap.xml`
    inalterados.
28. `dist/index.html`: **nenhum** asset novo `eager`; a única mídia sem
    `loading="lazy"` segue sendo a capa do herói da `TelaEntrada`
    (`data-slot="entrada-heroi"`) — esta story não adiciona `<img>`/`<video>`
    (RNF-13). Registrar no PR o tamanho de `dist/index.html` cru e gzip (mudança
    esperada: ~0, só o gate CSS; o `telas.ts` entra no `.js` do bundle, não no
    HTML).
29. `git diff --stat` altera/cria **apenas**:
    - `src/lib/navegacao/telas.ts` (novo),
    - `src/styles/global.css` (1 bloco),
    - `src/layouts/Base.astro` (1 import + 1 chamada),
    - docs: `docs/stories/E6-02-maquina-de-telas-no-cliente.md` (este),
      `docs/stories/README.md`, `docs/ESTADO-ATUAL.md`,
      `docs/epics/PLANO-PROXIMO-PASSO.md`, `docs/epics/E6-fluxo-de-tres-telas.md`.
    **Nada** em `src/data/*`, `src/lib/catalogo/*`, `src/lib/personalizacao/*`,
    `src/lib/midia/*`, `src/lib/motion/*`, `src/pages/index.astro`,
    `src/pages/n/[slug].astro`, `src/pages/404.astro`,
    `src/pages/sitemap.xml.ts`, `src/components/**`, `src/styles/tokens.css`.

### H. Portão final

30. Os quatro comandos, do zero, passam nesta ordem, todos **exit 0**:
    ```
    npm run validate      # catalog validate — exemplo íntegro (aviso do exemplo órfão é esperado)
    npm run typecheck     # astro check — strict, sem erro nem warning novo
    npm run build         # prebuild roda o validate; astro build gera / , /404.html , /n/exemplo/ , /sitemap.xml
    npm run doctor        # ambiente ok
    ```
    `npm run dev` sobe sem erro e serve `/` com a máquina de telas ligada.
31. `telas.ts` é client-only e sem dependência nova: importa **só**
    `../motion/reduced-motion` e `../midia/video-vertical` (ambos já no repo) e
    tipos. `package.json` diff vazio. Nenhum `import` de `astro:*`, `node:*`,
    `resolver.ts`, `contexto.ts` ou componente.

---

## Plano de tarefas (ordenado, arquivo por arquivo)

> Sequência pensada para manter `astro check` verde a cada passo.

### Tarefa 1 — `src/lib/navegacao/telas.ts` (novo)

Criar o módulo completo (CA 2–10). Esqueleto:

```ts
/**
 * Máquina de telas no cliente (E6-02). Progressive enhancement sobre a casca
 * estática de E6-01. Adiciona `html.js`, alterna `#app[data-tela]`, faz
 * pushState com `#hash` PRESERVANDO `location.search`, e ouve popstate/hashchange.
 * Sem JS (ou se este módulo falhar): nada disso roda e a página segue navegável
 * por âncora (RF-16). Ver docs/architecture/09 §1.
 */
import { prefereMenosMovimento } from '../motion/reduced-motion';
import { ligarVideoVertical } from '../midia/video-vertical';

export type Tela = 'entrada' | 'vitrine' | 'detalhe';
export interface EstadoTela { tela: Tela; cat?: string; sku?: string }

const CHAVE_MEMORIA = 'prometeus:ultimo-nicho';

/**
 * Snapshot da memória de revisita ANTES de `aplicarPersonalizacao()` gravar a
 * chave nesta carga. ES modules avaliam este top-level na fase de import — que
 * acontece antes de qualquer chamada no <script> de Base.astro. Ver Riscos nota 3.
 */
const eraRecorrente: boolean = (() => {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(CHAVE_MEMORIA) != null;
  } catch {
    return false;
  }
})();

let ligada = false;
let estadoAtual: EstadoTela = { tela: 'entrada' };
const skusComVideoLigado = new Set<string>();

export function hashDe(estado: EstadoTela): string { /* CA 3 */ }
export function estadoDeHash(hash: string): EstadoTela { /* CA 4 */ }
export function estadoInicial(): EstadoTela { /* CA 5 */ }

function elTelaAtiva(tela: Tela): HTMLElement | null { /* #tela-<tela> */ }
function marcarChip(cat?: string): void { /* CA 6 */ }
function marcarArtigo(sku?: string): HTMLElement | null { /* CA 6 — devolve o <article> ativo */ }
function religarVideo(article: HTMLElement | null): void { /* CA 9 — Set guard */ }
function focar(alvo: HTMLElement | null): void { /* CA 6 — tabindex=-1 + focus({preventScroll:true}) */ }

export function aplicarEstado(estado: EstadoTela, opts?: { rolar?: boolean; suave?: boolean }): void { /* CA 6 */ }
export function irPara(estado: EstadoTela): void { /* CA 7 */ }

function aoClicar(ev: MouseEvent): void { /* CA 10 */ }
function aoHistorico(): void { /* CA 10 — aplicarEstado(estadoDeHash(location.hash), { rolar:true, suave:false }) */ }

export function ligarNavegacaoTelas(): void { /* CA 10 */ }
```

Pontos de atenção:
- `hashDe({ tela: 'entrada' })` devolve `''`; em `irPara`/`replaceState` a URL
  fica `pathname + search` (sem `#`).
- `estadoDeHash` nunca lança; entrada desconhecida → `{ tela: 'entrada' }`.
- `aplicarEstado`: ao entrar em `entrada`/`vitrine`, **limpar** `.ativo` de todos
  os `<article>` de detalhe (senão sobra do detalhe anterior).
- `aplicarEstado` para `detalhe` sem `<article>` correspondente → rebaixa para
  `{ tela: 'entrada' }` (CA 8).
- `irPara` com `estado` == `estadoAtual` → no-op (evita lixo no history ao tocar
  duas vezes).
- `aoClicar` respeita clique de teclado/modificado e `defaultPrevented`.
- Guardar `ligada` para idempotência; `ligarNavegacaoTelas` sai cedo se
  `typeof document === 'undefined'` ou se não achar `#app`.

### Tarefa 2 — `src/styles/global.css` (alterar — 1 bloco no fim)

Colar o bloco do CA 12 **depois** do `@media (prefers-reduced-motion: reduce)`
existente. Conferir que:
- `#tela-vitrine .vitrine-foco[hidden]` **não** tem prefixo `html.js` (CA 13);
- todas as outras linhas têm `html.js` como primeiro seletor;
- nenhum `@import`/token novo (CA 14).

### Tarefa 3 — `src/layouts/Base.astro` (alterar — 1 import + 1 chamada)

Adicionar `import { ligarNavegacaoTelas } from '../lib/navegacao/telas';` e a
chamada `ligarNavegacaoTelas();` entre `aplicarPersonalizacao();` e
`ligarVideoVertical();` no `<script>` do fim do `<body>` (CA 15). **Nada** no
`<head>` (CA 16).

### Tarefa 4 — Portão + verificação manual + docs

- `npm run validate && npm run typecheck && npm run build && npm run doctor` — exit 0 (CA 30).
- `npm run dev` + roteiro **COM JS** (CA 17–22): entrada → vitrine → chip →
  detalhe → voltar; `?n=x&c=y` na URL o tempo todo; voltar/avançar do navegador;
  deep-link `#produto=<sku>` e `#produto=<inexistente>`.
- Roteiro **SEM JS** (CA 23–25): idêntico à E6-01; confirmar que a `VitrineFoco`
  agora fica oculta (regra do CA 13) e a grade é a vitrine.
- **reduced-motion** (CA 26): emular no DevTools, trocar de tela → instantâneo.
- `dist/`: 4 rotas (CA 27); grep do `dist/index.html` — nenhuma `<img>`/`<video>`
  nova, só a capa do herói eager (CA 28); registrar tamanho cru+gzip.
- `git diff --stat` confere o CA 29.
- `docs/stories/README.md`: linha da E6-02 → 🔵 detalhada; parágrafo de topo cita
  E6-02 como próxima de E6.
- `docs/ESTADO-ATUAL.md` ("O que NÃO existe ainda"): a navegação client-side de
  telas (`telas.ts`, `html.js`, `pushState`/`popstate`, esconder telas) **passa a
  existir**; resta E6-03 (`n/[slug].astro` na seção única) e E3 (reescrita por `?n=`).
- `docs/epics/E6-fluxo-de-tres-telas.md`: marcar os itens de `telas.ts` /
  `Base.astro` / gate CSS como feitos; o que resta em E6 é E6-03 + teste em device.
- `docs/epics/PLANO-PROXIMO-PASSO.md`: (a) na seção "Status", registrar E6-02
  entregue; (b) **corrigir a "Pendência herdada"** — o bug do `import.meta.glob`
  em `src/lib/catalogo/carregar.ts` **já foi corrigido** (`query: '?url'` no
  `import.meta.glob`, ver o arquivo); remover/atualizar o parágrafo que ainda o
  lista como pendente.

---

## Definição de Pronto

- [ ] `npm run validate` / `npm run typecheck` / `npm run build` / `npm run doctor` — todos exit 0.
- [ ] `npm run dev`: **COM JS**, `/` abre na entrada; CTA → vitrine (grade some,
      VitrineFoco aparece, `#vitrine` na URL); chip → `#vitrine&cat=<id>`;
      mini/card → detalhe (só 1 `<article>` visível, `#produto=<sku>`); "voltar" →
      vitrine.
- [ ] Voltar/avançar do navegador anda entrada ↔ vitrine ↔ detalhe **sem
      recarregar** e **sem sair**; `?n/?c/?o` intactos em todo passo; deep-link
      `#produto=<sku>` abre no detalhe certo; `#produto=<inexistente>` cai na
      entrada com URL normalizada.
- [ ] **SEM JS**: roteiro do CA 23 da E6-01 reproduzido sem regressão — 3 telas
      empilhadas, âncoras rolando, todo link de saída presente; a `VitrineFoco`
      agora fica oculta (correção do `[hidden]`), a grade é a vitrine.
- [ ] `prefers-reduced-motion: reduce` → troca de tela instantânea, sem scroll suave.
- [ ] `<html>` só ganha `class="js"` **quando `telas.ts` roda**; sem JS (ou se o
      módulo falhar) nenhuma regra do gate casa.
- [ ] `history.pushState`/`replaceState` sempre montam a URL como
      `pathname + search + hash` — `location.search` nunca é reescrito nem perdido.
- [ ] `ligarVideoVertical` não é chamado duas vezes para o mesmo `<article>`
      (guarda por `Set` de sku em `telas.ts`); `video-vertical.ts` não foi tocado.
- [ ] As 4 rotas seguem geradas e válidas; `dist/index.html` sem asset novo eager.
- [ ] Sem dependência nova; nada novo no `<head>`; o único `<script>` novo é
      `type="module"` no fim do `<body>` (RNF-03).
- [ ] `git diff --stat` toca só `telas.ts` (novo), `global.css`, `Base.astro` e docs.
- [ ] PR descreve: (a) hash `#vitrine`/`#produto=<sku>` (RF-15.2, não `#detalhe/<sku>`);
      (b) `.js` vem do controlador, não do `<head>` (resiliência — gate nunca
      sobrevive ao controlador; FOUC aceito); (c) revisita começa na vitrine
      (D-11, flip de 1 linha); (d) correção do `[hidden]` da `VitrineFoco`;
      (e) `ligarVideoVertical` no detalhe é quase no-op até E5-02.
- [ ] PLANO-PROXIMO-PASSO atualizado: E6-02 entregue **e** o bug do
      `import.meta.glob` marcado como já corrigido.

---

## Fora de escopo (fica para E3 / E5-02/03 / E6-03 / E4 / E2-02)

- **Reescrita das 3 telas por `?n=/?c=/?o=`** (clonar `<template id="tpl-*">`,
  `slots/{index,entrada,vitrine,detalhe}.ts`, `criativo.ts`, `oferta.ts`) —
  **E3-01/02/03**. Esta story não cria nenhum `<template>` nem toca
  `src/lib/personalizacao/*`. `telas.ts` só lê `location.search` para preservá-lo.
- **`n/[slug].astro` migrando para a seção única** (layout compartilhado com
  `index.astro`) — **E6-03**. O gate CSS já fica em `global.css` para E6-03 usar
  de graça.
- **Filtro/agrupamento da faixa de miniaturas por categoria com JS.** A
  `VitrineFoco` de E6-01 tem uma faixa **plana** (todos os produtos). Com JS, o
  chip só marca o estado ativo e escreve `#vitrine&cat=<id>`; filtrar/rolar a
  faixa pela categoria escolhida exige decidir o caso de categoria vazia e a
  categoria do herói — deferido (candidato a E3-02 junto com `?c=` que reordena
  categorias, ou a um refinamento de E6). Sem JS, o chip continua sendo a âncora
  `#cat-<id>` para o heading da grade (E6-01).
- **`GaleriaMidia` rica** (scroll-snap + dots + `data-vertical` autoplay religado)
  e o `<dl>`/`BlocoSpecs` — **E5-02**. Blocos `como-usar`/`comparativo`/`bonus`/
  `faq` — **E5-03**. `telas.ts` já chama `ligarVideoVertical(article)` no detalhe
  para quando a galeria rica entrar.
- **Web Share API** (`navigator.share({ url: location.href })` na vitrine/detalhe)
  — **E4-04**. O `location.href` já carrega `?n/?c/?o` + `#hash` desta story.
- **Deep-link para bloco** (`#produto=<sku>&b=<idBloco>` → `scrollIntoView` no
  bloco) — **E5-02+** (a galeria/blocos ricos). `estadoDeHash` desta story ignora
  o `&b=`.
- **Transição coreografada de tela** (fade/slide) — Could C4, fora.
- **Ilha Preact de vitrine** — Could C1, fora.
- **Medição de `popstate`/LCP/TTI/jank de scroll-snap no webview real do TikTok
  (Android médio, 4G simulado)** — **E2-02**. Esta story entrega o comportamento;
  a aferição em device é a próxima.

---

## Riscos / notas de implementação

1. **FOUC: as 3 telas piscam empilhadas até `html.js` entrar.** `telas.ts` roda
   no fim do `<body>`; até lá, `#app` já tem `data-tela="entrada"` mas **não** há
   `html.js`, então nenhuma regra do gate casa e as 3 telas + todos os
   `<article>` de detalhe aparecem por alguns ms antes de colapsar.
   `[AUTO-DECISION]` **aceito.** Alternativas rejeitadas: (a) `<script>` inline no
   `<head>` adicionando `html.js` cedo — mata o FOUC, mas se `telas.ts` (fim do
   body) falhar em carregar, o gate fica ativo **sem controlador**: telas
   escondidas e nada navega → estado quebrado, pior que sem-JS; (b)
   `@media (scripting: enabled)` no CSS — mesmo problema de resiliência, e suporte
   irregular. Manter `html.js` vindo **do próprio `telas.ts`** (doc 09 §1.2:
   "sem `.js` → todas as telas visíveis") garante que o gate nunca sobrevive ao
   controlador. Mitigar o FOUC de verdade (critical CSS / skeleton) é fora de
   escopo — anotar como candidato a E2-02.

2. **`pushState`/`popstate` inconsistentes no webview do TikTok.** doc 09 §5:
   alguns webviews não disparam `popstate` de forma confiável. Mitigação desta
   story: ouvir **`popstate` E `hashchange`** e derivar o estado sempre de
   `location.hash` (fonte única). O teste em Android médio real é **E2-02** —
   registrar lá o resultado. Se nem `hashchange` disparar em algum webview, o
   fallback natural é a página não trocar de tela no "voltar" (degrada para
   "voltar fecha a página"), sem quebrar nada.

3. **Ordem de avaliação: `eraRecorrente` vs. `aplicarPersonalizacao()`.**
   `estadoInicial()` precisa saber se havia `localStorage['prometeus:ultimo-nicho']`
   **antes** desta carga. Mas `aplicarPersonalizacao()` (chamado no `<script>` de
   `Base.astro`) **grava** essa chave. Solução: `telas.ts` lê a chave num `const`
   de **top-level do módulo** (`eraRecorrente`), que executa na fase de import —
   antes de qualquer chamada de função no `<script>`. `contexto.ts` **não** grava
   nada em top-level (só dentro de `aplicarPersonalizacao()`), então a leitura é
   limpa. Comentar isso forte no código. Se um dia `contexto.ts` passar a gravar
   em top-level, mover para uma API explícita
   (`telas.ts` expõe `capturarRevisita()` chamado como 1ª linha do `<script>`).

4. **`ligarVideoVertical` duplicando observer/listener.** Cada chamada cria um
   `IntersectionObserver` novo e adiciona um listener de `click` (toggle de mudo)
   em cada `video[data-vertical]` sob a raiz. Entrar duas vezes no mesmo detalhe
   empilharia observers e listeners. Guarda em `telas.ts`:
   `skusComVideoLigado: Set<string>` — só religa quando o `sku` é inédito. **Não**
   tocar `video-vertical.ts` (doc 09 §4 o lista como "inalterado").

5. **`ligarVideoVertical(article)` é quase no-op hoje.** O `DetalheProduto` de
   E5-01 renderiza `<video controls preload="none">` — **sem** `data-vertical` —
   então `ligarVideoVertical` sai cedo (`videos.length === 0`). A chamada fica no
   código agora para que a `GaleriaMidia` de **E5-02** (que introduz
   `<video data-vertical>` autoplay no detalhe) funcione sem reabrir `telas.ts`.
   A guarda do risco 4 já cobre o caso "vira efetivo".

6. **`VitrineFoco` aparecia empilhada sem JS (bug latente de E6-01).** O
   `<section class="vitrine-foco" hidden>` tem, no `<style>` do componente,
   `.vitrine-foco { display: flex }` — e **regra de autor vence `[hidden]` do
   user-agent** (prioridade de origem, independe de especificidade). Ou seja, na
   E6-01 a seção estava visível sem JS, contra o CA 10/11 e o doc 09 §2.
   Correção **nesta story, sem tocar o componente**: a regra
   `#tela-vitrine .vitrine-foco[hidden] { display: none }` em `global.css`
   (especificidade `1,1,1` vence o `.vitrine-foco.astro-hash` `0,2,0`). Quando
   `telas.ts` remove o atributo `hidden`, a regra deixa de casar e o `display:flex`
   do componente assume. Registrar a correção no PR (é a única diferença
   observável do fallback sem-JS vs. E6-01).

7. **`scroll-behavior: smooth` × gesto "voltar" do webview × scroll-snap das
   faixas.** doc 09 §5: faixas horizontais podem sequestrar o swipe de navegação.
   A E6-01 já pôs `overscroll-behavior-x: contain` na `.trilha` e na `.vf-faixa`.
   A navegação entre telas desta story é por **hash**, não por scroll; o
   voltar/avançar usa `scrollIntoView({ behavior: 'auto' })` (instantâneo), sem
   animação que compita com o gesto. Nada a fazer além de não introduzir scroll
   suave no `popstate`.

8. **Foco/acessibilidade ao trocar de tela.** Trocar `display` não move o foco —
   um leitor de tela/teclado ficaria "preso" na tela antiga (agora
   `display:none`). `aplicarEstado` move o foco para o heading da tela ativa (ou
   o `<article>` ativo no detalhe): `tabindex="-1"` se faltar +
   `.focus({ preventScroll: true })` em `try/catch`. Foco **programático** não
   dispara `:focus-visible` na maioria dos motores, então não há outline
   piscando; o `scrollIntoView` explícito cuida da rolagem.

9. **Deep-link inválido.** `#produto=<sku-que-não-existe>` ou `#produto=` (sem
   sku): `aplicarEstado` não acha o `<article>` e rebaixa para
   `{ tela: 'entrada' }`; `ligarNavegacaoTelas` faz `replaceState` para a URL
   canônica limpa. Idem `#vitrine&cat=<id-inexistente>` → vitrine com o primeiro
   chip ativo. Nunca lança, nunca deixa tela vazia (CA 8).

10. **`index.astro` NÃO é tocado.** O gate vive em `global.css`; os `data-ir`/
    `data-cat`/`data-sku` e o `#app[data-tela]` já vêm de E6-01. Isso mantém o
    diff mínimo e faz a E6-03 (mesma seção única em `n/[slug].astro`) herdar o
    gate sem nada extra.

11. **Sem runner de teste.** ADR-005 + o app evita peso ⇒ nada de vitest. A
    verificação é `astro check` (tipos) + o roteiro manual (COM JS / SEM JS /
    reduced-motion / voltar-avançar / deep-link) + grep do `dist/index.html` +
    `git diff --stat`. A cobertura determinística de `hashDe`/`estadoDeHash`/
    `estadoInicial` (funções puras, entrada→saída) é **handoff para `aiox-qa`** —
    o dev deixa um bloco `/** Casos de referência */` no topo de `telas.ts` com
    os pares esperados (ex.: `hashDe({tela:'detalhe',sku:'x'}) === '#produto=x'`,
    `estadoDeHash('#vitrine&cat=k') → {tela:'vitrine',cat:'k'}`).

12. **`Astro 7` + `<script>` bundled.** O `<script type="module">` de `Base.astro`
    é processado/bundlado pelo Astro (não é `is:inline`). Adicionar o import de
    `telas.ts` só aumenta esse bundle (~2 KB). Continua fora do `<head>` e sem
    `async`/`defer` manual (Astro já emite como módulo, não bloqueante). RNF-03 ok.
