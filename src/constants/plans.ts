/**
 * 想続フォリオ プラン・広告設定
 */

export interface PlanDefinition {
  id: string;
  name: string;
  adFree: boolean;
}

export const PLANS: Record<string, PlanDefinition> = {
  free: {
    id: 'free',
    name: '無料プラン',
    adFree: false,
  },
  premium: {
    id: 'premium',
    name: 'プレミアム（広告なし）',
    adFree: true,
  },
};

/** 価格表示用 */
export const PRICING = {
  monthly: { label: '月額', price: 110, display: '¥110/月' },
  yearly: { label: '年額（一括）', price: 980, display: '¥980/年', savings: '26%お得' },
} as const;

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
