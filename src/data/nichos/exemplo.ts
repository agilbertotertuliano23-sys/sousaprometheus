import type { Nicho } from '../tipos';
import { produtosTiktok } from '../produtos/exemplo-tiktok';

/**
 * Nicho de demonstração + FIXTURE do schema ADR-007.
 *
 * Exercita 100% do schema novo (doc 08 §2): categorias curadas com `ordem` fora
 * da ordem de declaração, `entrada`, `variantes.b`, `ofertas`, e produtos que
 * cobrem cada campo novo de `Produto` e um bloco de CADA `tipo` do vocabulário
 * (`src/lib/apresentacao/tipos-bloco.json`).
 *
 * Mapa de cobertura:
 *  - exemplo-01: `galeria` explícita (img+img+video), `beneficios`, blocos
 *    `texto` / `midia` / `depoimento`. Herói da variante 'a' (`destaque: true`).
 *  - exemplo-02: SEM `galeria` e SEM `video` (galeriaDe → só imagem); `specs`
 *    SEM `BlocoSpecs` (blocosDe faz o prepend); blocos `como-usar` / `faq`.
 *    Empata em `prioridade` com exemplo-03 (exercita o desempate).
 *  - exemplo-03: SEM `galeria` mas COM `video`+`poster` (galeriaDe → imagem+vídeo);
 *    blocos `comparativo` / `bonus`. Herói da variante 'b' (`variantes.b.destaque`).
 *  - exemplo-04: `specs` E `BlocoSpecs` (blocosDe NÃO duplica); `beneficios`.
 *  - exemplo-05: SEM `categoria` → cai em `_outros` (gera o aviso ESPERADO do
 *    `catalog validate`, que não reprova).
 */
export const exemplo: Nicho = {
  slug: 'exemplo',
  nome: 'Exemplo',
  titulo: 'O achado que tá rodando no seu FYP',
  subtitulo: 'Seleção curta. Sem rolar até cansar.',
  acento: '#C83333', // vermelho da skin "sufgang" (tokens.css)
  cta: 'Ver na loja',

  // Trilha final de categorias do catálogo (por `ordem`):
  // Streetwear, Gym, Y2K, Old Money, Minimal.
  categorias: [
    {
      id: 'streetwear',
      rotulo: 'Streetwear',
      kicker: 'MODA',
      descricao: 'Corte oversized com caimento estruturado e alta durabilidade.',
      ordem: 0,
      // Azul-cinza metálico das ruas/arquitetura do banner streetwear.
      cor: '#52606A',
    },
    {
      id: 'gym',
      rotulo: 'Gym',
      kicker: 'MODA',
      descricao: 'Tecido técnico, performance, disciplina que vira estilo.',
      ordem: 1,
      // Cinza aço dos pesos/textura industrial do banner gym.
      cor: '#73777A',
    },
    {
      id: 'y2k',
      rotulo: 'Y2K',
      kicker: 'MODA',
      descricao: 'Baixo na cintura, brilho, a nostalgia dos 2000 que voltou pra ficar.',
      ordem: 2,
      // Azul/ciano do céu e do fundo do banner y2k.
      cor: '#4A9BCB',
    },
    {
      id: 'old-money',
      rotulo: 'Old Money',
      kicker: 'MODA',
      descricao: 'Alfaiataria discreta, tons terrosos, herança sem pressa.',
      ordem: 3,
      // Marrom/dourado das construções/vegetação do banner old money.
      cor: '#8A6A3F',
    },
    {
      id: 'minimal',
      rotulo: 'Minimal',
      kicker: 'MODA',
      descricao: 'Linhas limpas, paleta neutra, o mínimo que sobra depois de tirar tudo.',
      ordem: 4,
      // Bege/cinza da parede e iluminação do banner minimal.
      cor: '#B8AD9B',
    },
  ],

  entrada: {
    kicker: 'VITRINE Nº 07',
    heroiSku: 'streetwear-blusa-branca',
    teaserPreco: 'a partir de R$ 89,90',
    chamada: 'Ver a vitrine',
  },

  variantes: {
    b: {
      ordemCategorias: ['gym', 'y2k', 'old-money', 'minimal', 'streetwear'],
      ordem: ['gym-camisa-compressao', 'streetwear-blusa-branca'],
      destaque: 'gym-camisa-compressao',
      chamadaEntrada: 'Começar pela linha Gym',
    },
  },

  ofertas: {
    frete: {
      selo: 'Frete grátis hoje',
      cta: 'Aproveitar com frete grátis',
      teaserEntrada: 'Frete grátis nas próximas horas',
    },
  },

  produtos: [
    // ── STREETWEAR ─────────────
    {
      sku: 'streetwear-blusa-branca',
      nome: 'Blusa Branca Streetwear',
      descricaoCurta: 'Corte oversized com caimento estruturado e alta durabilidade.',
      precoCentavos: 12990,
      precoDeCentavos: 15990,
      imagem: 'streetwear_blusa_branca_1.jpeg',
      url: 'https://exemplo.com/p/streetwear-branca',
      categoria: 'streetwear',
      subcategoria: 'camisas',
      tags: ['basic', 'destaques', 'em-alta'],
      destaque: true,
      prioridade: 95,
      galeria: [
        { tipo: 'imagem', src: 'streetwear_blusa_branca_1.jpeg', alt: 'Blusa Branca Streetwear Expositor' },
        { tipo: 'imagem', src: 'modelos/streetwear-blusa-branca-1.webp', alt: 'Blusa Branca Streetwear — Frente' },
        { tipo: 'imagem', src: 'modelos/streetwear-blusa-branca-2.webp', alt: 'Blusa Branca Streetwear — Frente 3/4' },
        { tipo: 'imagem', src: 'modelos/streetwear-blusa-branca-3.webp', alt: 'Blusa Branca Streetwear — Perfil' },
        { tipo: 'imagem', src: 'modelos/streetwear-blusa-branca-4.webp', alt: 'Blusa Branca Streetwear — Costas 3/4' },
      ],
    },
    {
      sku: 'streetwear-blusa-preta',
      nome: 'Blusa Preta Streetwear',
      descricaoCurta: 'Design urbano minimalista com acabamento premium.',
      precoCentavos: 13990,
      precoDeCentavos: 16990,
      imagem: 'streetwear_blusa_preta_1.webp',
      // clipe só no hover dos cards (MiniProduto/CardLoja); a galeria explícita mantém o detalhe sem vídeo
      video: 'videos/streetwear-blusa-preta.mp4',
      url: 'https://exemplo.com/p/streetwear-preta',
      categoria: 'streetwear',
      subcategoria: 'camisas',
      tags: ['basic', 'recomendados'],
      prioridade: 85,
      galeria: [
        { tipo: 'imagem', src: 'streetwear_blusa_preta_1.webp', alt: 'Blusa Preta Streetwear Expositor' },
        { tipo: 'imagem', src: 'modelos/streetwear-blusa-preta-1.webp', alt: 'Blusa Preta Streetwear — Frente' },
        { tipo: 'imagem', src: 'modelos/streetwear-blusa-preta-2.webp', alt: 'Blusa Preta Streetwear — Frente 3/4' },
        { tipo: 'imagem', src: 'modelos/streetwear-blusa-preta-3.webp', alt: 'Blusa Preta Streetwear — Perfil' },
        { tipo: 'imagem', src: 'modelos/streetwear-blusa-preta-4.webp', alt: 'Blusa Preta Streetwear — Costas 3/4' },
        { tipo: 'imagem', src: 'modelos/streetwear-blusa-preta-5.webp', alt: 'Blusa Preta Streetwear — Costas' },
      ],
    },

    {
      sku: 'streetwear-moletom-verde',
      nome: 'Moletom Verde Limão Streetwear',
      descricaoCurta: 'Moletom com capuz em verde limão: cor forte, caimento solto, conforto de sobra.',
      precoCentavos: 18990,
      precoDeCentavos: 22990,
      imagem: 'modelos/streetwear-moletom-verde-1.webp',
      url: 'https://exemplo.com/p/streetwear-moletom-verde',
      categoria: 'streetwear',
      subcategoria: 'itens',
      tags: ['recomendados'],
      prioridade: 80,
      galeria: [
        { tipo: 'imagem', src: 'modelos/streetwear-moletom-verde-1.webp', alt: 'Moletom Verde Limão Streetwear — Frente' },
        { tipo: 'imagem', src: 'modelos/streetwear-moletom-verde-2.webp', alt: 'Moletom Verde Limão Streetwear — Perfil' },
        { tipo: 'imagem', src: 'modelos/streetwear-moletom-verde-3.webp', alt: 'Moletom Verde Limão Streetwear — Perfil 3/4' },
        { tipo: 'imagem', src: 'modelos/streetwear-moletom-verde-4.webp', alt: 'Moletom Verde Limão Streetwear — Costas' },
      ],
    },

    // ── GYM ─────────────
    {
      sku: 'gym-camisa-compressao',
      nome: 'Camisa Compressão Gym',
      descricaoCurta: 'Tecido técnico elástico com regulação térmica para treinos intensos.',
      precoCentavos: 14990,
      precoDeCentavos: 18990,
      imagem: 'gym_camisa_compreessao_1.png',
      url: 'https://exemplo.com/p/gym-compressao',
      categoria: 'gym',
      subcategoria: 'camisas',
      tags: ['basic', 'em-alta'],
      prioridade: 90,
      galeria: [
        { tipo: 'imagem', src: 'gym_camisa_compreessao_1.png', alt: 'Camisa Compressão Gym Expositor' },
        { tipo: 'imagem', src: 'modelos/gym-camisa-compressao-1.webp', alt: 'Camisa Compressão Gym — Frente' },
        { tipo: 'imagem', src: 'modelos/gym-camisa-compressao-2.webp', alt: 'Camisa Compressão Gym — Frente 3/4' },
        { tipo: 'imagem', src: 'modelos/gym-camisa-compressao-3.webp', alt: 'Camisa Compressão Gym — Perfil' },
        { tipo: 'imagem', src: 'modelos/gym-camisa-compressao-4.webp', alt: 'Camisa Compressão Gym — Costas 3/4' },
      ],
    },
    {
      sku: 'gym-compressao-f',
      nome: 'Jaqueta Compressão F',
      descricaoCurta: 'Modelagem anatômica com proteção contra vento e alta respirabilidade.',
      precoCentavos: 17990,
      precoDeCentavos: 21990,
      imagem: 'gym_compressao_f_1.jpeg',
      url: 'https://exemplo.com/p/gym-compressao-f',
      categoria: 'gym',
      subcategoria: 'itens',
      tags: ['premium', 'recomendados'],
      prioridade: 85,
      galeria: [
        { tipo: 'imagem', src: 'gym_compressao_f_1.jpeg', alt: 'Jaqueta Compressão F Expositor' },
        { tipo: 'imagem', src: 'modelos/gym-compressao-f-1.webp', alt: 'Jaqueta Compressão F — Frente' },
        { tipo: 'imagem', src: 'modelos/gym-compressao-f-2.webp', alt: 'Jaqueta Compressão F — Frente 3/4' },
        { tipo: 'imagem', src: 'modelos/gym-compressao-f-3.webp', alt: 'Jaqueta Compressão F — Perfil 3/4' },
        { tipo: 'imagem', src: 'modelos/gym-compressao-f-4.webp', alt: 'Jaqueta Compressão F — Costas 3/4' },
        { tipo: 'imagem', src: 'modelos/gym-compressao-f-5.webp', alt: 'Jaqueta Compressão F — Costas' },
      ],
    },
    {
      sku: 'gym-macacao',
      nome: 'Macacão Fit Gym',
      descricaoCurta: 'Peça única com suporte muscular integrado e toque macio.',
      precoCentavos: 19990,
      precoDeCentavos: 24990,
      imagem: 'gym_macacao_1.jpeg',
      url: 'https://exemplo.com/p/gym-macacao',
      categoria: 'gym',
      subcategoria: 'kits',
      tags: ['kits', 'premium'],
      prioridade: 80,
      galeria: [
        { tipo: 'imagem', src: 'gym_macacao_1.jpeg', alt: 'Macacão Fit Gym Expositor' },
        { tipo: 'imagem', src: 'modelos/gym-macacao-1.webp', alt: 'Macacão Fit Gym — Frente' },
        { tipo: 'imagem', src: 'modelos/gym-macacao-2.webp', alt: 'Macacão Fit Gym — Frente 3/4' },
        { tipo: 'imagem', src: 'modelos/gym-macacao-3.webp', alt: 'Macacão Fit Gym — Caminhando' },
        { tipo: 'imagem', src: 'modelos/gym-macacao-4.webp', alt: 'Macacão Fit Gym — Apoiada na coluna' },
        { tipo: 'imagem', src: 'modelos/gym-macacao-5.webp', alt: 'Macacão Fit Gym — Perfil' },
      ],
    },

    // ── Y2K ─────────────
    {
      sku: 'y2k-blusa-curta',
      nome: 'Blusa Curta Y2K',
      descricaoCurta: 'Estilo nostálgico dos anos 2000 com caimento cropped perfeito.',
      precoCentavos: 8990,
      precoDeCentavos: 11990,
      imagem: 'y2k_blusa_curta_1.webp',
      url: 'https://exemplo.com/p/y2k-blusa-curta',
      categoria: 'y2k',
      subcategoria: 'camisas',
      tags: ['basic', 'em-alta'],
      prioridade: 90,
      galeria: [
        { tipo: 'imagem', src: 'y2k_blusa_curta_1.webp', alt: 'Blusa Curta Y2K Expositor' },
        { tipo: 'imagem', src: 'modelos/y2k-blusa-curta-1.webp', alt: 'Blusa Curta Y2K — Frente' },
        { tipo: 'imagem', src: 'modelos/y2k-blusa-curta-2.webp', alt: 'Blusa Curta Y2K — Perfil' },
        { tipo: 'imagem', src: 'modelos/y2k-blusa-curta-3.webp', alt: 'Blusa Curta Y2K — Costas 3/4' },
        { tipo: 'imagem', src: 'modelos/y2k-blusa-curta-4.webp', alt: 'Blusa Curta Y2K — Costas' },
      ],
    },
    {
      sku: 'y2k-saia',
      nome: 'Saia Plissada Y2K',
      descricaoCurta: 'Cintura baixa com pregas clássicas e movimento fluido.',
      precoCentavos: 11990,
      precoDeCentavos: 14990,
      imagem: 'y2k_saia_1.jpeg',
      video: 'videos/y2k-saia.mp4',
      url: 'https://exemplo.com/p/y2k-saia',
      categoria: 'y2k',
      subcategoria: 'itens',
      tags: ['destaques', 'recomendados'],
      prioridade: 85,
      galeria: [
        { tipo: 'imagem', src: 'y2k_saia_1.jpeg', alt: 'Saia Plissada Y2K Expositor' },
        { tipo: 'imagem', src: 'modelos/y2k-saia-1.webp', alt: 'Saia Plissada Y2K — Frente' },
        { tipo: 'imagem', src: 'modelos/y2k-saia-2.webp', alt: 'Saia Plissada Y2K — Frente 3/4' },
        { tipo: 'imagem', src: 'modelos/y2k-saia-3.webp', alt: 'Saia Plissada Y2K — Costas 3/4' },
        { tipo: 'imagem', src: 'modelos/y2k-saia-4.webp', alt: 'Saia Plissada Y2K — Costas' },
      ],
    },

    // ── OLD MONEY ─────────────
    {
      sku: 'old-money-blusa-azul',
      nome: 'Blusa Polo Azul Old Money',
      descricaoCurta: 'Algodão de fibra longa com acabamento discreto e sofisticado.',
      precoCentavos: 15990,
      precoDeCentavos: 19990,
      imagem: 'old_money_blusa_azul_1.webp',
      video: 'videos/old-money-blusa-azul.mp4',
      url: 'https://exemplo.com/p/old-money-azul',
      categoria: 'old-money',
      subcategoria: 'camisas',
      tags: ['premium', 'destaques'],
      prioridade: 90,
      galeria: [
        { tipo: 'imagem', src: 'old_money_blusa_azul_1.webp', alt: 'Blusa Polo Azul Expositor' },
        { tipo: 'imagem', src: 'modelos/old-money-blusa-azul-1.webp', alt: 'Blusa Polo Azul Old Money — Frente' },
        { tipo: 'imagem', src: 'modelos/old-money-blusa-azul-2.webp', alt: 'Blusa Polo Azul Old Money — Frente 3/4' },
        { tipo: 'imagem', src: 'modelos/old-money-blusa-azul-3.webp', alt: 'Blusa Polo Azul Old Money — Perfil' },
        { tipo: 'imagem', src: 'modelos/old-money-blusa-azul-4.webp', alt: 'Blusa Polo Azul Old Money — Costas 3/4' },
        { tipo: 'imagem', src: 'modelos/old-money-blusa-azul-5.webp', alt: 'Blusa Polo Azul Old Money — Costas' },
      ],
    },
    {
      sku: 'old-money-blusa-preta',
      nome: 'Blusa Polo Preta Old Money',
      descricaoCurta: 'Elegância intemporal em tom escuro sobrio e caimento impecável.',
      precoCentavos: 16990,
      precoDeCentavos: 20990,
      imagem: 'old_money_blusa_preta_1.webp',
      url: 'https://exemplo.com/p/old-money-preta',
      categoria: 'old-money',
      subcategoria: 'camisas',
      tags: ['premium', 'recomendados'],
      prioridade: 85,
      galeria: [
        { tipo: 'imagem', src: 'old_money_blusa_preta_1.webp', alt: 'Blusa Polo Preta Expositor' },
        { tipo: 'imagem', src: 'modelos/old-money-blusa-preta-1.webp', alt: 'Blusa Polo Preta Old Money — Frente' },
        { tipo: 'imagem', src: 'modelos/old-money-blusa-preta-2.webp', alt: 'Blusa Polo Preta Old Money — Frente 3/4' },
        { tipo: 'imagem', src: 'modelos/old-money-blusa-preta-3.webp', alt: 'Blusa Polo Preta Old Money — Perfil' },
        { tipo: 'imagem', src: 'modelos/old-money-blusa-preta-4.webp', alt: 'Blusa Polo Preta Old Money — Costas' },
        { tipo: 'imagem', src: 'modelos/old-money-blusa-preta-5.webp', alt: 'Blusa Polo Preta Old Money — Costas detalhe' },
      ],
    },

    // ── MINIMAL ─────────────
    {
      sku: 'minimal-calca',
      nome: 'Calça Alfaiataria Minimal',
      descricaoCurta: 'Linhas retas e puras com corte preciso para um visual limpo.',
      precoCentavos: 18990,
      precoDeCentavos: 22990,
      imagem: 'minimal_calca_1.jpeg',
      url: 'https://exemplo.com/p/minimal-calca',
      categoria: 'minimal',
      subcategoria: 'calcas',
      tags: ['premium', 'destaques'],
      prioridade: 90,
      galeria: [
        { tipo: 'imagem', src: 'minimal_calca_1.jpeg', alt: 'Calça Alfaiataria Minimal Expositor' },
        { tipo: 'imagem', src: 'modelos/minimal-calca-1.webp', alt: 'Calça Alfaiataria Minimal — Frente' },
        { tipo: 'imagem', src: 'modelos/minimal-calca-2.webp', alt: 'Calça Alfaiataria Minimal — Frente 3/4' },
        { tipo: 'imagem', src: 'modelos/minimal-calca-3.webp', alt: 'Calça Alfaiataria Minimal — Caminhando' },
        { tipo: 'imagem', src: 'modelos/minimal-calca-4.webp', alt: 'Calça Alfaiataria Minimal — Perfil' },
        { tipo: 'imagem', src: 'modelos/minimal-calca-5.webp', alt: 'Calça Alfaiataria Minimal — Costas' },
      ],
    },
    {
      sku: 'minimal-gola-alta',
      nome: 'Blusa Gola Alta Minimal',
      descricaoCurta: 'Malha nobre e toque suave em silhueta minimalista.',
      precoCentavos: 11990,
      precoDeCentavos: 14990,
      imagem: 'minimal_gola_alta_1.webp',
      url: 'https://exemplo.com/p/minimal-gola-alta',
      categoria: 'minimal',
      subcategoria: 'camisas',
      tags: ['basic', 'em-alta'],
      prioridade: 85,
      galeria: [
        { tipo: 'imagem', src: 'minimal_gola_alta_1.webp', alt: 'Blusa Gola Alta Minimal Expositor' },
        { tipo: 'imagem', src: 'modelos/minimal-gola-alta-1.webp', alt: 'Blusa Gola Alta Minimal — Frente' },
        { tipo: 'imagem', src: 'modelos/minimal-gola-alta-2.webp', alt: 'Blusa Gola Alta Minimal — Perfil' },
        { tipo: 'imagem', src: 'modelos/minimal-gola-alta-3.webp', alt: 'Blusa Gola Alta Minimal — Costas 3/4' },
        { tipo: 'imagem', src: 'modelos/minimal-gola-alta-4.webp', alt: 'Blusa Gola Alta Minimal — Costas' },
      ],
    },
    {
      sku: 'minimal-short',
      nome: 'Short Linho Minimal',
      descricaoCurta: 'Textura leve em fibra natural para dias ensolarados com elegância.',
      precoCentavos: 9990,
      precoDeCentavos: 12990,
      imagem: 'minimal_short_1.webp',
      url: 'https://exemplo.com/p/minimal-short',
      categoria: 'minimal',
      subcategoria: 'shorts',
      tags: ['kits', 'recomendados'],
      prioridade: 80,
      galeria: [
        { tipo: 'imagem', src: 'minimal_short_1.webp', alt: 'Short Linho Minimal Expositor' },
        { tipo: 'imagem', src: 'modelos/minimal-short-1.webp', alt: 'Short Linho Minimal — Frente' },
        { tipo: 'imagem', src: 'modelos/minimal-short-2.webp', alt: 'Short Linho Minimal — Frente 3/4' },
        { tipo: 'imagem', src: 'modelos/minimal-short-3.webp', alt: 'Short Linho Minimal — Perfil' },
        { tipo: 'imagem', src: 'modelos/minimal-short-4.webp', alt: 'Short Linho Minimal — Costas 3/4' },
        { tipo: 'imagem', src: 'modelos/minimal-short-5.webp', alt: 'Short Linho Minimal — Costas' },
      ],
    },
    // ── TIKTOK SHOP (50 peças, vitrine + detalhe) ─────────────
    ...produtosTiktok,
  ],
};
