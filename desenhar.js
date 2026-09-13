/* ============================================================
   Cecí - DESENHAR (os modos do ateliê e o Misturar cores)
   Menu Desenhar: Folha livre, Seguir a linha, Espelho, Completar,
   Pintar dentro, Misturar cores.
   O ateliê em si (canvas, pincéis, borracha, carimbo, galeria) fica
   no app.js; este arquivo desenha as figuras nas folhas, registra os
   carimbos de bichos e veículos e cuida da tela de misturar cores.
   ============================================================ */
(function () {
  'use strict';

  var C = window.Ceci;
  var A = C.atelie;
  if (!A) return;

  var CT = '#3a3630';
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  /* ---------------------------------------------------------
     1) Figuras desenhadas na folha (contornos escuros)
     Cada figura desenha num quadrado de 100 x 100 e é ampliada
     para caber bem na folha.
     --------------------------------------------------------- */
  function comFigura(fn) {
    var ctx = A.ctx, f = A.folha();
    var S = Math.min(f.w, f.h) * 0.82;
    var ox = (f.w - S) / 2, oy = (f.h - S) / 2;
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.translate(ox, oy);
    ctx.scale(S / 100, S / 100);
    ctx.lineWidth = 8 / (S / 100);         // 8 px na folha, seja qual for o tamanho
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = CT;
    fn(ctx);
    ctx.restore();
  }

  function elipse(ctx, cx, cy, rx, ry, rot) {
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, rot || 0, 0, Math.PI * 2); ctx.stroke();
  }
  function circulo(ctx, cx, cy, r) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); }
  function poligono(ctx, pts) {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath(); ctx.stroke();
  }
  function linha(ctx, x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
  function retangulo(ctx, x, y, w, h) { ctx.beginPath(); ctx.rect(x, y, w, h); ctx.stroke(); }

  // ---- figuras para "pintar dentro" (cheias de áreas fechadas) ----
  var FIGURAS_PINTAR = {
    flor: function (ctx) {
      linha(ctx, 50, 64, 50, 96);
      elipse(ctx, 37, 80, 10, 5.5, -0.6);
      elipse(ctx, 63, 88, 10, 5.5, 0.6);
      for (var i = 0; i < 6; i++) {
        var a = -Math.PI / 2 + i * Math.PI / 3;
        elipse(ctx, 50 + Math.cos(a) * 24, 52 + Math.sin(a) * 24, 13, 8.5, a);
      }
      circulo(ctx, 50, 52, 12);
    },
    carro: function (ctx) {
      poligono(ctx, [[8, 64], [8, 48], [22, 46], [32, 28], [68, 28], [80, 46], [92, 48], [92, 64]]);
      retangulo(ctx, 36, 32, 14, 14); retangulo(ctx, 54, 32, 14, 14);
      circulo(ctx, 28, 66, 10); circulo(ctx, 28, 66, 3.5);
      circulo(ctx, 72, 66, 10); circulo(ctx, 72, 66, 3.5);
    },
    peixe: function (ctx) {
      elipse(ctx, 46, 50, 30, 20);
      poligono(ctx, [[74, 50], [94, 32], [94, 68]]);
      ctx.beginPath(); ctx.moveTo(40, 31); ctx.quadraticCurveTo(34, 50, 40, 69); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(56, 31.5); ctx.quadraticCurveTo(50, 50, 56, 68.5); ctx.stroke();
      circulo(ctx, 27, 46, 3.5);
    },
    borboleta: function (ctx) {
      elipse(ctx, 34, 40, 16, 14, -0.3); elipse(ctx, 66, 40, 16, 14, 0.3);
      elipse(ctx, 37, 63, 12, 11, 0.3); elipse(ctx, 63, 63, 12, 11, -0.3);
      elipse(ctx, 50, 52, 5, 22);
      ctx.beginPath(); ctx.moveTo(47, 31); ctx.quadraticCurveTo(40, 18, 36, 14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(53, 31); ctx.quadraticCurveTo(60, 18, 64, 14); ctx.stroke();
    },
    casa: function (ctx) {
      retangulo(ctx, 24, 50, 52, 40);
      poligono(ctx, [[16, 52], [50, 18], [84, 52]]);
      retangulo(ctx, 44, 66, 12, 24);
      retangulo(ctx, 30, 58, 12, 12); linha(ctx, 36, 58, 36, 70); linha(ctx, 30, 64, 42, 64);
      retangulo(ctx, 64, 24, 8, 16);
    }
  };
  var ORDEM_PINTAR = ['flor', 'carro', 'peixe', 'borboleta', 'casa'];

  // ---- meios desenhos para "completar" ----
  var FIGURAS_COMPLETAR = {
    rosto: { frase: 'Que rosto lindo!', desenhar: function (ctx) {
      ctx.beginPath(); ctx.arc(50, 52, 38, Math.PI / 2, Math.PI * 1.5); ctx.stroke();   // metade esquerda
      circulo(ctx, 36, 44, 4);
      ctx.beginPath(); ctx.moveTo(32, 66); ctx.quadraticCurveTo(40, 74, 50, 74); ctx.stroke();
      ctx.setLineDash([2, 6]); ctx.lineWidth = ctx.lineWidth * 0.4;
      linha(ctx, 50, 14, 50, 90);
    } },
    gato: { frase: 'Que gato lindo!', desenhar: function (ctx) {
      elipse(ctx, 50, 64, 26, 19);
      circulo(ctx, 50, 32, 16);
      poligono(ctx, [[38, 20], [34, 4], [48, 16]]); poligono(ctx, [[62, 20], [66, 4], [52, 16]]);
      circulo(ctx, 44, 30, 2); circulo(ctx, 56, 30, 2);
      ctx.beginPath(); ctx.moveTo(50, 38); ctx.quadraticCurveTo(46, 42, 42, 39); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(50, 38); ctx.quadraticCurveTo(54, 42, 58, 39); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(76, 70); ctx.quadraticCurveTo(94, 62, 86, 46); ctx.stroke();
    } },
    casa: { frase: 'Que casa linda!', desenhar: function (ctx) {
      retangulo(ctx, 24, 48, 52, 42);
      retangulo(ctx, 44, 66, 12, 24);
      retangulo(ctx, 30, 56, 12, 12);
    } },
    flor: { frase: 'Que flor linda!', desenhar: function (ctx) {
      circulo(ctx, 50, 48, 10);
      linha(ctx, 50, 58, 50, 96);
      elipse(ctx, 37, 80, 10, 5.5, -0.6);
    } },
    carro: { frase: 'Que carro lindo!', desenhar: function (ctx) {
      poligono(ctx, [[8, 64], [8, 48], [22, 46], [32, 28], [68, 28], [80, 46], [92, 48], [92, 64]]);
      retangulo(ctx, 36, 32, 14, 14); retangulo(ctx, 54, 32, 14, 14);
    } }
  };
  var ORDEM_COMPLETAR = ['rosto', 'gato', 'casa', 'flor', 'carro'];

  var figuraAtual = '';
  var ultimaPintar = '', ultimaCompletar = '';

  function sortear(lista, evitar) {
    var x; do { x = lista[Math.floor(Math.random() * lista.length)]; } while (x === evitar && lista.length > 1);
    return x;
  }

  function novaFiguraPintar() {
    figuraAtual = sortear(ORDEM_PINTAR, ultimaPintar); ultimaPintar = figuraAtual;
    A.limparFolha();
    comFigura(FIGURAS_PINTAR[figuraAtual]);
  }
  function novaFiguraCompletar() {
    figuraAtual = sortear(ORDEM_COMPLETAR, ultimaCompletar); ultimaCompletar = figuraAtual;
    A.limparFolha();
    comFigura(FIGURAS_COMPLETAR[figuraAtual].desenhar);
  }

  /* ---------------------------------------------------------
     2) Carimbos de bichos e veículos (desenhos SVG do brincar.js)
     --------------------------------------------------------- */
  var imagens = {};
  function imagemDe(nome, svg) {
    if (imagens[nome]) return imagens[nome];
    var img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '));
    imagens[nome] = img;
    return img;
  }
  var CARIMBOS_BICHOS = ['peixe', 'borboleta', 'passarinho', 'sapo'];
  var CARIMBOS_VEICULOS = ['carro', 'onibus', 'aviao', 'trem'];

  CARIMBOS_BICHOS.forEach(function (chave) {
    if (!C.ANIMAIS || !C.ANIMAIS[chave]) return;
    var svg = C.svgAnimal(chave);
    var img = imagemDe('bicho:' + chave, svg);
    A.registrarCarimbo('bicho:' + chave, function (ctx, r) {
      if (!img.complete) return;
      ctx.drawImage(img, -r * 1.15, -r * 0.96, r * 2.3, r * 1.92);   // quadro 120 x 100
    });
  });
  CARIMBOS_VEICULOS.forEach(function (chave) {
    if (!C.VEICULOS || !C.VEICULOS[chave]) return;
    var img = imagemDe('veiculo:' + chave, C.VEICULOS[chave].svg);
    A.registrarCarimbo('veiculo:' + chave, function (ctx, r) {
      if (!img.complete) return;
      ctx.drawImage(img, -r, -r, r * 2, r * 2);
    });
  });

  // monta as duas fileiras novas no painel do carimbo
  (function montarPainel() {
    var figuras = $('#escolher-carimbo .figuras');
    if (!figuras) return;
    function fileira(lista, prefixo, svgDe) {
      var f = document.createElement('div');
      f.className = 'figuras';
      lista.forEach(function (chave) {
        var svg = svgDe(chave);
        if (!svg) return;
        var b = document.createElement('button');
        b.className = 'figura';
        b.setAttribute('data-figura', prefixo + ':' + chave);
        b.innerHTML = svg;
        f.appendChild(b);
      });
      figuras.parentNode.appendChild(f);
    }
    fileira(CARIMBOS_BICHOS, 'bicho', function (k) { return C.ANIMAIS && C.ANIMAIS[k] ? C.svgAnimal(k) : null; });
    fileira(CARIMBOS_VEICULOS, 'veiculo', function (k) { return C.VEICULOS && C.VEICULOS[k] ? C.VEICULOS[k].svg : null; });
  })();

  /* ---------------------------------------------------------
     3) Menu Desenhar e os modos
     --------------------------------------------------------- */
  var DICAS = {
    livre: 'Escolhe uma cor e risca a folha!',
    linha: 'Começa na bolinha verde e segue a linha.',
    espelho: 'Risca de um lado e olha o outro!',
    completar: 'O desenho está pela metade. Termina ele!',
    pintar: 'Toca dentro da figura para pintar!'
  };

  function abrirModo(nome) {
    C.registrar('desenhar');
    C.irPara('tela-desenho');
    setTimeout(function () {
      A.ajustar();
      A.limparFolha();
      A.definirModo(nome);
      C.dicaAtual = DICAS[nome];
      if (nome === 'pintar') { novaFiguraPintar(); C.falar('Toca dentro da figura para pintar!'); }
      else if (nome === 'completar') { novaFiguraCompletar(); C.falar('O desenho está pela metade. Termina ele!'); }
      else if (nome === 'espelho') { C.falar('Risca de um lado e olha o outro!'); }
      else if (nome === 'livre') { C.falar('Escolhe uma cor e risca a folha!'); }
      // no modo linha o próprio app.js fala a instrução
    }, 60);
  }

  $$('#tela-desenhar .cartao[data-desenho]').forEach(function (b) {
    b.addEventListener('click', function () {
      var nome = b.getAttribute('data-desenho');
      C.nota(C.NOTAS[3], 0.34, 0.05);
      if (nome === 'cores') abrirCores();
      else abrirModo(nome);
    });
  });
  $('#btn-desenhar-casa').addEventListener('click', function () { C.irPara('tela-inicio'); });

  // botão "outra" (a mesma tecla da linha): outra figura para pintar / completar
  A.aoPedirOutra = function () {
    var m = A.modo();
    if (m === 'pintar') { novaFiguraPintar(); C.nota(C.NOTAS[2], 0.3, 0.05); }
    else if (m === 'completar') { novaFiguraCompletar(); C.nota(C.NOTAS[2], 0.3, 0.05); }
  };

  // guardou no modo completar: o gatinho elogia o desenho
  A.aoGuardar = function () {
    if (A.modo() !== 'completar' || !figuraAtual) return;
    var f = FIGURAS_COMPLETAR[figuraAtual];
    if (f) setTimeout(function () { C.falarJa(f.frase); }, 500);
  };

  /* ---------------------------------------------------------
     4) Desenhar com música (botão no ateliê)
     --------------------------------------------------------- */
  var btnMusica = $('#btn-musica-fundo');
  if (btnMusica) {
    btnMusica.addEventListener('click', function () {
      if (!C.fundoMusical) return;
      if (C.fundoMusical.ligado) { C.fundoMusical.parar(); btnMusica.classList.remove('escolhida'); return; }
      C.fundoMusical.tocar(null, 0.28);
      btnMusica.classList.add('escolhida');
      C.nota(C.NOTAS[3], 0.3, 0.04);
    });
    // ao trocar de tela o app para a música: o botão volta ao normal
    var obs = new MutationObserver(function () {
      if (document.body.getAttribute('data-tela') !== 'tela-desenho') btnMusica.classList.remove('escolhida');
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ['data-tela'] });
  }

  /* ---------------------------------------------------------
     5) MISTURAR CORES - três potes; arrasta um sobre o outro
     --------------------------------------------------------- */
  var POTES = [
    { chave: 'vermelho', cor: '#e04a3f' },
    { chave: 'azul', cor: '#3a72c4' },
    { chave: 'amarelo', cor: '#f2b705' }
  ];
  var MISTURAS = {
    'amarelo+azul': { nome: 'verde', cor: '#4aa657', frase: 'Azul com amarelo dá verde!' },
    'amarelo+vermelho': { nome: 'laranja', cor: '#f0873a', frase: 'Vermelho com amarelo dá laranja!' },
    'azul+vermelho': { nome: 'roxo', cor: '#8e5bb5', frase: 'Vermelho com azul dá roxo!' }
  };
  var palco = $('#palco-cores');
  var relogiosCores = [];
  function depois(ms, fn) { relogiosCores.push(setTimeout(fn, ms)); }

  function abrirCores() {
    C.registrar('cores');
    C.irPara('tela-cores');
    C.dicaAtual = 'Arrasta um pote em cima do outro!';
    montarCores();
    C.falar('Arrasta um pote em cima do outro e olha a cor nova!');
  }

  function potePos(i) {
    var r = palco.getBoundingClientRect();
    return { x: r.width * (0.2 + i * 0.3), y: r.height * 0.72 };
  }

  function montarCores() {
    relogiosCores.forEach(clearTimeout); relogiosCores = [];
    palco.innerHTML =
      '<div class="resultado-cor"><div class="bola-cor"></div><div class="nome-cor"></div></div>' +
      '<div class="paleta-nova"></div>';
    var resultado = palco.querySelector('.resultado-cor');
    var bola = palco.querySelector('.bola-cor');
    var nomeCor = palco.querySelector('.nome-cor');
    var potes = [];

    POTES.forEach(function (p, i) {
      var el = document.createElement('div');
      el.className = 'pote';
      el.setAttribute('data-chave', p.chave);
      el.innerHTML =
        '<svg viewBox="0 0 100 110" aria-hidden="true">' +
        '<path d="M18 30 h64 l-6 66 q0 8 -8 8 h-36 q-8 0 -8 -8 Z" fill="' + p.cor + '" stroke="' + CT + '" stroke-width="5" stroke-linejoin="round"/>' +
        '<ellipse cx="50" cy="30" rx="34" ry="11" fill="' + p.cor + '" stroke="' + CT + '" stroke-width="5"/>' +
        '<ellipse cx="50" cy="30" rx="24" ry="6" fill="rgba(255,255,255,.35)"/>' +
        '</svg>';
      palco.appendChild(el);
      potes.push(el);
      colocar(el, potePos(i));
      arrastavel(el, p, i);
    });

    function colocar(el, pos) {
      el.style.left = pos.x + 'px'; el.style.top = pos.y + 'px';
    }

    function arrastavel(el, p, indice) {
      var id = null, inicio = null, mexeu = false;
      el.addEventListener('pointerdown', function (e) {
        if (C.estaBloqueado() || id !== null) return;
        id = e.pointerId; mexeu = false;
        inicio = { x: e.clientX - parseFloat(el.style.left), y: e.clientY - parseFloat(el.style.top) };
        el.classList.add('pegando');
        try { el.setPointerCapture(e.pointerId); } catch (err) {}
        e.preventDefault();
      });
      el.addEventListener('pointermove', function (e) {
        if (e.pointerId !== id) return;
        var x = e.clientX - inicio.x, y = e.clientY - inicio.y;
        if (!mexeu && Math.hypot(x - parseFloat(el.style.left), y - parseFloat(el.style.top)) > 6) mexeu = true;
        colocar(el, { x: x, y: y });
        // realça o pote que está embaixo
        var alvo = poteEmbaixo(el);
        potes.forEach(function (o) { o.classList.toggle('alvo', o === alvo); });
      });
      function soltou(e) {
        if (e.pointerId !== id) return;
        id = null;
        el.classList.remove('pegando');
        potes.forEach(function (o) { o.classList.remove('alvo'); });
        var alvo = poteEmbaixo(el);
        if (!mexeu) { C.falarJa(p.chave); voltar(); return; }    // toque: diz o nome da cor
        if (alvo) misturar(p, POTES[potes.indexOf(alvo)], alvo);
        voltar();
      }
      function voltar() {
        el.classList.add('voltando');
        colocar(el, potePos(indice));
        depois(700, function () { el.classList.remove('voltando'); });
      }
      el.addEventListener('pointerup', soltou);
      el.addEventListener('pointercancel', soltou);
    }

    function poteEmbaixo(el) {
      var r = el.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var melhor = null, menor = Infinity;
      potes.forEach(function (o) {
        if (o === el) return;
        var q = o.getBoundingClientRect();
        var d = Math.hypot(q.left + q.width / 2 - cx, q.top + q.height / 2 - cy);
        if (d < Math.max(q.width, q.height) * 0.8 && d < menor) { menor = d; melhor = o; }
      });
      return melhor;
    }

    var misturando = false;
    function misturar(a, b, alvoEl) {
      if (misturando) return;
      var chave = [a.chave, b.chave].sort().join('+');
      var m = MISTURAS[chave];
      if (!m) return;
      misturando = true;
      alvoEl.classList.add('mexendo');
      bola.style.background = 'linear-gradient(90deg, ' + a.cor + ' 0 50%, ' + b.cor + ' 50% 100%)';
      resultado.classList.add('visivel');
      nomeCor.textContent = '';
      depois(900, function () {
        bola.style.background = m.cor;
        nomeCor.textContent = m.nome;
        C.nota(C.NOTAS[3], 0.4, 0.05); setTimeout(function () { C.nota(C.NOTAS[5], 0.5, 0.05); }, 160);
        C.falarJa(m.frase);
        alvoEl.classList.remove('mexendo');
        var nova = A.adicionarCor(m.cor, m.nome);
        mostrarNaPaleta(m);
        if (C.gatinho) C.gatinho.balanca();
        misturando = false;
      });
    }

    var paleta = palco.querySelector('.paleta-nova');
    var jaMostradas = {};
    function mostrarNaPaleta(m) {
      if (jaMostradas[m.nome]) return;
      jaMostradas[m.nome] = true;
      var d = document.createElement('div');
      d.className = 'cor-nova';
      d.style.background = m.cor;
      d.setAttribute('data-nome', m.nome);
      d.addEventListener('pointerdown', function (e) { e.preventDefault(); C.falarJa(m.nome); });
      paleta.appendChild(d);
    }
    // as cores que já foram misturadas antes aparecem na paleta
    Object.keys(MISTURAS).forEach(function (k) {
      var m = MISTURAS[k];
      if ($$('.ferramenta.cor').some(function (b) { return b.getAttribute('data-cor') === m.cor; }) && m.nome !== 'verde') mostrarNaPaleta(m);
    });
  }

  $('#btn-cores-voltar').addEventListener('click', function () { C.irPara('tela-desenhar'); });
  window.addEventListener('resize', function () {
    if (document.body.getAttribute('data-tela') === 'tela-cores') montarCores();
  });
})();
