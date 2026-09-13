# Cecí — guia do papai (Fases 1, 2 e 3)

Um cantinho calmo para desenhar, brincar e fazer música. Sem anúncios, sem compras,
sem pontos, sem estrelinhas, sem notificações. Funciona sem internet.

---

## 1. Como testar no computador

**Jeito fácil (recomendado):** dê dois cliques em **`abrir-ceci.bat`**.
Abre uma janela preta (é o servidor) e o navegador em `http://localhost:8080`.
Para desligar, feche a janela preta.

**Jeito rápido (limitado):** dê dois cliques em `index.html`.
Tudo funciona, **menos** o modo offline (o service worker só funciona em `http://`).

Dica: no navegador, aperte **F12 → ícone de celular/tablet** para simular a tela
do tablet deitado (landscape) e ver como a Cecí vai ver.

---

## 2. Os arquivos e para que serve cada um

| Arquivo | Para que serve |
|---|---|
| `index.html` | O "esqueleto": todas as telas (início, desenho, configurações, tchau, PIN). |
| `style.css` | A aparência: cores suaves, botões grandes, animações lentas. |
| `app.js` | O cérebro: desenho, sons, voz, timer do sol, galeria, travas, configurações. |
| `brincar.js` | As 5 brincadeiras da Fase 2 (encaixar, par, ordem, pare e siga, separar). |
| `musicas.js` | O repertório: todas as melodias em notação simples, com ícones, letras e gestos. |
| `musica.js` | As 5 atividades de música (tocar, dançar, cantar, bichos musicais, sons dos bichos) e o tocador. |
| `frases.js` | Todas as frases faladas; cada uma tem um MP3 em `audio/`. |
| `audio/musicas/` | Gravações opcionais das músicas (MP3 de domínio público que você baixar). |
| `animais.html` | Folha de conferência dos bichinhos. Só para você olhar; não faz parte do app. |
| `manifest.json` | A "identidade" do app: nome Cecí, ícone, tela cheia, deitado. |
| `sw.js` | O *service worker*: guarda uma cópia dos arquivos para funcionar **offline**. |
| `icone.svg` | O ícone do app (sol + lápis), desenhado à mão em SVG. |
| `icone-mascara.svg` | Mesmo ícone, na versão que o Android recorta em círculo. |
| `servidor.js` | Servidorzinho local para testar no PC (usa o Node.js que você já tem). |
| `abrir-ceci.bat` | Atalho de dois cliques que liga o servidor e abre o navegador. |
| `publicar.bat` | Dois cliques para publicar as mudanças no site (sobe a versão do cache sozinho). |
| `publicar.js` | O miolo do `publicar.bat`. |
| `LEIA-ME.md` | Este guia. |

---

## 3. Como usar (para a Cecí)

- **Desenhar** — abre o ateliê e começa a sessão (o sol começa a descer).
- **Brincar** — abre as 5 brincadeiras (item 3b).
- **Música** — abre as 3 atividades de som (item 3c).
- Na barra da esquerda: 6 cores, 2 espessuras, borracha, limpar, guardar, galeria.
- A folha é bege bem clarinho (`#FFFDF7`), cor lisa — é a mesma cor no PNG guardado.
- A **borracha** apaga de verdade (tira a tinta), com traço bem largo. Não pinta de branco por cima.
- **Limpar** só funciona se **segurar 1 segundo**: um **anel rosa** vai se preenchendo
  em volta do botão. Se o dedo escorregar para fora, cancela na hora.
- O **carimbo** (do lado da borracha) abre 4 figuras grandes: círculo, estrela, coração e o gatinho.
  Ela escolhe uma e vai batendo na folha — cada toque coloca a figura na cor escolhida.
  Para voltar a desenhar, é só tocar num dos pincéis.
- **Guardar** (coração) salva o desenho na Galeria da Cecí, dentro do próprio tablet.
- A **galeria** virou um botão flutuante logo abaixo da casinha (a barra ficou cheia).
- Na galeria, tocar na miniatura **reabre** o desenho. O "×" também só apaga
  com o mesmo gesto de segurar 1 segundo (com anel).

## 3b. Brincar (Fase 2) — o núcleo cognitivo

O botão do meio da tela inicial agora é **Brincar** e abre 5 atividades.
Todas seguem a mesma regra: **acerto** = som suave + o gatinho balança a cabeça.
**Erro** = nada acontece, a peça volta devagar para o lugar. Sem pontos, sem estrelinhas.

| Brincadeira | O que treina | Nível 1 | Nível 2 | Nível 3 |
|---|---|---|---|---|
| **Encaixar** | formas e senso espacial | 3 formas na silhueta igual | quebra-cabeça do gatinho (4 peças) | pinheiro de tangram (gira com toque duplo) |
| **Achar o par** | memória e padrões | 2 pares | 3 pares | 4 pares |
| **Em ordem** | lógica e tempo | rotina do dia | + do menor ao maior | + um, dois, três |
| **Pare e siga** | esperar a vez | 1 minuto, verde/vermelho, no mínimo 4 s em cada cor | igual | igual |
| **Separar** | classificar | água/terra e depois grande/pequeno | igual | igual |

Detalhes:
- No **Achar o par**, as cartas ficam viradas para cima 3 segundos antes de virar.
  Depois de achar todos os pares vem a rodada **"qual vem depois?"** (sequência de formas).
- No **Encaixar**, a voz usa palavras de lugar: *em cima, no meio, embaixo, gira*.
- No **Separar** e em qualquer lugar, tocar num bichinho faz ele dizer o nome e o som.
- Os bichos são desenhados de perfil, todos olhando para o mesmo lado, com a marca
  registrada de cada um exagerada (tromba, crina, bico, orelhas, chifres, cauda).
- Errar nunca faz barulho, nunca trava e nunca conta nada.
- **Tocar em qualquer peça, forma, carta ou bichinho faz o app dizer o nome.**
- No **Pare e siga** o sinal usa **sons**, não voz: um *ding* agudo no verde e um *tum*
  grave no vermelho, tocados no mesmo instante em que a cor muda (medido: menos de 1 milésimo
  de segundo de diferença). A voz só explica a regra **antes** de começar; durante o jogo
  nada é falado. Meio segundo antes de trocar, a bolinha **respira** (cresce um pouquinho),
  para ela antecipar a mudança.

### A tela do fim
O gatinho aparece grande no meio, com um balão de fala em letras grandes
convidando ela para uma coisa fora da tela ("Vamos procurar uma coisa redonda na casa?").
Esse convite é lido em voz alta. A **dica para você** fica na tirinha cinza
do rodapé, pequena, e **não é lida em voz alta**.

### A voz
O app procura sozinho a melhor voz em português do aparelho, nesta ordem:
vozes com "Google" ou "Samsung" no nome, depois "Natural"/"Neural", depois qualquer pt-BR.
Fala um pouco devagar e com o tom levemente mais alto.
As frases entram numa **fila**: uma espera a outra terminar, nunca corta no meio.
Só duas coisas cortam a fala: tocar num bicho/peça novo e sair da tela.
Nas configurações você pode escolher a voz na mão e apertar **Ouvir exemplo**.

## 3c. Música

O terceiro botão da tela inicial abre 5 atividades. O repertório inteiro está em
`musicas.js`, em notação simples (`C5:1` = dó, 1 batida). O app sintetiza cada
música em 4 camadas (melodia, acordes macios, baixo e percussão levinha) — ou toca
uma **gravação**, se você colocar o MP3 na pasta `audio/musicas/` (veja abaixo).

| Atividade | O que acontece |
|---|---|
| **Tocar** | Piano de 8 teclas (dó a dó), xilofone de 5 teclas, tambor, chocalho, triângulo e 3 sinos. O botão **tocar junto** (canto inferior esquerdo) põe uma cantiga bem baixinha de fundo para ela tocar por cima; toca de novo para desligar. |
| **Dançar** | Primeiro ela escolhe *como* (3 cartões), depois a música (cartões grandes com ícone; tocar num cartão toca 2 s de prévia e a dança começa). **Estátua**: a música para a cada 8–12 s, "estátua!", o gatinho congela 3 s. **Rápido e devagar**: a mesma música alterna andamento lento (0,7×) e rápido (1,35×) a cada 10–15 s; a voz avisa "devagar..." / "rápido!" e o gatinho dança no ritmo. **Gestos**: a cada 8 s o gatinho mostra um gesto grande (bate palma, pula, gira, abaixa, braços para cima) e a voz nomeia. Músicas curtas repetem para a dança durar uns 50 s. |
| **Cantar** | 8 cantigas. A melodia toca e a letra aparece em versos grandes, uma linha destacada por vez — a voz do app **não canta**: é para você cantar com ela. O gatinho faz o gesto da cantiga (rema na Canoa, marcha no Soldado, roda na Ciranda, passa a pedrinha nos Escravos de Jó...). No fim: "canta de novo com o papai?". |
| **Bichos musicais** | Carnaval dos Animais: toca um trecho e mostra 2 bichos grandes; ela toca no que combina (cisne, elefante, peixes, galinha). No bicho errado não há som de erro: o gatinho balança a cabeça e o trecho toca de novo. Ao acertar, o bicho dança com a música. 4 rodadas. |
| **Sons dos bichos** | Toca no bicho, ele faz o som e diz o nome. |

### Repertório (todas em domínio público, além das 3 originais)

| chave | música | arquivo de gravação esperado |
|---|---|---|
| ceci, pulinho, calminha | originais do app | audio/musicas/ceci.mp3, pulinho.mp3, calminha.mp3 |
| ciranda | Ciranda, cirandinha | audio/musicas/ciranda.mp3 |
| canoa | A canoa virou | audio/musicas/canoa.mp3 |
| peixe-vivo | Peixe vivo | audio/musicas/peixe-vivo.mp3 |
| marcha-soldado | Marcha, soldado | audio/musicas/marcha-soldado.mp3 |
| escravos-de-jo | Escravos de Jó | audio/musicas/escravos-de-jo.mp3 |
| cravo-e-rosa | O cravo e a rosa | audio/musicas/cravo-e-rosa.mp3 |
| se-essa-rua | Se essa rua fosse minha | audio/musicas/se-essa-rua.mp3 |
| nao-atire | Não atire o pau no gato (versão gentil) | audio/musicas/nao-atire.mp3 |
| brahms-ninar | Canção de ninar (Brahms) | audio/musicas/brahms-ninar.mp3 |
| quebra-nozes-marcha | Marcha do Quebra-Nozes (Tchaikovsky) | audio/musicas/quebra-nozes-marcha.mp3 |
| vivaldi-primavera | Primavera (Vivaldi) | audio/musicas/vivaldi-primavera.mp3 |
| mozart-estrelinha | Estrelinha (variações de Mozart) | audio/musicas/mozart-estrelinha.mp3 |
| cisne | O cisne (Saint-Saëns) | audio/musicas/cisne.mp3 |
| elefante | O elefante (Saint-Saëns) | audio/musicas/elefante.mp3 |
| aquario | Aquário (Saint-Saëns) | audio/musicas/aquario.mp3 |
| galinhas | Galinhas e galos (Saint-Saëns) | audio/musicas/galinhas.mp3 |

**Gravações**: basta salvar o MP3 com o nome exato acima em `audio/musicas/` e publicar.
O app confere, ao abrir o menu Música, quais gravações existem (aparece no console
`Cecí: gravação encontrada para "..."`) e usa a gravação no lugar da síntese — em todos
os modos, inclusive rápido/devagar (muda a velocidade do áudio) e estátua (pausa/continua).
O service worker guarda as gravações para funcionar offline. Se a gravação começar com
silêncio ou tiver outro andamento, ajuste na música em `musicas.js` os campos opcionais
`inicioGravacao` (segundos) e `bpmGravacao` — eles só afetam a marcação dos versos no Cantar.

As cantigas foram transcritas de notações para flauta doce; as peças clássicas mais longas
(Quebra-Nozes, Cisne, Aquário) são **aproximações curtas** da abertura de cada uma — se
quiser o original de verdade, use uma gravação.

## 4. Para o papai

- Botão de **engrenagem** no canto de baixo, à direita da tela inicial:
  **segure 1 segundo** e digite o PIN.
- **PIN inicial: `1234`** (dá para trocar lá dentro; o PIN atual fica escrito na tela,
  para você nunca ficar trancado do lado de fora).
- Lá você escolhe:
  - a **duração da sessão** (5, 10, 15 ou 20 minutos);
  - o **nível das brincadeiras** (1, 2 ou 3 — começa sempre no 1);
  - o **PIN**;
  - e vê o **registro**: quantas vezes ela brincou de cada coisa e em que nível.
- Também está lá o **Cartão do papai** com 4 sugestões de conversa para o desenho.

## 5. O ritual do fim

**Como a sessão conta o tempo:** ela começa no **primeiro toque** depois de abrir o app
(não importa em qual tela), usa o **relógio do tablet** (não um contador que pode congelar)
e continua correndo em qualquer tela. O instante de início fica guardado: se você fechar
e reabrir o app **dentro de 30 minutos**, ela continua de onde parou, sem zerar.
No Modo do papai aparece o **tempo restante** e há um botão **Encerrar agora**
(segure 1 segundo), que faz o tchau na hora.

1. O sol pequeno no canto de cima desce devagar durante a sessão.
2. Faltando 2 minutos, uma voz calma diz: *"Cecí, o sol está quase se deitando"*.
3. No fim, a tela escurece em ~6 segundos, aparecem uma lua e três estrelinhas
   (paradas, sem piscar), o gatinho acena e a voz diz *"Tchau, Cecí! Até amanhã!"*.
4. A tela fica trancada. O botão **"Papai"** é pequeno e apagado, no canto de baixo
   à direita, e só abre o PIN se for **segurado 1 segundo** (igual à engrenagem).

---

## 6. O que o app tranca sozinho × o que depende do "Fixar app"

**O app resolve sozinho:**
- Puxar a tela para atualizar (recarregar) — bloqueado.
- Zoom de dois dedos e duplo toque — bloqueados.
- Menu de toque longo e seleção de texto — bloqueados.
- Botão **voltar** do Android — nunca fecha o app; só volta para a tela inicial da Cecí.
- Tela cheia no primeiro toque (esconde a barra do navegador).
- Aviso antes de fechar a aba enquanto a sessão está rolando.
- Não existe nenhum link para fora, nenhum anúncio, nenhuma compra.

**Só o "Fixar app" do Android resolve (continue usando):**
- Botão **início** e botão de **apps recentes** do sistema.
- Barra de notificações puxada de cima e ajustes rápidos.
- Botões físicos de volume/desligar.
- Trocar de aplicativo por gestos do Android.

Ou seja: o app cuida de tudo **dentro** da tela; o Android cuida do que está **fora** dela.

---

## 7. O app publicado

**Endereço:** https://daniloddosantos-dotcom.github.io/ceci/

Está no GitHub Pages, no repositório público `daniloddosantos-dotcom/ceci`.
Ser público não é problema: o app não guarda nada seu. O PIN, as configurações
e os desenhos ficam **só dentro do tablet**, nunca sobem para a internet.

Não foram publicados: `servidor.js`, `abrir-ceci.bat`, `animais.html`,
`publicar.js` e `publicar.bat` — são ferramentas do seu computador.

### Instalar no tablet Samsung
1. Abra o **Chrome** no tablet e vá em `daniloddosantos-dotcom.github.io/ceci/`.
2. Espere carregar e toque uma vez na tela (isso já guarda o app para uso offline).
3. Menu **⋮** (três pontinhos) → **Adicionar à tela inicial** → **Instalar**.
4. Feche o Chrome e abra o **Cecí pelo ícone novo** da tela inicial.
5. Com o app aberto, ligue o **Fixar app** do Android, como você já faz.

Depois disso ele funciona **sem internet**.

## 8. Publicar uma atualização (um comando só)

Dois cliques em **`publicar.bat`**. Ele sozinho:

1. vê se tem alguma mudança para publicar;
2. **sobe a versão do cache** no `sw.js` (ceci-v5 → ceci-v6 → ...);
3. faz o commit e envia para o GitHub.

Em até 2 minutos o site novo está no ar.

No tablet, **abra o Cecí e espere alguns segundos na tela inicial**: ele baixa a
versão nova sozinho e se recarrega uma única vez (só faz isso fora de uma sessão,
para nunca interromper a Cecí no meio de um desenho ou de uma brincadeira).
Se estiver com pressa, feche e abra de novo.

## 9. Tela cheia no tablet

O `manifest.json` pede `"display": "fullscreen"` (com `"standalone"` como reserva),
então, aberto pelo ícone, o Cecí esconde também a barra de navegação do Android.
Além disso o app chama a Fullscreen API no primeiro toque, o que resolve o caso
de abrir pelo navegador e recupera a tela cheia se ela for perdida.

Como em tela cheia as beiradas laterais são a área do **gesto de voltar** do Android,
todos os botões ficam afastados das bordas (uma margem de segurança que também
respeita o recorte da tela do aparelho).

## 10. Reformulação depois da primeira semana de uso

**Gatinho companheiro.** Fica no canto de baixo à direita de todas as telas (por isso a
engrenagem do papai foi para o canto de cima à esquerda). Tocar nele sorteia uma reação
(mia, se espreguiça, pula, se enrola, pisca, abana o rabo); a cada 3 toques ele fala uma
dica do que fazer naquela tela. Ele acena quando ela guarda um desenho, balança a cabeça
quando ela acerta, boceja quando faltam 2 minutos.

**Ritual de dormir.** No fim da sessão o sol se deita, a tela vira noite, o gatinho boceja,
anda até a caminha, se deita e ronca (zzz). Tocar nele dormindo só faz "shhh".
Fica assim até o PIN do papai.

**Progressão automática (Encaixar, Achar o par, Contar).** 3 rodadas completas seguidas
sobem um nível; abandonar 2 vezes seguidas no meio desce um nível. Não depende do
"Nível das brincadeiras" do painel (esse ainda vale para o Eco, que ficou escondido).
O nível automático aparece no Registro do painel.

- **Encaixar**: cenários sorteados (formas, formas 2, cores, quebra-cabeça do gatinho,
  casinha); mais peças no nível 2, rotação no nível 3; a figura ganha vida ao terminar.
- **Achar o par**: temas sorteados (animais, formas, frutas, veículos), verso colorido,
  2 → 3 → 4 → 6 pares; "qual vem depois?" com padrão de forma, cor ou tamanho.
- **Contar** (no lugar de "Em ordem"): ordenar por tamanho, contar tocando, dar N maçãs
  para o gatinho.
- **Pare e siga**: verde + toque = a bola pula; vermelho + toque = a bola encolhe e o
  gatinho tapa os olhos (sem palavra de erro). No fim, "você esperou o vermelho!" quando
  ela esperou pelo menos uma vez.
- **Separar**: cenários (água/terra, voa/não voa, grande/pequeno com a casinha de
  referência), 6 bichos e depois 8, o bicho reage ao cair no lugar certo.
- **Dançar**: 5 músicas (duas originais novas: "calminha" e "pulinho"); tocar no ícone dá
  uma prévia de 2 s e depois a dança começa. **Sons dos bichos** entrou no lugar do Eco.
- **Desenhar**: botão "Seguir a linha" (abaixo da galeria): linha pontilhada grossa
  (reta, curva, zigue-zague, círculo, letra C), bolinha verde de partida com seta,
  tolerância de 1,5 cm; o trecho traçado fica colorido e, ao completar, o gatinho
  balança e a voz diz o que ela fez.

## 11. Voz natural gravada (offline)

As frases fixas do app agora tocam **MP3 gravados com a voz neural do Edge**
(pt-BR-ThalitaMultilingualNeural, -10 % de velocidade, tom levemente alto), gerados
uma única vez no computador e embarcados em `/audio/` (179 arquivos, cerca de 2 MB),
que entram no cache do service worker — funcionam sem internet.

- `frases.js` (publicado) é a lista central de TODAS as frases. Quer mudar ou
  acrescentar uma frase? Edite ali, rode o gerador e publique.
- `gerar-vozes.js` (só no PC) gera os MP3 que faltam: `node gerar-vozes.js`
  (ou `node gerar-vozes.js francisca` para a voz Francisca; `--forcar` regenera tudo).
  Precisa de internet só nessa hora. Na primeira vez rode antes `npm install msedge-tts`.
- `vozes.html` (só no PC) lista as frases com um botão para ouvir cada uma.
- A voz do sistema (speechSynthesis) ficou como **reserva**: se alguma frase não tiver
  áudio, ela é usada e o console mostra `Cecí: frase SEM áudio gravado: "..."`,
  para você gerar depois.
