/* ============================================================
   Cecí - TODAS as frases faladas pelo app, num lugar só.
   Cada frase tem um arquivo de áudio em /audio/ gerado uma vez
   no computador (gerar-vozes.js). O app toca o MP3; se uma frase
   não tiver áudio, cai na voz do sistema e avisa no console.

   Este arquivo é usado em três lugares:
   - no app (window.CeciFrases)
   - no service worker (self.CeciFrases), para guardar os áudios offline
   - no gerador de vozes, no Node (module.exports)
   ============================================================ */
(function (raiz) {
  'use strict';

  var ANIMAIS = [
    ['o', 'gato'], ['o', 'coelho'], ['o', 'peixe'], ['a', 'tartaruga'], ['o', 'elefante'],
    ['a', 'vaca'], ['o', 'cavalo'], ['o', 'rato'], ['o', 'passarinho'], ['o', 'pato'],
    ['a', 'baleia'], ['o', 'sapo'], ['a', 'borboleta'], ['a', 'abelha']
  ];
  var FORMAS = [
    ['o', 'círculo'], ['o', 'quadrado'], ['o', 'triângulo'], ['o', 'retângulo'], ['o', 'oval'],
    ['a', 'estrela'], ['o', 'coração'], ['a', 'lua'], ['a', 'flor'], ['o', 'losango']
  ];
  var CORES = ['vermelho', 'azul', 'amarelo', 'verde', 'rosa', 'roxo'];
  var FRUTAS = ['maçã', 'banana', 'laranja', 'uva', 'morango', 'pera'];
  var VEICULOS = ['carro', 'ônibus', 'barco', 'avião', 'trem', 'bicicleta'];
  var NUMEROS = ['um', 'dois', 'três', 'quatro', 'cinco'];

  var lista = [];
  function add(t) { if (lista.indexOf(t) < 0) lista.push(t); }

  // ---- nomes soltos (tocar numa peça, carta ou bicho) ----
  ANIMAIS.forEach(function (a) { add(a[1]); add(a[0] + ' ' + a[1]); });
  FORMAS.forEach(function (f) { add(f[1]); });
  CORES.forEach(add);
  FRUTAS.forEach(add);
  VEICULOS.forEach(add);
  NUMEROS.forEach(add);
  ['cabeça', 'corpo', 'pata', 'rabo', 'telhado', 'porta', 'janela', 'chaminé',
   'pequeno', 'médio', 'grande', 'tronco', 'gira', 'verde', 'vermelho', 'estátua!'].forEach(add);

  // ---- tela inicial, sessão e ritual de dormir ----
  ['Oi, Cecí! Vamos brincar?',
   'Ainda estamos preparando. Em breve!',
   'Cecí, o sol está quase se deitando',
   'O gatinho está com sono.',
   'Ele vai dormir.',
   'Tchau, Cecí, amanhã ele acorda!'].forEach(add);

  // ---- dicas do gatinho companheiro ----
  ['Toca no lápis para desenhar!',
   'Escolhe uma cor e risca a folha!',
   'Toca numa brincadeira!',
   'Toca na música!',
   'Vai em frente, é só tocar!',
   'Toca e escuta!',
   'Leva a peça até a sombra dela!',
   'Vira duas cartas iguais!',
   'Toca nos bichinhos e conta!',
   'Leva o bicho para a casa dele!',
   'Toca nas teclas coloridas!',
   'Agora é a sua vez de tocar!',
   'Dança com o gatinho!',
   'Toca no bicho para ouvir!'].forEach(add);

  // ---- desenhar: seguir a linha ----
  ['Começa na bolinha verde e segue a linha.',
   'Você fez uma linha reta!',
   'Você fez uma curva!',
   'Você fez um zigue-zague!',
   'Você fez um círculo!',
   'Você fez a letra C!',
   // modos do ateliê
   'Risca de um lado e olha o outro!',
   'O desenho está pela metade. Termina ele!',
   'Toca dentro da figura para pintar!',
   'Que rosto lindo!', 'Que gato lindo!', 'Que casa linda!', 'Que flor linda!', 'Que carro lindo!',
   // misturar cores
   'Arrasta um pote em cima do outro e olha a cor nova!',
   'Arrasta um pote em cima do outro!',
   'Azul com amarelo dá verde!', 'Vermelho com amarelo dá laranja!', 'Vermelho com azul dá roxo!',
   'laranja'].forEach(add);

  // ---- encaixar ----
  ['Leva cada forma para a sombra dela, lá em cima.',
   'Cada cor vai para a sombra da mesma cor.',
   'Cada cor na sua sombra!',
   'Monte o gatinho. A cabeça vai em cima e as patas embaixo.',
   'Monte a casinha. O telhado vai em cima.',
   'Gira a peça! Toque duas vezes nela.',
   'A cabeça ficou em cima!',
   'O corpo ficou no meio!',
   'As patas ficaram embaixo!',
   'O rabo ficou do lado!',
   'O telhado fica em cima!',
   'A porta fica embaixo!',
   'A janela fica do lado!',
   'Muito bem, Cecí!',
   'O gatinho ficou pronto!',
   'A casinha acendeu!',
   'Vamos procurar uma coisa redonda na casa?'].forEach(add);
  FORMAS.forEach(function (f) {
    var art = f[0] === 'a' ? 'A' : 'O';
    add(art + ' ' + f[1] + ' foi em cima!');
  });

  // ---- achar o par ----
  ['Olha as figuras!',
   'Agora ache as duas iguais.',
   'Qual vem depois?',
   'Você achou!',
   'Vamos achar duas meias iguais no armário?'].forEach(add);

  // ---- contar e ordenar ----
  ['Coloque as bolas do menorzinho para o maior.',
   'Coloque os ursos do menorzinho para o maior.',
   'Coloque os copos do menorzinho para o maior.',
   'Do pequeno ao grande!',
   'Toca em cada patinho e conta comigo.',
   'Toca em cada bola e conta comigo.',
   'Toca em cada urso e conta comigo.',
   'dois patinhos!', 'três patinhos!', 'quatro patinhos!', 'cinco patinhos!',
   'duas bolas!', 'três bolas!', 'quatro bolas!', 'cinco bolas!',
   'dois ursos!', 'três ursos!', 'quatro ursos!', 'cinco ursos!',
   'Dê duas maçãs para o gatinho.',
   'Dê três maçãs para o gatinho.',
   'O gatinho ganhou duas maçãs!',
   'O gatinho ganhou três maçãs!',
   'Você contou direitinho!',
   'Vamos contar as colheres da mesa?'].forEach(add);

  // ---- pare e siga ----
  ['Quando ficar verde, pode tocar. Quando ficar vermelho, espera.',
   'Você esperou o vermelho!',
   'Que legal brincar de pare e siga!',
   'Vamos dançar e parar quando o papai disser PARE?'].forEach(add);

  // ---- separar ----
  ['Cada bicho no seu lugar: água ou terra.',
   'Quem voa vai para o céu. Quem não voa fica no chão.',
   'Separe: bicho grande e bicho pequeno. Olhe a casinha.',
   'Toque no bicho para ouvir o nome.',
   'Os da água na água, os da terra na terra!',
   'Os que voam no céu, os outros no chão!',
   'Todos os grandes juntos e todos os pequenos juntos!',
   'Tudo separadinho!',
   'Vamos achar um bichinho no livro e ver onde ele mora?'].forEach(add);

  // ---- música ----
  ['Toque para fazer música.',
   'Ouça o gatinho e depois é a sua vez.',
   'Que música bonita!',
   'Vamos cantar uma música junto com o papai?',
   'Vamos dançar! Quando a música parar, vira estátua.',
   'Que dança bonita!',
   'Vamos dançar de novo com o papai, sem o tablet?',
   'Toque num bicho para ouvir o som dele.',
   // dançar (três modos)
   'Vamos dançar!', 'Vamos dançar! Escolhe como.',
   'Estátua', 'Rápido e devagar', 'Gestos',
   'Devagar...', 'Rápido!',
   'Bate palma!', 'Pula!', 'Gira!', 'Abaixa!', 'Braços para cima!',
   // cantar
   'Vamos cantar!', 'Canta de novo com o papai?', 'Canta junto com o papai!',
   'Ciranda, cirandinha', 'A canoa virou', 'Peixe vivo', 'Marcha, soldado',
   'Escravos de Jó', 'O cravo e a rosa', 'Se essa rua fosse minha', 'Não atire o pau no gato',
   // bichos musicais
   'Escuta a música. Qual bicho combina?', 'Escuta e toca no bicho!',
   'É o cisne!', 'É o elefante!', 'São os peixes!', 'É a galinha!',
   'Vamos imitar os bichos com o papai?'].forEach(add);

  // nome de arquivo estável e sem acentos: "o-gato-1x2y3.mp3"
  function arquivo(texto) {
    var h = 5381, i;
    for (i = 0; i < texto.length; i++) h = ((h * 33) ^ texto.charCodeAt(i)) >>> 0;
    var base = texto.normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
    return (base || 'frase') + '-' + h.toString(36) + '.mp3';
  }

  var api = { lista: lista, arquivo: arquivo, VOZ_PADRAO: 'pt-BR-ThalitaMultilingualNeural' };
  raiz.CeciFrases = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : this);
