import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Platform,
  Modal,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { CATEGORY_MAP } from '../constants/categories';
import { GUIDES, CategoryGuide } from '../constants/guides';
import { DisclaimerFooter } from '../components/DisclaimerFooter';

type LegalPage = 'privacy' | 'terms' | null;

const LEGAL_CONTENT = {
  privacy: {
    title: 'プライバシーポリシー',
    updated: '最終更新日: 2026年4月14日',
    sections: [
      { title: '', body: '想続フォリオ（以下「本アプリ」）は、大切な方への備忘録として、ご自身で情報を整理・記録するためのアプリです。本ポリシーは、本アプリにおけるデータの取り扱いについて説明します。' },
      { title: '1. 本アプリが扱うデータと保存場所', body: '本アプリに入力された情報（名称、カテゴリ、金額、メモ等）は、お使いの端末内にのみ保存されます。外部のサーバーに送信されることはありません。インターネット接続がなくてもお使いいただけます。\n\nアカウント登録は不要です。生体認証（Face ID / Touch ID 等）による画面ロックは、すべて端末上で処理されます。\n\n無料プランではGoogle AdMobによる広告が表示されます。パーソナライズ広告は無効にしており、追跡型の広告は配信されません。\n\nプレミアムプラン（広告非表示）の購入はApple App Store / Google Play Storeを通じて処理されます。決済情報が運営者に届くことはありません。' },
      { title: '2. プレミアムプランについて', body: 'プレミアムプラン（¥110/月 または ¥980/年）に加入すると広告が非表示になり、広告関連のデータ送信も停止します。' },
      { title: '3. 外部サービスとの連携', body: '本アプリはRevenueCat（課金状態の管理）およびGoogle AdMob（無料プランの広告表示）を利用しています。いずれも機能提供に必要な範囲でのみ利用しており、入力されたデータを販売・共有することはありません。' },
      { title: '4. データの削除', body: 'アプリを削除（アンインストール）すると、端末内のデータは消去されます。' },
      { title: '5. ポリシーの変更', body: '本ポリシーは予告なく変更する場合があります。' },
    ],
  },
  terms: {
    title: '利用規約',
    updated: '最終更新日: 2026年4月14日',
    sections: [
      { title: '', body: '本利用規約は、想続フォリオ（以下「本アプリ」）のご利用条件を定めるものです。' },
      { title: '1. 本アプリについて', body: '本アプリは、大切な方への備忘録として、ご自身で情報を整理・記録するためのツールです。法律・税務・財務に関する専門的な助言を提供するものではありません。具体的な手続や判断については、必ず司法書士・税理士・弁護士等の専門家にご相談ください。' },
      { title: 'ご注意', body: '本アプリに表示される手続ガイド等の情報は、一般的な参考情報です。これらの情報に基づいて行った行為について、運営者は責任を負いかねます。' },
      { title: '2. 料金', body: '【無料プラン】基本機能はすべて無料でお使いいただけます。広告が表示されます。\n\n【プレミアムプラン】月額¥110 または 年額¥980 で広告が非表示になります。\n\nサブスクリプションは期間終了の24時間前までに解約されない場合、自動的に更新されます。解約はアプリ内またはApp Store / Google Playの設定から行えます。' },
      { title: '3. データについて', body: '入力されたデータの正確性や管理はご自身の責任でお願いいたします。端末の故障・紛失等によるデータの消失について、運営者の故意または重大な過失がある場合を除き、責任を負いかねます。' },
      { title: '4. 禁止事項', body: '本アプリの逆コンパイル・リバースエンジニアリング、不正アクセス、本アプリを利用した違法行為はお控えください。' },
      { title: '5. サービスの変更・終了', body: '運営者は本アプリの内容を変更、または提供を終了する場合があります。' },
      { title: '6. 準拠法', body: '本規約は日本法に準拠します。' },
    ],
  },
} as const;

interface Props {
  onPdfPress?: () => void;
  pdfLoading?: boolean;
  isPremium?: boolean;
  onCancelSubscription?: () => void;
  onPurchasePremium?: (period: 'monthly' | 'yearly') => void;
}

export function GuideScreen({ onPdfPress, pdfLoading, isPremium, onCancelSubscription, onPurchasePremium }: Props) {
  const [selectedGuide, setSelectedGuide] = useState<CategoryGuide | null>(null);
  const [legalPage, setLegalPage] = useState<LegalPage>(null);

  if (selectedGuide) {
    const cat = CATEGORY_MAP[selectedGuide.categoryId];
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* 免責注意書き */}
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>
              以下は一般的な情報です。個別のケースは必ず専門家にご相談ください。
            </Text>
          </View>

          {/* ヘッダー */}
          <View style={styles.guideHeader}>
            <Text style={styles.guideHeaderIcon}>{cat?.icon ?? '📦'}</Text>
            <Text style={styles.guideHeaderTitle}>{selectedGuide.title}</Text>
          </View>

          {/* 概要 */}
          <Text style={styles.guideOverview}>{selectedGuide.overview}</Text>

          {/* 手続ステップ */}
          <Text style={styles.sectionTitle}>手続の流れ</Text>
          {selectedGuide.steps.map((s) => (
            <View key={s.step} style={styles.stepCard}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{s.step}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepDetail}>{s.detail}</Text>
              </View>
            </View>
          ))}

          {/* 戻るボタン */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedGuide(null)}
          >
            <Text style={styles.backButtonText}>← カテゴリ一覧に戻る</Text>
          </TouchableOpacity>
        </ScrollView>
        <DisclaimerFooter />
      </View>
    );
  }

  // カテゴリ選択画面
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* 免責注意書き */}
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            一般的な手続の流れをご案内しています。個別のケースは司法書士・税理士・弁護士にご相談ください。
          </Text>
        </View>

        {/* カテゴリ別ガイド */}
        <Text style={styles.sectionTitle}>カテゴリ別の相続手続等</Text>
        {GUIDES.map((guide) => {
          const cat = CATEGORY_MAP[guide.categoryId];
          return (
            <TouchableOpacity
              key={guide.categoryId}
              style={styles.guideCard}
              onPress={() => setSelectedGuide(guide)}
              testID={`guide-${guide.categoryId}`}
            >
              <Text style={styles.guideCardIcon}>{cat?.icon ?? '📦'}</Text>
              <View style={styles.guideCardInfo}>
                <Text style={styles.guideCardTitle}>{guide.title}</Text>
                <Text style={styles.guideCardSteps}>
                  {guide.steps.length}ステップ
                </Text>
              </View>
              <Text style={styles.guideCardArrow}>›</Text>
            </TouchableOpacity>
          );
        })}

        {/* PDF出力 */}
        {onPdfPress && (
          <TouchableOpacity
            style={styles.pdfButton}
            onPress={onPdfPress}
            disabled={pdfLoading}
            testID="pdf-export"
          >
            <Text style={styles.pdfIcon}>📄</Text>
            <View style={styles.pdfInfo}>
              <Text style={styles.pdfTitle}>
                {pdfLoading ? 'PDF生成中...' : '財産情報をPDF出力'}
              </Text>
              <Text style={styles.pdfSub}>家族に渡す資料を作成</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* プラン・解約セクション */}
        <View style={styles.planSection}>
          <Text style={styles.planSectionTitle}>プラン</Text>
          <TouchableOpacity
            style={styles.planCard}
            activeOpacity={isPremium ? 1 : 0.7}
            onPress={() => {
              if (isPremium) return;
              Alert.alert(
                'プレミアムプラン',
                '広告を非表示にできます。',
                [
                  { text: 'キャンセル', style: 'cancel' },
                  {
                    text: '月額 ¥110',
                    onPress: () => onPurchasePremium?.('monthly'),
                  },
                  {
                    text: '年額 ¥980（お得）',
                    onPress: () => onPurchasePremium?.('yearly'),
                  },
                ],
              );
            }}
            testID="plan-card"
          >
            <View style={styles.planRow}>
              <Text style={styles.planLabel}>現在のプラン</Text>
              <Text style={[styles.planValue, isPremium && styles.planValuePremium]}>
                {isPremium ? 'プレミアム（広告なし）' : '無料プラン'}
              </Text>
            </View>
            {!isPremium && (
              <Text style={styles.planUpgradeHint}>タップしてプレミアムに変更</Text>
            )}
          </TouchableOpacity>
          {isPremium && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                Alert.alert(
                  'プレミアムプランの解約',
                  Platform.OS === 'ios'
                    ? 'App Storeのサブスクリプション管理画面で解約できます。解約後も期間終了まで広告なしでご利用いただけます。\n\nApp Storeの設定を開きますか？'
                    : 'Google Playのサブスクリプション管理画面で解約できます。解約後も期間終了まで広告なしでご利用いただけます。\n\nGoogle Playの設定を開きますか？',
                  [
                    { text: 'キャンセル', style: 'cancel' },
                    {
                      text: '設定を開く',
                      onPress: () => {
                        if (Platform.OS === 'ios') {
                          Linking.openURL('https://apps.apple.com/account/subscriptions');
                        } else {
                          Linking.openURL('https://play.google.com/store/account/subscriptions');
                        }
                      },
                    },
                    ...(onCancelSubscription ? [{
                      text: 'アプリ内で解約',
                      style: 'destructive' as const,
                      onPress: onCancelSubscription,
                    }] : []),
                  ],
                );
              }}
              testID="cancel-subscription"
            >
              <Text style={styles.cancelButtonText}>プレミアムプランを解約</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* プラポリ・利用規約 */}
        <View style={styles.legalSection}>
          <TouchableOpacity onPress={() => setLegalPage('privacy')}>
            <Text style={styles.legalLink}>プライバシーポリシー</Text>
          </TouchableOpacity>
          <Text style={styles.legalDivider}>|</Text>
          <TouchableOpacity onPress={() => setLegalPage('terms')}>
            <Text style={styles.legalLink}>利用規約</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <DisclaimerFooter />

      {/* プラポリ・利用規約モーダル */}
      <Modal visible={legalPage !== null} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.legalModal}>
          <View style={styles.legalModalHeader}>
            <Text style={styles.legalModalTitle}>
              {legalPage ? LEGAL_CONTENT[legalPage].title : ''}
            </Text>
            <TouchableOpacity onPress={() => setLegalPage(null)}>
              <Text style={styles.legalModalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.legalModalScroll}>
            {legalPage && (
              <>
                <Text style={styles.legalUpdated}>{LEGAL_CONTENT[legalPage].updated}</Text>
                {LEGAL_CONTENT[legalPage].sections.map((sec, i) => (
                  <View key={i} style={styles.legalSectionBlock}>
                    {sec.title !== '' && (
                      <Text style={[
                        styles.legalSectionTitle,
                        sec.title === '重要' || sec.title === '免責事項'
                          ? styles.legalWarningTitle : null,
                      ]}>
                        {sec.title}
                      </Text>
                    )}
                    <Text style={[
                      styles.legalSectionBody,
                      (sec.title === '重要' || sec.title === '免責事項')
                        ? styles.legalWarningBody : null,
                    ]}>
                      {sec.body}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    padding: 16,
    paddingBottom: 24,
  },
  warningCard: {
    backgroundColor: COLORS.warning + '15',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
    marginBottom: 16,
  },
  warningText: {
    color: COLORS.warning,
    fontSize: 12,
    lineHeight: 18,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },
  // ガイドカード
  guideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  guideCardIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  guideCardInfo: {
    flex: 1,
  },
  guideCardTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  guideCardSteps: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  guideCardArrow: {
    color: COLORS.textMuted,
    fontSize: 24,
  },
  // ガイド詳細
  guideHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  guideHeaderIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  guideHeaderTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  guideOverview: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepDetail: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  backButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: COLORS.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  // PDF出力ボタン
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent + '18',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: COLORS.accent + '40',
  },
  pdfIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  pdfInfo: {
    flex: 1,
  },
  pdfTitle: {
    color: COLORS.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  pdfSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  // プランセクション
  planSection: {
    marginTop: 32,
  },
  planSectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  planCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  planValue: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  planValuePremium: {
    color: COLORS.accent,
  },
  planUpgradeHint: {
    color: COLORS.accent,
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.error + '60',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600',
  },
  // プラポリ・利用規約
  legalSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  legalLink: {
    color: COLORS.textMuted,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  legalDivider: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginHorizontal: 8,
  },
  // プラポリ・利用規約モーダル
  legalModal: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  legalModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    backgroundColor: COLORS.surface,
  },
  legalModalTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: 'bold',
  },
  legalModalClose: {
    color: COLORS.textSecondary,
    fontSize: 20,
    padding: 4,
  },
  legalModalScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  legalUpdated: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 16,
  },
  legalSectionBlock: {
    marginBottom: 16,
  },
  legalSectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  legalWarningTitle: {
    color: COLORS.warning,
  },
  legalSectionBody: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  legalWarningBody: {
    backgroundColor: COLORS.warning + '15',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
    overflow: 'hidden',
  },
});
