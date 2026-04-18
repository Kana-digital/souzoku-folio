/** 資産カテゴリID */
export type AssetCategoryId =
  | 'deposit'       // 預貯金
  | 'stock'         // 株式・投資信託
  | 'bond'          // 債券
  | 'insurance'     // 生命保険
  | 'realestate'    // 不動産
  | 'metal'         // 貴金属
  | 'crypto'        // 暗号資産
  | 'other';        // その他

/** 資産1件のデータモデル */
export interface Asset {
  id: string;
  categoryId: AssetCategoryId;
  title: string;           // 資産名（例: 「○○銀行 普通預金」）
  amount: number;          // 金額（円）
  createdAt: string;       // ISO 8601
  updatedAt: string;       // ISO 8601
}

/** カテゴリ別カスタムカラー */
export type CategoryColors = Partial<Record<AssetCategoryId, string>>;

/** アプリ全体の永続化データ */
export interface AppData {
  assets: Asset[];
  isAuthEnabled: boolean;  // 生体認証の有効/無効
  categoryColors: CategoryColors; // セクターのカスタム色
}

/** 新規登録フォームの入力値 */
export interface AssetFormValues {
  categoryId: AssetCategoryId | null;
  title: string;
  amount: string;  // テキスト入力なので string
}

// ── サブスクリプション関連 ──

export type PlanId = 'free' | 'premium';

export interface SubscriptionState {
  planId: PlanId;
  entitlementId: string | null;
  expiresAt: string | null;
}

export interface AdState {
  actionCount: number;
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  adFree: boolean;
}
