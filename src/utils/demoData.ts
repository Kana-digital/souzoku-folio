/**
 * スクリーンショット撮影用のデモデータ
 * 使い終わったらこのファイルを削除し、useStore.tsのloadDemoData()呼び出しもrevertすること
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppData, Asset } from '../types';

const STORAGE_KEY = 'souzoku_app_data';

const now = new Date().toISOString();

function makeAsset(
  categoryId: Asset['categoryId'],
  title: string,
  amount: number,
  idx: number
): Asset {
  return {
    id: `demo_${categoryId}_${idx}`,
    categoryId,
    title,
    amount,
    createdAt: now,
    updatedAt: now,
  };
}

const DEMO_ASSETS: Asset[] = [
  // 預貯金
  makeAsset('deposit', '三井住友銀行 普通預金', 3200000, 1),
  makeAsset('deposit', 'ゆうちょ銀行 通常貯金', 1500000, 2),
  makeAsset('deposit', 'みずほ銀行 定期預金', 5000000, 3),
  // 株式・投資信託
  makeAsset('stock', '全世界株式インデックス', 4500000, 1),
  makeAsset('stock', 'トヨタ自動車株', 1800000, 2),
  makeAsset('stock', 'NISA口座', 2400000, 3),
  // 債券
  makeAsset('bond', '個人向け国債（変動10年）', 2000000, 1),
  // 生命保険
  makeAsset('insurance', '終身保険（第一生命）', 8000000, 1),
  makeAsset('insurance', '医療保険（アフラック）', 1200000, 2),
  // 不動産
  makeAsset('realestate', '自宅マンション（東京都渋谷区）', 45000000, 1),
  makeAsset('realestate', '相続予定の実家（千葉県）', 18000000, 2),
  // 貴金属
  makeAsset('metal', '金地金 500g', 1800000, 1),
  // 暗号資産
  makeAsset('crypto', 'ビットコイン（0.5 BTC）', 3500000, 1),
  // その他
  makeAsset('other', '車両（トヨタ プリウス）', 1500000, 1),
  makeAsset('other', 'ゴルフ会員権', 800000, 2),
];

const DEMO_DATA: AppData = {
  assets: DEMO_ASSETS,
  isAuthEnabled: false, // スクショ撮影時は認証OFF
  categoryColors: {},
};

/**
 * デモデータをAsyncStorageに投入する
 * useStore.ts の loadLocalData() 内で AsyncStorage.getItem() より前に呼ぶこと
 */
export async function loadDemoData(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_DATA));
    console.log('Demo data loaded:', DEMO_ASSETS.length, 'assets');
  } catch (e) {
    console.warn('Failed to load demo data:', e);
  }
}
