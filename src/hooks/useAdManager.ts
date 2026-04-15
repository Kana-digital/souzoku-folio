import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AD_CONFIG } from '../constants/plans';

const AD_KEY = 'souzoku_ad_state';

interface AdState {
  actionCount: number;
}

/**
 * 広告管理hook
 *
 * - 資産の追加・編集ごとに画像広告を表示
 * - 3回ごとに動画広告を表示
 */
export function useAdManager() {
  const [adState, setAdState] = useState<AdState>({ actionCount: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const rawAd = await AsyncStorage.getItem(AD_KEY);
        if (rawAd) {
          setAdState(JSON.parse(rawAd));
        }
      } catch {}
      setIsLoaded(true);
    })();
  }, []);

  /**
   * アクション記録 → 広告タイプを返す
   * @returns 'image' | 'video' | null
   */
  const recordAction = useCallback(async (): Promise<'image' | 'video' | null> => {
    const newCount = adState.actionCount + 1;
    const newState: AdState = { actionCount: newCount };
    setAdState(newState);
    await AsyncStorage.setItem(AD_KEY, JSON.stringify(newState));

    // 3回ごとに動画広告
    if (newCount % AD_CONFIG.videoInterval === 0) {
      return 'video';
    }
    return 'image';
  }, [adState.actionCount]);

  /** デバッグ用リセット */
  const resetAds = useCallback(async () => {
    setAdState({ actionCount: 0 });
    await AsyncStorage.setItem(AD_KEY, JSON.stringify({ actionCount: 0 }));
  }, []);

  return {
    isLoaded,
    adState,
    recordAction,
    resetAds,
  };
}
