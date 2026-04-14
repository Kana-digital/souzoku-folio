import { AssetCategoryId } from '../types';

export interface CategoryDef {
  id: AssetCategoryId;
  label: string;
  icon: string;   // Sprint 2 で SVG アイコンに置き換え予定
  color: string;
}

/** 8 資産カテゴリ定義 */
export const CATEGORIES: CategoryDef[] = [
  { id: 'deposit',    label: '預貯金',         icon: '🏦', color: '#4A90D9' },
  { id: 'stock',      label: '株式・投資信託',  icon: '📈', color: '#50C878' },
  { id: 'bond',       label: '債券',           icon: '📜', color: '#9B59B6' },
  { id: 'insurance',  label: '生命保険',        icon: '🛡️', color: '#E67E22' },
  { id: 'realestate', label: '不動産',          icon: '🏠', color: '#E74C3C' },
  { id: 'metal',      label: '貴金属',          icon: '✨', color: '#F1C40F' },
  { id: 'crypto',     label: '暗号資産',        icon: '🪙', color: '#1ABC9C' },
  { id: 'other',      label: 'その他',          icon: '📦', color: '#95A5A6' },
];

/** ID → CategoryDef の辞書 */
export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
) as Record<AssetCategoryId, CategoryDef>;
