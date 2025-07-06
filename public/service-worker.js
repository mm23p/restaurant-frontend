// public/service-worker.js

/* eslint-disable no-restricted-globals */

// --- The rest of your file is unchanged ---

const CACHE_NAME = 'restaurant-pos-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo192.png',
];

// --- 1. INSTALLATION ---
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
  );
});

// --- 2. ACTIVATION ---
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
          return null; // Return null for valid caches
        })
      );
    })
  );
});

// --- 3. FETCH (Network Caching Strategy) ---
self.addEventListener('fetch', event => {
  // Don't cache API requests, only static assets
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request).then(fetchRes => {
          return caches.open(CACHE_NAME).then(cache => {
            if (event.request.method === 'GET') {
              cache.put(event.request.url, fetchRes.clone());
            }
            return fetchRes;
          });
        });
      })
  );
});

// --- 4. SYNC (Offline Orders) ---
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync event triggered!');
  if (event.tag === 'sync-pending-orders') {
    event.waitUntil(syncPendingOrders());
  }
});

async function syncPendingOrders() {
  console.log('Service Worker: Attempting to sync orders...');

  // Using a simplified IndexedDB API directly, since we can't import Dexie here.
  const openDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('RestaurantPOS_DB');
      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e.target.error);
      // NOTE: onupgradeneeded is not handled here, as the main app should create the DB schema.
    });
  };

  try {
    const db = await openDB();
    const transaction = db.transaction('pendingOrders', 'readwrite');
    const store = transaction.objectStore('pendingOrders');
    
    const pendingOrders = await new Promise((resolve, reject) => {
      const getAllReq = store.getAll();
      getAllReq.onsuccess = () => resolve(getAllReq.result);
      getAllReq.onerror = (e) => reject(e.target.error);
    });

    if (pendingOrders && pendingOrders.length > 0) {
      console.log(`Service Worker: Found ${pendingOrders.length} orders to sync.`);
      
      for (const order of pendingOrders) {
        try {
          const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${order.token}`
            },
            body: JSON.stringify(order.data)
          });

          if (response.ok) {
            console.log(`Service Worker: Successfully synced order ${order.id}`);
            const deleteTransaction = db.transaction('pendingOrders', 'readwrite');
            await new Promise((resolve, reject) => {
                const req = deleteTransaction.objectStore('pendingOrders').delete(order.id);
                req.onsuccess = resolve;
                req.onerror = (e) => reject(e.target.error);
            });
          } else {
            console.error(`Service Worker: Failed to sync order ${order.id}. Server responded with status ${response.status}`);
          }
        } catch (error) {
          console.error(`Service Worker: Network error while trying to sync order ${order.id}`, error);
        }
      }
    } else {
      console.log('Service Worker: No pending orders to sync.');
    }
  } catch (error) {
    console.error('Service Worker: Failed to access IndexedDB for sync.', error);
  }
}