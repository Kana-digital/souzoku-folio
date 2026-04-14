import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { CATEGORIES, CATEGORY_MAP, CategoryDef } from '../constants/categories';
import { DisclaimerFooter } from '../components/DisclaimerFooter';
import { Asset, AssetCategoryId, CategoryColors } from '../types';
import { formatYen, parseAmountInput, formatAmountInput } from '../utils/format';

const SECTOR_COLORS = [
  '#4A90D9', '#50C878', '#9B59B6', '#E67E22',
  '#E74C3C', '#F1C40F', '#1ABC9C', '#95A5A6',
  '#FF6B6B', '#48DBFB', '#FF9FF3', '#54A0FF',
];

interface Props {
  asset: Asset;
  onUpdate: (id: string, updates: { categoryId?: AssetCategoryId; title?: string; amount?: number }) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
  categoryColors: CategoryColors;
  onCategoryColorChange: (categoryId: AssetCategoryId, color: string | null) => void;
}

export function AssetDetailScreen({ asset, onUpdate, onDelete, onBack, categoryColors, onCategoryColorChange }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editCategory, setEditCategory] = useState<AssetCategoryId>(asset.categoryId);
  const [editTitle, setEditTitle] = useState(asset.title);
  const [editAmount, setEditAmount] = useState(formatAmountInput(String(asset.amount)));

  const cat = CATEGORY_MAP[asset.categoryId];

  const getCatColor = (catId: AssetCategoryId) => {
    return categoryColors[catId] ?? CATEGORIES.find((c) => c.id === catId)?.color ?? '#95A5A6';
  };

  const handleSave = () => {
    if (!editTitle.trim()) {
      Alert.alert('資産名を入力してください');
      return;
    }
    const amount = parseAmountInput(editAmount);
    if (amount <= 0) {
      Alert.alert('金額を正しく入力してください');
      return;
    }
    onUpdate(asset.id, {
      categoryId: editCategory,
      title: editTitle.trim(),
      amount,
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      '削除確認',
      `「${asset.title}」を削除しますか？\nこの操作は取り消せません。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => {
            onDelete(asset.id);
            onBack();
          },
        },
      ]
    );
  };

  const createdDate = new Date(asset.createdAt).toLocaleDateString('ja-JP');
  const updatedDate = new Date(asset.updatedAt).toLocaleDateString('ja-JP');

  if (isEditing) {
    const editColor = getCatColor(editCategory);
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>カテゴリ</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((c: CategoryDef) => {
              const color = getCatColor(c.id);
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.categoryChip,
                    editCategory === c.id && {
                      borderColor: color,
                      backgroundColor: color + '20',
                    },
                  ]}
                  onPress={() => setEditCategory(c.id)}
                  testID={`edit-category-${c.id}`}
                >
                  <Text style={styles.categoryIcon}>{c.icon}</Text>
                  <Text
                    style={[
                      styles.categoryLabel,
                      editCategory === c.id && { color },
                    ]}
                  >
                    {c.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* セクターカラー */}
          <Text style={styles.sectionTitle}>セクターカラー</Text>
          <View style={styles.colorGrid}>
            {SECTOR_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorChip,
                  { backgroundColor: c },
                  editColor === c && styles.colorChipSelected,
                ]}
                onPress={() => {
                  const defaultColor = CATEGORIES.find((cat) => cat.id === editCategory)?.color;
                  onCategoryColorChange(editCategory, c === defaultColor ? null : c);
                }}
              />
            ))}
          </View>
          <Text style={styles.colorHint}>円グラフでの表示色を変更できます</Text>

          <Text style={styles.sectionTitle}>資産名</Text>
          <TextInput
            style={styles.input}
            value={editTitle}
            onChangeText={setEditTitle}
            testID="edit-title-input"
          />

          <Text style={styles.sectionTitle}>概算金額（円）</Text>
          <TextInput
            style={styles.input}
            value={editAmount}
            onChangeText={(t) => setEditAmount(formatAmountInput(t))}
            keyboardType="numeric"
            testID="edit-amount-input"
          />
        </ScrollView>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setIsEditing(false)}
          >
            <Text style={styles.cancelButtonText}>キャンセル</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>保存</Text>
          </TouchableOpacity>
        </View>
        <DisclaimerFooter />
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* カテゴリ・資産名 */}
        <View style={styles.headerCard}>
          <Text style={styles.detailIcon}>{cat?.icon ?? '📦'}</Text>
          <Text style={styles.detailCategory}>{cat?.label ?? 'その他'}</Text>
          <Text style={styles.detailTitle} testID="detail-title">
            {asset.title}
          </Text>
          <Text style={styles.detailAmount} testID="detail-amount">
            {formatYen(asset.amount)}
          </Text>
        </View>

        {/* メタ情報 */}
        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>登録日</Text>
            <Text style={styles.metaValue}>{createdDate}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>最終更新</Text>
            <Text style={styles.metaValue}>{updatedDate}</Text>
          </View>
        </View>
      </ScrollView>

      {/* アクションボタン */}
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>戻る</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(true)}
          testID="edit-button"
        >
          <Text style={styles.editButtonText}>編集</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          testID="delete-button"
        >
          <Text style={styles.deleteButtonText}>削除</Text>
        </TouchableOpacity>
      </View>

      <DisclaimerFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  headerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  detailIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  detailCategory: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  detailTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  detailAmount: {
    color: COLORS.accent,
    fontSize: 28,
    fontWeight: 'bold',
  },
  metaCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  metaLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  metaValue: {
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 6,
  },
  categoryLabel: {
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorChipSelected: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  colorHint: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 6,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    color: COLORS.textPrimary,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  buttons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  backButton: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  backButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    flex: 1,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: COLORS.error + '20',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  deleteButtonText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
