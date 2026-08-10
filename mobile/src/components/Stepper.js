import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';

export default function Stepper({ value, onChange, min = 1, max = 99 }) {
  return (
    <View style={styles.wrap}>
      <Pressable
        style={[styles.btn, value <= min && styles.btnDisabled]}
        disabled={value <= min}
        onPress={() => onChange(Math.max(min, value - 1))}
      >
        <Text style={styles.btnText}>−</Text>
      </Pressable>
      <Text style={styles.value}>{value}</Text>
      <Pressable
        style={[styles.btn, value >= max && styles.btnDisabled]}
        disabled={value >= max}
        onPress={() => onChange(Math.min(max, value + 1))}
      >
        <Text style={styles.btnText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btn: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  value: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
});
