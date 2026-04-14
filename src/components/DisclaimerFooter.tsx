import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

/**
 * 免責フッター — すべての画面の最下部に表示
 */
export function DisclaimerFooter() {
  return (
    <View style={styles.container} testID="disclaimer-footer">
      <Text style={styles.text}>
        本アプリは情報提供を目的としており、法的助言・税務助言ではありません。
        個別の相続手続は司法書士・税理士・弁護士にご相談ください。
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.disclaimerBg,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  text: {
    color: COLORS.disclaimerText,
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
  },
});
