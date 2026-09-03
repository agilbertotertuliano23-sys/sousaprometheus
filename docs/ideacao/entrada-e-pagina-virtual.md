# Ideação — Tela de entrada + Página virtual do catálogo

**Data:** 2026-09-02 · **Autor:** Atlas (AIOX Analyst) · **Status:** leque de ideias para decisão do dono
**Escopo:** ideação estruturada. Nada aqui é implementação. Não altera código.

> **Revisão 2026-09-02 —** a tela do meio ("vitrine em foco C4") foi revista. Ver
> [catalogo-como-pagina-web.md](catalogo-como-pagina-web.md) (Direção C: catálogo
> como página de blocos) e o [ADR-008](../architecture/decisions/adr-008-catalogo-como-pagina-rica-de-secoes.md)
> (proposto). Este documento continua válido para a tela de entrada e a de
> detalhe; a "vitrine em foco" abaixo é substituída pelos blocos da Direção C.

Contexto: o dono não quer a página atual (cabeçalho + grade seca). Quer (1) uma **página
virtual que APRESENTA os produtos** como experiência de vitrine e (2) uma **tela de entrada**
antes dela. Este documento entrega o leque, a matriz de decisão e uma recomendação.

---

## 1. Resumo da leitura — o que os docs já travam

Qualquer ideia abaixo tem de respeitar isto:

1. **Um HTML, buildado uma vez com o nicho padrão.** Toda personalização é client-side
   (`contexto.ts` → `slots.ts`) a partir de `?n=` / `?c=` / `?o=` +
   `localStorage['prometeus:ultimo-nicho']`. Sem rota dinâmica, sem servidor, sem SSR
   (ADR-003 / ADR-004 / `architecture/03`).
2. **Orçamento de peso é lei.** ≤ 1,2 MB no 1º paint; por asset: imagem 180 KB, poster
   60 KB, vídeo 400 KB (`assets check` no console). LCP ≤ 2,5 s e TTI ≤ 3,5 s em 4G
   simulado no webview (RNF-01 / RNF-02).
3. **Tem que funcionar inteira sem JS.** Nicho padrão renderizado, cards com `imagem`
   (não vídeo), todos os links de saída ativos. Toda ideia precisa de um estado "JS-off"
   que ainda vende (RNF-03 / RNF-04 / R-03).
4. **`prefers-reduced-motion: reduce` zera animação e transição.** Qualquer coreografia
   (abrir caixa, palco giratório, parallax, scroll narrativo) precisa de um caminho
   estático equivalente (RNF-08).
5. **Proibido three.js / WebGL / `.glb` (R-05).** CSS transforms e CSS 3D (`perspective`,
   `rotateY`, `translate3d`) e parallax leve são permitidos — mas pagam CPU no webview.
   Testar em device de baixo custo antes de commitar.
6. **Sem framework no caminho crítico de render.** A grade é HTML Astro puro. Ilha Preact
   (~4 KB) ou Embla Carousel (^8.6, já na stack) só onde a interação justificar. Zero JS
   bloqueante no `<head>`; scripts `type="module"` no fim do `<body>` (RNF-03, `architecture/01`).
7. **Fundo quase-preto fixo (`#0A0B0C`).** A única cor variável é `--acento`, trocada em
   runtime por nicho, com regra de contraste AA sobre ela (usar `--acento-texto` ou texto
   escuro quando reprovar). Sem 2ª cor cromática por estado. Fontes com fallback de
   sistema — nenhuma web font bloqueia o LCP (`prd/05`, `design/01`).
8. **Catálogo curto por design (2–8 produtos).** Mobile-first, alvo de toque ≥ 44px,
   `--largura-pagina: 480px`. Conversão é sempre link de saída externo
   (`target="_blank" rel="noopener nofollow"`, carrega `data-sku` / `data-variante` para
   o pixel do anunciante). Sem carrinho, sem login, sem PII (`prd/01` / `prd/03`, RF-04).

**Implicação de projeto:** a "experiência" precisa nascer de CSS + estado leve + no máximo
uma ilha. O diferencial não vem de tecnologia — vem de enquadramento, ritmo e copy. E toda
tela precisa "cair" numa versão HTML plana que ainda converte.

---

## 2. Tela de entrada — 8 conceitos

Convenção de custo: **baixo** = HTML + CSS, sem ilha, sem asset novo. **médio** = estado JS
leve e/ou 1 asset dentro do orçamento e/ou coreografia com fallback. **alto** = ilha,
produção de asset por criativo, ou risco de perf que exige teste em device.

### E1 — Portal do Nicho ("Você veio ver…")
**O que é:** tela cheia, fundo quase-preto, uma linha grande de display que nomeia o que a
pessoa veio procurar (deriva de `nicho.titulo`), um subtítulo de reforço, e um CTA grande
no acento: "Ver a vitrine". Fundo = gradiente CSS no acento ou 1 poster ≤ 60 KB.
**Job:** transição de contexto vindo do TikTok + enquadrar a promessa. Retém no 1º segundo
porque espelha o assunto do vídeo que a pessoa acabou de ver.
**Com `?n=/?c=/?o=`:** `?n=` define título + subtítulo + acento; `?c=` (bucket a/b) troca a
variante da headline ou o poster; `?o=` injeta a tarja da oferta já na entrada
("Frete grátis hoje").
**Custo:** baixo.
**Risco:** é um interstício — adiciona um toque de fricção. Mitigar fazendo parecer
conteúdo (produto/preço à vista), não um portão vazio.

### E2 — Abrir a caixa (ritual de unboxing)
**O que é:** a entrada é uma caixa/pacote fechado desenhado em CSS (retângulo com tampa,
fita no acento). Toque → tampa abre (CSS `transform`, ≤ 400 ms; reduced-motion = abre
instantâneo) → revela a vitrine.
**Job:** ritual de "abrir", curiosity gap, engajamento tátil. Memorável.
**Com `?n=/?c=/?o=`:** cor da caixa = `--acento`; `?o=` = um selo/adesivo na caixa;
`?c=` = posição da fita ou copy na tampa ("Selecionado pra você").
**Custo:** médio.
**Risco:** custo de animação no webview; parece gimmick se lento. Tem de ser < 400 ms e
pular sozinho para quem tem reduced-motion.

### E3 — Enquete de 1 toque ("O que você procura?")
**O que é:** 2–3 barras grandes tappáveis (largura total, ≥ 44px), cada uma mapeada a uma
`tag` ou subconjunto de produtos. Não troca de nicho (o build é um só) — **reordena/filtra**
a vitrine. A escolha vive em memória (não precisa de `localStorage`).
**Job:** microcompromisso (princípio da consistência) + auto-segmentação. A vitrine
seguinte parece personalizada porque a pessoa a moldou.
**Com `?n=/?c=/?o=`:** `?n=` define quais chips aparecem (das tags do nicho); `?c=` define
ordem dos chips ou qual vem pré-destacado; `?o=` passa adiante intacto.
**Custo:** baixo–médio.
**Risco:** adiciona uma decisão. Se os rótulos forem vagos, bounce. Máximo 3 chips,
substantivos concretos.

### E4 — Capa editorial ("Edição pet-shop")
**O que é:** trata a entrada como capa de revista — display grande (`nicho.titulo`), um
kicker ("VITRINE Nº 07"), uma imagem de produto herói sangrando fora do quadro, um teaser
de preço, e um indicador de "continuar" (scroll/toque). Sem botão obrigatório.
**Job:** enquadrar a promessa + sinalizar curadoria/qualidade (sobe o valor percebido →
conversão). Riqueza visual instantânea para reter no 1º segundo.
**Com `?n=/?c=/?o=`:** `?n=` → título + acento + herói = produto `destaque`; `?c=` → qual
produto é o herói + variante da headline; `?o=` → faixa de oferta na capa.
**Custo:** baixo.
**Risco:** "capa" que parece anúncio dispara o reflexo de pular. Precisa de um produto real
visível, não só tipografia.

### E5 — Prova social em números
**O que é:** tela escura, um número grande em mono ("R$ 39,90 a partir de" ou
"3 esgotaram esta semana"), depois revela a vitrine.
**Job:** prova social + ancoragem de preço + pattern interrupt.
**Com `?n=/?c=/?o=`:** `?n=` → o texto/número; `?o=` → troca para número da oferta
("-40%, termina hoje"); `?c=` → variante do claim.
**Custo:** baixo.
**Risco alto de confiança:** sem backend não há contador ao vivo — só claim estático
curado. Público de TikTok é cético a anúncio. **Só usar com dado verdadeiro que o dono
consiga defender.** Falsa precisão queima a marca. Contador regressivo só com data de fim
real.

### E6 — Loop de vídeo do criativo (continuidade)
**O que é:** a entrada roda um loop 9:16 mudo curto (≤ 400 KB, poster ≤ 60 KB para o LCP)
que rima visualmente com o TikTok que a pessoa acabou de deixar, com `nicho.titulo`
sobreposto e um "arraste pra cima".
**Job:** continuidade de contexto (a página "é" o vídeo) + retenção no 1º segundo por
movimento + familiaridade, sem salto cognitivo.
**Com `?n=/?c=/?o=`:** `?n=` → qual loop + acento + título; `?c=` (bucket) → **qual loop
a/b**, para casar o loop com o anúncio real; `?o=` → tarja sobreposta.
**Custo:** alto — exige um loop curado por nicho/criativo e disciplina de lazy-load no
resto.
**Risco:** autoplay bloqueado no webview → cair para poster (R-01); pressão de orçamento
(não dá pra ter vídeo pesado no 1º painel da vitrine também); custo de produção por
criativo.

### E7 — Limiar / túnel
**O que é:** transição curtíssima de viewport inteira — um corredor/portão em CSS com o
acento como "luz no fim"; toque ou auto-avança em ~800 ms para a vitrine. Funciona como
véu que esconde o decode dos assets da vitrine.
**Job:** transição de contexto + mascarar o LCP da vitrine.
**Com `?n=/?c=/?o=`:** `?n=` → cor da luz = acento; `?o=` → placa sobre o portão.
**Custo:** baixo.
**Risco:** se não esconder carregamento real, é só um segundo desperdiçado. Só vale se
for ≤ 1 s e genuinamente cobrir o load.

### E8 — Escolha do "modo de ver"
**O que é:** oferece 2 formas de navegar: "Rápido" (grade seca, o default de JS-off) vs
"Vitrine" (a experiência). Um toque.
**Job:** dá controle ao polegar impaciente; funciona como escape hatch de reduced-motion /
low-power.
**Com `?n=/?c=/?o=`:** escolha em memória; resto passa adiante.
**Custo:** baixo.
**Risco:** meta-escolha sobre UI é estranha para tráfego frio — a maioria não liga.
Provavelmente melhor como toggle pequeno sempre visível do que como portão de entrada.

---

## 3. Página virtual do catálogo — 8 conceitos

"Apresentar os produtos como experiência" aqui pode significar: metáfora espacial, scroll
narrativo, corredor, um produto em foco por vez, palco giratório em CSS, parallax leve,
mesa com objetos. **Todos os 8 são viáveis sem three.js/3D e sem backend** — o C3 (palco)
usa CSS 3D transforms, que R-05 não proíbe (R-05 é sobre WebGL/`.glb`), mas é o de maior
risco de perf.

### C1 — Reels/Stories: um produto por vez, tela cheia
**O que é:** cada produto é um "slide" 9:16 de viewport inteira (imagem ou loop mudo),
nome + preço + CTA no acento sobrepostos embaixo, progress dots no topo, swipe vertical
entre produtos (CSS `scroll-snap-type: y mandatory`; Embla só se o feel exigir).
**Job:** espelha o modelo mental do TikTok (swipe vertical, uma coisa por vez), foco
máximo por produto, vídeo em primeiro plano.
**Com `?n=/?c=/?o=`:** `?n=` → o set de slides; `?c=` → ordem + qual é o slide 1
(`destaque` lidera); `?o=` → tarja persistente em todos os slides + texto do CTA.
**JS-off:** `scroll-snap` nativo já empilha os painéis full-height com links ativos — o
core não precisa de JS. Vídeo cai para imagem.
**Custo:** médio.
**Risco:** fadiga de swipe com 8 produtos; a pessoa pode não saber que swipa (precisa de
affordance); peso se cada slide for vídeo → lazy-load agressivo do slide 2 em diante.

### C2 — Corredor horizontal / trilha
**O que é:** produtos ao longo de um trilho horizontal; swipe lateral por um "corredor"
com uma camada de fundo em parallax sutil (CSS `translate` no scroll). Um produto
snap-centrado por vez, com espiada do próximo.
**Job:** metáfora espacial ("passar por uma prateleira"); a espiada puxa o "só mais um".
**Com `?n=/?c=/?o=`:** `?n=` → itens + tint de "parede/chão" no acento; `?c=` → ordem +
ponto de entrada; `?o=` → uma faixa atravessada no corredor.
**JS-off:** `scroll-snap` horizontal nativo funciona; o parallax só não anima.
**Custo:** médio.
**Risco:** scroll horizontal no mobile briga com o gesto de "voltar" do webview e com o
scroll vertical; descoberta; reduced-motion mata o parallax.

### C3 — Palco giratório (carrossel CSS 3D, sem three.js)
**O que é:** um coverflow/rotativa: produtos num anel com `transform: rotateY()` +
`perspective`. Um produto de frente e centralizado, vizinhos angulados nas laterais;
toque num lateral ou arraste para girar.
**Job:** espetáculo de "showroom giratório", sensação premium — recupera parte do "uau"
do ARES dentro do orçamento.
**Com `?n=/?c=/?o=`:** `?n=` → o anel; `?c=` → qual produto encara a frente no load;
`?o=` → rótulo no pedestal.
**JS-off / reduced-motion:** degrada para uma linha `scroll-snap` (o anel é enhancement).
**Custo:** alto.
**Risco:** CSS 3D dá jank em GPU de Android barato; limitar a ~5 visíveis e testar em
device. Fácil de exagerar. **A versão three.js está fora de escopo (R-05).**

### C4 — Vitrine em foco: 1 herói + gaveta
**O que é:** um produto herói grande ocupa quase toda a viewport (vídeo/imagem, preço,
CTA); abaixo, uma tira fina de miniaturas (o resto do catálogo). Toque numa mini → ela
vira o herói (crossfade ≤ 200 ms). Sem scroll longo.
**Job:** "apresenta os produtos" ao pé da letra — uma vitrine com uma peça iluminada por
vez; carga cognitiva baixa; todo produto a um toque.
**Com `?n=/?c=/?o=`:** `?n=` → herói = `destaque` ou produto 1; `?c=` → qual é o herói +
ordem das minis; `?o=` → tarja no herói + texto do CTA.
**JS-off:** herói + tira renderizam como uma pilha curta de `CardProduto` com links —
literalmente uma versão enxuta da página de hoje.
**Custo:** baixo–médio.
**Risco:** produtos não-herói recebem pouca atenção (ok para 2–8, ruim se crescer); a
tira de minis pode parecer "produtos relacionados" de e-commerce.

### C5 — Scroll narrativo: cada produto é uma "cena"
**O que é:** scroll vertical guiado, cada produto ocupa ~1 viewport e entra com
fade/translate (reduced-motion = instantâneo), com uma frase de "pitch" por produto que
constrói uma mini narrativa ("Começa aqui." → "Depois isto." → "Fecha com isto.").
**Job:** transforma lista em história curada; sobe o valor percebido; mantém o polegar em
movimento com um ritmo.
**Com `?n=/?c=/?o=`:** `?n=` → as cenas; `?c=` → ordem das cenas + qual leva a frase de
abertura; `?o=` → fita de oferta fixa.
**JS-off:** é só uma pilha vertical de cards full-height — degrada perfeitamente.
**Custo:** baixo.
**Risco:** ainda é fundamentalmente um scroll (o dono rejeitou "lista rolável"). A
diferença é ritmo + copy. Se a copy for fraca, é só uma lista mais alta.

### C6 — Mesa / flatlay com objetos
**O que é:** uma cena de tampo escuro (1 imagem de fundo ≤ 180 KB ou CSS) com os produtos
dispostos como objetos sobre ela; toque num objeto → ele "levanta"/dá zoom para um card em
foco (CSS `transform-origin`).
**Job:** metáfora espacial "aqui estão as coisas, dispostas"; descoberta por cutucar;
parece um conjunto curado, não um feed.
**Com `?n=/?c=/?o=`:** `?n=` → o flatlay + hotspots (coords por nicho nos dados); `?c=` →
qual objeto "brilha" primeiro; `?o=` → um bilhete sobre a mesa.
**JS-off:** mostrar os produtos como lista de cards normal abaixo de um herói estático da
imagem da mesa.
**Custo:** alto.
**Risco:** posicionar hotspots sobre um bitmap quebra entre proporções de tela; custo de
produção por nicho (precisa de uma foto flatlay real e estilizada); tap targets vs 44px.

### C7 — Camadas parallax leves ("vitrine com profundidade")
**O que é:** scroll curto com 2–3 camadas de profundidade (fundo com tint/padrão, cards no
meio, moldura de acento na frente) em taxas diferentes via `translate3d` no scroll — ou
`animation-timeline: scroll()` onde suportado, com fallback. Produtos num fluxo snap.
**Job:** sensação barata de profundidade e capricho → valor percebido; faz uma página
curta parecer projetada.
**Com `?n=/?c=/?o=`:** `?n=` → acento move a moldura + o fundo; `?c=/?o=` como nos outros.
**JS-off / reduced-motion:** camadas empilham planas, sem movimento.
**Custo:** baixo–médio.
**Risco:** jank de parallax no webview; estética batida; tem de ser sutil ou lê como
"cafona".

### C8 — Grade viva: cards que expandem no lugar
**O que é:** mantém um layout de grade (o mais próximo de hoje), mas vira experiência:
entrada escalonada, o card `destaque` maior e com vídeo, leve tilt no scroll, e tocar um
card **expande ele no lugar** para um detalhe de tela cheia (acordeão / shared-element) em
vez de navegar.
**Job:** mudança mínima do build atual, mas o expandir-no-lugar faz parecer que cada
produto está sendo "apresentado". Risco baixo, rápido de entregar.
**Com `?n=/?c=/?o=`:** `?n=` → conteúdo da grade + qual é o card grande; `?c=` → ordem +
`destaque`; `?o=` → tarja.
**JS-off:** grade simples de cards + links (literalmente a página de hoje).
**Custo:** baixo.
**Risco:** é o menos diferenciado do que o dono já rejeitou. A "experiência" depende
inteira da interação de expandir ser gostosa.

---

## 4. Encaixe entrada → catálogo

### T-A — Seção única, revelação por estado no cliente (recomendada como padrão)
Entrada e vitrine vivem no mesmo `index.html`. Entrada é um `<section>` de viewport inteira
no topo; vitrine logo abaixo. Continuar = scroll ou um toggle JS que adiciona classe /
rola até a vitrine.
**Personalização:** `contexto.ts` roda uma vez; as duas seções leem o mesmo nicho
resolvido. Zero problema de continuidade — os params nunca saem da URL.
**JS-off:** a entrada é só a primeira tela; a vitrine está logo abaixo, tudo visível e
linkado. RNF-04 limpo.

### T-B — Scroll-snap entre dois painéis de viewport inteira
Entrada = painel 1, vitrine = painel 2+, via CSS `scroll-snap-type: y` (não precisa de JS
para o snap).
**Personalização:** idêntica à T-A.
**JS-off:** `scroll-snap` degrada para scroll normal — ok.
**Risco:** scroll-jack briga com o momentum do webview. Usar `proximity`, não `mandatory`,
ou parece quebrado. Boa dupla natural com a vitrine C1 (Reels).

### T-C — Rota separada (`/` entrada → `/n/<slug>` ou `#vitrine`)
Entrada em `/`, vitrine na rota estática por nicho (C-3 do escopo, já com stub).
**Personalização:** precisa reencaminhar `?n=` / `?c=` / `?o=` na navegação — um handler
que anexa `location.search` ao `href`.
**JS-off:** **degrada mal.** O build não sabe o `?c=` / `?o=` do visitante, então o
`<a href>` estático perde os params sem JS → quebra a atribuição por criativo (R-08).
**Só usar se SEO por nicho pesar mais que atribuição.** Preferir `#hash` +
`history.pushState` a uma navegação real, para manter documento único.

**Resumo:** T-A por padrão. T-B se a vitrine for full-screen com swipe (C1). T-C só por
SEO, e com a ressalva de degradação acima.

---

## 5. Mecânicas de engajamento / conversão

Tráfego frio de TikTok, CTA de **saída** (link afiliado/loja, sem checkout próprio), sem
login, sem coleta de dado pessoal.

1. **Tarja de oferta persistente (`?o=`) + urgência honesta.** Faixa fina fixa com a
   oferta ("Frete grátis" / "-40%"), visível na entrada e na vitrine, trocando o texto do
   CTA ("Pegar com frete grátis"). Contador regressivo **só com data de fim real** —
   senão é dark pattern e o público de TikTok fareja.
2. **Preço-âncora cedo.** Mostrar "a partir de R$ XX" já na entrada, para tratar a objeção
   de preço antes da vitrine. Cada card mostra `precoDeCentavos` riscado + `-NN%` (já no
   schema, RF-04.2). É a alavanca mais barata para tráfego frio.
3. **Microcompromisso de 1 toque** (entrada E3). O ato de escolher um chip aumenta a
   probabilidade do clique de saída (consistência). Zero dado coletado — a escolha vive
   em memória.
4. **Prova social estática e verificável.** Uma linha curta e curada por produto/nicho
   ("mais levado", "esgotou 2x") nos dados, renderizada como rótulo mono pequeno.
   **Tem de ser verdade** — o dono fornece. Nada de contador falso "ao vivo".
5. **CTA sticky sempre ao alcance do polegar.** Botão de saída fixo embaixo, ≥ 44px, no
   acento, acompanhando o produto em foco (nos layouts de herói/foco).
   `target="_blank" rel="noopener nofollow"`, carrega `data-sku` / `data-variante` para o
   pixel do anunciante (RF-04.3).
6. **"Continuar de onde parei".** Em revisita, usar o `localStorage` do último nicho (o
   único estado permitido, RNF-09) para pular a entrada direto para a vitrine. Retenção
   barata para re-cliques da mesma campanha.
7. **(Bônus) Compartilhar via Web Share API.** Botão usando `navigator.share()` — sem
   backend, sem PII. O OG por nicho (RF-09) faz o card de compartilhamento sair certo.
   Esforço baixo, algum ganho orgânico.

---

## 6. Referências e analogias

| Direção | Referência real | Copiar | Evitar |
|---|---|---|---|
| Reels vitrine (C1) | Instagram/TikTok Stories & Reels | full-screen vertical, 1 item por vez, progress dots, tap-zones, "X de 6" | timer de auto-avanço (comprador frio quer controle); feed infinito (catálogo é finito) |
| Baseline "link na bio" | Linktree / Beacons / Stan.store | velocidade, 1 CTA claro | a lista genérica indiferenciada — é exatamente o que o dono rejeitou |
| Scroll narrativo / parallax (C5/C7) | Páginas de produto da Apple (AirPods) | uma ideia por viewport, contenção, ritmo | peso de asset (vídeos enormes); animação scroll-driven pesada — temos 1,2 MB |
| Capa editorial (E4) | Aesop / Bottega / Bang & Olufsen e-commerce | pistas de curadoria, espaço negativo, valor percebido | hero em vídeo lento; tipografia dependente de web font |
| Palco giratório (C3) | Coverflow (iTunes antigo); carrosséis CSS de sites de drop de tênis | leitura "1 herói + vizinhos angulados" | versões WebGL (R-05); libs de física de drag |
| Entrada de 1 pergunta (E3) | Typeform | escolha única grande e amigável | multi-step — no frio, uma pergunta no máximo |
| Abrir a caixa (E2) | Landings de unboxing / promo de calendário do advento | curiosity gap | animações longas; qualquer coisa que bloqueie conteúdo > 0,5 s |
| CTA / trust de conversão | Card de produto do TikTok Shop / app Shop da Shopify | CTA sticky embaixo, chip de desconto, linha de prova social | — (é provado para exatamente este público) |
| Mesa / flatlay (C6) | Microsites "one product" premiados (Awwwards) | enquadramento e "iluminação" via gradiente CSS | os orçamentos de carga deles, por inteiro |

---

## 7. Matriz de decisão

Escala 1–5, **maior = melhor em todos os eixos**: Impacto 5 = alto impacto; Esforço 5 =
barato/rápido; Risco 5 = baixo risco; Aderência 5 = totalmente dentro das restrições.
"Total" é a soma bruta (máx. 20), só para ordenar a conversa.

### Tela de entrada

| # | Conceito | Impacto | Esforço | Risco | Aderência | Total | Justificativa (1 frase) |
|---|---|:--:|:--:|:--:|:--:|:--:|---|
| E1 | Portal do Nicho | 4 | 5 | 4 | 5 | **18** | Enquadra a promessa por quase nada; único risco real é o toque extra de fricção. |
| E4 | Capa editorial | 4 | 5 | 3 | 5 | **17** | Riqueza visual e valor percebido a custo baixo; risco de parecer anúncio e ser pulada. |
| E3 | Enquete de 1 toque | 4 | 4 | 3 | 5 | **16** | Microcompromisso + auto-segmentação; risco de adicionar uma decisão que causa bounce. |
| E2 | Abrir a caixa | 4 | 3 | 3 | 4 | **14** | Memorável e tátil; custo de coreografia e cheiro de gimmick no webview. |
| E8 | Modo de ver | 2 | 4 | 3 | 5 | **14** | Dá controle e serve de escape de a11y; meta-escolha que o tráfego frio ignora. |
| E5 | Prova social em números | 3 | 4 | 2 | 4 | **13** | Ancoragem forte se real; sem backend vira claim estático e arrisca confiança. |
| E6 | Loop de vídeo do criativo | 5 | 2 | 3 | 3 | **13** | Melhor continuidade de 1º segundo; caro de produzir por criativo e pressiona o orçamento. |
| E7 | Limiar / túnel | 2 | 4 | 3 | 4 | **13** | Pode mascarar o LCP; se não esconder load real, é só um segundo perdido. |

### Página virtual do catálogo

| # | Conceito | Impacto | Esforço | Risco | Aderência | Total | Justificativa (1 frase) |
|---|---|:--:|:--:|:--:|:--:|:--:|---|
| C4 | Vitrine em foco (herói + gaveta) | 4 | 4 | 4 | 5 | **17** | "Apresenta os produtos" ao pé da letra, carga baixa, degrada limpo para lista de cards. |
| C8 | Grade viva (expande no lugar) | 3 | 5 | 4 | 5 | **17** | Rápido e seguro; pouco diferenciado do que o dono já rejeitou. |
| C1 | Reels/Stories full-screen | 5 | 3 | 3 | 4 | **15** | Espelha o modelo mental do TikTok; fadiga de swipe e peso de vídeo por slide. |
| C5 | Scroll narrativo | 3 | 4 | 3 | 5 | **15** | Degrada perfeitamente; ainda é um scroll — só ganha se a copy carregar. |
| C7 | Parallax leve | 3 | 4 | 3 | 4 | **14** | Sensação barata de capricho; jank no webview e estética batida. |
| C2 | Corredor horizontal | 4 | 3 | 2 | 4 | **13** | Metáfora espacial com espiada que puxa; scroll horizontal briga com gestos do webview. |
| C3 | Palco giratório CSS | 4 | 2 | 2 | 3 | **11** | Recupera o "uau" do ARES; CSS 3D dá jank em Android barato, exige teste em device. |
| C6 | Mesa / flatlay | 4 | 2 | 2 | 3 | **11** | Descoberta distinta; hotspots sobre bitmap quebram entre telas e custam produção por nicho. |

---

## 8. Recomendação

Duas direções combinadas para o dono escolher. Ambas respeitam todas as restrições duras
e degradam para a grade de hoje sem JS.

### Direção A — baixo risco, rápido de entregar (recomendada para começar)
**Entrada E4 (Capa editorial) + Vitrine C4 (herói + gaveta)**, num só documento, com
transição **T-A** (seção única, revelação por estado).

**Por quê:** as duas são as de melhor pontuação nas respectivas listas; as duas são de
esforço baixo/baixo-médio; as duas caem limpo na grade de hoje com JS desabilitado
(RNF-04); as duas usam `--acento` e os hooks `?c=` / `?o=` de forma natural. Juntas
entregam literalmente "apresentar os produtos" (uma peça iluminada por vez, numa vitrine),
precedida de uma capa que enquadra a promessa — sem tocar no orçamento de peso nem no de
perf.

**Primeiro passo:** montar a entrada como um `<section>` de viewport inteira acima da
`section.grade` existente no `index.astro`; estender `slots.ts` (story E3-01) para
preencher também os `[data-slot]` da capa; fazer o "herói" ser o produto `destaque` e o
resto virar a tira de miniaturas reaproveitando a marcação de `CardProduto.astro`.

### Direção B — mais ambiciosa, ainda dentro do orçamento
**Entrada E6 (Loop de vídeo do criativo)** — ou **E1 (Portal do Nicho)** se o orçamento de
vídeo apertar — **+ Vitrine C1 (Reels/Stories full-screen)**, com transição **T-B**
(scroll-snap entre painéis de viewport inteira).

**Por quê:** é a aposta "nativa do TikTok" — vertical, tela cheia, swipe, um produto por
vez, continuidade de movimento vindo do anúncio. É a versão com maior chance de segurar o
polegar no 1º segundo. Custo de produção maior (um loop curado por criativo, lazy-load
rígido do 2º slide em diante) e exige teste em device.

**Primeiro passo:** prototipar a vitrine como CSS `scroll-snap-type: y mandatory` puro,
com painéis de produto full-height + `IntersectionObserver` reaproveitando
`video-vertical.ts`; só adicionar Embla se o feel do snap não bastar; medir o LCP num
Android médio real dentro do webview do TikTok antes de commitar.

### Regra transversal
Nenhuma entrada deve ser um interstício puro (botão + nada). Todo conceito de entrada tem
de carregar conteúdo — um produto, um preço, uma promessa — para merecer o toque. Isso
descarta E7 e E8 como tela de entrada dedicada (E8 sobrevive como toggle pequeno sempre
visível).

### Fora do escopo atual (marcado)
- **Qualquer versão three.js / WebGL / `.glb`** de C3 ou C6 (R-05). As versões CSS-only
  ficam, com ressalva de perf.
- **Contador "ao vivo" / número dinâmico** em E5 — impossível sem backend; só claim
  estático curado e verdadeiro.
- **Transição por rota real (T-C)** quando o objetivo é atribuição — perde `?c=` / `?o=`
  com JS off (R-08). Aceitável só se o driver for SEO por nicho, e via `#hash` +
  `pushState`.
- **Contador regressivo sem data de fim real** — dark pattern, risco de confiança com
  público cético a anúncio.
