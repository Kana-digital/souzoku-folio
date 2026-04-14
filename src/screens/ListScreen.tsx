import React from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { CATEGORIES, CATEGORY_MAP } from '../constants/categories';
import { DisclaimerFooter } from '../components/DisclaimerFooter';
import { Asset, CategoryColors, AssetCategoryId } from '../types';
import { formatYen } from '../utils/format';

interface Props {
  assets: Asset[];
  onAssetPress: (asset: Asset) => void;
  onDeleteAsset: (id: string) => void;
  onAddPress: () => void;
  categoryColors: CategoryColors;
}

interface Section {
  title: string;
  icon: string;
  color: string;
  total: number;
  data: Asset[];
}

export function ListScreen({ assets, onAssetPress, onDeleteAsset, onAddPress, categoryColors }: Props) {
  const getCatColor = (catId: AssetCategoryId) =>
    categoryColors[catId] ?? CATEGORIES.find((c) => c.id === catId)?.color ?? '#95A5A6';

  // カテゴリ別にグループ化
  const sections: Section[] = CATEGORIES
    .map((cat) => {
      const catAssets = assets
        .filter((a) => a.categoryId === cat.id)
        .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));
      const catTotal = catAssets.reduce((sum, a) => sum + (a.amount ?? 0), 0);
      return {
        title: cat.label,
        icon: cat.icon,
        color: getCatColor(cat.id),
        total: catTotal,
        data: catAssets,
      };
    })
    .filter((s) => s.data.length > 0);

  const handleLongPress = (asset: Asset) => {
    Alert.alert(
      '削除確認',
      `「${asset.title}」を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => onDeleteAsset(asset.id),
        },
      ]
    );
  };

  if (assets.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>資産が登録されていません</Text>
          <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
            <Text style={styles.addButtonText}>＋ 資産を登録</Text>
          </TouchableOpacity>
        </View>
        <DisclaimerFooter />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>{section.icon}</Text>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={[styles.sectionTotal, { color: section.color }]}>
              {formatYen(section.total)}
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const cat = CATEGORY_MAP[item.categoryId];
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => onAssetPress(item)}
              onLongPress={() => handleLongPress(item)}
              testID={`list-asset-${item.id}`}
            >
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.title}
                </Text>
              </View>
              <Text style={styles.rowAmount}>{formatYen(item.amount)}</Text>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        testID="asset-section-list"
      />
      <DisclaimerFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  list: {
    padding: 16,
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionTitle: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTotal: {
    fontSize: 15,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  rowInfo: {
    flex: 1,
  },
  rowTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  rowAmount: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
