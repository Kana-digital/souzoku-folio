/**
 * AdMob 広告サービス（想いフォリオ版）
 *
 * react-native-google-mobile-ads を使用。
 * Expo Go ではネイティブSDKが利用できないため、
 * SDKが見つからない場合はフォールバックモード（プレースホルダー表示）で動作する。
 */

import { Platform } from 'react-native';

// Expo Go 判定: react-native-google-mobile-ads の require で失敗した場合の
// フォールバックで判定するため、ここでは固定で false にしておく。
// Expo Go であれば下の require が失敗して自動的にプレースホルダーモードになる。
const isExpoGo = false;

// 広告ユニットID
const AD_UNIT_IDS = {
  interstitial: Platform.select({
    ios: __DEV__
      ? 'ca-app-pub-3940256099942544/4411468910'
      : 'ca-app-pub-1593750663073581/7199826601',
    android: __DEV__
      ? 'ca-app-pub-3940256099942544/1033173712'
      : 'ca-app-pub-1593750663073581/7768457800',
  }) ?? '',
  rewardedInterstitial: Platform.select({
    ios: __DEV__
      ? 'ca-app-pub-3940256099942544/6978759866'
      : 'ca-app-pub-1593750663073581/7255666927',
    android: __DEV__
      ? 'ca-app-pub-3940256099942544/5354046379'
      : 'ca-app-pub-1593750663073581/8754236414',
  }) ?? '',
};

let sdkAvailable = false;
let MobileAds: any = null;
let InterstitialAd: any = null;
let RewardedInterstitialAd: any = null;
let AdEventType: any = null;
let RewardedAdEventType: any = null;

let loadedInterstitial: any = null;
let loadedRewarded: any = null;

export async function initAdMob(): Promise<boolean> {
  if (isExpoGo) {
    console.log('[AdMob] Expo Go → プレースホルダーモード');
    return false;
  }
  try {
    const admob = require('react-native-google-mobile-ads');
    MobileAds = admob.default ?? admob.MobileAds;
    InterstitialAd = admob.InterstitialAd;
    RewardedInterstitialAd = admob.RewardedInterstitialAd;
    AdEventType = admob.AdEventType;
    RewardedAdEventType = admob.RewardedAdEventType;

    await MobileAds().initialize();
    sdkAvailable = true;
    console.log('[AdMob] 初期化完了');

    preloadInterstitial();
    preloadRewarded();
    return true;
  } catch (e) {
    console.log('[AdMob] SDK未検出 → プレースホルダーモード');
    return false;
  }
}

// ── インタースティシャル ──

function preloadInterstitial() {
  if (!sdkAvailable || !InterstitialAd) return;
  try {
    const ad = InterstitialAd.createForAdRequest(AD_UNIT_IDS.interstitial, {
      requestNonPersonalizedAdsOnly: true,
    });
    ad.addAdEventListener(AdEventType.LOADED, () => { loadedInterstitial = ad; });
    ad.addAdEventListener(AdEventType.CLOSED, () => { loadedInterstitial = null; preloadInterstitial(); });
    ad.addAdEventListener(AdEventType.ERROR, () => { loadedInterstitial = null; setTimeout(preloadInterstitial, 5000); });
    ad.load();
  } catch {}
}

export async function showInterstitial(): Promise<boolean> {
  if (!sdkAvailable || !loadedInterstitial) return false;
  try {
    await loadedInterstitial.show();
    return true;
  } catch {
    loadedInterstitial = null;
    preloadInterstitial();
    return false;
  }
}

// ── リワードインタースティシャル（動画広告） ──

function preloadRewarded() {
  if (!sdkAvailable || !RewardedInterstitialAd) return;
  try {
    const ad = RewardedInterstitialAd.createForAdRequest(AD_UNIT_IDS.rewardedInterstitial, {
      requestNonPersonalizedAdsOnly: true,
    });
    ad.addAdEventListener(RewardedAdEventType.LOADED, () => { loadedRewarded = ad; });
    ad.addAdEventListener(AdEventType.CLOSED, () => { loadedRewarded = null; preloadRewarded(); });
    ad.addAdEventListener(AdEventType.ERROR, () => { loadedRewarded = null; setTimeout(preloadRewarded, 5000); });
    ad.load();
  } catch {}
}

export async function showRewardedInterstitial(): Promise<boolean> {
  if (!sdkAvailable || !loadedRewarded) return false;
  try {
    await loadedRewarded.show();
    return true;
  } catch {
    loadedRewarded = null;
    preloadRewarded();
    return false;
  }
}

export function isAdMobAvailable(): boolean { return sdkAvailable; }
export function isInterstitialReady(): boolean { return !!loadedInterstitial; }
export function isRewardedReady(): boolean { return !!loadedRewarded; }
