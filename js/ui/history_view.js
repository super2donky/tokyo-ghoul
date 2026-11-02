/**
 * 時系列履歴画面UIモジュール
 * 全イベントの発生順表示、個別編集、削除、手動割り込み追加をサポート
 */

import { イベント種別, シンキ_イベント作成 } from "../models/types.js";

/**
 * 履歴画面の描画
 */
export function 履歴画面_レンダリング(コンテナ, セッション, イベント更新コールバック) {
  if (!コンテナ) return;

  const イベント群 = [...セッション.イベントリスト].sort((a, b) => {
    if (a.通常ゲーム数 !== b.通常ゲーム数) return a.通常ゲーム数 - b.通常ゲーム数;
    return (a.連番 || 0) - (b.連番 || 0);
  });

  let リストhtml = "";
  if (イベント群.length === 0) {
    リストhtml = `
      <div style="text-align:center;padding:30px 10px;color:var(--text-muted);">
        <p style="font-size:1.1rem;margin-bottom:8px;">実戦履歴がまだありません</p>
        <p style="font-size:0.85rem;">「クイック入力」からイベントを記録してください。</p>
      </div>
    `;
  } else {
    let 前回G = 0;
    リストhtml = イベント群.map((ev, index) => {
      let クラス名 = "";
      if (ev.種別 === イベント種別.CZ突入 || ev.種別 === イベント種別.CZ結果) クラス名 = "cz";
      else if (ev.種別 === イベント種別.AT開始 || ev.種別 === イベント種別.AT終了 || ev.種別 === イベント種別.引き戻し判定) クラス名 = "at";
      else if (ev.種別 === イベント種別.精神世界突入 || ev.種別 === イベント種別.精神世界中役) クラス名 = "seishin";
      else if (ev.種別 === イベント種別.レア役成立 || ev.種別 === イベント種別.赫眼リプ成立) クラス名 = "rare";

      const 差分G = ev.通常ゲーム数 - 前回G;
      前回G = ev.通常ゲーム数;

      const 詳細文字 = ev.詳細 && Object.keys(ev.詳細).length > 0
        ? Object.entries(ev.詳細).map(([k, v]) => `${k}:${typeof v === "object" ? JSON.stringify(v) : v}`).join(" / ")
        : "";

      return `
        <div class="timeline-item ${クラス名}" data-event-id="${ev.イベントID}">
          <div class="timeline-meta">
            <div>
              <span class="timeline-g">${ev.通常ゲーム数}G</span>
              ${index > 0 && 差分G > 0 ? `<div style="font-size:0.65rem;color:var(--text-muted);">+${差分G}G</div>` : ''}
            </div>
            <span class="timeline-pt">${ev.ポイント数 !== undefined ? `${ev.ポイント数}pt` : ""}</span>
          </div>
          <div style="flex:1;padding:0 8px;">
            <div class="timeline-title">${ev.タイトル}</div>
            ${詳細文字 ? `<div class="timeline-desc">${詳細文字}</div>` : ""}
          </div>
          <div class="timeline-actions">
            <button class="btn-icon btn-edit-event" data-event-id="${ev.イベントID}" title="編集">✏️</button>
            <button class="btn-icon delete btn-delete-event" data-event-id="${ev.イベントID}" title="削除">🗑️</button>
          </div>
        </div>
      `;
    }).join("");
  }

  コンテナ.innerHTML = `
    <div class="card" style="margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <span style="font-size:0.9rem;font-weight:bold;">実戦履歴タイムライン</span>
        <span style="font-size:0.75rem;color:var(--text-muted);margin-left:6px;">(全${イベント群.length}件)</span>
      </div>
      <button id="btn-manual-add-event" style="background:var(--accent-red);border:none;color:#fff;border-radius:6px;padding:6px 12px;font-size:0.8rem;font-weight:bold;cursor:pointer;">
        ＋ 任意イベント追加
      </button>
    </div>

    <div class="timeline-list">
      ${リストhtml}
    </div>
  `;

  // 削除ボタンのハンドラ
  コンテナ.querySelectorAll(".btn-delete-event").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-event-id");
      const 標的 = セッション.イベントリスト.find(e => e.イベントID === id);
      if (!標的) return;

      if (confirm(`【${標的.通常ゲーム数}G: ${標的.タイトル}】を削除しますか？\n削除後は集計値が自動再計算されます。`)) {
        セッション.イベントリスト = セッション.イベントリスト.filter(e => e.イベントID !== id);
        セッション.イベントリスト.forEach((e, idx) => { e.連番 = idx + 1; });
        イベント更新コールバック(セッション);
      }
    });
  });

  // 編集ボタンのハンドラ
  コンテナ.querySelectorAll(".btn-edit-event").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-event-id");
      const 標的 = セッション.イベントリスト.find(e => e.イベントID === id);
      if (!標的) return;

      モーダル表示_イベント編集(標的, (更新後イベント) => {
        const index = セッション.イベントリスト.findIndex(e => e.イベントID === id);
        if (index !== -1) {
          セッション.イベントリスト[index] = 更新後イベント;
          イベント更新コールバック(セッション);
        }
      });
    });
  });

  // 任意イベント追加ボタン
  コンテナ.querySelector("#btn-manual-add-event")?.addEventListener("click", () => {
    モーダル表示_手動イベント追加(セッション, (新規イベント) => {
      セッション.イベントリスト.push(新規イベント);
      セッション.イベントリスト.sort((a, b) => {
        if (a.通常ゲーム数 !== b.通常ゲーム数) return a.通常ゲーム数 - b.通常ゲーム数;
        return (a.連番 || 0) - (b.連番 || 0);
      });
      セッション.イベントリスト.forEach((e, idx) => { e.連番 = idx + 1; });
      イベント更新コールバック(セッション);
    });
  });
}

function モーダル表示_イベント編集(イベント, onSave) {
  const overlay = document.getElementById("global-modal-overlay");
  const content = document.getElementById("global-modal-content");
  if (!overlay || !content) return;

  content.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">✏️ イベント情報の編集</div>
      <button class="btn-close" id="modal-close">&times;</button>
    </div>
    <div class="form-group">
      <label class="form-label">通常ゲーム数</label>
      <input type="number" class="form-control" id="edit-g" value="${イベント.通常ゲーム数}">
    </div>
    <div class="form-group">
      <label class="form-label">ポイント数</label>
      <input type="number" class="form-control" id="edit-pt" value="${イベント.ポイント数 || 0}">
    </div>
    <div class="form-group">
      <label class="form-label">イベントタイトル</label>
      <input type="text" class="form-control" id="edit-title" value="${イベント.タイトル}">
    </div>
    <button class="btn-block" id="btn-save-edit">変更を保存</button>
  `;

  overlay.classList.add("active");
  content.querySelector("#modal-close")?.addEventListener("click", () => overlay.classList.remove("active"));

  content.querySelector("#btn-save-edit")?.addEventListener("click", () => {
    イベント.通常ゲーム数 = parseInt(content.querySelector("#edit-g").value, 10) || 0;
    イベント.ポイント数 = parseInt(content.querySelector("#edit-pt").value, 10) || 0;
    イベント.タイトル = content.querySelector("#edit-title").value;
    overlay.classList.remove("active");
    onSave(イベント);
  });
}

function モーダル表示_手動イベント追加(セッション, onAdd) {
  const overlay = document.getElementById("global-modal-overlay");
  const content = document.getElementById("global-modal-content");
  if (!overlay || !content) return;

  let 基準G = 0;
  let 基準pt = 0;
  if (セッション.イベントリスト.length > 0) {
    const last = セッション.イベントリスト[セッション.イベントリスト.length - 1];
    基準G = last.通常ゲーム数 || 0;
    基準pt = last.ポイント数 || 0;
  }

  content.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">＋ 任意イベントの追加</div>
      <button class="btn-close" id="modal-close">&times;</button>
    </div>
    <div class="form-group">
      <label class="form-label">通常ゲーム数</label>
      <input type="number" class="form-control" id="add-manual-g" value="${基準G}">
    </div>
    <div class="form-group">
      <label class="form-label">ポイント数</label>
      <input type="number" class="form-control" id="add-manual-pt" value="${基準pt}">
    </div>
    <div class="form-group">
      <label class="form-label">イベントタイトル / 内容</label>
      <input type="text" class="form-control" id="add-manual-title" placeholder="例: 77G チャンス目、前兆開始 等">
    </div>
    <button class="btn-block" id="btn-submit-manual-add">タイムラインに追加</button>
  `;

  overlay.classList.add("active");
  content.querySelector("#modal-close")?.addEventListener("click", () => overlay.classList.remove("active"));

  content.querySelector("#btn-submit-manual-add")?.addEventListener("click", () => {
    const g = parseInt(content.querySelector("#add-manual-g").value, 10) || 0;
    const pt = parseInt(content.querySelector("#add-manual-pt").value, 10) || 0;
    const title = content.querySelector("#add-manual-title").value;

    if (!title) {
      alert("タイトルを入力してください");
      return;
    }

    const 新イベント = シンキ_イベント作成({
      通常ゲーム数: g,
      ポイント数: pt,
      種別: イベント種別.メモ記録,
      タイトル: title,
      詳細: { 手動入力: true }
    });

    overlay.classList.remove("active");
    onAdd(新イベント);
  });
}
