# ADR-002 — Um repositório, N nichos por configuração

**Status:** aceito · **Data:** 2026-09-02

## Contexto

O operador roda campanhas para vários nichos simultâneos e precisa lançar um
nicho novo em minutos. As alternativas: (a) um repo/deploy por nicho; (b) um
CMS com backend; (c) um repo, nichos como dados.

## Decisão

(c). Cada nicho é `src/data/nichos/<slug>.ts` + `src/assets/catalog/<slug>/` +
uma linha em `src/data/nichos.ts`. O console cria e valida. Um único build, um
único deploy, servindo todos os nichos; o nicho ativo vem da URL (`?n=`).

## Consequências

- **+** Lançar nicho = criar arquivo + curar assets + validar + deploy.
- **+** Um pipeline de CI/CD, um domínio, um cache de CDN.
- **−** Todo nicho entra no grafo do build → bundle cresce com a contagem
  (R-06). Saída se doer: rota estática por nicho com carga sob demanda.
- **−** Deploy de um nicho novo republica tudo (aceitável num site estático).
