import React, { useEffect, useRef } from 'react';
import { View, Text, StatusBar, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';

export default function SplashScreen({ navigation }) {
  const { loading, usuario } = useAuth();
  const redirected = useRef(false);

  useEffect(() => {
    if (loading || redirected.current) return;
    redirected.current = true;
    const t = setTimeout(() => {
      navigation.replace(usuario ? 'Home' : 'Login');
    }, 1200);
    return () => clearTimeout(t);
  }, [loading, usuario, navigation]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <View style={styles.logoCircle}>
        <Ionicons name="cafe-outline" size={52} color={colors.primary} />
      </View>
      <Text style={styles.appName}>Coffee Code</Text>
      <Text style={styles.tagline}>Sistema de Gestión de Cafetería</Text>

      <View style={styles.loaderArea}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          {loading ? 'Restaurando sesión…' : 'Preparando tu cafetería…'}
        </Text>
      </View>

      <Text style={styles.version}>v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: radius.full,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
    marginBottom: spacing.lg,
  },
  appName: {
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  loaderArea: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  loadingText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  version: {
    position: 'absolute',
    bottom: spacing.xl,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});