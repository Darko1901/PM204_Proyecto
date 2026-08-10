import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';

export default function ScreenHeader({ title, subtitle, onBack, right }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={10} style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}
        <Text style={typography.h2} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.right}>{right}</View>
      </View>
      {subtitle ? <Text style={[typography.caption, styles.subtitle]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 28,
    color: colors.primary,
    fontWeight: '700',
  },
  right: {
    marginLeft: 'auto',
  },
  subtitle: {
    marginLeft: 32,
    marginTop: 2,
  },
});
