# PROMETEUS — Épicos

**Revisão 2026-09-02 — ADR-007.** O produto mudou de direção: catálogo curado e
**categorizado**, **camada de apresentação rica** por produto (galeria, specs,
blocos declarativos) e **fluxo de 3 telas** (entrada editorial → vitrine em foco
→ detalhe). Os épicos abaixo refletem essa direção.

**Revisão 2026-09-02 — [ADR-008](../architecture/decisions/adr-008-catalogo-como-pagina-rica-de-secoes.md)
Fase 0 (aceita).** O **E6 foi reescopado**: a tela do meio deixa de ser "vitrine
em foco (C4)" e vira **porta do catálogo → trilha "em alta" + trilha por
categoria + grade + informações → detalhe** (E5 intacto). Ver
[`E6-fluxo-de-tres-telas.md`](E6-fluxo-de-tres-telas.md). O **Bloco 1** (navegador
de categorias em dois eixos + carrossel de referenciamento) é **Fase 1**, num
**E7 novo**, atrás dos portões D-02 + slice de medição (E6-06).

A prioridade vem do MoSCoW em [`../prd/01-escopo-mvp.md`](../prd/01-escopo-mvp.md);
os IDs `RF-*`/`RNF-*` estão em [`../prd/02-requisitos.md`](../prd/02-requisitos.md).
Trilhas de arquitetura: [`08 — catálogo categorizado`](../architecture/08-catalogo-categorizado.md),
[`09 — fluxo de telas`](../architecture/09-fluxo-de-telas-e-apresentacao.md).

| Épico | Tema | Estado | Requisitos-chave |
|---|---|---|---|
| [E1](E1-fundacao-e-console.md) | Fundação estática + console CLI | ✅ de pé | M1, M4, M5 · RF-01, RF-08, RNF-10/11/12 |
| [E2](E2-catalogo-categorizado-e-curadoria.md) | Catálogo categorizado + curadoria (schema novo, `catalog validate`, console) | 🟠 E2-03 ✅; E2-04 aberta; E2-01/02 bloqueadas | M2, M8 · RF-02/03/10/11, RF-08.3 |
| [E3](E3-personalizacao-por-url.md) | `?n=` / `?c=` / `?o=` no cliente (núcleo intacto; efeito cresce para as 3 telas) | 🟠 parcial — E3-01 reescopada (porta + blocos) | M6, S1, S2, S3 · RF-05/06/07 |
| [E4](E4-compartilhamento-seo-publicacao.md) | OG por nicho, rota `/n/<slug>`, sitemap, `deploy-check` | ⬜ não iniciado (depende de E6-03) | S4, S5, S6, C2, C3 · RF-09 |
| [E5](E5-camada-de-apresentacao-rica.md) | **novo** — galeria, specs, benefícios, sistema de blocos + componentes | 🟠 E5-01 ✅; E5-02 detalhada; E5-03 aberta | M9 · RF-12/13/14, RNF-14 |
| [E6](E6-fluxo-de-tres-telas.md) | **reescopado (ADR-008 F0)** — porta do catálogo → trilhas de produto + info → detalhe, como estado no cliente; degradação sem JS | 🟠 E6-01/02 ✅; E6-03/04/05/06 abertas | M10 · RF-15/16, RNF-04/13 |

## Por que esta estrutura

- **E1 inalterado.** A fundação (scaffold Astro + console sem deps + gate no
  prebuild) não muda com ADR-007.
- **E2 renomeado e reescopado**, não substituído. Continua sendo "o que é um
  nicho no código", mas agora inclui `Categoria`, `prioridade` e o gate do
  `catalog validate` sobre o schema novo. A grade/card de hoje continua viva
  como fallback sem-JS (RF-16) — não é jogada fora.
- **E3 núcleo intacto.** `?n=/?c=/?o=`, hash FNV-1a, memória e degradação
  graciosa seguem como estão. O que cresce é o **efeito**: a story E3-01 deixa
  de reescrever só "cabeçalho + grade" e passa a reescrever entrada + vitrine +
  detalhe (três módulos em `slots/`). `?c=` ganha reordenação de categorias.
- **E5 e E6 separados** (em vez de um "épico experiência" único) porque têm
  **superfícies de risco distintas**:
  - **E5** é conteúdo e componentes Astro puros — renderiza estático, funciona
    sem JS, risco de performance baixo. É testável isoladamente contra o
    `exemplo` rico.
  - **E6** é estado no cliente + navegação (`pushState`/`popstate`) + risco de
    perf e de degradação no webview do TikTok. Precisa de teste em device.
  Separar mantém as stories pequenas e isola o risco. E5 e E6 podem ser
  desenvolvidos **em paralelo** depois que E2 entrega o schema.
- **E4 ajustado** para as telas/rotas novas: OG do nicho passa a considerar a
  capa editorial; `/n/<slug>` renderiza a mesma seção única; `deploy-check`
  cobre o schema de ADR-007.

## Dependências entre épicos

```
E1 (feito)
 └─► E2  (schema: Categoria, prioridade, galeria como dado, catalog validate)
      ├─► E5  (galeria, specs, blocos, componentes)      ─┐
      ├─► E6  (3 telas, navegação, degradação)            ─┼─► E3 (efeito de ?n= nas 3 telas)
      └─► E3  (núcleo — já dá para trabalhar contra exemplo) ┘        │
                                                                      └─► E4 (OG, /n/<slug>, sitemap, deploy-check)
```

## Ordem sugerida

1. **E2** — schema categorizado + apresentação rica em `tipos.ts`, `exemplo.ts`
   atualizado como fixture, `catalog validate` cobrindo o novo schema. Destrava
   E5 e E6.
2. **E5** e **E6** em paralelo — E5 entrega os componentes de detalhe/blocos;
   E6 entrega a casca das 3 telas + navegação com o nicho padrão.
3. **E3** — `slots/entrada|vitrine|detalhe` reescrevem as telas por `?n=`;
   depois `?c=` (variantes) e `?o=` (oferta + teaser).
4. **E4** — por último, com nicho real e conteúdo pronto.
5. **E2-01** (primeiro nicho real) segue bloqueado por **D-02** / **D-06**.

O caminho crítico story a story está em
[`PLANO-PROXIMO-PASSO.md`](PLANO-PROXIMO-PASSO.md).

## Stories

Ver [`../stories/`](../stories/README.md). Cada story referencia seu épico.
