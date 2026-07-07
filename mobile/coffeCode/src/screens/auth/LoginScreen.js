import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../../theme/colors';
import { mockUsuarios } from '../../data/mockData';
import ScalePressable from '../../components/ScalePressable';

export default function LoginScreen({ navigation }) {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    setError('');
    if (!correo || !password) {
      setError('Ingresa tu correo y contraseña.');
      return;
    }
    setLoading(true);
    // Simulación del POST /auth/login
    setTimeout(() => {
      const usuario = mockUsuarios.find(u => u.correo === correo.toLowerCase().trim());
      if (usuario && password === '1234') {
        setLoading(false);
        navigation.replace('Home', { usuario });
      } else {
        setLoading(false);
        setError('Credenciales incorrectas. Intenta de nuevo.');
      }
    }, 1200);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Logo / Branding */}
      <View style={styles.brandArea}>
        <View style={styles.logoCircle}>
          <Ionicons name="cafe-outline" size={38} color={colors.primary} />
        </View>
        <Text style={styles.appName}>Coffee Code</Text>
        <Text style={styles.tagline}>Sistema de Gestión de Cafetería</Text>
      </View>

      {/* Card de login */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Iniciar Sesión</Text>

        <Text style={styles.label}>Correo</Text>
        <TextInput
          style={styles.input}
          placeholder="usuario@coffecode.mx"
          placeholderTextColor={colors.textMuted}
          value={correo}
          onChangeText={setCorreo}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        <ScalePressable
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={colors.bg} />
            : <Text style={styles.btnText}>Entrar</Text>
          }
        </ScalePressable>

        {/* Accesos rápidos de demo */}
        <Text style={styles.demoTitle}>Acceso rápido (demo)</Text>
        <View style={styles.demoRow}>
          {['mesero', 'cocina', 'caja'].map(rol => (
            <TouchableOpacity
              key={rol}
              style={styles.demoBtn}
              onPress={() => {
                setCorreo(`${rol}@coffecode.mx`);
                setPassword('1234');
              }}
            >
              <Text style={styles.demoBtnText}>{rol}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.demoHint}>Pass: 1234</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  brandArea: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: spacing.md,
  },

  appName: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    color: colors.bg,
    fontWeight: '700',
    fontSize: fontSize.md,
  },
  demoTitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  demoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  demoBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  demoBtnText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  demoHint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
