# ADR-003 — Personalização client-side pela URL, sem backend, sem PII

**Status:** aceito · **Data:** 2026-09-02

## Contexto

A página precisa se moldar ao nicho, ao criativo de origem e à oferta. Não há
backend (ADR-004) e não queremos PII, cookies ou fingerprint (RNF-09).

## Decisão

Toda personalização é derivada da query string (`?n=`, `?c=`, `?o=`) no
navegador, mais o slug do último nicho em `localStorage`. Bucket A/B por hash
determinístico (FNV-1a) do `?c=` — reprodutível, para a atribuição do anunciante
bater. O HTML buildado é o nicho padrão e é válido sem JS (degradação graciosa).

## Consequências

- **+** Zero infra, zero custo de runtime, zero superfície de privacidade.
- **+** Links são a API: `?n=pet&c=v12&o=frete`.
- **−** Sem métricas server-side próprias — depende do pixel do anunciante e de
  `?c=` chegar íntegro (R-08).
- **−** Flash potencial se a troca de slots demorar; mitigado buildando o acento
  do padrão no HTML e mantendo a lógica pequena.
