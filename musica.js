/* ============================================================
   Cecí - MÚSICA
   Tocar (xilofone, piano, tambor, chocalho, triângulo, sinos),
   Dançar (estátua / rápido e devagar / gestos), Cantar (letra em
   versos grandes), Bichos musicais (Carnaval dos Animais) e Sons
   dos bichos.

   O repertório está em musicas.js. Cada música é sintetizada aqui em
   4 camadas (melodia, acordes, baixo, percussão). Se existir uma
   gravação em audio/musicas/<chave>.mp3, ela é usada no lugar.
   Os sons de tocar são "assados" antes em buffers, para sair na hora.
   ============================================================ */
(function () {
  'use strict';

  var C = window.Ceci;
  var M = window.CeciMusicas;
  var palco = document.getElementById('palco-som');
  if (!palco || !M) return;

  var relogios = [];
  var intervalos = [];
  var atividadeAtual = null;

  function daqui(ms, fn) { var t = setTimeout(fn, ms); relogios.push(t); return t; }
  function cada(ms, fn) { var t = setInterval(fn, ms); intervalos.push(t); return t; }
  function limparRelogios() {
    relogios.forEach(clearTimeout); relogios = [];
    intervalos.forEach(clearInterval); intervalos = [];
  }
  function embaralhar(lista) {
    var a = lista.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  /* ---------------------------------------------------------
     1) Encanamento do som
     --------------------------------------------------------- */
  var mestre = null;        // volume geral, moderado
  var buffers = {};         // sons prontos
  var preparando = false;
  var prontos = false;

  function ctx() { return C.audio(); }

  function saida() {
    var c = ctx();
    if (!c) return null;
    if (!mestre || mestre.context !== c) {
      mestre = c.createGain();
      mestre.gain.value = 0.55;      // volume moderado
      mestre.connect(c.destination);
    }
    return mestre;
  }

  function ruido(oc, segundos) {
    var n = Math.max(1, Math.ceil(oc.sampleRate * segundos));
    var b = oc.createBuffer(1, n, oc.sampleRate);
    var d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  // "assa" um som uma vez só, fora do tempo real
  function assar(duracao, montar) {
    var c = ctx();
    var OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!c || !OAC) return Promise.resolve(null);
    try {
      var oc = new OAC(1, Math.ceil(c.sampleRate * duracao), c.sampleRate);
      montar(oc);
      var p = oc.startRendering();
      return (p && p.then) ? p : Promise.resolve(null);
    } catch (e) {
      return Promise.resolve(null);
    }
  }

  // xilofone: madeira macia, sem brilho agressivo
  function montarTecla(oc, freq) {
    var lp = oc.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 3000;
    var g = oc.createGain();
    g.gain.setValueAtTime(0.0001, 0);
    g.gain.exponentialRampToValueAtTime(0.85, 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, 1.15);
    g.connect(lp); lp.connect(oc.destination);
    var o1 = oc.createOscillator();
    o1.type = 'triangle'; o1.frequency.value = freq;
    var g1 = oc.createGain(); g1.gain.value = 0.75;
    o1.connect(g1); g1.connect(g);
    var o2 = oc.createOscillator();       // um harmônico curtinho, de sininho
    o2.type = 'sine'; o2.frequency.value = freq * 2.01;
    var g2 = oc.createGain();
    g2.gain.setValueAtTime(0.3, 0);
    g2.gain.exponentialRampToValueAtTime(0.001, 0.4);
    o2.connect(g2); g2.connect(g);
    o1.start(0); o1.stop(1.25);
    o2.start(0); o2.stop(0.55);
  }

  // piano: redondo, com um pouco de corpo e decaimento mais longo
  function montarPiano(oc, freq) {
    var lp = oc.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 2600;
    var g = oc.createGain();
    g.gain.setValueAtTime(0.0001, 0);
    g.gain.exponentialRampToValueAtTime(0.8, 0.008);
    g.gain.exponentialRampToValueAtTime(0.25, 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, 1.7);
    g.connect(lp); lp.connect(oc.destination);
    [[1, 0.7, 'triangle'], [2, 0.25, 'sine'], [3, 0.1, 'sine'], [0.5, 0.2, 'sine']].forEach(function (p) {
      var o = oc.createOscillator();
      o.type = p[2]; o.frequency.value = freq * p[0];
      var gp = oc.createGain(); gp.gain.value = p[1];
      o.connect(gp); gp.connect(g);
      o.start(0); o.stop(1.8);
    });
  }

  // triângulo: metálico, fininho, mas sem estridência (filtro em 6 kHz)
  function montarTriangulo(oc) {
    var lp = oc.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 6000;
    var g = oc.createGain();
    g.gain.setValueAtTime(0.0001, 0);
    g.gain.exponentialRampToValueAtTime(0.35, 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, 1.4);
    g.connect(lp); lp.connect(oc.destination);
    [2637, 4186, 5274].forEach(function (f, i) {
      var o = oc.createOscillator();
      o.type = 'sine'; o.frequency.value = f;
      var gp = oc.createGain(); gp.gain.value = [0.6, 0.35, 0.2][i];
      o.connect(gp); gp.connect(g);
      o.start(0); o.stop(1.5);
    });
  }

  // sino: parciais inarmônicos suaves
  function montarSino(oc, freq) {
    var lp = oc.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 5000;
    var g = oc.createGain();
    g.gain.setValueAtTime(0.0001, 0);
    g.gain.exponentialRampToValueAtTime(0.5, 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, 1.6);
    g.connect(lp); lp.connect(oc.destination);
    [[1, 0.6], [2.4, 0.25], [3.9, 0.12]].forEach(function (p) {
      var o = oc.createOscillator();
      o.type = 'sine'; o.frequency.value = freq * p[0];
      var gp = oc.createGain(); gp.gain.value = p[1];
      o.connect(gp); gp.connect(g);
      o.start(0); o.stop(1.7);
    });
  }

  function montarTambor(oc) {
    var g = oc.createGain();
    g.gain.setValueAtTime(0.0001, 0);
    g.gain.exponentialRampToValueAtTime(0.9, 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, 0.5);
    g.connect(oc.destination);
    var o = oc.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(180, 0);
    o.frequency.exponentialRampToValueAtTime(58, 0.18);
    o.connect(g);
    o.start(0); o.stop(0.6);
    var f = oc.createBufferSource();      // a "pele" do tambor
    f.buffer = ruido(oc, 0.06);
    var lp = oc.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 900;
    var gr = oc.createGain();
    gr.gain.setValueAtTime(0.45, 0);
    gr.gain.exponentialRampToValueAtTime(0.001, 0.07);
    f.connect(lp); lp.connect(gr); gr.connect(oc.destination);
    f.start(0);
  }

  function montarChocalho(oc) {
    var f = oc.createBufferSource();
    f.buffer = ruido(oc, 0.3);
    var bp = oc.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 3200; bp.Q.value = 1.1;
    var lp = oc.createBiquadFilter();     // tira o chiado agudo demais
    lp.type = 'lowpass'; lp.frequency.value = 5200;
    var g = oc.createGain();
    g.gain.setValueAtTime(0.0001, 0);
    g.gain.linearRampToValueAtTime(0.5, 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, 0.22);
    f.connect(bp); bp.connect(lp); lp.connect(g); g.connect(oc.destination);
    f.start(0);
  }

  // percussao levissima das músicas: um chiadinho curto
  function montarTique(oc) {
    var f = oc.createBufferSource();
    f.buffer = ruido(oc, 0.12);
    var bp = oc.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = 0.8;
    var lp = oc.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 4200;
    var g = oc.createGain();
    g.gain.setValueAtTime(0.0001, 0);
    g.gain.linearRampToValueAtTime(0.35, 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, 0.10);
    f.connect(bp); bp.connect(lp); lp.connect(g); g.connect(oc.destination);
    f.start(0);
  }

  // notas do xilofone: escala pentatônica (dó ré mi sol lá)
  var PENTA = [523.25, 587.33, 659.25, 783.99, 880.00];
  var CORES_TECLAS = ['#e04a3f', '#f2b705', '#4aa657', '#3a72c4', '#e987b8'];
  // piano: dó a dó (dó4 ... dó5)
  var PIANO = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
  var NOMES_PIANO = ['dó', 'ré', 'mi', 'fá', 'sol', 'lá', 'si', 'dó'];
  var SINOS = [1046.5, 1318.5, 1568.0];

  function prepararSons() {
    if (prontos || preparando) return;
    var c = ctx();
    if (!c) return;
    preparando = true;
    var tarefas = [];
    PENTA.forEach(function (f, i) {
      tarefas.push(assar(1.3, function (oc) { montarTecla(oc, f); }).then(function (b) { buffers['tecla' + i] = b; }));
    });
    PIANO.forEach(function (f, i) {
      tarefas.push(assar(1.9, function (oc) { montarPiano(oc, f); }).then(function (b) { buffers['piano' + i] = b; }));
    });
    SINOS.forEach(function (f, i) {
      tarefas.push(assar(1.8, function (oc) { montarSino(oc, f); }).then(function (b) { buffers['sino' + i] = b; }));
    });
    tarefas.push(assar(0.7, montarTambor).then(function (b) { buffers.tambor = b; }));
    tarefas.push(assar(0.35, montarChocalho).then(function (b) { buffers.chocalho = b; }));
    tarefas.push(assar(1.5, montarTriangulo).then(function (b) { buffers.triangulo = b; }));
    tarefas.push(assar(0.16, montarTique).then(function (b) { buffers.tique = b; }));
    Promise.all(tarefas).then(function () {
      prontos = true;
      preparando = false;
    }).catch(function () { preparando = false; });
  }

  function tocarBuffer(nome, volume, quando) {
    var c = ctx(), m = saida();
    if (!c || !m) return;
    var b = buffers[nome];
    if (!b) { C.nota(PENTA[0], 0.3, 0.05); return; }   // ainda assando: som simples
    var s = c.createBufferSource();
    s.buffer = b;
    var g = c.createGain();
    g.gain.value = (volume == null ? 0.8 : volume);
    s.connect(g); g.connect(m);
    s.start(quando || 0);
    return s;
  }

  /* ---------------------------------------------------------
     2) Notas e acordes com nome
     --------------------------------------------------------- */
  var SEMITONS = { 'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11 };

  function midiDe(nome) {
    var m = /^([A-G][#b]?)(\d)$/.exec(nome);
    if (!m) return 69;
    return SEMITONS[m[1]] + (Number(m[2]) + 1) * 12;
  }
  function freqDeMidi(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }
  function frequencia(nome) { return freqDeMidi(midiDe(nome)); }

  // "C5:1 E5:.5 -:1"  ->  lista de notas e silêncios
  function lerMelodia(texto) {
    return String(texto).trim().split(/\s+/).filter(Boolean).map(function (p) {
      var partes = p.split(':');
      return { nota: partes[0], batidas: partes[1] ? Number(partes[1]) : 1 };
    });
  }

  // 'Am', 'G7', 'Bb', 'F#m' -> as notas do acorde (em midi) e o baixo
  var QUALIDADES = { '': [0, 4, 7], 'm': [0, 3, 7], '7': [0, 4, 7, 10], 'm7': [0, 3, 7, 10], 'dim': [0, 3, 6] };
  function acorde(nome) {
    var m = /^([A-G][#b]?)(m7|m|7|dim)?$/.exec(nome);
    if (!m) return null;
    var raiz = 48 + SEMITONS[m[1]];          // dó3 = 48
    if (raiz < 50) raiz += 12;                // dó e dó# sobem uma oitava (voz mais cheia)
    var notas = QUALIDADES[m[2] || ''].map(function (i) { return raiz + i; });
    return { notas: notas, baixo: raiz - 12 };
  }

  /* ---------------------------------------------------------
     3) Desenhos
     --------------------------------------------------------- */
  var CT = '#3a3630';
  var PELO = '#f7d9a0';

  function gatoSVG(classe) {
    return '<svg class="' + classe + '" viewBox="0 0 200 210" aria-hidden="true">' +
      '<path d="M46 176 q-26 4 -22 -22" fill="none" stroke="' + CT + '" stroke-width="12" stroke-linecap="round"/>' +
      '<path d="M46 176 q-26 4 -22 -22" fill="none" stroke="' + PELO + '" stroke-width="6" stroke-linecap="round"/>' +
      '<ellipse cx="100" cy="156" rx="50" ry="42" fill="' + PELO + '" stroke="' + CT + '" stroke-width="4"/>' +
      '<g class="patinha">' +
        '<path d="M142 158 L166 108" fill="none" stroke="' + CT + '" stroke-width="18" stroke-linecap="round"/>' +
        '<path d="M142 158 L166 108" fill="none" stroke="' + PELO + '" stroke-width="11" stroke-linecap="round"/>' +
        '<circle cx="168" cy="102" r="14" fill="' + PELO + '" stroke="' + CT + '" stroke-width="4"/>' +
      '</g>' +
      '<g class="cabeca">' +
      '<path d="M66 66 L60 26 L94 46 Z" fill="' + PELO + '" stroke="' + CT + '" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M134 66 L140 26 L106 46 Z" fill="' + PELO + '" stroke="' + CT + '" stroke-width="4" stroke-linejoin="round"/>' +
      '<ellipse cx="100" cy="86" rx="44" ry="40" fill="' + PELO + '" stroke="' + CT + '" stroke-width="4"/>' +
      '<circle cx="86" cy="82" r="4.5" fill="' + CT + '"/><circle cx="114" cy="82" r="4.5" fill="' + CT + '"/>' +
      '<path d="M100 98 q-6 8 -12 3 M100 98 q6 8 12 3" fill="none" stroke="' + CT + '" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M46 86 H66 M46 96 H66 M134 86 H154 M134 96 H154" stroke="' + CT + '" stroke-width="3" stroke-linecap="round"/>' +
      '</g>' +
      '</svg>';
  }

  /* o gatinho dançarino: em pé, com dois braços e duas pernas que se mexem */
  function gatoDancarinoSVG(classe) {
    function braco(cls, x0, y0, x1, y1) {
      return '<g class="' + cls + '">' +
        '<path d="M' + x0 + ' ' + y0 + ' L' + x1 + ' ' + y1 + '" fill="none" stroke="' + CT + '" stroke-width="18" stroke-linecap="round"/>' +
        '<path d="M' + x0 + ' ' + y0 + ' L' + x1 + ' ' + y1 + '" fill="none" stroke="' + PELO + '" stroke-width="11" stroke-linecap="round"/>' +
        '<circle cx="' + x1 + '" cy="' + y1 + '" r="13" fill="' + PELO + '" stroke="' + CT + '" stroke-width="4"/>' +
        '</g>';
    }
    return '<svg class="' + classe + '" viewBox="0 0 200 250" aria-hidden="true">' +
      '<g class="rabo">' +
        '<path d="M54 196 q-30 6 -26 -26" fill="none" stroke="' + CT + '" stroke-width="12" stroke-linecap="round"/>' +
        '<path d="M54 196 q-30 6 -26 -26" fill="none" stroke="' + PELO + '" stroke-width="6" stroke-linecap="round"/>' +
      '</g>' +
      '<g class="perna perna-esq"><rect x="66" y="196" width="26" height="42" rx="13" fill="' + PELO + '" stroke="' + CT + '" stroke-width="4"/></g>' +
      '<g class="perna perna-dir"><rect x="108" y="196" width="26" height="42" rx="13" fill="' + PELO + '" stroke="' + CT + '" stroke-width="4"/></g>' +
      '<g class="corpo"><ellipse cx="100" cy="160" rx="48" ry="48" fill="' + PELO + '" stroke="' + CT + '" stroke-width="4"/></g>' +
      braco('braco braco-esq', 60, 138, 30, 186) +
      braco('braco braco-dir', 140, 138, 170, 186) +
      '<g class="cabeca">' +
        '<path d="M66 74 L60 34 L94 54 Z" fill="' + PELO + '" stroke="' + CT + '" stroke-width="4" stroke-linejoin="round"/>' +
        '<path d="M134 74 L140 34 L106 54 Z" fill="' + PELO + '" stroke="' + CT + '" stroke-width="4" stroke-linejoin="round"/>' +
        '<ellipse cx="100" cy="92" rx="44" ry="40" fill="' + PELO + '" stroke="' + CT + '" stroke-width="4"/>' +
        '<circle cx="86" cy="88" r="4.5" fill="' + CT + '"/><circle cx="114" cy="88" r="4.5" fill="' + CT + '"/>' +
        '<path d="M100 104 q-6 8 -12 3 M100 104 q6 8 12 3" fill="none" stroke="' + CT + '" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M46 92 H66 M46 102 H66 M134 92 H154 M134 102 H154" stroke="' + CT + '" stroke-width="3" stroke-linecap="round"/>' +
      '</g>' +
      '</svg>';
  }

  var TAMBOR_SVG =
    '<svg class="tambor" viewBox="0 0 120 110" aria-hidden="true">' +
    '<ellipse cx="60" cy="80" rx="46" ry="16" fill="#c98a5a" stroke="' + CT + '" stroke-width="5"/>' +
    '<path d="M14 80 V44 a46 16 0 0 1 92 0 V80" fill="#e0a878" stroke="' + CT + '" stroke-width="5"/>' +
    '<path d="M20 50 L44 74 M46 44 L74 74 M76 44 L100 70" stroke="#b9754a" stroke-width="4" stroke-linecap="round"/>' +
    '<ellipse cx="60" cy="44" rx="46" ry="16" fill="#f6ead8" stroke="' + CT + '" stroke-width="5"/>' +
    '</svg>';

  var CHOCALHO_SVG =
    '<svg class="chocalho" viewBox="0 0 80 120" aria-hidden="true">' +
    '<rect x="33" y="52" width="14" height="60" rx="7" fill="#c98a5a" stroke="' + CT + '" stroke-width="5"/>' +
    '<ellipse cx="40" cy="38" rx="30" ry="32" fill="#f2b705" stroke="' + CT + '" stroke-width="5"/>' +
    '<circle cx="30" cy="30" r="4" fill="#e0a878"/><circle cx="48" cy="26" r="4" fill="#e0a878"/>' +
    '<circle cx="44" cy="44" r="4" fill="#e0a878"/><circle cx="28" cy="46" r="4" fill="#e0a878"/>' +
    '</svg>';

  var TRIANGULO_SVG =
    '<svg class="triangulo" viewBox="0 0 100 100" aria-hidden="true">' +
    '<path d="M50 14 L88 82 H12 Z" fill="none" stroke="#b3a894" stroke-width="7" stroke-linejoin="round"/>' +
    '<path d="M50 14 L88 82 H12 Z" fill="none" stroke="#e6ddcd" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M50 4 V14" stroke="' + CT + '" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M62 40 L80 92" stroke="' + CT + '" stroke-width="5" stroke-linecap="round"/>' +
    '</svg>';

  function sinoSVG(cor) {
    return '<svg class="sino" viewBox="0 0 80 100" aria-hidden="true">' +
      '<path d="M40 10 q4 0 4 4 v6 h-8 v-6 q0 -4 4 -4 Z" fill="' + CT + '"/>' +
      '<path d="M14 72 q0 -40 26 -52 q26 12 26 52 Z" fill="' + cor + '" stroke="' + CT + '" stroke-width="5" stroke-linejoin="round"/>' +
      '<rect x="8" y="70" width="64" height="12" rx="6" fill="' + cor + '" stroke="' + CT + '" stroke-width="5"/>' +
      '<circle cx="40" cy="88" r="7" fill="' + CT + '"/>' +
      '</svg>';
  }

  // bichos do Carnaval dos Animais que não existem no brincar.js
  var VB = '0 0 120 100';
  var BICHOS_EXTRA = {
    cisne: { nome: 'o cisne', frase: 'É o cisne!', mexe: 'desliza', svg:
      '<svg viewBox="' + VB + '"><g fill="none" stroke="' + CT + '" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">' +
      '<path d="M14 62 q34 34 72 0 l-8 22 h-56 Z" fill="#ffffff"/>' +
      '<path d="M82 60 q12 -34 -8 -46 q-16 -8 -20 8 q-4 12 8 16" fill="#ffffff"/>' +
      '<path d="M54 22 l-14 5 l14 5 Z" fill="#f19a3e" stroke-width="3"/>' +
      '<path d="M6 92 q12 -8 24 0 q12 8 24 0 q12 -8 24 0 q12 8 24 0" stroke="#58aed8" stroke-width="4"/>' +
      '</g><circle cx="64" cy="22" r="3.2" fill="' + CT + '"/></svg>' },
    galinha: { nome: 'a galinha', frase: 'É a galinha!', mexe: 'cisca', svg:
      '<svg viewBox="' + VB + '"><g fill="none" stroke="' + CT + '" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">' +
      '<ellipse cx="52" cy="60" rx="36" ry="24" fill="#f6ead8"/>' +
      '<path d="M22 54 q-14 -8 -6 -22" stroke-width="5"/>' +
      '<circle cx="84" cy="36" r="17" fill="#f6ead8"/>' +
      '<path d="M100 38 l14 5 l-14 7 Z" fill="#f19a3e" stroke-width="4"/>' +
      '<path d="M74 20 q4 -12 10 0 q4 -12 10 0 q4 -10 8 2" fill="#e04a3f" stroke-width="3"/>' +
      '<path d="M40 84 v10 M58 84 v10" stroke="#f19a3e" stroke-width="5"/>' +
      '</g><circle cx="88" cy="34" r="3.2" fill="' + CT + '"/></svg>' },
    elefante: { nome: 'o elefante', frase: 'É o elefante!', mexe: 'pisa' },
    peixe: { nome: 'os peixes', frase: 'São os peixes!', mexe: 'nada' }
  };
  function svgBicho(chave) {
    if (BICHOS_EXTRA[chave] && BICHOS_EXTRA[chave].svg) return BICHOS_EXTRA[chave].svg;
    return C.svgAnimal(chave);
  }

  // o gatinho balanca a cabeca (elogio silencioso, sem pontuacao)
  function balancarCabeca(el) {
    if (!el) return;
    el.classList.remove('balancando');
    void el.offsetWidth;
    el.classList.add('balancando');
    daqui(1800, function () { el.classList.remove('balancando'); });
  }

  /* ---------------------------------------------------------
     4) O TOCADOR - toca uma música (síntese ou gravação)
     Tudo é medido em BATIDAS, não em segundos: assim dá para
     mudar o andamento no meio (rápido e devagar) sem perder o lugar.
     --------------------------------------------------------- */
  var gravacoes = {};          // chave -> true/false (existe audio/musicas/<chave>.mp3?)

  // confere, uma vez, quais músicas têm gravação
  function sondarGravacoes() {
    M.ordem.forEach(function (chave) {
      if (gravacoes[chave] !== undefined) return;
      gravacoes[chave] = null;                   // sondando
      var a = new Audio();
      a.preload = 'metadata';
      var decidiu = false;
      function decidir(tem) {
        if (decidiu) return; decidiu = true;
        gravacoes[chave] = tem;
        if (tem) { try { console.log('Cecí: gravação encontrada para "' + chave + '"'); } catch (e) {} }
      }
      a.onloadedmetadata = function () { decidir(isFinite(a.duration) && a.duration > 1); };
      a.onerror = function () { decidir(false); };
      setTimeout(function () { if (!decidiu) { gravacoes[chave] = undefined; } }, 8000);
      a.src = M.todas[chave].arquivo;
    });
  }

  // ---- as vozes sintetizadas ----
  function tocarNotaMusical(gt, quando, freq, dur, vol, timbre) {
    var c = ctx();
    if (!c || !gt) return;
    var lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    var g = c.createGain();
    var nos = [];
    if (timbre === 'grave') {
      lp.frequency.value = 700;
      g.gain.setValueAtTime(0.0001, quando);
      g.gain.exponentialRampToValueAtTime(0.22 * vol, quando + 0.05);
      g.gain.setTargetAtTime(0.0001, quando + dur * 0.75, 0.12);
      var og = c.createOscillator(); og.type = 'triangle'; og.frequency.value = freq; og.connect(g);
      var og2 = c.createOscillator(); og2.type = 'sine'; og2.frequency.value = freq * 2; var gg2 = c.createGain(); gg2.gain.value = 0.2; og2.connect(gg2); gg2.connect(g);
      nos = [og, og2];
    } else if (timbre === 'sino') {
      lp.frequency.value = 4200;
      g.gain.setValueAtTime(0.0001, quando);
      g.gain.exponentialRampToValueAtTime(0.14 * vol, quando + 0.01);
      g.gain.setTargetAtTime(0.0001, quando + Math.min(dur * 0.6, 0.9), 0.25);
      [[1, 0.6], [2.4, 0.2], [3.9, 0.08]].forEach(function (p) {
        var o = c.createOscillator(); o.type = 'sine'; o.frequency.value = freq * p[0];
        var gp = c.createGain(); gp.gain.value = p[1]; o.connect(gp); gp.connect(g); nos.push(o);
      });
    } else if (timbre === 'brilhante') {
      lp.frequency.value = 3600;
      g.gain.setValueAtTime(0.0001, quando);
      g.gain.exponentialRampToValueAtTime(0.14 * vol, quando + 0.015);
      g.gain.setTargetAtTime(0.0001, quando + dur * 0.6, 0.06);
      var ob = c.createOscillator(); ob.type = 'triangle'; ob.frequency.value = freq; ob.connect(g);
      var ob2 = c.createOscillator(); ob2.type = 'sine'; ob2.frequency.value = freq * 3; var gb2 = c.createGain(); gb2.gain.value = 0.12; ob2.connect(gb2); gb2.connect(g);
      nos = [ob, ob2];
    } else {                                     // 'doce' (padrão)
      lp.frequency.value = 2400;
      g.gain.setValueAtTime(0.0001, quando);
      g.gain.exponentialRampToValueAtTime(0.16 * vol, quando + 0.03);
      g.gain.setTargetAtTime(0.0001, quando + dur * 0.7, 0.12);
      var o1 = c.createOscillator(); o1.type = 'triangle'; o1.frequency.value = freq; o1.connect(g);
      var o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = freq / 2; var g2 = c.createGain(); g2.gain.value = 0.35; o2.connect(g2); g2.connect(g);
      nos = [o1, o2];
    }
    g.connect(lp); lp.connect(gt);
    nos.forEach(function (o) { o.start(quando); o.stop(quando + dur + 0.9); });
    return { g: g, nos: nos };
  }

  // acorde: um "colchão" macio atrás, que entra e sai devagar
  function tocarAcorde(gt, quando, notasMidi, dur, vol) {
    var c = ctx();
    if (!c || !gt) return;
    var lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 1400;
    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, quando);
    g.gain.linearRampToValueAtTime(0.05 * vol, quando + 0.35);
    g.gain.setTargetAtTime(0.0001, quando + dur * 0.75, 0.25);
    g.connect(lp); lp.connect(gt);
    var nos = [];
    notasMidi.forEach(function (midi) {
      var o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = freqDeMidi(midi);
      o.connect(g);
      o.start(quando); o.stop(quando + dur + 0.8);
      nos.push(o);
    });
    return { g: g, nos: nos };
  }

  // baixo: bem grave e curto, marcando o passo
  function tocarBaixo(gt, quando, midi, dur, vol) {
    var c = ctx();
    if (!c || !gt) return;
    var lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 320;
    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, quando);
    g.gain.exponentialRampToValueAtTime(0.10 * vol, quando + 0.04);
    g.gain.setTargetAtTime(0.0001, quando + dur * 0.6, 0.1);
    g.connect(lp); lp.connect(gt);
    var o = c.createOscillator();
    o.type = 'sine';
    o.frequency.value = freqDeMidi(midi);
    o.connect(g);
    o.start(quando); o.stop(quando + dur + 0.4);
    return { g: g, nos: [o] };
  }

  // percussão levíssima (um chiadinho curto de chocalho)
  function tocarTique(gt, quando, vol) {
    var c = ctx();
    if (!c || !gt || !buffers.tique) return;
    var s = c.createBufferSource();
    s.buffer = buffers.tique;
    var g = c.createGain();
    g.gain.value = vol;
    s.connect(g); g.connect(gt);
    s.start(quando);
    return { g: g, nos: [s] };
  }

  function fatorDaDinamica(musica, batida) {
    var lista = musica.dinamica || [];
    for (var i = 0; i < lista.length; i++) {
      if (batida < lista[i][0]) return lista[i][1];
    }
    return lista.length ? lista[lista.length - 1][1] : 1;
  }

  // a melodia de um verso (as músicas com letra têm uma linha por verso da letra)
  function linhasDoVerso(musica, v) {
    var verso = (musica.versos || [])[v];
    if (verso && !Array.isArray(verso) && verso.melodia) return verso.melodia;
    return Array.isArray(musica.melodia) ? musica.melodia : [musica.melodia];
  }
  function letraDoVerso(musica, v) {
    var verso = (musica.versos || [])[v];
    if (!verso) return null;
    return Array.isArray(verso) ? verso : verso.letra;
  }

  /* monta todos os eventos de uma música, em batidas:
     { b: batida, dur: batidas, tipo: 'nota'|'acorde'|'baixo'|'tique'|'arp', ... }
     e as "marcas" de cada linha da letra (para o Cantar acender o verso). */
  function montarEventos(musica, voltas) {
    var eventos = [];
    var marcas = [];
    var repeticoes = musica.versos ? musica.versos.length : (musica.repetir || 1);
    var respiro = (musica.respiro != null) ? musica.respiro : 1;
    var compasso = musica.compasso || 4;
    var comecoDaVolta = 0;

    function juntar(linhas, acordes, deslocamento, verso) {
      var t = deslocamento;
      linhas.forEach(function (linha, indice) {
        marcas.push({ b: t, verso: verso, linha: indice });
        lerMelodia(linha).forEach(function (ev) {
          if (ev.nota !== '-') eventos.push({ tipo: 'nota', b: t, freq: frequencia(ev.nota), dur: ev.batidas * 0.92 });
          t += ev.batidas;
        });
      });
      var fimMelodia = t;

      var ta = deslocamento, primeiro = -1;
      lerMelodia(acordes).forEach(function (ac) {
        var ac2 = acorde(ac.nota);
        if (ac2) {
          if (primeiro < 0) primeiro = ta;
          eventos.push({ tipo: 'acorde', b: ta, notas: ac2.notas, dur: ac.batidas });
          eventos.push({ tipo: 'baixo', b: ta, midi: ac2.baixo, dur: 0.8 });
          if (ac.batidas >= 4) eventos.push({ tipo: 'baixo', b: ta + 2, midi: ac2.baixo, dur: 0.8 });
          else if (ac.batidas === 3) eventos.push({ tipo: 'baixo', b: ta + 1.5, midi: ac2.baixo, dur: 0.6, leve: true });
          if (musica.percussao !== false) {
            for (var b = 0; b < ac.batidas; b++) {
              eventos.push({ tipo: 'tique', b: ta + b, forte: ((ta - primeiro + b) % compasso) === 0 });
            }
          }
          if (musica.arpejo) {                      // sobe e desce o acorde, uma oitava acima, bem baixinho
            var seq = ac2.notas.map(function (n) { return n + 12; });
            var ida = seq.concat(seq.slice(1, -1).reverse());
            for (var k = 0; k * 0.5 < ac.batidas; k++) {
              eventos.push({ tipo: 'arp', b: ta + k * 0.5, freq: freqDeMidi(ida[k % ida.length]), dur: 0.5 });
            }
          }
        }
        ta += ac.batidas;
      });
      return Math.max(fimMelodia, ta);
    }

    var fim = 0;
    // "voltas": toca a música inteira mais de uma vez (para a dança não acabar cedo)
    for (var volta = 0; volta < (voltas || 1); volta++) {
      for (var r = 0; r < repeticoes; r++) {
        fim = juntar(linhasDoVerso(musica, r), musica.acordes, comecoDaVolta, r);
        comecoDaVolta = fim + respiro;
      }
      if (musica.final) {
        fim = juntar([musica.final], musica.acordesFinal || musica.acordes, comecoDaVolta, repeticoes);
        comecoDaVolta = fim + respiro;
      }
    }
    var total = fim;

    eventos.forEach(function (e) {
      var f = fatorDaDinamica(musica, e.b);
      if (e.tipo === 'tique') {
        e.vol = (e.forte ? 0.15 : 0.09) * f;
        if (e.b > total - compasso - 0.5) e.vol = 0;    // último compasso sem percussão
      } else if (e.tipo === 'arp') {
        e.vol = 0.35 * f;
      } else if (e.tipo === 'baixo' && e.leve) {
        e.vol = 0.6 * f;
      } else {
        e.vol = f;
      }
    });
    eventos.sort(function (a, b) { return a.b - b.b; });
    return { eventos: eventos, marcas: marcas, total: total + 1.5 };
  }

  function Tocador() {
    this.musica = null;
    this.modo = 'sintese';
    this.tocando = false;
    this.eventos = []; this.marcas = []; this.i = 0; this.total = 0;
    this.batidaBase = 0; this.tempoBase = 0; this.segPorBatida = 0.5; this.fator = 1;
    this.vozes = [];
    this.relogio = 0;
    this.gt = null;                   // ganho só deste tocador
    this.audio = null;
    this.limite = null;               // parar depois de N batidas (prévia / trecho)
    this.aoFim = null;
    this.volume = 1;
  }

  Tocador.prototype.ganho = function () {
    var c = ctx(), m = saida();
    if (!c || !m) return null;
    if (!this.gt || this.gt.context !== c) {
      this.gt = c.createGain();
      this.gt.gain.value = this.volume;
      this.gt.connect(m);
    }
    return this.gt;
  };

  Tocador.prototype.carregar = function (musica, opcoes) {
    opcoes = opcoes || {};
    this.parar();
    this.musica = musica;
    this.volume = (opcoes.volume != null) ? opcoes.volume : 1;
    this.fator = 1;
    this.limite = opcoes.limite || null;
    this.modo = (gravacoes[musica.chave] === true && !opcoes.semGravacao) ? 'gravacao' : 'sintese';
    var g = this.ganho();
    if (g) { g.gain.cancelScheduledValues(0); g.gain.value = this.volume; }
    if (this.modo === 'gravacao') {
      this.audio = new Audio(musica.arquivo);
      this.audio.preload = 'auto';
      this.audio.volume = Math.min(1, 0.9 * this.volume);
      this.bpmGravacao = musica.bpmGravacao || musica.bpm;
      this.inicioGravacao = musica.inicioGravacao || 0;
      this.marcas = montarEventos(musica).marcas;
    } else {
      var montado = montarEventos(musica, opcoes.voltas);
      this.eventos = montado.eventos;
      this.marcas = montado.marcas;
      this.total = montado.total;
      this.segPorBatida = 60 / musica.bpm;
    }
    this.i = 0; this.batidaBase = 0; this.vozes = [];
    return this.modo;
  };

  // em que batida da música estamos?
  Tocador.prototype.batida = function () {
    if (this.modo === 'gravacao') {
      if (!this.audio) return 0;
      return Math.max(0, (this.audio.currentTime - this.inicioGravacao) * this.bpmGravacao / 60);
    }
    var c = ctx();
    if (!this.tocando || !c) return this.batidaBase;
    return this.batidaBase + (c.currentTime - this.tempoBase) / this.segPorBatida;
  };

  Tocador.prototype.tocar = function (aoFim) {
    var self = this;
    this.aoFim = aoFim || null;
    var c = ctx();
    if (!c || !this.musica) return;
    this.tocando = true;
    if (this.modo === 'gravacao') {
      var p = this.audio.play();
      if (p && p.catch) p.catch(function () { self.modo = 'sintese'; self.carregarSintese(); self.tocar(aoFim); });
      this.audio.onended = function () { self.terminou(); };
    } else {
      this.tempoBase = c.currentTime + 0.12;
    }
    clearInterval(this.relogio);
    this.relogio = setInterval(function () { self.passo(); }, 30);
  };

  Tocador.prototype.carregarSintese = function () {
    var montado = montarEventos(this.musica);
    this.eventos = montado.eventos; this.marcas = montado.marcas; this.total = montado.total;
    this.segPorBatida = 60 / (this.musica.bpm * this.fator);
    this.i = 0; this.batidaBase = 0;
    this.modo = 'sintese';
    if (this.audio) { try { this.audio.pause(); } catch (e) {} this.audio = null; }
  };

  Tocador.prototype.guardar = function (v) {
    if (!v) return;
    this.vozes.push(v);
    if (this.vozes.length > 120) this.vozes.splice(0, 60);
  };

  Tocador.prototype.passo = function () {
    var c = ctx();
    if (!c || !this.tocando) return;
    if (this.modo === 'gravacao') {
      if (this.limite && this.batida() >= this.limite) this.terminou();
      return;
    }
    var gt = this.ganho();
    var ate = this.batidaBase + (c.currentTime + 0.25 - this.tempoBase) / this.segPorBatida;
    var timbre = this.musica.timbre || 'doce';
    while (this.i < this.eventos.length && this.eventos[this.i].b <= ate) {
      var e = this.eventos[this.i];
      if (!this.limite || e.b < this.limite) {
        var quando = this.tempoBase + (e.b - this.batidaBase) * this.segPorBatida;
        var dur = e.dur * this.segPorBatida;
        if (quando >= c.currentTime - 0.05) {
          if (e.tipo === 'nota') this.guardar(tocarNotaMusical(gt, quando, e.freq, dur, e.vol, timbre));
          else if (e.tipo === 'acorde') this.guardar(tocarAcorde(gt, quando, e.notas, dur, e.vol));
          else if (e.tipo === 'baixo') this.guardar(tocarBaixo(gt, quando, e.midi, dur, e.vol));
          else if (e.tipo === 'tique' && e.vol > 0) this.guardar(tocarTique(gt, quando, e.vol));
          else if (e.tipo === 'arp') this.guardar(tocarNotaMusical(gt, quando, e.freq, dur, e.vol, 'sino'));
        }
      }
      this.i++;
    }
    var pos = this.batida();
    if (this.limite && pos >= this.limite) { this.terminou(); return; }
    if (this.i >= this.eventos.length && pos >= this.total) this.terminou();
  };

  Tocador.prototype.silenciar = function (demora) {
    var c = ctx();
    if (!c) return;
    this.vozes.forEach(function (v) {
      try {
        v.g.gain.cancelScheduledValues(c.currentTime);
        v.g.gain.setTargetAtTime(0.0001, c.currentTime, demora);
        (v.nos || []).forEach(function (no) { try { no.stop(c.currentTime + demora * 4 + 0.1); } catch (e) {} });
      } catch (e) {}
    });
    this.vozes = [];
  };

  Tocador.prototype.pausar = function () {
    if (!this.tocando) return;
    clearInterval(this.relogio);
    if (this.modo === 'gravacao') { this.tocando = false; try { this.audio.pause(); } catch (e) {} return; }
    var c = ctx();
    this.batidaBase = this.batida();
    this.tocando = false;
    this.silenciar(0.05);
    // devolve para a fila o que já estava agendado mas ainda não soou
    while (this.i > 0 && this.eventos[this.i - 1].b > this.batidaBase) this.i--;
  };

  Tocador.prototype.voltar = function () {
    if (this.tocando || !this.musica) return;
    var self = this;
    var c = ctx();
    if (!c) return;
    this.tocando = true;
    if (this.modo === 'gravacao') { try { this.audio.play(); } catch (e) {} }
    else this.tempoBase = c.currentTime + 0.05;
    clearInterval(this.relogio);
    this.relogio = setInterval(function () { self.passo(); }, 30);
  };

  // andamento: 1 = normal, 0.7 = devagar, 1.35 = rápido
  Tocador.prototype.andamento = function (fator) {
    this.fator = fator;
    if (this.modo === 'gravacao') {
      if (this.audio) { try { this.audio.playbackRate = fator; } catch (e) {} }
      return;
    }
    var c = ctx();
    if (!c) return;
    if (this.tocando) { this.batidaBase = this.batida(); this.tempoBase = c.currentTime; }
    this.segPorBatida = 60 / (this.musica.bpm * fator);
  };

  Tocador.prototype.terminou = function () {
    if (!this.tocando) return;
    clearInterval(this.relogio);
    this.tocando = false;
    if (this.modo === 'gravacao' && this.audio) { try { this.audio.pause(); } catch (e) {} }
    else this.silenciar(0.3);
    var fim = this.aoFim; this.aoFim = null;
    if (fim) fim();
  };

  Tocador.prototype.parar = function () {
    clearInterval(this.relogio);
    this.tocando = false;
    this.aoFim = null;
    if (this.audio) { try { this.audio.onended = null; this.audio.pause(); this.audio.src = ''; } catch (e) {} this.audio = null; }
    this.silenciar(0.04);
    this.eventos = []; this.i = 0;
  };

  // some devagar (para acabar limpo antes de trocar de tela)
  Tocador.prototype.sumir = function (segundos) {
    var c = ctx();
    if (this.modo === 'gravacao' && this.audio) {
      var a = this.audio, v = a.volume, passos = 10, k = 0;
      var t = setInterval(function () { k++; try { a.volume = Math.max(0, v * (1 - k / passos)); } catch (e) {} if (k >= passos) clearInterval(t); }, segundos * 100);
      return;
    }
    if (c && this.gt) { this.gt.gain.cancelScheduledValues(c.currentTime); this.gt.gain.setTargetAtTime(0.0001, c.currentTime, segundos / 3); }
  };

  var tocador = new Tocador();      // o tocador das atividades de música
  var fundo = new Tocador();        // música de fundo (tocar junto / desenhar com música)

  /* ---------------------------------------------------------
     5) Cartões de escolha (modos e músicas)
     --------------------------------------------------------- */
  function cartaoMusica(m, aoTocar) {
    var b = document.createElement('button');
    b.className = 'cartao-musica';
    b.innerHTML = m.icone + '<span class="nome">' + m.nome + '</span>';
    b.addEventListener('click', function () {
      if (C.estaBloqueado()) return;
      aoTocar(m, b);
    });
    return b;
  }

  function grade(lista, aoTocar) {
    var g = document.createElement('div');
    g.className = 'grade-musicas' + (lista.length > 8 ? ' muitas' : '');
    lista.forEach(function (m) { g.appendChild(cartaoMusica(m, aoTocar)); });
    return g;
  }

  /* ---------------------------------------------------------
     6) TOCAR - piano, xilofone, tambor, chocalho, triângulo, sinos
        + "tocar junto": uma cantiga baixinha de fundo
     --------------------------------------------------------- */
  function atividadeTocar() {
    var cena = document.createElement('div');
    cena.className = 'cena-tocar';

    function toque(el, fn) {
      el.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        if (C.estaBloqueado()) return;
        fn();
      });
    }

    // piano: 8 teclas brancas, dó a dó
    var piano = document.createElement('div');
    piano.className = 'piano';
    PIANO.forEach(function (f, i) {
      var t = document.createElement('button');
      t.className = 'tecla-piano';
      t.innerHTML = '<span class="ponto" style="background:' + CORES_TECLAS[i % CORES_TECLAS.length] + '"></span>';
      t.setAttribute('aria-label', NOMES_PIANO[i]);
      toque(t, function () {
        tocarBuffer('piano' + i, 0.8);
        t.classList.add('afundada');
        daqui(240, function () { t.classList.remove('afundada'); });
      });
      piano.appendChild(t);
    });
    cena.appendChild(piano);

    var fila = document.createElement('div');
    fila.className = 'fila-instrumentos';
    cena.appendChild(fila);

    var xilo = document.createElement('div');
    xilo.className = 'xilofone';
    PENTA.forEach(function (freq, i) {
      var t = document.createElement('button');
      t.className = 'tecla-xilo';
      t.style.background = CORES_TECLAS[i];
      t.style.height = (30 - i * 3) + 'vh';
      t.setAttribute('aria-label', 'Tecla ' + (i + 1));
      toque(t, function () {
        tocarBuffer('tecla' + i, 0.8);
        t.classList.add('afundada');
        daqui(260, function () { t.classList.remove('afundada'); });
      });
      xilo.appendChild(t);
    });
    fila.appendChild(xilo);

    var tambor = document.createElement('div');
    tambor.className = 'instrumento';
    tambor.innerHTML = TAMBOR_SVG + '<span class="nome">tambor</span>';
    toque(tambor, function () {
      tocarBuffer('tambor', 0.85);
      tambor.classList.add('afundada');
      daqui(220, function () { tambor.classList.remove('afundada'); });
    });
    fila.appendChild(tambor);

    var choc = document.createElement('div');
    choc.className = 'instrumento';
    choc.innerHTML = CHOCALHO_SVG + '<span class="nome">chocalho</span>';
    toque(choc, function () {
      tocarBuffer('chocalho', 0.7);
      var svg = choc.querySelector('.chocalho');
      svg.classList.remove('chacoalhando'); void svg.offsetWidth; svg.classList.add('chacoalhando');
    });
    fila.appendChild(choc);

    var tri = document.createElement('div');
    tri.className = 'instrumento';
    tri.innerHTML = TRIANGULO_SVG + '<span class="nome">triângulo</span>';
    toque(tri, function () {
      tocarBuffer('triangulo', 0.55);
      var svg = tri.querySelector('.triangulo');
      svg.classList.remove('vibrando'); void svg.offsetWidth; svg.classList.add('vibrando');
    });
    fila.appendChild(tri);

    var sinos = document.createElement('div');
    sinos.className = 'instrumento sinos';
    var caixaSinos = document.createElement('div');
    caixaSinos.className = 'caixa-sinos';
    ['#f2b705', '#e987b8', '#9ec5e8'].forEach(function (cor, i) {
      var s = document.createElement('button');
      s.className = 'botao-sino';
      s.innerHTML = sinoSVG(cor);
      s.setAttribute('aria-label', 'Sino ' + (i + 1));
      toque(s, function () {
        tocarBuffer('sino' + i, 0.6);
        var svg = s.querySelector('.sino');
        svg.classList.remove('badalando'); void svg.offsetWidth; svg.classList.add('badalando');
      });
      caixaSinos.appendChild(s);
    });
    sinos.appendChild(caixaSinos);
    var nomeSinos = document.createElement('span');
    nomeSinos.className = 'nome'; nomeSinos.textContent = 'sinos';
    sinos.appendChild(nomeSinos);
    fila.appendChild(sinos);

    // "tocar junto": liga uma cantiga bem baixinha de fundo
    var junto = document.createElement('button');
    junto.className = 'btn-tocar-junto';
    junto.setAttribute('aria-label', 'Tocar junto com uma música');
    junto.innerHTML =
      '<svg viewBox="0 0 100 100" aria-hidden="true">' +
      '<path d="M42 72 V30 L74 22 V64" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<ellipse cx="34" cy="72" rx="12" ry="9" fill="#9ec5e8" stroke="currentColor" stroke-width="5"/>' +
      '<ellipse cx="66" cy="64" rx="12" ry="9" fill="#9ec5e8" stroke="currentColor" stroke-width="5"/>' +
      '</svg><span class="rotulo-junto">tocar junto</span>';
    junto.addEventListener('click', function () {
      if (C.estaBloqueado()) return;
      if (fundo.tocando) { pararFundo(); junto.classList.remove('ligado'); return; }
      junto.classList.add('ligado');
      tocarFundo(null, 0.32);
      C.nota(C.NOTAS[3], 0.3, 0.04);
    });
    cena.appendChild(junto);

    palco.appendChild(cena);
    C.falar('Toque para fazer música.');
  }

  // ---- música de fundo (uma atrás da outra, bem baixinha) ----
  var ultimoFundo = '';
  function tocarFundo(chave, volume) {
    var lista = M.comUso('fundo').filter(function (m) { return m.chave !== ultimoFundo; });
    var m = chave ? M.todas[chave] : lista[Math.floor(Math.random() * lista.length)];
    if (!m) return;
    ultimoFundo = m.chave;
    fundo.carregar(m, { volume: volume || 0.3 });
    fundo.tocar(function () { daqui(1500, function () { if (atividadeAtual || C.fundoMusical.ligado) tocarFundo(null, volume); }); });
  }
  function pararFundo() {
    fundo.parar();
  }
  C.fundoMusical = {
    ligado: false,
    tocar: function (chave, volume) { C.fundoMusical.ligado = true; prepararSons(); tocarFundo(chave, volume); },
    parar: function () { C.fundoMusical.ligado = false; pararFundo(); },
    tocando: function () { return fundo.tocando; },
    lista: function () { return M.comUso('fundo'); }
  };

  /* ---------------------------------------------------------
     7) DANÇAR - três modos: estátua, rápido e devagar, gestos
     --------------------------------------------------------- */
  var CONVITE_DANCAR = 'Vamos dançar de novo com o papai, sem o tablet?';
  var DICA_DANCAR = 'Dancem juntos sem o tablet: parem na estátua, imitem os gestos.';

  var MODOS = [
    { chave: 'estatua', nome: 'Estátua', icone:
      '<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="30" y="76" width="40" height="12" rx="4" fill="#b3a894" stroke="' + CT + '" stroke-width="4"/>' +
      '<circle cx="50" cy="26" r="12" fill="#cfc6b6" stroke="' + CT + '" stroke-width="4"/>' +
      '<path d="M50 38 V66 M50 44 L30 34 M50 44 L72 30 M50 66 L38 76 M50 66 L62 76" fill="none" stroke="' + CT + '" stroke-width="7" stroke-linecap="round"/></svg>' },
    { chave: 'andamento', nome: 'Rápido e devagar', icone: null },
    { chave: 'gestos', nome: 'Gestos', icone:
      '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="30" r="12" fill="#f7d9a0" stroke="' + CT + '" stroke-width="4"/>' +
      '<path d="M50 42 V68 M50 48 L26 24 M50 48 L74 24 M50 68 L36 90 M50 68 L64 90" fill="none" stroke="' + CT + '" stroke-width="7" stroke-linecap="round"/></svg>' }
  ];
  var GESTOS = [
    { chave: 'palma', frase: 'Bate palma!', rotulo: 'bate palma' },
    { chave: 'pular', frase: 'Pula!', rotulo: 'pula' },
    { chave: 'girar', frase: 'Gira!', rotulo: 'gira' },
    { chave: 'abaixar', frase: 'Abaixa!', rotulo: 'abaixa' },
    { chave: 'bracos', frase: 'Braços para cima!', rotulo: 'braços para cima' }
  ];
  var TODOS_GESTOS = ['palma', 'pular', 'girar', 'abaixar', 'bracos', 'remar', 'marchar', 'rodar', 'nadar', 'passar', 'balancar', 'acenar', 'congelado', 'dancando', 'rapido', 'devagar'];

  function limparGestos(gato) { TODOS_GESTOS.forEach(function (g) { gato.classList.remove(g); }); }

  function atividadeDancar(modoInicial, musicaInicial) {
    var cena = document.createElement('div');
    cena.className = 'cena-danca';
    palco.appendChild(cena);

    var modo = modoInicial || null;
    var escolhida = musicaInicial || null;
    var relogioEvento = 0;
    var gato = null, rotulo = null;

    function escolherModo() {
      cena.innerHTML = '<div class="titulo-cena">Como vamos dançar?</div>';
      var caixa = document.createElement('div');
      caixa.className = 'grade-modos';
      MODOS.forEach(function (m) {
        var b = document.createElement('button');
        b.className = 'cartao-modo';
        var icone = m.icone || ('<span class="dupla">' + C.svgAnimal('tartaruga') + C.svgAnimal('coelho') + '</span>');
        b.innerHTML = icone + '<span class="nome">' + m.nome + '</span>';
        b.addEventListener('click', function () {
          if (C.estaBloqueado()) return;
          modo = m.chave;
          C.falarJa(m.nome);
          daqui(900, escolherMusica);
        });
        caixa.appendChild(b);
      });
      cena.appendChild(caixa);
    }

    function escolherMusica() {
      cena.innerHTML = '<div class="titulo-cena">Escolhe a música</div>';
      var lista = M.comUso('dancar');
      var g = grade(lista, function (m, botao) {
        Array.prototype.forEach.call(g.children, function (x) { x.classList.toggle('escolhida', x === botao); });
        escolhida = m;
        // prévia de 2 segundos, depois começa a dança
        tocador.carregar(m, { limite: m.bpm * 2 / 60 });
        tocador.tocar(function () { daqui(500, comecarDanca); });
      });
      cena.appendChild(g);
    }

    function montarPalcoDanca() {
      cena.innerHTML = '';
      var caixa = document.createElement('div');
      caixa.innerHTML = gatoDancarinoSVG('gato-danca');
      cena.appendChild(caixa);
      gato = cena.querySelector('.gato-danca');
      rotulo = document.createElement('div');
      rotulo.className = 'rotulo-danca';
      cena.appendChild(rotulo);
    }

    function mostrarRotulo(texto) {
      rotulo.textContent = texto;
      rotulo.classList.add('visivel');
    }
    function esconderRotulo() { rotulo.classList.remove('visivel'); }

    // ---- modo estátua ----
    function agendarEstatua() {
      clearTimeout(relogioEvento);
      relogioEvento = daqui(8000 + Math.random() * 4000, function () {
        if (!tocador.tocando) return;
        tocador.pausar();                      // a música para
        gato.classList.add('congelado');       // o gatinho congela
        mostrarRotulo('estátua!');
        C.falarJa('estátua!');
        daqui(3000, function () {              // 3 segundos parados
          esconderRotulo();
          gato.classList.remove('congelado');
          tocador.voltar();
          agendarEstatua();
        });
      });
    }

    // ---- modo rápido e devagar ----
    var lento = true;
    function trocarAndamento(primeira) {
      if (!tocador.tocando) return;
      lento = primeira ? true : !lento;
      var fator = lento ? 0.7 : 1.35;
      tocador.andamento(fator);
      gato.classList.toggle('devagar', lento);
      gato.classList.toggle('rapido', !lento);
      mostrarRotulo(lento ? 'devagar...' : 'rápido!');
      C.falarJa(lento ? 'Devagar...' : 'Rápido!');
      daqui(2200, esconderRotulo);
      clearTimeout(relogioEvento);
      relogioEvento = daqui(10000 + Math.random() * 5000, function () { trocarAndamento(false); });
    }

    // ---- modo gestos ----
    var filaGestos = [];
    function proximoGesto() {
      if (!tocador.tocando) return;
      if (!filaGestos.length) filaGestos = embaralhar(GESTOS);
      var g = filaGestos.shift();
      limparGestos(gato);
      gato.classList.add('dancando', g.chave);
      mostrarRotulo(g.rotulo);
      C.falarJa(g.frase);
      clearTimeout(relogioEvento);
      relogioEvento = daqui(8000, proximoGesto);
    }

    function fimDaMusica() {
      clearTimeout(relogioEvento);
      if (gato) limparGestos(gato);
      esconderRotulo();
      daqui(700, function () {
        C.mostrarFim('Que dança bonita!', CONVITE_DANCAR, DICA_DANCAR,
          function () { abrirSom('dancar', { modo: modo, musica: escolhida }); },
          function () { pararTudo(); C.irPara('tela-musica'); });
      });
    }

    function comecarDanca() {
      montarPalcoDanca();
      // a dança dura pelo menos uns 50 segundos: repete a música se ela for curta
      var duracao = montarEventos(escolhida).total * 60 / escolhida.bpm;
      tocador.carregar(escolhida, { voltas: Math.min(3, Math.max(1, Math.ceil(50 / duracao))) });
      tocador.tocar(fimDaMusica);
      gato.classList.add('dancando');
      if (modo === 'estatua') agendarEstatua();
      else if (modo === 'andamento') daqui(1500, function () { trocarAndamento(true); });
      else daqui(1200, proximoGesto);
    }

    if (modo && escolhida) {
      C.falar('Vamos dançar!');
      daqui(1400, comecarDanca);
    } else if (modo) {
      escolherMusica();
    } else {
      C.falar('Vamos dançar! Escolhe como.');
      escolherModo();
    }
  }

  /* ---------------------------------------------------------
     8) CANTAR - a melodia toca, a letra aparece em versos grandes
        (é o papai quem canta; a voz do app fica quieta)
     --------------------------------------------------------- */
  var CONVITE_CANTAR = 'Canta de novo com o papai?';
  var DICA_CANTAR = 'Cante junto, apontando o verso. Faça o gesto da cantiga com ela.';

  function atividadeCantar(musicaInicial) {
    var cena = document.createElement('div');
    cena.className = 'cena-cantar';
    palco.appendChild(cena);
    var escolhida = musicaInicial || null;
    var relogioVerso = 0;

    function escolherMusica() {
      cena.innerHTML = '<div class="titulo-cena">Qual cantiga?</div>';
      var g = grade(M.comUso('cantar'), function (m, botao) {
        Array.prototype.forEach.call(g.children, function (x) { x.classList.toggle('escolhida', x === botao); });
        escolhida = m;
        C.falarJa(m.nome);
        daqui(1600, comecar);
      });
      cena.appendChild(g);
    }

    function comecar() {
      cena.innerHTML = '';
      var lado = document.createElement('div');
      lado.className = 'lado-gato';
      lado.innerHTML = gatoDancarinoSVG('gato-danca gato-cantar');
      cena.appendChild(lado);
      var gato = lado.querySelector('.gato-danca');
      gato.classList.add(escolhida.gesto || 'balancar');

      var letra = document.createElement('div');
      letra.className = 'letra';
      cena.appendChild(letra);

      var versoAtual = -1, linhaAtual = -1;
      function mostrarVerso(v) {
        versoAtual = v;
        letra.innerHTML = '';
        (letraDoVerso(escolhida, v) || []).forEach(function (texto) {
          var p = document.createElement('p');
          p.textContent = texto;
          letra.appendChild(p);
        });
      }
      function acender(marca) {
        if (marca.verso !== versoAtual) mostrarVerso(marca.verso);
        if (marca.linha === linhaAtual && marca.verso === versoAtual) return;
        linhaAtual = marca.linha;
        Array.prototype.forEach.call(letra.children, function (p, i) { p.classList.toggle('atual', i === marca.linha); });
      }

      tocador.carregar(escolhida);
      var marcas = tocador.marcas;
      tocador.tocar(function () {
        clearInterval(relogioVerso);
        limparGestos(gato);
        daqui(800, function () {
          C.mostrarFim('Que música bonita!', CONVITE_CANTAR, DICA_CANTAR,
            function () { abrirSom('cantar', { musica: escolhida }); },
            function () { pararTudo(); C.irPara('tela-musica'); });
        });
      });
      mostrarVerso(0);
      relogioVerso = cada(80, function () {
        var b = tocador.batida() + 0.15;          // um tiquinho antes, para o olho acompanhar
        var atual = null;
        for (var i = 0; i < marcas.length; i++) { if (marcas[i].b <= b) atual = marcas[i]; else break; }
        if (atual) acender(atual);
      });
    }

    if (escolhida) { daqui(600, comecar); }
    else { C.falar('Vamos cantar!'); escolherMusica(); }
  }

  /* ---------------------------------------------------------
     9) BICHOS MUSICAIS - Carnaval dos Animais
        Toca um trecho, ela escolhe entre 2 bichos. Sem erro:
        no outro bicho o gatinho balança a cabeça e o trecho toca de novo.
     --------------------------------------------------------- */
  var CONVITE_BICHOS = 'Vamos imitar os bichos com o papai?';
  var DICA_BICHOS = 'Imitem juntos: o cisne desliza, o elefante pisa forte, o peixe nada, a galinha cisca.';

  function atividadeBichosMusicais() {
    var cena = document.createElement('div');
    cena.className = 'cena-bichos-musicais';
    cena.innerHTML = '<div class="dupla-bichos"></div><div class="gato-canto">' + gatoSVG('gato-musica') + '</div>';
    palco.appendChild(cena);
    var dupla = cena.querySelector('.dupla-bichos');
    var gato = cena.querySelector('.gato-musica');

    var pecas = embaralhar(M.comUso('bichos'));
    var rodada = 0;
    var atual = null;
    var esperando = false;

    function tocarTrecho(segundos, depois) {
      tocador.carregar(atual, { limite: atual.bpm * segundos / 60 });
      tocador.tocar(depois || null);
    }

    function novaRodada() {
      if (rodada >= pecas.length) {
        daqui(600, function () {
          C.mostrarFim('Que música bonita!', CONVITE_BICHOS, DICA_BICHOS,
            function () { abrirSom('bichos-musicais'); },
            function () { pararTudo(); C.irPara('tela-musica'); });
        });
        return;
      }
      atual = pecas[rodada];
      var outros = pecas.filter(function (p) { return p !== atual; });
      var outro = outros[Math.floor(Math.random() * outros.length)];
      var opcoes = embaralhar([atual, outro]);
      dupla.innerHTML = '';
      opcoes.forEach(function (p) {
        var b = document.createElement('button');
        b.className = 'bicho-grande';
        b.innerHTML = svgBicho(p.bicho);
        b.setAttribute('data-bicho', p.bicho);
        b.addEventListener('pointerdown', function (e) {
          e.preventDefault();
          if (C.estaBloqueado() || !esperando) return;
          if (p === atual) acertou(b); else errou();
        });
        dupla.appendChild(b);
      });
      esperando = true;
      daqui(300, function () { tocarTrecho(10); });
    }

    function errou() {
      balancarCabeca(gato);                       // sem som de erro: só balança a cabeça
      esperando = false;
      daqui(900, function () { esperando = true; tocarTrecho(10); });
    }

    function acertou(botao) {
      esperando = false;
      var info = BICHOS_EXTRA[atual.bicho];
      Array.prototype.forEach.call(dupla.children, function (b) { if (b !== botao) b.classList.add('apagado'); });
      botao.classList.add('dancando', info.mexe);
      C.nota(C.NOTAS[3], 0.4, 0.05);
      C.falarJa(info.frase);
      // o bicho dança com a música por uns segundos
      daqui(1200, function () {
        tocarTrecho(9, function () {
          rodada++;
          daqui(600, novaRodada);
        });
      });
    }

    C.falar('Escuta a música. Qual bicho combina?');
    daqui(3200, novaRodada);
  }

  /* ---------------------------------------------------------
     10) SONS DOS BICHOS - toca no bicho, ele faz o som, diz o nome e se mexe
     --------------------------------------------------------- */
  function atividadeBichos() {
    var cena = document.createElement('div');
    cena.className = 'cena-bichos';
    palco.appendChild(cena);
    var lista = ['gato', 'vaca', 'cavalo', 'passarinho', 'peixe', 'pato', 'sapo', 'abelha'];
    lista.forEach(function (chave) {
      var a = C.ANIMAIS[chave];
      if (!a) return;
      var b = document.createElement('button');
      b.className = 'bicho-som';
      b.innerHTML = C.svgAnimal(chave);
      var mexe = (a.onde === 'agua' && !a.voa) ? 'reage-nada' : (a.voa || chave === 'passarinho' ? 'reage-voa' : (chave === 'sapo' ? 'reage-pula' : 'reage-som'));
      b.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        if (C.estaBloqueado()) return;
        b.classList.remove('reage-nada', 'reage-voa', 'reage-pula', 'reage-som');
        void b.offsetWidth;
        b.classList.add(mexe);
        if (C.somDoAnimal) C.somDoAnimal(chave);
      });
      cena.appendChild(b);
    });
    C.falar('Toque num bicho para ouvir o som dele.');
  }

  /* ---------------------------------------------------------
     11) Abrir e fechar
     --------------------------------------------------------- */
  function pararTudo() {
    limparRelogios();
    tocador.parar();
    if (!C.fundoMusical.ligado) fundo.parar();
    atividadeAtual = null;
    palco.innerHTML = '';
  }
  C.limparSom = pararTudo;

  var DICAS_SOM = {
    tocar: 'Toca nas teclas coloridas!',
    dancar: 'Dança com o gatinho!',
    cantar: 'Canta junto com o papai!',
    'bichos-musicais': 'Escuta e toca no bicho!',
    bichos: 'Toca no bicho para ouvir!'
  };

  function abrirSom(nome, opcoes) {
    opcoes = opcoes || {};
    pararTudo();
    atividadeAtual = nome;
    C.registrar(nome);
    C.irPara('tela-som');
    prepararSons();
    sondarGravacoes();
    daqui(80, function () {
      C.dicaAtual = DICAS_SOM[nome];
      if (nome === 'tocar') atividadeTocar();
      else if (nome === 'dancar') atividadeDancar(opcoes.modo, opcoes.musica);
      else if (nome === 'cantar') atividadeCantar(opcoes.musica);
      else if (nome === 'bichos-musicais') atividadeBichosMusicais();
      else if (nome === 'bichos') atividadeBichos();
    });
  }

  Array.prototype.forEach.call(
    document.querySelectorAll('#tela-musica .cartao[data-som]'),
    function (b) {
      b.addEventListener('click', function () {
        C.nota(C.NOTAS[3], 0.34, 0.05);
        abrirSom(b.getAttribute('data-som'));
      });
    }
  );

  // assim que o menu de música abre, já vai assando os sons e sondando as gravações
  Array.prototype.forEach.call(
    document.querySelectorAll('#tela-inicio .cartao[data-modulo="musica"]'),
    function (b) { b.addEventListener('click', function () { prepararSons(); sondarGravacoes(); }); }
  );

  C.abrirSom = abrirSom;
  C.prepararSons = prepararSons;
})();
