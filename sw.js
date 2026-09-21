/* ============================================================
   Service worker do Cecí
   Guarda uma cópia de todos os arquivos dentro do tablet,
   para o app abrir mesmo sem internet.
   Se você mudar algum arquivo, troque o número da versão abaixo.
   ============================================================ */

// a lista de frases (e dos áudios) vem do mesmo arquivo que o app usa
importScripts('frases.js');
importScripts('musicas.js');

var VERSAO = 'ceci-v24';

var ARQUIVOS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './gatinho.js',
  './brincar.js',
  './musica.js',
  './manifest.json',
  './icone.svg',
  './icone-mascara.svg',
  './frases.js',
  './versao.js',
  './musicas.js',
  './desenhar.js'
];

// todos os áudios das frases, para falar offline
if (self.CeciFrases) {
  self.CeciFrases.lista.forEach(function (t) { ARQUIVOS.push('./audio/' + self.CeciFrases.arquivo(t)); });
}
// as gravações das músicas (se o papai colocou alguma em audio/musicas/): opcionais
if (self.CeciMusicas) {
  self.CeciMusicas.ordem.forEach(function (k) { ARQUIVOS.push('./' + self.CeciMusicas.todas[k].arquivo); });
}

self.addEventListener('install', function (evento) {
  evento.waitUntil(
    caches.open(VERSAO).then(function (cache) {
      // { cache: 'reload' } obriga a baixar tudo do servidor.
      // Sem isso o navegador entrega cópias antigas que ele ainda tem
      // guardadas, e a versão nova nasceria misturada com a velha.
      function baixar(arquivo, obrigatorio) {
        return fetch(new Request(arquivo, { cache: 'reload' })).then(function (resposta) {
          if (!resposta || !resposta.ok) throw new Error('nao baixou: ' + arquivo);
          return cache.put(arquivo, resposta);
        }).catch(function (erro) {
          if (obrigatorio) throw erro;            // arquivo do app: sem ele nao da
          // um audio que falhou nao impede o app: essa frase cai na voz do sistema
        });
      }
      // os arquivos do app, todos de uma vez
      var doApp = ARQUIVOS.filter(function (a) { return a.indexOf('./audio/') !== 0; });
      var audios = ARQUIVOS.filter(function (a) { return a.indexOf('./audio/') === 0; });
      return Promise.all(doApp.map(function (a) { return baixar(a, true); })).then(function () {
        // os audios em levas de 8, para nao afogar a conexao do tablet
        var fila = Promise.resolve();
        for (var i = 0; i < audios.length; i += 8) {
          (function (leva) {
            fila = fila.then(function () { return Promise.all(leva.map(function (a) { return baixar(a, false); })); });
          })(audios.slice(i, i + 8));
        }
        return fila;
      });
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (evento) {
  evento.waitUntil(
    caches.keys().then(function (chaves) {
      return Promise.all(chaves.map(function (c) {
        if (c !== VERSAO) return caches.delete(c);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (evento) {
  var req = evento.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  evento.respondWith(
    caches.match(req).then(function (guardado) {
      if (guardado) return guardado;
      return fetch(req).then(function (resposta) {
        // só guarda o que veio certo (um 404 guardado viraria um erro para sempre)
        if (resposta && resposta.ok) {
          var copia = resposta.clone();
          caches.open(VERSAO).then(function (cache) { cache.put(req, copia); });
        }
        return resposta;
      }).catch(function () {
        // sem internet e sem cópia: uma página volta para o app; um arquivo (áudio) falha limpo
        if (req.mode === 'navigate') return caches.match('./index.html');
        return new Response('', { status: 404, statusText: 'offline' });
      });
    })
  );
});
