// @ts-check
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'astro/config';

import preact from '@astrojs/preact';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
//
// output: 'static' é explícito (mesmo sendo o default do Astro) porque é uma
// decisão travada por ADR-001/ADR-004 (RNF-11 — zero backend, deploy em CDN
// estática) e não deve depender do default silencioso de uma versão futura.
//
// A personalização por nicho/criativo é 100% client-side a partir da URL
// (ver docs/architecture/03-personalizacao-por-url.md) — nada disso exige SSR.
export default defineConfig({
  output: 'static',
  // Porta dedicada — evita conflito ao rodar os projetos irmãos juntos
  // (ARES 4322 · ZEUS 4323 · ATHENA 4324 · DIONÍSIO 4325 · HERMES 4326).
  server: { port: 4321, host: true },
  // Preact e React coexistem (mesma convenção do ARES): ilhas Preact para o
  // que é leve e crítico no webview do TikTok (grade, vídeo), React reservado
  // a casos que já tragam a dependência. CADA .tsx de ilha declara seu runtime
  // no topo do arquivo:
  //   - Preact:  /** @jsxImportSource preact */
  //   - React:   /** @jsxImportSource react */
  integrations: [preact(), react()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
});
