/**
 * 時系列履歴画面UIモジュール
 * 全イベントの発生順表示、個別編集、削除、手動割り込み追加をサポート
 */

import { イベント種別, シンキ_イベント作成 } from "../models/types.js";

function イベント時刻取得(ev) {
  if (!ev) return 0;
  if (ev.タイムスタンプ && Number(ev.タイムスタンプ) > 0) {
    return Number(ev.タイムスタンプ);
  }
  if (ev.イベントID && typeof ev.イベントID === "string" && ev.イベントID.startsWith("evt_")) {
    const parts = ev.イベントID.split("_");
    const t = Number(parts[1]);
    if (!isNaN(t) && t > 0) return t;
  }
  return Number(ev.連番) || 0;
}

// デフォルトは「新着順（最新イベントが一番上）」
let 表示ソート順 = "DESC"; 

/**
 * 履歴画面の描画
 */
export function 履歴画面_レンダリング(コンテナ, セッション, イベント更新コールバック) {
  if (!コンテナ) return;

  // 1. まず完全に時刻順（発生時系列）でソート
  const 時系列イベント群 = [...セッション.イベントリスト].sort((a, b) => {
    return イベント時刻取得(a) - イベント時刻取得(b);
  });

  // 2. 差分ゲーム数の計算（時系列順に計算）
  let 前回G = 0;
  let 表示イベント群 = 時系列イベント群.map((ev, index) => {
    const 差分G = ev.通常ゲーム数 - 前回G;
    前回G = ev.通常ゲーム数;
    return {
      元データ: ev,
      差分G: 差分G,
      時系列番号: index + 1
    };
  });

  // 3. ユーザーの選択に応じて表示順を反転（DESC: 最新が上, ASC: 朝イチから）
  if (表示ソート順 === "DESC") {
    表示イベント群.reverse();
  }

  let リストhtml = "";
  if (表示イベント群.length === 0) {
    リストhtml = `
      <div style="text-align:center;padding:30px 10px;color:var(--text-muted);">
        <p style="font-size:1.1rem;margin-bottom:8px;">実戦履歴がまだありません</p>
        <p style="font-size:0.85rem;">「クイック入力」からイベントを記録してください。</p>
      </div>
    `;
  } else {
    リストhtml = 表示イベント群.map(item => {
      const ev = item.元データ;
      let クラス名 = "";
      if (ev.種別 === イベント種別.CZ突入 || ev.種別 === イベント種別.CZ結果) クラス名 = "cz";
      else if (ev.種別 === イベント種別.AT当選 || ev.種別 === イベント種別.AT開始 || ev.種別 === イベント種別.AT終了 || ev.種別 === イベント種別.引き戻し判定) クラス名 = "at";
      else if (ev.種別 === イベント種別.精神世界突入 || ev.種別 === イベント種別.精神世界中役) クラス名 = "seishin";
      else if (ev.種別 === イベント種別.レア役成立 || ev.種別 === イベント種別.赫眼リプ成立) クラス名 = "rare";

      const 詳細文字 = ev.詳細 && Object.keys(ev.詳細).length > 0
        ? Object.entries(ev.詳細).map(([k, v]) => `${k}:${typeof v === "object" ? JSON.stringify(v) : v}`).join(" / ")
        : "";

      return `
        <div class="timeline-item ${クラス名}" data-event-id="${ev.イベントID}">
          <div class="timeline-meta">
            <div>
              <span class="timeline-g">${ev.通常ゲーム数}G</span>
              ${item.差分G > 0 ? `<div style="font-size:0.65rem;color:var(--text-muted);">+${item.差分G}G</div>` : ''}
            </div>
            <span class="timeline-pt">${ev.ポイント数 !== undefined ? `${ev.ポイント数}pt` : ""}</span>
          </div>
          <div style="flex:1;padding:0 8px;">
            <div style="font-size:0.7rem;color:var(--text-muted);">#${item.時系列番号}</div>
            <div class="timeline-title">${ev.タイトル}</div>
            ${詳細文字 ? `<div class="timeline-desc">${詳細文字}</div>` : ""}
          </div>
          <div class="timeline-actions" style="display:flex;gap:4px;align-items:center;">
            <button class="btn-icon btn-insert-event" data-event-id="${ev.イベントID}" title="この前後にイベントを挿入" style="background:rgba(76, 209, 55, 0.15);border:1px solid #4cd137;color:#4cd137;font-size:0.75rem;padding:4px 8px;font-weight:bold;border-radius:4px;">➕挿入</button>
            <button class="btn-icon btn-edit-event" data-event-id="${ev.イベントID}" title="編集">✏️</button>
            <button class="btn-icon delete btn-delete-event" data-event-id="${ev.イベントID}" title="削除">🗑️</button>
          </div>
        </div>
      `;
    }).join("");
  }

  コンテナ.innerHTML = `
    <div class="card" style="margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;padding:10px 12px;">
      <div>
        <span style="font-size:0.95rem;font-weight:bold;">実戦履歴タイムライン</span>
        <span style="font-size:0.75rem;color:var(--text-muted);margin-left:6px;">(${表示イベント群.length}件)</span>
      </div>
      <div style="display:flex;gap:6px;">
        <button id="btn-toggle-sort" style="background:rgba(255,255,255,0.1);border:1px solid var(--border-color);color:#fff;border-radius:6px;padding:6px 10px;font-size:0.75rem;font-weight:bold;cursor:pointer;">
          ${表示ソート順 === "DESC" ? "⬆️ 最新が上" : "⬇️ 朝イチから"}
        </button>
        <button id="btn-manual-add-event" style="background:var(--accent-red);border:none;color:#fff;border-radius:6px;padding:6px 10px;font-size:0.75rem;font-weight:bold;cursor:pointer;">
          ＋ 追加
        </button>
      </div>
    </div>

    <div class="timeline-list">
      ${リストhtml}
    </div>
  `;

  // ソート順切り替えボタン
  コンテナ.querySelector("#btn-toggle-sort")?.addEventListener("click", () => {
    表示ソート順 = (表示ソート順 === "DESC") ? "ASC" : "DESC";
    履歴画面_レンダリング(コンテナ, セッション, イベント更新コールバック);
  });

  // 削除ボタンのハンドラ
  コンテナ.querySelectorAll(".btn-delete-event").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-event-id");
      const 標的 = セッション.イベントリスト.find(e => e.イベントID === id);
      if (!標的) return;

      if (confirm(`【${標的.通常ゲーム数}G: ${標的.タイトル}】を削除しますか？`)) {
        セッション.イベントリスト = セッション.イベントリスト.filter(e => e.イベントID !== id);
        セッション.イベントリスト.forEach((e, idx) => { e.連番 = idx + 1; });
        イベント更新コールバック(セッション);
      }
    });
  });

  // 割り込み挿入ボタンのハンドラ（入力忘れ対応）
  コンテナ.querySelectorAll(".btn-insert-event").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-event-id");
      const 基準イベント = セッション.イベントリスト.find(e => e.イベントID === id);
      if (!基準イベント) return;

      モーダル表示_割り込み挿入(基準イベント, セッション, (新規イベント) => {
        // モーダル側で指定方向（直前または直後）へ既にsplice挿入・連番再付与済み
        イベント更新コールバック(セッション);
      });
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
      セッション.イベントリスト.sort((a, b) => イベント時刻取得(a) - イベント時刻取得(b));
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

function モーダル表示_割り込み挿入(基準イベント, セッション, onInsert) {
  const overlay = document.getElementById("global-modal-overlay");
  const content = document.getElementById("global-modal-content");
  if (!overlay || !content) return;

  const defaultG = 基準イベント.通常ゲーム数 !== undefined ? 基準イベント.通常ゲーム数 : 0;
  const defaultPt = 基準イベント.ポイント数 !== undefined ? 基準イベント.ポイント数 : 0;
  const defaultState = 基準イベント.状態 || "通常";

  const templates = [
    { label: "特化: BITES", title: "特化ゾーン: BITES", state: "AT中", type: イベント種別.AT中イベント, detail: { 特化種別: "BITES" } },
    { label: "特化: 極BITES", title: "特化ゾーン: 極BITES", state: "AT中", type: イベント種別.AT中イベント, detail: { 特化種別: "極BITES" } },
    { label: "有馬ジャッジ成功", title: "有馬ジャッジメント成功！", state: "AT中", type: イベント種別.AT中イベント, detail: { 有馬ジャッジメント: "成功" } },
    { label: "有馬ジャッジ失敗", title: "有馬ジャッジメント失敗", state: "AT中", type: イベント種別.AT中イベント, detail: { 有馬ジャッジメント: "失敗" } },
    { label: "スイカ成立", title: "レア役成立: スイカ", state: defaultState, type: イベント種別.レア役成立, detail: { 役: "スイカ" } },
    { label: "強チェリー成立", title: "レア役成立: 強チェリー", state: defaultState, type: イベント種別.レア役成立, detail: { 役: "強チェリー" } },
    { label: "チャンス目成立", title: "レア役成立: チャンス目", state: defaultState, type: イベント種別.レア役成立, detail: { 役: "チャンス目" } },
    { label: "前兆あり", title: "前兆発生（ガセ含む）", state: "通常", type: イベント種別.ゾーン前兆, detail: { 前兆発生: "あり" } },
    { label: "アイキャッチ", title: "アイキャッチ確認", state: "通常", type: イベント種別.示唆演出, detail: { 演出名: "アイキャッチ" } },
    { label: "ナミちゃんトロフィー", title: "ナミちゃんトロフィー出現", state: "AT中", type: イベント種別.示唆演出, detail: { 演出名: "トロフィー・枚数" } }
  ];

  content.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">➕ 履歴の途中割り込み挿入</div>
      <button class="btn-close" id="modal-close">&times;</button>
    </div>

    <!-- 挿入方向の選択スイッチ（上か下か） -->
    <div style="margin-bottom:12px;">
      <label class="form-label" style="font-weight:bold;">挿入する位置を選択:</label>
      <div style="display:flex;gap:8px;">
        <button type="button" class="option-btn dir-btn selected" id="btn-dir-after" data-dir="after" style="flex:1;padding:10px;font-weight:bold;border-color:#4cd137;background:rgba(76, 209, 55, 0.2);">
          ⬇️ 直後（下）に挿入
        </button>
        <button type="button" class="option-btn dir-btn" id="btn-dir-before" data-dir="before" style="flex:1;padding:10px;font-weight:bold;">
          ⬆️ 直前（上）に挿入
        </button>
      </div>
    </div>

    <!-- 基準位置の明示ボックス -->
    <div id="insert-guide-box" style="background:rgba(76, 209, 55, 0.1);border:1px solid #4cd137;padding:10px;border-radius:6px;margin-bottom:12px;font-size:0.85rem;color:#4cd137;">
      ⬇️ <strong>【#${基準イベント.連番} ${defaultG}G: ${基準イベント.タイトル}】</strong> の<strong>【すぐ下】</strong>に割り込みます
    </div>

    <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:6px;">よくある入力忘れテンプレート（タップで自動入力）:</p>
    <div class="option-grid" style="grid-template-columns:repeat(2, 1fr);gap:6px;margin-bottom:12px;">
      ${templates.map((t, idx) => `
        <button type="button" class="option-btn insert-tpl-btn" data-idx="${idx}" style="padding:8px 6px;font-size:0.8rem;text-align:left;">
          ${t.label}
        </button>
      `).join("")}
    </div>

    <div class="form-group" style="margin-bottom:8px;">
      <label class="form-label">イベントタイトル / 内容</label>
      <input type="text" class="form-control" id="insert-title" placeholder="例: 特化ゾーン: BITES、前兆開始 等">
    </div>

    <div style="display:flex;gap:8px;margin-bottom:8px;">
      <div class="form-group" style="flex:1;margin-bottom:0;">
        <label class="form-label">ゲーム数 (G)</label>
        <input type="number" class="form-control" id="insert-g" value="${defaultG}">
      </div>
      <div class="form-group" style="flex:1;margin-bottom:0;">
        <label class="form-label">ポイント (pt)</label>
        <input type="number" class="form-control" id="insert-pt" value="${defaultPt}">
      </div>
    </div>

    <div class="form-group" style="margin-bottom:14px;">
      <label class="form-label">状態</label>
      <select class="form-control" id="insert-state">
        <option value="通常" ${defaultState === '通常' ? 'selected' : ''}>通常</option>
        <option value="CZ中" ${defaultState === 'CZ中' ? 'selected' : ''}>CZ中</option>
        <option value="AT中" ${defaultState === 'AT中' ? 'selected' : ''}>AT中</option>
        <option value="引き戻し確認中" ${defaultState === '引き戻し確認中' ? 'selected' : ''}>引き戻し確認中</option>
        <option value="AT終了" ${defaultState === 'AT終了' ? 'selected' : ''}>AT終了</option>
      </select>
    </div>

    <button class="btn-block" id="btn-submit-insert" style="background:#4cd137;color:#000;font-weight:bold;padding:14px;font-size:1rem;">
      ➕ この位置に挿入する
    </button>
  `;

  overlay.classList.add("active");
  content.querySelector("#modal-close")?.addEventListener("click", () => overlay.classList.remove("active"));

  let 選択方向 = "after"; // "after" = 下, "before" = 上
  const guideBox = content.querySelector("#insert-guide-box");
  const btnAfter = content.querySelector("#btn-dir-after");
  const btnBefore = content.querySelector("#btn-dir-before");

  function 更新ガイド() {
    if (選択方向 === "after") {
      btnAfter.classList.add("selected");
      btnAfter.style.background = "rgba(76, 209, 55, 0.2)";
      btnAfter.style.borderColor = "#4cd137";
      btnBefore.classList.remove("selected");
      btnBefore.style.background = "";
      btnBefore.style.borderColor = "";
      guideBox.innerHTML = `⬇️ <strong>【#${基準イベント.連番} ${defaultG}G: ${基準イベント.タイトル}】</strong> の<strong>【すぐ下（直後）】</strong>に割り込みます`;
    } else {
      btnBefore.classList.add("selected");
      btnBefore.style.background = "rgba(76, 209, 55, 0.2)";
      btnBefore.style.borderColor = "#4cd137";
      btnAfter.classList.remove("selected");
      btnAfter.style.background = "";
      btnAfter.style.borderColor = "";
      guideBox.innerHTML = `⬆️ <strong>【#${基準イベント.連番} ${defaultG}G: ${基準イベント.タイトル}】</strong> の<strong>【すぐ上（直前）】</strong>に割り込みます`;
    }
  }

  btnAfter.addEventListener("click", () => {
    選択方向 = "after";
    更新ガイド();
  });
  btnBefore.addEventListener("click", () => {
    選択方向 = "before";
    更新ガイド();
  });

  let 選択テンプレート = null;
  content.querySelectorAll(".insert-tpl-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      content.querySelectorAll(".insert-tpl-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      const idx = parseInt(btn.getAttribute("data-idx"), 10);
      選択テンプレート = templates[idx];
      content.querySelector("#insert-title").value = 選択テンプレート.title;
      content.querySelector("#insert-state").value = 選択テンプレート.state;
    });
  });

  content.querySelector("#btn-submit-insert")?.addEventListener("click", () => {
    const title = content.querySelector("#insert-title").value.trim();
    if (!title) {
      alert("イベントタイトルを入力してください");
      return;
    }

    const g = parseInt(content.querySelector("#insert-g").value, 10) || 0;
    const pt = parseInt(content.querySelector("#insert-pt").value, 10) || 0;
    const state = content.querySelector("#insert-state").value;

    const targetIdx = セッション.イベントリスト.findIndex(e => e.イベントID === 基準イベント.イベントID);
    if (targetIdx === -1) return;

    const 前時刻 = イベント時刻取得(基準イベント);
    let 挿入時刻 = 前時刻;

    if (選択方向 === "after") {
      const 次イベント = (targetIdx + 1 < セッション.イベントリスト.length)
        ? セッション.イベントリスト[targetIdx + 1]
        : null;
      if (次イベント) {
        const 次時刻 = イベント時刻取得(次イベント);
        挿入時刻 = (次時刻 > 前時刻) ? Math.floor((前時刻 + 次時刻) / 2) : 前時刻 + 10;
      } else {
        挿入時刻 = 前時刻 + 10;
      }
    } else {
      const 前のイベント = (targetIdx > 0)
        ? セッション.イベントリスト[targetIdx - 1]
        : null;
      if (前のイベント) {
        const 前の時刻 = イベント時刻取得(前のイベント);
        挿入時刻 = (前時刻 > 前の時刻) ? Math.floor((前の時刻 + 前時刻) / 2) : 前時刻 - 10;
      } else {
        挿入時刻 = 前時刻 - 10;
      }
    }

    const 種別 = 選択テンプレート ? 選択テンプレート.type : イベント種別.メモ記録;
    const 詳細 = 選択テンプレート ? { ...選択テンプレート.detail, 手動割り込み挿入: true } : { 手動割り込み挿入: true };

    const 新規イベント = シンキ_イベント作成({
      通常ゲーム数: g,
      ポイント数: pt,
      状態: state,
      種別,
      タイトル: title,
      詳細
    });
    新規イベント.タイムスタンプ = 挿入時刻;

    // 挿入実行
    const insertIndex = 選択方向 === "after" ? targetIdx + 1 : targetIdx;
    セッション.イベントリスト.splice(insertIndex, 0, 新規イベント);
    セッション.イベントリスト.forEach((e, idx) => { e.連番 = idx + 1; });

    overlay.classList.remove("active");
    onInsert(新規イベント);
  });
}
