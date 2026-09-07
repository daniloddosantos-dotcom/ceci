/* ============================================================
   Service worker do Cecí
   Guarda uma cópia de todos os arquivos dentro do tablet,
   para o app abrir mesmo sem internet.
   Se você mudar algum arquivo, troque o número da versão abaixo.
   ============================================================ */

var VERSAO = 'ceci-v9';

var ARQUIVOS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './brincar.js',
  './manifest.json',
  './icone.svg',
  './icone-mascara.svg'
];

self.addEventListener('install', function (evento) {
  evento.waitUntil(
    caches.open(VERSAO).then(function (cache) {
      // { cache: 'reload' } obriga a baixar tudo do servidor.
      // Sem isso o navegador entrega cópias antigas que ele ainda tem
      // guardadas, e a versão nova nasceria misturada com a velha.
      return Promise.all(ARQUIVOS.map(function (arquivo) {
        return fetch(new Request(arquivo, { cache: 'reload' })).then(function (resposta) {
          if (!resposta || !resposta.ok) throw new Error('nao baixou: ' + arquivo);
          return cache.put(arquivo, resposta);
        });
      }));
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
        var copia = resposta.clone();
        caches.open(VERSAO).then(function (cache) { cache.put(req, copia); });
        return resposta;
      }).catch(function () {
        return caches.match('./index.html');
      });
    })
  );
});
