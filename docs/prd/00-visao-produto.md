# 00 — Visão de Produto

## Problema

Tráfego de TikTok é barato de gerar e caro de converter. O clique sai de um
vídeo vertical em tela cheia e cai num navegador embutido (webview) lento, com
uma aba estreita, sem barra de endereço, e uma pessoa com o polegar já pronto
pra fechar. Landing pages genéricas de "link na bio" tratam todo visitante
igual — mesmo produto, mesma copy, venha ele de que vídeo vier.

## Objetivo

Uma página de catálogo que:

1. **Carrega quase instantânea** no webview do TikTok (orçamento de peso duro).
2. **Serve muitos nichos** de um único código — cada nicho é uma configuração,
   não um fork.
3. **Se personaliza pela URL** — o nicho (`?n=`), o criativo de origem (`?c=`) e
   a oferta (`?o=`) mudam título, acento, ordem e destaque sem recarregar e sem
   backend.
4. **Empurra pro checkout externo** rápido — o produto tem um link de saída
   (loja própria ou afiliado); o PROMETEUS não processa pagamento.

## Público

- **Operador (Vinicius):** roda campanhas de tráfego pago/orgânico para vários
  nichos ao mesmo tempo. Precisa criar e publicar um nicho em minutos, pelo
  console, sem tocar em infra.
- **Visitante:** veio de um vídeo, está no celular, no webview, com pouca
  paciência e provavelmente em 4G. Quer ver o produto do vídeo e o preço, e
  decidir em segundos.

## Métricas de sucesso

| Métrica | Alvo |
|---|---|
| Peso da página no 1º paint | ≤ 1,2 MB (RNF-01) |
| LCP no webview (4G simulado) | ≤ 2,5 s (RNF-02) |
| Tempo para publicar um nicho novo | ≤ 15 min do briefing ao deploy |
| CTR do card → link de saída | acompanhado por `?c=` (atribuição por criativo) |
| Nichos ativos suportados | sem limite prático (um repo, N configs) |

## Não-objetivos

Ver [01 — Escopo do MVP](01-escopo-mvp.md), lista *Won't*. Em resumo: sem
carrinho, sem contas, sem busca, sem 3D, sem i18n, sem CMS.
