/**
 * データモデルおよび定数定義
 */

// 状態定数
export const ジョウタイ = {
  通常: "通常",
  精神世界: "精神世界",
  CZ中: "CZ中",
  AT中: "AT中",
  引き戻し確認中: "引き戻し確認中"
};

// イベント種別定数
export const イベント種別 = {
  ゲーム数進行: "GAME_SHINKOU",
  ポイント加算: "POINT_KASAN",
  ゾーン前兆: "ZONE_ZENCHO",
  前兆情報: "ZENCHO_JOHO",
  レア役成立: "RARE_ROLE",
  赫眼リプ成立: "KAKUGAN_REPLAY",
  精神世界突入: "SEISHIN_SEKAI_TOUNYU",
  精神世界中役: "SEISHIN_SEKAI_ROLE",
  精神世界終了: "SEISHIN_SEKAI_SHURYO",
  CZ突入: "CZ_TOUNYU",
  CZ結果: "CZ_KEKKA",
  AT開始: "AT_KAISHI",
  AT中イベント: "AT_ACTION",
  AT終了: "AT_SHURYO",
  引き戻し判定: "HIKIMODOSHI_HANTEI",
  示唆演出: "SHISA_ENSHUTSU",
  メモ記録: "MEMO_KIROKU"
};

// CZ種別定数
export const CZ種別 = {
  レミニセンス: "レミニセンス",
  大喰いの利世: "大喰いの利世"
};

// 当選契機定数
export const トウセン_ケイキ = {
  規定ポイント: "規定ポイント",
  弱レア役: "弱レア役",
  強レア役: "強レア役",
  精神世界: "精神世界",
  天井契機: "天井契機",
  AT直撃: "AT直撃",
  引き戻し: "引き戻し",
  その他: "その他",
  不明: "不明"
};

// 引き戻し判定結果
export const ヒキモドシ_ケッカ = {
  判定中: "判定中",
  成功: "成功",
  失敗: "失敗",
  不明: "不明"
};

/**
 * 新規セッションデータ生成
 */
export function シンキ_セッション作成(テンポメイ = "", ダイバンゴウ = "") {
  const イマ = new Date();
  const ヒヅケ = イマ.toISOString().split("T")[0];
  
  return {
    スキーマバージョン: "1.0.0",
    セッションID: "session_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9),
    日付: ヒヅケ,
    店舗名: テンポメイ,
    台番号: ダイバンゴウ,
    作成日時: イマ.toISOString(),
    更新日時: イマ.toISOString(),
    収支情報: {
      投資枚数: 0,
      回収枚数: 0,
      差枚数: 0
    },
    初期スナップショット: {
      有効: false,
      通常ゲーム数: 0,
      AT初当たり回数: 0,
      CZ突入回数: 0,
      CZ成功回数: 0,
      メモ: ""
    },
    イベントリスト: []
  };
}

/**
 * 新規イベントオブジェクト生成
 */
export function シンキ_イベント作成(パラメータ) {
  return {
    イベントID: "evt_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    連番: パラメータ.連番 || 1,
    タイムスタンプ: Date.now(),
    通常ゲーム数: パラメータ.通常ゲーム数 ?? 0,
    ポイント数: パラメータ.ポイント数 ?? 0,
    状態: パラメータ.状態 || ジョウタイ.通常,
    種別: パラメータ.種別,
    タイトル: パラメータ.タイトル || "",
    詳細: パラメータ.詳細 || {}
  };
}
