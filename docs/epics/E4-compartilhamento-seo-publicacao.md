# E4 — Compartilhamento, SEO e publicação

**Estado:** ⬜ não iniciado. Stubs de andaime criados.
**Revisão ADR-007:** OG considera a capa editorial; `/n/<slug>` renderiza a
mesma seção única de 3 telas; `deploy-check` cobre o schema novo.

## Objetivo

O link compartilhado renderiza um card decente (OG), há uma URL indexável por
nicho, e existe um check antes de publicar.

## Escopo

- **S4 / RF-09** — `<meta og:*>` por nicho (`nicho.og`), fallback para
  `titulo`/`subtitulo`; `og:image` pode usar a imagem do herói da capa quando
  `nicho.og.imagem` não vier.
- **S6 / RF-09.2** — botão Web Share API na vitrine/detalhe (`location.href`
  carrega `?n/?c/?o` + `#hash`). Escondido sem a API.
- **C3 / R-06** — rota estática `/n/<slug>`: renderiza a **seção única de 3
  telas** buildada com o nicho da rota (não só a grade); OG/canonical por nicho.
- **C2** — `prometeus deploy-check`: lint de nicho + peso (inclui `index.html`
  gzip, RNF-13) + OG + **schema de ADR-007** antes de publicar.
- **S5** — `assets check --strict` no CI (peso de asset + `index.html` gzip).
- 404 customizado; `sitemap.xml` (um `<url>` por slug); `robots.txt` apontando
  o sitemap.

## Aberto — stubs criados, falta implementar

- [ ] `src/lib/seo/og.ts` — `tagsOg(nicho, siteUrl)` retornando as meta tags;
      ligar em `Base.astro` e `n/[slug].astro`.
- [ ] `src/pages/n/[slug].astro` — passa a renderizar a seção única de 3 telas
      (E6) com o nicho da rota; falta OG/canonical por nicho. Aceita `?c=`/`?o=`
      no cliente (reusa `contexto.ts`).
- [ ] `src/pages/sitemap.xml.ts` — hoje só emite `/`; falta um `<url>` por slug
      e ler `PUBLIC_SITE_URL`.
- [ ] `public/robots.txt` — adicionar `Sitemap: <PUBLIC_SITE_URL>/sitemap.xml`.
- [ ] `src/pages/404.astro` — ✅ criado (estático, mobile-first).
- [ ] `prometeus deploy-check` — novo comando em `scripts/console/commands/`.
- [ ] Definir imagem OG por nicho (1200×630) — asset novo por nicho ou um padrão
      em `/public`.

## Depende de

E2, E5, E6 (a seção única e a apresentação prontas), E2-01 (nicho real) e as
decisões D-02 / D-06. Fazer por último.
