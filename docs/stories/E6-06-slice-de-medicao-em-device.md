# E6-06 — Slice de medição em device (Portão B da Fase 1 do ADR-008)

**Épico:** [E6](../epics/E6-fluxo-de-tres-telas.md) · **Estado:** 🔵 detalhada — **pegar depois de E6-04 + E6-05**
**Esforço:** M (1–3 dias — mais aferição que código)
**Base:** [ADR-008](../architecture/decisions/adr-008-catalogo-como-pagina-rica-de-secoes.md) **§7** (Portão B) · [architecture/09](../architecture/09-fluxo-de-telas-e-apresentacao.md) §5 (riscos de perf)
**Depende de:** E6-04 ✔ (porta), E6-05 ✔ (trilhas + informações). E5-02 recomendado (galeria real no detalhe pesa o `index.html`).
**Destrava:** a **Fase 1** inteira (`architecture/08`/`10`, `prd`, épico E7) — só sai do papel com este relatório verde **e** a decisão D-02 fechada.

**Requisitos aferidos:**
RNF-01 (1º paint ≤ 1,2 MB), RNF-02 (LCP ≤ 2,5 s / TTI ≤ 3,5 s em 4G no webview), RNF-13 (`dist/index.html` gzip; só a porta eager), RNF-05/08 (autoplay/reduced-motion não travam o scroll).

**NÃO cobre nesta story:** implementar o **Bloco 1** (Fase 1). Aqui só se **prototipa** o padrão 1a num ramo descartável para medir; o protótipo **não** é mergeado no `main`.

**Arquivos-guia:**
- [ADR-008](../architecture/decisions/adr-008-catalogo-como-pagina-rica-de-secoes.md) — **§7** (a tabela de alvos), §6 (orçamento de peso)
- [architecture/09](../architecture/09-fluxo-de-telas-e-apresentacao.md) — §5 (riscos: HTML grande, `scroll-snap` × gesto do webview, `pushState` inconsistente, Embla no caminho crítico)
- [ideacao/catalogo-como-pagina-web.md](../ideacao/catalogo-como-pagina-web.md) — §10 (o que é eager/lazy), §12 ("Slice de medição")
- [prd/02-requisitos](../prd/02-requisitos.md) — RNF-01/02/05/08/13
- [ESTADO-ATUAL.md](../ESTADO-ATUAL.md) — "Como rodar" / "Ver no celular"

---

## Contexto

A Fase 0 (E6-04 + E6-05) monta a `#tela-vitrine` como uma página longa: porta +
trilha "em alta" + uma trilha por categoria + grade + informações + **todos os
detalhes E5 embutidos**. A ADR-008 §7 põe **dois portões** antes da Fase 1
(Bloco 1 — navegador de categorias em dois eixos + carrossel de referenciamento):

- **Portão A — D-02:** decisão do dono (nichos + nº de produtos). Fora desta story.
- **Portão B — este slice de medição:** provar, num device real, que o formato
  aguenta o orçamento de peso/perf **antes** de investir no Bloco 1.

O slice também **valida a própria Fase 0**: se o `dist/index.html` gzip já
estourar 90 KB só com os blocos 2a/2b/2c, a Fase 0 precisa de ajuste (ex.: detalhe
sob demanda), independentemente da Fase 1.

### História

> Como **arquiteto**, quero um número de LCP/TTI/peso/jank medido num Android
> médio real dentro do webview do TikTok, com a página da Fase 0 e um protótipo do
> Bloco 1, para decidir com dado se a Fase 1 vai no padrão 1a, numa versão enxuta,
> ou se o Bloco 1 é adiado.

---

## Decisões desta story

- **[AUTO-DECISION] O protótipo do Bloco 1 é descartável.** Criar num branch
  `spike/bloco1-1a` (ou `src/pages/dev/bloco1.astro`): 2 trilhas de cards de
  categoria + 1 painel de imagem âncora com cross-fade (`opacity` entre 2 `<img>`),
  padrão 1a (imagem fixa ~40% + carrossel ~60%). Dados: "grupos" e "estilos"
  **fake** derivados na marra do `exemplo` só para ter volume (não implementar
  `resolverGrupos` etc.). O protótipo **não vai para `dist/` de produção** nem é
  revisado como código final.
- **[AUTO-DECISION] Device alvo.** Um Android de gama média real (~2–4 anos), no
  **webview do TikTok** (abrir o link por um post/DM), rede em **4G** (ou throttle
  "Slow 4G" no DevTools remoto). Sem device físico: **DevTools mobile emulado +
  CPU 4× throttle + rede "Slow 4G"**, e o relatório marcado como "emulado —
  confirmar em device antes de destravar a Fase 1".
- **[AUTO-DECISION] Absorve E2-02.** A story `E2-02` (medição de peso/LCP no
  webview) do plano original é **substituída/absorvida** por esta.

---

## Critérios de aceite

### Preparação

1. `main` com E6-04 + E6-05 mergeadas; `npm run build` verde. `exemplo.ts` com
   pelo menos ~8 produtos e 3 categorias (se E5-02 subiu a fixture, ok; senão,
   subir só a fixture — não é schema).
2. Branch `spike/bloco1-1a` com o protótipo do padrão 1a servido por uma rota
   **só de DEV** (`src/pages/dev/bloco1.astro` — não entra em `dist/` de
   produção, igual à rota `/dev/*` de E5-01).

### Medições — página da Fase 0 (`/`, nicho `exemplo`)

3. **Peso do 1º paint** (RNF-01): soma dos bytes até o LCP ≤ **1,2 MB**. Registrar.
4. **`dist/index.html`** (RNF-13): tamanho **cru e gzip**. Alvo: gzip ≤ **90 KB**
   (aviso ≥ 60 KB). **Se > 90 KB → a Fase 0 tem ação corretiva** (CA 10).
5. **LCP** ≤ **2,5 s** e **TTI** ≤ **3,5 s** (RNF-02), no device/emulação. Lighthouse
   mobile + medição manual (trace/cronômetro).
6. **Só a porta é eager:** grep do `dist/index.html` — as únicas `<img
   loading="eager">` são as 2 capas do mosaico da porta. Outra `<img>` `lazy`;
   `<video>` `preload="none"`/`metadata`.
7. **Jank de scroll** (RNF-08): rolar a `#tela-vitrine` inteira e cada
   `.trilha-carrossel` no device — **sem travar**, sem gagueira perceptível.
   Registrar impressão + (se possível) FPS do trace.
8. **Gesto "voltar" do webview** (doc 09 §5): porta → categoria → detalhe e
   "voltar" nativo anda entrada↔vitrine↔detalhe sem sair da página; `?n/?c/?o`
   permanecem na URL (regressão de E6-02).
9. **Reduced-motion:** com `prefers-reduced-motion: reduce` no device, troca de
   tela e trilhas não animam; nada quebra.

### Medições — protótipo do Bloco 1 (`spike/bloco1-1a`, rota de DEV)

10. Repetir CA 3–7 com o protótipo **acima do Bloco 2**. Comparar Δ: peso 1º
    paint (a imagem âncora eager da 1ª trilha entra — deve caber), `index.html`
    gzip, LCP/TTI, jank do cross-fade + carrossel.

### Relatório e gate decision

11. Produzir `docs/stories/relatorios/E6-06-medicao.md` (novo) com: device
    (ou "emulado"), rede, tabela de números (Fase 0 e protótipo), screenshots do
    Lighthouse, e um **veredito**:
    - **PASS** — Fase 0 e protótipo 1a dentro dos alvos → **Portão B liberado**;
      Fase 1 pode ir no padrão 1a.
    - **CONCERNS** — Fase 0 ok, protótipo estoura algum alvo → Fase 1 só na
      **versão enxuta** do Bloco 1 (sem imagem âncora / sem cross-fade) ou 1a com
      cortes; registrar quais.
    - **FAIL (Fase 0)** — `/` já estoura (peso/LCP/jank) → **ação corretiva na
      Fase 0** antes de tudo (CA 12); Portão B não avaliado.
    - **FAIL (Bloco 1)** — Fase 0 ok, protótipo inviável → **Bloco 1 adiado**;
      Fase 1 fica só com o cascade mínimo se ainda fizer sentido, ou cancelada.
12. Se o veredito tocar a Fase 0 (FAIL Fase 0), abrir a story de correção
    (candidatos, em ordem): (a) **detalhe sob demanda** — as `<article>` de
    detalhe saem do HTML buildado, clonadas de `<template>` / `fetch` no 1º
    acesso; (b) limitar as `<article>` embutidas ao herói de cada categoria;
    (c) `lazy` mais agressivo em mídia de bloco. **Não** implementar aqui — só
    registrar.

### Portão final desta story

13. `docs/stories/relatorios/E6-06-medicao.md` existe, com números reais e um dos
    4 veredictos.
14. `docs/ESTADO-ATUAL.md` e `docs/epics/PLANO-PROXIMO-PASSO.md` atualizados com o
    veredito (Portão B: liberado / com ressalva / bloqueado).
15. `git diff --stat` no `main` toca **apenas** docs
    (`relatorios/E6-06-medicao.md`, `stories/README.md`, `ESTADO-ATUAL.md`,
    `PLANO-PROXIMO-PASSO.md`) e, se o CA 1 exigiu, `src/data/nichos/exemplo.ts`.
    O branch `spike/bloco1-1a` **não** é mergeado.

---

## Plano de tarefas

1. `main` com E6-04+E6-05; subir a fixture do `exemplo` se estiver com poucos
   produtos.
2. `npm run build`; medir `dist/index.html` cru+gzip; grep de `loading="eager"`.
3. Servir `dist/` (ou `npm run preview`) e abrir num Android médio via webview do
   TikTok. Lighthouse mobile (DevTools remoto) + medição manual de LCP/TTI. Peso
   do 1º paint.
4. Roteiro de jank (CA 7), gesto "voltar" (CA 8), reduced-motion (CA 9).
5. Branch `spike/bloco1-1a`: protótipo do padrão 1a numa rota `dev/`. Repetir 2–4
   com o protótipo acima do Bloco 2.
6. Escrever `docs/stories/relatorios/E6-06-medicao.md` (tabela + screenshots +
   veredito — CA 11).
7. Atualizar `ESTADO-ATUAL.md` / `PLANO-PROXIMO-PASSO.md` com o Portão B.
8. Se FAIL (Fase 0): abrir a story de correção (CA 12) — só o arquivo.

---

## Definição de Pronto

- [ ] `docs/stories/relatorios/E6-06-medicao.md` com: device/rede, tabela de
      números da Fase 0, tabela do protótipo, screenshots do Lighthouse, veredito.
- [ ] Números da Fase 0: peso 1º paint, `index.html` cru+gzip, LCP, TTI, jank.
- [ ] Números do protótipo 1a: os mesmos, com Δ vs. Fase 0.
- [ ] Veredito é um de: PASS / CONCERNS / FAIL(Fase 0) / FAIL(Bloco 1), com a
      consequência para a Fase 1 escrita.
- [ ] `ESTADO-ATUAL.md` e `PLANO-PROXIMO-PASSO.md` refletem o Portão B.
- [ ] Se FAIL(Fase 0): story de correção aberta (arquivo, sem código).
- [ ] `spike/bloco1-1a` **não** mergeado; nenhuma rota `dev/` em `dist/` de
      produção.
- [ ] `git diff --stat` no `main` só toca docs (+ `exemplo.ts` se a fixture
      cresceu).

---

## Fora de escopo

- **Implementar o Bloco 1** de verdade — **Fase 1 / E7**, e só se o veredito
  liberar.
- Integração Embla definitiva — decidida pelo jank medido aqui; a implementação é
  `E6-05b` ou parte de E7.
- Correção de perf da Fase 0 — **story própria**, aberta por este relatório se o
  veredito for FAIL(Fase 0).
- CI que roda Lighthouse — **E4-03** (`deploy-check`) / `S5`.

---

## Riscos / notas

1. **Sem device físico.** A emulação (CPU 4×, "Slow 4G") é um piso, não um teto —
   o webview do TikTok costuma ser pior. Marcar "emulado" e **não** liberar o
   Portão B só com emulação: exigir confirmação em device antes do E7.
2. **O protótipo é fake por design.** Não fazer `resolverGrupos` etc. — grupos/
   estilos na marra do `exemplo` só para ter cards. Mede-se **custo de render**
   (2 carrosséis + cross-fade + imagem âncora), não lógica.
3. **`index.html` gzip é o número mais provável de estourar.** Todos os detalhes
   E5 embutidos + trilhas. Se estourar, a Fase 0 tem ação corretiva (CA 12) — mais
   urgente que a Fase 1.
4. **LCP da porta.** As 2 capas eager do mosaico são o LCP. Se o LCP estourar,
   checar o peso dessas 2 imagens antes de culpar a estrutura.
5. **Não mergear o spike.** Deixar claro no PR do relatório que `spike/bloco1-1a`
   é referência e será descartado/reaberto no E7.
