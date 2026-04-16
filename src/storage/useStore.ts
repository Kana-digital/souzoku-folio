import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset, AppData, AssetCategoryId } from '../types';

const STORAGE_KEY = 'souzoku_app_data';

const DEFAULT_DATA: AppData = {
  assets: [],
  isAuthEnabled: true,
  categoryColors: {},
};

/**
 * AsyncStorage 永続化フック
 * アプリ起動時に自動でデータを読み込み、
 * 変更時に自動で保存する。
 *
 * 起動時マイグレーション:
 *   v1.0.0 でスクショ撮影用の demo data (id: `demo_...`) が混入していたため、
 *   初回起動時にそれらを除去する。ユーザーが追加した資産は `asset_...` prefix
 *   なので影響を受けない。
 */
export function useStore() {
  const [data, setData] = useState<AppData>(DEFAULT_DATA);
  const [isLoaded, setIsLoaded] = useState(false);

  // 起動時にデータ読み込み
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          // バリデーション: assets が配列かどうか
          if (parsed && Array.isArray(parsed.assets)) {
            // マイグレーション: demo_ prefix の asset を除去
            const cleanedAssets = parsed.assets.filter(
              (a: Asset) => !a?.id?.startsWith('demo_')
            );
            const migrated = cleanedAssets.length !== parsed.assets.length;

            const nextData: AppData = {
              assets: cleanedAssets,
              isAuthEnabled: parsed.isAuthEnabled ?? true,
              categoryColors: parsed.categoryColors ?? {},
            };
            setData(nextData);

            // クリーニングされた場合は永続化しておく
            if (migrated) {
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
            }
          }
        }
      } catch (e) {
        console.warn('Failed to load data from AsyncStorage:', e);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  // 永続化ヘルパー
  const persist = useCallback(async (newData: AppData) => {
    setData(newData);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    } catch (e) {
      console.warn('Failed to save data to AsyncStorage:', e);
    }
  }, []);

  // --- CRUD ---

  const addAsset = useCallback(
    (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const newAsset: Asset = {
        ...asset,
        id: `asset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        createdAt: now,
        updatedAt: now,
      };
      const newData = { ...data, assets: [...data.assets, newAsset] };
      persist(newData);
      return newAsset;
    },
    [data, persist]
  );

  const updateAsset = useCallback(
    (id: string, updates: Partial<Pick<Asset, 'categoryId' | 'title' | 'amount'>>) => {
      const newAssets = data.assets.map((a) =>
        a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
      );
      persist({ ...data, assets: newAssets });
    },
    [data, persist]
  );

  const deleteAsset = useCallback(
    (id: string) => {
      const newAssets = data.assets.filter((a) => a.id !== id);
      persist({ ...data, assets: newAssets });
    },
    [data, persist]
  );

  const setAuthEnabled = useCallback(
    (enabled: boolean) => {
      persist({ ...data, isAuthEnabled: enabled });
    },
    [data, persist]
  );

  /** カテゴリのセクター色を変更 */
  const setCategoryColor = useCallback(
    (categoryId: AssetCategoryId, color: string | null) => {
      const newColors = { ...data.categoryColors };
      if (color) {
        newColors[categoryId] = color;
      } else {
        delete newColors[categoryId];
      }
      persist({ ...data, categoryColors: newColors });
    },
    [data, persist]
  );

  return {
    assets: data.assets,
    isAuthEnabled: data.isAuthEnabled,
    categoryColors: data.categoryColors,
    isLoaded,
    addAsset,
    updateAsset,
    deleteAsset,
    setAuthEnabled,
    setCategoryColor,
  };
}
