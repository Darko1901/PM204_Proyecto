import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, shadow, spacing } from '../theme';

export default function Card({ children, onPress, style }) {
  const content = (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    ...shadow,
  },
});
