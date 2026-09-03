import type { Nicho } from '../tipos';

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
  acento: '#1E6FFF',
  cta: 'Ver na loja',

  categorias: [
    {
      id: 'destaques',
      rotulo: 'Destaques',
      kicker: 'SELEÇÃO',
      descricao: 'O que a curadoria puxaria primeiro.',
      ordem: 1,
    },
    { id: 'basicos', rotulo: 'Básicos', ordem: 0 },
    { id: 'kits', rotulo: 'Kits' },
  ],

  entrada: {
    kicker: 'VITRINE Nº 07',
    heroiSku: 'exemplo-01',
    teaserPreco: 'a partir de R$ 39,90',
    chamada: 'Ver a vitrine',
  },

  variantes: {
    b: {
      ordemCategorias: ['kits', 'destaques', 'basicos'],
      ordem: ['exemplo-03', 'exemplo-01'],
      destaque: 'exemplo-03',
      chamadaEntrada: 'Começar pelos kits',
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
    {
      sku: 'exemplo-01',
      nome: 'Produto Um',
      descricaoCurta: 'A versão que todo mundo comentou no vídeo.',
      precoCentavos: 9990,
      precoDeCentavos: 14990,
      imagem: '01/card.svg',
      url: 'https://exemplo.com/p/1',
      tags: ['queridinho'],
      destaque: true,
      categoria: 'destaques',
      prioridade: 90,
      galeria: [
        { tipo: 'imagem', src: '01/g1.svg', alt: 'Produto Um de frente' },
        { tipo: 'imagem', src: '01/g2.svg', alt: 'Produto Um em uso' },
        {
          tipo: 'video',
          src: '01/clipe.mp4',
          poster: '01/poster.svg',
          alt: 'Clipe do Produto Um',
        },
      ],
      beneficios: [
        'Chega montado — zero ferramenta.',
        'Cabe na bancada de 40 cm.',
        'Garantia de 1 ano na troca.',
      ],
      blocos: [
        {
          tipo: 'texto',
          id: 'sobre',
          titulo: 'Por que ele bombou',
          corpo: [
            'Um parágrafo curto, sem HTML, direto ao ponto.',
            'Outro parágrafo reforçando a promessa do card.',
          ],
        },
        {
          tipo: 'midia',
          titulo: 'De perto',
          itens: [
            { tipo: 'imagem', src: '01/g1.svg', alt: 'Detalhe do acabamento' },
            {
              tipo: 'video',
              src: '01/clipe.mp4',
              poster: '01/poster.svg',
              alt: 'Demonstração em 15 s',
            },
          ],
          legenda: 'Gravado sem edição.',
        },
        {
          tipo: 'depoimento',
          citacao: 'Comprei achando que era exagero. Não era.',
          autor: 'Marina R.',
          contexto: 'compradora verificada · Recife',
          nota: 5,
          avatar: '01/avatar.svg',
        },
      ],
    },
    {
      sku: 'exemplo-02',
      nome: 'Produto Dois',
      descricaoCurta: 'Mesma pegada, metade do preço.',
      precoCentavos: 4990,
      imagem: '02/card.svg',
      url: 'https://exemplo.com/p/2',
      categoria: 'basicos',
      prioridade: 50,
      specs: [
        { chave: 'Material', valor: 'Alumínio anodizado' },
        { chave: 'Peso', valor: '320 g' },
        { chave: 'Cor', valor: 'Grafite' },
      ],
      blocos: [
        {
          tipo: 'como-usar',
          titulo: 'Em 3 passos',
          passos: [
            {
              titulo: 'Encaixe a base',
              descricao: 'Sem parafuso — é por pressão.',
              midia: { tipo: 'imagem', src: '02/passo1.svg', alt: 'Passo 1' },
            },
            { titulo: 'Trave a alavanca' },
            { titulo: 'Pronto pra usar' },
          ],
        },
        {
          tipo: 'faq',
          titulo: 'Perguntas frequentes',
          itens: [
            {
              pergunta: 'Funciona em tomada 220 V?',
              resposta: 'Sim, é bivolt automático.',
            },
            {
              pergunta: 'Tem quanto de garantia?',
              resposta: 'Um ano contra defeito de fábrica.',
            },
          ],
        },
      ],
    },
    {
      sku: 'exemplo-03',
      nome: 'Produto Três',
      descricaoCurta: 'Pra quem quer o kit completo de uma vez.',
      precoCentavos: 19990,
      imagem: '03/card.svg',
      video: '03/clipe.mp4',
      poster: '03/poster.svg',
      url: 'https://exemplo.com/p/3',
      tags: ['kit'],
      categoria: 'basicos',
      prioridade: 50,
      blocos: [
        {
          tipo: 'comparativo',
          titulo: 'Básico x Combo',
          colunas: ['Básico', 'Combo'],
          linhas: [
            { rotulo: 'Peças', valores: ['1', '3'] },
            { rotulo: 'Suporte', valores: ['e-mail', 'e-mail + WhatsApp'] },
            { rotulo: 'Frete', valores: ['pago', 'grátis'] },
          ],
        },
        {
          tipo: 'bonus',
          titulo: 'Vai junto',
          itens: [
            {
              nome: 'Guia de manutenção',
              descricao: 'PDF de 8 páginas.',
              valorCentavos: 2900,
            },
            { nome: 'Adesivos de acabamento' },
          ],
        },
      ],
    },
    {
      sku: 'exemplo-04',
      nome: 'Produto Quatro',
      descricaoCurta: 'O upgrade que fecha a coleção.',
      precoCentavos: 24990,
      imagem: '04/card.svg',
      url: 'https://exemplo.com/p/4',
      categoria: 'kits',
      prioridade: 20,
      beneficios: ['Compatível com as versões 01 a 03.', 'Fecho magnético.'],
      specs: [
        { chave: 'Compatibilidade', valor: 'Linhas 01–03' },
        { chave: 'Fixação', valor: 'Ímã de neodímio' },
      ],
      blocos: [
        {
          tipo: 'specs',
          titulo: 'Ficha técnica',
          pares: [
            { chave: 'Dimensões', valor: '18 × 12 × 4 cm' },
            { chave: 'Garantia', valor: '2 anos' },
          ],
        },
      ],
    },
    {
      sku: 'exemplo-05',
      nome: 'Produto Cinco',
      descricaoCurta: 'Peça avulsa — sem categoria de propósito.',
      precoCentavos: 3990,
      imagem: '05/card.svg',
      url: 'https://exemplo.com/p/5',
      prioridade: 70,
    },
  ],
};
