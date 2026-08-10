import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';

export default function EmptyState({ icon = 'cafe-outline', title, subtitle }) {
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={40} color={colors.mist} style={styles.icon} />
      <Text style={typography.h3}>{title}</Text>
      {subtitle ? <Text style={[typography.caption, styles.subtitle]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 1.5,
    paddingHorizontal: spacing.lg,
  },
  icon: {
    marginBottom: spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 4,
  },
});
