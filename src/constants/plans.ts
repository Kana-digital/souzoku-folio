/**
 * 想いフォリオ 広告設定
 */

/**
 * 広告表示ルール
 * - 資産の追加・編集ごとに画像広告を表示
 * - 3回ごとに動画広告を表示
 */
export const AD_CONFIG = {
  /** 動画広告を表示するアクション間隔 */
  videoInterval: 3,
  /** 画像広告の表示秒数 */
  imageAdDurationMs: 3000,
  /** 動画広告の最低視聴秒数 */
  videoAdMinDurationMs: 5000,
} as const;
