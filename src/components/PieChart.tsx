import React, { useState, useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, GestureResponderEvent } from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import { COLORS } from '../constants/colors';

export interface PieSlice {
  id: string;
  label: string;
  value: number;
  color: string;
  icon: string;
}

interface Props {
  data: PieSlice[];
  size?: number;
  centerTopText?: string;
  centerBottomText?: string;
  /** 選択が変わったとき (null = 解除) */
  onSelect?: (slice: PieSlice | null) => void;
  /** セクター行の直下に展開コンテンツを描画するコールバック */
  renderExpanded?: (sliceId: string) => React.ReactNode;
}

/** SVG アークパスを生成 */
function createArcPath(
  cx: number, cy: number, innerR: number, outerR: number,
  startDeg: number, endDeg: number
): string {
  if (endDeg - startDeg >= 359.9) {
    return [
      `M ${cx + outerR} ${cy}`,
      `A ${outerR} ${outerR} 0 1 1 ${cx - outerR} ${cy}`,
      `A ${outerR} ${outerR} 0 1 1 ${cx + outerR} ${cy}`,
      `M ${cx + innerR} ${cy}`,
      `A ${innerR} ${innerR} 0 1 0 ${cx - innerR} ${cy}`,
      `A ${innerR} ${innerR} 0 1 0 ${cx + innerR} ${cy}`,
      'Z',
    ].join(' ');
  }

  const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
  const s = toRad(startDeg);
  const e = toRad(endDeg);
  const lg = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M ${cx + outerR * Math.cos(s)} ${cy + outerR * Math.sin(s)}`,
    `A ${outerR} ${outerR} 0 ${lg} 1 ${cx + outerR * Math.cos(e)} ${cy + outerR * Math.sin(e)}`,
    `L ${cx + innerR * Math.cos(e)} ${cy + innerR * Math.sin(e)}`,
    `A ${innerR} ${innerR} 0 ${lg} 0 ${cx + innerR * Math.cos(s)} ${cy + innerR * Math.sin(s)}`,
    'Z',
  ].join(' ');
}

/**
 * タップ対応ドーナツ円グラフ + セクターリスト
 * - 座標ベースのタッチ判定で全スライスを確実にタップ可能
 * - セクターリストのタップでも選択/解除
 * - 選択中: スライス拡大 + 中央にカテゴリ名・%表示
 */
export function PieChart({ data, size = 220, centerTopText, centerBottomText, onSelect, renderExpanded }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const chartRef = useRef<View>(null);

  const segments = useMemo(() => {
    if (total === 0) return [];
    let startDeg = 0;
    return data
      .filter((d) => d.value > 0)
      .map((d, idx, arr) => {
        const pct = (d.value / total) * 100;
        const sweepDeg = (d.value / total) * 360;
        const isLast = idx === arr.length - 1;
        const endDeg = isLast ? 360 : startDeg + sweepDeg;
        const seg = { ...d, startDeg, endDeg, pct };
        startDeg = endDeg;
        return seg;
      });
  }, [data, total]);

  if (total === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const selected = segments.find((s) => s.id === selectedId);

  const handleSelect = useCallback((id: string | null) => {
    const newId = selectedId === id ? null : id;
    setSelectedId(newId);
    const slice = newId ? segments.find((s) => s.id === newId) ?? null : null;
    onSelect?.(slice);
  }, [selectedId, segments, onSelect]);

  // タッチ座標からどのスライスかを判定
  const handleChartTap = useCallback((e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    const dx = locationX - cx;
    const dy = locationY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const outerR = size / 2 - 2;
    const innerR = outerR * 0.5;

    // ドーナツ領域外（中心 or 外側）→ 選択解除
    if (dist < innerR || dist > outerR) {
      setSelectedId(null);
      onSelect?.(null);
      return;
    }

    // 角度を計算（12時方向=0度、時計回り 0-360）
    let angle = Math.atan2(dx, -dy) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    // どのセグメントに属するか
    for (const seg of segments) {
      if (angle >= seg.startDeg && angle < seg.endDeg) {
        handleSelect(seg.id);
        return;
      }
    }
    // fallback
    setSelectedId(null);
    onSelect?.(null);
  }, [cx, cy, size, segments, handleSelect, onSelect]);

  const formatShort = (amount: number): string => {
    if (amount >= 100000000) return (amount / 100000000).toFixed(1) + '億円';
    if (amount >= 10000) return Math.round(amount / 10000).toLocaleString() + '万円';
    return '¥' + amount.toLocaleString();
  };

  return (
    <View style={styles.container}>
      {/* ドーナツグラフ — 座標ベースのタッチ判定 */}
      <View
        ref={chartRef}
        style={{ width: size, height: size }}
        onStartShouldSetResponder={() => true}
        onResponderRelease={handleChartTap}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {segments.map((seg) => {
            const isSelected = seg.id === selectedId;
            const hasSelection = selectedId !== null;
            const outerR = isSelected ? size / 2 - 2 : size / 2 - 8;
            const innerR = isSelected ? outerR * 0.5 : outerR * 0.58;
            const path = createArcPath(cx, cy, innerR, outerR, seg.startDeg, seg.endDeg);
            return (
              <Path
                key={seg.id}
                d={path}
                fill={seg.color}
                opacity={hasSelection && !isSelected ? 0.35 : 1}
              />
            );
          })}

          {/* 中央テキスト（SVG Text） */}
          {selected ? (
            <>
              <SvgText x={cx} y={cy - 18} textAnchor="middle" fontSize="22" fill={COLORS.textPrimary}>
                {selected.icon}
              </SvgText>
              <SvgText x={cx} y={cy + 2} textAnchor="middle" fontSize="12" fontWeight="700" fill={selected.color}>
                {selected.label}
              </SvgText>
              <SvgText x={cx} y={cy + 22} textAnchor="middle" fontSize="18" fontWeight="800" fill={selected.color}>
                {selected.pct.toFixed(1)}%
              </SvgText>
              <SvgText x={cx} y={cy + 38} textAnchor="middle" fontSize="11" fill={COLORS.textSecondary}>
                {formatShort(selected.value)}
              </SvgText>
            </>
          ) : (
            <>
              <SvgText x={cx} y={cy - 6} textAnchor="middle" fontSize="13" fill={COLORS.textSecondary}>
                {centerTopText ?? '総資産'}
              </SvgText>
              <SvgText x={cx} y={cy + 16} textAnchor="middle" fontSize="20" fontWeight="800" fill={COLORS.textPrimary}>
                {centerBottomText ?? formatShort(total)}
              </SvgText>
            </>
          )}
        </Svg>
      </View>
      {!selectedId && (
        <Text style={styles.tapHint}>タップすると内訳を表示できます</Text>
      )}

      {/* セクターリスト（備蓄フォリオ風: アイコン+名称+金額+%+▼） */}
      <View style={styles.sectorList}>
        {segments.map((seg) => {
          const isSelected = seg.id === selectedId;
          return (
            <React.Fragment key={seg.id}>
              <TouchableOpacity
                style={[
                  styles.sectorRow,
                  isSelected && {
                    backgroundColor: seg.color + '12',
                    borderColor: seg.color + '44',
                  },
                ]}
                onPress={() => handleSelect(seg.id)}
                testID={`legend-${seg.id}`}
                activeOpacity={0.7}
              >
                <Text style={styles.sectorIcon}>{seg.icon}</Text>
                <View style={styles.sectorInfo}>
                  <Text style={[styles.sectorName, isSelected && { color: seg.color }]}>
                    {seg.label}
                  </Text>
                  <Text style={styles.sectorAmount}>{formatShort(seg.value)}</Text>
                </View>
                <Text style={[styles.sectorPct, { color: seg.color }]}>
                  {seg.pct.toFixed(1)}%
                </Text>
                <Text style={[
                  styles.sectorChevron,
                  isSelected && { transform: [{ rotate: '180deg' }], color: seg.color },
                ]}>
                  ▼
                </Text>
              </TouchableOpacity>
              {isSelected && renderExpanded?.(seg.id)}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  tapHint: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  sectorList: {
    width: '100%',
    marginTop: 12,
  },
  sectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.card,
    marginBottom: 6,
  },
  sectorIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  sectorInfo: {
    flex: 1,
  },
  sectorName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectorAmount: {
    fontSize: 11,
    color: '#FFFFFF',
    marginTop: 1,
  },
  sectorPct: {
    fontSize: 16,
    fontWeight: '800',
    marginRight: 8,
  },
  sectorChevron: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
});
