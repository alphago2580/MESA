/**
 * MESA v2 Service Worker
 * Web Push 알림 수신 및 오프라인 캐시 관리
 */

const CACHE_NAME = 'mesa-v2-cache-v1';
const OFFLINE_URL = '/offline.html';

// 캐시할 정적 자원
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
];

// Install: 정적 자원 프리캐시
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: 오래된 캐시 삭제
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: 네트워크 우선, 실패 시 캐시 사용
self.addEventListener('fetch', (event) => {
  // API 요청은 캐시하지 않음
  if (event.request.url.includes('/api/') || event.request.url.includes('localhost:8000')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 성공 응답은 캐시에 저장
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Push: 알림 수신
self.addEventListener('push', (event) => {
  let data = { title: 'MESA 경제 리포트', body: '새로운 리포트가 도착했습니다.' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: data.tag || 'mesa-report',
    data: {
      url: data.url || '/reports',
      reportId: data.reportId,
    },
    actions: [
      { action: 'open', title: '리포트 보기' },
      { action: 'dismiss', title: '닫기' },
    ],
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click: 알림 클릭 시 리포트 페이지로 이동
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/reports';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // 이미 열린 탭이 있으면 포커스
      for (const client of clients) {
        if (client.url.includes('/reports') && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // 없으면 새 탭 열기
      return self.clients.openWindow(targetUrl);
    })
  );
});
