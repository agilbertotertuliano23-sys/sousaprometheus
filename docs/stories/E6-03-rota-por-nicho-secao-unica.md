# E6-03 — `n/[slug].astro` usa a seção única (layout compartilhado com `index.astro`)

**Épico:** [E6](../epics/E6-fluxo-de-tres-telas.md) · **Estado:** 🔵 detalhada — **pode andar em paralelo a E6-04**
**Esforço:** P (0,5–1 dia)
**Base:** [ADR-008](../architecture/decisions/adr-008-catalogo-como-pagina-rica-de-secoes.md) Fase 0 · [architecture/09](../architecture/09-fluxo-de-telas-e-apresentacao.md) §1, §4 ("Alterados": `n/[slug].astro`)
**Depende de:** E6-01 ✔ (a seção única existe em `index.astro`). **Idealmente depois de E6-04/E6-05** (para a rota nascer já com a porta + blocos, não com a casca antiga).
**Destrava:** E4-01 (OG por nicho na rota), E4-02 (sitemap com `/n/<slug>`)

**Requisitos cobertos:**
RF-01 (a rota estática por nicho renderiza a mesma página), RF-02.x (nicho da rota vem do `slug`), RF-15.1/16.x (a rota tem a seção única de 3 telas, degradação sem JS igual à raiz),
C-3 do escopo (rota `/n/<slug>` além do `?n=`).

**NÃO cobre nesta story:** OG/canonical por nicho (**E4-01**), `sitemap.xml` listando as rotas (**E4-02**), `deploy-check` (**E4-03**).

**Arquivos-guia:**
- [architecture/09](../architecture/09-fluxo-de-telas-e-apresentacao.md) — §1, §4 (linha `src/pages/n/[slug].astro` em "Alterados")
- [architecture/03](../architecture/03-personalizacao-por-url.md) — por que a rota preferir `#hash` a navegação real (T-C da ideação / R-08)
- [prd/02-requisitos](../prd/02-requisitos.md) — RF-01, RF-02, RF-15/16
- Código a consumir: `src/data/nichos.ts` (`NICHOS`, `resolverNicho`), o corpo de `src/pages/index.astro` (a fonte da seção única)
- Código a alterar: `src/pages/n/[slug].astro`, `src/pages/index.astro` (encolhe)

---

## Contexto

Hoje `src/pages/n/[slug].astro` é o **andaime antigo** (grade agrupada por
categoria, sem a seção única). E6-01 reescreveu **só** `index.astro` para as 3
telas; a nota de E6-01 deixou `n/[slug].astro` para esta story.

Esta story faz `n/[slug].astro` renderizar **exatamente a mesma seção única** de
`index.astro`, só que buildada com o **nicho da rota** (`Astro.params.slug`) em
vez do `NICHO_PADRAO`. O jeito limpo é **extrair o corpo da seção única para um
componente compartilhado** e as duas páginas passarem a consumi-lo.

Sem isso, qualquer mudança futura na seção única (E6-04, E6-05, E3, E5) teria de
ser feita em dois lugares.

### História

> Como **operador de SEO**, quero que `/n/<slug>` sirva a vitrine completa do
> nicho `<slug>` (mesma porta, trilhas, detalhe), para ter uma URL indexável por
> nicho além do `?n=`.

> Como **dev**, quero a seção única num só lugar, consumida por `/` e por
> `/n/<slug>`, para não manter duas cópias do markup.

---

## Decisões desta story

- **[AUTO-DECISION] Onde fica a seção única compartilhada.** Extrair para
  `src/components/SecaoUnica.astro` — props `{ nicho: Nicho }` — contendo
  `<div id="app" data-tela="entrada">` + as 3 `<section>` (porta, vitrine com os
  blocos, detalhe com as `<article>`). `index.astro` e `n/[slug].astro` viram
  cascas finas: resolvem o `nicho` e renderizam `<SecaoUnica nicho={nicho} />`
  dentro do `<Base>`. É um **componente**, não um `layout` do Astro.
- **[AUTO-DECISION] `getStaticPaths`.** Usa a lista de `NICHOS` de
  `src/data/nichos.ts` (um path por slug registrado). `slug` inválido → o Astro
  já dá 404 estático (sem fallback SSR — ADR-004).
- **Ordem recomendada:** fazer esta story **depois** de E6-04 e E6-05, para
  `SecaoUnica` já nascer com a porta + blocos. Se pega antes, `SecaoUnica`
  reflete a casca de E6-01 e E6-04/05 a atualizam num lugar só (o ganho já é
  esse).

---

## Critérios de aceite

### `SecaoUnica.astro` (novo)

1. `src/components/SecaoUnica.astro`, props `{ nicho: Nicho }`. Contém **todo** o
   corpo que hoje está inline em `index.astro` entre `<main class="pagina">` e
   `</main>` — o `<div id="app" data-tela="entrada">` e as 3 telas. **Não**
   contém `<Base>`, `<main>` nem o `<footer class="rodape">`.
2. Sem `<script>` próprio (os scripts client são carregados pelo `Base.astro`,
   E6-02). Sem dependência nova além das que `index.astro` já importava.
3. `<SecaoUnica nicho={exemplo}>` produz **byte a byte** o mesmo `#app` que
   `index.astro` produzia antes da extração (diff só de indentação aceitável).
   Verificar comparando `dist/index.html` antes/depois.

### `index.astro` — vira casca fina

4. `src/pages/index.astro`:
   ```astro
   ---
   import Base from '../layouts/Base.astro';
   import SecaoUnica from '../components/SecaoUnica.astro';
   import { NICHO_PADRAO, resolverNicho } from '../data/nichos';
   const nicho = resolverNicho(NICHO_PADRAO);
   ---
   <Base>
     <main class="pagina">
       <SecaoUnica nicho={nicho} />
       <footer class="rodape">…</footer>
     </main>
   </Base>
   ```
5. Nenhuma regra de `<style>` da seção única é perdida — migra para
   `SecaoUnica.astro` ou para `global.css`. `astro check` limpo.

### `n/[slug].astro` — mesma casca, nicho da rota

6. `src/pages/n/[slug].astro`:
   ```astro
   ---
   import Base from '../../layouts/Base.astro';
   import SecaoUnica from '../../components/SecaoUnica.astro';
   import { NICHOS, resolverNicho } from '../../data/nichos';
   export function getStaticPaths() {
     return NICHOS.map((n) => ({ params: { slug: n.slug } }));
   }
   const { slug } = Astro.params;
   const nicho = resolverNicho(slug!);
   ---
   <Base>
     <main class="pagina">
       <SecaoUnica nicho={nicho} />
       <footer class="rodape">…</footer>
     </main>
   </Base>
   ```
7. `/n/exemplo/` renderiza a seção única completa (porta + trilhas + detalhe)
   buildada com o `exemplo`. O markup de grade agrupada antigo **sai** de
   `n/[slug].astro` (a grade continua **dentro** da seção única, no Bloco 2c).
8. OG/canonical por nicho **não** entram aqui — `Base.astro` segue com o OG
   genérico; **E4-01** os torna por-nicho. `TODO(E4-01)` no `n/[slug].astro`.

### Degradação sem JS

9. Com JS desabilitado, `/n/exemplo/` degrada **igual** a `/`: 3 telas
   empilhadas, navegáveis por âncora, todos os links de saída presentes (RF-16.2).

### Portão final

10. Os quatro comandos, do zero, **exit 0**:
    ```
    npm run validate
    npm run typecheck
    npm run build
    npm run doctor
    ```
11. `npm run build` gera `dist/index.html`, `dist/404.html`,
    `dist/n/exemplo/index.html` (agora com a seção única), `dist/sitemap.xml`.
12. `git diff --stat` toca **apenas**:
    `src/components/SecaoUnica.astro` (novo),
    `src/pages/index.astro` (encolhe para casca),
    `src/pages/n/[slug].astro` (encolhe para casca; markup antigo sai),
    e docs. **Nada** em `src/lib/*`, `src/data/*`,
    `src/components/{Porta,Vitrine,Info,Detalhe}/*`.

---

## Plano de tarefas

1. **Extrair** o corpo `#app` de `index.astro` para `src/components/SecaoUnica.astro`
   (props `{ nicho }`). Mover imports de componentes de tela e do `resolver`.
   Mover os `<style>` relevantes.
2. **`index.astro`** vira casca fina (CA 4). `npm run build`; comparar
   `dist/index.html` com o de antes (CA 3).
3. **`n/[slug].astro`** vira casca fina com `getStaticPaths` sobre `NICHOS`
   (CA 6). Remover o markup de grade antigo. `TODO(E4-01)` para OG.
4. **Portão** (CA 10–11). Abrir `dist/n/exemplo/index.html`. Roteiro sem-JS em
   `/n/exemplo/` (CA 9).
5. **Docs:** `docs/stories/README.md` (E6-03 feita), `docs/ESTADO-ATUAL.md`,
   nota em `docs/epics/PLANO-PROXIMO-PASSO.md`.

---

## Definição de Pronto

- [ ] `npm run validate` / `typecheck` / `build` / `doctor` — exit 0.
- [ ] `SecaoUnica.astro` é a única fonte do markup das 3 telas; `index.astro` e
      `n/[slug].astro` são cascas finas.
- [ ] `dist/index.html` inalterado (salvo indentação) vs. antes da extração.
- [ ] `dist/n/exemplo/index.html` tem a seção única completa buildada com o
      `exemplo`.
- [ ] Sem JS, `/n/exemplo/` degrada igual a `/`.
- [ ] `getStaticPaths` gera um path por nicho de `NICHOS`; slug inválido → 404.
- [ ] `git diff --stat` conforme CA 12.
- [ ] `TODO(E4-01)` no `n/[slug].astro`.

---

## Fora de escopo

- **OG/canonical por nicho** — **E4-01**.
- **`sitemap.xml` listando `/n/<slug>`** — **E4-02**.
- **`prometeus deploy-check`** — **E4-03**.
- Reescrita por `?n=/?c=/?o=` — **E3** (a rota herda a mesma casca).
- Bloco 1 (Fase 1) — entra dentro de `SecaoUnica.astro` quando E7 chegar.

---

## Riscos / notas

1. **Extração byte-a-byte.** O risco é introduzir diferença sutil de markup ao
   extrair. Comparar `dist/index.html` antes/depois (CA 3) é o guard.
2. **Ordem vs. E6-04/E6-05.** Pega antes: `SecaoUnica` nasce com a casca de E6-01,
   E6-04/05 a editam — ok. Pega depois: nasce completa. Preferir depois.
3. **`resolverNicho(slug!)` com slug inválido.** `getStaticPaths` só emite slugs
   válidos; manter o comportamento defensivo atual de `resolverNicho`.
4. **`footer.rodape` duplicado.** Fica **fora** do `SecaoUnica` (nas páginas);
   conferir um só `<footer class="rodape">` por página.
5. **Sem runner de teste.** Verificação = `astro check` + `build` + diff do
   `dist/index.html` + abrir `dist/n/exemplo/index.html`.
