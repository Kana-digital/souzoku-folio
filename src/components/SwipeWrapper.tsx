import React, { useRef } from 'react';
import { PanResponder, Animated, StyleSheet, Dimensions, View } from 'react-native';
import { COLORS } from '../constants/colors';

interface Props {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  canSwipeLeft?: boolean;
  canSwipeRight?: boolean;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.18;

/**
 * PanResponder ベースのスワイプラッパー
 * 備蓄フォリオと同じ仕様 + stale closure 対策 + 滑らかなアニメーション
 */
export function SwipeWrapper({
  children,
  onSwipeLeft,
  onSwipeRight,
  canSwipeLeft = true,
  canSwipeRight = true,
}: Props) {
  const translateX = useRef(new Animated.Value(0)).current;

  // 最新の値を ref で保持（PanResponder の stale closure 対策）
  const canLeftRef = useRef(canSwipeLeft);
  const canRightRef = useRef(canSwipeRight);
  const onLeftRef = useRef(onSwipeLeft);
  const onRightRef = useRef(onSwipeRight);
  canLeftRef.current = canSwipeLeft;
  canRightRef.current = canSwipeRight;
  onLeftRef.current = onSwipeLeft;
  onRightRef.current = onSwipeRight;

  const panRef = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => {
        if (!canLeftRef.current && gs.dx < 0) return false;
        if (!canRightRef.current && gs.dx > 0) return false;
        return Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5 && Math.abs(gs.dx) > 10;
      },
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderMove: (_, gs) => {
        if (!canLeftRef.current && gs.dx < 0) return;
        if (!canRightRef.current && gs.dx > 0) return;
        // 指追従率 60%（滑らかに追従）
        translateX.setValue(gs.dx * 0.6);
      },
      onPanResponderRelease: (_, gs) => {
        const triggered =
          gs.dx < -SWIPE_THRESHOLD || gs.vx < -0.4
            ? 'left'
            : gs.dx > SWIPE_THRESHOLD || gs.vx > 0.4
            ? 'right'
            : null;

        if (triggered === 'left' && canLeftRef.current && onLeftRef.current) {
          // スライドアウト → タブ切替 → スライドイン（2段アニメ）
          Animated.timing(translateX, {
            toValue: -SCREEN_WIDTH * 0.3,
            duration: 100,
            useNativeDriver: true,
          }).start(() => {
            onLeftRef.current?.();
            translateX.setValue(SCREEN_WIDTH * 0.2);
            Animated.spring(translateX, {
              toValue: 0,
              friction: 8,
              tension: 80,
              useNativeDriver: true,
            }).start();
          });
        } else if (triggered === 'right' && canRightRef.current && onRightRef.current) {
          Animated.timing(translateX, {
            toValue: SCREEN_WIDTH * 0.3,
            duration: 100,
            useNativeDriver: true,
          }).start(() => {
            onRightRef.current?.();
            translateX.setValue(-SCREEN_WIDTH * 0.2);
            Animated.spring(translateX, {
              toValue: 0,
              friction: 8,
              tension: 80,
              useNativeDriver: true,
            }).start();
          });
        } else {
          // 閾値未満 → ゆるく元に戻す
          Animated.spring(translateX, {
            toValue: 0,
            friction: 8,
            tension: 60,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, {
          toValue: 0,
          friction: 8,
          tension: 60,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  return (
    <View style={styles.outer}>
      <Animated.View
        style={[styles.container, { transform: [{ translateX }] }]}
        {...panRef.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background },
});
