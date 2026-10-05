// ============================================================
// mixion — Service Worker
// ============================================================

// Устанавливаем сразу, не ждём закрытия вкладок
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Активируемся сразу после установки
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Пропускаем запросы в сеть (сайт работает напрямую)
self.addEventListener('fetch', () => {
  // Ничего не перехватываем
});

// ============================================================
// PUSH-УВЕДОМЛЕНИЯ
// ============================================================

self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: 'mixion', body: event.data.text() || 'Новое уведомление' };
  }
  
  const title = data.title || 'mixion';
  const options = {
    body: data.body || 'У вас новое уведомление',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || 'mixion-message',
    renotify: true,
    data: {
      url: data.url || '/',
      chatType: data.chatType || null,
      chatId: data.chatId || null,
    },
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };
  
  event.waitUntil(self.registration.showNotification(title, options));
});

// ============================================================
// КЛИК ПО УВЕДОМЛЕНИЮ
// ============================================================

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const targetUrl = event.notification.data?.url || '/';
  const chatType = event.notification.data?.chatType;
  const chatId = event.notification.data?.chatId;
  
  let urlToOpen = targetUrl;
  if (chatType && chatId) {
    urlToOpen = `${targetUrl}?openChat=${chatType}:${chatId}`;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Если окно приложения уже открыто — фокусируемся и открываем чат
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.focus();
          if (chatType && chatId && 'postMessage' in client) {
            client.postMessage({
              type: 'OPEN_CHAT',
              chatType: chatType,
              chatId: chatId,
            });
          }
          return;
        }
      }
      // Иначе открываем новое окно
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});