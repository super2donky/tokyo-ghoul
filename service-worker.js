/**
 * サービスワーカー（オフライン動作・キャッシュ管理）
 */

const キャッシュ名 = "tokyo-ghoul-cache-v20261103-0929";
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

// インストール処理
self.addEventListener("install", (イベント) => {
  イベント.waitUntil(
    caches.open(キャッシュ名).then((キャッシュ) => {
      return キャッシュ.addAll(キャッシュ対象);
    }).then(() => self.skipWaiting())
  );
});

// アクティベート処理（古いキャッシュの削除）
self.addEventListener("activate", (イベント) => {
  イベント.waitUntil(
    caches.keys().then((キー群) => {
      return Promise.all(
        キー群.filter((キー) => キー !== キャッシュ名).map((キー) => caches.delete(キー))
      );
    }).then(() => self.clients.claim())
  );
});

// フェッチ処理（キャッシュ優先フォールバック）
self.addEventListener("fetch", (イベント) => {
  if (イベント.request.method !== "GET") return;

  イベント.respondWith(
    caches.match(イベント.request).then((キャッシュ応答) => {
      if (キャッシュ応答) {
        return キャッシュ応答;
      }
      return fetch(イベント.request).then((ネットワーク応答) => {
        if (!ネットワーク応答 || ネットワーク応答.status !== 200 || ネットワーク応答.type !== "basic") {
          return ネットワーク応答;
        }
        const 応答クローン = ネットワーク応答.clone();
        caches.open(キャッシュ名).then((キャッシュ) => {
          キャッシュ.put(イベント.request, 応答クローン);
        });
        return ネットワーク応答;
      }).catch(() => {
        // オフライン時のフォールバック
        return caches.match("./index.html");
      });
    })
  );
});
