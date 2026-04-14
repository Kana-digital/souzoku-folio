import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { CATEGORIES, CATEGORY_MAP } from '../constants/categories';
import { DisclaimerFooter } from '../components/DisclaimerFooter';
import { PieChart, PieSlice } from '../components/PieChart';
import { Asset, AssetCategoryId, CategoryColors } from '../types';
import { formatYen } from '../utils/format';

interface Props {
  assets: Asset[];
  onAddPress: () => void;
  onAssetPress: (asset: Asset) => void;
  onDeleteAsset: (id: string) => void;
  categoryColors: CategoryColors;
}

export function HomeScreen({ assets, onAddPress, onAssetPress, onDeleteAsset, categoryColors }: Props) {
  // カテゴリ色の取得（カスタム色優先）
  const getCatColor = (catId: AssetCategoryId) =>
    categoryColors[catId] ?? CATEGORIES.find((c) => c.id === catId)?.color ?? '#95A5A6';

  // 円グラフ用データ
  const pieData: PieSlice[] = CATEGORIES
    .map((cat) => {
      const catTotal = assets
        .filter((a) => a.categoryId === cat.id)
        .reduce((sum, a) => sum + (a.amount ?? 0), 0);
      return { id: cat.id, label: cat.label, value: catTotal, color: getCatColor(cat.id), icon: cat.icon };
    })
    .filter((d) => d.value > 0);

  // セクター直下に展開する内訳レンダラー
  const renderExpanded = (categoryId: string) => {
    const catAssets = assets
      .filter((a) => a.categoryId === categoryId)
      .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));
    const cat = CATEGORY_MAP[categoryId as AssetCategoryId];
    if (catAssets.length === 0 || !cat) return null;
    const color = getCatColor(categoryId as AssetCategoryId);
    return (
      <View style={styles.expandedSection}>
        <View style={[styles.expandedHeader, { borderLeftColor: color }]}>
          <Text style={styles.expandedIcon}>{cat.icon}</Text>
          <Text style={styles.expandedTitle}>{cat.label}の内訳</Text>
          <Text style={[styles.expandedCount, { color }]}>
            {catAssets.length}件
          </Text>
        </View>
        {catAssets.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.assetRow}
            onPress={() => onAssetPress(item)}
            onLongPress={() => {
              Alert.alert('削除確認', `「${item.title}」を削除しますか？`, [
                { text: 'キャンセル', style: 'cancel' },
                { text: '削除', style: 'destructive', onPress: () => onDeleteAsset(item.id) },
              ]);
            }}
          >
            <Text style={styles.assetTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.assetAmount}>{formatYen(item.amount)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {assets.length > 0 ? (
          <View style={styles.chartSection}>
            <PieChart
              data={pieData}
              size={220}
              centerTopText="総資産"
              renderExpanded={renderExpanded}
            />
          </View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>まだ資産が登録されていません</Text>
            <Text style={styles.emptySubtext}>下のボタンから最初の資産を登録しましょう</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={onAddPress}
          testID="add-asset-button"
        >
          <Text style={styles.addButtonText}>＋ 資産を登録</Text>
        </TouchableOpacity>
      </ScrollView>

      <DisclaimerFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 24 },
  chartSection: { alignItems: 'center', marginBottom: 16 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptySubtext: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center' },
  addButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  // 展開セクション
  expandedSection: {
    width: '100%',
    marginTop: 12,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  expandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderLeftWidth: 3,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  expandedIcon: { fontSize: 18, marginRight: 8 },
  expandedTitle: { flex: 1, color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },
  expandedCount: { fontSize: 13, fontWeight: '600' },
  assetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  assetTitle: { flex: 1, color: COLORS.textPrimary, fontSize: 14 },
  assetAmount: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});
