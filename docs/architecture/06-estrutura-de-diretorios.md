# 06 — Estrutura de diretórios

```
PROMETEUS/
├── bin/
│   └── prometeus.mjs            # entrypoint do console (delega para scripts/console)
├── scripts/
│   ├── README.md
│   └── console/                 # o CLI — zero dependências (ADR-005)
│       ├── index.mjs            # parseArgs + despacho + aliases
│       ├── ui.mjs              # cores/símbolos/log; ErroConsole
│       ├── lib.mjs             # RAIZ, DIR_*, ORCAMENTO, leitura de nicho, helpers
│       ├── commands/           # 1 arquivo por comando: { descricao, options?, run() }
│       │   ├── help.mjs  doctor.mjs  niche.mjs  catalog.mjs  assets.mjs  video.mjs
│       └── templates/
│           └── niche.ts.tmpl   # esqueleto usado por `niche new`
├── src/
│   ├── data/
│   │   ├── tipos.ts             # Produto, Nicho, ContextoPersonalizacao (fonte da verdade)
│   │   ├── nichos.ts            # índice NICHOS + resolverNicho + NICHO_PADRAO
│   │   ├── nichos/
│   │   │   └── exemplo.ts       # nicho de demonstração (não publicar)
│   │   └── personalizacao.ts    # hash FNV-1a → ContextoPersonalizacao
│   ├── lib/
│   │   ├── catalogo/carregar.ts     # import.meta.glob de src/assets/catalog/**
│   │   ├── personalizacao/contexto.ts  # ponte client: URL → --acento/data-*/(E3) slots
│   │   ├── midia/video-vertical.ts     # autoplay/pausa por IntersectionObserver
│   │   ├── motion/reduced-motion.ts
│   │   └── utils.ts                 # cn (clsx), formatarPreco, percentualDesconto
│   ├── layouts/Base.astro
│   ├── components/
│   │   ├── CardProduto/CardProduto.astro
│   │   ├── GradeCatalogo/GradeCatalogo.astro
│   │   └── VideoVertical/VideoVertical.astro
│   ├── pages/index.astro           # a única rota
│   ├── styles/
│   │   ├── tokens.css              # cópia byte a byte de docs/design/tokens.css
│   │   └── global.css
│   └── assets/catalog/<slug>/      # imagens dos cards (por nicho)
├── public/
│   ├── favicon.svg
│   ├── robots.txt
│   └── nichos/<slug>/<sku>.mp4     # vídeos processados pelo console
├── raw-assets/                     # (gitignored) entrada de curadoria
├── docs/                           # PRD, arquitetura, design, épicos, stories
├── astro.config.ts  tsconfig.json  package.json  .gitignore  .env.example
```

## Regras

- **`src/assets/` vs `public/`:** imagem de card vai em `src/assets/catalog/`
  (hash no build, referência relativa). Vídeo vai em `public/nichos/` (URL
  absoluta, servido como está).
- **`tokens.css`:** editado só em `docs/design/tokens.css`; `src/styles/tokens.css`
  é cópia. Não divergir.
- **Um comando do console = um arquivo** em `commands/`, registrado em `index.mjs`.
