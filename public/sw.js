// Service worker de Paupet: recibe los avisos al celular (pedidos de turno) y los muestra,
// aunque la app esté cerrada. Tocar el aviso abre la app en "Hoy".

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  e.waitUntil((async () => {
    await self.registration.showNotification(d.title || 'Paupet', {
      body: d.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: d.tag,
      renotify: true,
      vibrate: [120, 60, 120],
      data: { url: d.url || '/' },
    });
    // Si la app está abierta, que recargue los datos para mostrar el pedido nuevo.
    const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    ventanas.forEach(w => w.postMessage({ tipo: 'aviso', tag: d.tag }));
  })());
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil((async () => {
    const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const abierta = ventanas.find(w => new URL(w.url).origin === self.location.origin);
    if (abierta) { await abierta.focus(); abierta.postMessage({ tipo: 'abrir', url }); return; }
    await self.clients.openWindow(url);
  })());
});
