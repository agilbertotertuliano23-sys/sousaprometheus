# 04 — Mídia vertical e performance

O alvo é o **webview do TikTok** num celular em 4G. É o ambiente mais hostil que
uma página web encontra hoje: sem barra de endereço, memória apertada, autoplay
restrito, e um usuário a um gesto de fechar.

## Orçamento de peso (RNF-01)

| Asset | Limite | Onde é conferido |
|---|---|---|
| Página inteira, 1º paint | 1,2 MB | manual / Lighthouse |
| Imagem de card | 180 KB | `prometeus assets check` (`ORCAMENTO.imagemKB`) |
| Poster de vídeo | 60 KB | `assets check` |
| Vídeo de card | 400 KB | `assets check` + `prometeus video` (CRF em degraus) |

`assets check` é raio-x (não falha o build por padrão; `--strict` faz falhar).
O que falha o build é `catalog validate`.

## Regras de vídeo (RNF-05)

`src/lib/midia/video-vertical.ts`:

- Todo `<video data-vertical>` recebe `muted`, `playsInline`, `loop` via JS
  (garantia, além dos atributos no HTML).
- `IntersectionObserver` com `threshold: 0.6` — toca ao entrar, **pausa ao
  sair** (economia de CPU/bateria; vários cards na tela).
- Toque no vídeo alterna `muted` e escreve `data-som="on|off"` (hook de UI).
- `preload="metadata"` — nunca `auto`.

## Caminho crítico (RNF-03)

- Nada de JS bloqueante no `<head>`.
- Os dois módulos client (`contexto`, `video-vertical`) são `type="module"` no
  fim do `<body>`.
- Sem web font antes do 1º paint — as famílias têm fallback de sistema no token.
- Sem framework no caminho crítico: a grade da v0 é Astro puro (HTML). Ilha só
  quando E2 justificar.

## Degradação (RNF-04)

Sem JS: nicho padrão renderizado, cards com `imagem` (não vídeo), todos os links
de saída ativos. A página continua vendendo.

## Medição

Pendente (ver ESTADO-ATUAL): rodar Lighthouse mobile + teste real em device
antes de publicar o primeiro nicho. Metas: LCP ≤ 2,5 s, TTI ≤ 3,5 s (RNF-02).
