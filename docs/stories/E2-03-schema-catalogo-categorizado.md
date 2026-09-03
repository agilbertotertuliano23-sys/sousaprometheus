# E2-03 — Schema do catálogo categorizado + `resolver.ts` + `validar.ts` + fixture

**Épico:** [E2](../epics/E2-catalogo-categorizado-e-curadoria.md) · **Estado:** 🔵 detalhada — **PRÓXIMA** (primeira do caminho crítico pós ADR-007)
**Esforço:** M (1–3 dias)
**Depende de:** E1-03 ✔ (build verde)
**Destrava:** E2-04, E5-01, E6-01

**Requisitos cobertos:**
RF-02.4, RF-03.2, RF-10 (10.1–10.3), RF-11 (11.1–11.4), RF-12 (12.1, 12.2),
RF-13 (13.1, 13.2), RF-14 (14.1, 14.2, 14.5 parte de build), RNF-14 (fundação do
vocabulário único). Toca de leve RF-06.2 / RF-07 (só as *interfaces*
`RegraVariante` / `RegraOferta`, sem efeito).

**Arquivos-guia (ler antes de implementar):**
- [ADR-007](../architecture/decisions/adr-007-catalogo-categorizado-e-apresentacao-rica.md) — itens 1, 2, 3, 5
- [architecture/08](../architecture/08-catalogo-categorizado.md) — **§2** (interfaces), **§3** (diff), **§4** (regras de resolução), **§5** (registry/vocabulário), **§6** (impacto no console). É a especificação-fonte desta story.
- [architecture/09](../architecture/09-fluxo-de-telas-e-apresentacao.md) — §4 ("Novos" / "Alterados") para saber quem vai consumir `resolver.ts`
- [prd/02-requisitos](../prd/02-requisitos.md) — RF-10 a RF-16, RNF-13/14
- Código atual: `src/data/tipos.ts`, `src/data/nichos.ts`, `src/data/nichos/exemplo.ts`, `src/lib/catalogo/carregar.ts`, `scripts/console/commands/catalog.mjs`, `scripts/console/lib.mjs`, `scripts/console/templates/niche.ts.tmpl`

---

## Contexto

O ADR-007 mudou a direção do produto: catálogo **curado e categorizado**,
**apresentação rica** por produto (galeria, benefícios, specs, blocos
declarativos) e **fluxo de 3 telas**. Nada disso pode começar antes do modelo de
dados existir em `src/data/tipos.ts`, com resolução pura testável e uma fixture
rica que as stories de UI (E5, E6) vão consumir.

Esta story coloca **só o schema e a lógica de resolução/validação** em código.
**Não** cria nem altera nenhum componente, layout, página ou stub de
personalização — isso é E5/E6/E3. O `exemplo.ts` atual (3 produtos, sem
`categoria`, sem `blocos`) **continua válido por construção**: todo campo novo é
opcional e tem default derivado (ADR-007 item "Consequências" · doc 08 §3).

### História

> Como **arquiteto/dev de UI** prestes a construir a vitrine categorizada e a
> tela de detalhe rica, quero o modelo de dados de ADR-007 já em `tipos.ts`, com
> funções puras que resolvem categorias efetivas, ordenação curada, herói e
> galeria derivada, mais uma fixture (`exemplo.ts`) que exercita cada campo novo
> — para poder desenvolver E5 e E6 em paralelo contra um contrato estável, sem
> reabrir decisões de schema.

> Como **operador que roda `npm run build`**, quero que `catalog validate`
> reprove um `id` de categoria inexistente, uma `prioridade` fora do range, um
> `tipo` de bloco desconhecido ou um asset de galeria/bloco faltando — para o
> gate de prebuild continuar sendo a rede de segurança do catálogo.

---

## Critérios de aceite

Numerados e verificáveis. Onde há comando, o comando **é** o critério.

### Schema (`src/data/tipos.ts`)

1. `tipos.ts` exporta as interfaces novas, exatamente com a forma de **doc 08 §2**:
   `ItemMidia`, `ParSpec`, `Categoria`, `BlocoBase`, `BlocoTexto`, `BlocoMidia`,
   `BlocoDepoimento`, `BlocoComoUsar`, `BlocoComparativo`, `BlocoBonus`,
   `BlocoFaq`, `BlocoSpecs`, o union `BlocoApresentacao`, o alias
   `TipoBloco = BlocoApresentacao['tipo']`, `RegraVariante`, `RegraOferta`.
2. `Produto` ganha, **todos opcionais**: `categoria?: string`,
   `prioridade?: number`, `galeria?: ItemMidia[]`, `beneficios?: string[]`,
   `specs?: ParSpec[]`, `blocos?: BlocoApresentacao[]`. Nenhum campo atual de
   `Produto` muda de obrigatoriedade — `imagem` **continua obrigatório**.
3. `Nicho` ganha, **todos opcionais**: `categorias?: Categoria[]`,
   `entrada?: { kicker?; heroiSku?; teaserPreco?; chamada? }`,
   `variantes?: { b?: RegraVariante }`, `ofertas?: Record<string, RegraOferta>`.
   Os obrigatórios de RF-02.4 (`slug`, `nome`, `titulo`, `subtitulo`, `acento`,
   `cta`, `produtos`) seguem obrigatórios.
4. `ContextoPersonalizacao` **não muda**.
5. `npm run typecheck` (`astro check`) passa **sem erro e sem warning novo**, com
   `strict` (herdado de `astro/tsconfigs/strict`).

### Resolução (`src/lib/catalogo/resolver.ts`)

6. Módulo **puro**: sem `import` de DOM, de `astro:*`, de `node:*`, de
   `import.meta.glob`, nem de qualquer componente. Só importa tipos de
   `../../data/tipos`. Reutilizável no build e no cliente (`slots/*` do E3).
7. `resolverCategorias(nicho, variante)` satisfaz doc 08 §4.1:
   - base = `nicho.categorias ?? []`, ordenada por `ordem ?? índice de declaração`;
   - anexa `{ id: '_outros', rotulo: 'Mais itens' }` ao fim **se** algum produto
     tem `categoria` ausente ou apontando id inexistente;
   - se a base ficou vazia → **substitui tudo** por
     `{ id: '_tudo', rotulo: nicho.nome }` (nesse caso não há `_outros`);
   - `variante === 'b'` + `nicho.variantes.b.ordemCategorias` → reordena por essa
     lista; ids não citados vão ao fim na ordem anterior; `_outros`/`_tudo`
     **sempre por último**.
8. `produtosPorCategoria(nicho, variante)` satisfaz doc 08 §4.2:
   - `Map` cujas chaves são os `id` de `resolverCategorias(nicho, variante)` **na
     mesma ordem**, cada uma com o array de produtos daquela categoria;
   - produto sem `categoria` válida cai em `_outros` (ou `_tudo`);
   - dentro do grupo: ordena por `prioridade` desc (default 50), desempate pela
     ordem de declaração em `nicho.produtos` (estável);
   - `variante === 'b'` + `nicho.variantes.b.ordem` → aplica essa ordem por `sku`
     **dentro de cada grupo**; `sku` não citado segue depois, na ordem acima;
   - todo produto aparece em **exatamente uma** categoria; nenhum é descartado;
   - `prioridade` nunca move produto entre categorias.
9. `heroiDaVitrine(nicho, variante)` — primeiro match de doc 08 §4.3:
   `variantes.b.destaque` (quando `variante === 'b'` e resolve p/ sku existente)
   → primeiro produto com `destaque === true` (ordem do arquivo)
   → produto de maior `prioridade` da **primeira** categoria efetiva (desempate:
   ordem do arquivo) → `nicho.produtos[0]`. Nunca retorna `undefined` para um
   nicho com ≥ 1 produto.
10. `galeriaDe(produto)` — doc 08 §4.6:
    - `produto.galeria` presente e não-vazia → devolve **a mesma referência de
      conteúdo** (cópia rasa aceitável), sem alterar;
    - senão → `[{ tipo:'imagem', src: produto.imagem, alt: produto.nome }]`,
      seguido de `{ tipo:'video', src: produto.video, poster: produto.poster,
      alt: produto.nome }` **se** `produto.video` existir.
11. `blocosDe(produto)` — doc 08 §4.7:
    - se `produto.specs` existe e `produto.blocos` **não** contém nenhum bloco
      `tipo === 'specs'` → resultado = `[{ tipo:'specs', pares: produto.specs },
      ...(produto.blocos ?? [])]`;
    - senão → `produto.blocos ?? []`, ordem preservada.
12. Exporta as constantes `CATEGORIA_OUTROS = '_outros'` e
    `CATEGORIA_TUDO = '_tudo'` e o helper `prioridadeDe(produto): number`
    (default 50; valor fora de `0..100` ou não-inteiro é **clampado/arredondado**
    só para efeito de ordenação — a rejeição dura é do `validar.ts`).
13. Determinismo: chamar qualquer função duas vezes com a mesma entrada dá saída
    idêntica (sem `Date`, sem `Math.random`, sem depender de ordem de
    `Object.keys` de map mutável).

### Validação estrutural (`src/lib/catalogo/validar.ts`)

14. Exporta `validarNicho(nicho: Nicho): string[]` — **pura**, sem `node:*`, sem
    `fs`, sem DOM. Devolve lista de mensagens legíveis em pt-BR (`[]` = íntegro).
    Importa o vocabulário de `../apresentacao/tipos-bloco.json`
    (`resolveJsonModule`, herdado do tsconfig strict do Astro — confirmar).
15. `validarNicho` acusa, no mínimo:
    - `categoria.id` que não casa `^[a-z][a-z0-9-]+$`, ou duplicado, ou usando os
      reservados `_outros` / `_tudo`;
    - `produto.categoria` definido mas não declarado em `nicho.categorias`;
    - `produto.prioridade` presente e **não** inteiro em `0..100`;
    - bloco sem `tipo`, ou com `tipo` fora de `tipos-bloco.json`;
    - bloco malformado por tipo (campos obrigatórios de doc 08 §2 ausentes ou do
      tipo errado): `texto.corpo: string[]` não-vazio; `midia.itens: ItemMidia[]`
      não-vazio; `depoimento.citacao` + `autor`; `como-usar.passos[].titulo`;
      `comparativo` com `linhas[].valores.length === colunas.length`;
      `bonus.itens[].nome`; `faq.itens[].pergunta` + `resposta`;
      `specs.pares: ParSpec[]`;
    - `ItemMidia` com `tipo` fora de `'imagem'|'video'`, `src` vazio, `alt` vazio,
      ou `tipo === 'video'` sem `poster`;
    - `ParSpec` com `chave` ou `valor` vazios;
    - `entrada.heroiSku` que não é `sku` de produto;
    - `variantes.b.ordemCategorias` com id inexistente (aceita `_outros`/`_tudo`);
      `variantes.b.ordem` com `sku` inexistente; `variantes.b.destaque` com `sku`
      inexistente;
    - `ofertas[id].selo` vazio.
16. `validarNicho` **não** acessa disco — a existência de asset é do
    `catalog validate` (CA 21). Emitir mensagens, nunca `throw`.
17. `validarNicho` é chamada como backstop em DEV no carregamento do índice:
    `src/data/nichos.ts` passa a rodar, **sob `import.meta.env.DEV`**, um loop
    que aplica `validarNicho` a cada nicho de `NICHOS` e faz `throw` com as
    mensagens concatenadas (em produção o código nem entra no bundle). Nenhum
    outro arquivo de `src/` é tocado. `npm run dev` do `exemplo` sobe sem erro.

### Vocabulário e registry (`src/lib/apresentacao/`)

18. `src/lib/apresentacao/tipos-bloco.json` existe e é **exatamente**:
    `["texto","midia","depoimento","como-usar","comparativo","bonus","faq","specs"]`.
    É a fonte única (RNF-14) — lida por `validar.ts`, pelo futuro `registry.ts` e
    pelo console.
19. `src/lib/apresentacao/registry.ts` existe, importa `tipos-bloco.json` e
    `TipoBloco` de `../../data/tipos`, e exporta
    `REGISTRY: Record<TipoBloco, unknown>` **com todas as 8 chaves presentes**,
    cada valor `null` por enquanto (os componentes Astro entram no E5). Um
    comentário de topo aponta E5-01/E5-02/E5-03 como donos de preencher.
    `registry.ts` **não** importa nenhum `.astro` nesta story.
    *(Racional da decisão de entrar "vazio": ver "Riscos/notas" abaixo.)*

### Fixture (`src/data/nichos/exemplo.ts`)

20. `exemplo.ts` é estendido para exercitar **100% do schema novo**, mantendo
    `slug: 'exemplo'` e sem quebrar `resolverNicho`. Mínimo:
    - `categorias`: 2 a 3, com `kicker` e `descricao` em pelo menos uma e `ordem`
      fora da ordem de declaração em pelo menos uma (para exercitar o sort);
    - `entrada`: objeto preenchido (`kicker`, `heroiSku`, `teaserPreco`,
      `chamada`);
    - `variantes.b`: com `ordemCategorias`, `ordem`, `destaque` e
      `chamadaEntrada` — todos referenciando ids/skus válidos;
    - `ofertas`: pelo menos uma entrada (`selo`, `cta`, `teaserEntrada`);
    - produtos (mantém ≥ 3; pode ir a 4–5):
      - pelo menos 1 **sem** `categoria` (cai em `_outros`) e o resto distribuído
        nas categorias declaradas;
      - `prioridade` variada (incluindo empate para exercitar o desempate);
      - 1 produto com `galeria` explícita (≥ 2 `ItemMidia`, incluindo 1
        `tipo:'video'` com `poster` e `alt`); outro **sem** `galeria` (exercita a
        derivação de `galeriaDe`); outro sem `galeria` mas com `video` (exercita a
        derivação com vídeo);
      - `beneficios` em ≥ 1 produto; `specs` em ≥ 1 produto **sem** `BlocoSpecs`
        nos `blocos` (exercita o prepend de `blocosDe`);
      - `blocos`: **um de cada `tipo`** do vocabulário, distribuídos entre os
        produtos (não precisa todos no mesmo), cada um bem-formado;
    - todo asset referenciado (`imagem`, `galeria[].src`, `galeria[].poster`,
      `blocos[].*.src`, `blocos[].*.avatar`, `blocos[].*.midia.src`) **existe no
      disco** em `src/assets/catalog/exemplo/` — adicionar placeholders
      (SVG rotulado; para o `ItemMidia` de vídeo, um `.mp4` placeholder leve de
      poucos KB serve). Placeholders SVG ⇒ `assets check` continua confortável.
21. `npm run validate` (→ `prometeus catalog validate`) sai **exit 0** no
    `exemplo` estendido, sem erro. Avisos são aceitáveis **exceto** o de
    "produto sem categoria num nicho que declara categorias" — como o fixture
    tem 1 produto de propósito sem `categoria`, esse aviso é **esperado** e não
    reprova (é `aviso`, não `erro`).

### Console — `catalog validate` cobre o schema novo

22. `scripts/console/lib.mjs#lerNicho` passa a extrair, além do que já lê
    (doc 08 §6):
    - a região `categorias:` → lista dos `id:` declarados;
    - por produto: `categoria:` e `prioridade:`;
    - a região `blocos:` de cada produto → lista de `tipo:` e dos caminhos
      `src:` / `avatar:` / `poster:` que aparecem dentro dela;
    - a região `galeria:` de cada produto → `src:` / `poster:`.
    Continua **scanner de texto**, sem parser de TS, zero-dep (ADR-005).
23. `scripts/console/commands/catalog.mjs` passa a checar (doc 08 §6):

    | Checagem | Nível |
    |---|---|
    | `produto.categoria` fora dos `id` declarados | **erro** |
    | produto sem `categoria` num nicho que declara `categorias` | aviso |
    | `prioridade` presente e não é inteiro em `0..100` | **erro** |
    | `tipo` de bloco fora de `tipos-bloco.json` | **erro** |
    | `src` / `avatar` / `poster` de galeria/bloco não existe no disco | **erro** |

    O vocabulário vem de
    `JSON.parse(readFileSync('src/lib/apresentacao/tipos-bloco.json'))` — **não**
    hard-coded em `.mjs`.
24. Provas negativas (rodar cada uma isolada, revertendo depois):
    - injetar `categoria: 'nao-existe'` num produto do `exemplo` → `npm run
      validate` sai **exit 1** com mensagem citando o `sku` e o id inválido;
    - injetar `prioridade: 150` → **exit 1**, mensagem citando o range;
    - injetar um bloco `tipo: 'inexistente'` → **exit 1**, mensagem citando o
      vocabulário;
    - trocar um `galeria[].src` para um arquivo que não existe → **exit 1**,
      mensagem com o caminho esperado.

### Portão final

25. Os quatro comandos, do zero, passam nesta ordem:
    ```
    npm run validate     # exit 0 — exemplo estendido íntegro
    npm run typecheck     # exit 0 — astro check, strict, sem erro
    npm run build         # exit 0 — prebuild roda o validate de novo, depois astro build
    npm run doctor        # exit 0 — ambiente ok (regressão de árvore)
    ```
26. `git diff --stat` mostra alterações **apenas** em: `src/data/tipos.ts`,
    `src/data/nichos.ts`, `src/data/nichos/exemplo.ts`,
    `src/lib/catalogo/resolver.ts` (novo), `src/lib/catalogo/validar.ts` (novo),
    `src/lib/catalogo/carregar.ts` (só o passthrough do CA da Tarefa 8, se feito),
    `src/lib/apresentacao/tipos-bloco.json` (novo),
    `src/lib/apresentacao/registry.ts` (novo),
    `src/assets/catalog/exemplo/**` (placeholders novos),
    `scripts/console/lib.mjs`, `scripts/console/commands/catalog.mjs`,
    e docs. **Nada** em `src/components/`, `src/layouts/`, `src/pages/`,
    `src/lib/personalizacao/*`, `src/lib/navegacao/`.

---

## Plano de tarefas (ordenado, arquivo por arquivo)

> Sequência pensada para manter `astro check` verde a cada passo.

### Tarefa 1 — `src/lib/apresentacao/tipos-bloco.json` (novo)

Criar o array literal do vocabulário (CA 18). É a primeira coisa porque
`tipos.ts` (o union) e `validar.ts` referenciam esse conjunto conceitualmente e
o console lê o arquivo.

```json
["texto", "midia", "depoimento", "como-usar", "comparativo", "bonus", "faq", "specs"]
```

### Tarefa 2 — `src/data/tipos.ts` (alterar)

Adicionar as interfaces novas **acima** de `Produto`, seguindo doc 08 §2 ao pé da
letra (nomes, campos, opcionalidade, comentários). Ordem sugerida no arquivo:
`ItemMidia` → `ParSpec` → `Categoria` → `BlocoBase` → `BlocoTexto` … `BlocoSpecs`
→ `BlocoApresentacao` (union) → `TipoBloco` → estender `Produto` → `RegraVariante`
→ `RegraOferta` → estender `Nicho`. Não mexer em `ContextoPersonalizacao`.

Pontos de atenção:
- `BlocoBase.id?` é a âncora de deep-link (`#<sku>-<id>`), opcional.
- `BlocoMidia.itens: ItemMidia[]`, `BlocoComoUsar.passos[].midia?: ItemMidia`,
  `BlocoSpecs.pares: ParSpec[]` — reusar os tipos, não redeclarar.
- `Nicho.entrada` é objeto inline com 4 campos opcionais (não criar interface
  nomeada se doc 08 §2 não criou — manter o inline `entrada?: { … }`).
- `keyof`/index: `TipoBloco = BlocoApresentacao['tipo']`.

Rodar `npm run typecheck` — o `exemplo.ts` atual tem que continuar compilando
sem mudança (é o teste de compatibilidade do CA da doc 08 §3).

### Tarefa 3 — `src/lib/catalogo/resolver.ts` (novo)

Módulo puro. Assinaturas exatas a implementar:

```ts
import type {
  Nicho, Produto, Categoria, ItemMidia, BlocoApresentacao,
} from '../../data/tipos';

export const CATEGORIA_OUTROS = '_outros';
export const CATEGORIA_TUDO = '_tudo';

/** prioridade efetiva p/ ordenação: default 50, inteiro, clamp 0..100. */
export function prioridadeDe(produto: Produto): number;

/** Categorias efetivas do nicho, na ordem de navegação. Doc 08 §4.1. */
export function resolverCategorias(nicho: Nicho, variante: 'a' | 'b'): Categoria[];

/**
 * id efetivo da categoria de um produto: seu `categoria` se referencia uma
 * categoria declarada; senão CATEGORIA_OUTROS (ou CATEGORIA_TUDO se o nicho
 * não declara nenhuma categoria). Helper interno exportado p/ reuso em E5/E6.
 */
export function categoriaEfetivaDe(nicho: Nicho, produto: Produto): string;

/** Produtos agrupados e ordenados por categoria efetiva. Doc 08 §4.2. */
export function produtosPorCategoria(
  nicho: Nicho,
  variante: 'a' | 'b',
): Map<string, Produto[]>;

/** Herói da vitrine (e default de entrada.heroiSku). Doc 08 §4.3. */
export function heroiDaVitrine(nicho: Nicho, variante: 'a' | 'b'): Produto;

/** Galeria efetiva: a declarada, ou derivada de [imagem, (video)]. Doc 08 §4.6. */
export function galeriaDe(produto: Produto): ItemMidia[];

/** Blocos efetivos: prepend de BlocoSpecs a partir de `specs` se preciso. Doc 08 §4.7. */
export function blocosDe(produto: Produto): BlocoApresentacao[];
```

Regras finas (repetir do CA 7–13):
- `resolverCategorias`: ordena a base por `ordem ?? índice`; anexa `_outros`
  **só** se existir produto órfão; se a base é vazia, vira `[_tudo]`; a
  reordenação de `variante 'b'` mantém `_outros`/`_tudo` sempre no fim.
- `produtosPorCategoria`: itera as categorias **na ordem de
  `resolverCategorias`** para montar o `Map` (a ordem de inserção do `Map`
  importa para os consumidores); sort estável `prioridadeDe` desc + índice de
  declaração; aplica `variantes.b.ordem` por `sku` dentro do grupo.
- `heroiDaVitrine`: cadeia de fallback do CA 9; garante retorno para nicho com
  produtos (nicho sem produtos é problema do `validar`/`catalog validate`, não
  deste módulo — pode `throw` só se `produtos.length === 0`, ou tipar o retorno
  como `Produto` assumindo o invariante; **decidir e comentar** — sugestão:
  assumir invariante, o gate já barra nicho vazio).
- `galeriaDe`: não mutar `produto.galeria`; ao derivar, `alt` = `produto.nome`.
- `blocosDe`: detecção de "já tem specs" = `blocos.some(b => b.tipo === 'specs')`.

Sem `console.*` (é caminho crítico de cliente). Sem estado de módulo mutável.

### Tarefa 4 — `src/lib/apresentacao/registry.ts` (novo)

```ts
// Mapa tipo-de-bloco → componente Astro. Preenchido no E5 (E5-01/02/03).
// Nesta story entra com todas as chaves e valor null: garante que o vocabulário
// (tipos-bloco.json), o union (TipoBloco) e o registry não divirjam.
import type { TipoBloco } from '../../data/tipos';
import VOCABULARIO from './tipos-bloco.json';

export const TIPOS_BLOCO = VOCABULARIO as readonly TipoBloco[];

export const REGISTRY: Record<TipoBloco, unknown> = {
  'texto': null,
  'midia': null,
  'depoimento': null,
  'como-usar': null,
  'comparativo': null,
  'bonus': null,
  'faq': null,
  'specs': null,
};
```

Se `astro check` reclamar do import de `.json`, confirmar `resolveJsonModule` (o
preset strict do Astro liga; se não, adicionar em `tsconfig.json`
`compilerOptions` — mudança mínima e aceitável nesta story).

### Tarefa 5 — `src/lib/catalogo/validar.ts` (novo)

```ts
import type {
  Nicho, Produto, ItemMidia, BlocoApresentacao,
} from '../../data/tipos';
import VOCABULARIO from '../apresentacao/tipos-bloco.json';

/**
 * Backstop estrutural de tipo — puro, sem fs, sem DOM, sem deps.
 * Devolve mensagens legíveis (pt-BR). [] = íntegro. Nunca lança.
 * A existência de assets é do `catalog validate` (scanner do console).
 */
export function validarNicho(nicho: Nicho): string[];
```

Implementar as checagens do CA 15. Estruturar interno em funções privadas por
alvo (`validarCategorias`, `validarProduto`, `validarBloco`, `validarItemMidia`,
`validarVariantes`, `validarOfertas`) que empurram strings num acumulador.
Prefixar cada mensagem com o contexto (`sku "exemplo-02": …`,
`categoria "cozinha": …`, `bloco #3 (faq) do sku "…": …`).

### Tarefa 6 — `src/data/nichos.ts` (alterar)

Adicionar, **e só isso**, o backstop DEV (CA 17):

```ts
import { validarNicho } from '../lib/catalogo/validar';
// … NICHOS, SLUGS, NICHO_PADRAO, resolverNicho inalterados …

if (import.meta.env.DEV) {
  const problemas = Object.entries(NICHOS).flatMap(([slug, n]) =>
    validarNicho(n).map((m) => `[${slug}] ${m}`),
  );
  if (problemas.length) {
    throw new Error(`Nichos inválidos:\n  ${problemas.join('\n  ')}`);
  }
}
```

Não alterar `resolverNicho` nem as exportações.

### Tarefa 7 — `src/data/nichos/exemplo.ts` (alterar) + placeholders de asset

Reescrever o `exemplo` para cobrir o CA 20. Manter o export nomeado `exemplo` e
`slug: 'exemplo'`. Sugestão de forma (o dev ajusta os textos):

- `categorias: [{ id:'destaques', rotulo:'Destaques', kicker:'SELEÇÃO', descricao:'…', ordem:1 }, { id:'basicos', rotulo:'Básicos', ordem:0 }, { id:'kits', rotulo:'Kits' }]`
  — `ordem` fora da ordem de declaração (exercita o sort da §4.1).
- `entrada: { kicker:'VITRINE Nº 07', heroiSku:'exemplo-01', teaserPreco:'a partir de R$ 39,90', chamada:'Ver a vitrine' }`.
- `variantes: { b: { ordemCategorias:['kits','destaques','basicos'], ordem:['exemplo-03','exemplo-01'], destaque:'exemplo-03', chamadaEntrada:'Começar pelos kits' } }`.
- `ofertas: { frete: { selo:'Frete grátis hoje', cta:'Aproveitar com frete grátis', teaserEntrada:'Frete grátis nas próximas horas' } }`.
- Produtos (4–5): um `exemplo-04` **sem** `categoria` → `_outros`; empate de
  `prioridade` entre dois; um com `galeria` explícita
  `[{tipo:'imagem',src:'01/g1.svg',alt:'…'},{tipo:'video',src:'01/clipe.mp4',poster:'01/poster.svg',alt:'…'}]`;
  um só com `video`/`poster` (galeria derivada com vídeo); um sem nada
  (galeria derivada só imagem). `beneficios` em 1–2. `specs` num produto **sem**
  `BlocoSpecs`. `blocos`: distribuir um de cada `tipo` (`texto`, `midia`,
  `depoimento`, `como-usar`, `comparativo`, `bonus`, `faq`, `specs`), todos
  bem-formados.
- Assets: criar em `src/assets/catalog/exemplo/` todo `src`/`poster`/`avatar`
  referenciado. SVGs rotulados (ex.: um `<svg>` com o texto "g1"); para o
  `clipe.mp4`, um mp4 placeholder de poucos KB (ou, se preferir não versionar
  binário, usar um segundo `ItemMidia` `tipo:'video'` cujo `src` também seja um
  arquivo leve versionável — **decidir**; o gate exige só que o caminho exista
  no disco).

Rodar `npm run validate` → exit 0 (com o aviso esperado do produto órfão).

### Tarefa 8 — `src/lib/catalogo/carregar.ts` (alterar — pequeno, opcional-recomendado)

`urlAsset` passa a **retornar o caminho como está** quando `rel` já começa com
`/` (vídeo servido de `public/`, doc 08 §2 comentário do `ItemMidia.src`). Uma
linha de guarda no topo:

```ts
export function urlAsset(slug: string, rel: string): string {
  if (rel.startsWith('/')) return rel;               // asset de public/ (ex.: /nichos/<slug>/x.mp4)
  const chave = `/src/assets/catalog/${slug}/${rel}`;
  // … resto inalterado …
}
```

Se o fixture da Tarefa 7 não usar nenhum caminho absoluto, esta tarefa pode ser
adiada para E2-04 — anotar a decisão no PR.

### Tarefa 9 — `scripts/console/lib.mjs` (alterar)

Estender `lerNicho` (CA 22), mantendo o estilo "scanner de texto, zero-dep":
- extrair a lista de `id:` dentro da região `categorias:` (fatiar do
  `categorias:` até o `]` que fecha o array de nível — heurística de contagem de
  colchetes, como o `sku:` já é fatiado);
- no trecho de cada produto (já fatiado por `sku:`), ler `categoria:` (string) e
  `prioridade:` (número);
- dentro do trecho do produto, localizar a sub-região `blocos:` e a `galeria:` e
  coletar **todas** as ocorrências de `tipo:`, `src:`, `avatar:`, `poster:`
  (varredura simples de todas as aspas após cada marca — não precisa entender a
  árvore, só juntar candidatos a checar).
- Exportar um helper novo `lerVocabularioBlocos()` que faz
  `JSON.parse(readFileSync(join(RAIZ, 'src/lib/apresentacao/tipos-bloco.json'), 'utf8'))`.

Adicionar `Number.isInteger`-friendly parsing e não quebrar se as regiões não
existirem (nichos no schema antigo continuam lendo).

### Tarefa 10 — `scripts/console/commands/catalog.mjs` (alterar)

Somar as checagens do CA 23 ao loop por nicho, reusando `push('erro'|'aviso', …)`:
- montar `Set` dos ids de categoria declarados; para cada produto com
  `categoria` fora do `Set` → **erro**; produto sem `categoria` **e** o nicho tem
  `categorias` → **aviso**;
- `prioridade` presente e `!Number.isInteger(p) || p < 0 || p > 100` → **erro**;
- `Set` do vocabulário via `lerVocabularioBlocos()`; cada `tipo` de bloco fora
  dele → **erro** (mensagem lista o vocabulário);
- cada caminho coletado de `src`/`avatar`/`poster` de galeria/bloco →
  `existsSync(assetDoNicho(slug, caminho))`; ausente → **erro** (mesma forma das
  mensagens de `imagem`/`video` que já existem). Caminho começando com `/` →
  checar em `public/` (`join(RAIZ, 'public', caminho)`) ou pular com aviso —
  alinhar com a Tarefa 8.

Rodar as 4 provas negativas do CA 24.

### Tarefa 11 — Portão + docs

- `npm run validate && npm run typecheck && npm run build && npm run doctor` —
  tudo exit 0 (CA 25).
- `git diff --stat` confere o CA 26 (nada de UI tocado).
- Atualizar `docs/architecture/08-catalogo-categorizado.md` §6 e
  `docs/epics/E2-catalogo-categorizado-e-curadoria.md` onde citam
  **`src/data/validar.ts`** → o caminho implementado é
  **`src/lib/catalogo/validar.ts`** (ver "Riscos/notas" — decisão desta story).
- Atualizar `docs/ESTADO-ATUAL.md` (seção "O que NÃO existe ainda" / "Andaime"):
  schema ADR-007 + `resolver.ts` + `validar.ts` + vocabulário implementados;
  `exemplo.ts` virou fixture rica.
- Marcar E2-03 como feita em `docs/stories/README.md` quando o dev entregar
  (esta story já a marca como "detalhada / próxima").
- **`niche.ts.tmpl` NÃO entra aqui** — é a Tarefa da E2-04 (o handoff do arquiteto
  colocou o template no escopo de E2-04; ver "Fora de escopo").

---

## Definição de Pronto

- [ ] `npm run validate` exit 0 no `exemplo` estendido (aviso do produto órfão é
      esperado e não reprova).
- [ ] `npm run typecheck` (`astro check`) exit 0, `strict`, sem erro nem warning
      novo.
- [ ] `npm run build` exit 0 (prebuild reexecuta o validate; `astro build`
      gera `dist/` sem regressão nas rotas `/`, `/n/exemplo/`, `/404`,
      `/sitemap.xml`).
- [ ] `npm run doctor` exit 0.
- [ ] As 4 provas negativas do CA 24 dão exit 1 com mensagem clara e citam o
      `sku`/id/caminho ofensor. Depois de verificadas, o `exemplo` volta ao
      estado íntegro.
- [ ] `exemplo.ts` exercita **cada** campo novo de `Produto` e `Nicho` e **cada**
      `tipo` de bloco do vocabulário; todo asset referenciado existe no disco.
- [ ] `resolver.ts` e `validar.ts` são puros (nenhum `import` de `node:*`,
      `astro:*`, DOM, `import.meta.glob` ou componente) — grep confirma.
- [ ] `REGISTRY` tem as 8 chaves; `tipos-bloco.json` tem os 8 tipos; o union
      `BlocoApresentacao` tem os 8 membros — os três conjuntos batem.
- [ ] `git diff --stat` não toca `src/components/`, `src/layouts/`,
      `src/pages/`, `src/lib/personalizacao/*`, `src/lib/navegacao/`.
- [ ] Docs reconciliados (08 §6 e E2 épico apontam
      `src/lib/catalogo/validar.ts`); `ESTADO-ATUAL.md` atualizado.
- [ ] PR descreve a decisão de caminho do `validar.ts` e o estado "vazio" do
      `registry.ts`.

---

## Fora de escopo (fica para E5 / E6 / E2-04 / E3)

- **Qualquer componente Astro**: `RenderBlocos`, `DetalheProduto`,
  `GaleriaMidia`, `TelaEntrada`, `VitrineFoco`, `TrilhaCategorias`,
  `MiniProduto`, `Bloco<Tipo>.astro` — **E5** / **E6**.
- **Preencher o `REGISTRY`** com componentes reais — **E5-01/02/03** (cada story
  adiciona suas linhas).
- **`scripts/console/templates/niche.ts.tmpl`** (2 categorias, `prioridade`,
  `galeria`, `entrada`, 1 bloco) — **E2-04** (junto com o endurecimento final do
  `lerNicho`/`catalog validate` e as mensagens definitivas).
- **`src/lib/navegacao/telas.ts`**, `#app[data-tela]`, `html.js`, `pushState`,
  seção única — **E6**.
- **`src/lib/personalizacao/slots/{index,entrada,vitrine,detalhe}.ts}`**,
  `criativo.ts` (`ordenarCategorias`/`heroi`), `oferta.ts` (`aplicarOferta` com
  `teaserEntrada`) — **E3-01/02/03**. Nesta story `RegraVariante`/`RegraOferta`
  entram **só como interfaces**; o `resolver.ts` já lê `variantes.b`, mas nada
  no cliente aplica ainda.
- **`og.ts`**, rota/sitemap por nicho, `deploy-check` — **E4**.
- **Medição de peso/LCP em device** — **E2-02** (pós E5+E6).
- **Subcategorias, score dinâmico/calculado, filtro/busca dentro da categoria** —
  fora por ADR-007 ("O que fica fora do escopo atual").
- **Primeiro nicho real** — **E2-01** (bloqueado por D-02/D-06).

---

## Riscos / notas de implementação

1. **Caminho do `validar.ts` — divergência de docs.**
   `[AUTO-DECISION]` O handoff do arquiteto (spawn desta story) pede
   `src/lib/catalogo/validar.ts`; **doc 08 §6** e o **épico E2** dizem
   `src/data/validar.ts`. → **Decisão: `src/lib/catalogo/validar.ts`**, ao lado
   de `resolver.ts` (ambos são lógica pura de catálogo, mesmo consumidor no E3).
   Motivo: coesão do diretório `lib/catalogo/`, e o handoff é a instrução mais
   recente e específica para esta story. Ação: a Tarefa 11 corrige as duas
   referências nos docs. Se o arquiteto preferir `src/data/`, é um `git mv` +
   ajuste de imports — trivial, decidir no review.

2. **`registry.ts` entra "vazio" (todas as chaves `null`).**
   `[AUTO-DECISION]` doc 08 §5 mostra o `REGISTRY` já importando `.astro`. →
   **Decisão: nesta story o registry declara as 8 chaves com valor `null`** e os
   componentes entram no E5. Motivo: (a) importar `.astro` de dentro de
   `src/lib/` sem que os arquivos existam quebra `astro check`; (b) o valor real
   do registry no E2 é **garantir que vocabulário ↔ union ↔ registry não
   divirjam** — isso o esqueleto com 8 chaves já entrega; (c) alinha com o
   PLANO-PROXIMO-PASSO ("registry + RenderBlocos + …" está listado em **E5-01**).
   `RenderBlocos` (E5) fará `REGISTRY[tipo] ?? (warn + null)`.

3. **Sem runner de teste — como "provar" o `resolver.ts`.**
   Não há vitest/jest e **não se pode adicionar dependência** (ADR-005 vale para
   o console; o app evita peso). `[AUTO-DECISION]` A verificação do `resolver.ts`
   nesta story é: (a) `astro check` (tipos), (b) o `exemplo.ts` construído para
   que **cada branch** das regras §4.1–§4.7 seja exercitada quando E5/E6
   consumirem o módulo, (c) opcionalmente o dev roda um smoke local com
   `node --experimental-strip-types` sobre um `.mjs` de asserts **não
   versionado** (ou versionado em `scripts/dev/` sem entrar em nenhum npm
   script). A cobertura formal do `resolver.ts` (casos determinísticos:
   categorias sintéticas, desempate de prioridade, cadeia do herói, galeria
   derivada) é **handoff explícito para `aiox-qa`** (ver PLANO §"Handoff").
   Recomendação: dev deixa um bloco `/** Casos de referência */` no topo do
   `resolver.ts` descrevendo entrada→saída esperada de cada função, para o QA
   transformar em asserts.

4. **`lerNicho` é scanner de texto (R-04 cresce).**
   Ler `categorias:`, `blocos:` e `galeria:` aninhados por contagem de colchetes
   é frágil. Mitigação: manter as heurísticas **permissivas** (coletar
   candidatos e checar existência/pertencimento; não tentar validar a árvore) —
   a profundidade estrutural é do `validarNicho` + `astro check`. O `exemplo.ts`
   é o caso que o scanner **tem** que cobrir; nichos reais que fujam da forma do
   fixture podem exigir endurecer o scanner na E2-04.

5. **`resolveJsonModule`.** `validar.ts` e `registry.ts` importam
   `tipos-bloco.json`. O preset `astro/tsconfigs/strict` habilita
   `resolveJsonModule` e `esModuleInterop`; se `astro check` reclamar, adicionar
   `"resolveJsonModule": true` em `tsconfig.json` (mudança mínima, dentro do
   escopo). Alternativa sem import de JSON no TS: declarar o array `TIPOS_BLOCO`
   em `resolver.ts`/`tipos.ts` e o `.json` servir **só** o console — mas isso
   cria duas fontes; preferir o import.

6. **`ItemMidia` de vídeo no fixture.**
   Para exercitar `tipo:'video'` sem violar `assets check`/`validate`, o fixture
   pode: (a) versionar um `.mp4` placeholder de poucos KB em
   `src/assets/catalog/exemplo/01/`, ou (b) apontar `src` para um caminho
   `public/` absoluto (`/nichos/exemplo/…`) e implementar a Tarefa 8 + a checagem
   em `public/` na Tarefa 10. `[AUTO-DECISION]` preferir **(a)** — mantém o gate
   de disco uniforme e não arrasta a semântica de `public/` para esta story; a
   Tarefa 8 fica como melhoria opcional.

7. **`heroiDaVitrine` e nicho sem produtos.**
   O tipo de retorno é `Produto` (não `Produto | undefined`) — assume o
   invariante "nicho tem ≥ 1 produto", garantido por `catalog validate`
   (`n.produtos.length === 0` já é aviso hoje; considerar elevar a erro na
   E2-04). O dev deve comentar o invariante no código; um `throw` defensivo em
   `produtos.length === 0` é aceitável.

8. **Compatibilidade retroativa é critério, não boa-vontade.**
   Antes de estender o `exemplo.ts`, rodar `npm run typecheck` com o `exemplo.ts`
   **atual** e o `tipos.ts` **novo** — tem que passar sem tocar no fixture. Só
   depois estender. Isso prova o CA da doc 08 §3.

9. **Ordem de inserção do `Map` de `produtosPorCategoria`.**
   Consumidores (E6 grade, E3 vitrine) confiam que iterar o `Map` dá as
   categorias na ordem da trilha. Construir o `Map` iterando
   `resolverCategorias(...)`, nunca a partir de `nicho.produtos`.
