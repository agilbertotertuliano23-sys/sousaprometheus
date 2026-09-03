# PROMETEUS — Arquitetura

Herda a stack e as convenções do ARES. Fechada com a base do projeto em 2026-09-02.

**Stack:** Astro `output: 'static'` · ilhas Preact (padrão) + React (quando já
houver a dependência) · Embla para carrossel (quando entrar) · TypeScript
`strict` · Tailwind v4 via plugin do Vite · catálogo estático resolvido em build
· personalização client-side pela URL · deploy em CDN estática.

## Índice

| Doc | Conteúdo |
|---|---|
| [01 — Visão geral e stack](01-visao-geral-e-stack.md) | O que é, o que não é, dependências e por quê |
| [02 — Modelo de dados e nichos](02-modelo-de-dados-e-nichos.md) | `Nicho`/`Produto`, o índice, resolução de assets |
| [03 — Personalização por URL](03-personalizacao-por-url.md) | `?n=`/`?c=`/`?o=`, hash estável, degradação graciosa |
| [04 — Mídia vertical e performance](04-midia-vertical-e-performance.md) | Vídeo 9:16 no webview, orçamento de peso, autoplay |
| [05 — Pipeline de assets](05-pipeline-de-assets.md) | `raw-assets/` → curadoria → `public/`/`src/assets/` |
| [06 — Estrutura de diretórios](06-estrutura-de-diretorios.md) | O mapa da árvore e as regras de `.gitignore` |
| [07 — O console (CLI)](07-o-console-cli.md) | Arquitetura do `prometeus`, comandos, como estender |
| [08 — Catálogo categorizado e modelo de apresentação](08-catalogo-categorizado.md) | `Categoria`, `Produto` estendido, `BlocoApresentacao`, registry, regras de resolução |
| [09 — Fluxo de telas: porta → catálogo → detalhe](09-fluxo-de-telas-e-apresentacao.md) | As 3 telas como seção única (ADR-008 Fase 0: porta + trilhas de produto + info), degradação sem JS, componentes novos/alterados |

## ADRs

| ADR | Decisão |
|---|---|
| [001](decisions/adr-001-stack-astro-preact.md) | Stack Astro estático + ilhas Preact (herdada do ARES) |
| [002](decisions/adr-002-multi-nicho-um-repo.md) | Um repositório, N nichos por configuração |
| [003](decisions/adr-003-personalizacao-sem-backend.md) | Personalização client-side pela URL, sem backend, sem PII |
| [004](decisions/adr-004-hosting-estatico.md) | Deploy 100% estático em CDN |
| [005](decisions/adr-005-console-cli-sem-dependencias.md) | Console CLI sem dependências de terceiros |
| [006](decisions/adr-006-pipeline-video-manual.md) | Pipeline de vídeo é passo manual, não roda no build |
| [007](decisions/adr-007-catalogo-categorizado-e-apresentacao-rica.md) | Catálogo categorizado + camada de apresentação rica + fluxo de 3 telas |
| [008](decisions/adr-008-catalogo-como-pagina-rica-de-secoes.md) | **Fase 0 aceita** — catálogo como página de blocos: porta + trilhas de produto + info (Fase 0); navegador de categorias em dois eixos (Fase 1, atrás de D-02 + slice de medição). Revê os itens 3 e 4 do ADR-007 |

## Diagrama de alto nível

```
                       build (Astro, estático)
src/data/nichos/*  ─┐
src/data/nichos.ts ─┼─►  índice NICHOS  ─►  index.astro renderiza o NICHO_PADRAO
src/assets/catalog ─┘                         │
                                              ▼
                                     dist/index.html + assets com hash
                                              │  deploy
                                              ▼
                                        CDN estática
                                              │
        visitante abre  /?n=pet&c=v12&o=frete │
                                              ▼
                          Base.astro carrega 2 módulos client:
                          - contexto.ts  → lê a URL, aplica --acento/data-*, (E3) reescreve slots
                          - video-vertical.ts → autoplay/pausa por IntersectionObserver
```
