# 03 — Personalização por URL

## Princípio

O HTML é buildado **uma vez**, com o `NICHO_PADRAO`. A personalização acontece no
navegador, a partir da query string, sem recarregar e sem servidor. Se o JS
falhar, o visitante vê o nicho padrão — que é uma página completa e válida
(RNF-04, R-03).

## Parâmetros

| Param | Significado | Efeito |
|---|---|---|
| `?n=<slug>` | nicho | troca `--acento`, `data-nicho`, e (E3) título/subtítulo/lista de produtos |
| `?c=<id>` | criativo de origem (anúncio/vídeo) | hash → bucket `a`/`b` em `data-variante`; regra por nicho pode reordenar/trocar destaque |
| `?o=<id>` | oferta ativa | `data-oferta`; tarja/selo global; pode trocar o texto do CTA |

Exemplo de link divulgado:
`https://site/?n=pet-shop&c=tt-video-039&o=frete-gratis`

## Hash estável

`src/data/personalizacao.ts` — FNV-1a 32 bits. **Nunca** `Math.random`: o bucket
de um criativo precisa ser reprodutível (mesmo `?c=`, mesma variante, sempre),
para a atribuição do anunciante bater.

```ts
function hash(str) { let h = 0x811c9dc5; for (...) { h ^= c; h = Math.imul(h, 0x01000193); } return h >>> 0; }
variante = criativo && hash(criativo) % 2 === 1 ? 'b' : 'a';
```

## Fluxo no cliente

`src/lib/personalizacao/contexto.ts`, chamado por `Base.astro`:

```
1. lê URLSearchParams
2. sem ?n= → tenta localStorage['prometeus:ultimo-nicho']
3. resolverContexto() → { nicho, criativo, oferta, variante }
4. nicho inválido → aborta (fica o padrão)
5. salva o nicho no localStorage (try/catch — modo privado)
6. aplica: --acento, data-nicho, data-variante, data-oferta
7. (E3) reescreve os [data-slot] do cabeçalho e a grade a partir de NICHOS[nicho]
```

## Privacidade (RNF-09)

Sem cookies, sem fingerprint, sem PII. O único estado persistido é o slug do
último nicho, em `localStorage`, no dispositivo. Nada é enviado a lugar nenhum —
não há para onde enviar.

## Limite atual

O passo 7 (reescrever slots/grade no cliente) **ainda não está implementado** —
é a story principal de E3. Hoje `contexto.ts` já troca acento e `data-*`; o
`index.astro` já traz os `data-slot` no HTML esperando o dev.
