import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { PRICING } from '../constants/plans';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onPurchase: (period: 'monthly' | 'yearly') => Promise<boolean>;
  onRestore: () => Promise<boolean>;
}

const BENEFITS = [
  { icon: '🚫', title: '広告なし', desc: '画像広告・動画広告が一切表示されません' },
  { icon: '⚡', title: 'スムーズ操作', desc: '追加・編集がストレスフリーに' },
  { icon: '💜', title: 'アプリを応援', desc: '開発・維持の支援になります' },
];

export const PaywallModal = ({
  visible,
  onClose,
  onPurchase,
  onRestore,
}: PaywallModalProps) => {
  const [selected, setSelected] = useState<'yearly' | 'monthly'>('yearly');
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const timeoutPromise = new Promise<boolean>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 30000)
      );
      const success = await Promise.race([onPurchase(selected), timeoutPromise]);
      if (success) {
        onClose();
      } else {
        Alert.alert(
          '購入できませんでした',
          '購入がキャンセルされたか、処理中にエラーが発生しました。もう一度お試しください。',
        );
      }
    } catch (e: any) {
      if (e.message === 'timeout') {
        Alert.alert('タイムアウト', '購入処理に時間がかかっています。通信環境を確認してもう一度お試しください。');
      } else {
        Alert.alert('エラー', '購入処理中にエラーが発生しました。もう一度お試しください。');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const success = await onRestore();
      if (success) {
        onClose();
      } else {
        Alert.alert('復元できませんでした', '過去の購入が見つかりませんでした。');
      }
    } catch {
      Alert.alert('エラー', '復元処理中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* ヘッダー */}
            <Text style={styles.premiumBadge}>✦ 想いフォリオ Pro</Text>
            <Text style={styles.title}>広告なしで快適に</Text>
            <Text style={styles.subtitle}>
              すべての機能はそのまま無料。{'\n'}
              広告だけをオフにできます。
            </Text>

            {/* メリットリスト */}
            <View style={styles.benefitList}>
              {BENEFITS.map((b, i) => (
                <View key={i} style={styles.benefitRow}>
                  <Text style={styles.benefitIcon}>{b.icon}</Text>
                  <View style={styles.benefitText}>
                    <Text style={styles.benefitTitle}>{b.title}</Text>
                    <Text style={styles.benefitDesc}>{b.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* プラン選択 */}
            <View style={styles.planRow}>
              <TouchableOpacity
                style={[styles.planCard, selected === 'yearly' && styles.planCardSelected]}
                onPress={() => setSelected('yearly')}
              >
                {PRICING.yearly.savings && (
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>{PRICING.yearly.savings}</Text>
                  </View>
                )}
                <Text style={styles.planPeriod}>{PRICING.yearly.label}</Text>
                <Text style={styles.planPrice}>{PRICING.yearly.display}</Text>
                <Text style={styles.planMonthly}>
                  月あたり ¥{Math.round(PRICING.yearly.price / 12)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.planCard, selected === 'monthly' && styles.planCardSelected]}
                onPress={() => setSelected('monthly')}
              >
                <Text style={styles.planPeriod}>{PRICING.monthly.label}</Text>
                <Text style={styles.planPrice}>{PRICING.monthly.display}</Text>
                <Text style={styles.planMonthly}> </Text>
              </TouchableOpacity>
            </View>

            {/* 購入ボタン */}
            <TouchableOpacity
              style={[styles.purchaseBtn, loading && styles.purchaseBtnDisabled]}
              onPress={handlePurchase}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.purchaseBtnText}>
                  広告を非表示にする
                </Text>
              )}
            </TouchableOpacity>

            {/* 復元・利用規約 */}
            <TouchableOpacity onPress={handleRestore} disabled={loading}>
              <Text style={styles.restoreText}>購入を復元</Text>
            </TouchableOpacity>
            <Text style={styles.termsText}>
              • サブスクリプション名: 想いフォリオ Pro{'\n'}
              • 月額プラン: ¥{PRICING.monthly.price}/月（1ヶ月ごとの自動更新）{'\n'}
              • 年額プラン: ¥{PRICING.yearly.price}/年（1年ごとの自動更新）{'\n'}
              • お支払いは購入確認時に{Platform.OS === 'ios' ? 'Apple ID' : 'Google Play'}アカウントに請求されます{'\n'}
              • サブスクリプションは現在の期間終了の24時間前までに自動更新をオフにしない限り自動的に更新されます{'\n'}
              • 更新料金は現在の期間終了前24時間以内にアカウントに請求されます{'\n'}
              • {Platform.OS === 'ios'
                  ? '設定アプリ > Apple ID > サブスクリプション'
                  : 'Google Play ストア > お支払いと定期購入'}から管理・自動更新のオフができます{'\n\n'}
              <Text style={styles.termsLink} onPress={() => Linking.openURL('https://kana-digital.github.io/souzoku-folio/terms.html')}>
                利用規約
              </Text>
              {'  '}
              <Text style={styles.termsLink} onPress={() => Linking.openURL('https://kana-digital.github.io/souzoku-folio/privacy.html')}>
                プライバシーポリシー
              </Text>
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingTop: 16,
    paddingBottom: 32,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  closeBtnText: {
    fontSize: 18,
    color: COLORS.textMuted,
  },

  // ── ヘッダー ──
  premiumBadge: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 3,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },

  // ── メリットリスト ──
  benefitList: {
    marginBottom: 20,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  benefitIcon: {
    fontSize: 22,
    width: 36,
    textAlign: 'center',
  },
  benefitText: {
    flex: 1,
    marginLeft: 8,
  },
  benefitTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  benefitDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },

  // ── プラン選択 ──
  planRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  planCard: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  planCardSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent + '0D',
  },
  savingsBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  savingsText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  planPeriod: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
    marginTop: 4,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  planMonthly: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // ── 購入ボタン ──
  purchaseBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  purchaseBtnDisabled: {
    opacity: 0.6,
  },
  purchaseBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
  },

  // ── フッター ──
  restoreText: {
    fontSize: 12,
    color: COLORS.accent,
    textAlign: 'center',
    marginBottom: 12,
  },
  termsText: {
    fontSize: 9,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 14,
  },
  termsLink: {
    color: COLORS.accent,
    textDecorationLine: 'underline',
  },
});
