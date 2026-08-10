import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Button from '../../components/Button';
import TextField from '../../components/TextField';
import { colors, radius, spacing, typography } from '../../theme';

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const DEMOS = [
  { rol: 'mesero', label: 'Mesero', nombre: 'Mesero 1', correo: 'mesero@coffeecode.com' },
  { rol: 'caja', label: 'Caja', nombre: 'Caja 1', correo: 'caja@coffeecode.com' },
  { rol: 'cocina', label: 'Cocina', nombre: 'Cocina 1', correo: 'cocina@coffeecode.com' },
];

export default function LoginScreen({ onLogin }) {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [rolSeleccionado, setRolSeleccionado] = useState(null);
  const [nombreDemo, setNombreDemo] = useState(null);
  const [error, setError] = useState('');

  const elegirDemo = (demo) => {
    setCorreo(demo.correo);
    setPassword('demo1234');
    setRolSeleccionado(demo.rol);
    setNombreDemo(demo.nombre);
    setError('');
  };

  const iniciarSesion = () => {
    if (!EMAIL_RE.test(correo)) {
      setError('Ingresa un correo válido');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (!rolSeleccionado) {
      setError('Selecciona tu módulo (Mesero, Caja o Cocina)');
      return;
    }
    setError('');
    onLogin({ correo, nombre: nombreDemo || correo.split('@')[0], rol: rolSeleccionado });
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoCircle}>
          <Ionicons name="cafe-outline" size={34} color={colors.primary} />
        </View>
        <Text style={typography.h1}>CoffeeCode</Text>
        <Text style={[typography.caption, styles.subtitle]}>Inicia sesión</Text>

        <View style={styles.form}>
          <TextField
            label="Correo electrónico"
            placeholder="tucorreo@coffeecode.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={correo}
            onChangeText={setCorreo}
          />
          <TextField
            label="Contraseña"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Text style={styles.rolLabel}>Credenciales de prueba</Text>
          <View style={styles.rolRow}>
            {DEMOS.map((demo) => (
              <Pressable
                key={demo.rol}
                onPress={() => elegirDemo(demo)}
                style={[
                  styles.rolChip,
                  rolSeleccionado === demo.rol && styles.rolChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.rolChipText,
                    rolSeleccionado === demo.rol && styles.rolChipTextActive,
                  ]}
                >
                  {demo.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Button title="Iniciar sesión" onPress={iniciarSesion} style={styles.submit} />
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: spacing.xl * 1.5,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${colors.primary}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  subtitle: { marginTop: 4, marginBottom: spacing.lg },
  form: { width: '100%', marginTop: spacing.md },
  rolLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  rolRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  rolChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  rolChipActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}12`,
  },
  rolChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  rolChipTextActive: {
    color: colors.primary,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  submit: {
    marginTop: spacing.sm,
  },
  hint: {
    marginTop: spacing.lg,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
