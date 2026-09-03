# PROMETEUS — Documentação de Produto

Página de catálogo web de nichos, direcionada a tráfego de TikTok e
superpersonalizada por URL.

- **Owner:** Vinicius
- **Base:** metodologia e stack herdadas do projeto ARES
- **Data:** 2026-09-02
- **Status:** base de projeto criada — scaffold + console funcionais, catálogo com 1 nicho de exemplo. Ver [ESTADO-ATUAL.md](ESTADO-ATUAL.md).

> **Comece por [ESTADO-ATUAL.md](ESTADO-ATUAL.md)** para o retrato do que já existe e roda.

## Em uma frase

Um link na bio que abre uma vitrine curta, carrega rápido no navegador do
TikTok, e se molda ao nicho e ao anúncio que trouxeram a visita.

## PRD (fatiado)

| Doc | Conteúdo |
|---|---|
| [00 — Visão de Produto](prd/00-visao-produto.md) | Problema, objetivo, público, métricas |
| [01 — Escopo do MVP](prd/01-escopo-mvp.md) | MoSCoW, o que fica de fora e por quê |
| [02 — Requisitos](prd/02-requisitos.md) | RF-01 a RF-09 e RNF-01 a RNF-12 |
| [03 — Nichos e Catálogo](prd/03-nichos-e-catalogo.md) | O que é um nicho, schema, ciclo de vida |
| [04 — Riscos e Decisões](prd/04-riscos-e-decisoes.md) | D-01 a D-10, R-01 a R-12 |
| [05 — Identidade Visual](prd/05-identidade-visual.md) | Direção de arte, acento por nicho |

## Arquitetura

Ver [`architecture/README.md`](architecture/README.md) — 7 documentos temáticos e 6 ADRs.

**Stack:** Astro estático + ilhas Preact/React · Embla · TypeScript · catálogo
estático em build · personalização client-side pela URL · deploy em CDN sem servidor.

| Doc | Por quê importa |
|---|---|
| [02 — Modelo de dados e nichos](architecture/02-modelo-de-dados-e-nichos.md) | O que é um nicho no código, como o índice funciona |
| [03 — Personalização por URL](architecture/03-personalizacao-por-url.md) | Resolve RF-05/RF-06 sem backend |
| [04 — Mídia vertical e performance](architecture/04-midia-vertical-e-performance.md) | Resolve RNF-01/RNF-02 no webview do TikTok |
| [07 — O console (CLI)](architecture/07-o-console-cli.md) | Como o projeto é operado |

## Design System

Ver [`design/README.md`](design/README.md). Base escura herdada do ARES;
o **acento é uma variável por nicho** (`--acento`), não um valor fixo.

## Épicos

**Revisão 2026-09-02 — [ADR-007](architecture/decisions/adr-007-catalogo-categorizado-e-apresentacao-rica.md):**
catálogo categorizado + apresentação rica + fluxo de 3 telas. Índice e
justificativa da estrutura em [`epics/README.md`](epics/README.md); caminho
crítico em [`epics/PLANO-PROXIMO-PASSO.md`](epics/PLANO-PROXIMO-PASSO.md).

**Direção em revisão (2026-09-02) — [ADR-008](architecture/decisions/adr-008-catalogo-como-pagina-rica-de-secoes.md)
(proposto, faseado):** a tela do meio deixa de ser "vitrine em foco (C4)" e vira
um **catálogo como página de blocos**. **Fase 0** (baixo risco, sem schema novo):
porta do catálogo → trilhas de produtos (em alta → categorias → catálogo inteiro)
→ informações. **Fase 1** (condicional a D-02 + slice de medição em device):
catálogo dinâmico de categorias em dois eixos (grupos + estilos) com carrossel de
referenciamento. Ideação em
[`ideacao/catalogo-como-pagina-web.md`](ideacao/catalogo-como-pagina-web.md).
A tabela de épicos e o fluxo abaixo ainda refletem o ADR-007.

| Épico | Objetivo | Estado |
|---|---|---|
| [E1 — Fundação e console](epics/E1-fundacao-e-console.md) | Scaffold, CLI, gate de catálogo | ✅ de pé |
| [E2 — Catálogo categorizado + curadoria](epics/E2-catalogo-categorizado-e-curadoria.md) | Schema `Categoria`/`prioridade`, `catalog validate` novo | 🟠 |
| [E3 — Personalização por URL](epics/E3-personalizacao-por-url.md) | `?n=`/`?c=`/`?o=` reescrevem as 3 telas | 🟠 parcial |
| [E4 — Compartilhamento, SEO e publicação](epics/E4-compartilhamento-seo-publicacao.md) | OG, `/n/<slug>`, sitemap, `deploy-check` | ⬜ |
| [E5 — Camada de apresentação rica](epics/E5-camada-de-apresentacao-rica.md) | Galeria, specs, sistema de blocos + componentes | ⬜ novo |
| [E6 — Fluxo de 3 telas](epics/E6-fluxo-de-tres-telas.md) | **Porta → catálogo em blocos → detalhe** (ADR-008 F0); estado no cliente, degradação | 🟠 reescopado |

Sequência: **E1 → E2 → E5 → E6 → E3 → E4**. E2-03 / E5-01 / E6-01 / E6-02 ✅.
Próxima story: **E6-04** (porta do catálogo) ∥ **E5-02** (galeria + specs).

## Fluxo do produto (pós ADR-008 Fase 0)

```
LINK NA BIO (?n=<nicho>&c=<criativo>&o=<oferta>)
      │
      ▼
SEÇÃO ÚNICA — 3 telas como estado no cliente (?n/?c/?o nunca saem da URL)
  1. PORTA     kicker, título, parágrafo de proposta, linha de organização
               ("N grupos · M estilos · K produtos"), mosaico de capas, CTA
  2. CATÁLOGO  2a. EM ALTA / DESTAQUES  (trilha cross-categoria)
               2b. UMA TRILHA POR CATEGORIA  (<h2 id="cat-<id>"> + minis)
               2c. GRADE COMPLETA  (= fallback sem-JS)
               3.  INFORMAÇÕES  (curadoria · como comprar · prova social · compartilhar)
  3. DETALHE   galeria de mídia + benefícios + specs + blocos declarativos  (INALTERADO — E5)
      │
      │  toque na mini → tela de detalhe        (pushState #produto=<sku>)
      │  toque no CTA de saída (no detalhe)     →
      ▼
LOJA / CHECKOUT EXTERNO  (link de saída do produto — afiliado/loja própria)

sem JS: as 3 telas empilhadas, navegáveis por âncora (#vitrine, #cat-<id>, #produto-<sku>)

Fase 1 (atrás de D-02 + slice de medição): entra o BLOCO 1 acima do 2a —
catálogo dinâmico de categorias em dois eixos (grupos + estilos) + carrossel
de referenciamento com imagem âncora. Ver ADR-008 §7.
```

## Decisões pendentes

- **D-02** — lista inicial de nichos a lançar: pendente de Vinicius.
- **D-06** — link de saída: afiliado, loja própria ou os dois por produto? Pendente.

## Próximo handoff

**`aiox-sm`** — detalhar **E6-04** (`PortaCatalogo`) e **E6-05** (`TrilhaProdutos`
+ `BlocoInformacoes`, remove `VitrineFoco`), espelhando `architecture/09`
(revisto — ADR-008 Fase 0). Em paralelo: **E5-02** (galeria + specs). Depois:
`aiox-dev` implementa; `aiox-qa` valida sem JS + `dist/index.html` gzip ≤ 90 KB.
Sequência completa em [`epics/PLANO-PROXIMO-PASSO.md`](epics/PLANO-PROXIMO-PASSO.md).

**Fase 1 travada** até a decisão **D-02** fechar e o slice de medição (**E6-06**)
passar — só então o cascade de schema (`architecture/08`/`10`, `prd`) e o **E7**
("catálogo dinâmico") saem do papel (ADR-008 §7).
