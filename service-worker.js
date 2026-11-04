/**
 * サービスワーカー（ネットワーク優先＋オフラインキャッシュフォールバック）
 */

const キャッシュ名 = "tokyo-ghoul-cache-v20261104-2000";
const キャッシュ対象 = [
  "./",
  "./index.html",
  "./css/style.css",
  "./manifest.json",
  "./js/app.js",
  "./js/models/types.js",
  "./js/models/master_data.js",
  "./js/storage/db.js",
  "./js/engine/aggregator.js",
  "./js/engine/mode_estimator.js",
  "./js/engine/exporter.js",
  "./js/ui/dashboard_view.js",
  "./js/ui/quick_input_view.js",
  "./js/ui/history_view.js",
  "./js/ui/settings_view.js"
];

// インストール（即座に待機状態をスキップしてアクティベートへ）
self.addEventListener("install", (イベント) => {
  self.skipWaiting();
  イベント.waitUntil(
    caches.open(キャッシュ名).then((キャッシュ) => {
      return キャッシュ.addAll(キャッシュ対象);
    })
  );
});

// アクティベート（古いバージョンのキャッシュを完全削除し、即時制御）
self.addEventListener("activate", (イベント) => {
  イベント.waitUntil(
    caches.keys().then((キー群) => {
      return Promise.all(
        キー群.filter((キー) => キー !== キャッシュ名).map((キー) => caches.delete(キー))
      );
    }).then(() => self.clients.claim())
  );
});

// フェッチ（ネットワーク優先：オンライン時は最新を取得、圏外・オフライン時はキャッシュから即答）
self.addEventListener("fetch", (イベント) => {
  if (イベント.request.method !== "GET") return;

  イベント.respondWith(
    fetch(イベント.request).then((ネットワーク応答) => {
      if (ネットワーク応答 && ネットワーク応答.status === 200) {
        const クローン = ネットワーク応答.clone();
        caches.open(キャッシュ名).then((キャッシュ) => {
          キャッシュ.put(イベント.request, クローン);
        });
      }
      return ネットワーク応答;
    }).catch(() => {
      return caches.match(イベント.request).then((キャッシュ応答) => {
        if (キャッシュ応答) {
          return キャッシュ応答;
        }
        return caches.match("./index.html");
      });
    })
  );
});
