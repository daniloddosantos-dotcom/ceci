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

  var atividadeAtual = null;
  var nivelAtual = 1;
  var relogios = [];          // todos os setTimeout, para poder desligar tudo

  function daqui(ms, fn) { var t = setTimeout(fn, ms); relogios.push(t); return t; }
  function limparRelogios() { relogios.forEach(clearTimeout); relogios = []; }

  function limparAtividade() {
    abandonarRodada();
    limparRelogios();
    palco.innerHTML = '';
    C.dicaAtual = null;
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
    if (el) {                          // um gatinho específico (o da tela de fim)
      el.classList.remove('balancando');
      void el.offsetWidth;             // truque para reiniciar a animação
      el.classList.add('balancando');
      daqui(1800, function () { el.classList.remove('balancando'); });
      return;
    }
    if (C.gatinho) C.gatinho.balanca();   // o companheiro do canto
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
    if (tipo === 'oval') corpo = '<ellipse cx="50" cy="50" rx="44" ry="30"' + f + traco + '/>';
    if (tipo === 'estrela') corpo = '<path d="M50 6 L61 36 L94 38 L68 58 L77 92 L50 74 L23 92 L32 58 L6 38 L39 36 Z" stroke-linejoin="round"' + f + traco + '/>';
    if (tipo === 'coracao') corpo = '<path d="M50 90 C10 62 12 26 32 22 C42 20 50 30 50 38 C50 30 58 20 68 22 C88 26 90 62 50 90 Z" stroke-linejoin="round"' + f + traco + '/>';
    if (tipo === 'lua') corpo = '<path d="M64 8 a42 42 0 1 0 26 74 a34 34 0 0 1 -26 -74 Z" stroke-linejoin="round"' + f + traco + '/>';
    if (tipo === 'losango') corpo = '<path d="M50 6 L92 50 L50 94 L8 50 Z" stroke-linejoin="round"' + f + traco + '/>';
    if (tipo === 'flor') corpo = '<circle cx="50" cy="22" r="16"' + f + traco + '/><circle cx="78" cy="42" r="16"' + f + traco + '/><circle cx="68" cy="76" r="16"' + f + traco + '/><circle cx="32" cy="76" r="16"' + f + traco + '/><circle cx="22" cy="42" r="16"' + f + traco + '/><circle cx="50" cy="50" r="14" fill="#f2c94c"' + traco + '/>';
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
      nome: 'passarinho', artigo: 'o', onde: 'terra', tamanho: 'pequeno', tom: 1000, voa: true,
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
    },

    pato: {
      nome: 'pato', artigo: 'o', onde: 'agua', tamanho: 'pequeno', tom: 480, som: 'quack',
      svg:
        '<g fill="none" stroke="' + CT + '" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">' +
        '<path d="M10 62 q12 -12 26 0" fill="#f2c94c"/>' +
        '<ellipse cx="50" cy="66" rx="36" ry="22" fill="#f2c94c"/>' +
        '<circle cx="82" cy="38" r="19" fill="#f2c94c"/>' +
        '<path d="M98 36 L119 44 L98 52 Z" fill="#f19a3e"/>' +
        '<path d="M36 64 q14 -10 28 2 q-12 14 -28 -2 Z" fill="#e0b43a"/>' +
        '</g>' +
        '<circle cx="88" cy="33" r="4.5" fill="' + CT + '"/>'
    },

    baleia: {
      nome: 'baleia', artigo: 'a', onde: 'agua', tamanho: 'grande', tom: 120, som: 'grave',
      svg:
        '<g fill="none" stroke="' + CT + '" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">' +
        '<path d="M24 54 L6 36 L10 66 Z" fill="#5f8fc9"/>' +
        '<path d="M18 60 q20 -40 62 -32 q36 6 34 30 q-6 24 -40 26 h-40 q-18 -4 -16 -24 Z" fill="#6aa0d8"/>' +
        '<path d="M30 70 q34 10 70 0" stroke="#dcecf8" stroke-width="4"/>' +
        '<path d="M74 22 q6 -14 0 -18 M74 22 q-6 -14 0 -18" stroke="#9ec5e8" stroke-width="4"/>' +
        '</g>' +
        '<circle cx="100" cy="44" r="4.5" fill="' + CT + '"/>'
    },

    sapo: {
      nome: 'sapo', artigo: 'o', onde: 'agua', tamanho: 'pequeno', tom: 260, som: 'grave',
      svg:
        '<g fill="none" stroke="' + CT + '" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">' +
        '<ellipse cx="60" cy="68" rx="40" ry="24" fill="#7fc36c"/>' +
        '<circle cx="78" cy="40" r="12" fill="#7fc36c"/><circle cx="52" cy="40" r="12" fill="#7fc36c"/>' +
        '<path d="M22 84 q-10 8 -4 12 h16 M98 84 q10 8 4 12 h-16" fill="#7fc36c"/>' +
        '<path d="M64 60 q12 6 24 -2" stroke-width="4"/>' +
        '</g>' +
        '<circle cx="80" cy="39" r="4.5" fill="' + CT + '"/><circle cx="54" cy="39" r="4.5" fill="' + CT + '"/>'
    },

    borboleta: {
      nome: 'borboleta', artigo: 'a', onde: 'terra', tamanho: 'pequeno', tom: 1100, voa: true,
      svg:
        '<g fill="none" stroke="' + CT + '" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">' +
        '<path d="M58 50 q-40 -46 -46 -10 q-2 24 20 22 Z" fill="#e987b8"/>' +
        '<path d="M58 54 q-40 40 -44 8 q0 -18 18 -14 Z" fill="#f3b3d0"/>' +
        '<path d="M62 50 q40 -46 46 -10 q2 24 -20 22 Z" fill="#e987b8"/>' +
        '<path d="M62 54 q40 40 44 8 q0 -18 -18 -14 Z" fill="#f3b3d0"/>' +
        '<ellipse cx="60" cy="54" rx="6" ry="22" fill="#5a4a6a"/>' +
        '<path d="M56 32 q-6 -12 -12 -14 M64 32 q6 -12 12 -14" stroke-width="3"/>' +
        '</g>'
    },

    abelha: {
      nome: 'abelha', artigo: 'a', onde: 'terra', tamanho: 'pequeno', tom: 700, voa: true, som: 'zum',
      svg:
        '<g fill="none" stroke="' + CT + '" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">' +
        '<ellipse cx="46" cy="30" rx="16" ry="12" fill="#dcecf8"/><ellipse cx="68" cy="28" rx="16" ry="12" fill="#dcecf8"/>' +
        '<ellipse cx="56" cy="60" rx="36" ry="24" fill="#f2c94c"/>' +
        '<path d="M40 38 v44 M58 36 v48 M76 40 v40" stroke-width="8"/>' +
        '<circle cx="96" cy="56" r="14" fill="#f2c94c"/>' +
        '<path d="M12 60 h10" stroke-width="4"/>' +
        '</g>' +
        '<circle cx="100" cy="52" r="4" fill="' + CT + '"/>'
    }
  };

  function svgAnimal(chave) {
    var a = ANIMAIS[chave];
    return '<svg viewBox="' + VB + '">' + a.svg + '</svg>';
  }

  // deixa os desenhos à mão para a página de teste animais.html
  C.ANIMAIS = ANIMAIS;
  C.svgAnimal = svgAnimal;
  C.somDoAnimal = function (chave) { somDoAnimal(chave); };
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
    '<g class="olhos"><circle cx="39" cy="53" r="4.5" fill="' + CT + '"/>' +
    '<circle cx="61" cy="53" r="4.5" fill="' + CT + '"/></g>' +
    '</svg>';

  // som simples do bicho: duas notinhas macias no tom dele.
  // Tocar num bicho novo é uma das únicas coisas que corta a fala anterior.
  function somDoAnimal(chave, semNome) {
    var a = ANIMAIS[chave];
    if (!semNome) C.falarJa(a.artigo + ' ' + a.nome);
    var espera = semNome ? 0 : 900;
    daqui(espera, function () { barulhoDoBicho(a); });
  }

  // o barulho de cada bicho, tudo sintetizado e macio
  function barulhoDoBicho(a) {
    var c = C.audio(); if (!c) return;
    var t = c.currentTime;
    function voz(freqIni, freqFim, dur, tipo, vol, corte) {
      var o = c.createOscillator(); o.type = tipo || 'sine';
      o.frequency.setValueAtTime(freqIni, t);
      o.frequency.linearRampToValueAtTime(freqFim, t + dur);
      var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = corte || 1400;
      var g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.06, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(lp); lp.connect(g); g.connect(c.destination);
      o.start(t); o.stop(t + dur + 0.05);
    }
    if (a.som === 'grave' || a.nome === 'vaca' || a.nome === 'elefante') {
      voz(a.tom * 1.4, a.tom * 0.9, 0.7, 'triangle', 0.06, 600);        // "muuu"
    } else if (a.nome === 'passarinho' || a.som === 'zum') {
      voz(a.tom, a.tom * 1.5, 0.16, 'sine', 0.05, 3000);                 // piadinho
      daqui(220, function () { voz(a.tom * 1.2, a.tom * 0.9, 0.16, 'sine', 0.05, 3000); });
    } else if (a.nome === 'peixe' || a.nome === 'baleia' || a.nome === 'tartaruga') {
      voz(a.tom, a.tom * 1.1, 0.12, 'sine', 0.04);                       // bolhinhas
      daqui(180, function () { voz(a.tom * 1.3, a.tom * 1.4, 0.12, 'sine', 0.04); });
      daqui(360, function () { voz(a.tom * 1.6, a.tom * 1.7, 0.12, 'sine', 0.035); });
    } else if (a.som === 'quack') {
      voz(a.tom, a.tom * 0.8, 0.22, 'square', 0.03, 900);
      daqui(280, function () { voz(a.tom, a.tom * 0.8, 0.22, 'square', 0.03, 900); });
    } else {
      C.nota(a.tom, 0.28, 0.05);                                            // duas notinhas
      daqui(250, function () { C.nota(a.tom * 1.25, 0.34, 0.045); });
    }
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

  /* REGRAS IGUAIS PARA TODAS AS BRINCADEIRAS DE ARRASTAR:
     - soltar no lugar certo: a peça trava ali (fixa), som suave e o gatinho balança;
     - soltar em qualquer outro lugar: a peça volta devagar (0,8 s) para onde estava,
       sem som, sem mensagem, sem contar nada;
     - uma peça solta NUNCA fica parada no meio do caminho: se por algum motivo o
       dedo "sumiu" sem avisar (toque perdido), um vigia manda a peça de volta. */
  function arrastavel(el, opcoes) {
    var id = null, x0 = 0, y0 = 0, ix = 0, iy = 0, mexeu = 0;
    el._solta = function () { if (!el.classList.contains('fixa')) voltarPraCasa(el); };

    el.addEventListener('pointerdown', function (e) {
      if (C.estaBloqueado() || el.classList.contains('fixa')) return;
      if (id !== null) return;
      id = e.pointerId; x0 = e.clientX; y0 = e.clientY; mexeu = 0;
      // se a peça ainda está voltando para casa, pega do lugar onde ela está agora
      var m = getComputedStyle(el).transform;
      var v = m && m !== 'none' ? m.match(/matrix\(([^)]+)\)/) : null;
      if (v) { var nums = v[1].split(',').map(Number); el._dx = nums[4]; el._dy = nums[5]; }
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
      mexeu = Math.max(mexeu, Math.abs(e.clientX - x0) + Math.abs(e.clientY - y0));
      aplicar(el);
    });

    function terminou(e) {
      if (id === null || (e && e.pointerId != null && id !== e.pointerId)) return;
      id = null;
      el.classList.remove('pegando');
      if (mexeu < 12) {                       // foi um toque, não um arrasto
        if (el._dx !== 0 || el._dy !== 0) voltarPraCasa(el);
        if (opcoes.aoToque) opcoes.aoToque(el);
        return;
      }
      if (opcoes.aoSoltar) opcoes.aoSoltar(el);
      // seja qual for o resultado, a peça ou travou ou está voltando para casa
      if (!el.classList.contains('fixa') && (el._dx !== 0 || el._dy !== 0) && el.style.transition === 'none') voltarPraCasa(el);
    }
    el.addEventListener('pointerup', terminou);
    el.addEventListener('pointercancel', terminou);
    el.addEventListener('lostpointercapture', function (e) { if (id !== null && id === e.pointerId) terminou(e); });
    // rede de segurança: o dedo levantou em outro lugar da tela
    el._terminou = function (e) { if (id !== null && id === e.pointerId) terminou(e); };
  }
  ["pointerup", "pointercancel"].forEach(function (tipo) {
    document.addEventListener(tipo, function (e) {
      if (!palco) return;
      Array.prototype.forEach.call(palco.querySelectorAll(".peca.pegando"), function (el) { if (el._terminou) el._terminou(e); });
    }, true);
  });

  // vigia: a cada segundo, qualquer peça solta fora de casa e não travada volta sozinha
  setInterval(function () {
    if (!palco || !palco.children.length) return;
    Array.prototype.forEach.call(palco.querySelectorAll('.peca'), function (el) {
      if (el.classList.contains('fixa') || el.classList.contains('pegando')) return;
      if (typeof el._solta !== 'function') return;
      if ((el._dx !== 0 || el._dy !== 0) && el.style.transition === 'none') el._solta();
    });
  }, 1000);

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
  // TOLERÂNCIA ÚNICA: o centro da peça a até 80 % do tamanho do alvo + 60 px do centro dele
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
  /* A tela de fim mora no app.js (o musica.js usa a mesma).
     Aqui só dizemos o que fazer nos botões "De novo" e "Outra brincadeira". */
  function terminar(titulo, convite, dicaDoPapai) {
    daqui(700, function () {
      C.mostrarFim(titulo, convite, dicaDoPapai,
        function () { if (atividadeAtual) abrirAtividade(atividadeAtual); },
        function () { limparAtividade(); C.irPara('tela-brincar'); });
    });
  }

  /* =========================================================
     PROGRESSÃO AUTOMÁTICA
     3 rodadas completas seguidas -> sobe um nível.
     Abandonar 2 vezes seguidas no meio -> desce um nível.
     Não depende da configuração do papai.
     ========================================================= */
  var CHAVE_PROG = 'ceci.progresso.v1';
  function lerProg() { try { return JSON.parse(localStorage.getItem(CHAVE_PROG) || '{}'); } catch (e) { return {}; } }
  function progresso(nome) { return lerProg()[nome] || { nivel: 1, seguidas: 0, abandonos: 0 }; }
  function gravarProg(nome, p) {
    var t = lerProg(); t[nome] = p;
    try { localStorage.setItem(CHAVE_PROG, JSON.stringify(t)); } catch (e) {}
  }
  var rodada = { nome: null, aberta: false };
  function comecarRodada(nome) { rodada.nome = nome; rodada.aberta = true; }
  function completarRodada(nome, maxNivel) {
    rodada.aberta = false;
    var p = progresso(nome);
    p.seguidas++; p.abandonos = 0;
    if (p.seguidas >= 3 && p.nivel < (maxNivel || 3)) { p.nivel++; p.seguidas = 0; }
    gravarProg(nome, p);
    return p.nivel;
  }
  function abandonarRodada() {
    if (!rodada.aberta || !rodada.nome) return;
    rodada.aberta = false;
    if (C.estaBloqueado()) return;             // o sol se pôs: não foi ela que desistiu
    var p = progresso(rodada.nome);
    p.abandonos++; p.seguidas = 0;
    if (p.abandonos >= 2 && p.nivel > 1) { p.nivel--; p.abandonos = 0; }
    gravarProg(rodada.nome, p);
  }
  C.progressoDe = progresso;                   // o painel do papai mostra

  /* =========================================================
     MAIS DESENHOS: formas extras, frutas, veículos e objetos
     ========================================================= */
  var TR = ' stroke="' + CT + '" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"';

  function svg100(miolo) { return '<svg viewBox="0 0 100 100">' + miolo + '</svg>'; }

  var FRUTAS = {
    maca:    { nome: 'maçã', plural: 'maçãs', artigo: 'a', svg: svg100(
      '<circle cx="50" cy="58" r="33" fill="#e04a3f"' + TR + '/>' +
      '<path d="M50 26 V12" fill="none"' + TR + '/>' +
      '<path d="M52 20 q16 -12 24 2 q-14 10 -24 -2 Z" fill="#6fae7c"' + TR + '/>') },
    banana:  { nome: 'banana', plural: 'bananas', artigo: 'a', svg: svg100(
      '<path d="M18 40 q10 46 58 44 q10 0 12 -8 q-42 6 -56 -40 Z" fill="#f2c94c"' + TR + '/>' +
      '<path d="M16 34 l4 8" fill="none"' + TR + '/>') },
    laranja: { nome: 'laranja', plural: 'laranjas', artigo: 'a', svg: svg100(
      '<circle cx="50" cy="56" r="34" fill="#f19a3e"' + TR + '/>' +
      '<path d="M50 22 q12 -10 22 -2 q-12 8 -22 2 Z" fill="#6fae7c"' + TR + '/>' +
      '<circle cx="40" cy="50" r="2.5" fill="#d9822b"/><circle cx="58" cy="62" r="2.5" fill="#d9822b"/><circle cx="46" cy="70" r="2.5" fill="#d9822b"/>') },
    uva:     { nome: 'uva', plural: 'uvas', artigo: 'a', svg: svg100(
      '<path d="M50 10 V26" fill="none"' + TR + '/>' +
      '<circle cx="36" cy="38" r="12" fill="#8e5fb3"' + TR + '/><circle cx="64" cy="38" r="12" fill="#8e5fb3"' + TR + '/>' +
      '<circle cx="28" cy="58" r="12" fill="#8e5fb3"' + TR + '/><circle cx="50" cy="56" r="12" fill="#8e5fb3"' + TR + '/><circle cx="72" cy="58" r="12" fill="#8e5fb3"' + TR + '/>' +
      '<circle cx="40" cy="76" r="12" fill="#8e5fb3"' + TR + '/><circle cx="62" cy="76" r="12" fill="#8e5fb3"' + TR + '/>') },
    morango: { nome: 'morango', plural: 'morangos', artigo: 'o', svg: svg100(
      '<path d="M50 90 C18 70 16 40 32 34 q18 -4 18 6 q0 -10 18 -6 c16 6 14 36 -18 56 Z" fill="#e04a3f"' + TR + '/>' +
      '<path d="M30 34 l10 -14 l10 12 l10 -12 l10 14" fill="#6fae7c"' + TR + '/>' +
      '<circle cx="42" cy="56" r="2.5" fill="#fbe7a0"/><circle cx="58" cy="60" r="2.5" fill="#fbe7a0"/><circle cx="50" cy="72" r="2.5" fill="#fbe7a0"/>') },
    pera:    { nome: 'pera', plural: 'peras', artigo: 'a', svg: svg100(
      '<path d="M50 90 c-24 0 -34 -18 -30 -32 c4 -12 14 -14 18 -26 c3 -9 21 -9 24 0 c4 12 14 14 18 26 c4 14 -6 32 -30 32 Z" fill="#b5cf6a"' + TR + '/>' +
      '<path d="M50 30 V14" fill="none"' + TR + '/>') }
  };

  var VEICULOS = {
    carro:     { nome: 'carro', artigo: 'o', svg: svg100(
      '<path d="M12 64 v-14 q0 -6 6 -6 h10 l10 -16 h26 l10 16 h12 q6 0 6 6 v14 Z" fill="#e04a3f"' + TR + '/>' +
      '<rect x="42" y="34" width="18" height="12" fill="#cfe7f7"' + TR + '/>' +
      '<circle cx="30" cy="68" r="10" fill="#3a3630"/><circle cx="72" cy="68" r="10" fill="#3a3630"/>' +
      '<circle cx="30" cy="68" r="4" fill="#cfc6b6"/><circle cx="72" cy="68" r="4" fill="#cfc6b6"/>') },
    onibus:    { nome: 'ônibus', artigo: 'o', svg: svg100(
      '<rect x="8" y="28" width="84" height="44" rx="8" fill="#f2b705"' + TR + '/>' +
      '<rect x="16" y="36" width="16" height="14" fill="#cfe7f7"' + TR + '/><rect x="42" y="36" width="16" height="14" fill="#cfe7f7"' + TR + '/><rect x="68" y="36" width="16" height="14" fill="#cfe7f7"' + TR + '/>' +
      '<circle cx="28" cy="74" r="9" fill="#3a3630"/><circle cx="72" cy="74" r="9" fill="#3a3630"/>') },
    barco:     { nome: 'barco', artigo: 'o', svg: svg100(
      '<path d="M10 62 h80 l-12 22 h-56 Z" fill="#c98a5a"' + TR + '/>' +
      '<path d="M50 58 V14" fill="none"' + TR + '/>' +
      '<path d="M54 18 l30 36 h-30 Z" fill="#ffffff"' + TR + '/>' +
      '<path d="M8 90 q10 -8 20 0 q10 8 20 0 q10 -8 20 0 q10 8 20 0" fill="none" stroke="#58aed8" stroke-width="5" stroke-linecap="round"/>') },
    aviao:     { nome: 'avião', artigo: 'o', svg: svg100(
      '<ellipse cx="52" cy="52" rx="40" ry="13" fill="#cfe7f7"' + TR + '/>' +
      '<path d="M40 52 l-16 -28 h14 l20 28 Z" fill="#3a72c4"' + TR + '/>' +
      '<path d="M40 52 l-16 28 h14 l20 -28 Z" fill="#3a72c4"' + TR + '/>' +
      '<path d="M14 52 l-4 -14 h10 l6 14 Z" fill="#3a72c4"' + TR + '/>' +
      '<circle cx="76" cy="50" r="4" fill="#3a3630"/>') },
    trem:      { nome: 'trem', artigo: 'o', svg: svg100(
      '<rect x="10" y="40" width="50" height="34" rx="6" fill="#4aa657"' + TR + '/>' +
      '<rect x="60" y="52" width="30" height="22" rx="6" fill="#4aa657"' + TR + '/>' +
      '<rect x="18" y="24" width="14" height="16" fill="#3a3630"/>' +
      '<rect x="40" y="48" width="12" height="12" fill="#cfe7f7"' + TR + '/>' +
      '<circle cx="24" cy="78" r="8" fill="#3a3630"/><circle cx="46" cy="78" r="8" fill="#3a3630"/><circle cx="76" cy="78" r="8" fill="#3a3630"/>') },
    bicicleta: { nome: 'bicicleta', artigo: 'a', svg: svg100(
      '<circle cx="26" cy="66" r="18" fill="none"' + TR + '/><circle cx="74" cy="66" r="18" fill="none"' + TR + '/>' +
      '<path d="M26 66 L44 36 H64 L74 66 M44 36 L52 66 H26 M64 36 l-4 -8 h8" fill="none" stroke="#e04a3f" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M40 30 h12" fill="none"' + TR + '/>') }
  };

  C.VEICULOS = VEICULOS;      // os carimbos do ateliê usam estes desenhos

  var OBJETOS = {
    patinho: { nome: 'patinho', plural: 'patinhos', artPlural: 'os', fem: false, svg: svg100(
      '<ellipse cx="46" cy="64" rx="30" ry="20" fill="#f2c94c"' + TR + '/>' +
      '<circle cx="70" cy="42" r="16" fill="#f2c94c"' + TR + '/>' +
      '<path d="M84 44 l14 4 l-14 6 Z" fill="#f19a3e"' + TR + '/>' +
      '<circle cx="74" cy="38" r="3" fill="#3a3630"/>' +
      '<path d="M22 60 q-10 -8 -6 -18" fill="none"' + TR + '/>') },
    bola:    { nome: 'bola', plural: 'bolas', artPlural: 'as', fem: true, svg: svg100(
      '<circle cx="50" cy="50" r="38" fill="#e04a3f"' + TR + '/>' +
      '<path d="M22 30 q28 12 56 0 M22 70 q28 -12 56 0" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round"/>') },
    urso:    { nome: 'urso', plural: 'ursos', artPlural: 'os', fem: false, svg: svg100(
      '<circle cx="28" cy="30" r="12" fill="#b07a4a"' + TR + '/><circle cx="72" cy="30" r="12" fill="#b07a4a"' + TR + '/>' +
      '<circle cx="50" cy="54" r="32" fill="#b07a4a"' + TR + '/>' +
      '<ellipse cx="50" cy="66" rx="14" ry="10" fill="#e6c39a"' + TR + '/>' +
      '<circle cx="40" cy="48" r="3.5" fill="#3a3630"/><circle cx="60" cy="48" r="3.5" fill="#3a3630"/><circle cx="50" cy="63" r="4" fill="#3a3630"/>') },
    copo:    { nome: 'copo', plural: 'copos', artPlural: 'os', fem: false, svg: svg100(
      '<path d="M26 18 h48 l-6 66 h-36 Z" fill="#9ec5e8"' + TR + '/>' +
      '<path d="M30 40 h40" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/>') }
  };

  function nomeDaCor(cor) {
    return { '#e04a3f': 'vermelho', '#3a72c4': 'azul', '#f2b705': 'amarelo', '#4aa657': 'verde', '#e987b8': 'rosa', '#8e5fb3': 'roxo' }[cor] || 'cor';
  }

  /* =========================================================
     BRINCADEIRA 1 - ENCAIXAR (formas, cores e senso espacial)
     Cada rodada sorteia um cenário. O nível sobe e desce sozinho.
     ========================================================= */
  var CONVITE_ENCAIXAR = 'Vamos procurar uma coisa redonda na casa?';
  var DICA_ENCAIXAR = 'Pergunte a ela: onde está o círculo? Em cima ou embaixo?';

  var ARTIGO_FORMA = { circulo: 'O', quadrado: 'O', triangulo: 'O', retangulo: 'O', oval: 'O', estrela: 'A', coracao: 'O', lua: 'A', flor: 'A', losango: 'O' };
  function nomeDaForma(tipo) {
    return {
      circulo: 'círculo', quadrado: 'quadrado', triangulo: 'triângulo', retangulo: 'retângulo',
      oval: 'oval', estrela: 'estrela', coracao: 'coração', lua: 'lua', flor: 'flor', losango: 'losango'
    }[tipo] || tipo;
  }

  var CENARIOS_ENCAIXAR = ['formas', 'formas2', 'cores', 'animal', 'casinha'];
  var ultimoCenario = '';

  // pecas: [{id, grupo?, nome, svg, sombra, x, y, tam?}] ; alvos nos mesmos ids.
  // Peças iguais (as patas) têm o mesmo "grupo": qualquer uma serve em qualquer sombra do grupo.
  // Não existe rotação: a peça encaixa em qualquer ângulo.
  function montarEncaixe(t, pecas, opcoes) {
    var alvos = [];
    var faltam = pecas.length;

    pecas.forEach(function (d) {
      var a = novoAlvo(d.sombra || d.svg, d.x, d.y, d.sombra ? '' : 'sombra');
      if (d.tam) a.style.setProperty('--p', d.tam);
      a.dataset.id = d.grupo || d.id;
      t.appendChild(a);
      alvos.push(a);
    });

    var ordem = embaralhar(pecas);
    var passo = 100 / (ordem.length + 1);
    ordem.forEach(function (d, i) {
      var p = novaPeca(d.svg, passo * (i + 1), 84, d.classe || '');
      if (d.tam) p.style.setProperty('--p', d.tam);
      p.dataset.id = d.grupo || d.id;
      t.appendChild(p);

      arrastavel(p, {
        aoToque: function () { dizerNome(d.nome); },
        aoSoltar: function (el) {
          var alvo = alvoMaisPerto(el, alvos);
          if (!alvo || alvo.dataset.id !== el.dataset.id) { voltarPraCasa(el); return; }
          encaixarEm(el, alvo);
          acertou(2);
          if (d.fala) C.falar(d.fala);
          faltam--;
          if (faltam === 0) opcoes.aoCompletar();
        }
      });
    });
  }

  function cenarioFormas(t, nivel, conjunto) {
    var lista = conjunto === 'formas2'
      ? [['estrela', '#f2b705'], ['coracao', '#e987b8'], ['lua', '#9ec5e8'], ['flor', '#e04a3f'], ['losango', '#4aa657']]
      : [['circulo', '#e04a3f'], ['quadrado', '#3a72c4'], ['triangulo', '#f2b705'], ['retangulo', '#4aa657'], ['oval', '#e987b8']];
    var quantas = nivel === 1 ? 3 : (nivel === 2 ? 4 : 5);   // o nível sobe = mais peças
    var usadas = lista.slice(0, quantas);
    var passo = 100 / (quantas + 1);
    var pecas = usadas.map(function (f, i) {
      return {
        id: f[0], nome: nomeDaForma(f[0]),
        svg: forma(f[0], f[1], false), sombra: forma(f[0], '#ece4d4', true),
        x: passo * (i + 1), y: 34,
        fala: (i % 2 === 0) ? (ARTIGO_FORMA[f[0]] || 'O') + ' ' + nomeDaForma(f[0]) + ' foi em cima!' : null
      };
    });
    C.falar('Leva cada forma para a sombra dela, lá em cima.');
    montarEncaixe(t, pecas, { nivel: nivel, aoCompletar: function () { ganharVida(t, 'formas'); } });
  }

  function cenarioCores(t, nivel) {
    var cores = ['#e04a3f', '#3a72c4', '#f2b705', '#4aa657', '#e987b8'];
    var quantas = nivel === 1 ? 3 : (nivel === 2 ? 4 : 5);
    var passo = 100 / (quantas + 1);
    var pecas = cores.slice(0, quantas).map(function (cor, i) {
      return {
        id: cor, nome: nomeDaCor(cor),
        svg: forma('circulo', cor, false),
        sombra: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="43" fill="' + cor + '" opacity=".38" stroke="' + cor + '" stroke-width="4" stroke-dasharray="9 8"/></svg>',
        x: passo * (i + 1), y: 34,
        fala: (i === 0) ? 'Cada cor na sua sombra!' : null
      };
    });
    C.falar('Cada cor vai para a sombra da mesma cor.');
    montarEncaixe(t, pecas, { nivel: nivel, aoCompletar: function () { ganharVida(t, 'formas'); } });
  }

  function cenarioAnimal(t, nivel) {
    var corpo = '<svg viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="40" ry="30" fill="#f0a55c" stroke="' + CT + '" stroke-width="5"/></svg>';
    var pata = '<svg viewBox="0 0 100 100"><rect x="26" y="34" width="48" height="32" rx="15" fill="#e8963f" stroke="' + CT + '" stroke-width="5"/></svg>';
    var rabo = '<svg viewBox="0 0 100 100"><path d="M20 80 q-14 -40 30 -50 q26 -6 30 20" fill="none" stroke="' + CT + '" stroke-width="16" stroke-linecap="round"/><path d="M20 80 q-14 -40 30 -50 q26 -6 30 20" fill="none" stroke="#e8963f" stroke-width="9" stroke-linecap="round"/></svg>';
    var pecas = [
      { id: 'cabeca', nome: 'cabeça', svg: CABECA_GATO, x: 50, y: 22, fala: 'A cabeça ficou em cima!' },
      { id: 'corpo',  nome: 'corpo',  svg: corpo, x: 50, y: 46, fala: 'O corpo ficou no meio!' }
    ];
    // as patas são iguais: qualquer pata serve em qualquer sombra de pata
    if (nivel >= 3) {
      pecas.push({ id: 'pata1', grupo: 'pata', nome: 'pata', svg: pata, x: 36, y: 64 });
      pecas.push({ id: 'pata2', grupo: 'pata', nome: 'pata', svg: pata, x: 45.5, y: 64 });
      pecas.push({ id: 'pata3', grupo: 'pata', nome: 'pata', svg: pata, x: 54.5, y: 64 });
      pecas.push({ id: 'pata4', grupo: 'pata', nome: 'pata', svg: pata, x: 64, y: 64, fala: 'As patas ficaram embaixo!' });
    } else {
      pecas.push({ id: 'pata1', grupo: 'pata', nome: 'pata', svg: pata, x: 40, y: 64 });
      pecas.push({ id: 'pata2', grupo: 'pata', nome: 'pata', svg: pata, x: 60, y: 64, fala: 'As patas ficaram embaixo!' });
    }
    if (nivel >= 2) pecas.push({ id: 'rabo', nome: 'rabo', svg: rabo, x: 26, y: 50, fala: 'O rabo ficou do lado!' });
    C.falar('Monte o gatinho. A cabeça vai em cima e as patas embaixo.');
    montarEncaixe(t, pecas, { nivel: nivel, aoCompletar: function () { ganharVida(t, 'animal'); } });
  }

  /* Casinha: um único desenho de referência em coordenadas fixas (1000 x 600).
     O corpo da casa fica fixo no fundo; telhado, porta, janela e chaminé são
     recortados desse mesmo desenho, então ao encaixar tudo se monta certinho. */
  var CASA = {
    corpo:   { x: 380, y: 200, w: 240, h: 220 },
    telhado: { x: 340, y: 70,  w: 320, h: 140, nome: 'telhado', fala: 'O telhado fica em cima!' },
    porta:   { x: 470, y: 320, w: 60,  h: 100, nome: 'porta',   fala: 'A porta fica embaixo!' },
    janela:  { x: 405, y: 240, w: 60,  h: 60,  nome: 'janela',  fala: 'A janela fica do lado!' },
    janela2: { x: 535, y: 240, w: 60,  h: 60,  nome: 'janela',  grupo: 'janela' },
    chamine: { x: 565, y: 110, w: 40,  h: 90,  nome: 'chaminé' }
  };
  var FOLGA = 8;   // margem em volta de cada peça, para o contorno não ser cortado

  // o desenho de cada parte, no seu próprio quadro (0,0 = canto da parte)
  function desenhoDaCasa(parte) {
    var p = CASA[parte];
    var vb = 'viewBox="' + (-FOLGA) + ' ' + (-FOLGA) + ' ' + (p.w + FOLGA * 2) + ' ' + (p.h + FOLGA * 2) + '"';
    var miolo = '';
    if (parte === 'corpo')   miolo = '<rect x="0" y="0" width="240" height="220" rx="6" fill="#fdf3df" stroke="' + CT + '" stroke-width="5"/>';
    if (parte === 'telhado') miolo = '<path d="M160 0 L320 140 H0 Z" fill="#e04a3f" stroke="' + CT + '" stroke-width="5" stroke-linejoin="round"/>';
    if (parte === 'porta')   miolo = '<rect x="0" y="0" width="60" height="100" rx="8" fill="#b07a4a" stroke="' + CT + '" stroke-width="5"/><circle cx="46" cy="52" r="4" fill="#f2b705"/>';
    if (parte === 'janela' || parte === 'janela2') miolo = '<rect class="vidro" x="0" y="0" width="60" height="60" rx="6" fill="#9ec5e8" stroke="' + CT + '" stroke-width="5"/><path d="M30 0 V60 M0 30 H60" stroke="' + CT + '" stroke-width="5"/>';
    if (parte === 'chamine') miolo = '<rect x="0" y="0" width="40" height="90" rx="4" fill="#8a6a4a" stroke="' + CT + '" stroke-width="5"/>';
    return '<svg ' + vb + '>' + miolo + '</svg>';
  }

  function cenarioCasinha(t, nivel) {
    // como o quadro de 1000 x 600 cabe dentro do tabuleiro
    var W = t.clientWidth, H = t.clientHeight;
    var escala = Math.min(W / 1000, (H * 0.76) / 600);   // deixa a faixa de baixo para as peças
    var dx = (W - 1000 * escala) / 2, dy = 10;

    function caixa(el, p) {                    // põe um elemento exatamente na parte p
      var w = (p.w + FOLGA * 2) * escala, h = (p.h + FOLGA * 2) * escala;
      el.style.width = w + 'px'; el.style.height = h + 'px';
      el.style.marginLeft = (-w / 2) + 'px'; el.style.marginTop = (-h / 2) + 'px';
      el.style.left = (dx + (p.x + p.w / 2) * escala) + 'px';
      el.style.top = (dy + (p.y + p.h / 2) * escala) + 'px';
    }

    var corpo = document.createElement('div');
    corpo.className = 'alvo casa-corpo';
    corpo.innerHTML = desenhoDaCasa('corpo');
    caixa(corpo, CASA.corpo);
    t.appendChild(corpo);

    var partes = ['telhado', 'porta', 'janela'];
    if (nivel >= 2) partes.push('chamine');
    if (nivel >= 3) partes.push('janela2');           // nível 3 = mais peças (segunda janela)

    var alvos = [];
    partes.forEach(function (nome) {
      var a = novoAlvo(desenhoDaCasa(nome), 0, 0, 'sombra');
      caixa(a, CASA[nome]);
      a.dataset.id = CASA[nome].grupo || nome;
      t.appendChild(a);
      alvos.push(a);
    });

    var faltam = partes.length;
    var ordem = embaralhar(partes);
    ordem.forEach(function (nome, i) {
      var p = CASA[nome];
      var peca = novaPeca(desenhoDaCasa(nome), 0, 0);
      caixa(peca, p);
      peca.style.left = (W * (i + 1) / (ordem.length + 1)) + 'px';
      peca.style.top = (H * 0.88) + 'px';
      peca.dataset.id = p.grupo || nome;
      t.appendChild(peca);

      arrastavel(peca, {
        aoToque: function () { dizerNome(p.nome); },
        aoSoltar: function (el) {
          var alvo = alvoMaisPerto(el, alvos);
          if (!alvo || alvo.dataset.id !== el.dataset.id) { voltarPraCasa(el); return; }
          encaixarEm(el, alvo);
          acertou(2);
          if (p.fala) C.falar(p.fala);
          faltam--;
          if (faltam === 0) ganharVida(t, 'casinha');
        }
      });
    });

    C.falar('Monte a casinha. O telhado vai em cima.');
  }

  // a figura "ganha vida" por 2 segundos e depois vem a tela de fim
  function ganharVida(t, tipo) {
    t.classList.add('vivo-' + tipo);
    if (tipo === 'casinha') C.nota(C.NOTAS[5], 0.6, 0.05);
    var nivelNovo = completarRodada('encaixar', 3);
    daqui(2200, function () {
      terminar(tipo === 'animal' ? 'O gatinho ficou pronto!' : (tipo === 'casinha' ? 'A casinha acendeu!' : 'Muito bem, Cecí!'),
        CONVITE_ENCAIXAR, DICA_ENCAIXAR);
    });
    return nivelNovo;
  }

  function atividadeEncaixar() {
    var nivel = progresso('encaixar').nivel;
    var t = tabuleiro('', 'clamp(88px, 18vh, 132px)');
    var cenario;
    do { cenario = CENARIOS_ENCAIXAR[Math.floor(Math.random() * CENARIOS_ENCAIXAR.length)]; } while (cenario === ultimoCenario);
    ultimoCenario = cenario;
    comecarRodada('encaixar');
    if (cenario === 'formas') cenarioFormas(t, nivel, 'formas');
    else if (cenario === 'formas2') cenarioFormas(t, nivel, 'formas2');
    else if (cenario === 'cores') cenarioCores(t, nivel);
    else if (cenario === 'animal') cenarioAnimal(t, nivel);
    else cenarioCasinha(t, nivel);
  }

  /* =========================================================
     BRINCADEIRA 2 - ACHAR O PAR (memória) + qual vem depois?
     Temas sorteados; o tamanho do tabuleiro sobe sozinho (2,3,4,6 pares).
     ========================================================= */
  var CONVITE_PAR = 'Vamos achar duas meias iguais no armário?';
  var DICA_PAR = 'Peça para ela dizer o nome da figura antes de virar a carta.';

  var TEMAS_PAR = {
    animais:  { cor: '#b7d9a8', itens: function () { return ['gato', 'peixe', 'coelho', 'tartaruga', 'cavalo', 'passarinho'].map(function (k) { return { nome: ANIMAIS[k].nome, svg: svgAnimal(k) }; }); } },
    formas:   { cor: '#9ec5e8', itens: function () { return [['circulo', '#e04a3f'], ['quadrado', '#3a72c4'], ['triangulo', '#f2b705'], ['estrela', '#f19a3e'], ['coracao', '#e987b8'], ['lua', '#8e5fb3']].map(function (f) { return { nome: nomeDaForma(f[0]), svg: forma(f[0], f[1], false) }; }); } },
    frutas:   { cor: '#f6c89f', itens: function () { return Object.keys(FRUTAS).map(function (k) { return { nome: FRUTAS[k].nome, svg: FRUTAS[k].svg }; }); } },
    veiculos: { cor: '#d9c7ea', itens: function () { return Object.keys(VEICULOS).map(function (k) { return { nome: VEICULOS[k].nome, svg: VEICULOS[k].svg }; }); } }
  };
  var ultimoTema = '';

  function atividadePar() {
    var nivel = progresso('par').nivel;                 // 1..4
    var quantosPares = [2, 3, 4, 6][Math.min(nivel, 4) - 1];
    var chaves = Object.keys(TEMAS_PAR);
    var tema;
    do { tema = chaves[Math.floor(Math.random() * chaves.length)]; } while (tema === ultimoTema);
    ultimoTema = tema;
    var itens = embaralhar(TEMAS_PAR[tema].itens()).slice(0, quantosPares);
    var cartas = embaralhar(itens.concat(itens));
    comecarRodada('par');

    var t = tabuleiro('', 'clamp(76px, 15vh, 120px)');
    var grade = document.createElement('div');
    grade.className = 'grade-cartas';
    var colunas = cartas.length <= 4 ? cartas.length : (cartas.length === 6 ? 3 : (cartas.length === 8 ? 4 : 4));
    grade.style.setProperty('--c', cartas.length >= 12 ? 'clamp(88px, 17vh, 132px)' : 'clamp(112px, 21vh, 170px)');
    grade.style.gridTemplateColumns = 'repeat(' + colunas + ', var(--c))';
    t.appendChild(grade);

    var travado = true, primeira = null, achadas = 0;
    var corVerso = TEMAS_PAR[tema].cor;

    cartas.forEach(function (item) {
      var b = document.createElement('button');
      b.className = 'carta virada';
      b.dataset.nome = item.nome;
      b.innerHTML =
        '<div class="lados">' +
          '<div class="verso" style="background:' + corVerso + '"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="8"/><circle cx="50" cy="50" r="10" fill="rgba(255,255,255,.7)"/></svg></div>' +
          '<div class="frente">' + item.svg + '</div>' +
        '</div>';
      grade.appendChild(b);

      b.addEventListener('click', function () {
        if (C.estaBloqueado()) return;
        if (b.classList.contains('achada') || b.classList.contains('virada')) { C.falarJa(item.nome); return; }
        if (travado) return;
        b.classList.add('virada');
        C.falarJa(item.nome);
        if (!primeira) { primeira = b; return; }
        if (primeira.dataset.nome === b.dataset.nome) {
          var a = primeira; primeira = null;
          daqui(500, function () {
            a.classList.add('achada'); b.classList.add('achada');
            acertou(2);
            achadas++;
            if (achadas === quantosPares) daqui(900, rodadaDoPadrao);
          });
        } else {
          travado = true;
          var a2 = primeira; primeira = null;
          daqui(1400, function () { a2.classList.remove('virada'); b.classList.remove('virada'); travado = false; });
        }
      });
    });

    C.falar('Olha as figuras!');
    daqui(3000, function () {
      Array.prototype.forEach.call(grade.children, function (c) { c.classList.remove('virada'); });
      daqui(800, function () { travado = false; C.falar('Agora ache as duas iguais.'); });
    });

    // ---- rodada extra: qual vem depois? (forma, cor ou tamanho) ----
    function rodadaDoPadrao() {
      var t2 = tabuleiro('', 'clamp(76px, 14vh, 116px)');
      var tipo = ['forma', 'cor', 'tamanho'][Math.floor(Math.random() * 3)];
      var A, B, desenhoA, desenhoB;
      if (tipo === 'forma') {
        var pares = embaralhar([['circulo', '#e04a3f'], ['quadrado', '#3a72c4'], ['triangulo', '#f2b705'], ['estrela', '#f19a3e']]).slice(0, 2);
        A = pares[0]; B = pares[1];
        desenhoA = forma(A[0], A[1], false); desenhoB = forma(B[0], B[1], false);
      } else if (tipo === 'cor') {
        var cores = embaralhar(['#e04a3f', '#3a72c4', '#f2b705', '#4aa657', '#e987b8']).slice(0, 2);
        A = ['circulo', cores[0]]; B = ['circulo', cores[1]];
        desenhoA = forma('circulo', cores[0], false); desenhoB = forma('circulo', cores[1], false);
      } else {
        var cor = ['#e04a3f', '#3a72c4', '#4aa657'][Math.floor(Math.random() * 3)];
        A = ['grande', cor]; B = ['pequeno', cor];
        desenhoA = svgCirculoTamanho(42, cor); desenhoB = svgCirculoTamanho(20, cor);
      }
      var fila = document.createElement('div');
      fila.className = 'fila-padrao';
      [desenhoA, desenhoB, desenhoA].forEach(function (d) {
        var casa = document.createElement('div'); casa.className = 'casa-padrao'; casa.innerHTML = d; fila.appendChild(casa);
      });
      var vazia = document.createElement('div'); vazia.className = 'casa-padrao vazia'; vazia.textContent = '?'; fila.appendChild(vazia);
      t2.appendChild(fila);

      var opcoes = document.createElement('div');
      opcoes.className = 'fila-opcoes';
      embaralhar([['B', desenhoB], ['A', desenhoA]]).forEach(function (o) {
        var b = document.createElement('button');
        b.className = 'opcao-padrao';
        b.innerHTML = o[1];
        b.addEventListener('click', function () {
          if (C.estaBloqueado()) return;
          if (o[0] !== 'B') {                                // errou: a opção "vai e volta" devagar, sem som
            b.classList.remove('voltando'); void b.offsetWidth; b.classList.add('voltando');
            return;
          }
          vazia.classList.remove('vazia'); vazia.textContent = ''; vazia.innerHTML = desenhoB;
          acertou(4);
          completarRodada('par', 4);
          terminar('Você achou!', CONVITE_PAR, DICA_PAR);
        });
        opcoes.appendChild(b);
      });
      t2.appendChild(opcoes);
      C.falar('Qual vem depois?');
    }
  }

  /* =========================================================
     BRINCADEIRA 3 - CONTAR E ORDENAR
     1) ordenar objetos por tamanho, 2) contar tocando, 3) dar N para o gatinho
     ========================================================= */
  var CONVITE_ORDEM = 'Vamos contar as colheres da mesa?';
  var DICA_ORDEM = 'Conte junto com ela, devagar, apontando um de cada vez.';
  var NUMEROS = ['um', 'dois', 'três', 'quatro', 'cinco'];
  var NUMEROS_F = ['uma', 'duas', 'três', 'quatro', 'cinco'];

  function atividadeContar() {
    var nivel = progresso('ordem').nivel;
    comecarRodada('ordem');

    // ---- 1) ordenar por tamanho ----
    function rodadaTamanho() {
      var chaves = ['bola', 'urso', 'copo'];
      var obj = OBJETOS[chaves[Math.floor(Math.random() * chaves.length)]];
      var quantos = nivel === 1 ? 3 : 4;
      var t = tabuleiro('', 'clamp(84px, 17vh, 132px)');
      var alvos = [];
      var passo = 100 / (quantos + 1);
      var tamanhos = quantos === 3 ? [0.55, 0.78, 1] : [0.5, 0.68, 0.85, 1];
      for (var i = 1; i <= quantos; i++) {
        var a = novoAlvo('<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="18" fill="#ece4d4" stroke="#c2b7a1" stroke-width="4" stroke-dasharray="9 8"/></svg>', passo * i, 36);
        a.dataset.ordem = String(i);
        t.appendChild(a); alvos.push(a);
      }
      var faltam = quantos;
      var lista = tamanhos.map(function (f, i) { return { ordem: i + 1, fator: f }; });
      embaralhar(lista).forEach(function (c, i) {
        var p = novaPeca('<div class="objeto" style="transform:scale(' + c.fator + ')">' + obj.svg + '</div>', passo * (i + 1), 82);
        p.dataset.ordem = String(c.ordem);
        t.appendChild(p);
        arrastavel(p, {
          aoToque: function () { dizerNome(c.ordem === 1 ? 'pequeno' : (c.ordem === quantos ? 'grande' : 'médio')); },
          aoSoltar: function (el) {
            var alvo = alvoMaisPerto(el, alvos);
            if (alvo && alvo.dataset.ordem === el.dataset.ordem) {
              encaixarEm(el, alvo); acertou(3); faltam--;
              if (faltam === 0) { C.falar('Do pequeno ao grande!'); daqui(1800, rodadaContar); }
            } else voltarPraCasa(el);
          }
        });
      });
      C.falar('Coloque ' + obj.artPlural + ' ' + obj.plural + ' do menorzinho para o maior.');
    }

    // ---- 2) contar tocando ----
    function rodadaContar() {
      var chaves = ['patinho', 'bola', 'urso'];
      var obj = OBJETOS[chaves[Math.floor(Math.random() * chaves.length)]];
      var quantos = nivel === 1 ? 2 + Math.floor(Math.random() * 2) : 3 + Math.floor(Math.random() * 3);   // 2-3 ou 3-5
      var t = tabuleiro('', 'clamp(96px, 19vh, 150px)');
      var contados = 0;
      var passo = 100 / (quantos + 1);
      for (var i = 0; i < quantos; i++) {
        (function (i) {
          var p = novaPeca(obj.svg, passo * (i + 1), 50, 'contavel');
          p.classList.add('fixa');
          t.appendChild(p);
          p.addEventListener('pointerdown', function (e) {
            e.preventDefault();
            if (C.estaBloqueado() || p.classList.contains('contado')) return;
            p.classList.add('contado');
            contados++;
            C.nota(C.NOTAS[Math.min(contados, 5)], 0.4, 0.05);
            C.falarJa(NUMEROS[contados - 1]);
            if (contados === quantos) {
              daqui(1100, function () {
                C.falar((obj.fem ? NUMEROS_F : NUMEROS)[quantos - 1] + ' ' + obj.plural + '!');
                balancarGatinho();
                daqui(2200, rodadaDar);
              });
            }
          });
        })(i);
      }
      C.falar('Toca em cada ' + obj.nome + ' e conta comigo.');
    }

    // ---- 3) dar N frutas para o gatinho ----
    function rodadaDar() {
      var quantas = nivel === 1 ? 2 : 3;
      var total = 4;
      var t = tabuleiro('', 'clamp(84px, 17vh, 128px)');
      var gato = document.createElement('div');
      gato.className = 'gato-cesto';
      gato.innerHTML = svgAnimal('gato');
      t.appendChild(gato);
      var entregues = 0;
      var passo = 100 / (total + 1);
      for (var i = 0; i < total; i++) {
        var p = novaPeca(FRUTAS.maca.svg, passo * (i + 1), 80);
        t.appendChild(p);
        arrastavel(p, {
          aoToque: function () { dizerNome('maçã'); },
          aoSoltar: function (el) {
            if (entregues >= quantas) { voltarPraCasa(el); return; }
            var alvo = alvoMaisPerto(el, [gato]);
            if (!alvo) { voltarPraCasa(el); return; }
            var rg = gato.getBoundingClientRect(), rp = el.getBoundingClientRect();
            el._dx += (rg.left + rg.width * (0.3 + 0.2 * entregues)) - (rp.left + rp.width / 2);
            el._dy += (rg.top + rg.height * 0.85) - (rp.top + rp.height / 2);
            el.style.transition = 'transform .45s ease'; aplicar(el); el.classList.add('fixa');
            entregues++;
            acertou(2);
            C.falarJa(NUMEROS[entregues - 1]);
            if (entregues === quantas) {
              daqui(1000, function () {
                C.falar('O gatinho ganhou ' + (quantas === 2 ? 'duas' : 'três') + ' maçãs!');
                balancarGatinho();
                completarRodada('ordem', 3);
                terminar('Você contou direitinho!', CONVITE_ORDEM, DICA_ORDEM);
              });
            }
          }
        });
      }
      C.falar('Dê ' + (quantas === 2 ? 'duas' : 'três') + ' maçãs para o gatinho.');
    }

    rodadaTamanho();
  }
  var atividadeOrdem = atividadeContar;   // nome antigo

  /* =========================================================
     BRINCADEIRA 4 - PARE E SIGA (esperar a vez)
     ========================================================= */
  var CONVITE_PARE = 'Vamos dançar e parar quando o papai disser PARE?';
  var DICA_PARE = 'Elogie a espera, não o acerto: você conseguiu esperar!';

  /* Quer que o app também FALE "verde" e "vermelho"?
     Deixe true. A palavra sai fora da fila e a cor só muda quando a voz
     realmente começa - nunca antes. Em false (o normal), só os sons curtos,
     que são sempre certeiros. */
  var FALAR_AS_CORES = false;

  // "ding" suave e agudo = verde
  function somDoVerde() {
    var c = C.audio();
    if (!c) return;
    var t = c.currentTime;
    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    g.connect(c.destination);
    var o1 = c.createOscillator();
    o1.type = 'sine'; o1.frequency.value = 1046.5;
    o1.connect(g);
    var o2 = c.createOscillator();
    o2.type = 'sine'; o2.frequency.value = 1568;
    var g2 = c.createGain(); g2.gain.value = 0.3;
    o2.connect(g2); g2.connect(g);
    o1.start(t); o1.stop(t + 0.6);
    o2.start(t); o2.stop(t + 0.6);
  }

  // "tum" grave e macio = vermelho
  function somDoVermelho() {
    var c = C.audio();
    if (!c) return;
    var t = c.currentTime;
    var lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 600;
    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.10, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    var o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(78, t + 0.16);
    o.connect(g); g.connect(lp); lp.connect(c.destination);
    o.start(t); o.stop(t + 0.5);
  }

  function atividadePare() {
    var t = tabuleiro('', 'clamp(76px, 15vh, 120px)');
    var bolota = document.createElement('div');
    bolota.className = 'bolota';
    t.appendChild(bolota);

    var verde = false;
    var jaTeveVermelho = false;
    var jogando = false;
    var comecou = false;
    var fim = 0;

    var tocouNoVermelho = false;              // só desta fase vermelha
    var esperouAlgumaVez = false;             // passou por um vermelho inteiro sem tocar?

    function reanimar(classe, ms) {
      bolota.classList.remove('pula', 'encolhe');
      void bolota.offsetWidth;
      bolota.classList.add(classe);
      daqui(ms, function () { bolota.classList.remove(classe); });
    }

    bolota.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      if (C.estaBloqueado() || !jogando) return;
      if (verde) {
        // verde + toque: a bola pula, som alegre, o gatinho dá um pulinho
        reanimar('pula', 700);
        var i = Math.floor(Math.random() * 4);
        C.nota(C.NOTAS[i], 0.28, 0.06);
        daqui(120, function () { C.nota(C.NOTAS[i + 2], 0.36, 0.05); });
        if (C.gatinho) C.gatinho.pula();
      } else {
        // vermelho + toque: a bola encolhe um pouquinho, som grave curto,
        // o gatinho tapa os olhos. Sem palavra de erro, sem contar nada.
        tocouNoVermelho = true;
        reanimar('encolhe', 600);            // sem som: só a bola encolhe e o gatinho tapa os olhos
        if (C.gatinho) C.gatinho.tapaOlhos();
      }
    });

    // a cor e o som saem juntos, na mesma linha, sem esperar nada
    function acenderSinal(paraVerde) {
      if (paraVerde && verde === false && comecou && !tocouNoVermelho && jaTeveVermelho) esperouAlgumaVez = true;
      if (!paraVerde) { tocouNoVermelho = false; jaTeveVermelho = true; }
      verde = paraVerde;
      bolota.classList.toggle('verde', paraVerde);
      bolota.classList.toggle('vermelha', !paraVerde);
      if (paraVerde) somDoVerde(); else somDoVermelho();
    }

    function trocarSinal(paraVerde) {
      if (!FALAR_AS_CORES) { acenderSinal(paraVerde); return; }
      // com palavra: corta a fila e só acende quando a voz COMEÇA de verdade
      var jaAcendeu = false;
      function acender() {
        if (jaAcendeu) return;
        jaAcendeu = true;
        acenderSinal(paraVerde);
      }
      C.falarSinal(paraVerde ? 'verde' : 'vermelho', acender);
      daqui(300, acender);      // se a voz não começar em 300 ms, acende assim mesmo
    }

    // meio segundo "respirando" antes de mudar, para ela antecipar
    function respirarEtrocar(paraVerde) {
      if (!jogando) return;
      bolota.classList.add('respirando');
      daqui(500, function () {
        bolota.classList.remove('respirando');
        if (!jogando) return;
        trocarSinal(paraVerde);
        agendarProxima();
      });
    }

    function agendarProxima() {
      daqui(4000 + Math.random() * 2000, function () {     // no mínimo 4 segundos em cada cor
        if (!jogando) return;
        if (Date.now() >= fim) { fecharJogo(); return; }
        respirarEtrocar(!verde);
      });
    }

    function fecharJogo() {
      jogando = false;
      // se o jogo acabou no vermelho e ela não tocou, também conta como espera
      if (!verde && jaTeveVermelho && !tocouNoVermelho) esperouAlgumaVez = true;
      bolota.classList.remove('verde', 'vermelha', 'respirando');
      if (C.gatinho) C.gatinho.aplaude();      // o gatinho aplaude a tentativa
      if (esperouAlgumaVez) {
        terminar('Você esperou o vermelho!', CONVITE_PARE, DICA_PARE);
      } else {
        terminar('Que legal brincar de pare e siga!', CONVITE_PARE, DICA_PARE);
      }
    }

    // a explicação é falada ANTES de começar; durante o jogo nada mais é falado
    function comecarJogo() {
      if (comecou) return;
      comecou = true;
      jogando = true;
      fim = Date.now() + 60000;                 // um minutinho
      respirarEtrocar(true);
    }

    C.falar('Quando ficar verde, pode tocar. Quando ficar vermelho, espera.', comecarJogo);
    daqui(9000, comecarJogo);                   // rede de segurança, se a voz falhar
  }

  /* =========================================================
     BRINCADEIRA 5 - SEPARAR (classificar animais)
     Cada rodada tem um cenário: água/terra, voa/não voa, grande/pequeno.
     6 bichos no nível 1, 8 depois (progressão automática).
     ========================================================= */
  var CONVITE_CLASSIFICAR = 'Vamos achar um bichinho no livro e ver onde ele mora?';
  var DICA_CLASSIFICAR = 'Pergunte: esse bicho mora na água ou na terra?';

  // os fundos dos cestos (SVG, cores chapadas, animação bem lenta)
  var CENARIOS = {
    agua: '<svg viewBox="0 0 300 160" preserveAspectRatio="none">' +
          '<rect width="300" height="160" fill="#cfe6f7"/>' +
          '<rect y="90" width="300" height="70" fill="#a9d1ef"/>' +
          '<path class="onda" d="M-20 92 q25 -14 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0" fill="none" stroke="#7fb5e0" stroke-width="5" stroke-linecap="round"/>' +
          '<path d="M40 130 q12 -8 24 0 l-8 6 l8 6 q-12 8 -24 0 Z" fill="#8fc2e6"/>' +
          '<path d="M220 118 q12 -8 24 0 l-8 6 l8 6 q-12 8 -24 0 Z" fill="#8fc2e6"/>' +
          '<circle class="bolha b1" cx="120" cy="140" r="5" fill="none" stroke="#ffffff" stroke-width="2"/>' +
          '<circle class="bolha b2" cx="180" cy="150" r="4" fill="none" stroke="#ffffff" stroke-width="2"/>' +
          '<circle class="bolha b3" cx="260" cy="145" r="6" fill="none" stroke="#ffffff" stroke-width="2"/>' +
          '</svg>',
    terra: '<svg viewBox="0 0 300 160" preserveAspectRatio="none">' +
           '<rect width="300" height="160" fill="#e6f2ff"/>' +
           '<circle cx="250" cy="34" r="20" fill="#ffcf5c"/>' +
           '<rect y="100" width="300" height="60" fill="#a8d38f"/>' +
           '<path d="M0 100 q15 -10 30 0 q15 -10 30 0 q15 -10 30 0 q15 -10 30 0 q15 -10 30 0 q15 -10 30 0 q15 -10 30 0 q15 -10 30 0 q15 -10 30 0 q15 -10 30 0" fill="#a8d38f"/>' +
           '<rect x="52" y="60" width="14" height="46" fill="#8a6a4a"/>' +
           '<circle cx="59" cy="52" r="30" fill="#6fae7c"/>' +
           '</svg>',
    ceu: '<svg viewBox="0 0 300 160" preserveAspectRatio="none">' +
         '<rect width="300" height="160" fill="#d6ebfb"/>' +
         '<g class="nuvem n1" fill="#ffffff"><ellipse cx="70" cy="50" rx="34" ry="16"/><ellipse cx="52" cy="42" rx="18" ry="14"/><ellipse cx="88" cy="40" rx="20" ry="15"/></g>' +
         '<g class="nuvem n2" fill="#ffffff"><ellipse cx="220" cy="90" rx="38" ry="17"/><ellipse cx="200" cy="80" rx="20" ry="15"/><ellipse cx="240" cy="78" rx="22" ry="16"/></g>' +
         '</svg>',
    chao: '<svg viewBox="0 0 300 160" preserveAspectRatio="none">' +
          '<rect width="300" height="160" fill="#f1e7d2"/>' +
          '<rect y="70" width="300" height="90" fill="#a8d38f"/>' +
          '<path d="M30 70 l6 -14 l6 14 M110 70 l6 -14 l6 14 M200 70 l6 -14 l6 14 M260 70 l6 -14 l6 14" fill="none" stroke="#6fae7c" stroke-width="4" stroke-linecap="round"/>' +
          '</svg>',
    neutro: '<svg viewBox="0 0 300 160" preserveAspectRatio="none"><rect width="300" height="160" fill="#f6e8d6"/></svg>',
    neutro2: '<svg viewBox="0 0 300 160" preserveAspectRatio="none"><rect width="300" height="160" fill="#f3e3ec"/></svg>'
  };

  var CASA_REFERENCIA =
    '<svg viewBox="0 0 100 100">' +
    '<path d="M50 8 L92 46 H8 Z" fill="#e04a3f" stroke="' + CT + '" stroke-width="4" stroke-linejoin="round"/>' +
    '<rect x="18" y="46" width="64" height="46" fill="#fdf3df" stroke="' + CT + '" stroke-width="4"/>' +
    '<rect x="42" y="62" width="16" height="30" fill="#b07a4a" stroke="' + CT + '" stroke-width="4"/>' +
    '</svg>';

  var RODADAS_SEPARAR = [
    { campo: 'onde', fala: 'Cada bicho no seu lugar: água ou terra.',
      cestos: [['agua', 'Água', 'agua'], ['terra', 'Terra', 'terra']],
      grupoA: ['peixe', 'tartaruga', 'pato', 'baleia', 'sapo'], grupoB: ['gato', 'coelho', 'vaca', 'cavalo', 'rato'],
      criterio: 'Os da água na água, os da terra na terra!' },
    { campo: 'voa', fala: 'Quem voa vai para o céu. Quem não voa fica no chão.',
      cestos: [[true, 'Voa', 'ceu'], [false, 'Não voa', 'chao']],
      grupoA: ['passarinho', 'borboleta', 'abelha'], grupoB: ['gato', 'vaca', 'elefante', 'tartaruga', 'rato', 'coelho'],
      criterio: 'Os que voam no céu, os outros no chão!' },
    { campo: 'tamanho', fala: 'Separe: bicho grande e bicho pequeno. Olhe a casinha.',
      cestos: [['grande', 'Grande', 'neutro'], ['pequeno', 'Pequeno', 'neutro2']],
      grupoA: ['elefante', 'vaca', 'cavalo', 'baleia'], grupoB: ['rato', 'passarinho', 'abelha', 'borboleta', 'sapo'],
      criterio: 'Todos os grandes juntos e todos os pequenos juntos!', comCasa: true }
  ];
  var ultimaRodadaSeparar = -1;

  // em qual cesto o bicho foi solto? (o centro dele dentro do cesto, com 40 px de folga)
  function cestoOnde(el, cestos) {
    var rp = el.getBoundingClientRect();
    var cx = rp.left + rp.width / 2, cy = rp.top + rp.height / 2;
    for (var i = 0; i < cestos.length; i++) {
      var r = cestos[i].getBoundingClientRect();
      if (cx >= r.left - 40 && cx <= r.right + 40 && cy >= r.top - 40 && cy <= r.bottom + 40) return cestos[i];
    }
    return null;
  }

  function valorDoBicho(bicho, campo) {
    var a = ANIMAIS[bicho];
    if (campo === 'voa') return !!a.voa;
    return a[campo];
  }

  function atividadeClassificar() {
    var nivel = progresso('classificar').nivel;      // 1 ou 2
    var quantos = nivel >= 2 ? 8 : 6;
    var i;
    do { i = Math.floor(Math.random() * RODADAS_SEPARAR.length); } while (i === ultimaRodadaSeparar);
    ultimaRodadaSeparar = i;
    var r = RODADAS_SEPARAR[i];
    comecarRodada('classificar');

    var t = tabuleiro('', quantos === 8 ? 'clamp(80px, 16vh, 118px)' : 'clamp(90px, 18vh, 132px)');
    var cestos = [];

    r.cestos.forEach(function (c, k) {
      var el = document.createElement('div');
      el.className = 'cesto com-cenario';
      el.style.left = (k === 0 ? 3 : 52) + '%';
      el.style.top = '4%';
      el.style.width = '45%';
      el.style.height = '46%';
      el.innerHTML = '<div class="cenario">' + CENARIOS[c[2]] + '</div><span class="rotulo-cesto">' + c[1] + '</span>';
      el.dataset.valor = String(c[0]);
      el.dataset.quantos = '0';
      t.appendChild(el);
      cestos.push(el);
    });

    if (r.comCasa) {
      var casa = document.createElement('div');
      casa.className = 'casa-referencia';
      casa.innerHTML = CASA_REFERENCIA;
      t.appendChild(casa);
    }

    // metade de cada grupo
    var metade = quantos / 2;
    var bichos = embaralhar(embaralhar(r.grupoA).slice(0, metade).concat(embaralhar(r.grupoB).slice(0, metade)));
    var faltam = bichos.length;

    bichos.forEach(function (bicho, k) {
      var x, y;
      if (quantos === 8) { x = 11 + (k % 4) * 23; y = k < 4 ? 64 : 88; }
      else { x = 18 + (k % 3) * 28; y = k < 3 ? 64 : 88; }
      var p = novaPeca(svgAnimal(bicho), x, y);
      if (r.campo === 'tamanho' && ANIMAIS[bicho].tamanho === 'pequeno') p.classList.add('bicho-pequeno');
      p.dataset.bicho = bicho;
      t.appendChild(p);

      arrastavel(p, {
        aoToque: function () { somDoAnimal(bicho); },
        aoSoltar: function (el) {
          var cesto = cestoOnde(el, cestos);
          if (!cesto || cesto.dataset.valor !== String(valorDoBicho(bicho, r.campo))) { voltarPraCasa(el); return; }
          var n = Number(cesto.dataset.quantos);
          cesto.dataset.quantos = String(n + 1);
          var rc = cesto.getBoundingClientRect(), rp = el.getBoundingClientRect();
          var colunas = quantos === 8 ? 4 : 3;
          var alvoX = rc.left + rc.width * ((n % colunas) + 0.5) / colunas;
          var alvoY = rc.top + rc.height * (n < colunas ? 0.62 : 0.82);
          el._dx += alvoX - (rp.left + rp.width / 2);
          el._dy += alvoY - (rp.top + rp.height / 2);
          el.style.transition = 'transform .45s ease';
          aplicar(el);
          el.classList.add('fixa');
          acertou(2);
          // o bicho reage: nada, voa, pula ou faz o som dele
          var a = ANIMAIS[bicho];
          var reacao = (a.onde === 'agua' && !a.voa) ? 'reage-nada' : (a.voa || a.nome === 'passarinho' ? 'reage-voa' : (a.nome === 'sapo' || a.nome === 'coelho' ? 'reage-pula' : 'reage-som'));
          daqui(480, function () { el.classList.add(reacao); somDoAnimal(bicho, true); });
          faltam--;
          if (faltam === 0) {
            daqui(1500, function () {
              C.falar(r.criterio);
              balancarGatinho();
              completarRodada('classificar', 2);
              terminar('Tudo separadinho!', CONVITE_CLASSIFICAR, DICA_CLASSIFICAR);
            });
          }
        }
      });
    });

    C.falar(r.fala);
    C.falar('Toque no bicho para ouvir o nome.');
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

    C.dicaAtual = {
      encaixar: 'Leva a peça até a sombra dela!',
      par: 'Vira duas cartas iguais!',
      ordem: 'Toca nos bichinhos e conta!',
      pare: false,                    // no Pare e siga ninguém fala durante o jogo
      classificar: 'Leva o bicho para a casa dele!'
    }[nome];

    daqui(80, function () {
      if (nome === 'encaixar') atividadeEncaixar();
      else if (nome === 'par') atividadePar();
      else if (nome === 'ordem') atividadeContar();
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
