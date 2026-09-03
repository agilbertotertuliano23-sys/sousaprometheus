# Validação PO — set de documentação (foco: ADR-008 Fase 0)

**Data:** 2026-09-03 · **Papel:** `aiox-po` · **Escopo:** coerência PRD ↔ arquitetura ↔ épicos ↔ stories, prontidão para `dev`.
**Base:** [ADR-008](architecture/decisions/adr-008-catalogo-como-pagina-rica-de-secoes.md) Fase 0 (aceita) + cascade aplicado + stories E5-02 / E6-03 / E6-04 / E6-05 / E6-06.

## Gate decision — **CONCERNS**

A cadeia da Fase 0 (**ideação → ADR-008 → `architecture/09` → `epics/E6` →
stories**) está **coerente e implementável**. As ressalvas abaixo **não bloqueiam
começar E6-04 / E5-02 / E2-04**; são: estados de tabela desatualizados
(pré-existentes), itens de sincronização de doc (advisory), `[AUTO-DECISION]` a
ratificar pelo dono, e decisões de negócio abertas (D-02/D-06) que travam a
**Fase 1** e o primeiro nicho real, não a Fase 0.

---

## Coerência verificada — OK

| Eixo | Resultado |
|---|---|
| `architecture/09` (reescrito) ↔ `ADR-008` itens 1–3 | ✅ porta / blocos 2a-2c / info / detalhe intacto batem |
| `epics/E6` (reescopado) ↔ stories E6-03..06 | ✅ escopo, dependências e "fora de escopo" consistentes; links resolvem |
| Stories ↔ `architecture/09` §4 (nomes de componente) | ✅ `PortaCatalogo` / `TrilhaProdutos` / `BlocoInformacoes` / `MiniProduto` / `SecaoUnica` |
| Stories ↔ RNF | ✅ RNF-04 (sem JS), RNF-06 (≥44px), RNF-08 (reduced-motion), RNF-13 (só porta eager, gzip ≤ 90 KB) presentes em cada uma |
| `prd/01` M10 + `prd/02` RF-05.1/10.4/15.5 | ✅ reconciliados nesta rodada (só texto; sem RF novo — ADR-008 §7) |
| `resolver.ts` (E2-03) cobre a Fase 0 | ✅ `resolverCategorias` / `produtosPorCategoria` / `galeriaDe` / `blocosDe` bastam; "em alta" (D-12) é inline, `resolver.ts` intacto |
| Degradação sem JS ponta a ponta | ✅ porta → trilhas (`<h2 id="cat-<id>">`) → grade → info → detalhes, tudo por âncora; `html.js` gate de E6-02 não depende de `VitrineFoco` |
| `design/tokens.css` camada COMPONENTE + `design/01` "Trilha" | ✅ adicionados; consumidos como `var(--x, fallback)` |

---

## Achados

| # | Severidade | Achado | Ação | Dono |
|---|---|---|---|---|
| V-1 | **Média** | `epics/README.md` tabela ainda marca **E2** "schema a implementar" e **E5** "não iniciado" — E2-03 e E5-01 estão ✅. Estado desatualizado (pré-ADR-008). | Atualizar os estados de E2/E3/E5 na tabela de `epics/README.md`. | `aiox-sm` |
| V-2 | Baixa | `architecture/09` §4 "Alterados" lista `index.astro` e `n/[slug].astro` mas **não** menciona a extração de `SecaoUnica.astro` (decisão de E6-03). | 1 linha em `architecture/09` §4 apontando E6-03; ou aceitar que a story é dona. | `aiox-architect` |
| V-3 | Baixa | `architecture/06-estrutura-de-diretorios.md` não lista `src/components/{Porta,Info}/` nem `src/components/Vitrine/TrilhaProdutos.astro`. | Adicionar ao mapa quando E6-04/05 mergearem (ou já). | `aiox-architect` |
| V-4 | **Média** | `src/styles/tokens.css` ficou **fora de sync** com a FONTE `docs/design/tokens.css` (camada COMPONENTE nova). | **DoD de E6-05** deve incluir a cópia byte a byte (ADR-006). Já anotado em `design/01`. | `aiox-dev` (E6-05) |
| V-5 | **Média** | `[AUTO-DECISION]` nas stories: **D-12** (corte do "Em alta" = top 6, mín. 5 produtos), **D-13** (redundância 2a/2b/2c aceita), **D-14** ("N produtos · M categorias"), **D-15** (Bloco 3 = copy fixa, sem prova social). | Dono **ratifica ou sobrescreve** antes de E6-04/E6-05 mergearem. Se ratificado, os `TODO(D-xx)` viram comentário fixo. | Vinicius |
| V-6 | Baixa | E6-04 CA 15 depende de `src/data/tipos.ts` ter (ou ganhar) `entrada.proposta?: string`. | E6-04 **checa o `tipos.ts` primeiro**; se faltar, adiciona a 1 linha (aditivo, opcional). Já no CA. | `aiox-dev` (E6-04) |
| V-7 | Baixa | `heroiDaVitrine` (`resolver.ts`) fica **sem consumidor** na Fase 0 (E6-05 removeu `VitrineFoco`). | Manter (E3-02/Fase 1 usam). Marcar `// usado a partir da Fase 1` no `resolver.ts`. | `aiox-dev` (E6-05) |
| V-8 | Baixa | **D-11** (revisita pula a porta?) segue "sugerida" no `PLANO`; RF-15.4 diz "pode começar na vitrine". | Confirmar o default "pula" com o dono; nenhuma mudança de código (E6-02 já implementa). | Vinicius |
| V-9 | Baixa | `prd/00-visao-produto.md` não foi reconciliado com o vocabulário ADR-008 (só `prd/01`/`prd/02`). | Spot-check: a "visão" é de nível de nicho, provável que não cite "capa editorial". Revisar 1 vez. | `aiox-pm` |
| V-10 | **Alta (fora da Fase 0)** | **D-02** (lista de nichos + nº de produtos) e **D-06** (link de saída) seguem abertas. | D-02 é o **Portão A da Fase 1** e bloqueia E2-01; D-06 bloqueia E2-01. Não bloqueiam E6-04/05/06/E5-02/E2-04. | Vinicius |

---

## Prontidão por story

| Story | Pronta para `dev`? | Bloqueio |
|---|---|---|
| **E6-04** — `PortaCatalogo` | ✅ sim | — (V-5: ratificar D-14 é desejável antes do merge) |
| **E5-02** — `GaleriaMidia` + specs | ✅ sim | — |
| **E2-04** — `catalog validate` + tmpl | ✅ sim | — (independente; neutra à Fase 0) |
| **E6-05** — trilhas + informações | ⚠️ quase | recomenda E5-02 mergeada + V-5 (D-12/D-13/D-15) ratificados; DoD com V-4 (sync tokens) |
| **E6-03** — `SecaoUnica` | ✅ sim | melhor **depois** de E6-04/E6-05 (extração pega o corpo final) |
| **E6-06** — slice de medição | ⛔ ainda não | precisa de E6-04 **+** E6-05 mergeadas |

---

## Recomendação

1. **Ratificar V-5** (os 4 `[AUTO-DECISION]`) — 5 minutos do dono; destrava E6-05 sem retrabalho.
2. **Liberar já:** E6-04 ∥ E5-02 ∥ E2-04.
3. **V-1** (estados da tabela de épicos) — corrigir junto, é higiene.
4. **D-02 / D-06** — agendar decisão; não bloqueiam a Onda 1, mas bloqueiam publicar (E2-01) e a Fase 1.
5. Reavaliar este gate para **PASS** quando V-1, V-4 (no DoD de E6-05) e V-5 estiverem fechados.
