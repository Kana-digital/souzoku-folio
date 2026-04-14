import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AD_CONFIG } from '../constants/plans';

const AD_KEY = 'souzoku_ad_state';
const SUB_KEY = 'souzoku_subscription';

interface AdState {
  actionCount: number;
}

/**
 * 広告管理hook
 *
 * - 資産の追加・編集ごとに画像広告を表示
 * - 3回ごとに動画広告を表示
 * - プレミアム会員は広告なし
 */
export function useAdManager() {
  const [adState, setAdState] = useState<AdState>({ actionCount: 0 });
  const [isPremium, setIsPremium] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [rawAd, rawSub] = await Promise.all([
          AsyncStorage.getItem(AD_KEY),
          AsyncStorage.getItem(SUB_KEY),
        ]);
        if (rawAd) {
          setAdState(JSON.parse(rawAd));
        }
        if (rawSub) {
          const sub = JSON.parse(rawSub);
          if (sub.planId === 'premium') {
            if (sub.expiresAt && new Date(sub.expiresAt) < new Date()) {
              setIsPremium(false);
            } else {
              setIsPremium(true);
            }
          }
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
    if (isPremium) return null;

    const newCount = adState.actionCount + 1;
    const newState: AdState = { actionCount: newCount };
    setAdState(newState);
    await AsyncStorage.setItem(AD_KEY, JSON.stringify(newState));

    // 3回ごとに動画広告
    if (newCount % AD_CONFIG.videoInterval === 0) {
      return 'video';
    }
    return 'image';
  }, [isPremium, adState.actionCount]);

  /** プレミアム購入（ローカルフォールバック） */
  const purchasePremium = useCallback(async (period: 'monthly' | 'yearly') => {
    const expiresAt = new Date();
    if (period === 'monthly') {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }
    const sub = {
      planId: 'premium',
      entitlementId: `local_${period}`,
      expiresAt: expiresAt.toISOString(),
    };
    setIsPremium(true);
    await AsyncStorage.setItem(SUB_KEY, JSON.stringify(sub));
    return true;
  }, []);

  /** デバッグ用リセット */
  const resetAds = useCallback(async () => {
    setAdState({ actionCount: 0 });
    setIsPremium(false);
    await Promise.all([
      AsyncStorage.setItem(AD_KEY, JSON.stringify({ actionCount: 0 })),
      AsyncStorage.removeItem(SUB_KEY),
    ]);
  }, []);

  return {
    isPremium,
    isLoaded,
    adState,
    recordAction,
    purchasePremium,
    resetAds,
  };
}
