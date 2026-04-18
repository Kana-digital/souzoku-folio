import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/colors';
import { DisclaimerFooter } from '../components/DisclaimerFooter';
import { formatYen, parseAmountInput, formatAmountInput } from '../utils/format';

const SETTINGS_KEY = 'souzoku_analysis_settings';

interface Props {
  totalAmount: number;
}

export function AnalysisScreen({ totalAmount }: Props) {
  const [goalText, setGoalText] = useState('');
  const [yearsText, setYearsText] = useState('20');
  const [rateText, setRateText] = useState('3.0');

  // 設定の永続化
  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY).then((raw) => {
      if (raw) {
        try {
          const s = JSON.parse(raw);
          if (s.goal) setGoalText(formatAmountInput(s.goal));
          if (s.years) setYearsText(s.years);
          if (s.rate) setRateText(s.rate);
        } catch {}
      }
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      AsyncStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({ goal: goalText, years: yearsText, rate: rateText })
      );
    }, 500);
    return () => clearTimeout(timer);
  }, [goalText, yearsText, rateText]);

  const goalAmount = parseAmountInput(goalText);
  const years = parseFloat(yearsText) || 0;
  const annualRate = parseFloat(rateText) / 100 || 0;

  // 目標までの不足額
  const gap = Math.max(0, goalAmount - totalAmount);

  // 複利計算: 年間いくら積み立てれば達成するか
  // FV = PV(1+r)^n + PMT × ((1+r)^n - 1) / r
  // goalAmount = totalAmount × (1+r)^n + PMT × ((1+r)^n - 1) / r
  // PMT = (goalAmount - totalAmount × (1+r)^n) × r / ((1+r)^n - 1)
  const simulation = useMemo(() => {
    if (goalAmount <= 0 || years <= 0) return null;

    const n = years;
    const r = annualRate;

    // 運用なし（利回り0%）の場合
    if (r <= 0) {
      const annualSaving = gap / n;
      const monthlySaving = annualSaving / 12;
      const futureValue = totalAmount;
      return { annualSaving, monthlySaving, futureValue, growthAmount: 0 };
    }

    const compoundFactor = Math.pow(1 + r, n);
    const futureValue = totalAmount * compoundFactor;

    // 現在の資産の運用だけで達成する場合
    if (futureValue >= goalAmount) {
      return { annualSaving: 0, monthlySaving: 0, futureValue, growthAmount: futureValue - totalAmount };
    }

    // 必要な年間積立額
    const annualSaving = (goalAmount - futureValue) * r / (compoundFactor - 1);
    const monthlySaving = annualSaving / 12;
    const growthAmount = goalAmount - totalAmount - annualSaving * n;

    return {
      annualSaving: Math.max(0, annualSaving),
      monthlySaving: Math.max(0, monthlySaving),
      futureValue,
      growthAmount: Math.max(0, growthAmount),
    };
  }, [goalAmount, totalAmount, years, annualRate, gap]);

  // 達成率
  const achievementPct = goalAmount > 0 ? Math.min(100, (totalAmount / goalAmount) * 100) : 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* 現在の総資産 */}
        <View style={styles.currentCard}>
          <Text style={styles.currentLabel}>現在の総資産</Text>
          <Text style={styles.currentAmount}>{formatYen(totalAmount)}</Text>
        </View>

        {/* 目標設定 */}
        <Text style={styles.sectionTitle}>目標設定</Text>
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>目標金額</Text>
          <TextInput
            style={styles.input}
            value={goalText}
            onChangeText={(t) => setGoalText(formatAmountInput(t))}
            placeholder="例: 50,000,000"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
            testID="goal-input"
          />
        </View>
        {goalAmount > 0 && (
          <Text style={styles.inputPreview}>{formatYen(goalAmount)}</Text>
        )}

        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>達成年数</Text>
          <TextInput
            style={[styles.input, styles.inputShort]}
            value={yearsText}
            onChangeText={setYearsText}
            keyboardType="numeric"
            testID="years-input"
          />
          <Text style={styles.inputUnit}>年</Text>
        </View>

        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>想定利回り</Text>
          <TextInput
            style={[styles.input, styles.inputShort]}
            value={rateText}
            onChangeText={setRateText}
            keyboardType="numeric"
            testID="rate-input"
          />
          <Text style={styles.inputUnit}>%</Text>
        </View>

        {/* 達成率バー */}
        {goalAmount > 0 && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>達成率</Text>
              <Text style={styles.progressPct}>{achievementPct.toFixed(1)}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, achievementPct)}%` },
                ]}
              />
            </View>
            <Text style={styles.gapText}>
              {gap > 0
                ? `あと ${formatYen(gap)} で目標達成`
                : '目標を達成しています！'}
            </Text>
          </View>
        )}

        {/* シミュレーション結果 */}
        {simulation && goalAmount > 0 && gap > 0 && simulation.annualSaving > 0 && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>積立シミュレーション</Text>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>年間積立額</Text>
              <Text style={styles.resultValue}>
                {formatYen(Math.ceil(simulation.annualSaving))}
              </Text>
            </View>
            <View style={styles.resultDivider} />

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>月間積立額</Text>
              <Text style={[styles.resultValue, styles.resultHighlight]}>
                {formatYen(Math.ceil(simulation.monthlySaving))}
              </Text>
            </View>
            <View style={styles.resultDivider} />

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>運用益（税引前）</Text>
              <Text style={[styles.resultValue, { color: COLORS.success }]}>
                +{formatYen(Math.round(simulation.growthAmount))}
              </Text>
            </View>

            <Text style={styles.resultNote}>
              ※ 年利{rateText}%複利で{yearsText}年間運用した場合の概算です。
              税金・手数料は含まれていません。
            </Text>
          </View>
        )}

        {/* 運用だけで目標達成可能なケース */}
        {simulation && goalAmount > 0 && gap > 0 && simulation.annualSaving <= 0 && (
          <View style={[styles.resultCard, { borderColor: COLORS.success }]}>
            <Text style={[styles.resultTitle, { color: COLORS.success }]}>
              運用のみで目標達成可能
            </Text>
            <Text style={styles.resultNote}>
              追加の積立は不要です。
              現在の資産 {formatYen(totalAmount)} を年利{rateText}%で{yearsText}年運用すると、
              {formatYen(Math.round(simulation.futureValue))} になり、
              目標の {formatYen(goalAmount)} を上回る見込みです。
              {'\n\n'}
              ※ 運用益には税金・手数料は含まれていません。
            </Text>
          </View>
        )}

        {simulation && goalAmount > 0 && gap <= 0 && (
          <View style={[styles.resultCard, { borderColor: COLORS.success }]}>
            <Text style={[styles.resultTitle, { color: COLORS.success }]}>
              目標達成済み
            </Text>
            <Text style={styles.resultNote}>
              現在の資産で目標額を達成しています。
              {annualRate > 0 && `年利${rateText}%で${yearsText}年運用すると、${formatYen(Math.round(simulation.futureValue))} になります。`}
            </Text>
          </View>
        )}

      </ScrollView>

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
    padding: 16,
    paddingBottom: 24,
  },
  currentCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 20,
  },
  currentLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 4,
  },
  currentAmount: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  inputLabel: {
    color: COLORS.textPrimary,
    fontSize: 14,
    width: 90,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    color: COLORS.textPrimary,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputShort: {
    flex: 0,
    width: 80,
    textAlign: 'right',
  },
  inputUnit: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginLeft: 8,
  },
  inputPreview: {
    color: COLORS.accent,
    fontSize: 13,
    textAlign: 'right',
    marginBottom: 8,
    marginTop: -6,
  },
  progressSection: {
    marginTop: 12,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  progressPct: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.card,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 4,
  },
  gapText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.accent + '40',
    marginBottom: 20,
  },
  resultTitle: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 14,
    textAlign: 'center',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  resultLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  resultValue: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  resultHighlight: {
    color: COLORS.accent,
    fontSize: 20,
    fontWeight: 'bold',
  },
  resultDivider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
  },
  resultNote: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 12,
    lineHeight: 16,
  },
});
