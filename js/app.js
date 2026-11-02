/**
 * メインアプリケーション・コントローラー
 */

import { ディービー_ショキカ, セッション_ホゾン, セッション_イチラン_シュトク } from "./storage/db.js";
import { シンキ_セッション作成 } from "./models/types.js";
import { ダッシュボード_レンダリング } from "./ui/dashboard_view.js";
import { クイック入力_レンダリング } from "./ui/quick_input_view.js";
import { 履歴画面_レンダリング } from "./ui/history_view.js";
import { 設定画面_レンダリング } from "./ui/settings_view.js";

class アプリケーション {
  constructor() {
    this.現在のセッション = null;
    this.アクティブタブ = "tab-dashboard";

    this.コンテナ_ダッシュボード = document.getElementById("view-dashboard");
    this.コンテナ_クイック入力 = document.getElementById("view-quick-input");
    this.コンテナ_履歴 = document.getElementById("view-history");
    this.コンテナ_設定 = document.getElementById("view-settings");
    this.ナビボタン群 = document.querySelectorAll(".nav-item");
  }

  async 初期化() {
    await ディービー_ショキカ();

    const セッションリスト = await セッション_イチラン_シュトク();
    if (セッションリスト && セッションリスト.length > 0) {
      this.現在のセッション = セッションリスト[0];
    } else {
      this.現在のセッション = シンキ_セッション作成("マイホール", "001");
      await セッション_ホゾン(this.現在のセッション);
    }

    this.セットアップナビゲーション();
    this.全画面再描画();
    this.サービスワーカー登録();
  }

  セットアップナビゲーション() {
    this.ナビボタン群.forEach(btn => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-tab");
        this.タブ切り替え(tab);
      });
    });

    document.addEventListener("click", (e) => {
      if (e.target && e.target.id === "btn-goto-history") {
        this.タブ切り替え("tab-history");
      }
      if (e.target && e.target.id === "btn-edit-syushi") {
        this.収支編集モーダル();
      }
    });
  }

  タブ切り替え(タブID) {
    this.アクティブタブ = タブID;

    this.ナビボタン群.forEach(btn => {
      if (btn.getAttribute("data-tab") === タブID) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    document.querySelectorAll(".view-section").forEach(sec => {
      sec.classList.remove("active");
    });

    if (タブID === "tab-dashboard") {
      this.コンテナ_ダッシュボード.classList.add("active");
      ダッシュボード_レンダリング(this.コンテナ_ダッシュボード, this.現在のセッション);
    } else if (タブID === "tab-quick-input") {
      this.コンテナ_クイック入力.classList.add("active");
      クイック入力_レンダリング(
        this.コンテナ_クイック入力,
        this.現在のセッション,
        (新イベント) => this.イベント追加処理(新イベント),
        () => this.イベント直前取り消し処理()
      );
    } else if (タブID === "tab-history") {
      this.コンテナ_履歴.classList.add("active");
      履歴画面_レンダリング(this.コンテナ_履歴, this.現在のセッション, (更新後セッション) => {
        this.セッション更新処理(更新後セッション);
      });
    } else if (タブID === "tab-settings") {
      this.コンテナ_設定.classList.add("active");
      設定画面_レンダリング(this.コンテナ_設定, this.現在のセッション, (切り替え後セッション) => {
        this.現在のセッション = 切り替え後セッション;
        this.全画面再描画();
      });
    }
  }

  async イベント追加処理(新イベント) {
    新イベント.連番 = (this.現在のセッション.イベントリスト.length || 0) + 1;
    this.現在のセッション.イベントリスト.push(新イベント);
    await セッション_ホゾン(this.現在のセッション);
    this.トースト表示(`📝 【${新イベント.通常ゲーム数}G】${新イベント.タイトル} を記録`);
    this.全画面再描画();
  }

  async イベント直前取り消し処理() {
    if (!this.現在のセッション.イベントリスト || this.現在のセッション.イベントリスト.length === 0) {
      return;
    }
    const 削除対象 = this.現在のセッション.イベントリスト.pop();
    await セッション_ホゾン(this.現在のセッション);
    this.トースト表示(`↩️ 【${削除対象.通常ゲーム数}G】${削除対象.タイトル} を取り消しました`);
    this.全画面再描画();
  }

  async セッション更新処理(更新後セッション) {
    this.現在のセッション = 更新後セッション;
    await セッション_ホゾン(this.現在のセッション);
    this.全画面再描画();
  }

  全画面再描画() {
    this.タブ切り替え(this.アクティブタブ);
  }

  収支編集モーダル() {
    const 投資 = prompt("投資枚数を入力してください（枚）:", this.現在のセッション.収支情報?.投資枚数 ?? 0);
    if (投資 === null) return;
    const 回収 = prompt("回収枚数を入力してください（枚）:", this.現在のセッション.収支情報?.回収枚数 ?? 0);
    if (回収 === null) return;

    const 投資数値 = parseInt(投資, 10) || 0;
    const 回収数値 = parseInt(回収, 10) || 0;
    const 差枚数値 = 回収数値 - 投資数値;

    this.現在のセッション.収支情報 = {
      投資枚数: 投資数値,
      回収枚数: 回収数値,
      差枚数: 差枚数値
    };

    セッション_ホゾン(this.現在のセッション).then(() => {
      this.全画面再描画();
    });
  }

  トースト表示(メッセージ) {
    let toast = document.getElementById("global-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "global-toast";
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = メッセージ;
    toast.style.display = "block";
    setTimeout(() => {
      toast.style.display = "none";
    }, 2000);
  }

  サービスワーカー登録() {
    const badge = document.getElementById("pwa-status-badge");

    const 更新バッジ = (状態, テキスト, 背景色, 文字色, 説明メッセージ) => {
      if (!badge) return;
      badge.textContent = テキスト;
      badge.style.background = 背景色;
      badge.style.color = 文字色;
      badge.onclick = () => {
        alert(説明メッセージ);
      };
    };

    // セキュアコンテキスト（HTTPS または localhost）のチェック
    const isSecure = window.isSecureContext || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

    if (!isSecure) {
      更新バッジ(
        "warning",
        "⚠️ HTTP(オフライン不可)",
        "rgba(255, 159, 67, 0.2)",
        "#ff9f43",
        "【オフライン保存が無効です】\nAndroidやiPhoneのセキュリティ制限により、http://（暗号化されていない通信）では端末内部へのアプリ保存がブロックされます。\n\nそのため、同一Wi-Fiを切断すると「アクセスできません」となります。\n\nホール等でオフライン動作させるには、GitHub Pages等の無料HTTPS配信をご利用いただくか、Chromeの設定変更が必要です。"
      );
      return;
    }

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./service-worker.js")
          .then(reg => {
            console.log("ServiceWorker登録完了:", reg.scope);
            更新バッジ(
              "success",
              "オフラインOK ✅",
              "rgba(46, 213, 115, 0.2)",
              "#2ed573",
              "【オフライン準備完了】\nアプリの全プログラムがスマホ端末内に保存されました！\n\n同一Wi-Fiを切断しても、パチンコ店内の圏外や機内モードでも完全にオフラインで動作します。"
            );
          })
          .catch(err => {
            console.log("ServiceWorker登録スキップまたはエラー:", err);
            更新バッジ(
              "error",
              "オフライン失敗 ❌",
              "rgba(232, 65, 24, 0.2)",
              "#ff6b81",
              `ServiceWorkerの登録に失敗しました: ${err.message || err}`
            );
          });
      });
    } else {
      更新バッジ(
        "unsupported",
        "オフライン非対応",
        "rgba(255, 255, 255, 0.1)",
        "#aaa",
        "お使いのブラウザはServiceWorkerに対応していません。"
      );
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const アプリ = new アプリケーション();
  アプリ.初期化();
});
