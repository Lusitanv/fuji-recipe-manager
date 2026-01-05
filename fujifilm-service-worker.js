const CACHE_NAME = 'fujifilm-recipes-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Instalar o Service Worker e fazer cache dos recursos
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[Service Worker] Erro ao fazer cache:', error);
      })
  );
  // Força o service worker a ativar imediatamente
  self.skipWaiting();
});

// Ativar o Service Worker e limpar caches antigos
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Toma controle de todas as páginas imediatamente
  return self.clients.claim();
});

// Interceptar requisições de rede
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Se encontrou no cache, retorna
        if (response) {
          console.log('[Service Worker] Servindo do cache:', event.request.url);
          return response;
        }

        // Clona a requisição
        const fetchRequest = event.request.clone();

        // Busca da rede
        return fetch(fetchRequest).then((response) => {
          // Verifica se é uma resposta válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clona a resposta para guardar no cache
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              console.log('[Service Worker] Adicionando ao cache:', event.request.url);
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch((error) => {
          console.error('[Service Worker] Erro ao buscar:', error);
          // Aqui você pode retornar uma página offline personalizada
          return caches.match('/index.html');
        });
      })
  );
});