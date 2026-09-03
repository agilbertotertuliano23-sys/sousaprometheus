/**
 * PROMETEUS — modelo de dados do catálogo.
 * Ver docs/architecture/02-modelo-de-dados-e-nichos.md e
 * docs/architecture/08-catalogo-categorizado.md (schema ADR-007).
 *
 * Preços em CENTAVOS (inteiro) — nunca float. A formatação para "R$ 99,90"
 * acontece só na borda de renderização (src/lib/utils.ts#formatarPreco).
 *
 * Todo campo introduzido pelo ADR-007 é OPCIONAL e tem default derivado
 * (ver doc 08 §3): o `exemplo.ts` pré-ADR-007 continua válido sem mudança.
 */

// ── Mídia e specs ───────────────────────────────────────────────

/** Item de mídia da galeria e de blocos de mídia. */
export interface ItemMidia {
  tipo: 'imagem' | 'video';
  /** imagem: relativo a src/assets/catalog/<slug>/.
   *  video: URL absoluta servida de public/ (ex.: /nichos/<slug>/<sku>.mp4)
   *  ou também relativo a src/assets/catalog/<slug>/. */
  src: string;
  /** obrigatório quando tipo === 'video'. Relativo a src/assets/catalog/<slug>/. */
  poster?: string;
  /** texto alternativo — obrigatório (a11y, RNF-07). */
  alt: string;
}

/** Par chave-valor de especificação. */
export interface ParSpec {
  chave: string;
  valor: string;
}

/** Categoria dentro de um nicho. */
export interface Categoria {
  /** [a-z][a-z0-9-]+ ; único no nicho; referenciado por Produto.categoria. */
  id: string;
  /** rótulo exibido na trilha e no cabeçalho da seção. */
  rotulo: string;
  /** rótulo mono curto acima do título (ex.: "SELEÇÃO"). Opcional. */
  kicker?: string;
  /** 1 frase editorial na "capa" da categoria. Opcional. */
  descricao?: string;
  /** menor = mais cedo na trilha. Default: ordem de declaração no array. */
  ordem?: number;
}

// ── Blocos de apresentação — union discriminada por `tipo` ──────

export interface BlocoBase {
  /** âncora opcional para deep-link dentro do detalhe (#<sku>-<id>). */
  id?: string;
}

export interface BlocoTexto extends BlocoBase {
  tipo: 'texto';
  titulo?: string;
  /** parágrafos em texto puro. Sem HTML (segurança na reescrita client-side). */
  corpo: string[];
}

export interface BlocoMidia extends BlocoBase {
  tipo: 'midia';
  titulo?: string;
  itens: ItemMidia[];
  legenda?: string;
}

export interface BlocoDepoimento extends BlocoBase {
  tipo: 'depoimento';
  citacao: string;
  autor: string;
  /** "compradora verificada", cidade, data — texto livre curto. */
  contexto?: string;
  /** 1..5. Opcional. */
  nota?: number;
  /** asset relativo a src/assets/catalog/<slug>/. Opcional. */
  avatar?: string;
}

export interface BlocoComoUsar extends BlocoBase {
  tipo: 'como-usar';
  titulo?: string;
  passos: Array<{ titulo: string; descricao?: string; midia?: ItemMidia }>;
}

export interface BlocoComparativo extends BlocoBase {
  tipo: 'comparativo';
  titulo?: string;
  /** cabeçalhos das colunas (a 1ª costuma ser ""). */
  colunas: string[];
  linhas: Array<{ rotulo: string; valores: string[] }>;
}

export interface BlocoBonus extends BlocoBase {
  tipo: 'bonus';
  titulo?: string;
  itens: Array<{ nome: string; descricao?: string; valorCentavos?: number }>;
}

export interface BlocoFaq extends BlocoBase {
  tipo: 'faq';
  titulo?: string;
  itens: Array<{ pergunta: string; resposta: string }>;
}

export interface BlocoSpecs extends BlocoBase {
  tipo: 'specs';
  titulo?: string;
  pares: ParSpec[];
}

export type BlocoApresentacao =
  | BlocoTexto
  | BlocoMidia
  | BlocoDepoimento
  | BlocoComoUsar
  | BlocoComparativo
  | BlocoBonus
  | BlocoFaq
  | BlocoSpecs;

export type TipoBloco = BlocoApresentacao['tipo'];

// ── Produto ─────────────────────────────────────────────────────

export interface Produto {
  /** Único dentro do nicho. Prefixo pelo slug do nicho por convenção. */
  sku: string;
  nome: string;
  descricaoCurta: string;
  precoCentavos: number;
  /** Preço "de" para tarja/desconto. Opcional. */
  precoDeCentavos?: number;
  /** capa: LCP, fallback sem-JS, base do OG. Relativo a src/assets/catalog/<slug>/. */
  imagem: string;
  /** Clipe vertical 9:16. Opcional — sem ele o card fica só na imagem. */
  video?: string;
  /** 1º frame do vídeo. Opcional. */
  poster?: string;
  /** Link de saída (loja/afiliado/checkout externo). Obrigatório. */
  url: string;
  tags?: string[];
  /** herói manual da vitrine + borda de acento. */
  destaque?: boolean;

  /** id de uma Categoria do nicho. Ausente/inválido → categoria "_outros". */
  categoria?: string;
  /** 0..100, default 50. Score curado: ordena na categoria + elege herói. */
  prioridade?: number;
  /** galeria rica. Ausente → derivada de [imagem, (video)]. */
  galeria?: ItemMidia[];
  /** bullets de benefício no topo do detalhe. */
  beneficios?: string[];
  /** atalho: vira um BlocoSpecs no topo dos blocos se `blocos` não trouxer um. */
  specs?: ParSpec[];
  /** blocos declarativos, renderizados na ordem no detalhe. */
  blocos?: BlocoApresentacao[];
}

// ── Regras de variação ──────────────────────────────────────────

/** Reordenação por bucket de criativo (?c=). Estende src/lib/personalizacao/criativo.ts. */
export interface RegraVariante {
  /** nova ordem de categorias por id. */
  ordemCategorias?: string[];
  /** nova ordem de produtos por sku (aplicada dentro de cada categoria). */
  ordem?: string[];
  /** sku que vira herói da vitrine. */
  destaque?: string;
  /** sobrescreve a chamada da tela de entrada. */
  chamadaEntrada?: string;
}

/** Efeito de uma oferta (?o=). Estende src/lib/personalizacao/oferta.ts. */
export interface RegraOferta {
  /** texto da tarja/selo global. */
  selo: string;
  /** troca o rótulo do CTA de saída. Opcional. */
  cta?: string;
  /** teaser exibido também na tela de entrada. Opcional. */
  teaserEntrada?: string;
}

// ── Nicho ───────────────────────────────────────────────────────

export interface Nicho {
  /** Igual ao nome do arquivo em src/data/nichos/<slug>.ts */
  slug: string;
  nome: string;
  /** H1 da página. */
  titulo: string;
  subtitulo: string;
  /** Cor de acento do nicho — #RRGGBB. Vira --acento no :root em runtime. */
  acento: string;
  /** Rótulo do botão de saída dos cards. */
  cta: string;
  produtos: Produto[];
  og?: {
    titulo?: string;
    descricao?: string;
    imagem?: string;
  };

  /** categorias curadas, na ordem de navegação. Ausente → trilha única sintética. */
  categorias?: Categoria[];
  /** conteúdo da tela de entrada (capa editorial). Tudo opcional, com defaults. */
  entrada?: {
    /** ex.: "VITRINE Nº 07". Default: "VITRINE · " + nome. */
    kicker?: string;
    /** sku que sangra na capa. Default: herói da vitrine. */
    heroiSku?: string;
    /** ex.: "a partir de R$ 39,90". Default: derivado do menor preço. */
    teaserPreco?: string;
    /** rótulo do CTA da capa. Default: "Ver a vitrine". */
    chamada?: string;
  };
  /** regra por bucket de criativo. Sem `b` → variante 'b' idêntica à 'a'. */
  variantes?: { b?: RegraVariante };
  /** regra por oferta. Chave = id passado em ?o=. `?o=` sem entrada = silencioso. */
  ofertas?: Record<string, RegraOferta>;
}

/**
 * Contexto de personalização resolvido da URL — determinístico, sem backend,
 * sem cookie, sem PII. Ver docs/architecture/03-personalizacao-por-url.md.
 */
export interface ContextoPersonalizacao {
  /** Nicho ativo (?n=). Cai no PUBLIC_NICHO_PADRAO se ausente/inválido. */
  nicho: string;
  /** Criativo/anúncio de origem (?c=). Usado para variar copy/ordem. */
  criativo: string | null;
  /** Oferta ativa (?o=). Ex.: "frete", "cupom10". */
  oferta: string | null;
  /** Bucket de variante A/B derivado de forma estável do criativo. */
  variante: 'a' | 'b';
}
