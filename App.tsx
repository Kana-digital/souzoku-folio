import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { SwipeWrapper } from './src/components/SwipeWrapper';
import { AdModal } from './src/components/AdModal';
import { HomeScreen } from './src/screens/HomeScreen';
import { ListScreen } from './src/screens/ListScreen';
import { AnalysisScreen } from './src/screens/AnalysisScreen';
import { GuideScreen } from './src/screens/GuideScreen';
import { AddAssetScreen } from './src/screens/AddAssetScreen';
import { AssetDetailScreen } from './src/screens/AssetDetailScreen';
import { useStore } from './src/storage/useStore';
import { useAdManager } from './src/hooks/useAdManager';
import { initAdMob } from './src/services/admob';
import { exportPdf } from './src/services/pdfExport';
import { Asset, AssetCategoryId } from './src/types';
import { COLORS } from './src/constants/colors';

const TABS = ['home', 'list', 'analysis', 'guide'] as const;
type Tab = typeof TABS[number];
type Modal = null | 'add' | { type: 'detail'; asset: Asset };

export default function App() {
  const store = useStore();
  const ad = useAdManager();
  const [tabIndex, setTabIndex] = useState(0);
  const [modal, setModal] = useState<Modal>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  // 広告モーダル
  const [adVisible, setAdVisible] = useState(false);
  const [adType, setAdType] = useState<'image' | 'video'>('image');

  const tab = TABS[tabIndex];

  // AdMob初期化
  useEffect(() => {
    initAdMob();
  }, []);

  // タブスワイプ — 端では動かない
  const canSwipeLeft = tabIndex < TABS.length - 1;
  const canSwipeRight = tabIndex > 0;
  const swipeLeft = useCallback(() => {
    setTabIndex((i) => Math.min(i + 1, TABS.length - 1));
  }, []);
  const swipeRight = useCallback(() => {
    setTabIndex((i) => Math.max(i - 1, 0));
  }, []);

  // 広告表示
  const showAdIfNeeded = useCallback(async () => {
    const type = await ad.recordAction();
    if (type) {
      setAdType(type);
      setAdVisible(true);
    }
  }, [ad]);

  // 資産追加（広告付き）
  const handleAddAsset = useCallback(async (data: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => {
    store.addAsset(data);
    setModal(null);
    await showAdIfNeeded();
  }, [store, showAdIfNeeded]);

  // 資産更新（広告付き）
  const handleUpdateAsset = useCallback(async (id: string, updates: { categoryId?: AssetCategoryId; title?: string; amount?: number }) => {
    store.updateAsset(id, updates);
    await showAdIfNeeded();
  }, [store, showAdIfNeeded]);

  // 起動時に生体認証
  useEffect(() => {
    if (!store.isLoaded) return;
    (async () => {
      if (!store.isAuthEnabled) {
        setIsAuthenticated(true);
        setAuthChecking(false);
        return;
      }
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) {
        setIsAuthenticated(true);
        setAuthChecking(false);
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: '想続フォリオを開く',
        cancelLabel: 'キャンセル',
        disableDeviceFallback: false,
      });
      setIsAuthenticated(result.success);
      setAuthChecking(false);
    })();
  }, [store.isLoaded, store.isAuthEnabled]);

  // PDF出力
  const handleExportPdf = async () => {
    if (store.assets.length === 0) {
      Alert.alert('資産が登録されていません', 'まず資産を登録してからPDFを出力してください。');
      return;
    }
    setPdfLoading(true);
    try {
      await exportPdf(store.assets);
    } catch (e: any) {
      Alert.alert('PDF出力エラー', e?.message ?? '不明なエラーが発生しました');
    } finally {
      setPdfLoading(false);
    }
  };

  // ローディング
  if (!store.isLoaded || authChecking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>読み込み中...</Text>
        <StatusBar style="light" />
      </View>
    );
  }

  // 認証失敗
  if (!isAuthenticated) {
    const retryAuth = async () => {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: '想続フォリオを開く',
        cancelLabel: 'キャンセル',
        disableDeviceFallback: false,
      });
      setIsAuthenticated(result.success);
    };
    return (
      <View style={styles.lockContainer}>
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={styles.lockTitle}>想続フォリオ</Text>
        <Text style={styles.lockMessage}>認証が必要です</Text>
        <TouchableOpacity style={styles.lockButton} onPress={retryAuth} testID="auth-retry">
          <Text style={styles.lockButtonText}>認証する</Text>
        </TouchableOpacity>
        <StatusBar style="light" />
      </View>
    );
  }

  // --- モーダル ---
  if (modal === 'add') {
    return (
      <SafeAreaProvider>
        <ErrorBoundary>
          <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.headerBar}>
              <Text style={styles.headerTitle}>資産を登録</Text>
            </View>
            <AddAssetScreen
              onSave={handleAddAsset}
              onCancel={() => setModal(null)}
              categoryColors={store.categoryColors}
              onCategoryColorChange={store.setCategoryColor}
            />
          </SafeAreaView>
          <AdModal
            visible={adVisible}
            adType={adType}
            onClose={() => setAdVisible(false)}
            onRemoveAds={() => {
              setAdVisible(false);
              ad.purchasePremium('monthly');
            }}
          />
          <StatusBar style="light" />
        </ErrorBoundary>
      </SafeAreaProvider>
    );
  }

  if (modal && typeof modal === 'object' && modal.type === 'detail') {
    const currentAsset = store.assets.find((a) => a.id === modal.asset.id) ?? modal.asset;
    return (
      <SafeAreaProvider>
        <ErrorBoundary>
          <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.headerBar}>
              <Text style={styles.headerTitle}>資産詳細</Text>
            </View>
            <AssetDetailScreen
              asset={currentAsset}
              onUpdate={handleUpdateAsset}
              onDelete={(id) => { store.deleteAsset(id); setModal(null); }}
              onBack={() => setModal(null)}
              categoryColors={store.categoryColors}
              onCategoryColorChange={store.setCategoryColor}
            />
          </SafeAreaView>
          <AdModal
            visible={adVisible}
            adType={adType}
            onClose={() => setAdVisible(false)}
            onRemoveAds={() => {
              setAdVisible(false);
              ad.purchasePremium('monthly');
            }}
          />
          <StatusBar style="light" />
        </ErrorBoundary>
      </SafeAreaProvider>
    );
  }

  // --- メイン画面 ---
  const tabConfig: { id: Tab; icon: string; label: string }[] = [
    { id: 'home', icon: '📊', label: 'ホーム' },
    { id: 'list', icon: '📋', label: '一覧' },
    { id: 'analysis', icon: '🔍', label: '分析' },
    { id: 'guide', icon: '📖', label: '手続' },
  ];

  const tabTitles: Record<Tab, string> = {
    home: 'ホーム',
    list: '資産一覧',
    analysis: '分析',
    guide: '手続ガイド',
  };

  const totalAmount = store.assets.reduce((sum, a) => sum + (a.amount ?? 0), 0);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <SafeAreaView style={styles.container} edges={['top']}>
          {/* ヘッダー */}
          <View style={styles.headerBar}>
            <Text style={styles.headerTitle}>{tabTitles[tab]}</Text>
          </View>

          {/* タブコンテンツ（スワイプ対応） */}
          <SwipeWrapper
            onSwipeLeft={canSwipeLeft ? swipeLeft : undefined}
            onSwipeRight={canSwipeRight ? swipeRight : undefined}
            canSwipeLeft={canSwipeLeft}
            canSwipeRight={canSwipeRight}
          >
            {tab === 'home' && (
              <HomeScreen
                assets={store.assets}
                onAddPress={() => setModal('add')}
                onAssetPress={(asset) => setModal({ type: 'detail', asset })}
                onDeleteAsset={store.deleteAsset}
                categoryColors={store.categoryColors}
              />
            )}
            {tab === 'list' && (
              <ListScreen
                assets={store.assets}
                onAssetPress={(asset) => setModal({ type: 'detail', asset })}
                onDeleteAsset={store.deleteAsset}
                onAddPress={() => setModal('add')}
                categoryColors={store.categoryColors}
              />
            )}
            {tab === 'analysis' && (
              <AnalysisScreen
                totalAmount={totalAmount}
              />
            )}
            {tab === 'guide' && (
              <GuideScreen
                onPdfPress={handleExportPdf}
                pdfLoading={pdfLoading}
                isPremium={ad.isPremium}
                onCancelSubscription={async () => {
                  await ad.resetAds();
                  Alert.alert('解約完了', '無料プランに戻りました。');
                }}
                onPurchasePremium={async (period) => {
                  await ad.purchasePremium(period);
                  Alert.alert('購入完了', '広告が非表示になりました。');
                }}
              />
            )}
          </SwipeWrapper>

          {/* タブバー */}
          <View style={styles.tabBar}>
            {tabConfig.map((t, i) => {
              const active = tabIndex === i;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={styles.tabItem}
                  onPress={() => setTabIndex(i)}
                  testID={`tab-${t.id}`}
                >
                  <Text style={[styles.tabIcon, active && styles.tabIconActive]}>
                    {t.icon}
                  </Text>
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>

        {/* 広告モーダル（メイン画面上に表示） */}
        <AdModal
          visible={adVisible}
          adType={adType}
          onClose={() => setAdVisible(false)}
          onRemoveAds={() => {
            setAdVisible(false);
            ad.purchasePremium('monthly');
          }}
        />

        <StatusBar style="light" />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerBar: {
    backgroundColor: COLORS.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingBottom: 20,
    paddingTop: 8,
  },
  tabItem: { flex: 1, alignItems: 'center' },
  tabIcon: { fontSize: 22, opacity: 0.4 },
  tabIconActive: { opacity: 1 },
  tabLabel: { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },
  tabLabelActive: { color: COLORS.accent },
  loadingContainer: {
    flex: 1, backgroundColor: COLORS.background,
    justifyContent: 'center', alignItems: 'center',
  },
  loadingText: { color: COLORS.textSecondary, fontSize: 14, marginTop: 12 },
  lockContainer: {
    flex: 1, backgroundColor: COLORS.background,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32,
  },
  lockIcon: { fontSize: 64, marginBottom: 16 },
  lockTitle: { color: COLORS.textPrimary, fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  lockMessage: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 24 },
  lockButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12,
  },
  lockButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
