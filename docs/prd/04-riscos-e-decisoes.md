# 04 — Riscos e Decisões

## Decisões

| ID | Decisão | Data | Nota |
|---|---|---|---|
| D-01 | Stack herdada do ARES: Astro estático + ilhas Preact/React + TS + Tailwind v4 | 2026-09-02 | ADR-001 |
| D-02 | Lista de nichos de lançamento | — | **pendente de Vinicius** |
| D-03 | Um repositório, N nichos por configuração (não um deploy por nicho) | 2026-09-02 | ADR-002 |
| D-04 | Personalização 100% client-side pela URL + `localStorage`; zero PII | 2026-09-02 | ADR-003 |
| D-05 | Deploy estático em CDN; sem SSR/backend | 2026-09-02 | ADR-004 |
| D-06 | Modelo do link de saída (afiliado, loja própria, ambos) | — | **pendente** |
| D-07 | Operação por console CLI sem dependências; sem painel web | 2026-09-02 | ADR-005 |
| D-08 | Pipeline de vídeo é passo manual do console, não roda no build | 2026-09-02 | ADR-006 |
| D-09 | Acento é variável por nicho (`--acento`), não valor fixo (diverge de ARES RF-08.3) | 2026-09-02 | — |
| D-10 | Sem visualização 3D (diverge de ARES) | 2026-09-02 | ver R-05 |
| D-11 | Catálogo categorizado: `Categoria[]` no nicho, `produto.categoria` por id, `prioridade` (score curado) | 2026-09-02 | ADR-007 |
| D-12 | Apresentação rica: galeria + specs + blocos declarativos tipados via registry extensível | 2026-09-02 | ADR-007 |
| D-13 | Fluxo de 3 telas (entrada→vitrine→detalhe) como estado no cliente numa seção única (T-A da ideação) | 2026-09-02 | ADR-007 |
| D-14 | Numa revisita, o fluxo pula a entrada e começa na vitrine | 2026-09-02 | provisório; revisar com dado (ADR-007, RF-15.4) |

## Riscos

| ID | Risco | Mitigação | Estado |
|---|---|---|---|
| R-01 | Webview do TikTok mata autoplay ou trava em vídeo pesado | `muted`+`playsinline`, autoplay só ≥60% visível, orçamento 400 KB/vídeo, fallback pra imagem | mitigado no design (RNF-05) |
| R-02 | Peso da página estoura em 4G → bounce | Orçamento duro (RNF-01), `assets check`, sem web fonts críticas, sem framework no caminho crítico | mitigado; falta medir em device |
| R-03 | Personalização por JS falha no webview → visitante vê nicho errado | Degradação graciosa: HTML buildado é o nicho padrão e é válido sozinho (RNF-04) | mitigado por design |
| R-04 | `catalog validate` é um scanner de texto, não um parser de TS — pode passar batido em erro sutil | Assumido (ADR-005). Endurece com o tempo; `astro check` + build pegam o resto | aceito |
| R-05 | Cortar 3D reduz o "uau" que o ARES tinha | Decisão consciente (D-10): o contexto é outro (mobile, tráfego frio, velocidade > espetáculo) | aceito |
| R-06 | Muitos nichos no mesmo build → bundle cresce e todo nicho paga por todos | O índice importa todos os nichos; se doer, migrar para carga sob demanda por `slug` (rota estática por nicho, C-3) | monitorar |
| R-07 | `--acento` de um nicho com contraste ruim sobre branco/preto | RNF-07 + `--acento-texto`; checklist de contraste no `design/01` | mitigação parcial; falta gate automático |
| R-08 | Sem atribuição server-side, o CTR por criativo depende de `?c=` chegar íntegro | Documentar padrão de link; `data-variante`/`data-sku` no DOM para o pixel do anunciante | aceito |
| R-09 | Link de saída quebra / produto sai do ar no parceiro | `catalog validate` checa forma da URL, não disponibilidade; rodar verificação periódica manual | aberto |
| R-10 | `raw-assets/` ou `.mp4` bruto vazando pro git | `.gitignore` desde o 1º commit (R-11 do ARES portado) | mitigado |
| R-11 | `git add .` distraído infla o repo com binário | Mesma regra do ARES: assets brutos só em `raw-assets/` (ignorada); derivadas só em `public/nichos/` | mitigado |
| R-12 | Máquina do dev tem RAM limitada — build/preview pesados travam | Stack enxuta; console sem deps; evitar paralelismo pesado nos scripts | aceito |
| R-13 | Seção única embute todas as telas do nicho padrão → `dist/index.html` cresce | RNF-13: só entrada + capa do herói eager; galeria/vídeo de detalhe `lazy`/`preload=none`; blocos são texto; `assets check` mede o `index.html` gzip | mitigado por design; medir (E2-02) |
| R-14 | `catalog validate` (scanner de texto) lendo estrutura aninhada (`blocos`, `categorias`) fica frágil | Endurecer o scanner; backstop `src/data/validar.ts` (função pura) + `astro check`; vocabulário de blocos em fonte única (`tipos-bloco.json`) | aceito (extensão de R-04) |
| R-15 | `history.pushState`/`popstate` inconsistente no webview do TikTok → navegação entre telas quebra | Ouvir também `hashchange`; teste obrigatório em Android médio real (E6-02) | aberto até medir |
| R-16 | Capa editorial parece anúncio → tráfego frio pula | Regra da ideação: a capa carrega produto real + preço à vista, não só tipografia | mitigação de conteúdo |
