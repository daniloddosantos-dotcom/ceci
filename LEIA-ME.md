# Cecí — guia do papai (Fases 1 e 2)

Um cantinho calmo para desenhar. Sem anúncios, sem compras, sem pontos,
sem estrelinhas, sem notificações. Funciona sem internet.

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
- **Brincar** — abre as 5 brincadeiras (veja o item 3b). **Música** ainda diz "Em breve!".
- Na barra da esquerda: 6 cores, 2 espessuras, borracha, limpar, guardar, galeria.
- A folha é bege bem clarinho (`#FFFDF7`), cor lisa — é a mesma cor no PNG guardado.
- A **borracha** apaga de verdade (tira a tinta), com traço bem largo. Não pinta de branco por cima.
- **Limpar** só funciona se **segurar 1 segundo**: um **anel rosa** vai se preenchendo
  em volta do botão. Se o dedo escorregar para fora, cancela na hora.
- **Guardar** (coração) salva o desenho na Galeria da Cecí, dentro do próprio tablet.
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
| **Pare e siga** | esperar a vez | 1 minuto, verde/vermelho devagar | igual | igual |
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
