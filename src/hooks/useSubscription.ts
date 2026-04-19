import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlanDefinition, SubscriptionState, AdState } from '../types';
import { PLANS, AD_CONFIG } from '../constants/plans';
import {
  initRevenueCat,
  getOfferings,
  purchasePackage,
  restorePurchases,
  checkSubscription,
  isRCAvailable,
} from '../services/revenueCat';

const SUB_KEY = 'souzoku_subscription';
const AD_KEY = 'souzoku_ad_state';

const DEFAULT_SUB: SubscriptionState = {
  planId: 'free',
  entitlementId: null,
  expiresAt: null,
};

const DEFAULT_AD: AdState = {
  actionCount: 0,
};

/**
 * サブスクリプション + 広告制御hook
 *
 * 広告モデル:
 * - 全機能無料で使える
 * - 資産の追加・編集ごとに画像広告を表示
 * - 3回ごとに動画広告を表示
 * - プレミアム会員（¥100/月 or ¥1,000/年）は広告なし
 */
export function useSubscription() {
  const [sub, setSub] = useState<SubscriptionState>(DEFAULT_SUB);
  const [adState, setAdState] = useState<AdState>(DEFAULT_AD);
  const [isLoaded, setIsLoaded] = useState(false);

  // ── 読み込み + RevenueCat初期化 ──
  useEffect(() => {
    (async () => {
      try {
        await initRevenueCat();

        const [rawSub, rawAd] = await Promise.all([
          AsyncStorage.getItem(SUB_KEY),
          AsyncStorage.getItem(AD_KEY),
        ]);
        if (rawSub) {
          const parsed: SubscriptionState = JSON.parse(rawSub);
          // 開発用ローカル課金が残っている場合はリセット
          if (parsed.entitlementId?.startsWith('local_')) {
            console.warn('[Subscription] ローカル課金状態を検出 → リセット');
            await AsyncStorage.setItem(SUB_KEY, JSON.stringify(DEFAULT_SUB));
            setSub(DEFAULT_SUB);
          } else if (parsed.expiresAt && new Date(parsed.expiresAt) < new Date()) {
            const expired = { ...DEFAULT_SUB };
            await AsyncStorage.setItem(SUB_KEY, JSON.stringify(expired));
            setSub(expired);
          } else {
            setSub(parsed);
          }
        }
        if (rawAd) {
          setAdState(JSON.parse(rawAd));
        }

        // RevenueCat が使える場合、サーバー側の状態を確認して同期
        if (isRCAvailable()) {
          const rcStatus = await checkSubscription();
          if (rcStatus.isPremium) {
            const synced: SubscriptionState = {
              planId: 'premium',
              entitlementId: 'premium_access',
              expiresAt: rcStatus.expiresAt,
            };
            setSub(synced);
            await AsyncStorage.setItem(SUB_KEY, JSON.stringify(synced));
          }
        }
      } catch (e) {
        console.error('Failed to load subscription:', e);
      }
      setIsLoaded(true);
    })();
  }, []);

  const plan: PlanDefinition = useMemo(() => PLANS[sub.planId] ?? PLANS.free, [sub.planId]);
  const isPremium = sub.planId === 'premium';

  // ── 広告を表示すべきか判定 + カウント更新 ──
  const recordAction = useCallback(async (): Promise<'image' | 'video' | null> => {
    if (isPremium) return null;

    const newCount = adState.actionCount + 1;
    const newAdState: AdState = { actionCount: newCount };
    setAdState(newAdState);
    await AsyncStorage.setItem(AD_KEY, JSON.stringify(newAdState));

    if (newCount % AD_CONFIG.videoInterval === 0) {
      return 'video';
    }
    return 'image';
  }, [isPremium, adState.actionCount]);

  // ── 購入処理（RevenueCat対応） ──
  const purchase = useCallback(
    async (period: 'monthly' | 'yearly') => {
      if (isRCAvailable()) {
        try {
          const offering = await getOfferings();
          if (!offering) return false;
          const pkgId = period === 'monthly' ? '$rc_monthly' : '$rc_annual';
          const pkg = offering.availablePackages.find(
            (p: any) => p.packageType === pkgId || p.identifier === pkgId
          ) ?? offering.availablePackages[0];
          if (!pkg) return false;
          const success = await purchasePackage(pkg);
          if (success) {
            const rcStatus = await checkSubscription();
            const newSub: SubscriptionState = {
              planId: 'premium',
              entitlementId: 'premium_access',
              expiresAt: rcStatus.expiresAt,
            };
            setSub(newSub);
            await AsyncStorage.setItem(SUB_KEY, JSON.stringify(newSub));
          }
          return success;
        } catch (e) {
          console.error('[Purchase] RevenueCat購入エラー:', e);
          return false;
        }
      }

      // SDK未導入時 → 購入不可（エラーとして返す）
      console.warn('[Purchase] RevenueCat SDKが利用できないため購入できません');
      return false;
    },
    [],
  );

  // ── 復元処理（RevenueCat対応） ──
  const restore = useCallback(async () => {
    if (isRCAvailable()) {
      try {
        const success = await restorePurchases();
        if (success) {
          const rcStatus = await checkSubscription();
          const newSub: SubscriptionState = {
            planId: 'premium',
            entitlementId: 'premium_access',
            expiresAt: rcStatus.expiresAt,
          };
          setSub(newSub);
          await AsyncStorage.setItem(SUB_KEY, JSON.stringify(newSub));
        }
        return success;
      } catch (e) {
        console.error('[Restore] RevenueCat復元エラー:', e);
        return false;
      }
    }
    return false;
  }, []);

  // ── デバッグ用: リセット ──
  const resetSubscription = useCallback(async () => {
    setSub(DEFAULT_SUB);
    setAdState(DEFAULT_AD);
    await Promise.all([
      AsyncStorage.setItem(SUB_KEY, JSON.stringify(DEFAULT_SUB)),
      AsyncStorage.setItem(AD_KEY, JSON.stringify(DEFAULT_AD)),
    ]);
  }, []);

  return {
    sub,
    plan,
    isPremium,
    isLoaded,
    adState,
    recordAction,
    purchase,
    restore,
    resetSubscription,
  };
}
