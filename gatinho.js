/* ============================================================
   Cecí - o gatinho companheiro
   Um gatinho que aparece em todas as telas. Tocar nele faz alguma
   coisa (mia, se espreguiça, pula, se enrola, pisca, abana o rabo).
   A cada 3 toques ele dá uma dica do que fazer na tela.
   Ele também reage ao que a Cecí faz (acena, balança, boceja, dorme).
   ============================================================ */
(function () {
  'use strict';

  var C = window.Ceci;
  var CT = '#3d3a35';
  var PELO = '#f7d9a0';

  /* ---------------------------------------------------------
     1) O desenho do gatinho (usado também na cena de dormir)
     --------------------------------------------------------- */
  function svgGatinho() {
    return '' +
      '<svg class="gato-svg" viewBox="0 0 200 210" aria-hidden="true">' +
        '<g class="rabo">' +
          '<path d="M46 176 q-26 4 -22 -22" fill="none" stroke="' + CT + '" stroke-width="12" stroke-linecap="round"/>' +
          '<path d="M46 176 q-26 4 -22 -22" fill="none" stroke="' + PELO + '" stroke-width="6" stroke-linecap="round"/>' +
        '</g>' +
        '<g class="corpo">' +
          '<ellipse cx="100" cy="156" rx="50" ry="42" fill="' + PELO + '" stroke="' + CT + '" stroke-width="4"/>' +
          '<ellipse cx="74" cy="193" rx="17" ry="9" fill="' + PELO + '" stroke="' + CT + '" stroke-width="4"/>' +
          '<ellipse cx="126" cy="193" rx="17" ry="9" fill="' + PELO + '" stroke="' + CT + '" stroke-width="4"/>' +
        '</g>' +
        '<g class="patinha">' +
          '<path d="M142 158 L166 108" fill="none" stroke="' + CT + '" stroke-width="18" stroke-linecap="round"/>' +
          '<path d="M142 158 L166 108" fill="none" stroke="' + PELO + '" stroke-width="11" stroke-linecap="round"/>' +
          '<circle cx="168" cy="102" r="14" fill="' + PELO + '" stroke="' + CT + '" stroke-width="4"/>' +
        '</g>' +
        '<g class="cabeca">' +
          '<path d="M66 66 L60 26 L94 46 Z" fill="' + PELO + '" stroke="' + CT + '" stroke-width="4" stroke-linejoin="round"/>' +
          '<path d="M134 66 L140 26 L106 46 Z" fill="' + PELO + '" stroke="' + CT + '" stroke-width="4" stroke-linejoin="round"/>' +
          '<ellipse cx="100" cy="86" rx="44" ry="40" fill="' + PELO + '" stroke="' + CT + '" stroke-width="4"/>' +
          '<g class="olhos-abertos">' +
            '<circle cx="83" cy="82" r="5.5" fill="' + CT + '"/>' +
            '<circle cx="117" cy="82" r="5.5" fill="' + CT + '"/>' +
          '</g>' +
          '<g class="olhos-fechados">' +
            '<path d="M75 82 q8 8 16 0 M109 82 q8 8 16 0" fill="none" stroke="' + CT + '" stroke-width="4" stroke-linecap="round"/>' +
          '</g>' +
          '<path class="boca" d="M100 98 q-6 8 -12 3 M100 98 q6 8 12 3" fill="none" stroke="' + CT + '" stroke-width="4" stroke-linecap="round"/>' +
          '<ellipse class="boca-aberta" cx="100" cy="104" rx="7" ry="9" fill="#c9605f" stroke="' + CT + '" stroke-width="3"/>' +
          '<path d="M46 86 H66 M46 96 H66 M134 86 H154 M134 96 H154" stroke="' + CT + '" stroke-width="3" stroke-linecap="round"/>' +
        '</g>' +
        '<g class="zzz" fill="#e8dcbe" font-family="Segoe UI, sans-serif" font-weight="700">' +
          '<text class="z1" x="150" y="60" font-size="22">z</text>' +
          '<text class="z2" x="166" y="40" font-size="28">z</text>' +
          '<text class="z3" x="184" y="18" font-size="34">z</text>' +
        '</g>' +
      '</svg>';
  }

  /* ---------------------------------------------------------
     2) Sons do gatinho (Web Audio, tudo suave)
     --------------------------------------------------------- */
  function miar() {
    var c = C.audio(); if (!c) return;
    var t = c.currentTime;
    var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1600;
    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.08);
    g.gain.setValueAtTime(0.06, t + 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    var o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(680, t);
    o.frequency.linearRampToValueAtTime(560, t + 0.25);
    o.frequency.linearRampToValueAtTime(420, t + 0.65);
    var o2 = c.createOscillator();                    // um harmônico bem baixinho
    o2.type = 'triangle';
    o2.frequency.setValueAtTime(1360, t);
    o2.frequency.linearRampToValueAtTime(840, t + 0.65);
    var g2 = c.createGain(); g2.gain.value = 0.12;
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(lp); lp.connect(c.destination);
    o.start(t); o.stop(t + 0.8); o2.start(t); o2.stop(t + 0.8);
  }

  function shhh() {
    var c = C.audio(); if (!c) return;
    var t = c.currentTime;
    var dur = 0.7;
    var buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    var s = c.createBufferSource(); s.buffer = buf;
    var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 0.7;
    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.045, t + 0.12);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    s.connect(bp); bp.connect(g); g.connect(c.destination);
    s.start(t);
  }

  function roncar() {
    var c = C.audio(); if (!c) return;
    var t = c.currentTime;
    var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220;
    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.03, t + 0.5);
    g.gain.linearRampToValueAtTime(0.0001, t + 1.3);
    var o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(70, t);
    o.frequency.linearRampToValueAtTime(58, t + 1.3);
    o.connect(g); g.connect(lp); lp.connect(c.destination);
    o.start(t); o.stop(t + 1.4);
  }

  /* ---------------------------------------------------------
     3) O gatinho companheiro (fica no canto de todas as telas)
     --------------------------------------------------------- */
  var el = document.createElement('div');
  el.id = 'gatinho';
  el.innerHTML = svgGatinho();
  document.body.appendChild(el);

  var relogioReacao = 0;
  var toques = 0;

  // troca a "reação" atual por outra, sempre limpando a anterior
  var REACOES = ['miando', 'espreguicando', 'pulando', 'enrolando', 'piscando', 'abanando',
                 'acenando', 'balancando', 'bocejando'];
  function reagir(nome, duracao, alvo) {
    var g = alvo || el;
    REACOES.forEach(function (r) { g.classList.remove(r); });
    void g.offsetWidth;                          // reinicia a animação
    g.classList.add(nome);
    if (g === el) {
      clearTimeout(relogioReacao);
      relogioReacao = setTimeout(function () { g.classList.remove(nome); }, duracao);
    } else {
      setTimeout(function () { g.classList.remove(nome); }, duracao);
    }
  }

  // as 6 reações sorteadas quando ela toca no gatinho
  var SORTEIO = [
    function () { reagir('miando', 900); miar(); },
    function () { reagir('espreguicando', 1600); },
    function () { reagir('pulando', 1000); C.nota(C.NOTAS[4], 0.3, 0.04); },
    function () { reagir('enrolando', 1800); },
    function () { reagir('piscando', 900); },
    function () { reagir('abanando', 1600); }
  ];
  var ultimoSorteio = -1;

  // dicas curtinhas do que fazer em cada tela
  var DICAS = {
    'tela-inicio': 'Toca no lápis para desenhar!',
    'tela-desenho': 'Escolhe uma cor e risca a folha!',
    'tela-brincar': 'Toca numa brincadeira!',
    'tela-musica': 'Toca na música!',
    'tela-atividade': 'Vai em frente, é só tocar!',
    'tela-som': 'Toca e escuta!'
  };

  function dicaDaTela() {
    var tela = document.body.getAttribute('data-tela') || 'tela-inicio';
    if (tela === 'tela-atividade' || tela === 'tela-som') {
      if (C.dicaAtual === false) return null;     // brincadeira pediu silêncio
      return C.dicaAtual || DICAS[tela];
    }
    return DICAS[tela];
  }

  el.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (C.estaBloqueado()) return;
    toques++;
    if (toques % 3 === 0) {
      var dica = dicaDaTela();
      reagir('balancando', 1600);
      if (dica) C.falarJa(dica);
      return;
    }
    var i;
    do { i = Math.floor(Math.random() * SORTEIO.length); } while (i === ultimoSorteio);
    ultimoSorteio = i;
    SORTEIO[i]();
  });

  /* ---------------------------------------------------------
     4) Cena de dormir (dentro do #ritual)
     --------------------------------------------------------- */
  var quarto = document.querySelector('#ritual .quarto');
  var gatoRitual = quarto ? quarto.querySelector('.gato-ritual') : null;
  if (gatoRitual) gatoRitual.innerHTML = svgGatinho();
  var relogioRonco = 0;

  function dormir() {
    if (!gatoRitual) return;
    gatoRitual.className = 'gato-ritual';
    gatoRitual.style.left = '';
    setTimeout(function () { reagir('bocejando', 1800, gatoRitual); }, 1400);
    setTimeout(function () { gatoRitual.classList.add('andando'); }, 3600);
    setTimeout(function () { gatoRitual.classList.remove('andando'); gatoRitual.classList.add('deitado'); }, 7400);
    setTimeout(function () {
      gatoRitual.classList.add('dormindo');
      clearInterval(relogioRonco);
      relogioRonco = setInterval(roncar, 3200);
      roncar();
    }, 8800);
  }

  function acordar() {
    clearInterval(relogioRonco);
    if (gatoRitual) { gatoRitual.className = 'gato-ritual'; gatoRitual.style.left = ''; }
  }

  if (gatoRitual) {
    gatoRitual.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      if (!gatoRitual.classList.contains('dormindo')) return;
      shhh();                                    // tocar nele dormindo: só um "shhh"
      gatoRitual.classList.add('shhh');
      setTimeout(function () { gatoRitual.classList.remove('shhh'); }, 900);
    });
  }

  /* ---------------------------------------------------------
     5) O que o resto do app pode pedir ao gatinho
     --------------------------------------------------------- */
  C.gatinho = {
    acena:   function () { reagir('acenando', 2000); },
    balanca: function () { reagir('balancando', 1600); },
    boceja:  function () { reagir('bocejando', 1900); },
    pula:    function () { reagir('pulando', 1000); },
    mia:     function () { reagir('miando', 900); miar(); },
    dormir:  dormir,
    acordar: acordar,
    shhh:    shhh
  };
})();
