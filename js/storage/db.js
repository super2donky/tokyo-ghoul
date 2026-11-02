/**
 * IndexedDB ストレージ管理モジュール
 * ブラウザローカル（端末内）で実戦セッションの保存・読込・一覧・削除・移行を行う
 */

const ディービー名 = "TokyoGhoulSlotDB";
const バージョン = 1;
const ストア名 = "sessions";

let データベース接続 = null;

/**
 * データベース接続の初期化
 */
export function ディービー_ショキカ() {
  return new Promise((resolve, reject) => {
    if (データベース接続) {
      resolve(データベース接続);
      return;
    }

    if (!window.indexedDB) {
      console.warn("IndexedDBがサポートされていません。ローカルストレージを使用します。");
      resolve(null);
      return;
    }

    const リクエスト = indexedDB.open(ディービー名, バージョン);

    リクエスト.onupgradeneeded = (イベント) => {
      const db = イベント.target.result;
      if (!db.objectStoreNames.contains(ストア名)) {
        const ストア = db.createObjectStore(ストア名, { keyPath: "セッションID" });
        ストア.createIndex("日付", "日付", { unique: false });
        ストア.createIndex("更新日時", "更新日時", { unique: false });
      }
    };

    リクエスト.onsuccess = (イベント) => {
      データベース接続 = イベント.target.result;
      resolve(データベース接続);
    };

    リクエスト.onerror = (イベント) => {
      console.error("IndexedDBオープンエラー:", イベント.target.error);
      resolve(null); // エラー時はフォールバック
    };
  });
}

/**
 * セッションの保存（新規または更新）
 */
export async function セッション_ホゾン(セッション) {
  セッション.更新日時 = new Date().toISOString();
  const db = await ディービー_ショキカ();

  if (!db) {
    // ローカルストレージへのフォールバック
    try {
      const キー = "tokyo_ghoul_session_" + セッション.セッションID;
      localStorage.setItem(キー, JSON.stringify(セッション));
      // セッションIDリストの更新
      const リストキー = "tokyo_ghoul_session_keys";
      const リスト = JSON.parse(localStorage.getItem(リストキー) || "[]");
      if (!リスト.includes(セッション.セッションID)) {
        リスト.push(セッション.セッションID);
        localStorage.setItem(リストキー, JSON.stringify(リスト));
      }
      return true;
    } catch (e) {
      console.error("LocalStorage保存失敗:", e);
      return false;
    }
  }

  return new Promise((resolve, reject) => {
    try {
      const トランザクション = db.transaction([ストア名], "readwrite");
      const ストア = トランザクション.objectStore(ストア名);
      const 要求 = ストア.put(セッション);

      要求.onsuccess = () => resolve(true);
      要求.onerror = (e) => {
        console.error("セッション保存エラー:", e.target.error);
        reject(e.target.error);
      };
    } catch (err) {
      console.error("トランザクション作成エラー:", err);
      reject(err);
    }
  });
}

/**
 * セッションIDによる取得
 */
export async function セッション_シュトク(セッションID) {
  const db = await ディービー_ショキカ();

  if (!db) {
    const キー = "tokyo_ghoul_session_" + セッションID;
    const データ = localStorage.getItem(キー);
    return データ ? JSON.parse(データ) : null;
  }

  return new Promise((resolve, reject) => {
    try {
      const トランザクション = db.transaction([ストア名], "readonly");
      const ストア = トランザクション.objectStore(ストア名);
      const 要求 = ストア.get(セッションID);

      要求.onsuccess = () => {
        resolve(要求.result || null);
      };
      要求.onerror = (e) => reject(e.target.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * 保存されている全実戦セッションの一覧を取得（降順）
 */
export async function セッション_イチラン_シュトク() {
  const db = await ディービー_ショキカ();

  if (!db) {
    const リストキー = "tokyo_ghoul_session_keys";
    const リスト = JSON.parse(localStorage.getItem(リストキー) || "[]");
    const 結果 = [];
    for (const id of リスト) {
      const d = localStorage.getItem("tokyo_ghoul_session_" + id);
      if (d) 結果.push(JSON.parse(d));
    }
    return 結果.sort((a, b) => new Date(b.更新日時) - new Date(a.更新日時));
  }

  return new Promise((resolve, reject) => {
    try {
      const トランザクション = db.transaction([ストア名], "readonly");
      const ストア = トランザクション.objectStore(ストア名);
      const 要求 = ストア.getAll();

      要求.onsuccess = () => {
        const 結果 = 要求.result || [];
        結果.sort((a, b) => new Date(b.更新日時) - new Date(a.更新日時));
        resolve(結果);
      };
      要求.onerror = (e) => reject(e.target.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * セッションの削除
 */
export async function セッション_サクジョ(セッションID) {
  const db = await ディービー_ショキカ();

  if (!db) {
    localStorage.removeItem("tokyo_ghoul_session_" + セッションID);
    const リストキー = "tokyo_ghoul_session_keys";
    let リスト = JSON.parse(localStorage.getItem(リストキー) || "[]");
    リスト = リスト.filter(id => id !== セッションID);
    localStorage.setItem(リストキー, JSON.stringify(リスト));
    return true;
  }

  return new Promise((resolve, reject) => {
    try {
      const トランザクション = db.transaction([ストア名], "readwrite");
      const ストア = トランザクション.objectStore(ストア名);
      const 要求 = ストア.delete(セッションID);

      要求.onsuccess = () => resolve(true);
      要求.onerror = (e) => reject(e.target.error);
    } catch (err) {
      reject(err);
    }
  });
}
