/**
 * クイック入力画面UIモジュール
 * スマートフォンの片手親指操作に最適化した大ボタン・最小タップ数の入力インターフェース
 */

import { ジョウタイ, イベント種別, CZ種別, トウセン_ケイキ, レア役_シュベツ, ゾーン_コウホ, ゾーン_ゼンチョウ_ケッカ, AT_キョドウ_シュベツ, ヒキモドシ_ケッカ, シンキ_イベント作成 } from "../models/types.js";
import { AT_シュウリョウガメン_マスター, CZ_プッシュカード_マスター, ショウタイジョウ_マスター, アイキャッチ_マスター, トロフィー_マイステイ_マスター, エンディング_カード_マスター, ゼンチョウ_ゾーン法則_マスター, トウキョウジョウコウ_演出マスター, モード_規定ゲーム数_マトリクス } from "../models/master_data.js";

/**
 * タップ時の微弱振動フィードバック
 */
function 振動フィードバック(ms = 25) {
  try {
    if (navigator.vibrate) {
      navigator.vibrate(ms);
    }
  } catch (e) {}
}

/**
 * クイック入力画面の描画
 */
export function クイック入力_レンダリング(コンテナ, セッション, イベント追加コールバック, イベント取り消しコールバック) {
  if (!コンテナ) return;

  let 最新G = 0;
  let 最新pt = 0;
  let 現在状態 = ジョウタイ.通常;

  if (セッション && セッション.イベントリスト.length > 0) {
    const lastEv = セッション.イベントリスト[セッション.イベントリスト.length - 1];
    if (lastEv.通常ゲーム数 !== undefined) 最新G = Number(lastEv.通常ゲーム数);
    if (lastEv.ポイント数 !== undefined) 最新pt = Number(lastEv.ポイント数);
    if (lastEv.状態) 現在状態 = lastEv.状態;
    // 精神世界は通常時の一環として扱い、パネル消滅を防ぐ
    if (現在状態 === ジョウタイ.精神世界) {
      現在状態 = ジョウタイ.通常;
    }
  }

  const 直前イベント = (セッション && セッション.イベントリスト.length > 0)
    ? セッション.イベントリスト[セッション.イベントリスト.length - 1]
    : null;

  コンテナ.innerHTML = `
    <!-- G数・pt 簡易ステッパーバー -->
    <div class="card" style="padding:10px 12px;margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="font-size:0.8rem;font-weight:bold;color:var(--text-muted);">現在値（ワンタップ加減算）</span>
        <div style="display:flex;gap:6px;">
          <button id="btn-reset-gp" style="background:rgba(255, 159, 67, 0.15);border:1px solid #ff9f43;color:#ff9f43;border-radius:4px;padding:2px 8px;font-size:0.75rem;font-weight:bold;cursor:pointer;">🔄 0リセット</button>
          ${直前イベント ? `<button id="btn-undo-event" style="background:rgba(232, 65, 24, 0.2);border:1px solid var(--accent-red);color:#ff6b81;border-radius:4px;padding:2px 8px;font-size:0.75rem;font-weight:bold;cursor:pointer;">↩️ 直前取消 [${直前イベント.通常ゲーム数}G]</button>` : ''}
          <button id="btn-manual-set-gp" style="background:transparent;border:1px solid var(--border-color);color:#fff;border-radius:4px;padding:2px 8px;font-size:0.75rem;cursor:pointer;">直接指定</button>
        </div>
      </div>

      <!-- ゲーム数調整（データ機感覚で増減可能・ポイント連動完全廃止） -->
      <div class="stepper-bar">
        <span class="stepper-label">区間G数</span>
        <span class="stepper-val" id="quick-disp-g">${最新G}G</span>
        <div class="stepper-btns">
          <button class="btn-step" data-add-g="-10" style="background:rgba(255,255,255,0.05);">-10</button>
          <button class="btn-step" data-add-g="-1" style="background:rgba(255,255,255,0.05);">-1</button>
          <button class="btn-step" data-add-g="1">+1</button>
          <button class="btn-step" data-add-g="10">+10</button>
          <button class="btn-step" data-add-g="50">+50</button>
          <button class="btn-step" data-add-g="100">+100</button>
        </div>
      </div>
    </div>

    <!-- 状態切り替えタブ -->
    <div style="display:flex;gap:6px;margin-bottom:12px;">
      <button class="state-tab-btn ${現在状態 === ジョウタイ.通常 ? 'active' : ''}" data-state="${ジョウタイ.通常}" style="flex:1;padding:8px 4px;border-radius:6px;border:1px solid var(--border-color);background:${現在状態 === ジョウタイ.通常 ? 'var(--accent-red)' : 'var(--bg-card)'};color:#fff;font-weight:bold;font-size:0.85rem;cursor:pointer;">通常時</button>
      <button class="state-tab-btn ${現在状態 === ジョウタイ.CZ中 ? 'active' : ''}" data-state="${ジョウタイ.CZ中}" style="flex:1;padding:8px 4px;border-radius:6px;border:1px solid var(--border-color);background:${現在状態 === ジョウタイ.CZ中 ? 'var(--accent-blue)' : 'var(--bg-card)'};color:#fff;font-weight:bold;font-size:0.85rem;cursor:pointer;">CZ中</button>
      <button class="state-tab-btn ${現在状態 === ジョウタイ.AT中 ? 'active' : ''}" data-state="${ジョウタイ.AT中}" style="flex:1;padding:8px 4px;border-radius:6px;border:1px solid var(--border-color);background:${現在状態 === ジョウタイ.AT中 ? 'var(--accent-gold)' : 'var(--bg-card)'};color:${現在状態 === ジョウタイ.AT中 ? '#000' : '#fff'};font-weight:bold;font-size:0.85rem;cursor:pointer;">AT中</button>
      <button class="state-tab-btn ${現在状態 === ジョウタイ.引き戻し確認中 ? 'active' : ''}" data-state="${ジョウタイ.引き戻し確認中}" style="flex:1;padding:8px 4px;border-radius:6px;border:1px solid var(--border-color);background:${現在状態 === ジョウタイ.引き戻し確認中 ? 'var(--accent-purple)' : 'var(--bg-card)'};color:#fff;font-weight:bold;font-size:0.85rem;cursor:pointer;">引き戻し中</button>
    </div>

    <!-- 【通常時ボタングループ】 -->
    <div id="quick-panel-tsujo" style="display:${現在状態 === ジョウタイ.通常 ? 'block' : 'none'};">
      <div class="quick-grid">
        <button class="btn-quick primary" id="btn-input-zone" style="grid-column:span 2;padding:16px;background:linear-gradient(135deg, rgba(0, 168, 255, 0.25), rgba(156, 136, 255, 0.25));border-color:var(--accent-blue);">
          <span style="font-size:1.15rem;font-weight:bold;">🗼 規定G数ゾーン前兆記録</span>
          <span class="btn-sub">50G〜600Gゾーン前兆・当否（モード推測直結）</span>
        </button>
        <button class="btn-quick rare" id="btn-input-rare">
          <span>🍒 レア役成立</span>
          <span class="btn-sub">弱/強チェ・スイカ・チャンス目</span>
        </button>
        <button class="btn-quick rare" id="btn-input-kakugan">
          <span>👁️ 赫眼リプ</span>
          <span class="btn-sub">10G / 20G / 30G / 50G</span>
        </button>
        <button class="btn-quick primary" id="btn-input-seishin">
          <span>🌌 精神世界突入</span>
          <span class="btn-sub">10G / 20G / 30G (設定差大)</span>
        </button>
        <button class="btn-quick" id="btn-input-shisa" style="border-color:var(--accent-gold);background:linear-gradient(145deg, #2a2516, #252830);">
          <span>💌 演出・示唆</span>
          <span class="btn-sub">月山招待状・アイキャッチ</span>
        </button>
        <button class="btn-quick cz" id="btn-input-cz-entry" style="grid-column:span 2;padding:16px;">
          <span>⚔️ CZ当選！ (G数0リセット)</span>
          <span class="btn-sub">スイカ/チェリー/チャンス目/ゾーン等からCZ突入</span>
        </button>
        <button class="btn-quick at" id="btn-input-at-chokugeki" style="grid-column:span 2;padding:14px;">
          <span>👑 AT直撃 / エピボ / AT間天井</span>
          <span class="btn-sub">AT直撃(G数0リセット)・AT間天井(1200G)</span>
        </button>
      </div>
    </div>

    <!-- 【CZ中ボタングループ】 -->
    <div id="quick-panel-cz" style="display:${現在状態 === ジョウタイ.CZ中 ? 'block' : 'none'};">
      <div class="quick-grid">
        <button class="btn-quick at" id="btn-cz-success" style="grid-column:span 2;padding:22px;font-size:1.25rem;">
          <span>🎉 CZ成功！ → ATへ</span>
          <span class="btn-sub">レミニセンス突破 または 利世成功</span>
        </button>
        <button class="btn-quick" id="btn-cz-fail" style="grid-column:span 2;padding:18px;">
          <span>❌ CZ失敗（PUSHカード記録）</span>
          <span class="btn-sub">PUSHカードのモード・設定示唆を記録</span>
        </button>
      </div>
    </div>

    <!-- 【AT中ボタングループ】 -->
    <div id="quick-panel-at" style="display:${現在状態 === ジョウタイ.AT中 ? 'block' : 'none'};">
      <div class="quick-grid">
        <button class="btn-quick at" id="btn-at-bites">
          <span>🥩 BITES / 極BITES</span>
          <span class="btn-sub">特化ゾーン・枚数上乗せ</span>
        </button>
        <button class="btn-quick at" id="btn-at-arima" style="border-color:#ff4757;background:linear-gradient(135deg, rgba(255, 71, 87, 0.2), rgba(47, 53, 66, 0.8));">
          <span>⚔️ 有馬ジャッジメント</span>
          <span class="btn-sub">突入 / 成功(裏覚醒) / 失敗</span>
        </button>
        <button class="btn-quick at" id="btn-at-battle">
          <span>🔥 エピボ / バトル上乗せ</span>
          <span class="btn-sub">エピソードボーナス・直乗せ</span>
        </button>
        <button class="btn-quick" id="btn-at-ed-card" style="border-color:var(--accent-gold);background:linear-gradient(145deg, #2a2516, #252830);">
          <span>🎬 EDカード入力</span>
          <span class="btn-sub">消化中獲得カード即記録</span>
        </button>
        <button class="btn-quick primary" id="btn-at-end" style="grid-column:span 2;padding:20px;font-size:1.15rem;">
          <span>🏁 AT終了（終了画面・獲得枚数記録）</span>
          <span class="btn-sub">終了画面 ➡ アイキャッチ ➡ 引き戻しへ</span>
        </button>
      </div>
    </div>

    <!-- 【引き戻し確認中ボタングループ】 -->
    <div id="quick-panel-hikimodoshi" style="display:${現在状態 === ジョウタイ.引き戻し確認中 ? 'block' : 'none'};">
      <div class="quick-grid">
        <button class="btn-quick" id="btn-hikimodoshi-eyecatch" style="grid-column:span 2;padding:16px;border-color:var(--accent-gold);background:linear-gradient(145deg, #2a2516, #252830);">
          <span style="font-size:1.1rem;font-weight:bold;">👁️ 通常転落アイキャッチを記録</span>
          <span class="btn-sub">終了画面後の転落時アイキャッチ（次回モード・天井示唆）</span>
        </button>
        <button class="btn-quick at" id="btn-hikimodoshi-success" style="grid-column:span 2;padding:20px;font-size:1.2rem;">
          <span>🔁 引き戻し成功！ → AT再開 (G数0リセット)</span>
          <span class="btn-sub">32G以内AT再突入（引き戻し率集計）</span>
        </button>
        <button class="btn-quick" id="btn-hikimodoshi-fail" style="grid-column:span 2;padding:18px;">
          <span>💨 引き戻しスルー（通常時へ復帰）</span>
          <span class="btn-sub">32Gスルーで次区間通常時へ</span>
        </button>
      </div>
    </div>
  `;

  セットアップ_イベントリスナー(コンテナ, 最新G, 最新pt, 現在状態, イベント追加コールバック, イベント取り消しコールバック, セッション);
}

/**
 * 直近（過去40G以内）に成立した強レア役を検知するヘルパー
 */
function 直前強レア役検知(セッション, 現在G) {
  if (!セッション || !Array.isArray(セッション.イベントリスト)) return null;
  const イベント群 = セッション.イベントリスト;
  for (let i = イベント群.length - 1; i >= 0; i--) {
    const ev = イベント群[i];
    // CZやATを跨いでいたら通常時の前兆重複にはならない
    if (ev.種別 === イベント種別.CZ突入 || ev.種別 === イベント種別.AT開始) break;

    const evG = ev.通常ゲーム数 !== undefined ? Number(ev.通常ゲーム数) : null;
    if (evG !== null) {
      const g差 = Math.abs(現在G - evG);
      if (g差 <= 40) {
        if (ev.種別 === イベント種別.レア役成立) {
          const 役 = ev.詳細?.役 || "";
          if (役.includes("強チェリー") || 役.includes("チャンス目") || 役.includes("強レア役")) {
            return { 役, ゲーム数: evG, g差 };
          }
        }
      }
    }
  }
  return null;
}

function セットアップ_イベントリスナー(コンテナ, 初期G, 初期pt, 初期状態, onAddEvent, onUndoEvent, セッション) {
  let 現在G = 初期G;
  let 現在pt = 初期pt;
  let 現在ステート = 初期状態;

  const dispG = コンテナ.querySelector("#quick-disp-g");
  const dispPt = コンテナ.querySelector("#quick-disp-pt");

  function 画面更新() {
    if (dispG) dispG.textContent = `${現在G}G`;
    if (dispPt) dispPt.textContent = `${現在pt}pt`;
  }

  // ステッパー（加減算 G）
  コンテナ.querySelectorAll("[data-add-g]").forEach(btn => {
    btn.addEventListener("click", () => {
      振動フィードバック();
      const 加算 = parseInt(btn.getAttribute("data-add-g"), 10);
      現在G = Math.max(0, 現在G + 加算);
      // ゲーム数とポイントの自動連動は完全廃止
      画面更新();
    });
  });

  // ステッパー（加減算 pt）
  コンテナ.querySelectorAll("[data-add-pt]").forEach(btn => {
    btn.addEventListener("click", () => {
      振動フィードバック();
      const 加算 = parseInt(btn.getAttribute("data-add-pt"), 10);
      現在pt = Math.max(0, 現在pt + 加算);
      画面更新();
    });
  });

  // 0リセットボタン（確認画面を完全撤廃しワンタップで即時0リセット）
  コンテナ.querySelector("#btn-reset-gp")?.addEventListener("click", () => {
    振動フィードバック(40);
    現在G = 0;
    現在pt = 0;
    画面更新();
  });

  function リセットGP() {
    現在G = 0;
    現在pt = 0;
    画面更新();
  }

  // 直前取り消し (UNDO)
  コンテナ.querySelector("#btn-undo-event")?.addEventListener("click", () => {
    振動フィードバック(40);
    if (confirm("直前のイベント記録を取り消しますか？")) {
      if (onUndoEvent) onUndoEvent();
    }
  });

  // 直接指定ボタン
  コンテナ.querySelector("#btn-manual-set-gp")?.addEventListener("click", () => {
    振動フィードバック();
    const 入力G = prompt("現在の通常ゲーム数を入力してください:", 現在G);
    if (入力G !== null && !isNaN(parseInt(入力G, 10))) {
      現在G = parseInt(入力G, 10);
    }
    const 入力pt = prompt("現在のポイント数を入力してください:", 現在pt);
    if (入力pt !== null && !isNaN(parseInt(入力pt, 10))) {
      現在pt = parseInt(入力pt, 10);
    }
    画面更新();
  });

  // 状態タブ切り替え
  コンテナ.querySelectorAll(".state-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      振動フィードバック();
      const 選択状態 = btn.getAttribute("data-state");
      現在ステート = 選択状態;
      コンテナ.querySelectorAll(".state-tab-btn").forEach(b => {
        b.classList.remove("active");
        b.style.background = "var(--bg-card)";
        b.style.color = "#fff";
      });
      btn.classList.add("active");
      if (選択状態 === ジョウタイ.通常) btn.style.background = "var(--accent-red)";
      if (選択状態 === ジョウタイ.CZ中) btn.style.background = "var(--accent-blue)";
      if (選択状態 === ジョウタイ.AT中) {
        btn.style.background = "var(--accent-gold)";
        btn.style.color = "#000";
      }
      if (選択状態 === ジョウタイ.引き戻し確認中) btn.style.background = "var(--accent-purple)";

      コンテナ.querySelector("#quick-panel-tsujo").style.display = 選択状態 === ジョウタイ.通常 ? "block" : "none";
      コンテナ.querySelector("#quick-panel-cz").style.display = 選択状態 === ジョウタイ.CZ中 ? "block" : "none";
      コンテナ.querySelector("#quick-panel-at").style.display = 選択状態 === ジョウタイ.AT中 ? "block" : "none";
      コンテナ.querySelector("#quick-panel-hikimodoshi").style.display = 選択状態 === ジョウタイ.引き戻し確認中 ? "block" : "none";
    });
  });

  // レア役入力
  コンテナ.querySelector("#btn-input-rare")?.addEventListener("click", () => {
    振動フィードバック();
    モーダル表示_レア役(現在G, 現在pt, 現在ステート, onAddEvent);
  });

  // 赫眼リプ入力
  コンテナ.querySelector("#btn-input-kakugan")?.addEventListener("click", () => {
    振動フィードバック();
    モーダル表示_赫眼リプ(現在G, 現在pt, 現在ステート, onAddEvent);
  });

  // 精神世界突入
  コンテナ.querySelector("#btn-input-seishin")?.addEventListener("click", () => {
    振動フィードバック();
    モーダル表示_精神世界(現在G, 現在pt, 現在ステート, onAddEvent);
  });

  // 前兆・東京上空（ちょんぼりすた解析完全準拠・レア役重複機微対応）
  コンテナ.querySelector("#btn-input-zencho")?.addEventListener("click", () => {
    振動フィードバック();
    モーダル表示_前兆_ちょんぼり(現在G, 現在pt, 現在ステート, onAddEvent, セッション);
  });

  // ポイント加算
  コンテナ.querySelector("#btn-input-pt-add")?.addEventListener("click", () => {
    振動フィードバック();
    モーダル表示_ポイント加算(現在G, 現在pt, 現在ステート, (g, pt, 加算pt, ゾーン) => {
      現在pt = pt;
      画面更新();
    }, onAddEvent);
  });

  // CZ突入（記録後にG数・ptを自動リセット）
  コンテナ.querySelector("#btn-input-cz-entry")?.addEventListener("click", () => {
    振動フィードバック();
    モーダル表示_CZ突入(現在G, 現在pt, (ev) => {
      onAddEvent(ev);
      リセットGP();
    });
  });

  // AT直撃 / エピボ / 天井（記録後にG数・ptを自動リセット）
  コンテナ.querySelector("#btn-input-at-chokugeki")?.addEventListener("click", () => {
    振動フィードバック();
    モーダル表示_AT直撃(現在G, 現在pt, (ev) => {
      onAddEvent(ev);
      リセットGP();
    });
  });

  // 規定G数ゾーン前兆記録（添付画像準拠）
  コンテナ.querySelector("#btn-input-zone")?.addEventListener("click", () => {
    振動フィードバック();
    モーダル表示_ゾーン前兆_新(現在G, 現在pt, onAddEvent, リセットGP);
  });

  // 有馬ジャッジメント（AT中）
  コンテナ.querySelector("#btn-at-arima")?.addEventListener("click", () => {
    振動フィードバック();
    モーダル表示_有馬ジャッジメント(現在G, 現在pt, onAddEvent);
  });

  // 通常転落アイキャッチ（引き戻し確認中）
  コンテナ.querySelector("#btn-hikimodoshi-eyecatch")?.addEventListener("click", () => {
    振動フィードバック();
    モーダル表示_転落アイキャッチ(現在G, 現在pt, onAddEvent);
  });

  // 演出・示唆（ちょんぼりすた解析完全網羅モーダル）
  コンテナ.querySelector("#btn-input-shisa")?.addEventListener("click", () => {
    振動フィードバック();
    モーダル表示_示唆演出_リッチ(現在G, 現在pt, onAddEvent, onUndoEvent, "tab-shisa-letter");
  });

  // AT中 エンディングカード入力
  コンテナ.querySelector("#btn-at-ed-card")?.addEventListener("click", () => {
    振動フィードバック();
    モーダル表示_示唆演出_リッチ(現在G, 現在pt, onAddEvent, onUndoEvent, "tab-shisa-ed");
  });

  // CZ成功（CZ結果は現在G数、AT開始は0Gリセットで記録）
  コンテナ.querySelector("#btn-cz-success")?.addEventListener("click", () => {
    振動フィードバック(50);
    const 直近CZ = [...(セッション?.イベントリスト || [])].reverse().find(e => e.種別 === イベント種別.CZ突入);
    const cz種別 = 直近CZ?.詳細?.CZ種別 || CZ種別.レミニセンス;
    const 対象CZID = 直近CZ?.イベントID;

    // CZ結果イベントは現在のゲーム数で記録
    onAddEvent(シンキ_イベント作成({
      通常ゲーム数: 現在G,
      ポイント数: 現在pt,
      状態: ジョウタイ.CZ中,
      種別: イベント種別.CZ結果,
      タイトル: `CZ【${cz種別}】成功！ → AT突入へ`,
      詳細: { 結果: "成功", CZ種別: cz種別, 対象CZイベントID: 対象CZID }
    }));

    // AT開始イベントは必ず【0G / 0pt】で記録（データ機仕様）
    onAddEvent(シンキ_イベント作成({
      通常ゲーム数: 0,
      ポイント数: 0,
      状態: ジョウタイ.AT中,
      種別: イベント種別.AT開始,
      タイトル: `AT開始 (${cz種別}突破)`,
      詳細: { 契機: トウセン_ケイキ.CZ突破, CZ種別: cz種別, 突破CZ種別: cz種別 }
    }));

    // 画面のG数・ptも0にリセット
    リセットGP();
  });

  // CZ失敗
  コンテナ.querySelector("#btn-cz-fail")?.addEventListener("click", () => {
    振動フィードバック();
    モーダル表示_CZ失敗カード(現在G, 現在pt, onAddEvent);
  });

  // AT BITES
  コンテナ.querySelector("#btn-at-bites")?.addEventListener("click", () => {
    振動フィードバック();
    const 特化 = prompt("特化ゾーン種別を入力してください（例: BITES, 極BITES）:", "BITES");
    if (特化) {
      onAddEvent(シンキ_イベント作成({
        通常ゲーム数: 現在G,
        ポイント数: 現在pt,
        状態: ジョウタイ.AT中,
        種別: イベント種別.AT中イベント,
        タイトル: `特化ゾーン: ${特化}`,
        詳細: { 特化種別: 特化 }
      }));
    }
  });

  // AT バトル/上乗せ
  コンテナ.querySelector("#btn-at-battle")?.addEventListener("click", () => {
    振動フィードバック();
    const 上乗せ = prompt("上乗せ内容を入力してください（例: +50G, バトル勝利）:", "+50G");
    if (上乗せ) {
      onAddEvent(シンキ_イベント作成({
        通常ゲーム数: 現在G,
        ポイント数: 現在pt,
        状態: ジョウタイ.AT中,
        種別: イベント種別.AT中イベント,
        タイトル: `上乗せ: ${上乗せ}`,
        詳細: { 内容: 上乗せ }
      }));
    }
  });

  // AT終了（記録後にゲーム数を0リセットして引き戻しへ）
  コンテナ.querySelector("#btn-at-end")?.addEventListener("click", () => {
    振動フィードバック();
    モーダル表示_AT終了(現在G, 現在pt, (ev) => {
      onAddEvent(ev);
      リセットGP();
    });
  });

  // 引き戻し成功（判定は現在G数、AT開始は0Gリセットで記録）
  コンテナ.querySelector("#btn-hikimodoshi-success")?.addEventListener("click", () => {
    振動フィードバック(50);
    onAddEvent(シンキ_イベント作成({
      通常ゲーム数: 現在G,
      ポイント数: 現在pt,
      状態: ジョウタイ.引き戻し確認中,
      種別: イベント種別.引き戻し判定,
      タイトル: "引き戻し成功！",
      詳細: { 結果: ヒキモドシ_ケッカ.成功 }
    }));

    // AT開始イベントは必ず【0G / 0pt】で記録（データ機仕様）
    onAddEvent(シンキ_イベント作成({
      通常ゲーム数: 0,
      ポイント数: 0,
      状態: ジョウタイ.AT中,
      種別: イベント種別.AT開始,
      タイトル: "AT開始 (引き戻し当選)",
      詳細: { 契機: トウセン_ケイキ.引き戻し }
    }));

    リセットGP();
  });

  // 引き戻し失敗（次区間の通常時へ復帰）
  コンテナ.querySelector("#btn-hikimodoshi-fail")?.addEventListener("click", () => {
    振動フィードバック();
    onAddEvent(シンキ_イベント作成({
      通常ゲーム数: 現在G,
      ポイント数: 現在pt,
      状態: ジョウタイ.通常,
      種別: イベント種別.引き戻し判定,
      タイトル: "引き戻しスルー（通常時へ復帰）",
      詳細: { 結果: ヒキモドシ_ケッカ.失敗 }
    }));
    リセットGP();
  });
}

function モーダル表示_レア役(g, pt, state, onAdd) {
  const options = ["弱チェリー", "強チェリー", "スイカ", "チャンス目"];
  const html = `
    <div class="modal-header">
      <div class="modal-title">🍒 レア役成立入力</div>
      <button class="btn-close" id="modal-close">&times;</button>
    </div>
    <div class="option-grid" style="margin-bottom:14px;">
      ${options.map(opt => `<button class="option-btn rare-opt" data-opt="${opt}">${opt}</button>`).join("")}
    </div>
  `;
  開くモーダル(html, (modalEl) => {
    modalEl.querySelectorAll(".rare-opt").forEach(btn => {
      btn.addEventListener("click", () => {
        振動フィードバック();
        const 役 = btn.getAttribute("data-opt");
        if (state === ジョウタイ.精神世界) {
          const 当選 = confirm(`精神世界中の【${役}】です。この役でCZに当選しましたか？\n[OK]=当選  [キャンセル]=非当選`);
          onAdd(シンキ_イベント作成({
            通常ゲーム数: g,
            ポイント数: pt,
            状態: state,
            種別: イベント種別.精神世界中役,
            タイトル: `精神世界中: ${役} → ${当選 ? 'CZ当選！' : '非当選'}`,
            詳細: { 役, CZ当選: 当選 }
          }));
        } else {
          onAdd(シンキ_イベント作成({
            通常ゲーム数: g,
            ポイント数: pt,
            状態: state,
            種別: イベント種別.レア役成立,
            タイトル: `レア役成立: ${役}`,
            詳細: { 役 }
          }));
        }
        閉じるモーダル();
      });
    });
  });
}

function モーダル表示_赫眼リプ(g, pt, state, onAdd) {
  const options = [10, 20, 30, 50];
  const html = `
    <div class="modal-header">
      <div class="modal-title">👁️ 赫眼リプレイ成立</div>
      <button class="btn-close" id="modal-close">&times;</button>
    </div>
    <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:10px;">赫眼状態の継続ゲーム数を選択してください:</p>
    <div class="option-grid">
      ${options.map(o => `<button class="option-btn kakugan-opt" data-g="${o}">${o}G 継続</button>`).join("")}
    </div>
  `;
  開くモーダル(html, (modalEl) => {
    modalEl.querySelectorAll(".kakugan-opt").forEach(btn => {
      btn.addEventListener("click", () => {
        振動フィードバック();
        const 継続G = parseInt(btn.getAttribute("data-g"), 10);
        onAdd(シンキ_イベント作成({
          通常ゲーム数: g,
          ポイント数: pt,
          状態: state,
          種別: イベント種別.赫眼リプ成立,
          タイトル: `赫眼リプ成立 (${継続G}G継続)`,
          詳細: { 継続ゲーム数: 継続G }
        }));
        閉じるモーダル();
      });
    });
  });
}

function モーダル表示_精神世界(g, pt, state, onAdd) {
  const options = [10, 20, 30];
  const html = `
    <div class="modal-header">
      <div class="modal-title">🌌 精神世界ステージ突入</div>
      <button class="btn-close" id="modal-close">&times;</button>
    </div>
    <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:10px;">告知された継続ゲーム数を選択（※設定差大・特に30Gは設定6期待度大幅UP）:</p>
    <div class="option-grid">
      ${options.map(o => `<button class="option-btn seishin-opt" data-g="${o}" style="${o === 30 ? 'border-color:var(--accent-red);font-weight:900;' : ''}">${o}G 告知 ${o === 30 ? '🔥' : ''}</button>`).join("")}
    </div>
  `;
  開くモーダル(html, (modalEl) => {
    modalEl.querySelectorAll(".seishin-opt").forEach(btn => {
      btn.addEventListener("click", () => {
        振動フィードバック();
        const 告知G = parseInt(btn.getAttribute("data-g"), 10);
        onAdd(シンキ_イベント作成({
          通常ゲーム数: g,
          ポイント数: pt,
          状態: ジョウタイ.通常,
          種別: イベント種別.精神世界突入,
          タイトル: `精神世界突入 (${告知G}G告知)`,
          詳細: { 告知ゲーム数: 告知G, 精神世界フラグ: true }
        }));
        閉じるモーダル();
      });
    });
  });
}

function モーダル表示_前兆_ちょんぼり(g, pt, state, onAdd, セッション) {
  const 直前レア = 直前強レア役検知(セッション, g);
  let 選択ゾーン = "150G";
  let 前兆あり = true;
  let 東京上空あり = true;
  let レア役重複あり = !!直前レア;
  let 選択オーラ = "yellow";
  let 選択シャッター = "default";
  let 選択チャンスアップ = "none";

  const zonePresets = [
    { label: "50G", desc: "チャンス以上" },
    { label: "100G", desc: "天国準備濃厚" },
    { label: "150G", desc: "通常B以上/本前兆" },
    { label: "200G", desc: "なしで天国準備" },
    { label: "250G", desc: "通常C以上/本前兆" },
    { label: "300G", desc: "チャンス濃厚" },
    { label: "400G", desc: "通常A優遇" },
    { label: "500G", desc: "通常B優遇" },
    { label: "100pt", desc: "規定pt" },
    { label: "200pt", desc: "規定pt" },
    { label: "300pt", desc: "規定pt" },
    { label: "400pt", desc: "規定pt" }
  ];

  function 示唆プレビュー生成() {
    let 示唆文 = "";
    let バッジ色 = "var(--accent-blue)";

    if (レア役重複あり) {
      示唆文 = "⚠️【参考扱い】直前の強レア役（強チェリー等）と前兆が重なっている疑いがあるため、ゾーン前兆や東京上空によるモード断定は保留（参考扱い）となります。";
      バッジ色 = "#ff9f43";
    } else if (選択ゾーン === "50G") {
      if (前兆あり) {
        if (東京上空あり) {
          示唆文 = "🔥【激アツ】CZ以上の大チャンス ＋ チャンスモード以上濃厚！";
          バッジ色 = "var(--accent-red)";
        } else {
          示唆文 = "✨【注目】チャンスモード以上濃厚（チャンス/天国準備/天国）";
          バッジ色 = "#ff9f43";
        }
      } else {
        示唆文 = "通常挙動（通常A・B等の基本パターン）";
        バッジ色 = "var(--text-muted)";
      }
    } else if (選択ゾーン === "100G") {
      if (!東京上空あり) {
        示唆文 = "👑【天国準備濃厚！】100Gで東京上空非移行なら天国準備モード濃厚！";
        バッジ色 = "var(--accent-gold)";
      } else {
        示唆文 = "フェイク前兆またはCZ抽選（通常A/Bでも前兆発生しやすいゾーン）";
        バッジ色 = "var(--text-muted)";
      }
    } else if (選択ゾーン === "150G") {
      if (前兆あり) {
        if (東京上空あり) {
          示唆文 = "🌈【本前兆濃厚！】150Gで東京上空移行はCZ以上当選濃厚！";
          バッジ色 = "#ff4757";
        } else {
          示唆文 = "✨【注目】通常B以上濃厚（通常B/通常C/チャンス/天国準備）";
          バッジ色 = "#ff9f43";
        }
      } else {
        示唆文 = "前兆なし（通常Aの可能性高め）";
        バッジ色 = "var(--text-muted)";
      }
    } else if (選択ゾーン === "200G") {
      if (!前兆あり) {
        示唆文 = "👑【天国準備濃厚！】200Gで前兆非発生なら天国準備濃厚（天井300G）！";
        バッジ色 = "var(--accent-gold)";
      } else if (!東京上空あり) {
        示唆文 = "✨【注目】通常B以上期待度大幅アップ（東京上空非移行）";
        バッジ色 = "#ff9f43";
      } else {
        示唆文 = "通常A優遇ゾーンの前兆発生";
        バッジ色 = "var(--text-muted)";
      }
    } else if (選択ゾーン === "250G") {
      if (前兆あり) {
        if (東京上空あり) {
          示唆文 = "🌈【本前兆濃厚！】250Gで東京上空移行はCZ以上当選濃厚！";
          バッジ色 = "#ff4757";
        } else {
          示唆文 = "✨【注目】通常C以上濃厚（通常C/チャンス/天国準備）";
          バッジ色 = "#ff9f43";
        }
      } else {
        示唆文 = "前兆なし";
        バッジ色 = "var(--text-muted)";
      }
    } else if (選択ゾーン === "300G") {
      if (!東京上空あり) {
        示唆文 = "👑【チャンスモード濃厚！】300Gで東京上空非移行はチャンス濃厚！";
        バッジ色 = "var(--accent-gold)";
      } else {
        示唆文 = "通常B優遇ゾーンの前兆発生";
        バッジ色 = "var(--text-muted)";
      }
    } else {
      示唆文 = `${選択ゾーン}前兆挙動`;
      バッジ色 = "var(--text-muted)";
    }

    let 演出文 = [];
    if (選択オーラ === "red") 演出文.push("赤オーラ(期待度約95%・ハズレ時は次回高モード期待)");
    if (選択オーラ === "white" || 選択オーラ === "rainbow") 演出文.push("白/虹オーラ(本前兆濃厚)");
    if (選択シャッター === "red") 演出文.push("赤シャッター(大チャンス)");
    if (選択シャッター === "gold") 演出文.push("金シャッター(AT直撃/本前兆濃厚)");
    if (選択チャンスアップ === "deka_push") 演出文.push("デカPUSH");
    if (選択チャンスアップ === "rize_voice") 演出文.push("赤PUSH/利世ボイス(大喰いの利世濃厚)");

    return { 示唆文, 演出文: 演出文.join(" / "), バッジ色 };
  }

  const html = `
    <div class="modal-header">
      <div class="modal-title">🗼 前兆・東京上空情報 (ちょんぼりすた準拠)</div>
      <button class="btn-close" id="modal-close">&times;</button>
    </div>

    <!-- 直前レア役検知アラート -->
    ${直前レア ? `
      <div style="background:rgba(255, 159, 67, 0.15);border:1px solid #ff9f43;border-radius:6px;padding:6px 10px;margin-bottom:10px;font-size:0.75rem;color:#ffb86c;line-height:1.4;">
        ⚠️ 直近（${直前レア.ゲーム数}G: <strong>${直前レア.役}</strong>）が成立しています。前兆や東京上空移行がレア役契機と重なっている可能性があります。
      </div>
    ` : ''}

    <!-- ちょんぼりすた解析リアルタイム示唆バッジ -->
    <div id="zencho-preview-card" style="background:rgba(255,255,255,0.06);border:1px solid var(--accent-red);border-radius:6px;padding:8px 10px;margin-bottom:12px;">
      <div style="font-size:0.75rem;font-weight:bold;color:var(--text-muted);margin-bottom:2px;">ちょんぼりすた示唆判定:</div>
      <div id="zencho-preview-text" style="font-size:0.85rem;font-weight:bold;color:#ff6b81;"></div>
      <div id="zencho-enshutsu-text" style="font-size:0.75rem;color:var(--accent-gold);margin-top:2px;"></div>
    </div>

    <!-- 1. 対象ゾーン選択 -->
    <div style="font-size:0.8rem;font-weight:bold;margin-bottom:6px;color:var(--text-muted);">① ゾーン選択（ゲーム数・ポイント）:</div>
    <div class="option-grid" style="grid-template-columns:repeat(3, 1fr);gap:4px;margin-bottom:10px;">
      ${zonePresets.map(z => `
        <button class="option-btn zencho-zone-btn ${z.label === 選択ゾーン ? 'selected' : ''}" data-zone="${z.label}" style="padding:6px 2px;font-size:0.8rem;display:flex;flex-direction:column;align-items:center;">
          <span style="font-weight:bold;">${z.label}</span>
          <span style="font-size:0.65rem;color:var(--text-muted);">${z.desc}</span>
        </button>
      `).join("")}
    </div>

    <!-- 2. 前兆発生 ＆ 東京上空移行 -->
    <div style="font-size:0.8rem;font-weight:bold;margin-bottom:6px;color:var(--text-muted);">② 前兆挙動（重要示唆法則）:</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
      <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:6px;padding:8px;text-align:center;">
        <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px;">前兆発生</div>
        <div style="display:flex;gap:4px;">
          <button id="btn-zencho-hassei-yes" style="flex:1;padding:6px;border-radius:4px;border:1px solid var(--accent-red);background:var(--accent-red);color:#fff;font-weight:bold;font-size:0.8rem;cursor:pointer;">あり</button>
          <button id="btn-zencho-hassei-no" style="flex:1;padding:6px;border-radius:4px;border:1px solid var(--border-color);background:transparent;color:#fff;font-size:0.8rem;cursor:pointer;">なし</button>
        </div>
      </div>
      <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:6px;padding:8px;text-align:center;">
        <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px;">東京上空移行</div>
        <div style="display:flex;gap:4px;">
          <button id="btn-tokyo-joko-yes" style="flex:1;padding:6px;border-radius:4px;border:1px solid var(--accent-blue);background:var(--accent-blue);color:#fff;font-weight:bold;font-size:0.8rem;cursor:pointer;">あり</button>
          <button id="btn-tokyo-joko-no" style="flex:1;padding:6px;border-radius:4px;border:1px solid var(--border-color);background:transparent;color:#fff;font-size:0.8rem;cursor:pointer;">なし</button>
        </div>
      </div>
    </div>

    <!-- 3. 直前レア役重複・影響スイッチ（機微対応） -->
    <div style="font-size:0.8rem;font-weight:bold;margin-bottom:6px;color:var(--text-muted);">③ 直前の強レア役（強チェリー等）の影響:</div>
    <div style="display:flex;gap:6px;margin-bottom:12px;">
      <button id="btn-rare-overlap-no" style="flex:1;padding:6px;border-radius:4px;border:1px solid ${!レア役重複あり ? 'var(--accent-blue)' : 'var(--border-color)'};background:${!レア役重複あり ? 'var(--accent-blue)' : 'transparent'};color:#fff;font-size:0.75rem;cursor:pointer;font-weight:${!レア役重複あり ? 'bold' : 'normal'};">なし（単独ゾーン）</button>
      <button id="btn-rare-overlap-yes" style="flex:1;padding:6px;border-radius:4px;border:1px solid ${レア役重複あり ? '#ff9f43' : 'var(--border-color)'};background:${レア役重複あり ? '#ff9f43' : 'transparent'};color:${レア役重複あり ? '#000' : '#fff'};font-size:0.75rem;cursor:pointer;font-weight:${レア役重複あり ? 'bold' : 'normal'};">あり（重複の疑い・参考扱い）</button>
    </div>

    <!-- 4. 東京上空ステージ演出（任意入力・チャンスアップ） -->
    <div style="font-size:0.8rem;font-weight:bold;margin-bottom:6px;color:var(--text-muted);">④ 東京上空中の演出（任意入力）:</div>
    <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:6px;padding:8px 10px;margin-bottom:14px;">
      <div style="margin-bottom:8px;">
        <label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:2px;">オーラ色（期待度・次回示唆）:</label>
        <select id="select-zencho-aura" style="width:100%;padding:6px;border-radius:4px;background:#1e2128;border:1px solid var(--border-color);color:#fff;font-size:0.8rem;">
          <option value="yellow">黄色（デフォルト）</option>
          <option value="blue">青色（期待度 約50%）</option>
          <option value="green">緑色（期待度 約70%・チャンス）</option>
          <option value="red">赤色（期待度 約95%！ハズレ時次回高モード期待）</option>
          <option value="white">白色（本前兆濃厚！）</option>
          <option value="rainbow">虹色（本前兆＋AT濃厚・プレミアム）</option>
        </select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
        <div>
          <label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:2px;">シャッター演出:</label>
          <select id="select-zencho-shutter" style="width:100%;padding:6px;border-radius:4px;background:#1e2128;border:1px solid var(--border-color);color:#fff;font-size:0.8rem;">
            <option value="default">通常（黒）</option>
            <option value="red">赤シャッター（大チャンス）</option>
            <option value="gold">金シャッター（AT濃厚）</option>
          </select>
        </div>
        <div>
          <label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:2px;">PUSH・ボタン:</label>
          <select id="select-zencho-cu" style="width:100%;padding:6px;border-radius:4px;background:#1e2128;border:1px solid var(--border-color);color:#fff;font-size:0.8rem;">
            <option value="none">通常ボタン</option>
            <option value="deka_push">デカPUSH（激アツ）</option>
            <option value="rize_voice">赤PUSH / 利世ボイス（利世濃厚）</option>
          </select>
        </div>
      </div>
    </div>

    <button class="btn-block" id="btn-submit-zencho-joho" style="background:var(--accent-red);padding:12px;font-weight:bold;">この内容で前兆を記録</button>
  `;

  開くモーダル(html, (modalEl) => {
    const previewText = modalEl.querySelector("#zencho-preview-text");
    const enshutsuText = modalEl.querySelector("#zencho-enshutsu-text");
    const previewCard = modalEl.querySelector("#zencho-preview-card");

    function 更新プレビュー() {
      const { 示唆文, 演出文, バッジ色 } = 示唆プレビュー生成();
      if (previewText) previewText.textContent = 示唆文;
      if (enshutsuText) enshutsuText.textContent = 演出文 ? `演出: ${演出文}` : "";
      if (previewCard) previewCard.style.borderColor = バッジ色;
    }
    更新プレビュー();

    // ゾーンボタンクリック
    modalEl.querySelectorAll(".zencho-zone-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        振動フィードバック();
        modalEl.querySelectorAll(".zencho-zone-btn").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        選択ゾーン = btn.getAttribute("data-zone");
        更新プレビュー();
      });
    });

    // 前兆あり/なし
    const btnHasYes = modalEl.querySelector("#btn-zencho-hassei-yes");
    const btnHasNo = modalEl.querySelector("#btn-zencho-hassei-no");
    btnHasYes?.addEventListener("click", () => {
      振動フィードバック();
      前兆あり = true;
      btnHasYes.style.background = "var(--accent-red)";
      btnHasYes.style.borderColor = "var(--accent-red)";
      btnHasYes.style.fontWeight = "bold";
      btnHasNo.style.background = "transparent";
      btnHasNo.style.borderColor = "var(--border-color)";
      btnHasNo.style.fontWeight = "normal";
      更新プレビュー();
    });
    btnHasNo?.addEventListener("click", () => {
      振動フィードバック();
      前兆あり = false;
      btnHasNo.style.background = "var(--accent-red)";
      btnHasNo.style.borderColor = "var(--accent-red)";
      btnHasNo.style.fontWeight = "bold";
      btnHasYes.style.background = "transparent";
      btnHasYes.style.borderColor = "var(--border-color)";
      btnHasYes.style.fontWeight = "normal";
      更新プレビュー();
    });

    // 東京上空あり/なし
    const btnTkjYes = modalEl.querySelector("#btn-tokyo-joko-yes");
    const btnTkjNo = modalEl.querySelector("#btn-tokyo-joko-no");
    btnTkjYes?.addEventListener("click", () => {
      振動フィードバック();
      東京上空あり = true;
      btnTkjYes.style.background = "var(--accent-blue)";
      btnTkjYes.style.borderColor = "var(--accent-blue)";
      btnTkjYes.style.fontWeight = "bold";
      btnTkjNo.style.background = "transparent";
      btnTkjNo.style.borderColor = "var(--border-color)";
      btnTkjNo.style.fontWeight = "normal";
      更新プレビュー();
    });
    btnTkjNo?.addEventListener("click", () => {
      振動フィードバック();
      東京上空あり = false;
      btnTkjNo.style.background = "var(--accent-blue)";
      btnTkjNo.style.borderColor = "var(--accent-blue)";
      btnTkjNo.style.fontWeight = "bold";
      btnTkjYes.style.background = "transparent";
      btnTkjYes.style.borderColor = "var(--border-color)";
      btnTkjYes.style.fontWeight = "normal";
      更新プレビュー();
    });

    // レア役重複あり/なし
    const btnRareNo = modalEl.querySelector("#btn-rare-overlap-no");
    const btnRareYes = modalEl.querySelector("#btn-rare-overlap-yes");
    btnRareNo?.addEventListener("click", () => {
      振動フィードバック();
      レア役重複あり = false;
      btnRareNo.style.background = "var(--accent-blue)";
      btnRareNo.style.borderColor = "var(--accent-blue)";
      btnRareNo.style.color = "#fff";
      btnRareNo.style.fontWeight = "bold";
      btnRareYes.style.background = "transparent";
      btnRareYes.style.borderColor = "var(--border-color)";
      btnRareYes.style.color = "#fff";
      btnRareYes.style.fontWeight = "normal";
      更新プレビュー();
    });
    btnRareYes?.addEventListener("click", () => {
      振動フィードバック();
      レア役重複あり = true;
      btnRareYes.style.background = "#ff9f43";
      btnRareYes.style.borderColor = "#ff9f43";
      btnRareYes.style.color = "#000";
      btnRareYes.style.fontWeight = "bold";
      btnRareNo.style.background = "transparent";
      btnRareNo.style.borderColor = "var(--border-color)";
      btnRareNo.style.color = "#fff";
      btnRareNo.style.fontWeight = "normal";
      更新プレビュー();
    });

    // セレクト変更リスナー
    modalEl.querySelector("#select-zencho-aura")?.addEventListener("change", (e) => {
      選択オーラ = e.target.value;
      更新プレビュー();
    });
    modalEl.querySelector("#select-zencho-shutter")?.addEventListener("change", (e) => {
      選択シャッター = e.target.value;
      更新プレビュー();
    });
    modalEl.querySelector("#select-zencho-cu")?.addEventListener("change", (e) => {
      選択チャンスアップ = e.target.value;
      更新プレビュー();
    });

    // 送信
    modalEl.querySelector("#btn-submit-zencho-joho")?.addEventListener("click", () => {
      振動フィードバック(40);
      const { 示唆文, 演出文 } = 示唆プレビュー生成();

      onAdd(シンキ_イベント作成({
        通常ゲーム数: g,
        ポイント数: pt,
        状態: state,
        種別: イベント種別.前兆情報,
        タイトル: `前兆: ${選択ゾーン} [前兆:${前兆あり ? 'あり' : 'なし'} / 東京上空:${東京上空あり ? 'あり' : 'なし'}${レア役重複あり ? ' / レア役重複疑い' : ''}]`,
        詳細: {
          ゾーン: 選択ゾーン,
          前兆発生: 前兆あり ? "あり" : "なし",
          東京上空: 東京上空あり ? "あり" : "なし",
          レア役重複: レア役重複あり,
          オーラ色: 選択オーラ,
          シャッター: 選択シャッター,
          チャンスアップ: 選択チャンスアップ,
          示唆内容: 示唆文,
          演出内容: 演出文
        }
      }));
      閉じるモーダル();
    });
  });
}

function モーダル表示_前兆(g, pt, state, onAdd) {
  モーダル表示_前兆_ちょんぼり(g, pt, state, onAdd);
}

function モーダル表示_ポイント加算(g, pt, state, onUpdatePt, onAdd) {
  const html = `
    <div class="modal-header">
      <div class="modal-title">➕ ポイント加算・ゾーン前兆記録</div>
      <button class="btn-close" id="modal-close">&times;</button>
    </div>
    <div class="form-group">
      <label class="form-label">加算量 (pt)</label>
      <input type="number" class="form-control" id="input-kasan-val" value="100" step="10">
    </div>
    <div class="form-group">
      <label class="form-label">契機</label>
      <select class="form-control" id="select-kasan-keiki">
        <option value="スイカ">スイカ加算</option>
        <option value="喰種ポイント">喰種ポイント到達</option>
        <option value="その他">その他レア役</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">前兆が発生した本来の対象ゾーン（跨いだゾーン）</label>
      <select class="form-control" id="select-kasan-zone">
        <option value="">なし</option>
        <option value="100pt">100ptゾーン</option>
        <option value="200pt">200ptゾーン</option>
        <option value="300pt" selected>300ptゾーン</option>
        <option value="400pt">400ptゾーン</option>
        <option value="500pt">500ptゾーン</option>
        <option value="600pt">600ptゾーン</option>
      </select>
    </div>
    <button class="btn-block" id="btn-submit-kasan">加算して記録</button>
  `;
  開くモーダル(html, (modalEl) => {
    modalEl.querySelector("#btn-submit-kasan")?.addEventListener("click", () => {
      振動フィードバック();
      const 加算量 = parseInt(modalEl.querySelector("#input-kasan-val").value, 10) || 0;
      const 契機 = modalEl.querySelector("#select-kasan-keiki").value;
      const ゾーン = modalEl.querySelector("#select-kasan-zone").value;
      const 新pt = pt + 加算量;

      onAdd(シンキ_イベント作成({
        通常ゲーム数: g,
        ポイント数: 新pt,
        状態: state,
        種別: イベント種別.ポイント加算,
        タイトル: `pt加算 (+${加算量}pt) → ${新pt}pt ${ゾーン ? `[${ゾーン}前兆]` : ''}`,
        詳細: {
          加算量,
          加算前pt: pt,
          加算後pt: 新pt,
          契機,
          前兆該当ゾーン: ゾーン
        }
      }));
      onUpdatePt(g, 新pt, 加算量, ゾーン);
      閉じるモーダル();
    });
  });
}

function モーダル表示_CZ突入(g, pt, onAdd) {
  const ゾーン一覧 = ["50G", "100G", "150G", "200G", "250G", "300G", "400G", "500G", "600G"];
  let 推定ゾーン = "100G";
  if (g <= 75) 推定ゾーン = "50G";
  else if (g <= 125) 推定ゾーン = "100G";
  else if (g <= 175) 推定ゾーン = "150G";
  else if (g <= 225) 推定ゾーン = "200G";
  else if (g <= 275) 推定ゾーン = "250G";
  else if (g <= 350) 推定ゾーン = "300G";
  else if (g <= 450) 推定ゾーン = "400G";
  else if (g <= 550) 推定ゾーン = "500G";
  else 推定ゾーン = "600G";

  let 選択ゾーン = 推定ゾーン;
  let 選択契機 = "規定ゾーン";
  let 選択種別 = CZ種別.レミニセンス;

  const html = `
    <div class="modal-header">
      <div class="modal-title">⚔️ CZ突入入力</div>
      <button class="btn-close" id="modal-close">&times;</button>
    </div>

    <div class="form-group" style="margin-bottom:12px;">
      <label class="form-label">CZ種類</label>
      <div class="option-grid">
        <button class="option-btn selected" id="opt-cz-remi" style="padding:12px 6px;">レミニセンス (基本)</button>
        <button class="option-btn" id="opt-cz-rize" style="padding:12px 6px;border-color:var(--accent-red);font-weight:bold;">大喰いの利世 (特大設定差)</button>
      </div>
    </div>

    <div class="form-group" style="margin-bottom:12px;">
      <label class="form-label">当選契機</label>
      <div class="option-grid" id="keiki-select-grid" style="grid-template-columns:repeat(2, 1fr);gap:6px;">
        <button class="option-btn keiki-btn selected" data-keiki="規定ゾーン" style="grid-column:span 2;padding:12px;font-weight:bold;background:rgba(255, 159, 67, 0.2);border-color:#ff9f43;">
          🎯 規定ポイント・規定G数ゾーン
        </button>
        <button class="option-btn keiki-btn" data-keiki="スイカ" style="padding:10px;border-color:#2ed573;">🍉 スイカ抽選</button>
        <button class="option-btn keiki-btn" data-keiki="チャンス目" style="padding:10px;border-color:#eccc68;">💡 チャンス目抽選</button>
        <button class="option-btn keiki-btn" data-keiki="強チェリー" style="padding:10px;border-color:#ff4757;">🍒 強チェリー抽選</button>
        <button class="option-btn keiki-btn" data-keiki="弱チェリー" style="padding:10px;">🌸 弱チェリー抽選</button>
        <button class="option-btn keiki-btn" data-keiki="精神世界" style="padding:10px;border-color:var(--accent-purple);">🌌 精神世界中</button>
        <button class="option-btn keiki-btn" data-keiki="天井契機" style="padding:10px;border-color:var(--accent-gold);">🚨 CZ天井 (600G+α)</button>
        <button class="option-btn keiki-btn" data-keiki="不明" style="grid-column:span 2;padding:8px;">❓ 不明 / その他</button>
      </div>
    </div>

    <div id="cz-zone-container" style="background:rgba(255,255,255,0.03);padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);margin-bottom:14px;">
      <label class="form-label" style="color:var(--accent-gold);margin-bottom:6px;">
        📍 当選ゾーン選択（現在の通常G数: ${g}Gから自動推奨）
      </label>
      <div class="option-grid" id="cz-zone-grid" style="grid-template-columns:repeat(3, 1fr);gap:6px;">
        ${ゾーン一覧.map(z => `
          <button class="option-btn cz-zone-opt ${z === 選択ゾーン ? 'selected' : ''}" data-zone="${z}" style="padding:10px 4px;font-size:0.9rem;font-weight:bold;">
            ${z}
          </button>
        `).join("")}
      </div>
      <div id="cz-zone-desc" style="margin-top:6px;font-size:0.75rem;color:var(--text-muted);">
        ${モード_規定ゲーム数_マトリクス[選択ゾーン]?.解説 || ""}
      </div>
    </div>

    <button class="btn-block" id="btn-submit-cz-entry" style="padding:16px;font-size:1.05rem;background:var(--accent-blue);">
      ⚔️ CZ突入を記録 (G数0リセット)
    </button>
  `;

  開くモーダル(html, (modalEl) => {
    const btnRemi = modalEl.querySelector("#opt-cz-remi");
    const btnRize = modalEl.querySelector("#opt-cz-rize");
    const zoneContainer = modalEl.querySelector("#cz-zone-container");
    const zoneDesc = modalEl.querySelector("#cz-zone-desc");

    btnRemi.addEventListener("click", () => {
      振動フィードバック();
      選択種別 = CZ種別.レミニセンス;
      btnRemi.classList.add("selected");
      btnRize.classList.remove("selected");
    });
    btnRize.addEventListener("click", () => {
      振動フィードバック();
      選択種別 = CZ種別.大喰いの利世;
      btnRize.classList.add("selected");
      btnRemi.classList.remove("selected");
    });

    modalEl.querySelectorAll(".keiki-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        振動フィードバック();
        modalEl.querySelectorAll(".keiki-btn").forEach(b => {
          b.classList.remove("selected");
          b.style.background = "";
        });
        btn.classList.add("selected");
        選択契機 = btn.getAttribute("data-keiki");

        if (選択契機 === "規定ゾーン") {
          btn.style.background = "rgba(255, 159, 67, 0.2)";
          zoneContainer.style.display = "block";
        } else {
          zoneContainer.style.display = "none";
        }
      });
    });

    modalEl.querySelectorAll(".cz-zone-opt").forEach(btn => {
      btn.addEventListener("click", () => {
        振動フィードバック();
        modalEl.querySelectorAll(".cz-zone-opt").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        選択ゾーン = btn.getAttribute("data-zone");
        if (zoneDesc) {
          zoneDesc.textContent = モード_規定ゲーム数_マトリクス[選択ゾーン]?.解説 || "";
        }
      });
    });

    modalEl.querySelector("#btn-submit-cz-entry")?.addEventListener("click", () => {
      振動フィードバック(40);
      let タイトル = "";
      let 詳細データ = { CZ種別: 選択種別 };

      if (選択契機 === "規定ゾーン") {
        タイトル = `CZ【${選択種別}】突入 (${選択ゾーン}ゾーン規定pt当選)`;
        詳細データ.当選契機 = "規定ゲーム数";
        詳細データ.契機 = "規定ゲーム数";
        詳細データ.ゾーン = 選択ゾーン;
      } else if (選択契機 === "スイカ") {
        タイトル = `CZ【${選択種別}】突入 (スイカ契機)`;
        詳細データ.当選契機 = "スイカ";
        詳細データ.契機 = "スイカ";
        詳細データ.役 = "スイカ";
      } else if (選択契機 === "チャンス目") {
        タイトル = `CZ【${選択種別}】突入 (チャンス目契機)`;
        詳細データ.当選契機 = "チャンス目";
        詳細データ.契機 = "チャンス目";
        詳細データ.役 = "チャンス目";
      } else if (選択契機 === "強チェリー") {
        タイトル = `CZ【${選択種別}】突入 (強チェリー契機)`;
        詳細データ.当選契機 = "強チェリー";
        詳細データ.契機 = "強チェリー";
        詳細データ.役 = "強チェリー";
      } else if (選択契機 === "弱チェリー") {
        タイトル = `CZ【${選択種別}】突入 (弱チェリー契機)`;
        詳細データ.当選契機 = "弱チェリー";
        詳細データ.契機 = "弱チェリー";
        詳細データ.役 = "弱チェリー";
      } else if (選択契機 === "精神世界") {
        タイトル = `CZ【${選択種別}】突入 (精神世界中当選)`;
        詳細データ.当選契機 = "精神世界";
        詳細データ.契機 = "精神世界";
      } else if (選択契機 === "天井契機") {
        タイトル = `CZ【${選択種別}】突入 (CZ天井600G+)`;
        詳細データ.当選契機 = "天井契機";
        詳細データ.契機 = "天井契機";
      } else {
        タイトル = `CZ【${選択種別}】突入 (契機不明)`;
        詳細データ.当選契機 = "不明";
        詳細データ.契機 = "不明";
      }

      onAdd(シンキ_イベント作成({
        通常ゲーム数: g,
        ポイント数: pt,
        状態: ジョウタイ.CZ中,
        種別: イベント種別.CZ突入,
        タイトル,
        詳細: 詳細データ
      }));
      閉じるモーダル();
    });
  });
}

function モーダル表示_AT直撃(g, pt, onAdd) {
  const ptZones = [50, 100, 150, 200, 250, 300, 400, 500, 600];
  let 推定pt = pt > 0 ? pt : (g > 0 ? g : 100);

  const html = `
    <div class="modal-header">
      <div class="modal-title">👑 AT直撃 / エピソードボーナス / 天井</div>
      <button class="btn-close" id="modal-close">&times;</button>
    </div>
    <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:12px;">突入契機を選択してください（記録後、AT開始としてG数・ptは自動で0リセットされます）:</p>
    <div class="option-grid" style="margin-bottom:14px;gap:8px;">
      <!-- リプレイ直撃 -->
      <button class="option-btn at-chokugeki-btn" data-type="replay" style="grid-column:span 2;padding:14px 8px;border-color:#00a8ff;background:rgba(0, 168, 255, 0.15);display:flex;flex-direction:column;align-items:center;">
        <span style="font-weight:bold;font-size:1.05rem;color:#00a8ff;">🔁 リプレイ直撃AT</span>
        <span style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">通常時リプレイからのAT直撃（特大設定差！高設定濃厚挙動）</span>
      </button>

      <!-- エピボ（確定チェリー） -->
      <button class="option-btn at-chokugeki-btn" data-type="epibo-cherry" style="padding:14px 8px;border-color:var(--accent-red);background:rgba(232, 65, 24, 0.15);display:flex;flex-direction:column;align-items:center;">
        <span style="font-weight:bold;font-size:0.95rem;color:#ff4757;">🍒 確定チェリー エピボ</span>
        <span style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">確定役契機エピソードボーナス</span>
      </button>

      <!-- エピボ（規定ポイント当選） -->
      <button class="option-btn at-chokugeki-btn" data-type="epibo-point" style="padding:14px 8px;border-color:var(--accent-purple);background:rgba(156, 136, 255, 0.15);display:flex;flex-direction:column;align-items:center;">
        <span style="font-weight:bold;font-size:0.95rem;color:#dcdde1;">🎬 規定pt当選 エピボ</span>
        <span style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">規定ポイント到達時の一部で当選</span>
      </button>

      <!-- AT間天井 -->
      <button class="option-btn at-chokugeki-btn" data-type="ceiling" style="grid-column:span 2;padding:14px 8px;border-color:var(--accent-gold);display:flex;flex-direction:column;align-items:center;">
        <span style="font-weight:bold;font-size:1rem;color:var(--accent-gold);">🚨 AT間天井（最大1200G+α到達）</span>
        <span style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">AT間最大1200G消化による救済天井発動</span>
      </button>
    </div>

    <!-- 規定ptエピボ選択時のポイント入力エリア -->
    <div id="epibo-pt-container" style="display:none;background:rgba(156, 136, 255, 0.1);padding:10px;border-radius:8px;border:1px solid var(--accent-purple);margin-bottom:12px;">
      <label class="form-label" style="color:var(--accent-purple);margin-bottom:6px;">当選規定ポイント (pt)</label>
      <div style="display:flex;gap:6px;margin-bottom:8px;">
        <input type="number" class="form-control" id="input-epibo-pt" value="${推定pt}" style="font-size:1.1rem;font-weight:bold;text-align:center;">
      </div>
      <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:4px;">
        ${ptZones.map(pz => `
          <button class="option-btn pz-btn" data-pz="${pz}" style="padding:6px 2px;font-size:0.8rem;">${pz}pt</button>
        `).join("")}
      </div>
    </div>
  `;

  開くモーダル(html, (modalEl) => {
    let 選択タイプ = null;
    const ptContainer = modalEl.querySelector("#epibo-pt-container");
    const inputPt = modalEl.querySelector("#input-epibo-pt");

    modalEl.querySelectorAll(".pz-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        振動フィードバック();
        inputPt.value = btn.getAttribute("data-pz");
      });
    });

    modalEl.querySelectorAll(".at-chokugeki-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        振動フィードバック(40);
        const type = btn.getAttribute("data-type");
        選択タイプ = type;

        if (type === "epibo-point") {
          modalEl.querySelectorAll(".at-chokugeki-btn").forEach(b => b.classList.remove("selected"));
          btn.classList.add("selected");
          ptContainer.style.display = "block";

          let confirmBtn = modalEl.querySelector("#btn-confirm-epibo-pt");
          if (!confirmBtn) {
            confirmBtn = document.createElement("button");
            confirmBtn.id = "btn-confirm-epibo-pt";
            confirmBtn.className = "btn-block";
            confirmBtn.style.marginTop = "10px";
            confirmBtn.style.background = "var(--accent-purple)";
            confirmBtn.style.color = "#fff";
            confirmBtn.textContent = "🎬 規定ptエピボでAT開始 (0Gリセット)";
            confirmBtn.addEventListener("click", () => {
              const enteredPt = parseInt(inputPt.value, 10) || 推定pt;
              // 初当たりは現在のゲーム数で記録し、画面は自動で0リセット
              onAdd(シンキ_イベント作成({
                通常ゲーム数: g,
                ポイント数: pt,
                状態: ジョウタイ.AT中,
                種別: イベント種別.AT開始,
                タイトル: `エピソードボーナス当選！ (${enteredPt}pt規定当選) → AT開始`,
                詳細: { 当選契機: "規定ポイント", 契機: "規定ポイント", 当選pt: enteredPt, エピソードボーナス: true }
              }));
              閉じるモーダル();
            });
            ptContainer.appendChild(confirmBtn);
          }
          return;
        }

        // それ以外の契機は即時記録
        let タイトル = "";
        let 詳細 = {};

        if (type === "replay") {
          タイトル = "AT直撃当選！ (リプレイ契機・特大設定差)";
          詳細 = { 当選契機: "リプレイ", 契機: "リプレイ", 役: "リプレイ", エピソードボーナス: false };
        } else if (type === "epibo-cherry") {
          タイトル = "エピソードボーナス当選！ (確定チェリー契機) → AT開始";
          詳細 = { 当選契機: "確定チェリー", 契機: "確定チェリー", 役: "確定チェリー", エピソードボーナス: true };
        } else {
          タイトル = "AT間天井到達！ (最大1200G+α救済発動) → AT開始";
          詳細 = { 当選契機: トウセン_ケイキ.天井契機, 契機: トウセン_ケイキ.天井契機, エピソードボーナス: false };
        }

        // 初当たりは現在のゲーム数で記録し、画面は自動で0リセット
        onAdd(シンキ_イベント作成({
          通常ゲーム数: g,
          ポイント数: pt,
          状態: ジョウタイ.AT中,
          種別: イベント種別.AT開始,
          タイトル,
          詳細
        }));
        閉じるモーダル();
      });
    });
  });
}

/**
 * 演出・示唆モーダル（ちょんぼりすた解析完全準拠リッチUI）
 */
function モーダル表示_示唆演出_リッチ(g, pt, onAdd, onUndo, 初期タブ = "tab-shisa-letter") {
  const 招待状リスト = ショウタイジョウ_マスター;
  const アイキャッチリスト = アイキャッチ_マスター;
  const トロフィーリスト = トロフィー_マイステイ_マスター;
  const エンディングリスト = エンディング_カード_マスター;

  // 今回このモーダルで追加したカードの履歴（1枚ずつ追加）
  const 今回追加カード = [];

  const html = `
    <div class="modal-header">
      <div class="modal-title">💌 演出・示唆の記録 (ちょんぼりすた準拠)</div>
      <button class="btn-close" id="modal-close">&times;</button>
    </div>

    <!-- モーダル内タブ切り替え -->
    <div style="display:flex;gap:4px;margin-bottom:12px;overflow-x:auto;">
      <button class="shisa-tab-btn active" data-shisa-tab="tab-shisa-letter" style="flex:1;padding:6px 4px;border-radius:4px;border:1px solid var(--border-color);background:var(--accent-red);color:#fff;font-size:0.75rem;font-weight:bold;white-space:nowrap;cursor:pointer;">✉️ 月山招待状</button>
      <button class="shisa-tab-btn" data-shisa-tab="tab-shisa-eye" style="flex:1;padding:6px 4px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:#fff;font-size:0.75rem;font-weight:bold;white-space:nowrap;cursor:pointer;">👁️ アイキャッチ</button>
      <button class="shisa-tab-btn" data-shisa-tab="tab-shisa-trophy" style="flex:1;padding:6px 4px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:#fff;font-size:0.75rem;font-weight:bold;white-space:nowrap;cursor:pointer;">🏆 トロフィー・枚数</button>
      <button class="shisa-tab-btn" data-shisa-tab="tab-shisa-ed" style="flex:1;padding:6px 4px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:#fff;font-size:0.75rem;font-weight:bold;white-space:nowrap;cursor:pointer;">🎬 エンディングカード</button>
    </div>

    <!-- 1. 月山招待状セクション（最頻出の基本・規定G数を上部に配置） -->
    <div id="tab-shisa-letter" class="shisa-tab-content" style="display:block;">
      <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:8px;">下2桁50Gごと（50G・150G・250G…）に出現する手紙のセリフを選択:</p>
      
      <!-- ① 基本セリフ（最頻出） -->
      <div style="font-size:0.75rem;color:var(--text-muted);font-weight:bold;margin-bottom:4px;">▼ 基本セリフ（デフォルト・最頻出）</div>
      <div style="display:flex;gap:6px;margin-bottom:12px;">
        ${招待状リスト.filter(m => m.カテゴリ === "基本").map(m => `
          <button class="option-btn btn-letter-select" data-id="${m.アイディ}" style="flex:1;padding:10px 6px;text-align:center;">
            <div style="font-weight:bold;font-size:0.85rem;">「${m.セリフ}」</div>
            <div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px;">${m.シサクブン}</div>
          </button>
        `).join("")}
      </div>

      <!-- ② 残り規定ゲーム数濃厚（大チャンス） -->
      <div style="font-size:0.75rem;color:#ff6b81;font-weight:bold;margin-bottom:4px;">▼ 残り規定ゲーム数濃厚（大チャンス！）</div>
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px;">
        ${招待状リスト.filter(m => m.カテゴリ === "規定G数濃厚").map(m => `
          <button class="option-btn btn-letter-select" data-id="${m.アイディ}" style="text-align:left;display:flex;justify-content:space-between;align-items:center;padding:9px 10px;border-color:${m.カラーコード || '#ff6b81'};background:rgba(255,255,255,0.03);">
            <div>
              <span style="font-size:0.7rem;padding:1px 5px;border-radius:3px;border:1px solid ${m.カラーコード || '#ff6b81'};color:${m.カラーコード || '#ff6b81'};margin-right:6px;">${m.カラー}</span>
              <span style="font-weight:bold;color:#fff;">「${m.セリフ}」</span>
            </div>
            <span style="font-size:0.75rem;color:${m.カラーコード || '#ff6b81'};font-weight:bold;">${m.シサクブン}</span>
          </button>
        `).join("")}
      </div>

      <!-- ③ 時刻・ゾーン示唆・天井否定（頻出） -->
      <div style="font-size:0.75rem;color:var(--accent-blue);font-weight:bold;margin-bottom:4px;">▼ 時刻・ゾーン示唆・天井否定（青文字など）</div>
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px;">
        ${招待状リスト.filter(m => m.カテゴリ === "ゾーン示唆").map(m => `
          <button class="option-btn btn-letter-select" data-id="${m.アイディ}" style="text-align:left;display:flex;justify-content:space-between;align-items:center;padding:9px 10px;border-color:var(--accent-blue);background:rgba(0,210,211,0.04);">
            <div>
              <span style="font-size:0.7rem;padding:1px 5px;border-radius:3px;border:1px solid var(--accent-blue);color:var(--accent-blue);margin-right:6px;">${m.カラー}</span>
              <span style="font-weight:bold;color:#fff;">「${m.セリフ}」</span>
            </div>
            <span style="font-size:0.75rem;color:var(--accent-gold);font-weight:bold;">${m.シサクブン}</span>
          </button>
        `).join("")}
      </div>

      <!-- ④ 設定示唆・否定・確定系（稀） -->
      <div style="font-size:0.75rem;color:var(--accent-gold);font-weight:bold;margin-bottom:4px;">▼ 設定示唆・否定・確定（金文字・虹文字など）</div>
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px;">
        ${招待状リスト.filter(m => m.カテゴリ === "設定否定" || m.カテゴリ === "設定確定" || m.カテゴリ === "設定示唆").map(m => `
          <button class="option-btn btn-letter-select" data-id="${m.アイディ}" style="text-align:left;display:flex;justify-content:space-between;align-items:center;padding:9px 10px;border-color:${m.カラーコード || 'var(--accent-gold)'};background:rgba(255,255,255,0.03);">
            <div>
              <span style="font-size:0.7rem;padding:1px 5px;border-radius:3px;border:1px solid ${m.カラーコード || 'var(--accent-gold)'};color:${m.カラーコード || 'var(--accent-gold)'};margin-right:6px;">${m.カラー}</span>
              <span style="font-weight:bold;color:#fff;">「${m.セリフ}」</span>
            </div>
            <span style="font-size:0.75rem;color:${m.カラーコード || 'var(--accent-gold)'};font-weight:bold;">${m.シサクブン}</span>
          </button>
        `).join("")}
      </div>

      <!-- ⑤ その他・自由手入力ボタン -->
      <button id="btn-custom-letter" style="width:100%;padding:8px;border-radius:6px;border:1px dashed var(--border-color);background:transparent;color:var(--text-muted);font-size:0.75rem;cursor:pointer;">
        ✏️ 上記以外のセリフ・内容を自由入力して記録
      </button>
    </div>

    <!-- 2. アイキャッチセクション（頻出が上、示唆・激アツは下） -->
    <div id="tab-shisa-eye" class="shisa-tab-content" style="display:none;">
      <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:8px;">ステージチェンジ等で出現したアイキャッチを選択:</p>
      
      <div style="font-size:0.75rem;color:var(--accent-blue);font-weight:bold;margin-bottom:4px;">▼ 白背景（通常キャラ・最頻出）</div>
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px;">
        ${アイキャッチリスト.filter(m => m.タイプ === "白背景").map(m => `
          <button class="option-btn btn-eye-select" data-id="${m.アイディ}" style="text-align:left;display:flex;justify-content:space-between;align-items:center;padding:8px 10px;">
            <span style="font-weight:bold;">${m.名称}</span>
            <span style="font-size:0.75rem;color:var(--text-muted);">${m.シサクブン}</span>
          </button>
        `).join("")}
      </div>

      <div style="font-size:0.75rem;color:var(--accent-red);font-weight:bold;margin-bottom:4px;">▼ 黒背景＋赫眼キャラ・次回天井示唆（激アツ）</div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        ${アイキャッチリスト.filter(m => m.タイプ === "黒背景赫眼").map(m => `
          <button class="option-btn btn-eye-select" data-id="${m.アイディ}" style="text-align:left;display:flex;justify-content:space-between;align-items:center;border-color:var(--accent-red);background:rgba(232,65,24,0.15);padding:10px;">
            <span style="font-weight:bold;color:#fff;">${m.名称}</span>
            <span style="font-size:0.75rem;color:var(--accent-red);font-weight:bold;">${m.シサクブン}</span>
          </button>
        `).join("")}
      </div>
    </div>

    <!-- 3. トロフィー・獲得枚数セクション（頻出が上、稀なものが下） -->
    <div id="tab-shisa-trophy" class="shisa-tab-content" style="display:none;">
      <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:8px;">トロフィーまたは特定獲得枚数表示を選択:</p>
      
      <div style="font-size:0.75rem;color:var(--accent-purple);font-weight:bold;margin-bottom:4px;">▼ ナミちゃんトロフィー</div>
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px;">
        ${トロフィーリスト.filter(m => m.アイディ.startsWith("trophy_")).map(m => `
          <button class="option-btn btn-trophy-select" data-id="${m.アイディ}" style="text-align:left;display:flex;justify-content:space-between;align-items:center;padding:8px 10px;">
            <span style="font-weight:bold;">${m.名称}</span>
            <span style="font-size:0.75rem;color:${m.最小設定 >= 4 ? 'var(--accent-gold)' : (m.最小設定 ? 'var(--accent-blue)' : 'var(--text-muted)')};font-weight:bold;">${m.シサクブン}</span>
          </button>
        `).join("")}
      </div>

      <div style="font-size:0.75rem;color:var(--accent-gold);font-weight:bold;margin-bottom:4px;">▼ 特定獲得枚数表示（出現時点で確定・稀）</div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        ${トロフィーリスト.filter(m => m.アイディ.startsWith("maisu_")).map(m => `
          <button class="option-btn btn-trophy-select" data-id="${m.アイディ}" style="text-align:left;display:flex;justify-content:space-between;align-items:center;border-color:var(--accent-gold);background:rgba(251,197,49,0.1);padding:10px;">
            <span style="font-weight:bold;color:#fff;font-size:1rem;">${m.名称}</span>
            <span style="font-size:0.8rem;color:var(--accent-gold);font-weight:bold;">${m.シサクブン}</span>
          </button>
        `).join("")}
      </div>
    </div>

    <!-- 4. エンディング中カードセクション（1枚ずつ選ぶ方式・奇数偶数弱強完全網羅） -->
    <div id="tab-shisa-ed" class="shisa-tab-content" style="display:none;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="font-size:0.8rem;font-weight:bold;color:#fff;">🃏 出現カードを1枚ずつタップ</span>
        <span style="font-size:0.7rem;color:var(--text-muted);">連続タップで複数記録可能</span>
      </div>

      <!-- カード色フィルターボタン -->
      <div style="display:flex;gap:4px;margin-bottom:10px;overflow-x:auto;">
        <button class="btn-ed-color-filter active" data-color="all" style="padding:4px 8px;border-radius:4px;border:1px solid var(--accent-red);background:var(--accent-red);color:#fff;font-size:0.7rem;font-weight:bold;white-space:nowrap;cursor:pointer;">すべて (${エンディングリスト.length})</button>
        <button class="btn-ed-color-filter" data-color="白" style="padding:4px 8px;border-radius:4px;border:1px solid #dcdde1;background:rgba(255,255,255,0.08);color:#dcdde1;font-size:0.7rem;font-weight:bold;white-space:nowrap;cursor:pointer;">⚪ 白 (奇数)</button>
        <button class="btn-ed-color-filter" data-color="青" style="padding:4px 8px;border-radius:4px;border:1px solid #00d2d3;background:rgba(0,210,211,0.08);color:#00d2d3;font-size:0.7rem;font-weight:bold;white-space:nowrap;cursor:pointer;">🔵 青 (偶数)</button>
        <button class="btn-ed-color-filter" data-color="赤" style="padding:4px 8px;border-radius:4px;border:1px solid #ff6b81;background:rgba(255,107,129,0.08);color:#ff6b81;font-size:0.7rem;font-weight:bold;white-space:nowrap;cursor:pointer;">🔴 赤 (高設定)</button>
        <button class="btn-ed-color-filter" data-color="特殊" style="padding:4px 8px;border-radius:4px;border:1px solid #fbc531;background:rgba(251,197,49,0.08);color:#fbc531;font-size:0.7rem;font-weight:bold;white-space:nowrap;cursor:pointer;">✨ 銅/銀/金/虹</button>
      </div>

      <!-- カード一覧（スクロールエリア） -->
      <div id="ed-cards-container" style="display:grid;grid-template-columns:1fr 1fr;gap:6px;max-height:36vh;overflow-y:auto;padding-right:2px;margin-bottom:10px;">
        ${エンディングリスト.map(m => {
          const 示唆文 = m.示唆 || m.シサクブン || "";
          const キャラ名 = m.キャラ名 || m.キャラ || m.名称 || "";
          const カードID = m.id || m.アイディ || "";
          const 枠色 = m.枠色 || "白";
          let borderColor = "#dcdde1";
          let badgeColor = "#aaa";
          let colorCategory = 枠色;
          if (枠色 === "白") {
            borderColor = "#dcdde1";
            badgeColor = 示唆文.includes("強") ? "#ff9f43" : "#aaa";
          } else if (枠色 === "青") {
            borderColor = "#00d2d3";
            badgeColor = 示唆文.includes("強") ? "#00a8ff" : "#54a0ff";
          } else if (枠色 === "赤") {
            borderColor = "#ff6b81";
            badgeColor = 示唆文.includes("強") ? "#e84118" : "#ff6b81";
          } else if (枠色 === "銅") {
            borderColor = "#cd7f32";
            badgeColor = "#cd7f32";
            colorCategory = "特殊";
          } else if (枠色 === "銀") {
            borderColor = "#bdc3c7";
            badgeColor = "#bdc3c7";
            colorCategory = "特殊";
          } else if (枠色 === "金") {
            borderColor = "#fbc531";
            badgeColor = "#fbc531";
            colorCategory = "特殊";
          } else if (枠色 === "虹") {
            borderColor = "#9c88ff";
            badgeColor = "#9c88ff";
            colorCategory = "特殊";
          }
          return `
            <button class="option-btn btn-ed-card-item" data-id="${カードID}" data-color-cat="${colorCategory}" style="border-color:${borderColor};padding:8px 6px;text-align:left;display:flex;flex-direction:column;justify-content:space-between;min-height:56px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
                <span style="font-size:0.65rem;padding:1px 4px;border-radius:3px;border:1px solid ${borderColor};color:#fff;">${枠色}</span>
                <span style="font-size:0.65rem;font-weight:bold;color:${badgeColor};">${示唆文}</span>
              </div>
              <div style="font-weight:bold;font-size:0.85rem;color:#fff;">${キャラ名}</div>
            </button>
          `;
        }).join("")}
      </div>

      <!-- 今回追加したカードのトレイ（リアルタイム表示） -->
      <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:6px;padding:8px;margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <span style="font-size:0.75rem;color:var(--text-muted);font-weight:bold;">🎯 今回記録したカード（引いた順）:</span>
          <span id="ed-history-count" style="font-size:0.75rem;color:var(--accent-blue);font-weight:bold;">0枚</span>
        </div>
        <div id="ed-history-chips" style="display:flex;gap:4px;flex-wrap:wrap;min-height:28px;align-items:center;">
          <span style="font-size:0.7rem;color:var(--text-muted);font-style:italic;">カードをタップするとここに即時追加されます</span>
        </div>
      </div>

      <div style="display:flex;gap:6px;">
        <button id="btn-ed-undo-last" style="flex:1;padding:10px;border-radius:6px;border:1px solid var(--border-color);background:rgba(255,255,255,0.06);color:#fff;font-size:0.8rem;cursor:pointer;">↩️ 直前の1枚を取消</button>
        <button id="btn-ed-done" style="flex:2;padding:10px;border-radius:6px;border:none;background:var(--accent-red);color:#fff;font-size:0.85rem;font-weight:bold;cursor:pointer;">記録を完了して閉じる</button>
      </div>
    </div>
  `;

  開くモーダル(html, (modalEl) => {
    // タブ切り替え処理
    const tabBtns = modalEl.querySelectorAll(".shisa-tab-btn");
    const tabContents = modalEl.querySelectorAll(".shisa-tab-content");

    function タブ切り替え(targetId) {
      tabBtns.forEach(b => {
        const isTarget = b.getAttribute("data-shisa-tab") === targetId;
        b.classList.toggle("active", isTarget);
        b.style.background = isTarget ? "var(--accent-red)" : "var(--bg-card)";
      });
      tabContents.forEach(tc => {
        tc.style.display = tc.id === targetId ? "block" : "none";
      });
    }

    if (初期タブ && 初期タブ !== "tab-shisa-letter") {
      タブ切り替え(初期タブ);
    }

    tabBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        振動フィードバック();
        const targetId = btn.getAttribute("data-shisa-tab");
        タブ切り替え(targetId);
      });
    });

    // 1. 月山招待状選択
    modalEl.querySelectorAll(".btn-letter-select").forEach(btn => {
      btn.addEventListener("click", () => {
        振動フィードバック(40);
        const id = btn.getAttribute("data-id");
        const m = 招待状リスト.find(item => item.アイディ === id);
        if (m) {
          onAdd(シンキ_イベント作成({
            通常ゲーム数: g,
            ポイント数: pt,
            状態: ジョウタイ.通常,
            種別: イベント種別.示唆演出,
            タイトル: `月山招待状: 「${m.セリフ}」 [${m.シサクブン}]`,
            詳細: {
              演出名: "月山招待状",
              セリフ: m.セリフ,
              示唆: m.シサクブン,
              色: m.カラー,
              設定否定: m.設定否定,
              最小設定: m.最小設定
            }
          }));
        }
        閉じるモーダル();
      });
    });

    // 1-b. 招待状 自由入力
    modalEl.querySelector("#btn-custom-letter")?.addEventListener("click", () => {
      振動フィードバック(40);
      const 入力セリフ = prompt("手紙のセリフや内容を入力してください（例: 1時35分、青文字、など）:");
      if (入力セリフ && 入力セリフ.trim()) {
        const 入力示唆 = prompt("示唆内容がわかる場合は入力してください（空欄でも可）:", "") || "手入力記録";
        onAdd(シンキ_イベント作成({
          通常ゲーム数: g,
          ポイント数: pt,
          状態: ジョウタイ.通常,
          種別: イベント種別.示唆演出,
          タイトル: `月山招待状: 「${入力セリフ.trim()}」`,
          詳細: {
            演出名: "月山招待状",
            セリフ: 入力セリフ.trim(),
            示唆: 入力示唆
          }
        }));
        閉じるモーダル();
      }
    });

    // 2. アイキャッチ選択
    modalEl.querySelectorAll(".btn-eye-select").forEach(btn => {
      btn.addEventListener("click", () => {
        振動フィードバック(40);
        const id = btn.getAttribute("data-id");
        const m = アイキャッチリスト.find(item => item.アイディ === id);
        if (m) {
          onAdd(シンキ_イベント作成({
            通常ゲーム数: g,
            ポイント数: pt,
            状態: ジョウタイ.通常,
            種別: イベント種別.示唆演出,
            タイトル: `アイキャッチ: ${m.名称}`,
            詳細: {
              演出名: "アイキャッチ",
              名称: m.名称,
              示唆: m.シサクブン,
              当選100G以内濃厚: m.当選100G以内濃厚
            }
          }));
        }
        閉じるモーダル();
      });
    });

    // 3. トロフィー・枚数選択
    modalEl.querySelectorAll(".btn-trophy-select").forEach(btn => {
      btn.addEventListener("click", () => {
        振動フィードバック(50);
        const id = btn.getAttribute("data-id");
        const m = トロフィーリスト.find(item => item.アイディ === id);
        if (m) {
          onAdd(シンキ_イベント作成({
            通常ゲーム数: g,
            ポイント数: pt,
            状態: ジョウタイ.通常,
            種別: イベント種別.示唆演出,
            タイトル: `確定演出: ${m.名称} [${m.シサクブン}]`,
            詳細: {
              演出名: "トロフィー・枚数",
              名称: m.名称,
              示唆: m.シサクブン,
              最小設定: m.最小設定
            }
          }));
        }
        閉じるモーダル();
      });
    });

    // 4. エンディングカード 色別フィルター処理
    const colorFilters = modalEl.querySelectorAll(".btn-ed-color-filter");
    const cardItems = modalEl.querySelectorAll(".btn-ed-card-item");

    colorFilters.forEach(f => {
      f.addEventListener("click", () => {
        振動フィードバック(20);
        colorFilters.forEach(cf => {
          cf.classList.remove("active");
          cf.style.background = "transparent";
          cf.style.borderColor = "var(--border-color)";
        });
        f.classList.add("active");
        f.style.background = "var(--accent-red)";
        f.style.borderColor = "var(--accent-red)";

        const targetColor = f.getAttribute("data-color");
        cardItems.forEach(item => {
          const cat = item.getAttribute("data-color-cat");
          if (targetColor === "all" || cat === targetColor) {
            item.style.display = "flex";
          } else {
            item.style.display = "none";
          }
        });
      });
    });

    // 4. エンディングカード 1枚ずつタップ入力
    const historyChips = modalEl.querySelector("#ed-history-chips");
    const historyCount = modalEl.querySelector("#ed-history-count");

    function 更新獲得カードトレイ() {
      if (今回追加カード.length === 0) {
        historyChips.innerHTML = `<span style="font-size:0.7rem;color:var(--text-muted);font-style:italic;">カードをタップするとここに即時追加されます</span>`;
        historyCount.textContent = "0枚";
        return;
      }
      historyCount.textContent = `${今回追加カード.length}枚`;
      historyChips.innerHTML = 今回追加カード.map((c, idx) => `
        <span style="font-size:0.7rem;padding:2px 6px;border-radius:4px;border:1px solid ${c.枠色 === '白' ? '#fff' : (c.枠色 === '青' ? '#00d2d3' : (c.枠色 === '赤' ? '#ff6b81' : '#fbc531'))};background:rgba(255,255,255,0.08);color:#fff;display:inline-flex;align-items:center;gap:3px;">
          <strong>#${idx + 1}</strong> ${c.キャラ名}(${c.枠色}/${c.示唆})
        </span>
      `).join("");
    }

    cardItems.forEach(btn => {
      btn.addEventListener("click", () => {
        振動フィードバック(35);
        const id = btn.getAttribute("data-id");
        const m = エンディングリスト.find(item => (item.id && item.id === id) || (item.アイディ && item.アイディ === id));
        if (m) {
          const 示唆文 = m.示唆 || m.シサクブン || "";
          const キャラ名 = m.キャラ名 || m.キャラ || m.名称 || "";
          const カード名 = m.カード名 || m.名称 || "";
          const 枠色 = m.枠色 || "白";
          const 否定 = m.設定否定;
          const 最小 = m.最小設定;

          const ev = シンキ_イベント作成({
            通常ゲーム数: g,
            ポイント数: pt,
            状態: ジョウタイ.AT中,
            種別: イベント種別.示唆演出,
            タイトル: `EDカード: ${キャラ名} [${枠色}枠 / ${示唆文}]`,
            詳細: {
              演出名: "エンディングカード",
              カードID: id,
              カード名: カード名,
              キャラ名: キャラ名,
              枠色: 枠色,
              示唆: 示唆文,
              設定否定: 否定,
              最小設定: 最小
            }
          });
          onAdd(ev);
          今回追加カード.push({
            eventId: ev.イベントID,
            キャラ名: キャラ名,
            枠色: 枠色,
            示唆: 示唆文
          });
          更新獲得カードトレイ();
        }
      });
    });

    // 1枚取消ボタン
    modalEl.querySelector("#btn-ed-undo-last")?.addEventListener("click", () => {
      if (今回追加カード.length === 0) return;
      振動フィードバック(30);
      const popped = 今回追加カード.pop();
      if (popped && typeof onUndo === "function") {
        onUndo(popped.eventId);
      }
      更新獲得カードトレイ();
    });

    // 完了して閉じるボタン
    modalEl.querySelector("#btn-ed-done")?.addEventListener("click", () => {
      振動フィードバック(20);
      閉じるモーダル();
    });
  });
}

function モーダル表示_CZ失敗カード(g, pt, onAdd) {
  const cards = CZ_プッシュカード_マスター;
  const html = `
    <div class="modal-header">
      <div class="modal-title">🃏 CZ終了 PUSHカード選択</div>
      <button class="btn-close" id="modal-close">&times;</button>
    </div>
    <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:8px;">PUSHボタンで出現したエンドカードを選択:</p>
    <div style="display:flex;flex-direction:column;gap:6px;max-height:50vh;overflow-y:auto;">
      ${cards.map(c => `
        <button class="option-btn cz-card-opt" data-card="${c.カードメイ}" style="text-align:left;display:flex;justify-content:space-between;padding:8px 10px;">
          <span style="font-weight:bold;">${c.カードメイ}</span>
          <span style="font-size:0.75rem;color:var(--accent-gold);font-weight:bold;">${c.シサクブン}</span>
        </button>
      `).join("")}
    </div>
  `;
  開くモーダル(html, (modalEl) => {
    modalEl.querySelectorAll(".cz-card-opt").forEach(btn => {
      btn.addEventListener("click", () => {
        振動フィードバック();
        const カード = btn.getAttribute("data-card");
        onAdd(シンキ_イベント作成({
          通常ゲーム数: g,
          ポイント数: pt,
          状態: ジョウタイ.通常,
          種別: イベント種別.CZ結果,
          タイトル: `CZ失敗 (カード: ${カード})`,
          詳細: { 結果: "失敗", PUSHカード: カード }
        }));
        閉じるモーダル();
      });
    });
  });
}

function モーダル表示_AT終了(g, pt, onAdd) {
  const screens = AT_シュウリョウガメン_マスター;
  const html = `
    <div class="modal-header">
      <div class="modal-title">🏁 AT終了・終了画面選択</div>
      <button class="btn-close" id="modal-close">&times;</button>
    </div>
    <div class="form-group">
      <label class="form-label">獲得枚数（※未入力の場合は空欄のままでOK）</label>
      <input type="number" class="form-control" id="input-at-maisu" placeholder="未入力なら空欄（例: 850）" value="">
    </div>
    <div class="form-group">
      <label class="form-label">サミートロフィー（出現時のみ）</label>
      <select class="form-control" id="select-at-trophy">
        <option value="なし">なし</option>
        <option value="黒トロフィー">ナミちゃんトロフィー（黒 / 次回示唆）</option>
        <option value="銅トロフィー">銅トロフィー（設定2以上濃厚）</option>
        <option value="銀トロフィー">銀トロフィー（設定3以上濃厚）</option>
        <option value="金トロフィー">金トロフィー（設定4以上濃厚！）</option>
        <option value="キリントロフィー">キリントロフィー（設定5以上濃厚！！）</option>
        <option value="虹トロフィー">虹トロフィー（設定6濃厚！！！）</option>
      </select>
    </div>
    <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:8px;">終了画面を選択してください:</p>
    <div class="option-grid" style="grid-template-columns:1fr;gap:6px;max-height:40vh;overflow-y:auto;">
      ${screens.map((s, idx) => {
        const name = s.キャラメイ || s.キャラ名 || s.画面名 || `画面#${idx+1}`;
        const shisa = s.シサナイヨウ || s.示唆内容 || s.シサクブン || "";
        return `
          <button class="option-btn at-screen-opt" data-screen="${name}" style="text-align:left;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-weight:bold;">${name}</span>
            <span style="font-size:0.75rem;color:var(--text-muted);">${shisa}</span>
          </button>
        `;
      }).join("")}
    </div>
  `;
  開くモーダル(html, (modalEl) => {
    const firstName = screens[0].キャラメイ || screens[0].キャラ名 || screens[0].画面名 || "金木研";
    let 選択画面 = firstName;
    const btns = modalEl.querySelectorAll(".at-screen-opt");
    if (btns.length > 0) btns[0].classList.add("selected");

    btns.forEach(b => {
      b.addEventListener("click", () => {
        振動フィードバック();
        btns.forEach(btn => btn.classList.remove("selected"));
        b.classList.add("selected");
        選択画面 = b.getAttribute("data-screen");
      });
    });

    const submitBtn = document.createElement("button");
    submitBtn.className = "btn-block";
    submitBtn.style.marginTop = "12px";
    submitBtn.textContent = "AT終了を記録 → 引き戻し確認へ";
    submitBtn.addEventListener("click", () => {
      振動フィードバック(40);
      const rawMaisu = modalEl.querySelector("#input-at-maisu").value.trim();
      const maisu = (rawMaisu !== "" && !isNaN(parseInt(rawMaisu, 10)) && parseInt(rawMaisu, 10) > 0) ? parseInt(rawMaisu, 10) : null;
      const trophy = modalEl.querySelector("#select-at-trophy").value;

      onAdd(シンキ_イベント作成({
        通常ゲーム数: g,
        ポイント数: pt,
        状態: ジョウタイ.AT終了,
        種別: イベント種別.AT終了,
        タイトル: `AT終了 (${maisu !== null ? maisu + '枚' : '獲得:未入力'} / 画面: ${選択画面})`,
        詳細: { 獲得枚数: maisu, 終了画面: 選択画面, 未入力: maisu === null }
      }));

      if (trophy && trophy !== "なし") {
        let 示唆 = "";
        let minSet = 0;
        if (trophy.includes("黒")) { 示唆 = "次回示唆（黒トロフィー）"; minSet = null; }
        else if (trophy.includes("銅")) { 示唆 = "設定2以上濃厚"; minSet = 2; }
        else if (trophy.includes("銀")) { 示唆 = "設定3以上濃厚"; minSet = 3; }
        else if (trophy.includes("金")) { 示唆 = "設定4以上濃厚！"; minSet = 4; }
        else if (trophy.includes("キリン")) { 示唆 = "設定5以上濃厚！！"; minSet = 5; }
        else if (trophy.includes("虹")) { 示唆 = "設定6濃厚！！！"; minSet = 6; }

        onAdd(シンキ_イベント作成({
          通常ゲーム数: g,
          ポイント数: pt,
          状態: ジョウタイ.AT終了,
          種別: イベント種別.確定系演出,
          タイトル: `確定演出: ナミちゃんトロフィー（${trophy.replace("トロフィー", "")}） [${示唆}]`,
          詳細: { 演出名: "トロフィー・枚数", 名称: `ナミちゃんトロフィー（${trophy.replace("トロフィー", "")}）`, 示唆, 最小設定: minSet }
        }));
      }

      onAdd(シンキ_イベント作成({
        通常ゲーム数: g,
        ポイント数: pt,
        状態: ジョウタイ.引き戻し確認中,
        種別: イベント種別.引き戻し判定,
        タイトル: "引き戻し確認開始 (32G以内)",
        詳細: { 結果: ヒキモドシ_ケッカ.判定中 }
      }));

      閉じるモーダル();
    });

    modalEl.querySelector(".modal-header").parentNode.appendChild(submitBtn);
  });
}

function 開くモーダル(内部HTML, コールバック) {
  let overlay = document.getElementById("global-modal-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "global-modal-overlay";
    overlay.className = "modal-overlay";
    overlay.innerHTML = `<div class="modal-content" id="global-modal-content"></div>`;
    document.body.appendChild(overlay);
  }

  const content = overlay.querySelector("#global-modal-content");
  content.innerHTML = 内部HTML;
  overlay.classList.add("active");

  overlay.querySelector("#modal-close")?.addEventListener("click", 閉じるモーダル);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) 閉じるモーダル();
  });

  if (コールバック) コールバック(content);
}

function 閉じるモーダル() {
  const overlay = document.getElementById("global-modal-overlay");
  if (overlay) overlay.classList.remove("active");
}

/**
 * 規定G数ゾーン前兆入力モーダル（添付画像マトリクス準拠）
 */
function モーダル表示_ゾーン前兆_新(g, pt, onAdd, onResetGP) {
  const ゾーン一覧 = ["50G", "100G", "150G", "200G", "250G", "300G", "400G", "500G", "600G"];
  
  let 初期ゾーン = "100G";
  if (g <= 75) 初期ゾーン = "50G";
  else if (g <= 125) 初期ゾーン = "100G";
  else if (g <= 175) 初期ゾーン = "150G";
  else if (g <= 225) 初期ゾーン = "200G";
  else if (g <= 275) 初期ゾーン = "250G";
  else if (g <= 350) 初期ゾーン = "300G";
  else if (g <= 450) 初期ゾーン = "400G";
  else if (g <= 550) 初期ゾーン = "500G";
  else 初期ゾーン = "600G";

  let 選択ゾーン = 初期ゾーン;

  const html = `
    <div class="modal-header">
      <div class="modal-title">🗼 規定G数ゾーン前兆記録</div>
      <button class="btn-close" id="modal-close">&times;</button>
    </div>
    
    <div class="form-group" style="margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <label class="form-label" style="margin:0;">対象ゾーンを選択</label>
        <button id="btn-toggle-matrix-table" type="button" style="background:rgba(255,255,255,0.08);border:1px solid #7f8fa6;border-radius:4px;padding:3px 8px;font-size:0.75rem;color:var(--accent-gold);cursor:pointer;">
          📊 モード表を表示
        </button>
      </div>
      <div class="option-grid" id="zone-select-grid" style="grid-template-columns:repeat(3, 1fr);gap:6px;">
        ${ゾーン一覧.map(z => `
          <button class="option-btn zone-btn ${z === 選択ゾーン ? 'selected' : ''}" data-zone="${z}" style="padding:10px 4px;font-size:0.9rem;font-weight:bold;">
            ${z}
          </button>
        `).join("")}
      </div>
      <div id="zone-hint-box" style="margin-top:6px;font-size:0.75rem;color:var(--accent-gold);background:rgba(255,255,255,0.05);padding:6px 8px;border-radius:4px;">
        ${モード_規定ゲーム数_マトリクス[選択ゾーン]?.解説 || ""}
      </div>
    </div>

    <!-- 添付画像「モードと規定ゲーム数」完全再現テーブル（折りたたみ表示可能） -->
    <div id="matrix-table-container" style="display:none;background:#1e272e;border:1px solid #485460;border-radius:6px;padding:6px;margin-bottom:12px;overflow-x:auto;">
      <div style="font-size:0.8rem;font-weight:bold;color:#f5f6fa;text-align:center;margin-bottom:4px;letter-spacing:1px;">
        【モードと規定ゲーム数 解析対応表】
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:0.72rem;text-align:center;line-height:1.2;">
        <thead>
          <tr style="background:#b71540;color:#fff;font-weight:bold;">
            <th style="padding:4px 2px;border:1px solid #353b48;">G数</th>
            <th style="padding:4px 2px;border:1px solid #353b48;">通常A</th>
            <th style="padding:4px 2px;border:1px solid #353b48;">通常B</th>
            <th style="padding:4px 2px;border:1px solid #353b48;">通常C</th>
            <th style="padding:4px 2px;border:1px solid #353b48;">チャンス</th>
            <th style="padding:4px 2px;border:1px solid #353b48;">天国準備</th>
            <th style="padding:4px 2px;border:1px solid #353b48;">天国</th>
          </tr>
        </thead>
        <tbody id="matrix-tbody">
          <tr data-row-zone="50G">
            <td style="font-weight:bold;background:#2f3640;color:#f5f6fa;padding:4px 2px;border:1px solid #353b48;">50G</td>
            <td style="border:1px solid #353b48;">-</td><td style="border:1px solid #353b48;">-</td><td style="border:1px solid #353b48;">-</td>
            <td style="border:1px solid #353b48;color:#f5cd79;">△</td><td style="border:1px solid #353b48;color:#f5cd79;">△</td>
            <td style="border:1px solid #353b48;background:rgba(0,168,255,0.25);color:#00d2d3;font-weight:bold;">◯</td>
          </tr>
          <tr data-row-zone="100G">
            <td style="font-weight:bold;background:#2f3640;color:#f5f6fa;padding:4px 2px;border:1px solid #353b48;">100G</td>
            <td style="border:1px solid #353b48;">-</td>
            <td style="border:1px solid #353b48;background:rgba(0,168,255,0.25);color:#00d2d3;font-weight:bold;">◯</td>
            <td style="border:1px solid #353b48;background:rgba(0,168,255,0.25);color:#00d2d3;font-weight:bold;">◯</td>
            <td style="border:1px solid #353b48;background:rgba(0,168,255,0.25);color:#00d2d3;font-weight:bold;">◯</td>
            <td style="border:1px solid #353b48;background:rgba(0,168,255,0.25);color:#00d2d3;font-weight:bold;">◯</td>
            <td style="border:1px solid #353b48;background:#eb2f06;color:#fff;font-weight:bold;">天井</td>
          </tr>
          <tr data-row-zone="150G">
            <td style="font-weight:bold;background:#2f3640;color:#f5f6fa;padding:4px 2px;border:1px solid #353b48;">150G</td>
            <td style="border:1px solid #353b48;">-</td><td style="border:1px solid #353b48;">-</td><td style="border:1px solid #353b48;">-</td>
            <td style="border:1px solid #353b48;color:#f5cd79;">△</td>
            <td style="border:1px solid #353b48;background:rgba(0,168,255,0.25);color:#00d2d3;font-weight:bold;">◯</td>
            <td style="border:1px solid #353b48;background:#57606f;color:#a4b0be;">-</td>
          </tr>
          <tr data-row-zone="200G">
            <td style="font-weight:bold;background:#2f3640;color:#f5f6fa;padding:4px 2px;border:1px solid #353b48;">200G</td>
            <td style="border:1px solid #353b48;background:rgba(0,168,255,0.25);color:#00d2d3;font-weight:bold;">◯</td>
            <td style="border:1px solid #353b48;">-</td>
            <td style="border:1px solid #353b48;background:rgba(0,168,255,0.25);color:#00d2d3;font-weight:bold;">◯</td>
            <td style="border:1px solid #353b48;background:rgba(0,168,255,0.25);color:#00d2d3;font-weight:bold;">◯</td>
            <td style="border:1px solid #353b48;background:rgba(255,71,87,0.3);color:#ff4757;font-weight:bold;">◎</td>
            <td style="border:1px solid #353b48;background:#57606f;color:#a4b0be;">-</td>
          </tr>
          <tr data-row-zone="250G">
            <td style="font-weight:bold;background:#2f3640;color:#f5f6fa;padding:4px 2px;border:1px solid #353b48;">250G</td>
            <td style="border:1px solid #353b48;">-</td><td style="border:1px solid #353b48;">-</td><td style="border:1px solid #353b48;">-</td>
            <td style="border:1px solid #353b48;color:#f5cd79;">△</td>
            <td style="border:1px solid #353b48;">-</td>
            <td style="border:1px solid #353b48;background:#57606f;color:#a4b0be;">-</td>
          </tr>
          <tr data-row-zone="300G">
            <td style="font-weight:bold;background:#2f3640;color:#f5f6fa;padding:4px 2px;border:1px solid #353b48;">300G</td>
            <td style="border:1px solid #353b48;">-</td>
            <td style="border:1px solid #353b48;background:rgba(0,168,255,0.25);color:#00d2d3;font-weight:bold;">◯</td>
            <td style="border:1px solid #353b48;background:rgba(0,168,255,0.25);color:#00d2d3;font-weight:bold;">◯</td>
            <td style="border:1px solid #353b48;background:rgba(255,71,87,0.3);color:#ff4757;font-weight:bold;">◎</td>
            <td style="border:1px solid #353b48;background:#eb2f06;color:#fff;font-weight:bold;">天井</td>
            <td style="border:1px solid #353b48;background:#57606f;color:#a4b0be;">-</td>
          </tr>
          <tr data-row-zone="400G">
            <td style="font-weight:bold;background:#2f3640;color:#f5f6fa;padding:4px 2px;border:1px solid #353b48;">400G</td>
            <td style="border:1px solid #353b48;background:rgba(0,168,255,0.25);color:#00d2d3;font-weight:bold;">◯</td>
            <td style="border:1px solid #353b48;">-</td>
            <td style="border:1px solid #353b48;background:rgba(0,168,255,0.25);color:#00d2d3;font-weight:bold;">◯</td>
            <td style="border:1px solid #353b48;">-</td>
            <td style="border:1px solid #353b48;background:#57606f;color:#a4b0be;">-</td>
            <td style="border:1px solid #353b48;background:#57606f;color:#a4b0be;">-</td>
          </tr>
          <tr data-row-zone="500G">
            <td style="font-weight:bold;background:#2f3640;color:#f5f6fa;padding:4px 2px;border:1px solid #353b48;">500G</td>
            <td style="border:1px solid #353b48;">-</td>
            <td style="border:1px solid #353b48;background:rgba(255,71,87,0.3);color:#ff4757;font-weight:bold;">◎</td>
            <td style="border:1px solid #353b48;background:#eb2f06;color:#fff;font-weight:bold;">天井</td>
            <td style="border:1px solid #353b48;">-</td>
            <td style="border:1px solid #353b48;background:#57606f;color:#a4b0be;">-</td>
            <td style="border:1px solid #353b48;background:#57606f;color:#a4b0be;">-</td>
          </tr>
          <tr data-row-zone="600G">
            <td style="font-weight:bold;background:#2f3640;color:#f5f6fa;padding:4px 2px;border:1px solid #353b48;">600G</td>
            <td style="border:1px solid #353b48;background:#eb2f06;color:#fff;font-weight:bold;">天井</td>
            <td style="border:1px solid #353b48;background:#eb2f06;color:#fff;font-weight:bold;">天井</td>
            <td style="border:1px solid #353b48;background:#57606f;color:#a4b0be;">-</td>
            <td style="border:1px solid #353b48;background:#eb2f06;color:#fff;font-weight:bold;">天井</td>
            <td style="border:1px solid #353b48;background:#57606f;color:#a4b0be;">-</td>
            <td style="border:1px solid #353b48;background:#57606f;color:#a4b0be;">-</td>
          </tr>
        </tbody>
      </table>
      <div style="font-size:0.68rem;color:var(--text-muted);margin-top:4px;text-align:right;">
        ※◎=大チャンス、◯=チャンス、△=前兆発生でチャンス
      </div>
    </div>

    <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:8px;">前兆の挙動・結果を選択（ワンタップで記録）:</p>
    <div style="display:flex;flex-direction:column;gap:8px;">
      <button class="btn-block btn-zone-action" data-act="前兆なし" style="background:#2d3436;border:1px solid #636e72;margin:0;padding:12px;text-align:left;">
        ❌ 前兆なし <span style="font-size:0.75rem;color:var(--text-muted);display:block;">（ガセ前兆すら発生せず）</span>
      </button>
      <button class="btn-block btn-zone-action" data-act="前兆あり（東京上空なし）" style="background:rgba(255, 159, 67, 0.2);border:1px solid #ff9f43;margin:0;padding:12px;text-align:left;">
        ⚠️ 前兆あり（東京上空なし） <span style="font-size:0.75rem;color:var(--text-muted);display:block;">（ガセ前兆発生・通常ステージのまま）</span>
      </button>
      <button class="btn-block btn-zone-action" data-act="前兆あり（東京上空あり）" style="background:rgba(0, 168, 255, 0.2);border:1px solid var(--accent-blue);margin:0;padding:12px;text-align:left;">
        🗼 前兆あり（東京上空あり） <span style="font-size:0.75rem;color:var(--text-muted);display:block;">（東京上空ステージ移行・高期待度ガセ）</span>
      </button>
      <button class="btn-block btn-zone-action" data-act="ゾーンCZ当選" style="background:rgba(76, 209, 55, 0.25);border:1px solid #4cd137;margin:0;padding:14px;text-align:left;font-weight:bold;">
        ⚔️ ゾーンCZ当選！ <span style="font-size:0.75rem;color:#4cd137;display:block;">（CZ当選を記録し、G数を0リセットしてCZ中へ）</span>
      </button>
      <button class="btn-block btn-zone-action" data-act="ゾーンエピボ当選" style="background:linear-gradient(135deg, rgba(156, 136, 255, 0.3), rgba(232, 65, 24, 0.3));border:1px solid var(--accent-purple);margin:0;padding:14px;text-align:left;font-weight:bold;">
        🎬 規定ゾーン エピソードボーナス当選！ <span style="font-size:0.75rem;color:#dcdde1;display:block;">（エピボ当選を記録し、0GリセットしてAT中へ）</span>
      </button>
    </div>
  `;

  開くモーダル(html, (modalEl) => {
    const tableContainer = modalEl.querySelector("#matrix-table-container");
    const toggleBtn = modalEl.querySelector("#btn-toggle-matrix-table");

    function ハイライト行(zone) {
      modalEl.querySelectorAll("#matrix-tbody tr").forEach(tr => {
        if (tr.getAttribute("data-row-zone") === zone) {
          tr.style.outline = "2px solid var(--accent-gold)";
          tr.style.background = "rgba(255,215,0,0.15)";
        } else {
          tr.style.outline = "none";
          tr.style.background = "";
        }
      });
    }

    if (toggleBtn && tableContainer) {
      toggleBtn.addEventListener("click", () => {
        振動フィードバック();
        const isHidden = tableContainer.style.display === "none";
        tableContainer.style.display = isHidden ? "block" : "none";
        toggleBtn.textContent = isHidden ? "📊 モード表を閉じる" : "📊 モード表を表示";
      });
    }

    ハイライト行(選択ゾーン);

    modalEl.querySelectorAll(".zone-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        振動フィードバック();
        modalEl.querySelectorAll(".zone-btn").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        選択ゾーン = btn.getAttribute("data-zone");
        const hintEl = modalEl.querySelector("#zone-hint-box");
        if (hintEl) hintEl.textContent = モード_規定ゲーム数_マトリクス[選択ゾーン]?.解説 || "";
        ハイライト行(選択ゾーン);
      });
    });

    modalEl.querySelectorAll(".btn-zone-action").forEach(btn => {
      btn.addEventListener("click", () => {
        振動フィードバック();
        const アクション = btn.getAttribute("data-act");

        if (アクション === "ゾーンCZ当選") {
          // CZ突入は現在のゲーム数で記録
          onAdd(シンキ_イベント作成({
            通常ゲーム数: g,
            ポイント数: pt,
            状態: ジョウタイ.CZ中,
            種別: イベント種別.CZ突入,
            タイトル: `CZ突入 (${選択ゾーン}ゾーン契機)`,
            詳細: { CZ種別: "レミニセンス", 当選契機: "規定ゲーム数", ゾーン: 選択ゾーン, 前兆発生: "あり" }
          }));
          onResetGP();
        } else if (アクション === "ゾーンエピボ当選") {
          // エピボ初当たりは現在の通常ゲーム数で記録
          onAdd(シンキ_イベント作成({
            通常ゲーム数: g,
            ポイント数: pt,
            状態: ジョウタイ.AT中,
            種別: イベント種別.AT開始,
            タイトル: `エピソードボーナス当選！ (${選択ゾーン}ゾーン規定当選) → AT開始`,
            詳細: { 当選契機: "規定ゲーム数", 契機: "規定ゲーム数", ゾーン: 選択ゾーン, エピソードボーナス: true }
          }));
          onResetGP();
        } else {
          const 前兆あり = アクション !== "前兆なし";
          const 上空あり = アクション === "前兆あり（東京上空あり）";
          onAdd(シンキ_イベント作成({
            通常ゲーム数: g,
            ポイント数: pt,
            状態: ジョウタイ.通常,
            種別: イベント種別.ゾーン前兆,
            タイトル: `【${選択ゾーン}ゾーン】${アクション}`,
            詳細: {
              ゾーン: 選択ゾーン,
              結果: アクション,
              前兆発生: 前兆あり ? "あり" : "なし",
              東京上空: 上空あり ? "あり" : "なし"
            }
          }));
        }
        閉じるモーダル();
      });
    });
  });
}

/**
 * 有馬ジャッジメント入力モーダル
 */
function モーダル表示_有馬ジャッジメント(g, pt, onAdd) {
  const html = `
    <div class="modal-header">
      <div class="modal-title">⚔️ 有馬ジャッジメント</div>
      <button class="btn-close" id="modal-close">&times;</button>
    </div>
    <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:12px;">有馬ジャッジメントの挙動・結果を選択してください:</p>
    <div style="display:flex;flex-direction:column;gap:10px;">
      <button class="btn-block btn-arima-opt" data-result="成功" style="background:linear-gradient(135deg, #e84118, #fbc531);margin:0;padding:16px;font-size:1.1rem;font-weight:bold;color:#000;">
        🎉 成功！ → 裏覚醒へ！
      </button>
      <button class="btn-block btn-arima-opt" data-result="失敗" style="background:#2d3436;border:1px solid var(--border-color);margin:0;padding:14px;">
        ❌ 失敗（AT継続または終了）
      </button>
      <button class="btn-block btn-arima-opt" data-result="突入のみ" style="background:rgba(255,255,255,0.05);border:1px solid var(--border-color);margin:0;padding:10px;font-size:0.85rem;">
        ⚡ 突入のみ記録（消化中）
      </button>
    </div>
  `;
  開くモーダル(html, (modalEl) => {
    modalEl.querySelectorAll(".btn-arima-opt").forEach(btn => {
      btn.addEventListener("click", () => {
        振動フィードバック();
        const 結果 = btn.getAttribute("data-result");
        onAdd(シンキ_イベント作成({
          通常ゲーム数: g,
          ポイント数: pt,
          状態: ジョウタイ.AT中,
          種別: イベント種別.AT中イベント,
          タイトル: `有馬ジャッジメント: ${結果}`,
          詳細: { 有馬ジャッジメント: 結果 }
        }));
        閉じるモーダル();
      });
    });
  });
}

/**
 * 通常転落アイキャッチ入力モーダル（AT終了後）
 */
function モーダル表示_転落アイキャッチ(g, pt, onAdd) {
  const ecList = アイキャッチ_マスター;
  const html = `
    <div class="modal-header">
      <div class="modal-title">👁️ 通常転落アイキャッチ記録</div>
      <button class="btn-close" id="modal-close">&times;</button>
    </div>
    <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:10px;">出現したアイキャッチ（キャラ・背景色）を選択してください:</p>
    <div style="display:flex;flex-direction:column;gap:6px;max-height:55vh;overflow-y:auto;margin-bottom:10px;">
      ${ecList.map(ec => {
        const name = ec.名称 || ec.キャラメイ || ec.キャラ名 || "アイキャッチ";
        const shisa = ec.シサナイヨウ || ec.シサクブン || "";
        const type = ec.タイプ || "";
        const isHot = ec.当選100G以内濃厚 || shisa.includes("濃厚") || shisa.includes("大幅");
        return `
          <button class="option-btn ec-item-btn" data-id="${ec.アイディ}" style="display:flex;justify-content:space-between;align-items:center;padding:12px 10px;text-align:left;border-color:${isHot ? 'var(--accent-red)' : 'var(--border-color)'};">
            <div>
              <span style="font-weight:bold;color:#fff;font-size:0.95rem;">${name}</span>
              <span style="display:block;font-size:0.75rem;color:var(--text-muted);">${type}</span>
            </div>
            <span style="font-size:0.8rem;color:${isHot ? 'var(--accent-red)' : 'var(--accent-gold)'};font-weight:bold;">${shisa}</span>
          </button>
        `;
      }).join("")}
    </div>
  `;
  開くモーダル(html, (modalEl) => {
    modalEl.querySelectorAll(".ec-item-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        振動フィードバック();
        const id = btn.getAttribute("data-id");
        const 標的 = ecList.find(e => e.アイディ === id);
        if (標的) {
          const name = 標的.名称 || 標的.キャラメイ || 標的.キャラ名 || "アイキャッチ";
          const shisa = 標的.シサナイヨウ || 標的.シサクブン || "";
          onAdd(シンキ_イベント作成({
            通常ゲーム数: g,
            ポイント数: pt,
            状態: ジョウタイ.引き戻し確認中,
            種別: イベント種別.示唆演出,
            タイトル: `アイキャッチ: ${name} (${shisa})`,
            詳細: { 演出名: "アイキャッチ", 名称: name, 示唆: shisa, 当選100G以内濃厚: 標的.当選100G以内濃厚 }
          }));
        }
        閉じるモーダル();
      });
    });
  });
}
