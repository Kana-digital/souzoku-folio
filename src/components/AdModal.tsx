import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { AD_CONFIG } from '../constants/plans';
import { isAdMobAvailable, showInterstitial, showRewardedInterstitial } from '../services/admob';

type AdType = 'image' | 'video';

interface Props {
  visible: boolean;
  adType: AdType;
  onClose: () => void;
  onRemoveAds?: () => void;
}

/**
 * 広告表示モーダル
 *
 * AdMob SDK 利用可能 → ネイティブ広告を表示し、閉じたら自動でモーダルも閉じる
 * SDK 不可（Expo Go等） → プレースホルダーUI + カウントダウン後に閉じるボタン
 */
export function AdModal({ visible, adType, onClose, onRemoveAds }: Props) {
  const [canClose, setCanClose] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showFallback, setShowFallback] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptedRef = useRef(false);

  const requiredSeconds = adType === 'video'
    ? Math.ceil(AD_CONFIG.videoAdMinDurationMs / 1000)
    : Math.ceil(AD_CONFIG.imageAdDurationMs / 1000);

  useEffect(() => {
    if (!visible) {
      setCanClose(false);
      setCountdown(requiredSeconds);
      setShowFallback(false);
      attemptedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // AdMob SDK が使える場合
    if (isAdMobAvailable() && !attemptedRef.current) {
      attemptedRef.current = true;
      const showAd = adType === 'video' ? showRewardedInterstitial : showInterstitial;
      showAd().then((shown) => {
        if (shown) {
          onClose();
        } else {
          setShowFallback(true);
          startCountdown();
        }
      });
      return;
    }

    // SDK不可 → プレースホルダー
    setShowFallback(true);
    startCountdown();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible]);

  const startCountdown = () => {
    setCountdown(requiredSeconds);
    setCanClose(false);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanClose(true);
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  if (!visible || !showFallback) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* 広告プレースホルダー */}
          <View style={[styles.adArea, adType === 'video' && styles.adAreaVideo]}>
            {adType === 'video' ? (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderIcon}>🎬</Text>
                <Text style={styles.placeholderTitle}>動画広告</Text>
                <Text style={styles.placeholderSub}>ここに動画広告が表示されます</Text>
                <ActivityIndicator color={COLORS.accent} size="small" style={{ marginTop: 8 }} />
              </View>
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderIcon}>📢</Text>
                <Text style={styles.placeholderTitle}>広告</Text>
                <Text style={styles.placeholderSub}>ここに広告が表示されます</Text>
              </View>
            )}
          </View>

          {/* フッター */}
          <View style={styles.footer}>
            {canClose ? (
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>✕ 閉じる</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.countdownArea}>
                <Text style={styles.countdownText}>{countdown}秒後に閉じられます</Text>
              </View>
            )}
            {onRemoveAds && (
              <TouchableOpacity style={styles.removeAdsBtn} onPress={onRemoveAds}>
                <Text style={styles.removeAdsText}>¥100/月で広告を非表示にする</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 360,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
  adArea: {
    height: 250,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adAreaVideo: {
    height: 300,
  },
  placeholder: {
    alignItems: 'center',
    gap: 6,
  },
  placeholderIcon: {
    fontSize: 40,
  },
  placeholderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  placeholderSub: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  footer: {
    padding: 14,
    gap: 10,
  },
  closeBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  countdownArea: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  removeAdsBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  removeAdsText: {
    fontSize: 11,
    color: COLORS.accent,
    textDecorationLine: 'underline',
  },
});
