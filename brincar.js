/* ============================================================
   Cecí - Fase 2: as brincadeiras
   Encaixar, Achar o par, Em ordem, Pare e siga, Separar.

   Este arquivo usa as funções do app.js através de "window.Ceci"
   (falar, nota, irPara, config...). Nada de bibliotecas externas.
   ============================================================ */
(function () {
  'use strict';

  var C = window.Ceci;
  var palco = document.getElementById('palco');
  var gatinho = document.getElementById('gatinho-ajudante');

  var atividadeAtual = null;
  var nivelAtual = 1;
  var relogios = [];          // todos os setTimeout, para poder desligar tudo

  function daqui(ms, fn) { var t = setTimeout(fn, ms); relogios.push(t); return t; }
  function limparRelogios() { relogios.forEach(clearTimeout); relogios = []; }

  function limparAtividade() {
    limparRelogios();
    palco.innerHTML = '';
    gatinho.classList.remove('balancando');
  }
  C.limparAtividade = limparAtividade;   // o app.js chama isto ao sair

  function embaralhar(lista) {
    var a = lista.slice(), i, j, t;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ---------------------------------------------------------
     1) Feedback: som suave + o gatinho balança a cabeça.
        Não existe pontuação, estrelinha nem confete.
        No erro: nada acontece (a peça volta sozinha).
     --------------------------------------------------------- */
  function balancarGatinho(el) {
    var g = el || gatinho;
    g.classList.remove('balancando');
    void g.offsetWidth;              // truque para reiniciar a animação
    g.classList.add('balancando');
    daqui(1800, function () { g.classList.remove('balancando'); });
  }

  function acertou(indiceNota) {
    C.nota(C.NOTAS[indiceNota == null ? 3 : indiceNota], 0.38, 0.055);
    balancarGatinho();
  }

  /* ---------------------------------------------------------
     2) Desenhos (SVG feitos à mão, tudo original)
     --------------------------------------------------------- */
  function forma(tipo, cor, tracejado) {
    var traco = tracejado
      ? ' stroke="#c2b7a1" stroke-width="4" stroke-dasharray="9 8"'
      : ' stroke="#3d3a35" stroke-width="4"';
    var f = ' fill="' + cor + '"';
    var corpo = '';
    if (tipo === 'circulo') corpo = '<circle cx="50" cy="50" r="43"' + f + traco + '/>';
    if (tipo === 'quadrado') corpo = '<rect x="8" y="8" width="84" height="84" rx="12"' + f + traco + '/>';
    if (tipo === 'triangulo') corpo = '<path d="M50 9 L92 89 L8 89 Z" stroke-linejoin="round"' + f + traco + '/>';
    if (tipo === 'retangulo') corpo = '<rect x="8" y="30" width="84" height="40" rx="12"' + f + traco + '/>';
    return '<svg viewBox="0 0 100 100">' + corpo + '</svg>';
  }

  /* Os bichinhos.
     Todos do mesmo jeito: de perfil, olhando para a direita,
     bem grandes dentro do quadro, cores chapadas, contorno grosso,
     e a marca registrada de cada um bem exagerada. */
  var CT = '#3a3630';        // cor do contorno
  var VB = '0 0 120 100';    // quadro de todos os bichos

  var ANIMAIS = {
    gato: {
      nome: 'gato', artigo: 'o', onde: 'terra', tamanho: 'pequeno', tom: 520,
      svg:
        '<g fill="none" stroke="' + CT + '" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">' +
        '<path d="M24 66 q-18 -4 -13 -26" stroke-width="12"/>' +
        '<path d="M24 66 q-18 -4 -13 -26" stroke="#f0a55c" stroke-width="6"/>' +
        '<rect x="33" y="70" width="15" height="24" rx="7" fill="#f0a55c"/>' +
        '<rect x="61" y="70" width="15" height="24" rx="7" fill="#f0a55c"/>' +
        '<ellipse cx="54" cy="60" rx="35" ry="23" fill="#f0a55c"/>' +
        '<path d="M76 32 L73 9 L93 22 Z" fill="#f0a55c"/>' +
        '<path d="M107 32 L113 11 L94 21 Z" fill="#f0a55c"/>' +
        '<circle cx="93" cy="44" r="22" fill="#f0a55c"/>' +
        '<path d="M104 52 q-5 6 -10 2" stroke-width="4"/>' +
        '<path d="M106 46 h11 M105 58 h11" stroke-width="3"/>' +
        '</g>' +
        '<circle cx="102" cy="39" r="4.5" fill="' + CT + '"/>'
    },

    coelho: {
      nome: 'coelho', artigo: 'o', onde: 'terra', tamanho: 'pequeno', tom: 640,
      svg:
        '<g fill="none" stroke="' + CT + '" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">' +
        '<circle cx="20" cy="58" r="11" fill="#ffffff"/>' +
        '<rect x="33" y="68" width="17" height="24" rx="8" fill="#f0e4d4"/>' +
        '<rect x="59" y="68" width="15" height="24" rx="7" fill="#f0e4d4"/>' +
        '<ellipse cx="52" cy="60" rx="33" ry="24" fill="#f0e4d4"/>' +
        '<path d="M83 30 q-7 -28 4 -28 q11 0 5 28 Z" fill="#f0e4d4"/>' +
        '<path d="M98 30 q3 -26 14 -21 q9 5 -4 25 Z" fill="#f0e4d4"/>' +
        '<circle cx="92" cy="48" r="21" fill="#f0e4d4"/>' +
        '<circle cx="110" cy="52" r="5" fill="#e08a9b"/>' +
        '<path d="M110 58 v4" stroke-width="3"/>' +
        '</g>' +
        '<circle cx="101" cy="44" r="4.5" fill="' + CT + '"/>'
    },

    peixe: {
      nome: 'peixe', artigo: 'o', onde: 'agua', tamanho: 'pequeno', tom: 720,
      svg:
        '<g fill="none" stroke="' + CT + '" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">' +
        '<path d="M30 50 L8 28 L8 72 Z" fill="#3f92bd"/>' +
        '<path d="M56 22 q14 -13 27 -1" fill="#3f92bd"/>' +
        '<ellipse cx="64" cy="50" rx="40" ry="30" fill="#58aed8"/>' +
        '<path d="M62 62 q12 8 -1 16" fill="#3f92bd"/>' +
        '<path d="M50 38 q9 12 0 24 M66 34 q10 16 0 32 M82 38 q9 12 0 24" stroke="#3f92bd" stroke-width="4"/>' +
        '<path d="M100 56 q7 3 0 7" stroke-width="4"/>' +
        '</g>' +
        '<circle cx="92" cy="40" r="5" fill="' + CT + '"/>'
    },

    tartaruga: {
      nome: 'tartaruga', artigo: 'a', onde: 'agua', tamanho: 'pequeno', tom: 300,
      svg:
        '<g fill="none" stroke="' + CT + '" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">' +
        '<path d="M14 72 q-8 0 -7 8" stroke-width="4"/>' +
        '<rect x="28" y="66" width="17" height="18" rx="8" fill="#a5d4ae"/>' +
        '<rect x="58" y="66" width="17" height="18" rx="8" fill="#a5d4ae"/>' +
        '<circle cx="99" cy="54" r="17" fill="#a5d4ae"/>' +
        '<path d="M12 70 a40 34 0 0 1 78 0 Z" fill="#6fae7c"/>' +
        '<path d="M30 66 q4 -16 12 -22 M51 42 v28 M72 66 q-4 -16 -12 -22" stroke="#4d8a5b" stroke-width="4"/>' +
        '</g>' +
        '<circle cx="107" cy="49" r="4" fill="' + CT + '"/>'
    },

    elefante: {
      nome: 'elefante', artigo: 'o', onde: 'terra', tamanho: 'grande', tom: 150,
      svg:
        '<g fill="none" stroke="' + CT + '" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">' +
        '<path d="M10 44 q-7 10 2 17" stroke-width="4"/>' +
        '<rect x="24" y="62" width="18" height="32" rx="8" fill="#a9a2b8"/>' +
        '<rect x="52" y="62" width="18" height="32" rx="8" fill="#a9a2b8"/>' +
        '<ellipse cx="46" cy="48" rx="36" ry="27" fill="#a9a2b8"/>' +
        '<circle cx="86" cy="44" r="23" fill="#a9a2b8"/>' +
        '<path d="M103 50 q16 12 13 30 q-2 13 -12 14" stroke-width="21"/>' +
        '<path d="M103 50 q16 12 13 30 q-2 13 -12 14" stroke="#a9a2b8" stroke-width="14"/>' +
        '<ellipse cx="74" cy="40" rx="19" ry="24" fill="#948da8"/>' +
        '</g>' +
        '<circle cx="96" cy="37" r="4.5" fill="' + CT + '"/>'
    },

    vaca: {
      nome: 'vaca', artigo: 'a', onde: 'terra', tamanho: 'grande', tom: 180,
      svg:
        '<g fill="none" stroke="' + CT + '" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">' +
        '<path d="M16 54 q-10 12 -1 22" stroke-width="4"/>' +
        '<rect x="30" y="70" width="16" height="24" rx="7" fill="#fdfaf3"/>' +
        '<rect x="58" y="70" width="16" height="24" rx="7" fill="#fdfaf3"/>' +
        '<ellipse cx="52" cy="56" rx="37" ry="26" fill="#fdfaf3"/>' +
        '</g>' +
        '<ellipse cx="40" cy="48" rx="14" ry="11" fill="#4a463f"/>' +
        '<ellipse cx="66" cy="64" rx="11" ry="9" fill="#4a463f"/>' +
        '<g fill="none" stroke="' + CT + '" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">' +
        '<path d="M83 28 q-8 -12 2 -14" stroke="#e8d9b8" stroke-width="7"/>' +
        '<path d="M104 26 q7 -12 -3 -13" stroke="#e8d9b8" stroke-width="7"/>' +
        '<ellipse cx="79" cy="40" rx="10" ry="7" fill="#fdfaf3"/>' +
        '<ellipse cx="95" cy="46" rx="20" ry="18" fill="#fdfaf3"/>' +
        '<ellipse cx="108" cy="56" rx="11" ry="10" fill="#f0b8bd"/>' +
        '</g>' +
        '<circle cx="99" cy="39" r="4" fill="' + CT + '"/>' +
        '<circle cx="105" cy="55" r="2.5" fill="#c98f96"/>' +
        '<circle cx="112" cy="58" r="2.5" fill="#c98f96"/>'
    },

    cavalo: {
      nome: 'cavalo', artigo: 'o', onde: 'terra', tamanho: 'grande', tom: 230,
      svg:
        '<g fill="none" stroke="' + CT + '" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">' +
        '<path d="M12 48 q-9 16 1 26" stroke="#7a4a24" stroke-width="7"/>' +
        '<rect x="24" y="64" width="14" height="30" rx="6" fill="#c07d47"/>' +
        '<rect x="52" y="64" width="14" height="30" rx="6" fill="#c07d47"/>' +
        '<ellipse cx="44" cy="54" rx="32" ry="21" fill="#c07d47"/>' +
        '<path d="M74 12 q-12 12 -14 30" stroke="#7a4a24" stroke-width="10"/>' +
        '<path d="M62 48 L82 18 L96 24 L80 58 Z" fill="#c07d47"/>' +
        '<path d="M88 14 L90 4 L97 12 Z" fill="#c07d47"/>' +
        '<ellipse cx="100" cy="27" rx="18" ry="11" fill="#c07d47" transform="rotate(14 100 27)"/>' +
        '</g>' +
        '<circle cx="95" cy="23" r="4" fill="' + CT + '"/>' +
        '<circle cx="113" cy="31" r="2.6" fill="' + CT + '"/>'
    },

    rato: {
      nome: 'rato', artigo: 'o', onde: 'terra', tamanho: 'pequeno', tom: 900,
      svg:
        '<g fill="none" stroke="' + CT + '" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">' +
        '<path d="M24 70 q-20 8 -16 -16" stroke-width="4"/>' +
        '<rect x="38" y="76" width="13" height="16" rx="6" fill="#c8c2b8"/>' +
        '<rect x="60" y="76" width="13" height="16" rx="6" fill="#c8c2b8"/>' +
        '<circle cx="58" cy="32" r="19" fill="#ded8ce"/>' +
        '<ellipse cx="54" cy="62" rx="33" ry="24" fill="#c8c2b8"/>' +
        '<path d="M76 48 q26 4 33 16 q-9 12 -33 14 Z" fill="#c8c2b8"/>' +
        '<path d="M104 56 h13 M104 72 h12" stroke-width="3"/>' +
        '</g>' +
        '<circle cx="110" cy="64" r="5" fill="#e08a9b"/>' +
        '<circle cx="86" cy="56" r="4" fill="' + CT + '"/>'
    },

    passarinho: {
      nome: 'passarinho', artigo: 'o', onde: 'terra', tamanho: 'pequeno', tom: 1000,
      svg:
        '<g fill="none" stroke="' + CT + '" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">' +
        '<path d="M22 58 L5 44 L7 76 Z" fill="#4a8ac4"/>' +
        '<path d="M46 84 v10 M62 84 v10" stroke="#e09a2c" stroke-width="5"/>' +
        '<ellipse cx="50" cy="60" rx="31" ry="25" fill="#6aa9e0"/>' +
        '<circle cx="80" cy="38" r="21" fill="#6aa9e0"/>' +
        '<path d="M99 32 L119 41 L99 50 Z" fill="#f2b705"/>' +
        '<path d="M38 60 q15 -11 30 2 q-13 17 -30 -2 Z" fill="#4a8ac4"/>' +
        '</g>' +
        '<circle cx="87" cy="33" r="4.5" fill="' + CT + '"/>'
    }
  };

  function svgAnimal(chave) {
    var a = ANIMAIS[chave];
    return '<svg viewBox="' + VB + '">' + a.svg + '</svg>';
  }

  // deixa os desenhos à mão para a página de teste animais.html
  C.ANIMAIS = ANIMAIS;
  C.svgAnimal = svgAnimal;
  if (!palco) return;      // sem palco = é a folha de teste, não o app

  // cabeça de gatinho de frente, só para o quebra-cabeça do nível 2
  var CABECA_GATO =
    '<svg viewBox="0 0 100 100">' +
    '<g fill="none" stroke="' + CT + '" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">' +
    '<path d="M25 44 L21 16 L47 31 Z" fill="#f0a55c"/>' +
    '<path d="M75 44 L79 16 L53 31 Z" fill="#f0a55c"/>' +
    '<circle cx="50" cy="58" r="31" fill="#f0a55c"/>' +
    '<path d="M50 66 q-7 7 -13 2 M50 66 q7 7 13 2" stroke-width="4"/>' +
    '</g>' +
    '<circle cx="39" cy="53" r="4.5" fill="' + CT + '"/>' +
    '<circle cx="61" cy="53" r="4.5" fill="' + CT + '"/>' +
    '</svg>';

  // som simples do bicho: duas notinhas macias no tom dele.
  // Tocar num bicho novo é uma das únicas coisas que corta a fala anterior.
  function somDoAnimal(chave) {
    var a = ANIMAIS[chave];
    C.falarJa(a.artigo + ' ' + a.nome);
    daqui(900, function () { C.nota(a.tom, 0.28, 0.05); });
    daqui(1150, function () { C.nota(a.tom * 1.25, 0.34, 0.045); });
  }

  // fala o nome de uma peça quando ela toca (sem arrastar)
  function dizerNome(texto) { C.falarJa(texto); }

  // desenhos das rotinas
  var DESENHOS = {
    acordar: '<svg viewBox="0 0 100 100">' +
      '<circle cx="50" cy="56" r="20" fill="#ffcf5c" stroke="#3d3a35" stroke-width="4"/>' +
      '<g stroke="#f2b705" stroke-width="5" stroke-linecap="round">' +
      '<path d="M50 20 V30"/><path d="M22 34 L29 41"/><path d="M78 34 L71 41"/><path d="M12 60 H22"/><path d="M88 60 H78"/></g>' +
      '<path d="M12 84 H88" stroke="#3d3a35" stroke-width="4" stroke-linecap="round"/></svg>',
    escovar: '<svg viewBox="0 0 100 100">' +
      '<rect x="26" y="56" width="48" height="12" rx="6" transform="rotate(-35 50 62)" fill="#9ec5e8" stroke="#3d3a35" stroke-width="4"/>' +
      '<rect x="56" y="24" width="20" height="16" rx="5" transform="rotate(-35 66 32)" fill="#ffffff" stroke="#3d3a35" stroke-width="4"/>' +
      '<path d="M20 82 q10 -8 20 0 q10 8 20 0 q10 -8 20 0" fill="none" stroke="#9ec5e8" stroke-width="5" stroke-linecap="round"/></svg>',
    dormir: '<svg viewBox="0 0 100 100">' +
      '<path d="M64 22 a30 30 0 1 0 18 52 a34 34 0 0 1 -18 -52 Z" fill="#c9c3e8" stroke="#3d3a35" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M20 34 h14 l-14 16 h14" fill="none" stroke="#8a8175" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M22 62 h10 l-10 12 h10" fill="none" stroke="#8a8175" stroke-width="3.5" stroke-linecap="round"/></svg>'
  };

  function svgBolinhas(quantas) {
    var pos = [[50, 50], [34, 50], [66, 50], [50, 30]];
    var s = '<svg viewBox="0 0 100 100">';
    var lista = quantas === 1 ? [[50, 50]] : (quantas === 2 ? [[34, 52], [66, 52]] : [[34, 62], [66, 62], [50, 34]]);
    lista.forEach(function (p) {
      s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="15" fill="#e987b8" stroke="#3d3a35" stroke-width="4"/>';
    });
    return s + '</svg>';
  }

  function svgCirculoTamanho(raio, cor) {
    return '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="' + raio + '" fill="' + cor + '" stroke="#3d3a35" stroke-width="4"/></svg>';
  }

  /* ---------------------------------------------------------
     3) Peças que se arrastam (Pointer Events, dedo ou caneta)
     --------------------------------------------------------- */
  function aplicar(el) {
    el.style.transform = 'translate(' + el._dx + 'px,' + el._dy + 'px) rotate(' + el._rot + 'deg)';
  }

  function novaPeca(html, x, y, classe) {
    var el = document.createElement('div');
    el.className = 'peca' + (classe ? ' ' + classe : '');
    el.innerHTML = html;
    el.style.left = x + '%';
    el.style.top = y + '%';
    el._dx = 0; el._dy = 0; el._rot = 0;
    aplicar(el);
    return el;
  }

  function novoAlvo(html, x, y, classe) {
    var el = document.createElement('div');
    el.className = 'alvo' + (classe ? ' ' + classe : '');
    el.innerHTML = html;
    el.style.left = x + '%';
    el.style.top = y + '%';
    return el;
  }

  function arrastavel(el, opcoes) {
    var id = null, x0 = 0, y0 = 0, ix = 0, iy = 0, ultimoToque = 0, relogioDoToque = 0;

    el.addEventListener('pointerdown', function (e) {
      if (C.estaBloqueado() || el.classList.contains('fixa')) return;
      if (id !== null) return;
      id = e.pointerId; x0 = e.clientX; y0 = e.clientY;
      ix = el._dx; iy = el._dy;
      el.style.transition = 'none';
      el.classList.add('pegando');
      try { el.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
    });

    el.addEventListener('pointermove', function (e) {
      if (id !== e.pointerId) return;
      el._dx = ix + (e.clientX - x0);
      el._dy = iy + (e.clientY - y0);
      aplicar(el);
    });

    function terminou(e) {
      if (id !== e.pointerId) return;
      id = null;
      el.classList.remove('pegando');
      var mexeu = Math.abs(e.clientX - x0) + Math.abs(e.clientY - y0);
      if (mexeu < 12) {                       // foi um toque, não um arrasto
        var agora = Date.now();
        if (agora - ultimoToque < 450 && opcoes.aoToqueDuplo) {
          clearTimeout(relogioDoToque);
          ultimoToque = 0;
          opcoes.aoToqueDuplo(el);
          return;
        }
        ultimoToque = agora;
        if (opcoes.aoToque) {
          // se a peça também gira, espera para ver se vem o segundo toque
          if (opcoes.aoToqueDuplo) {
            relogioDoToque = daqui(470, function () { opcoes.aoToque(el); });
          } else {
            opcoes.aoToque(el);
          }
        }
        return;
      }
      if (opcoes.aoSoltar) opcoes.aoSoltar(el);
    }
    el.addEventListener('pointerup', terminou);
    el.addEventListener('pointercancel', terminou);
  }

  // volta devagar para o lugar de origem (é isto que acontece no erro)
  function voltarPraCasa(el) {
    el.style.transition = 'transform .8s ease';
    el._dx = 0; el._dy = 0;
    aplicar(el);
  }

  function encaixarEm(el, alvo) {
    var rp = el.getBoundingClientRect();
    var ra = alvo.getBoundingClientRect();
    el._dx += (ra.left + ra.width / 2) - (rp.left + rp.width / 2);
    el._dy += (ra.top + ra.height / 2) - (rp.top + rp.height / 2);
    el.style.transition = 'transform .45s ease';
    aplicar(el);
    el.classList.add('fixa');
    alvo.classList.add('cheio');
    alvo.dataset.ocupado = '1';
  }

  // qual alvo está mais perto? (tolerância generosa: soltar perto já encaixa)
  function alvoMaisPerto(el, alvos) {
    var rp = el.getBoundingClientRect();
    var cx = rp.left + rp.width / 2, cy = rp.top + rp.height / 2;
    var melhor = null, menor = Infinity;
    alvos.forEach(function (a) {
      if (a.dataset.ocupado === '1') return;
      var ra = a.getBoundingClientRect();
      var dx = cx - (ra.left + ra.width / 2), dy = cy - (ra.top + ra.height / 2);
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d < menor) { menor = d; melhor = a; }
    });
    if (!melhor) return null;
    var rm = melhor.getBoundingClientRect();
    var tolerancia = Math.max(rm.width, rm.height) * 0.8 + 60;
    return menor <= tolerancia ? melhor : null;
  }

  /* ---------------------------------------------------------
     4) Tabuleiro (a área onde cada brincadeira acontece)
     --------------------------------------------------------- */
  function tabuleiro(texto, tamanhoPeca) {
    palco.innerHTML = '';
    var t = document.createElement('div');
    t.className = 'tabuleiro';
    t.style.setProperty('--p', tamanhoPeca || 'clamp(76px, 15vh, 122px)');
    if (texto) {
      var p = document.createElement('div');
      p.className = 'enunciado';
      p.textContent = texto;
      t.appendChild(p);
    }
    palco.appendChild(t);
    return t;
  }

  /* ---------------------------------------------------------
     5) Fim de brincadeira: cartão do papai + ponte para fora da tela
     --------------------------------------------------------- */
  var fimCaixa = document.getElementById('fim-atividade');
  var gatoFim = document.querySelector('.gato-fim');

  /* O gatinho faz o convite para ela (em letras grandes e em voz alta).
     A dica do papai fica só escrita, pequenininha, no rodapé. */
  function terminar(titulo, convite, dicaDoPapai) {
    daqui(700, function () {
      document.getElementById('fim-convite').textContent = convite;
      document.getElementById('fim-dica').textContent = dicaDoPapai;
      fimCaixa.classList.remove('oculto');
      balancarGatinho(gatoFim);
      C.nota(C.NOTAS[3], 0.5, 0.05);
      daqui(400, function () { C.falarLista([titulo, convite]); });   // a dica NÃO é lida
    });
  }

  document.getElementById('btn-de-novo').addEventListener('click', function () {
    fimCaixa.classList.add('oculto');
    if (atividadeAtual) abrirAtividade(atividadeAtual);
  });
  document.getElementById('btn-fim-voltar').addEventListener('click', function () {
    fimCaixa.classList.add('oculto');
    limparAtividade();
    C.irPara('tela-brincar');
  });

  /* =========================================================
     BRINCADEIRA 1 - ENCAIXAR (formas e senso espacial)
     ========================================================= */
  var CONVITE_ENCAIXAR = 'Vamos procurar uma coisa redonda na casa?';
  var DICA_ENCAIXAR = 'Pergunte a ela: onde está o círculo? Em cima ou embaixo?';

  function nomeDaForma(tipo) {
    return { circulo: 'círculo', quadrado: 'quadrado', triangulo: 'triângulo', retangulo: 'retângulo' }[tipo] || tipo;
  }

  function encaixarNivel1(t) {
    var tipos = ['circulo', 'quadrado', 'triangulo'];
    var cores = { circulo: '#e04a3f', quadrado: '#3a72c4', triangulo: '#f2b705' };
    var alvos = [];

    tipos.forEach(function (tipo, i) {
      var a = novoAlvo(forma(tipo, '#ece4d4', true), 25 + i * 25, 34);
      a.dataset.tipo = tipo;
      a.dataset.onde = 'em cima';
      t.appendChild(a);
      alvos.push(a);
    });

    var ordem = embaralhar(tipos);
    var faltam = tipos.length;

    ordem.forEach(function (tipo, i) {
      var p = novaPeca(forma(tipo, cores[tipo], false), 25 + i * 25, 82);
      p.dataset.tipo = tipo;
      t.appendChild(p);
      arrastavel(p, {
        aoToque: function () { dizerNome(nomeDaForma(tipo)); },
        aoSoltar: function (el) {
          var alvo = alvoMaisPerto(el, alvos);
          if (alvo && alvo.dataset.tipo === el.dataset.tipo) {
            encaixarEm(el, alvo);
            acertou(2);
            C.falar('O ' + nomeDaForma(tipo) + ' foi em cima!');
            faltam--;
            if (faltam === 0) terminar('Muito bem, Cecí!', CONVITE_ENCAIXAR, DICA_ENCAIXAR);
          } else {
            voltarPraCasa(el);       // erro: nada acontece, a peça só volta
          }
        }
      });
    });

    C.falar('Leve cada forma para o buraquinho igual, lá em cima.');
  }

  function encaixarNivel2(t) {
    // quebra-cabeça de um gatinho: cabeça em cima, corpo no meio, patas embaixo
    var pecas = [
      { id: 'cabeca', onde: 'em cima', x: 46, y: 26, nome: 'cabeça', svg: CABECA_GATO },
      { id: 'corpo', onde: 'no meio', x: 46, y: 50, nome: 'corpo',
        svg: '<svg viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="40" ry="30" fill="#f0a55c" stroke="#3a3630" stroke-width="5"/></svg>' },
      { id: 'pata1', onde: 'embaixo', x: 34, y: 70, nome: 'pata',
        svg: '<svg viewBox="0 0 100 100"><rect x="26" y="34" width="48" height="32" rx="15" fill="#e8963f" stroke="#3a3630" stroke-width="5"/></svg>' },
      { id: 'pata2', onde: 'embaixo', x: 58, y: 70, nome: 'pata',
        svg: '<svg viewBox="0 0 100 100"><rect x="26" y="34" width="48" height="32" rx="15" fill="#e8963f" stroke="#3a3630" stroke-width="5"/></svg>' }
    ];

    var alvos = [];
    pecas.forEach(function (d) {
      // a silhueta mostra a sombra da própria peça, para ela saber onde vai
      var a = novoAlvo(d.svg, d.x, d.y, 'sombra');
      a.dataset.id = d.id;
      a.dataset.onde = d.onde;
      t.appendChild(a);
      alvos.push(a);
    });

    var faltam = pecas.length;
    embaralhar(pecas).forEach(function (d, i) {
      var p = novaPeca(d.svg, 14 + i * 24, 88);
      p.dataset.id = d.id;
      t.appendChild(p);
      arrastavel(p, {
        aoToque: function () { dizerNome(d.nome); },
        aoSoltar: function (el) {
          var alvo = alvoMaisPerto(el, alvos);
          if (alvo && alvo.dataset.id === el.dataset.id) {
            encaixarEm(el, alvo);
            acertou(3);
            C.falar('Ficou ' + alvo.dataset.onde + '!');
            faltam--;
            if (faltam === 0) terminar('O gatinho ficou pronto!', CONVITE_ENCAIXAR, DICA_ENCAIXAR);
          } else {
            voltarPraCasa(el);
          }
        }
      });
    });

    C.falar('Monte o gatinho. A cabeça vai em cima e as patas embaixo.');
  }

  function encaixarNivel3(t) {
    // pinheiro de tangram: 3 triângulos (precisam girar) + 1 tronco
    var pecas = [
      { id: 'p1', tipo: 'triangulo', cor: '#7fb98a', x: 50, y: 19, tam: '74px', giraPreciso: true },
      { id: 'p2', tipo: 'triangulo', cor: '#5ea36d', x: 50, y: 36, tam: '92px', giraPreciso: true },
      { id: 'p3', tipo: 'triangulo', cor: '#4a8c59', x: 50, y: 55, tam: '112px', giraPreciso: true },
      { id: 'p4', tipo: 'retangulo', cor: '#b1793f', x: 50, y: 71, tam: '74px', giraPreciso: false }
    ];

    var alvos = [];
    pecas.forEach(function (d) {
      var a = novoAlvo(forma(d.tipo, '#ece4d4', true), d.x, d.y);
      a.style.setProperty('--p', d.tam);
      a.dataset.id = d.id;
      t.appendChild(a);
      alvos.push(a);
    });

    var faltam = pecas.length;
    var giros = [90, 180, 270];

    embaralhar(pecas).forEach(function (d, i) {
      var p = novaPeca(forma(d.tipo, d.cor, false), 12 + i * 25, 89);
      p.style.setProperty('--p', d.tam);
      p.dataset.id = d.id;
      p._rot = d.giraPreciso ? giros[Math.floor(Math.random() * giros.length)] : 0;
      aplicar(p);
      t.appendChild(p);

      arrastavel(p, {
        aoToque: function () { dizerNome(d.tipo === 'retangulo' ? 'tronco' : 'triângulo'); },
        aoToqueDuplo: function (el) {
          el.style.transition = 'transform .45s ease';
          el._rot = (el._rot + 90) % 360;
          aplicar(el);
          C.nota(C.NOTAS[1], 0.22, 0.04);
          C.falar('gira');
        },
        aoSoltar: function (el) {
          var alvo = alvoMaisPerto(el, alvos);
          if (!alvo || alvo.dataset.id !== el.dataset.id) { voltarPraCasa(el); return; }
          if (d.giraPreciso && el._rot % 360 !== 0) {
            C.falar('Gira a peça! Toque duas vezes nela.');
            voltarPraCasa(el);
            return;
          }
          encaixarEm(el, alvo);
          acertou(4);
          faltam--;
          if (faltam === 0) terminar('Que árvore linda!', CONVITE_ENCAIXAR, DICA_ENCAIXAR);
        }
      });
    });

    C.falar('Monte o pinheiro. Toque duas vezes na peça para ela girar.');
  }

  function atividadeEncaixar(nivel) {
    var t = tabuleiro('', 'clamp(88px, 18vh, 132px)');
    if (nivel === 1) encaixarNivel1(t);
    else if (nivel === 2) encaixarNivel2(t);
    else encaixarNivel3(t);
  }

  /* =========================================================
     BRINCADEIRA 2 - ACHAR O PAR (memória) + qual vem depois?
     ========================================================= */
  var CONVITE_PAR = 'Vamos achar duas meias iguais no armário?';
  var DICA_PAR = 'Peça para ela dizer o nome do animal antes de virar a carta.';

  function atividadePar(nivel) {
    var quantosPares = nivel === 1 ? 2 : (nivel === 2 ? 3 : 4);
    var bichos = embaralhar(['gato', 'peixe', 'coelho', 'tartaruga', 'cavalo', 'passarinho']).slice(0, quantosPares);
    var cartas = embaralhar(bichos.concat(bichos));

    var t = tabuleiro('', 'clamp(76px, 15vh, 120px)');
    var grade = document.createElement('div');
    grade.className = 'grade-cartas';
    grade.style.setProperty('--c', 'clamp(112px, 21vh, 170px)');
    grade.style.gridTemplateColumns = 'repeat(' + (cartas.length <= 4 ? cartas.length : (cartas.length === 6 ? 3 : 4)) + ', var(--c))';
    t.appendChild(grade);

    var travado = true;
    var primeira = null;
    var achadas = 0;

    cartas.forEach(function (bicho) {
      var b = document.createElement('button');
      b.className = 'carta virada';
      b.dataset.bicho = bicho;
      b.innerHTML =
        '<div class="lados">' +
          '<div class="verso"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="none" stroke="#cfc6b6" stroke-width="8"/><circle cx="50" cy="50" r="10" fill="#cfc6b6"/></svg></div>' +
          '<div class="frente">' + svgAnimal(bicho) + '</div>' +
        '</div>';
      grade.appendChild(b);

      b.addEventListener('click', function () {
        if (C.estaBloqueado()) return;
        // carta já achada ou já virada: só repete o nome do bichinho
        if (b.classList.contains('achada') || b.classList.contains('virada')) { C.falarJa(ANIMAIS[bicho].nome); return; }
        if (travado) return;

        b.classList.add('virada');
        C.falarJa(ANIMAIS[bicho].nome);

        if (!primeira) { primeira = b; return; }

        if (primeira.dataset.bicho === b.dataset.bicho) {
          var a = primeira; primeira = null;
          daqui(500, function () {
            a.classList.add('achada');
            b.classList.add('achada');
            acertou(2);
            achadas++;
            if (achadas === quantosPares) daqui(900, rodadaDoPadrao);
          });
        } else {
          travado = true;
          var a2 = primeira; primeira = null;
          daqui(1400, function () {                 // erro: sem som, as cartas só voltam
            a2.classList.remove('virada');
            b.classList.remove('virada');
            travado = false;
          });
        }
      });
    });

    // 3 segundos vendo tudo, depois as cartas viram
    C.falar('Olha os bichinhos!');
    daqui(3000, function () {
      Array.prototype.forEach.call(grade.children, function (c) { c.classList.remove('virada'); });
      daqui(800, function () {
        travado = false;
        C.falar('Agora ache os dois iguais.');
      });
    });

    // ---- rodada extra: qual vem depois? ----
    function rodadaDoPadrao() {
      var t2 = tabuleiro('', 'clamp(76px, 14vh, 116px)');
      var pares = [['circulo', '#e04a3f'], ['quadrado', '#3a72c4'], ['triangulo', '#f2b705']];
      var dois = embaralhar(pares).slice(0, 2);
      var A = dois[0], B = dois[1];

      var fila = document.createElement('div');
      fila.className = 'fila-padrao';
      [A, B, A].forEach(function (f) {
        var casa = document.createElement('div');
        casa.className = 'casa-padrao';
        casa.innerHTML = forma(f[0], f[1], false);
        fila.appendChild(casa);
      });
      var vazia = document.createElement('div');
      vazia.className = 'casa-padrao vazia';
      vazia.textContent = '?';
      fila.appendChild(vazia);
      t2.appendChild(fila);

      var opcoes = document.createElement('div');
      opcoes.className = 'fila-opcoes';
      embaralhar([B, A]).forEach(function (f) {
        var o = document.createElement('button');
        o.className = 'opcao-padrao';
        o.innerHTML = forma(f[0], f[1], false);
        o.addEventListener('click', function () {
          if (C.estaBloqueado()) return;
          if (f[0] !== B[0]) return;                 // errou: nada acontece
          vazia.classList.remove('vazia');
          vazia.textContent = '';
          vazia.innerHTML = forma(B[0], B[1], false);
          acertou(4);
          terminar('Você achou!', CONVITE_PAR, DICA_PAR);
        });
        opcoes.appendChild(o);
      });
      t2.appendChild(opcoes);

      C.falar('Qual vem depois?');
    }
  }

  /* =========================================================
     BRINCADEIRA 3 - COLOCAR EM ORDEM (lógica e tempo)
     ========================================================= */
  var CONVITE_ORDEM = 'Me conta o que você faz antes de dormir?';
  var DICA_ORDEM = 'Pergunte: o que a gente faz primeiro? E depois?';

  function atividadeOrdem(nivel) {
    var rodadas = [
      { fala: 'Coloque em ordem: acordar, escovar os dentes e dormir.',
        cartas: [
          { ordem: 1, nome: 'acordar', svg: DESENHOS.acordar },
          { ordem: 2, nome: 'escovar os dentes', svg: DESENHOS.escovar },
          { ordem: 3, nome: 'dormir', svg: DESENHOS.dormir }
        ] },
      { fala: 'Agora do menorzinho para o maior.',
        cartas: [
          { ordem: 1, nome: 'pequeno', svg: svgCirculoTamanho(16, '#e987b8') },
          { ordem: 2, nome: 'médio', svg: svgCirculoTamanho(28, '#e987b8') },
          { ordem: 3, nome: 'grande', svg: svgCirculoTamanho(42, '#e987b8') }
        ] },
      { fala: 'Um, dois, três. Coloque em ordem.',
        cartas: [
          { ordem: 1, nome: 'um', svg: svgBolinhas(1) },
          { ordem: 2, nome: 'dois', svg: svgBolinhas(2) },
          { ordem: 3, nome: 'três', svg: svgBolinhas(3) }
        ] }
    ].slice(0, nivel);

    var indice = 0;

    function rodada() {
      var r = rodadas[indice];
      var t = tabuleiro('', 'clamp(84px, 17vh, 132px)');
      var alvos = [];

      [1, 2, 3].forEach(function (n, i) {
        var a = novoAlvo('<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="18" fill="#ece4d4" stroke="#c2b7a1" stroke-width="4" stroke-dasharray="9 8"/></svg>', 25 + i * 25, 38);
        a.dataset.ordem = String(n);
        t.appendChild(a);
        alvos.push(a);
      });

      var faltam = 3;
      embaralhar(r.cartas).forEach(function (c, i) {
        var p = novaPeca(c.svg, 25 + i * 25, 84, 'carta-ordem');
        p.dataset.ordem = String(c.ordem);
        t.appendChild(p);
        arrastavel(p, {
          aoToque: function () { dizerNome(c.nome); },
          aoSoltar: function (el) {
            var alvo = alvoMaisPerto(el, alvos);
            if (alvo && alvo.dataset.ordem === el.dataset.ordem) {
              encaixarEm(el, alvo);
              acertou(3);
              faltam--;
              if (faltam === 0) {
                indice++;
                if (indice < rodadas.length) daqui(1400, rodada);
                else terminar('Tudo na ordem certa!', CONVITE_ORDEM, DICA_ORDEM);
              }
            } else {
              voltarPraCasa(el);
            }
          }
        });
      });

      C.falar(r.fala);
    }

    rodada();
  }

  /* =========================================================
     BRINCADEIRA 4 - PARE E SIGA (esperar a vez)
     ========================================================= */
  var CONVITE_PARE = 'Vamos dançar e parar quando o papai disser PARE?';
  var DICA_PARE = 'Elogie a espera, não o acerto: você conseguiu esperar!';

  function atividadePare() {
    var t = tabuleiro('', 'clamp(76px, 15vh, 120px)');
    var bolota = document.createElement('div');
    bolota.className = 'bolota';
    t.appendChild(bolota);

    var verde = false;
    var jaFalouVerde = false, jaFalouVermelho = false;
    var fim = Date.now() + 60000;               // um minutinho

    bolota.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      if (C.estaBloqueado()) return;
      if (!verde) return;                       // vermelho: nada acontece
      C.nota(C.NOTAS[Math.floor(Math.random() * C.NOTAS.length)], 0.4, 0.06);
      bolota.classList.add('tocada');
      daqui(500, function () { bolota.classList.remove('tocada'); });
    });

    function trocar() {
      if (Date.now() >= fim) {
        bolota.classList.remove('verde', 'vermelha');
        balancarGatinho();
        terminar('Você esperou muito bem!', CONVITE_PARE, DICA_PARE);
        return;
      }
      verde = !verde;
      bolota.classList.toggle('verde', verde);
      bolota.classList.toggle('vermelha', !verde);
      if (verde && !jaFalouVerde) { jaFalouVerde = true; C.falar('Verde! Pode tocar.'); }
      else if (!verde && !jaFalouVermelho) { jaFalouVermelho = true; C.falar('Vermelho. Agora espera.'); }
      else C.nota(verde ? C.NOTAS[4] : C.NOTAS[0], 0.35, 0.035);
      daqui(3000 + Math.random() * 2000, trocar);
    }

    C.falar('Quando ficar verde, pode tocar. Quando ficar vermelho, espera.');
    daqui(2200, trocar);
  }

  /* =========================================================
     BRINCADEIRA 5 - SEPARAR (classificar animais)
     ========================================================= */
  var CONVITE_CLASSIFICAR = 'Vamos achar um bichinho no livro e ver onde ele mora?';
  var DICA_CLASSIFICAR = 'Pergunte: esse bicho mora na água ou na terra?';

  function atividadeClassificar() {
    var rodadas = [
      { fala: 'Cada bicho no seu lugar: água ou terra.',
        campo: 'onde', cestos: [['agua', 'Água'], ['terra', 'Terra']],
        bichos: ['peixe', 'tartaruga', 'gato', 'coelho'] },
      { fala: 'Agora separe: bicho grande e bicho pequeno.',
        campo: 'tamanho', cestos: [['grande', 'Grande'], ['pequeno', 'Pequeno']],
        bichos: ['elefante', 'vaca', 'rato', 'passarinho'] }
    ];
    var indice = 0;

    function rodada() {
      var r = rodadas[indice];
      var t = tabuleiro('', 'clamp(100px, 20vh, 158px)');
      var cestos = [];

      r.cestos.forEach(function (c, i) {
        var el = document.createElement('div');
        el.className = 'cesto ' + (c[0] === 'agua' ? 'agua' : (c[0] === 'terra' ? 'terra' : (c[0] === 'grande' ? 'grande-cesto' : 'pequeno-cesto')));
        el.style.left = (i === 0 ? 3 : 52) + '%';
        el.style.top = '6%';
        el.style.width = '45%';
        el.style.height = '48%';
        el.textContent = c[1];
        el.dataset.valor = c[0];
        el.dataset.quantos = '0';
        t.appendChild(el);
        cestos.push(el);
      });

      var faltam = r.bichos.length;
      embaralhar(r.bichos).forEach(function (bicho, i) {
        var p = novaPeca(svgAnimal(bicho), 15 + i * 23.5, 79);
        p.dataset.bicho = bicho;
        t.appendChild(p);
        arrastavel(p, {
          aoToque: function () { somDoAnimal(bicho); },
          aoSoltar: function (el) {
            var cesto = alvoMaisPerto(el, cestos);
            if (cesto && cesto.dataset.valor === ANIMAIS[bicho][r.campo]) {
              // encaixa dentro do cesto, em uma vaguinha livre
              var n = Number(cesto.dataset.quantos);
              cesto.dataset.quantos = String(n + 1);
              var rc = cesto.getBoundingClientRect();
              var rp = el.getBoundingClientRect();
              var alvoX = rc.left + rc.width * (n === 0 ? 0.3 : 0.7);
              var alvoY = rc.top + rc.height * 0.6;
              el._dx += alvoX - (rp.left + rp.width / 2);
              el._dy += alvoY - (rp.top + rp.height / 2);
              el.style.transition = 'transform .45s ease';
              aplicar(el);
              el.classList.add('fixa');
              acertou(2);
              var art = ANIMAIS[bicho].artigo === 'a' ? 'A' : 'O';
              C.falar(art + ' ' + ANIMAIS[bicho].nome + ' é ' + (r.campo === 'onde' ? 'da ' : '') + cesto.textContent.toLowerCase() + '!');
              faltam--;
              if (faltam === 0) {
                indice++;
                if (indice < rodadas.length) daqui(1800, rodada);
                else terminar('Tudo separadinho!', CONVITE_CLASSIFICAR, DICA_CLASSIFICAR);
              }
            } else {
              voltarPraCasa(el);
            }
          }
        });
      });

      C.falar(r.fala + ' Toque no bicho para ouvir o nome.');
    }

    rodada();
  }

  /* =========================================================
     Abrir uma brincadeira
     ========================================================= */
  function abrirAtividade(nome) {
    limparAtividade();
    atividadeAtual = nome;
    nivelAtual = Number(C.config.nivel) || 1;
    C.registrar(nome);
    C.irPara('tela-atividade');

    daqui(80, function () {
      if (nome === 'encaixar') atividadeEncaixar(nivelAtual);
      else if (nome === 'par') atividadePar(nivelAtual);
      else if (nome === 'ordem') atividadeOrdem(nivelAtual);
      else if (nome === 'pare') atividadePare();
      else if (nome === 'classificar') atividadeClassificar();
    });
  }

  Array.prototype.forEach.call(
    document.querySelectorAll('#tela-brincar .cartao[data-atividade]'),
    function (b) {
      b.addEventListener('click', function () {
        C.nota(C.NOTAS[2], 0.34, 0.05);
        abrirAtividade(b.getAttribute('data-atividade'));
      });
    }
  );

  C.abrirAtividade = abrirAtividade;
})();
