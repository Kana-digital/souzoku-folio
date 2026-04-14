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
import { CATEGORIES, CategoryDef } from '../constants/categories';
import { DisclaimerFooter } from '../components/DisclaimerFooter';
import { AssetCategoryId, CategoryColors } from '../types';
import { parseAmountInput, formatYen, formatAmountInput } from '../utils/format';

const SECTOR_COLORS = [
  '#4A90D9', '#50C878', '#9B59B6', '#E67E22',
  '#E74C3C', '#F1C40F', '#1ABC9C', '#95A5A6',
  '#FF6B6B', '#48DBFB', '#FF9FF3', '#54A0FF',
];

interface Props {
  onSave: (data: { categoryId: AssetCategoryId; title: string; amount: number }) => void;
  onCancel: () => void;
  categoryColors: CategoryColors;
  onCategoryColorChange: (categoryId: AssetCategoryId, color: string | null) => void;
}

export function AddAssetScreen({ onSave, onCancel, categoryColors, onCategoryColorChange }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<AssetCategoryId | null>(null);
  const [title, setTitle] = useState('');
  const [amountText, setAmountText] = useState('');

  /** 選択中カテゴリの現在の表示色を取得 */
  const getCatColor = (catId: AssetCategoryId) => {
    return categoryColors[catId] ?? CATEGORIES.find((c) => c.id === catId)?.color ?? '#95A5A6';
  };

  const handleSave = () => {
    if (!selectedCategory) {
      Alert.alert('カテゴリを選択してください');
      return;
    }
    if (!title.trim()) {
      Alert.alert('資産名を入力してください');
      return;
    }
    const amount = parseAmountInput(amountText);
    if (amount <= 0) {
      Alert.alert('金額を正しく入力してください');
      return;
    }
    onSave({ categoryId: selectedCategory, title: title.trim(), amount });
  };

  const parsedAmount = parseAmountInput(amountText);
  const currentColor = selectedCategory ? getCatColor(selectedCategory) : null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* カテゴリ選択 */}
        <Text style={styles.sectionTitle}>カテゴリ</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat: CategoryDef) => {
            const color = getCatColor(cat.id);
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat.id && {
                    borderColor: color,
                    backgroundColor: color + '20',
                  },
                ]}
                onPress={() => setSelectedCategory(cat.id)}
                testID={`category-${cat.id}`}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.categoryLabel,
                    selectedCategory === cat.id && { color },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* セクターカラー（カテゴリ選択後に表示） */}
        {selectedCategory && (
          <>
            <Text style={styles.sectionTitle}>セクターカラー</Text>
            <View style={styles.colorGrid}>
              {SECTOR_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorChip,
                    { backgroundColor: c },
                    currentColor === c && styles.colorChipSelected,
                  ]}
                  onPress={() => {
                    const defaultColor = CATEGORIES.find((cat) => cat.id === selectedCategory)?.color;
                    // デフォルト色に戻す場合は null
                    onCategoryColorChange(selectedCategory, c === defaultColor ? null : c);
                  }}
                />
              ))}
            </View>
            <Text style={styles.colorHint}>円グラフでの表示色を変更できます</Text>
          </>
        )}

        {/* 資産名 */}
        <Text style={styles.sectionTitle}>資産名</Text>
        <TextInput
          style={styles.input}
          placeholder="例: ○○銀行 普通預金"
          placeholderTextColor={COLORS.textMuted}
          value={title}
          onChangeText={setTitle}
          testID="asset-title-input"
        />

        {/* 金額 */}
        <Text style={styles.sectionTitle}>概算金額（円）</Text>
        <TextInput
          style={styles.input}
          placeholder="例: 5,000,000"
          placeholderTextColor={COLORS.textMuted}
          value={amountText}
          onChangeText={(t) => setAmountText(formatAmountInput(t))}
          keyboardType="numeric"
          testID="asset-amount-input"
        />
        {parsedAmount > 0 && (
          <Text style={styles.amountPreview}>
            {formatYen(parsedAmount)}
          </Text>
        )}
      </ScrollView>

      {/* ボタン */}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          testID="cancel-button"
        >
          <Text style={styles.cancelButtonText}>キャンセル</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!selectedCategory || !title.trim() || parsedAmount <= 0) &&
              styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          testID="save-button"
        >
          <Text style={styles.saveButtonText}>保存</Text>
        </TouchableOpacity>
      </View>

      <DisclaimerFooter />
    </KeyboardAvoidingView>
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
  scrollContent: {
    padding: 16,
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
  amountPreview: {
    color: COLORS.accent,
    fontSize: 14,
    marginTop: 4,
    textAlign: 'right',
  },
  buttons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
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
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
