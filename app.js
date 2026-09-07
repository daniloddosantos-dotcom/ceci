/* ============================================================
   Cecí - cérebro do aplicativo
   Tudo em um arquivo só, sem bibliotecas externas.
   Está dividido em blocos comentados para você conseguir ler.
   ============================================================ */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     0) Atalhos e memória (localStorage)
     --------------------------------------------------------- */
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  // "balcão" compartilhado com o brincar.js (Fase 2)
  window.Ceci = window.Ceci || {};

  var CHAVE_CONFIG = 'ceci.config.v1';
  var CHAVE_GALERIA = 'ceci.galeria.v1';
  var MAX_DESENHOS = 12;

  function lerJSON(chave) {
    try { return JSON.parse(localStorage.getItem(chave) || 'null'); }
    catch (e) { return null; }
  }
  function gravarJSON(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); return true; }
    catch (e) { return false; }
  }

  var config = Object.assign(
    { minutos: 10, pin: '1234', nivel: 1, registro: {}, voz: '' },
    lerJSON(CHAVE_CONFIG) || {}
  );
  if (!config.registro) config.registro = {};
  function salvarConfig() { gravarJSON(CHAVE_CONFIG, config); }

  // conta quantas vezes cada brincadeira foi aberta (só o papai vê)
  function registrar(atividade) {
    var r = config.registro[atividade] || { vezes: 0, nivel: config.nivel };
    r.vezes += 1;
    r.nivel = config.nivel;
    config.registro[atividade] = r;
    salvarConfig();
  }

  var bloqueado = false;   // true durante o ritual de tchau
  var telaAtual = 'tela-inicio';

  /* ---------------------------------------------------------
     1) Sons suaves (Web Audio API - nada de arquivos externos)
     --------------------------------------------------------- */
  var ac = null;
  function audio() {
    try {
      if (!ac) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        // "interactive" = a menor demora possível entre o toque e o som
        try { ac = new AC({ latencyHint: 'interactive' }); }
        catch (e) { ac = new AC(); }
      }
      if (ac.state === 'suspended') { ac.resume(); }
      return ac;
    } catch (e) { return null; }
  }

  // uma nota macia, curta, com subida e descida lentas (nada de "bip")
  function nota(freq, dur, vol) {
    var c = audio(); if (!c) return;
    dur = dur || 0.32; vol = vol || 0.07;
    var t = c.currentTime;
    var osc = c.createOscillator();
    var g = c.createGain();
    var filtro = c.createBiquadFilter();
    filtro.type = 'lowpass'; filtro.frequency.value = 1800;
    osc.type = 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(filtro); filtro.connect(g); g.connect(c.destination);
    osc.start(t); osc.stop(t + dur + 0.05);
  }

  // escala pentatônica: qualquer combinação soa agradável
  var NOTAS = [392.00, 440.00, 493.88, 587.33, 659.25, 783.99];

  /* ---------------------------------------------------------
     2) Voz calma (speechSynthesis em português do Brasil)
     --------------------------------------------------------- */
  var VELOCIDADE_FALA = 0.9;    // um pouquinho mais devagar
  var TOM_FALA = 1.1;           // um pouquinho mais agudo

  var vozes = [];
  var vozEscolhida = null;

  function vozesEmPortugues() {
    return vozes.filter(function (v) { return /^pt/i.test(v.lang || ''); });
  }

  // nota de "naturalidade": Google/Samsung > Natural/Neural > qualquer pt-BR
  function pontuacaoDaVoz(v) {
    var nome = (v.name || '').toLowerCase();
    var pontos = 0;
    if (/pt[-_]br/i.test(v.lang || '')) pontos += 10;
    if (nome.indexOf('google') >= 0 || nome.indexOf('samsung') >= 0) pontos += 6;
    else if (nome.indexOf('natural') >= 0 || nome.indexOf('neural') >= 0) pontos += 4;
    if (v.localService) pontos += 1;
    return pontos;
  }

  function escolherVoz() {
    var lista = vozesEmPortugues();
    if (!lista.length) { vozEscolhida = null; return; }
    if (config.voz) {                       // o papai escolheu na mão
      var manual = lista.filter(function (v) { return v.name === config.voz; })[0];
      if (manual) { vozEscolhida = manual; return; }
    }
    vozEscolhida = lista.slice().sort(function (a, b) {
      return pontuacaoDaVoz(b) - pontuacaoDaVoz(a);
    })[0];
  }

  function carregarVozes() {
    try { vozes = window.speechSynthesis.getVoices() || []; } catch (e) { vozes = []; }
    escolherVoz();
    if (typeof montarSeletorDeVozes === 'function') montarSeletorDeVozes();
  }

  if ('speechSynthesis' in window) {
    carregarVozes();
    window.speechSynthesis.onvoiceschanged = function () {
      carregarVozes();
      // mostra no console quais vozes em português existem neste aparelho
      try {
        console.log('Cecí - vozes em português encontradas:',
          vozesEmPortugues().map(function (v) { return v.name + ' (' + v.lang + ')'; }));
        console.log('Cecí - voz escolhida:', vozEscolhida ? vozEscolhida.name : 'nenhuma');
      } catch (e) {}
    };
  }

  /* ---- FILA DE FALA ----------------------------------------
     Cada frase espera a anterior terminar (onend).
     Se o onend não disparar (acontece em alguns aparelhos),
     um relógio de segurança segue em frente sozinho.
     Só um toque novo ou sair da tela limpa a fila.
     --------------------------------------------------------- */
  var filaDeFala = [];
  var falando = false;
  var relogioDaFala = 0;

  function falar(texto) {
    if (!texto) return;
    filaDeFala.push(String(texto));
    if (!falando) proximaFrase();
  }

  function falarLista(lista) {
    (lista || []).forEach(function (t) { falar(t); });
  }

  // interrompe o que estiver falando e diz esta frase agora
  function falarJa(texto) {
    limparFala();
    falar(texto);
  }

  function limparFala() {
    filaDeFala = [];
    falando = false;
    clearTimeout(relogioDaFala);
    try { window.speechSynthesis.cancel(); } catch (e) {}
  }

  function proximaFrase() {
    if (!filaDeFala.length) { falando = false; return; }
    if (!('speechSynthesis' in window)) { filaDeFala = []; falando = false; return; }

    falando = true;
    var texto = filaDeFala.shift();

    try {
      var u = new SpeechSynthesisUtterance(texto);
      u.lang = 'pt-BR';
      u.rate = VELOCIDADE_FALA;
      u.pitch = TOM_FALA;
      u.volume = 0.9;
      if (!vozes.length) carregarVozes();
      if (!vozEscolhida) escolherVoz();
      if (vozEscolhida) u.voice = vozEscolhida;

      var jaSeguiu = false;
      function seguir() {
        if (jaSeguiu) return;
        jaSeguiu = true;
        clearTimeout(relogioDaFala);
        setTimeout(proximaFrase, 260);        // respirinho entre as frases
      }
      u.onend = seguir;
      u.onerror = seguir;

      // relógio de segurança: tempo estimado pelo tamanho da frase
      var estimativa = 1500 + texto.length * 110;
      relogioDaFala = setTimeout(function esperarMais() {
        try {
          if (window.speechSynthesis.speaking && !jaSeguiu) {
            relogioDaFala = setTimeout(esperarMais, 800);   // ainda falando: espera mais
            return;
          }
        } catch (e) {}
        seguir();
      }, estimativa);

      window.speechSynthesis.speak(u);
    } catch (e) {
      falando = false;
    }
  }

  /* ---------------------------------------------------------
     3) Avisos curtinhos na tela
     --------------------------------------------------------- */
  var elAviso = $('#aviso');
  var avisoTimer = 0;
  function aviso(texto) {
    elAviso.textContent = texto;
    elAviso.classList.remove('oculto');
    setTimeout(function () { elAviso.classList.add('visivel'); }, 30);
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(function () {
      elAviso.classList.remove('visivel');
      setTimeout(function () { elAviso.classList.add('oculto'); }, 600);
    }, 2200);
  }

  /* ---------------------------------------------------------
     3b) Tela de fim de atividade
     O gatinho faz o convite (em voz alta) e a dica do papai fica
     escrita pequenininha no rodapé. Usada pelo brincar.js e pelo musica.js.
     --------------------------------------------------------- */
  var fimDeNovo = null;
  var fimVoltar = null;

  function mostrarFim(titulo, convite, dica, aoDeNovo, aoVoltar) {
    $('#fim-convite').textContent = convite;
    $('#fim-dica').textContent = dica;
    $('#fim-atividade').classList.remove('oculto');
    var g = $('.gato-fim');
    g.classList.remove('balancando');
    void g.offsetWidth;
    g.classList.add('balancando');
    nota(NOTAS[3], 0.5, 0.05);
    fimDeNovo = aoDeNovo || null;
    fimVoltar = aoVoltar || null;
    setTimeout(function () { falarLista([titulo, convite]); }, 400);   // a dica NÃO é lida
  }

  $('#btn-de-novo').addEventListener('click', function () {
    $('#fim-atividade').classList.add('oculto');
    if (fimDeNovo) fimDeNovo();
  });
  $('#btn-fim-voltar').addEventListener('click', function () {
    $('#fim-atividade').classList.add('oculto');
    if (fimVoltar) fimVoltar();
  });

  /* ---------------------------------------------------------
     4) "Segurar 1 segundo" - evita toques acidentais
     Funciona igual com mouse, dedo e caneta.
     Mostra um anel rosa que vai se preenchendo durante o segundo.
     Se o dedo escorregar para fora do botão, cancela.
     --------------------------------------------------------- */
  var SVGNS = 'http://www.w3.org/2000/svg';

  function criarAnel(el) {
    if (el.querySelector('.anel-segurar')) return;
    var svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('class', 'anel-segurar');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('aria-hidden', 'true');
    var trilho = document.createElementNS(SVGNS, 'circle');
    trilho.setAttribute('class', 'trilho');
    trilho.setAttribute('cx', '50'); trilho.setAttribute('cy', '50'); trilho.setAttribute('r', '44');
    var preenche = document.createElementNS(SVGNS, 'circle');
    preenche.setAttribute('class', 'preenche');
    preenche.setAttribute('cx', '50'); preenche.setAttribute('cy', '50'); preenche.setAttribute('r', '44');
    svg.appendChild(trilho); svg.appendChild(preenche);
    el.appendChild(svg);
  }

  function segurarPara(el, aoCompletar) {
    criarAnel(el);
    var t = 0;
    var idAtivo = null;

    function dentroDoBotao(e) {
      var r = el.getBoundingClientRect();
      var folga = 12;   // tolerância para o dedinho que balança
      return e.clientX >= r.left - folga && e.clientX <= r.right + folga &&
             e.clientY >= r.top - folga && e.clientY <= r.bottom + folga;
    }

    function comeca(e) {
      if (idAtivo !== null) return;
      if (e.button != null && e.button > 0) return;   // só o botão principal do mouse
      idAtivo = e.pointerId;
      // o toque "captura" o ponteiro por padrão; soltamos para saber se o dedo saiu
      try { if (el.hasPointerCapture && el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId); } catch (err) {}
      el.classList.add('segurando');
      clearTimeout(t);
      t = setTimeout(function () {
        cancela();
        aoCompletar();
      }, 1000);
      window.addEventListener('pointermove', movendo, true);
      window.addEventListener('pointerup', soltou, true);
      window.addEventListener('pointercancel', soltou, true);
      e.preventDefault();
    }

    function movendo(e) {
      if (e.pointerId !== idAtivo) return;
      if (!dentroDoBotao(e)) cancela();
    }
    function soltou(e) {
      if (e.pointerId !== idAtivo) return;
      cancela();
    }
    function cancela() {
      clearTimeout(t);
      idAtivo = null;
      el.classList.remove('segurando');
      window.removeEventListener('pointermove', movendo, true);
      window.removeEventListener('pointerup', soltou, true);
      window.removeEventListener('pointercancel', soltou, true);
    }

    el.addEventListener('pointerdown', comeca);
  }

  /* ---------------------------------------------------------
     5) Troca de telas
     --------------------------------------------------------- */
  function irPara(id) {
    limparFala();          // trocar de tela é uma das formas de cortar a fala
    $$('.tela').forEach(function (t) { t.classList.toggle('ativa', t.id === id); });
    telaAtual = id;
    if (id === 'tela-desenho') { setTimeout(ajustarCanvas, 30); }
  }

  function irParaInicio() {
    fecharSobreposicoes();
    encerrarAtividade();
    irPara('tela-inicio');
  }

  // brincar.js coloca aqui a função que desliga a brincadeira aberta
  function encerrarAtividade() {
    if (typeof window.Ceci.limparAtividade === 'function') window.Ceci.limparAtividade();
    if (typeof window.Ceci.limparSom === 'function') window.Ceci.limparSom();
  }

  function algumaSobreposicaoAberta() {
    return !$('#galeria').classList.contains('oculto') ||
           !$('#overlay-pin').classList.contains('oculto') ||
           !$('#fim-atividade').classList.contains('oculto');
  }
  function fecharSobreposicoes() {
    $('#galeria').classList.add('oculto');
    $('#fim-atividade').classList.add('oculto');
    fecharPin();
  }

  /* ---------------------------------------------------------
     6) Teclado do PIN
     --------------------------------------------------------- */
  var pinBuffer = '';
  var pinAoConcluir = null;
  var pinModo = 'verificar'; // 'verificar' ou 'definir'

  (function montarTeclado() {
    var t = $('#teclado');
    var teclas = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'apagar', '0', 'ok'];
    teclas.forEach(function (k) {
      var b = document.createElement('button');
      b.className = 'tecla';
      b.textContent = k === 'apagar' ? '⌫' : (k === 'ok' ? '✓' : k);
      b.setAttribute('data-tecla', k);
      t.appendChild(b);
    });
    t.addEventListener('click', function (e) {
      var b = e.target.closest('.tecla'); if (!b) return;
      var k = b.getAttribute('data-tecla');
      if (k === 'apagar') { pinBuffer = pinBuffer.slice(0, -1); }
      else if (k === 'ok') { confirmarPin(); return; }
      else if (pinBuffer.length < 4) { pinBuffer += k; }
      desenharPontosPin();
      if (pinBuffer.length === 4) { setTimeout(confirmarPin, 180); }
    });
  })();

  function desenharPontosPin() {
    var pontos = $$('#pin-pontos i');
    pontos.forEach(function (p, i) { p.classList.toggle('cheio', i < pinBuffer.length); });
  }

  function abrirPin(titulo, modo, aoConcluir) {
    pinBuffer = ''; pinModo = modo; pinAoConcluir = aoConcluir;
    $('#pin-titulo').textContent = titulo;
    desenharPontosPin();
    $('#overlay-pin').classList.remove('oculto');
  }
  function fecharPin() {
    $('#overlay-pin').classList.add('oculto');
    pinBuffer = ''; pinAoConcluir = null;
    desenharPontosPin();
  }
  function confirmarPin() {
    if (pinBuffer.length !== 4) return;
    if (pinModo === 'definir') {
      config.pin = pinBuffer; salvarConfig();
      $('#pin-atual').textContent = config.pin;
      fecharPin();
      aviso('PIN trocado');
      return;
    }
    if (pinBuffer === config.pin) {
      var cb = pinAoConcluir;
      fecharPin();
      if (cb) cb();
    } else {
      var caixa = $('.pin-caixa');
      caixa.classList.add('errado');
      setTimeout(function () { caixa.classList.remove('errado'); }, 500);
      pinBuffer = ''; desenharPontosPin();
    }
  }
  $('#btn-cancelar-pin').addEventListener('click', function () {
    if (bloqueado) { fecharPin(); return; }  // continua bloqueado
    fecharPin();
  });

  /* ---------------------------------------------------------
     7) Tela inicial: os três botões e a engrenagem
     --------------------------------------------------------- */
  // só os três cartões da tela inicial (os do menu Brincar são do brincar.js)
  $$('#tela-inicio .cartao').forEach(function (b) {
    b.addEventListener('click', function () {
      var mod = b.getAttribute('data-modulo');
      if (mod === 'desenhar') {
        nota(NOTAS[3], 0.4, 0.05);
        iniciarSessao();
        irPara('tela-desenho');
      } else if (mod === 'brincar') {
        nota(NOTAS[4], 0.4, 0.05);
        iniciarSessao();
        irPara('tela-brincar');
      } else if (mod === 'musica') {
        nota(NOTAS[5], 0.4, 0.05);
        iniciarSessao();
        irPara('tela-musica');
      }
    });
  });

  // engrenagem: segurar 1 segundo + PIN
  segurarPara($('#btn-engrenagem'), function () {
    abrirPin('Digite o PIN do papai', 'verificar', abrirConfig);
  });

  /* ---------------------------------------------------------
     8) Configurações do papai
     --------------------------------------------------------- */
  function abrirConfig() {
    marcarDuracao();
    marcarNivel();
    montarSeletorDeVozes();
    mostrarRegistro();
    $('#pin-atual').textContent = config.pin;
    var g = lerGaleria();
    $('#info-galeria').textContent = 'Galeria: ' + g.length + (g.length === 1 ? ' desenho' : ' desenhos');
    irPara('tela-config');
  }
  function marcarDuracao() {
    $$('#duracoes .opcao').forEach(function (b) {
      b.classList.toggle('escolhida', Number(b.getAttribute('data-min')) === config.minutos);
    });
  }
  function marcarNivel() {
    $$('#niveis .opcao').forEach(function (b) {
      b.classList.toggle('escolhida', Number(b.getAttribute('data-nivel')) === config.nivel);
    });
  }
  // ---- seletor de voz do papai ----
  function montarSeletorDeVozes() {
    var sel = $('#seletor-voz');
    if (!sel) return;
    var lista = vozesEmPortugues();
    sel.innerHTML = '';
    var auto = document.createElement('option');
    auto.value = '';
    auto.textContent = lista.length
      ? 'Automática' + (vozEscolhida ? ' - ' + vozEscolhida.name : '')
      : 'Nenhuma voz em português instalada';
    sel.appendChild(auto);
    lista.forEach(function (v) {
      var o = document.createElement('option');
      o.value = v.name;
      o.textContent = v.name + ' (' + v.lang + ')';
      sel.appendChild(o);
    });
    sel.value = config.voz || '';
  }

  $('#seletor-voz').addEventListener('change', function () {
    config.voz = this.value;
    salvarConfig();
    escolherVoz();
    montarSeletorDeVozes();
    falarJa('Oi, Cecí! Vamos brincar?');
  });
  $('#btn-ouvir-voz').addEventListener('click', function () {
    falarJa('Oi, Cecí! Vamos brincar?');
  });

  $('#niveis').addEventListener('click', function (e) {
    var b = e.target.closest('.opcao'); if (!b) return;
    config.nivel = Number(b.getAttribute('data-nivel'));
    salvarConfig();
    marcarNivel();
  });

  var NOMES_ATIVIDADES = {
    encaixar: 'Encaixar',
    par: 'Achar o par',
    ordem: 'Em ordem',
    pare: 'Pare e siga',
    classificar: 'Separar',
    tocar: 'Tocar',
    bater: 'Bater junto',
    dancar: 'Dançar',
    desenhar: 'Desenhar'
  };
  function mostrarRegistro() {
    var ul = $('#registro');
    ul.innerHTML = '';
    var chaves = Object.keys(config.registro || {});
    if (!chaves.length) {
      var vazio = document.createElement('li');
      vazio.innerHTML = '<span>Ainda não brincou nenhuma vez.</span>';
      ul.appendChild(vazio);
      return;
    }
    chaves.forEach(function (k) {
      var r = config.registro[k];
      var li = document.createElement('li');
      li.innerHTML = (NOMES_ATIVIDADES[k] || k) + ': <b>' + r.vezes + '</b> ' +
                     (r.vezes === 1 ? 'vez' : 'vezes') +
                     ' <span>(último nível: ' + (r.nivel || 1) + ')</span>';
      ul.appendChild(li);
    });
  }
  $('#duracoes').addEventListener('click', function (e) {
    var b = e.target.closest('.opcao'); if (!b) return;
    config.minutos = Number(b.getAttribute('data-min'));
    salvarConfig();
    marcarDuracao();
  });
  $('#btn-trocar-pin').addEventListener('click', function () {
    abrirPin('Digite o novo PIN (4 números)', 'definir', null);
  });
  $('#btn-fechar-config').addEventListener('click', irParaInicio);

  /* ---------------------------------------------------------
     9) ATELIÊ DE DESENHO
     --------------------------------------------------------- */
  // A cor da folha. É a mesma em três lugares: no fundo do canvas (CSS),
  // no preenchimento inicial e no PNG que vai para a galeria.
  var FUNDO = '#FFFDF7';

  var canvas = $('#quadro');
  // com transparência (alpha), para a borracha poder apagar de verdade
  var ctx = canvas.getContext('2d');
  var area = $('#area-desenho');

  var corAtual = '#e04a3f';
  var tamanhoAtual = 'grosso';
  var borrachaLigada = false;
  var LARGURAS = { fino: 9, grosso: 24 };

  var retangulo = null;              // posição do canvas na tela
  var pontosDeCaneta = {};           // ponteiros do tipo "pen" ativos
  var qtdCaneta = 0;
  var ultimoUsoCaneta = 0;
  var ponteiroDesenhando = null;     // só um traço por vez
  var ultimoPonto = null;

  function ajustarCanvas() {
    // desconta o padding real da área (que muda com a margem de segurança)
    var estilo = getComputedStyle(area);
    var larguraCSS = Math.max(1, Math.round(
      area.clientWidth - parseFloat(estilo.paddingLeft) - parseFloat(estilo.paddingRight)));
    var alturaCSS = Math.max(1, Math.round(
      area.clientHeight - parseFloat(estilo.paddingTop) - parseFloat(estilo.paddingBottom)));
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    // guarda o que já estava desenhado
    var copia = null;
    if (canvas.width > 0 && canvas.height > 0) {
      copia = document.createElement('canvas');
      copia.width = canvas.width; copia.height = canvas.height;
      copia.getContext('2d').drawImage(canvas, 0, 0);
    }

    canvas.width = Math.round(larguraCSS * dpr);
    canvas.height = Math.round(alturaCSS * dpr);
    canvas.style.width = larguraCSS + 'px';
    canvas.style.height = alturaCSS + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = FUNDO;                       // cor lisa, sem degradê
    ctx.fillRect(0, 0, larguraCSS, alturaCSS);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (copia) { ctx.drawImage(copia, 0, 0, larguraCSS, alturaCSS); }
    retangulo = canvas.getBoundingClientRect();
  }

  window.addEventListener('resize', function () {
    if (telaAtual === 'tela-desenho') ajustarCanvas();
    else retangulo = null;
  });

  function posicao(e) {
    if (!retangulo) retangulo = canvas.getBoundingClientRect();
    return { x: e.clientX - retangulo.left, y: e.clientY - retangulo.top };
  }

  function larguraDoTraco(e) {
    var base = LARGURAS[tamanhoAtual];
    // borracha: sempre bem larga, sem depender da pressão
    if (borrachaLigada) return Math.max(48, base * 3.2);
    if (e.pointerType === 'pen') {
      var p = (typeof e.pressure === 'number' && e.pressure > 0) ? e.pressure : 0.5;
      return base * (0.55 + 0.9 * p);   // variação leve, sem exageros
    }
    return base;
  }

  // A borracha apaga de verdade ("destination-out"): tira a tinta em vez de
  // pintar por cima. O que fica embaixo é o fundo bege do canvas.
  function prepararPincel() {
    if (borrachaLigada) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000';        // com destination-out, a cor não importa
      ctx.strokeStyle = '#000';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = corAtual;
      ctx.strokeStyle = corAtual;
    }
  }

  function pingo(p, largura) {
    prepararPincel();
    ctx.beginPath();
    ctx.arc(p.x, p.y, largura / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  function traco(a, b, largura) {
    prepararPincel();
    ctx.lineWidth = largura;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  }

  canvas.addEventListener('pointerdown', function (e) {
    if (bloqueado) return;
    var agora = Date.now();

    // rejeição de palma: se a caneta está em uso, o dedo é ignorado
    if (e.pointerType === 'touch' && (qtdCaneta > 0 || agora - ultimoUsoCaneta < 1000)) return;
    // um traço por vez (segundo dedo não risca o desenho)
    if (ponteiroDesenhando !== null) return;

    if (e.pointerType === 'pen') { pontosDeCaneta[e.pointerId] = 1; qtdCaneta++; ultimoUsoCaneta = agora; }

    ponteiroDesenhando = e.pointerId;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    retangulo = canvas.getBoundingClientRect();
    ultimoPonto = posicao(e);
    pingo(ultimoPonto, larguraDoTraco(e));
    e.preventDefault();
  });

  canvas.addEventListener('pointermove', function (e) {
    if (bloqueado) return;
    if (e.pointerType === 'pen') ultimoUsoCaneta = Date.now();
    if (ponteiroDesenhando !== e.pointerId || !ultimoPonto) return;

    var eventos = (typeof e.getCoalescedEvents === 'function') ? e.getCoalescedEvents() : [e];
    if (!eventos || !eventos.length) eventos = [e];
    for (var i = 0; i < eventos.length; i++) {
      var ev = eventos[i];
      var p = posicao(ev);
      traco(ultimoPonto, p, larguraDoTraco(ev));
      ultimoPonto = p;
    }
    e.preventDefault();
  });

  function terminarTraco(e) {
    if (e.pointerType === 'pen') {
      if (pontosDeCaneta[e.pointerId]) { delete pontosDeCaneta[e.pointerId]; qtdCaneta = Math.max(0, qtdCaneta - 1); }
      ultimoUsoCaneta = Date.now();
    }
    if (ponteiroDesenhando === e.pointerId) {
      ponteiroDesenhando = null;
      ultimoPonto = null;
      try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
    }
  }
  canvas.addEventListener('pointerup', terminarTraco);
  canvas.addEventListener('pointercancel', terminarTraco);
  canvas.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') terminarTraco(e); });

  // --- cores ---
  $$('.ferramenta.cor').forEach(function (b) {
    b.addEventListener('click', function () {
      corAtual = b.getAttribute('data-cor');
      borrachaLigada = false;
      marcarFerramentas();
      nota(NOTAS[Number(b.getAttribute('data-nota')) % NOTAS.length], 0.34, 0.06);
    });
  });

  // --- tamanhos ---
  $$('.ferramenta.tamanho').forEach(function (b) {
    b.addEventListener('click', function () {
      tamanhoAtual = b.getAttribute('data-tamanho');
      borrachaLigada = false;
      marcarFerramentas();
      nota(NOTAS[2], 0.26, 0.045);
    });
  });

  // --- borracha ---
  $('#btn-borracha').addEventListener('click', function () {
    borrachaLigada = true;
    marcarFerramentas();
    nota(NOTAS[0], 0.3, 0.04);
  });

  function marcarFerramentas() {
    $$('.ferramenta.cor').forEach(function (b) {
      b.classList.toggle('escolhida', !borrachaLigada && b.getAttribute('data-cor') === corAtual);
    });
    $$('.ferramenta.tamanho').forEach(function (b) {
      b.classList.toggle('escolhida', b.getAttribute('data-tamanho') === tamanhoAtual);
    });
    $('#btn-borracha').classList.toggle('escolhida', borrachaLigada);
  }
  marcarFerramentas();

  // --- limpar (segurar 1 segundo) ---
  segurarPara($('#btn-limpar'), function () {
    var r = canvas.getBoundingClientRect();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = FUNDO;                        // folha nova, cor lisa
    ctx.fillRect(0, 0, r.width, r.height);
    nota(NOTAS[5], 0.5, 0.05);
    aviso('Folha nova');
  });

  // --- casa ---
  $('#btn-casa').addEventListener('click', irParaInicio);

  /* ---------------------------------------------------------
     10) Galeria da Cecí (guardada no próprio tablet)
     --------------------------------------------------------- */
  function lerGaleria() { return lerJSON(CHAVE_GALERIA) || []; }

  function reduzir(maxLargura) {
    var l = canvas.width, a = canvas.height;
    var escala = Math.min(1, maxLargura / l);
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(l * escala));
    c.height = Math.max(1, Math.round(a * escala));
    var cc = c.getContext('2d');
    // o PNG sai com o mesmo fundo bege da folha (nunca transparente nem branco)
    cc.fillStyle = FUNDO; cc.fillRect(0, 0, c.width, c.height);
    cc.drawImage(canvas, 0, 0, c.width, c.height);
    return c.toDataURL('image/png');
  }

  $('#btn-guardar').addEventListener('click', function () {
    var item = { id: Date.now(), img: reduzir(900), mini: reduzir(280) };
    var lista = lerGaleria();
    lista.unshift(item);
    while (lista.length > MAX_DESENHOS) lista.pop();

    var ok = false;
    while (lista.length > 0) {
      if (gravarJSON(CHAVE_GALERIA, lista)) { ok = true; break; }
      lista.pop();                 // sem espaço: descarta o mais antigo e tenta de novo
    }
    if (ok) { nota(NOTAS[3], 0.3, 0.05); setTimeout(function () { nota(NOTAS[5], 0.4, 0.05); }, 150); aviso('Guardado!'); }
    else { aviso('Não deu para guardar'); }
  });

  $('#btn-galeria').addEventListener('click', abrirGaleria);
  $('#btn-fechar-galeria').addEventListener('click', function () {
    $('#galeria').classList.add('oculto');
  });

  function abrirGaleria() {
    var lista = lerGaleria();
    var caixa = $('#galeria-lista');
    caixa.innerHTML = '';
    $('#galeria-vazia').classList.toggle('oculto', lista.length > 0);

    lista.forEach(function (item) {
      var b = document.createElement('div');   // div, não button: tem um botão dentro
      b.className = 'mini';
      b.setAttribute('role', 'button');
      var img = document.createElement('img');
      img.src = item.mini || item.img;
      img.alt = 'Desenho da Cecí';
      b.appendChild(img);

      var apagar = document.createElement('button');
      apagar.className = 'apagar segurar';
      apagar.setAttribute('aria-label', 'Apagar (segure)');
      apagar.textContent = '×';
      segurarPara(apagar, function () {   // o anel de segurar é criado aqui dentro
        var atual = lerGaleria().filter(function (x) { return x.id !== item.id; });
        gravarJSON(CHAVE_GALERIA, atual);
        abrirGaleria();
        aviso('Apagado');
      });
      apagar.addEventListener('click', function (e) { e.stopPropagation(); });
      b.appendChild(apagar);

      b.addEventListener('click', function () { abrirDesenho(item); });
      caixa.appendChild(b);
    });

    $('#galeria').classList.remove('oculto');
  }

  function abrirDesenho(item) {
    var img = new Image();
    img.onload = function () {
      var r = canvas.getBoundingClientRect();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = FUNDO;
      ctx.fillRect(0, 0, r.width, r.height);
      var escala = Math.min(r.width / img.width, r.height / img.height);
      var w = img.width * escala, h = img.height * escala;
      ctx.drawImage(img, (r.width - w) / 2, (r.height - h) / 2, w, h);
      $('#galeria').classList.add('oculto');
      nota(NOTAS[4], 0.35, 0.05);
    };
    img.src = item.img;
  }

  /* ---------------------------------------------------------
     11) Sessão, sol descendo e ritual de tchau
     --------------------------------------------------------- */
  var sessao = { ativa: false, fim: 0, total: 0, avisou: false, timer: 0 };
  var sol = $('#sol');

  function iniciarSessao() {
    sessao.total = config.minutos * 60000;
    sessao.fim = Date.now() + sessao.total;
    sessao.ativa = true;
    sessao.avisou = false;
    sol.classList.remove('poente');
    $('#trilha-sol').classList.remove('oculto');   // o sol aparece em todas as telas
    clearInterval(sessao.timer);
    sessao.timer = setInterval(passoDaSessao, 1000);
    passoDaSessao();
  }

  function pararSessao() {
    sessao.ativa = false;
    clearInterval(sessao.timer);
  }

  function passoDaSessao() {
    var falta = sessao.fim - Date.now();
    var andado = 1 - Math.max(0, falta) / sessao.total;
    sol.style.top = (Math.min(1, Math.max(0, andado)) * 100) + '%';
    sol.classList.toggle('poente', andado > 0.7);

    if (!sessao.avisou && falta <= 120000 && falta > 0) {
      sessao.avisou = true;
      nota(NOTAS[1], 0.6, 0.04);
      setTimeout(function () { falar('Cecí, o sol está quase se deitando'); }, 700);
    }
    if (falta <= 0) {
      pararSessao();
      ritualDeTchau();
    }
  }

  function ritualDeTchau() {
    bloqueado = true;
    fecharSobreposicoes();
    encerrarAtividade();
    var r = $('#ritual');
    r.classList.remove('oculto');
    setTimeout(function () { r.classList.add('visivel'); }, 30);
    nota(NOTAS[2], 0.9, 0.045);
    setTimeout(function () { falar('Tchau, Cecí! Até amanhã!'); }, 3500);
    setTimeout(function () { $('#btn-destravar').classList.add('visivel'); }, 8000);
  }

  // o botão do papai só abre o PIN se for segurado 1 segundo
  segurarPara($('#btn-destravar'), function () {
    abrirPin('Digite o PIN do papai', 'verificar', function () {
      var r = $('#ritual');
      r.classList.remove('visivel');
      setTimeout(function () { r.classList.add('oculto'); }, 800);
      $('#btn-destravar').classList.remove('visivel');
      bloqueado = false;
      sol.style.top = '0%';
      sol.classList.remove('poente');
      $('#trilha-sol').classList.add('oculto');
      irParaInicio();
    });
  });

  /* ---------------------------------------------------------
     12) Trancas contra saídas acidentais
     --------------------------------------------------------- */

  // 12.1 tela cheia no primeiro toque (e recupera se sair)
  // O manifest já pede "fullscreen", mas isso vale só quando o app é aberto
  // pelo ícone. Pelo navegador, quem esconde a barra do Android é esta função.
  function telaCheia() {
    try {
      var el = document.documentElement;
      var pedir = el.requestFullscreen || el.webkitRequestFullscreen;
      if (pedir && !document.fullscreenElement && !document.webkitFullscreenElement) {
        var p;
        try {
          p = pedir.call(el, { navigationUI: 'hide' });   // pede para sumir a barra de navegação
        } catch (erro) {
          p = pedir.call(el);
        }
        if (p && p.then) p.then(travarPaisagem).catch(function () {});
        else travarPaisagem();
      }
    } catch (e) {}
  }
  function travarPaisagem() {
    try {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(function () {});
      }
    } catch (e) {}
  }
  document.addEventListener('pointerdown', function () {
    audio();          // libera o som (navegadores exigem um toque antes)
    telaCheia();
  }, true);

  // 12.2 nada de menu de toque longo, seleção ou duplo toque com zoom
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  document.addEventListener('selectstart', function (e) { e.preventDefault(); });
  document.addEventListener('dblclick', function (e) { e.preventDefault(); });
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
  document.addEventListener('touchmove', function (e) {
    if (e.touches && e.touches.length > 1) e.preventDefault();
  }, { passive: false });

  // 12.3 botão "voltar" do Android nunca fecha o app
  try { history.pushState({ ceci: 1 }, ''); } catch (e) {}
  window.addEventListener('popstate', function () {
    try { history.pushState({ ceci: 1 }, ''); } catch (e) {}
    if (bloqueado) return;                       // durante o tchau, voltar não faz nada
    if (algumaSobreposicaoAberta()) { fecharSobreposicoes(); return; }
    // de uma brincadeira, volta para o menu Brincar; do menu, volta para o início
    if (telaAtual === 'tela-atividade') { encerrarAtividade(); irPara('tela-brincar'); return; }
    if (telaAtual === 'tela-som') { encerrarAtividade(); irPara('tela-musica'); return; }
    irParaInicio();
  });

  // 12.4 avisa antes de fechar a janela enquanto a sessão está rolando
  window.addEventListener('beforeunload', function (e) {
    if (sessao.ativa) { e.preventDefault(); e.returnValue = ''; return ''; }
  });

  /* ---------------------------------------------------------
     13) Service worker (faz o app funcionar sem internet)
     --------------------------------------------------------- */
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    // já existia uma versão instalada quando esta página abriu?
    var jaTinhaVersao = !!navigator.serviceWorker.controller;
    var jaAtualizou = false;

    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });

    // Quando uma versão nova termina de baixar, ela assume o comando.
    // Aí a página se recarrega sozinha uma única vez, para já usar os
    // arquivos novos - assim você não precisa abrir e fechar o app.
    // Só faz isso se a Cecí não estiver no meio de uma sessão.
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (jaAtualizou || !jaTinhaVersao) return;
      jaAtualizou = true;
      if (!sessao.ativa && !bloqueado) location.reload();
    });
  }

  /* ---------------------------------------------------------
     14) Ponte para o brincar.js
     O arquivo das brincadeiras usa estas funções (window.Ceci).
     --------------------------------------------------------- */
  $('#btn-brincar-casa').addEventListener('click', irParaInicio);
  $('#btn-atividade-voltar').addEventListener('click', function () {
    encerrarAtividade();
    irPara('tela-brincar');
  });

  $('#btn-musica-casa').addEventListener('click', irParaInicio);
  $('#btn-som-voltar').addEventListener('click', function () {
    encerrarAtividade();
    irPara('tela-musica');
  });

  window.Ceci.audio = audio;
  window.Ceci.mostrarFim = mostrarFim;
  window.Ceci.falar = falar;
  window.Ceci.falarLista = falarLista;
  window.Ceci.falarJa = falarJa;
  window.Ceci.limparFala = limparFala;
  window.Ceci.nota = nota;
  window.Ceci.NOTAS = NOTAS;
  window.Ceci.aviso = aviso;
  window.Ceci.irPara = irPara;
  window.Ceci.segurarPara = segurarPara;
  window.Ceci.registrar = registrar;
  window.Ceci.config = config;
  window.Ceci.salvarConfig = salvarConfig;
  window.Ceci.estaBloqueado = function () { return bloqueado; };
  window.Ceci.sessaoAtiva = function () { return sessao.ativa; };

  /* ---------------------------------------------------------
     15) Começo de tudo
     --------------------------------------------------------- */
  marcarDuracao();
  marcarNivel();
  irPara('tela-inicio');
})();
