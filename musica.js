/* ============================================================
   Cecí - Fase 3: música
   Tocar (xilofone, tambor, chocalho), Bater junto e Dançar.

   Todo som é feito na hora pelo próprio navegador (Web Audio API):
   não existe nenhum arquivo de áudio no app.
   Os sons de tocar são "assados" antes em buffers, para sair
   na hora do toque, sem atraso.
   ============================================================ */
(function () {
  'use strict';

  var C = window.Ceci;
  var palco = document.getElementById('palco-som');
  if (!palco) return;

  var relogios = [];
  var intervalos = [];
  var atividadeAtual = null;

  function daqui(ms, fn) { var t = setTimeout(fn, ms); relogios.push(t); return t; }
  function cada(ms, fn) { var t = setInterval(fn, ms); intervalos.push(t); return t; }
  function limparRelogios() {
    relogios.forEach(clearTimeout); relogios = [];
    intervalos.forEach(clearInterval); intervalos = [];
  }

  /* ---------------------------------------------------------
     1) Encanamento do som
     --------------------------------------------------------- */
  var mestre = null;        // volume geral, moderado
  var buffers = {};         // sons prontos (xilofone, tambor, chocalho)
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

  // notas do xilofone: escala pentatônica (dó ré mi sol lá)
  var PENTA = [523.25, 587.33, 659.25, 783.99, 880.00];
  var CORES_TECLAS = ['#e04a3f', '#f2b705', '#4aa657', '#3a72c4', '#e987b8'];

  function prepararSons() {
    if (prontos || preparando) return;
    var c = ctx();
    if (!c) return;
    preparando = true;
    var tarefas = [];
    PENTA.forEach(function (f, i) {
      tarefas.push(assar(1.3, function (oc) { montarTecla(oc, f); })
        .then(function (b) { buffers['tecla' + i] = b; }));
    });
    tarefas.push(assar(0.7, montarTambor).then(function (b) { buffers.tambor = b; }));
    tarefas.push(assar(0.35, montarChocalho).then(function (b) { buffers.chocalho = b; }));
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
     2) Notas com nome (para as melodias)
     --------------------------------------------------------- */
  var SEMITONS = { 'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11 };

  function frequencia(nome) {
    var m = /^([A-G]#?)(\d)$/.exec(nome);
    if (!m) return 440;
    var midi = SEMITONS[m[1]] + (Number(m[2]) + 1) * 12;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // "C5:1 E5:.5 -:1"  ->  lista de notas e silêncios
  function lerMelodia(texto) {
    return texto.trim().split(/\s+/).map(function (p) {
      var partes = p.split(':');
      return { nota: partes[0], batidas: partes[1] ? Number(partes[1]) : 1 };
    });
  }

  /* ---------------------------------------------------------
     3) Desenhos
     --------------------------------------------------------- */
  var CT = '#3a3630';

  function gatoSVG(classe) {
    return '<svg class="' + classe + '" viewBox="0 0 200 210" aria-hidden="true">' +
      '<path d="M46 176 q-26 4 -22 -22" fill="none" stroke="' + CT + '" stroke-width="12" stroke-linecap="round"/>' +
      '<path d="M46 176 q-26 4 -22 -22" fill="none" stroke="#f7d9a0" stroke-width="6" stroke-linecap="round"/>' +
      '<ellipse cx="100" cy="156" rx="50" ry="42" fill="#f7d9a0" stroke="' + CT + '" stroke-width="4"/>' +
      '<g class="patinha">' +
        '<path d="M142 158 L166 108" fill="none" stroke="' + CT + '" stroke-width="18" stroke-linecap="round"/>' +
        '<path d="M142 158 L166 108" fill="none" stroke="#f7d9a0" stroke-width="11" stroke-linecap="round"/>' +
        '<circle cx="168" cy="102" r="14" fill="#f7d9a0" stroke="' + CT + '" stroke-width="4"/>' +
      '</g>' +
      '<path d="M66 66 L60 26 L94 46 Z" fill="#f7d9a0" stroke="' + CT + '" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M134 66 L140 26 L106 46 Z" fill="#f7d9a0" stroke="' + CT + '" stroke-width="4" stroke-linejoin="round"/>' +
      '<ellipse cx="100" cy="86" rx="44" ry="40" fill="#f7d9a0" stroke="' + CT + '" stroke-width="4"/>' +
      '<circle cx="86" cy="82" r="4.5" fill="' + CT + '"/><circle cx="114" cy="82" r="4.5" fill="' + CT + '"/>' +
      '<path d="M100 98 q-6 8 -12 3 M100 98 q6 8 12 3" fill="none" stroke="' + CT + '" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M46 86 H66 M46 96 H66 M134 86 H154 M134 96 H154" stroke="' + CT + '" stroke-width="3" stroke-linecap="round"/>' +
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

  /* ---------------------------------------------------------
     4) TOCAR - xilofone, tambor e chocalho
     --------------------------------------------------------- */
  function atividadeTocar() {
    var cena = document.createElement('div');
    cena.className = 'palco-som-conteudo';

    var xilo = document.createElement('div');
    xilo.className = 'xilofone';
    PENTA.forEach(function (freq, i) {
      var t = document.createElement('button');
      t.className = 'tecla-xilo';
      t.style.background = CORES_TECLAS[i];
      t.style.height = (44 - i * 4) + 'vh';
      t.setAttribute('aria-label', 'Tecla ' + (i + 1));
      t.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        if (C.estaBloqueado()) return;
        tocarBuffer('tecla' + i, 0.8);
        t.classList.add('afundada');                       // a tecla afunda devagar
        daqui(260, function () { t.classList.remove('afundada'); });
      });
      xilo.appendChild(t);
    });
    cena.appendChild(xilo);

    var tambor = document.createElement('div');
    tambor.className = 'instrumento';
    tambor.innerHTML = TAMBOR_SVG + '<span class="nome">tambor</span>';
    tambor.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      if (C.estaBloqueado()) return;
      tocarBuffer('tambor', 0.85);
      tambor.classList.add('afundada');
      daqui(220, function () { tambor.classList.remove('afundada'); });
    });
    cena.appendChild(tambor);

    var choc = document.createElement('div');
    choc.className = 'instrumento';
    choc.innerHTML = CHOCALHO_SVG + '<span class="nome">chocalho</span>';
    choc.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      if (C.estaBloqueado()) return;
      tocarBuffer('chocalho', 0.7);
      var svg = choc.querySelector('.chocalho');
      svg.classList.remove('chacoalhando');
      void svg.offsetWidth;
      svg.classList.add('chacoalhando');
    });
    cena.appendChild(choc);

    palco.appendChild(cena);
    C.falar('Toque para fazer música.');
  }

  /* ---------------------------------------------------------
     5) BATER JUNTO - ritmo bem devagar (60 batidas por minuto)
     --------------------------------------------------------- */
  var CONVITE_BATER = 'Vamos bater palma junto com o papai?';
  var DICA_BATER = 'Bata palmas bem devagar com ela e deixe ela puxar o ritmo.';

  function atividadeBater() {
    var c = ctx();
    var cena = document.createElement('div');
    cena.className = 'cena-ritmo';
    cena.innerHTML =
      gatoSVG('gato-musica') +
      '<div class="tambor-grande"><div class="pulso"></div></div>';
    palco.appendChild(cena);

    var gato = cena.querySelector('.gato-musica');
    var tambor = cena.querySelector('.tambor-grande');
    var pulso = cena.querySelector('.pulso');

    var RODADAS = [
      { padrao: [1], fala: 'Bate junto comigo.' },
      { padrao: [1, 1, 0], fala: 'Agora: tum, tum, pausa.' },
      { padrao: [1, 1, 1, 0], fala: 'De novo, bem devagar.' }
    ];

    var INTERVALO = 1.0;          // 60 batidas por minuto
    var rodada = 0, passo = 0;
    var proximo = 0, fimDaRodada = 0;
    var batidas = [];             // horários das batidas, para conferir o toque dela
    var agendador = 0;

    function visualDaBatida(quando) {
      var espera = Math.max(0, (quando - ctx().currentTime) * 1000);
      daqui(espera, function () {
        pulso.classList.add('batendo');
        gato.classList.add('batendo');
        daqui(300, function () {
          pulso.classList.remove('batendo');
          gato.classList.remove('batendo');
        });
      });
    }

    function agendar() {
      var agora = ctx().currentTime;
      while (proximo < agora + 0.25) {
        if (proximo > fimDaRodada) { fecharRodada(); return; }
        var padrao = RODADAS[rodada].padrao;
        if (padrao[passo % padrao.length] === 1) {
          tocarBuffer('tambor', 0.55, proximo);
          batidas.push(proximo);
          visualDaBatida(proximo);
        }
        passo++;
        proximo += INTERVALO;
      }
      // limpa batidas velhas
      while (batidas.length && batidas[0] < agora - 3) batidas.shift();
    }

    function abrirRodada() {
      var r = RODADAS[rodada];
      C.falar(r.fala);
      passo = 0;
      proximo = ctx().currentTime + 2.2;
      fimDaRodada = proximo + 20;          // 20 segundos por rodada
      clearInterval(agendador);
      agendador = cada(25, agendar);
    }

    function fecharRodada() {
      clearInterval(agendador);
      rodada++;
      if (rodada < RODADAS.length) daqui(2200, abrirRodada);
      else daqui(1200, function () {
        C.mostrarFim('Que ritmo bonito!', CONVITE_BATER, DICA_BATER,
          function () { abrirSom('bater'); },
          function () { pararTudo(); C.irPara('tela-musica'); });
      });
    }

    tambor.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      if (C.estaBloqueado()) return;
      tocarBuffer('tambor', 0.8);
      tambor.classList.add('batido');
      daqui(220, function () { tambor.classList.remove('batido'); });

      // bateu perto do tempo? o tambor brilha de leve. Sem pontos, sem erro.
      var agora = ctx().currentTime;
      var perto = batidas.some(function (b) { return Math.abs(b - agora) <= 0.35; });
      if (perto) {
        tambor.classList.add('brilhando');
        daqui(600, function () { tambor.classList.remove('brilhando'); });
      }
    });

    abrirRodada();
  }

  /* ---------------------------------------------------------
     6) DANÇAR - música + "estátua!"
     --------------------------------------------------------- */
  var CONVITE_DANCAR = 'Vamos dançar de novo com o papai, sem o tablet?';
  var DICA_DANCAR = 'Dancem juntos e parem quando você disser estátua.';

  var MUSICAS = {
    ceci: {
      nome: 'da Cecí', bpm: 96, repetir: 1,
      notas:
        'C5:1 D5:1 E5:1 G5:1  E5:2 D5:2  F5:1 E5:1 D5:1 C5:1  D5:4 ' +
        'C5:1 D5:1 E5:1 G5:1  A5:2 G5:2  E5:1 G5:1 E5:1 D5:1  C5:4 ' +
        'G5:1 A5:1 G5:1 E5:1  D5:2 E5:2  F5:1 E5:1 D5:1 C5:1  G4:4 ' +
        'C5:1 D5:1 E5:1 G5:1  A5:2 G5:2  E5:1 D5:1 C5:2       C5:4',
      icone: '<svg viewBox="0 0 100 100"><circle cx="50" cy="52" r="30" fill="#f7d9a0" stroke="' + CT + '" stroke-width="5"/>' +
             '<path d="M28 30 L24 8 L48 22 Z M72 30 L76 8 L52 22 Z" fill="#f7d9a0" stroke="' + CT + '" stroke-width="5" stroke-linejoin="round"/>' +
             '<circle cx="40" cy="48" r="4" fill="' + CT + '"/><circle cx="60" cy="48" r="4" fill="' + CT + '"/></svg>'
    },
    brilha: {
      nome: 'estrelinha', bpm: 100, repetir: 1,
      notas:
        'C5:1 C5:1 G5:1 G5:1 A5:1 A5:1 G5:2 ' +
        'F5:1 F5:1 E5:1 E5:1 D5:1 D5:1 C5:2 ' +
        'G5:1 G5:1 F5:1 F5:1 E5:1 E5:1 D5:2 ' +
        'G5:1 G5:1 F5:1 F5:1 E5:1 E5:1 D5:2 ' +
        'C5:1 C5:1 G5:1 G5:1 A5:1 A5:1 G5:2 ' +
        'F5:1 F5:1 E5:1 E5:1 D5:1 D5:1 C5:2',
      icone: '<svg viewBox="0 0 100 100"><path d="M50 10 L61 38 L92 40 L68 60 L76 90 L50 73 L24 90 L32 60 L8 40 L39 38 Z" fill="#f2b705" stroke="' + CT + '" stroke-width="5" stroke-linejoin="round"/></svg>'
    },
    vivaldi: {
      nome: 'primavera', bpm: 104, repetir: 3,
      notas:
        'E5:.5 E5:.5 E5:1 E5:.5 E5:.5 E5:1 ' +
        'E5:.5 G#5:.5 B5:1 B5:.5 A5:.5 G#5:1 ' +
        'E5:.5 E5:.5 E5:1 E5:.5 E5:.5 E5:1 ' +
        'E5:.5 G#5:.5 B5:1 B5:.5 A5:.5 E5:1',
      icone: '<svg viewBox="0 0 100 100"><path d="M50 88 V50" stroke="#4aa657" stroke-width="6" stroke-linecap="round"/>' +
             '<path d="M50 56 q-22 -6 -26 -26 q22 2 26 26 Z" fill="#b7d9a8" stroke="' + CT + '" stroke-width="4" stroke-linejoin="round"/>' +
             '<circle cx="58" cy="34" r="18" fill="#e987b8" stroke="' + CT + '" stroke-width="4"/>' +
             '<circle cx="58" cy="34" r="6" fill="#f2b705"/></svg>'
    }
  };

  var danca = { eventos: [], i: 0, base: 0, total: 0, relogio: 0, vozes: [], pausadoEm: 0, tocando: false };

  function tocarNotaMusical(quando, freq, dur) {
    var c = ctx(), m = saida();
    if (!c || !m) return;
    var lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 2400;
    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, quando);
    g.gain.exponentialRampToValueAtTime(0.16, quando + 0.03);
    g.gain.setTargetAtTime(0.0001, quando + dur * 0.7, 0.12);
    g.connect(lp); lp.connect(m);

    var o1 = c.createOscillator();
    o1.type = 'triangle'; o1.frequency.value = freq;
    o1.connect(g);
    var o2 = c.createOscillator();        // uma oitava abaixo, bem baixinho
    o2.type = 'sine'; o2.frequency.value = freq / 2;
    var g2 = c.createGain(); g2.gain.value = 0.35;
    o2.connect(g2); g2.connect(g);

    o1.start(quando); o1.stop(quando + dur + 0.5);
    o2.start(quando); o2.stop(quando + dur + 0.5);
    danca.vozes.push({ o1: o1, o2: o2, g: g });
    if (danca.vozes.length > 40) danca.vozes.splice(0, 20);
  }

  function montarEventos(musica) {
    var eventos = [];
    var t = 0;
    var lista = lerMelodia(musica.notas);
    for (var r = 0; r < (musica.repetir || 1); r++) {
      lista.forEach(function (ev) {
        var dur = ev.batidas * 60 / musica.bpm;
        if (ev.nota !== '-') eventos.push({ t: t, freq: frequencia(ev.nota), dur: dur * 0.92 });
        t += dur;
      });
      t += 60 / musica.bpm;             // um respiro entre as repetições
    }
    return { eventos: eventos, total: t };
  }

  function passoDaMelodia(aoFim) {
    var c = ctx();
    if (!c || !danca.tocando) return;
    var limite = c.currentTime + 0.2 - danca.base;
    while (danca.i < danca.eventos.length && danca.eventos[danca.i].t <= limite) {
      var e = danca.eventos[danca.i];
      tocarNotaMusical(danca.base + e.t, e.freq, e.dur);
      danca.i++;
    }
    if (danca.i >= danca.eventos.length && c.currentTime > danca.base + danca.total) {
      danca.tocando = false;
      clearInterval(danca.relogio);
      if (aoFim) aoFim();
    }
  }

  function pausarMelodia() {
    var c = ctx();
    if (!c) return;
    clearInterval(danca.relogio);
    danca.tocando = false;
    danca.pausadoEm = c.currentTime;
    // silencia o que está soando e devolve para a fila o que já estava agendado
    danca.vozes.forEach(function (v) {
      try {
        v.g.gain.cancelScheduledValues(c.currentTime);
        v.g.gain.setTargetAtTime(0.0001, c.currentTime, 0.05);
        v.o1.stop(c.currentTime + 0.3);
        v.o2.stop(c.currentTime + 0.3);
      } catch (e) {}
    });
    danca.vozes = [];
    while (danca.i > 0 && danca.eventos[danca.i - 1] &&
           danca.base + danca.eventos[danca.i - 1].t > c.currentTime) danca.i--;
  }

  function voltarMelodia(aoFim) {
    var c = ctx();
    if (!c) return;
    danca.base += (c.currentTime - danca.pausadoEm);
    danca.tocando = true;
    danca.relogio = cada(30, function () { passoDaMelodia(aoFim); });
  }

  function atividadeDancar() {
    var cena = document.createElement('div');
    cena.className = 'cena-danca';

    var escolhas = document.createElement('div');
    escolhas.className = 'escolhas-musica';
    cena.appendChild(escolhas);

    var caixaGato = document.createElement('div');
    caixaGato.innerHTML = gatoSVG('gato-danca');
    cena.appendChild(caixaGato);

    var aviso = document.createElement('div');
    aviso.className = 'estatua';
    aviso.textContent = 'estátua!';
    cena.appendChild(aviso);

    palco.appendChild(cena);
    var gato = cena.querySelector('.gato-danca');

    var relogioEstatua = 0;
    var escolhida = 'ceci';

    Object.keys(MUSICAS).forEach(function (chave) {
      var m = MUSICAS[chave];
      var b = document.createElement('button');
      b.className = 'escolha-musica';
      b.innerHTML = m.icone + '<span class="nome">' + m.nome + '</span>';
      b.addEventListener('click', function () {
        if (C.estaBloqueado()) return;
        escolhida = chave;
        marcarEscolha();
        C.falarJa('Música ' + m.nome);
        daqui(900, comecarDanca);
      });
      escolhas.appendChild(b);
    });

    function marcarEscolha() {
      Array.prototype.forEach.call(escolhas.children, function (b, i) {
        b.classList.toggle('escolhida', Object.keys(MUSICAS)[i] === escolhida);
      });
    }

    function pararDanca() {
      clearTimeout(relogioEstatua);
      pausarMelodia();
      danca.eventos = [];
      danca.i = 0;
      gato.classList.remove('dancando', 'congelado');
      aviso.classList.remove('visivel');
    }

    function agendarEstatua() {
      clearTimeout(relogioEstatua);
      relogioEstatua = daqui(8000 + Math.random() * 4000, function () {
        if (!danca.tocando) return;
        pausarMelodia();                       // a música para
        gato.classList.add('congelado');       // o gatinho congela
        aviso.classList.add('visivel');
        C.falarJa('estátua!');
        daqui(3000, function () {              // 3 segundos parados
          aviso.classList.remove('visivel');
          gato.classList.remove('congelado');
          voltarMelodia(fimDaMusica);
          agendarEstatua();
        });
      });
    }

    function fimDaMusica() {
      gato.classList.remove('dancando');
      clearTimeout(relogioEstatua);
      daqui(700, function () {
        C.mostrarFim('Que dança bonita!', CONVITE_DANCAR, DICA_DANCAR,
          function () { abrirSom('dancar'); },
          function () { pararTudo(); C.irPara('tela-musica'); });
      });
    }

    function comecarDanca() {
      pararDanca();
      var m = MUSICAS[escolhida];
      var montado = montarEventos(m);
      danca.eventos = montado.eventos;
      danca.total = montado.total;
      danca.i = 0;
      danca.vozes = [];
      danca.base = ctx().currentTime + 0.3;
      danca.tocando = true;
      danca.relogio = cada(30, function () { passoDaMelodia(fimDaMusica); });
      gato.classList.add('dancando');
      agendarEstatua();
    }

    marcarEscolha();
    C.falar('Vamos dançar! Quando a música parar, vira estátua.');
    daqui(2600, comecarDanca);
  }

  /* ---------------------------------------------------------
     7) Abrir e fechar
     --------------------------------------------------------- */
  function pararTudo() {
    limparRelogios();
    clearInterval(danca.relogio);
    danca.tocando = false;
    danca.eventos = [];
    danca.i = 0;
    var c = ctx();
    if (c) {
      danca.vozes.forEach(function (v) {
        try {
          v.g.gain.cancelScheduledValues(c.currentTime);
          v.g.gain.setTargetAtTime(0.0001, c.currentTime, 0.04);
          v.o1.stop(c.currentTime + 0.2);
          v.o2.stop(c.currentTime + 0.2);
        } catch (e) {}
      });
    }
    danca.vozes = [];
    palco.innerHTML = '';
  }
  C.limparSom = pararTudo;

  function abrirSom(nome) {
    pararTudo();
    atividadeAtual = nome;
    C.registrar(nome);
    C.irPara('tela-som');
    prepararSons();
    daqui(80, function () {
      if (nome === 'tocar') atividadeTocar();
      else if (nome === 'bater') atividadeBater();
      else if (nome === 'dancar') atividadeDancar();
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

  // assim que o menu de música abre, já vai assando os sons
  Array.prototype.forEach.call(
    document.querySelectorAll('#tela-inicio .cartao[data-modulo="musica"]'),
    function (b) { b.addEventListener('click', prepararSons); }
  );

  C.abrirSom = abrirSom;
})();
