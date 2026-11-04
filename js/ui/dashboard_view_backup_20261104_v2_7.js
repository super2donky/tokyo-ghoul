/**
 * 実戦ダッシュボード表示UIモジュール
 */

import { シュウケイ_サンシュツ } from "../engine/aggregator.js";
import { モード_スイソク_サンシュツ } from "../engine/mode_estimator.js";
import { セッテイ_スペック } from "../models/master_data.js";

/**
 * ダッシュボードのHTMLを生成して指定コンテナを描画する
 */
export function ダッシュボード_レンダリング(コンテナ, セッション) {
  if (!コンテナ) return;

  const 集計 = シュウケイ_サンシュツ(セッション);
  const モード = モード_スイソク_サンシュツ(セッション.イベントリスト);
  const 実戦 = 集計.実戦データ;
  const 引き継ぎ = 集計.引き継ぎデータ;
  const 示唆 = 集計.設定判別材料;
  const 収支 = 集計.収支情報;

  let 確定html = "";
  if (示唆.最小確定設定) {
    確定html += `<div class="shisa-banner kakutei">🔥 【確定】設定${示唆.最小確定設定}以上濃厚！</div>`;
  }
  if (示唆.設定否定.length > 0) {
    確定html += `<div class="shisa-banner kakutei">❌ 【否定】設定${示唆.設定否定.join(", ")}を完全否定！</div>`;
  }

  // 精神世界30Gの比率計算
  const 精神30G回数 = 実戦.精神世界.告知G数振り分け["30G"] || 0;
  const 精神総回数 = 実戦.精神世界.突入回数;
  const 精神30G比率 = 精神総回数 > 0 ? ((精神30G回数 / 精神総回数) * 100).toFixed(1) + "%" : "-";

  // 直近イベント5件の抽出（時系列の最新5件を抽出）
  const 直近イベント = [...セッション.イベントリスト]
    .sort((a, b) => {
      return (b.連番 || 0) - (a.連番 || 0) || (Number(b.タイムスタンプ) || 0) - (Number(a.タイムスタンプ) || 0);
    })
    .slice(0, 5);

  let 直近html = "";
  if (直近イベント.length === 0) {
    直近html = `<div style="color:var(--text-muted);font-size:0.85rem;text-align:center;padding:8px;">まだ実戦イベントが記録されていません</div>`;
  } else {
    直近html = 直近イベント.map(ev => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:0.85rem;">
        <div>
          <span style="font-weight:bold;color:#fff;margin-right:6px;">${ev.通常ゲーム数}G</span>
          <span style="color:var(--text-muted);font-size:0.75rem;margin-right:6px;">[${ev.ポイント数}pt]</span>
          <span>${ev.タイトル}</span>
        </div>
        <span style="font-size:0.75rem;color:var(--accent-blue);">${ev.状態}</span>
      </div>
    `).join("");
  }

  // 設定比較テーブル用HTML生成
  const スペックリスト = Object.values(セッテイ_スペック);
  const スペック表行 = スペックリスト.map(s => {
    const 否定中 = 示唆.設定否定.includes(s.セッテイ);
    const 確定対象 = 示唆.最小確定設定 && s.セッテイ >= 示唆.最小確定設定;
    let クラス = "";
    if (否定中) クラス = "style='opacity:0.3;text-decoration:line-through;'";
    else if (確定対象) クラス = "style='background:rgba(232, 65, 24, 0.15);font-weight:bold;'";

    return `
      <tr ${クラス}>
        <td style="padding:6px 4px;font-weight:bold;color:${s.セッテイ >= 4 ? 'var(--accent-red)' : '#fff'};">設${s.セッテイ}</td>
        <td style="padding:6px 4px;">${s.キカイワリ}%</td>
        <td style="padding:6px 4px;">1/${s.CZカクリツ}</td>
        <td style="padding:6px 4px;">1/${s.ATハツアタリ}</td>
        <td style="padding:6px 4px;">1/${s.オオグイノリゼ}</td>
        <td style="padding:6px 4px;">${s.ヒキモドシ}%</td>
      </tr>
    `;
  }).join("");

  コンテナ.innerHTML = `
    <!-- 現在の基本ステータス -->
    <div class="status-banner">
      <div class="status-item">
        <span class="label">液晶ゲーム数</span>
        <span class="value" id="dash-current-g">${集計.最新状況.通常ゲーム数}<span style="font-size:0.8rem;">G</span></span>
        <span style="font-size:0.65rem;color:var(--text-muted);display:block;margin-top:2px;">(実戦累計: ${実戦.通常ゲーム数}G)</span>
      </div>
      <div class="status-item">
        <span class="label">累積ポイント</span>
        <span class="value" id="dash-current-pt">${集計.最新状況.ポイント数}<span style="font-size:0.8rem;">pt</span></span>
      </div>
      <div class="status-item">
        <span class="label">現在状態</span>
        <span class="value state-highlight" id="dash-current-state">${集計.最新状況.状態}</span>
      </div>
    </div>

    <!-- 確定・示唆速報 -->
    ${確定html}

    <!-- モード推測速報カード -->
    <div class="card">
      <div class="card-title" style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <span>🧭 滞在モード推測</span>
          <span style="font-size:0.8rem;color:var(--accent-gold);margin-left:6px;">${モード.最有力モード} ${モード.確定モード ? "【確定】" : "（推測）"}</span>
        </div>
        <button id="btn-dash-toggle-matrix" type="button" style="background:rgba(255,255,255,0.08);border:1px solid #7f8fa6;border-radius:4px;padding:3px 8px;font-size:0.75rem;color:var(--accent-gold);cursor:pointer;">
          📊 解析対応表
        </button>
      </div>
      <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:6px;">
        ${モード.有効候補.map(c => `<span style="margin-right:8px;display:inline-block;">${c.モード名}: <strong style="color:#fff;">${c.スコア}点</strong></span>`).join("")}
      </div>
      ${モード.警告.length > 0 ? `<div style="color:var(--text-highlight);font-size:0.8rem;margin-bottom:6px;">⚠️ ${モード.警告.join("<br>")}</div>` : ""}

      <!-- 添付画像「モードと規定ゲーム数」完全再現テーブル（ダッシュボード用） -->
      <div id="dash-matrix-table-container" style="display:none;background:#1e272e;border:1px solid #485460;border-radius:6px;padding:6px;margin-top:8px;overflow-x:auto;">
        <div style="font-size:0.75rem;font-weight:bold;color:#f5f6fa;text-align:center;margin-bottom:4px;">
          【モードと規定ゲーム数 解析対応表】
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:0.7rem;text-align:center;line-height:1.2;">
          <thead>
            <tr style="background:#b71540;color:#fff;font-weight:bold;">
              <th style="padding:3px 2px;border:1px solid #353b48;">G数</th>
              <th style="padding:3px 2px;border:1px solid #353b48;">通常A</th>
              <th style="padding:3px 2px;border:1px solid #353b48;">通常B</th>
              <th style="padding:3px 2px;border:1px solid #353b48;">通常C</th>
              <th style="padding:3px 2px;border:1px solid #353b48;">チャンス</th>
              <th style="padding:3px 2px;border:1px solid #353b48;">天国準備</th>
              <th style="padding:3px 2px;border:1px solid #353b48;">天国</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style="font-weight:bold;background:#2f3640;color:#f5f6fa;border:1px solid #353b48;">50G</td><td style="border:1px solid #353b48;">-</td><td style="border:1px solid #353b48;">-</td><td style="border:1px solid #353b48;">-</td><td style="border:1px solid #353b48;color:#f5cd79;">△</td><td style="border:1px solid #353b48;color:#f5cd79;">△</td><td style="border:1px solid #353b48;background:rgba(0,168,255,0.25);color:#00d2d3;font-weight:bold;">◯</td></tr>
            <tr><td style="font-weight:bold;background:#2f3640;color:#f5f6fa;border:1px solid #353b48;">100G</td><td style="border:1px solid #353b48;">-</td><td style="border:1px solid #353b48;background:rgba(0,168,255,0.25);color:#00d2d3;font-weight:bold;">◯</td><td style="border:1px solid #353b48;background:rgba(0,168,255,0.25);color:#00d2d3;font-weight:bold;">◯</td><td style="border:1px solid #353b48;background:rgba(0,168,255,0.25);color:#00d2d3;font-weight:bold;">◯</td><td style="border:1px solid #353b48;background:rgba(0,168,255,0.25);color:#00d2d3;font-weight:bold;">◯</td><td style="border:1px solid #353b48;background:#eb2f06;color:#fff;font-weight:bold;">天井</td></tr>
            <tr><td style="font-weight:bold;background:#2f3640;color:#f5f6fa;border:1px solid #353b48;">150G</td><td style="border:1px solid #353b48;">-</td><td style="border:1px solid #353b48;">-</td><td style="border:1px solid #353b48;">-</td><td style="border:1px solid #353b48;color:#f5cd79;">△</td><td style="border:1px solid #353b48;background:rgba(0,168,255,0.25);color:#00d2d3;font-weight:bold;">◯</td><td style="border:1px solid #353b48;background:#57606f;color:#a4b0be;">-</td></tr>
            <tr><td style="font-weight:bold;background:#2f3640;color:#f5f6fa;border:1px solid #353b48;">200G</td><td style="border:1px solid #353b48;background:rgba(0,168,255,0.25);color:#00d2d3;font-weight:bold;">◯</td><td style="border:1px solid #353b48;">-</td><td style="border:1px solid #353b48;background:rgba(0,168,255,0.25);color:#00d2d3;font-weight:bold;">◯</td><td style="border:1px solid #353b48;background:rgba(0,168,255,0.25);color:#00d2d3;font-weight:bold;">◯</td><td style="border:1px solid #353b48;background:rgba(255,71,87,0.3);color:#ff4757;font-weight:bold;">◎</td><td style="border:1px solid #353b48;background:#57606f;color:#a4b0be;">-</td></tr>
            <tr><td style="font-weight:bold;background:#2f3640;color:#f5f6fa;border:1px solid #353b48;">250G</td><td style="border:1px solid #353b48;">-</td><td style="border:1px solid #353b48;">-</td><td style="border:1px solid #353b48;">-</td><td style="border:1px solid #353b48;color:#f5cd79;">△</td><td style="border:1px solid #353b48;">-</td><td style="border:1px solid #353b48;background:#57606f;color:#a4b0be;">-</td></tr>
            <tr><td style="font-weight:bold;background:#2f3640;color:#f5f6fa;border:1px solid #353b48;">300G</td><td style="border:1px solid #353b48;">-</td><td style="border:1px solid #353b48;background:rgba(0,168,255,0.25);color:#00d2d3;font-weight:bold;">◯</td><td style="border:1px solid #353b48;background:rgba(0,168,255,0.25);color:#00d2d3;font-weight:bold;">◯</td><td style="border:1px solid #353b48;background:rgba(255,71,87,0.3);color:#ff4757;font-weight:bold;">◎</td><td style="border:1px solid #353b48;background:#eb2f06;color:#fff;font-weight:bold;">天井</td><td style="border:1px solid #353b48;background:#57606f;color:#a4b0be;">-</td></tr>
            <tr><td style="font-weight:bold;background:#2f3640;color:#f5f6fa;border:1px solid #353b48;">400G</td><td style="border:1px solid #353b48;background:rgba(0,168,255,0.25);color:#00d2d3;font-weight:bold;">◯</td><td style="border:1px solid #353b48;">-</td><td style="border:1px solid #353b48;background:rgba(0,168,255,0.25);color:#00d2d3;font-weight:bold;">◯</td><td style="border:1px solid #353b48;">-</td><td style="border:1px solid #353b48;background:#57606f;color:#a4b0be;">-</td><td style="border:1px solid #353b48;background:#57606f;color:#a4b0be;">-</td></tr>
            <tr><td style="font-weight:bold;background:#2f3640;color:#f5f6fa;border:1px solid #353b48;">500G</td><td style="border:1px solid #353b48;">-</td><td style="border:1px solid #353b48;background:rgba(255,71,87,0.3);color:#ff4757;font-weight:bold;">◎</td><td style="border:1px solid #353b48;background:#eb2f06;color:#fff;font-weight:bold;">天井</td><td style="border:1px solid #353b48;">-</td><td style="border:1px solid #353b48;background:#57606f;color:#a4b0be;">-</td><td style="border:1px solid #353b48;background:#57606f;color:#a4b0be;">-</td></tr>
            <tr><td style="font-weight:bold;background:#2f3640;color:#f5f6fa;border:1px solid #353b48;">600G</td><td style="border:1px solid #353b48;background:#eb2f06;color:#fff;font-weight:bold;">天井</td><td style="border:1px solid #353b48;background:#eb2f06;color:#fff;font-weight:bold;">天井</td><td style="border:1px solid #353b48;background:#57606f;color:#a4b0be;">-</td><td style="border:1px solid #353b48;background:#eb2f06;color:#fff;font-weight:bold;">天井</td><td style="border:1px solid #353b48;background:#57606f;color:#a4b0be;">-</td><td style="border:1px solid #353b48;background:#57606f;color:#a4b0be;">-</td></tr>
          </tbody>
        </table>
        <div style="font-size:0.65rem;color:var(--text-muted);margin-top:4px;text-align:right;">
          ※◎=大チャンス、◯=チャンス、△=前兆発生でチャンス
        </div>
      </div>
    </div>

    <!-- 設定判別主要カウンター -->
    <div class="card">
      <div class="card-title">
        <span>📊 設定判別・実戦集計カウンター</span>
        <span style="font-size:0.75rem;color:var(--text-muted);">通常 ${実戦.通常ゲーム数}G</span>
      </div>

      <div class="stat-grid">
        <!-- AT初当たり -->
        <div class="stat-box">
          <div class="box-label">AT初当たり確率</div>
          <div class="box-main">${実戦.AT初当たり回数}回 <span style="font-size:0.8rem;">(1/${実戦.AT初当たり確率})</span></div>
          <div class="box-sub">直撃: ${実戦.AT直撃回数} / 天井: ${実戦.AT天井回数}</div>
        </div>

        <!-- CZ合算 -->
        <div class="stat-box">
          <div class="box-label">CZ出現率・成功率</div>
          <div class="box-main">${実戦.CZ突入回数}回 <span style="font-size:0.8rem;">(1/${実戦.CZ確率})</span></div>
          <div class="box-sub">成功: ${実戦.CZ成功回数}回 (${実戦.CZ成功率}%)</div>
        </div>

        <!-- 100G以内CZ当選率（重要設定差） -->
        <div class="stat-box">
          <div class="box-label">100G以内 CZ当選率</div>
          <div class="box-main">${実戦.当選100G以内.当選率}%</div>
          <div class="box-sub">${実戦.当選100G以内.当選数} / ${実戦.当選100G以内.試行区間数}回 (設1:19%〜設6:36%)</div>
        </div>

        <!-- 大喰いの利世（特大設定差） -->
        <div class="stat-box">
          <div class="box-label">大喰いの利世（上位CZ）</div>
          <div class="box-main">${実戦.大喰いの利世.突入}回 <span style="font-size:0.8rem;">(1/${実戦.大喰いの利世.確率})</span></div>
          <div class="box-sub">成功: ${実戦.大喰いの利世.成功}回 (設1:1/2079〜設6:1/1074)</div>
        </div>

        <!-- 引き戻し率 -->
        <div class="stat-box">
          <div class="box-label">AT引き戻し率</div>
          <div class="box-main">${実戦.引き戻し.成功率}%</div>
          <div class="box-sub">${実戦.引き戻し.成功回数} / ${実戦.引き戻し.試行回数}回 (未判定:${実戦.引き戻し.判定中回数})</div>
        </div>

        <!-- 精神世界30G割合 -->
        <div class="stat-box">
          <div class="box-label">精神世界 30G選択率</div>
          <div class="box-main">${精神30G比率}</div>
          <div class="box-sub">10G:${実戦.精神世界.告知G数振り分け["10G"]} / 20G:${実戦.精神世界.告知G数振り分け["20G"]} / 30G:${精神30G回数}</div>
        </div>

        <!-- 精神世界中 弱レア役CZ当選率 -->
        <div class="stat-box">
          <div class="box-label">精神世界 弱レア役CZ当選率</div>
          <div class="box-main">${実戦.精神世界.弱レア役CZ当選率}%</div>
          <div class="box-sub">${実戦.精神世界.弱レア役CZ当選回数} / ${実戦.精神世界.弱レア役回数}回 (目安:約40%)</div>
        </div>

        <!-- エピソードボーナス -->
        <div class="stat-box">
          <div class="box-label">エピソードボーナス</div>
          <div class="box-main">${実戦.エピソードボーナス回数}回</div>
          <div class="box-sub">高設定ほど優遇</div>
        </div>
      </div>
    </div>

    <!-- 設定別スペック対比テーブル -->
    <div class="card">
      <div class="card-title">
        <span>📋 設定1〜6 公開解析スペック一覧</span>
        <span style="font-size:0.75rem;color:var(--text-muted);">本日のデータと比較</span>
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%;font-size:0.75rem;text-align:center;border-collapse:collapse;white-space:nowrap;">
          <thead>
            <tr style="border-bottom:1px solid var(--border-color);color:var(--text-muted);">
              <th style="padding:4px;">設定</th>
              <th style="padding:4px;">出玉率</th>
              <th style="padding:4px;">CZ合算</th>
              <th style="padding:4px;">AT初当</th>
              <th style="padding:4px;">利世CZ</th>
              <th style="padding:4px;">引き戻し</th>
            </tr>
          </thead>
          <tbody>
            ${スペック表行}
            <tr style="border-top:2px solid var(--accent-red);background:rgba(255,255,255,0.05);font-weight:bold;">
              <td style="padding:6px 4px;color:var(--accent-gold);">実戦値</td>
              <td style="padding:6px 4px;">-</td>
              <td style="padding:6px 4px;color:${実戦.CZ確率 !== '-' && parseFloat(実戦.CZ確率) <= 220 ? 'var(--accent-red)' : '#fff'};">1/${実戦.CZ確率}</td>
              <td style="padding:6px 4px;color:${実戦.AT初当たり確率 !== '-' && parseFloat(実戦.AT初当たり確率) <= 300 ? 'var(--accent-red)' : '#fff'};">1/${実戦.AT初当たり確率}</td>
              <td style="padding:6px 4px;color:${実戦.大喰いの利世.確率 !== '-' && parseFloat(実戦.大喰いの利世.確率) <= 1300 ? 'var(--accent-red)' : '#fff'};">1/${実戦.大喰いの利世.確率}</td>
              <td style="padding:6px 4px;color:${実戦.引き戻し.成功率 !== '-' && parseFloat(実戦.引き戻し.成功率) >= 12.0 ? 'var(--accent-red)' : '#fff'};">${実戦.引き戻し.成功率}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 収支・店舗情報 -->
    <div class="card">
      <div class="card-title">
        <span>💰 収支・遊技台情報</span>
        <button id="btn-edit-syushi" style="background:transparent;border:1px solid var(--border-color);color:#fff;border-radius:4px;padding:2px 8px;font-size:0.75rem;cursor:pointer;">収支編集</button>
      </div>
      <div style="display:flex;justify-content:space-around;text-align:center;">
        <div>
          <span style="font-size:0.75rem;color:var(--text-muted);display:block;">投資</span>
          <span style="font-weight:bold;color:#fff;">${収支?.投資枚数 ?? 0}枚</span>
        </div>
        <div>
          <span style="font-size:0.75rem;color:var(--text-muted);display:block;">回収</span>
          <span style="font-weight:bold;color:#fff;">${収支?.回収枚数 ?? 0}枚</span>
        </div>
        <div>
          <span style="font-size:0.75rem;color:var(--text-muted);display:block;">差枚</span>
          <span style="font-weight:bold;color:${(収支?.差枚数 ?? 0) >= 0 ? "var(--accent-green)" : "var(--accent-red)"};">
            ${(収支?.差枚数 ?? 0) > 0 ? "+" : ""}${収支?.差枚数 ?? 0}枚
          </span>
        </div>
      </div>
    </div>

    <!-- 直近のイベント履歴 -->
    <div class="card">
      <div class="card-title">
        <span>⏱️ 直近のイベント履歴</span>
        <button id="btn-goto-history" style="background:transparent;border:none;color:var(--accent-blue);font-size:0.8rem;cursor:pointer;">全履歴を見る ›</button>
      </div>
      <div class="recent-events-list">
        ${直近html}
      </div>
    </div>
  `;
}


  // ダッシュボード内解析対応表トグル
  コンテナ.querySelector("#btn-dash-toggle-matrix")?.addEventListener("click", () => {
    const tableContainer = コンテナ.querySelector("#dash-matrix-table-container");
    const toggleBtn = コンテナ.querySelector("#btn-dash-toggle-matrix");
    if (tableContainer && toggleBtn) {
      const isHidden = tableContainer.style.display === "none";
      tableContainer.style.display = isHidden ? "block" : "none";
      toggleBtn.textContent = isHidden ? "📊 解析対応表を閉じる" : "📊 解析対応表";
    }
  });