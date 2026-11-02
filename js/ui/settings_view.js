/**
 * 設定・データ管理・AI連携エクスポート画面UIモジュール
 */

import { ジェイソン_エクスポート, エーアイ向けテキスト_生成, シーエスブイ_エクスポート } from "../engine/exporter.js";
import { セッション_ホゾン, セッション_シュトク, セッション_イチラン_シュトク, セッション_サクジョ } from "../storage/db.js";
import { シンキ_セッション作成 } from "../models/types.js";

function 振動フィードバック(ms = 30) {
  try {
    if (navigator.vibrate) navigator.vibrate(ms);
  } catch (e) {}
}

export async function 設定画面_レンダリング(コンテナ, セッション, セッション切り替えコールバック) {
  if (!コンテナ) return;

  const 一覧 = await セッション_イチラン_シュトク();

  コンテナ.innerHTML = `
    <!-- AI連携エクスポート（最重要） -->
    <div class="card" style="border:2px solid var(--accent-red);">
      <div class="card-title">
        <span>🤖 AI連携エクスポート (ChatGPT用)</span>
        <span class="header-badge">ワンタップ</span>
      </div>
      <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:12px;">
        これまでの実戦履歴、各カウンター、設定・モード示唆を、AIが誤読しないよう完全構造化してテキスト出力します。相談目的に応じて選択してください。
      </p>

      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:10px;">
        <button class="btn-block btn-copy-ai" data-type="総合設定推測" style="background:linear-gradient(135deg, #e84118, #9c88ff);margin:0;">
          📋 ①【総合設定推測】用テキストをコピー
        </button>
        <button class="btn-block btn-copy-ai" data-type="ヤメ時判断" style="background:linear-gradient(135deg, #00a8ff, #4cd137);margin:0;">
          🛑 ②【ヤメ時・続行判断】用テキストをコピー
        </button>
        <button class="btn-block btn-copy-ai" data-type="モード診断" style="background:linear-gradient(135deg, #fbc531, #e84118);margin:0;color:#000;">
          🧭 ③【モード精密診断】用テキストをコピー
        </button>
      </div>

      <button class="btn-step" id="btn-preview-ai-text" style="width:100%;padding:8px;font-size:0.85rem;">
        👁️ AI向けテキストを画面で確認
      </button>
    </div>

    <!-- ファイルエクスポート / インポート -->
    <div class="card">
      <div class="card-title">
        <span>💾 バックアップ / ファイル入出力</span>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:10px;">
        <button class="btn-step" id="btn-download-json" style="flex:1;padding:10px 4px;">📥 JSON保存</button>
        <button class="btn-step" id="btn-download-csv" style="flex:1;padding:10px 4px;">📊 CSV保存</button>
      </div>
      <div style="border-top:1px solid var(--border-color);padding-top:10px;">
        <label class="form-label">JSONファイルから実戦データを復元 (インポート)</label>
        <input type="file" id="file-import-json" accept=".json" style="font-size:0.8rem;color:var(--text-muted);width:100%;">
      </div>
    </div>

    <!-- 前任者データ引き継ぎ設定 -->
    <div class="card">
      <div class="card-title">
        <span>🔄 途中参加・前任者データ引き継ぎ</span>
      </div>
      <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:10px;">
        他のAIやホールのデータカウンターから打ち始め時点の数値を初期値として登録します。自身が打った実イベントとは分離して二重計上を防ぎます。
      </p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
        <div>
          <label class="form-label">打ち始め前 通常G数</label>
          <input type="number" class="form-control" id="input-snap-g" value="${セッション.初期スナップショット?.通常ゲーム数 || 0}">
        </div>
        <div>
          <label class="form-label">打ち始め前 AT回数</label>
          <input type="number" class="form-control" id="input-snap-at" value="${セッション.初期スナップショット?.AT初当たり回数 || 0}">
        </div>
        <div>
          <label class="form-label">打ち始め前 CZ突入回数</label>
          <input type="number" class="form-control" id="input-snap-cz" value="${セッション.初期スナップショット?.CZ突入回数 || 0}">
        </div>
        <div>
          <label class="form-label">打ち始め前 CZ成功回数</label>
          <input type="number" class="form-control" id="input-snap-cz-win" value="${セッション.初期スナップショット?.CZ成功回数 || 0}">
        </div>
      </div>
      <button class="btn-block" id="btn-save-snapshot" style="background:var(--accent-blue);">引き継ぎ初期値を反映</button>
    </div>

    <!-- 実戦セッション一覧・切り替え -->
    <div class="card">
      <div class="card-title">
        <span>🗂️ 保存済み実戦セッション一覧</span>
        <button id="btn-create-new-session" style="background:var(--accent-red);border:none;color:#fff;border-radius:4px;padding:3px 8px;font-size:0.75rem;cursor:pointer;">＋ 新規実戦開始</button>
      </div>
      <div id="session-list-container" style="display:flex;flex-direction:column;gap:6px;">
        ${一覧.map(s => `
          <div style="display:flex;justify-content:space-between;align-items:center;background:var(--bg-secondary);padding:8px 10px;border-radius:6px;border:1px solid ${s.セッションID === セッション.セッションID ? 'var(--accent-red)' : 'var(--border-color)'};">
            <div>
              <span style="font-weight:bold;color:#fff;font-size:0.9rem;">${s.日付 || "日付未設定"}</span>
              <span style="font-size:0.8rem;color:var(--text-muted);margin-left:6px;">${s.店舗名 || ""} ${s.台番号 ? `(${s.台番号}番台)` : ""}</span>
              <span style="display:block;font-size:0.7rem;color:var(--text-muted);">${s.イベントリスト?.length || 0}件の記録</span>
            </div>
            <div style="display:flex;gap:6px;">
              ${s.セッションID === セッション.セッションID
                ? `<span style="font-size:0.75rem;color:var(--accent-gold);font-weight:bold;align-self:center;">現在表示中</span>`
                : `<button class="btn-step btn-switch-session" data-session-id="${s.セッションID}">切替</button>`}
              <button class="btn-icon delete btn-del-session" data-session-id="${s.セッションID}">🗑️</button>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  // AI向けテキストのコピー（用途別）
  コンテナ.querySelectorAll(".btn-copy-ai").forEach(btn => {
    btn.addEventListener("click", () => {
      振動フィードバック(40);
      const タイプ = btn.getAttribute("data-type");
      const txt = エーアイ向けテキスト_生成(セッション, タイプ);
      navigator.clipboard.writeText(txt).then(() => {
        トースト表示(`✅ 【${タイプ}】用テキストをコピーしました！`);
      }).catch(err => {
        console.error("コピー失敗:", err);
        prompt("以下のテキストを手動でコピーしてください:", txt);
      });
    });
  });

  // AI向けテキストのプレビュー
  コンテナ.querySelector("#btn-preview-ai-text")?.addEventListener("click", () => {
    振動フィードバック();
    const txt = エーアイ向けテキスト_生成(セッション, "総合設定推測");
    const overlay = document.getElementById("global-modal-overlay");
    const content = document.getElementById("global-modal-content");
    if (overlay && content) {
      content.innerHTML = `
        <div class="modal-header">
          <div class="modal-title">AI向けテキストプレビュー</div>
          <button class="btn-close" id="modal-close">&times;</button>
        </div>
        <textarea style="width:100%;height:60vh;background:#111;color:#eee;font-family:monospace;padding:10px;border:1px solid var(--border-color);border-radius:6px;font-size:0.8rem;" readonly>${txt}</textarea>
        <button class="btn-block" id="btn-copy-from-preview" style="margin-top:10px;">コピーする</button>
      `;
      overlay.classList.add("active");
      content.querySelector("#modal-close")?.addEventListener("click", () => overlay.classList.remove("active"));
      content.querySelector("#btn-copy-from-preview")?.addEventListener("click", () => {
        navigator.clipboard.writeText(txt);
        トースト表示("✅ コピーしました！");
      });
    }
  });

  // JSONダウンロード
  コンテナ.querySelector("#btn-download-json")?.addEventListener("click", () => {
    振動フィードバック();
    const jsonStr = ジェイソン_エクスポート(セッション);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tokyo_ghoul_${セッション.日付 || "session"}_${セッション.台番号 || "data"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    トースト表示("📥 JSONファイルをダウンロードしました");
  });

  // CSVダウンロード
  コンテナ.querySelector("#btn-download-csv")?.addEventListener("click", () => {
    振動フィードバック();
    const csvStr = シーエスブイ_エクスポート(セッション);
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvStr], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tokyo_ghoul_${セッション.日付 || "history"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    トースト表示("📊 CSVファイルをダウンロードしました");
  });

  // JSONインポート
  コンテナ.querySelector("#file-import-json")?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const インポートデータ = JSON.parse(evt.target.result);
        let 復元セッション = null;

        if (インポートデータ.全イベント時系列 && Array.isArray(インポートデータ.全イベント時系列)) {
          復元セッション = {
            スキーマバージョン: インポートデータ.スキーマバージョン || "1.0.0",
            セッションID: インポートデータ.実戦メタ情報?.セッションID || ("session_" + Date.now()),
            日付: インポートデータ.実戦メタ情報?.日付 || new Date().toISOString().split("T")[0],
            店舗名: インポートデータ.実戦メタ情報?.店舗名 || "",
            台番号: インポートデータ.実戦メタ情報?.台番号 || "",
            作成日時: new Date().toISOString(),
            更新日時: new Date().toISOString(),
            収支情報: インポートデータ.実戦メタ情報?.収支 || { 投資枚数: 0, 回収枚数: 0, 差枚数: 0 },
            初期スナップショット: インポートデータ.引き継ぎスナップショット || { 有効: false },
            イベントリスト: インポートデータ.全イベント時系列
          };
        } else if (インポートデータ.イベントリスト) {
          復元セッション = インポートデータ;
        }

        if (復元セッション) {
          await セッション_ホゾン(復元セッション);
          トースト表示("✅ データを正常に復元しました！");
          セッション切り替えコールバック(復元セッション);
        } else {
          alert("有効な東京喰種実戦JSONデータではありませんでした。");
        }
      } catch (err) {
        console.error("インポートエラー:", err);
        alert("JSONファイルの解析に失敗しました。");
      }
    };
    reader.readAsText(file);
  });

  // 引き継ぎ初期値の反映
  コンテナ.querySelector("#btn-save-snapshot")?.addEventListener("click", async () => {
    振動フィードバック();
    const g = parseInt(コンテナ.querySelector("#input-snap-g").value, 10) || 0;
    const at = parseInt(コンテナ.querySelector("#input-snap-at").value, 10) || 0;
    const cz = parseInt(コンテナ.querySelector("#input-snap-cz").value, 10) || 0;
    const czWin = parseInt(コンテナ.querySelector("#input-snap-cz-win").value, 10) || 0;

    セッション.初期スナップショット = {
      有効: (g > 0 || at > 0 || cz > 0),
      通常ゲーム数: g,
      AT初当たり回数: at,
      CZ突入回数: cz,
      CZ成功回数: czWin,
      メモ: "設定画面から登録"
    };

    await セッション_ホゾン(セッション);
    トースト表示("✅ 引き継ぎ初期データを保存しました！");
    セッション切り替えコールバック(セッション);
  });

  // 新規実戦開始
  コンテナ.querySelector("#btn-create-new-session")?.addEventListener("click", async () => {
    振動フィードバック();
    const 店舗 = prompt("店舗名を入力してください（任意）:", "〇〇店");
    if (店舗 === null) return;
    const 台番号 = prompt("台番号を入力してください（任意）:", "123");
    if (台番号 === null) return;

    const 新セッション = シンキ_セッション作成(店舗, 台番号);
    await セッション_ホゾン(新セッション);
    トースト表示("🎉 新しい実戦を開始しました！");
    セッション切り替えコールバック(新セッション);
  });

  // セッション切り替え
  コンテナ.querySelectorAll(".btn-switch-session").forEach(btn => {
    btn.addEventListener("click", async () => {
      振動フィードバック();
      const id = btn.getAttribute("data-session-id");
      const s = await セッション_シュトク(id);
      if (s) {
        トースト表示("実戦データを切り替えました");
        セッション切り替えコールバック(s);
      }
    });
  });

  // セッション削除
  コンテナ.querySelectorAll(".btn-del-session").forEach(btn => {
    btn.addEventListener("click", async () => {
      振動フィードバック(40);
      const id = btn.getAttribute("data-session-id");
      if (confirm("この実戦データを完全に削除しますか？\n（復元できません）")) {
        await セッション_サクジョ(id);
        トースト表示("実戦データを削除しました");
        if (id === セッション.セッションID) {
          const 残り = await セッション_イチラン_シュトク();
          if (残り.length > 0) {
            セッション切り替えコールバック(残り[0]);
          } else {
            const 新 = シンキ_セッション作成();
            await セッション_ホゾン(新);
            セッション切り替えコールバック(新);
          }
        } else {
          設定画面_レンダリング(コンテナ, セッション, セッション切り替えコールバック);
        }
      }
    });
  });
}

function トースト表示(メッセージ) {
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
  }, 2500);
}
