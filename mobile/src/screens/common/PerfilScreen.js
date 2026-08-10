import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ScreenHeader from '../../components/ScreenHeader';
import { NOMBRE_ROL } from '../../navigation/tabsConfig';
import { colors, spacing, typography } from '../../theme';

function iniciales(nombre) {
  return nombre
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function PerfilScreen({ session, onLogout }) {
  return (
    <View style={styles.flex}>
      <ScreenHeader title="Perfil" />
      <View style={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{iniciales(session.nombre)}</Text>
        </View>
        <Text style={typography.h2}>{session.nombre}</Text>
        <Text style={[typography.caption, styles.rol]}>{NOMBRE_ROL[session.rol] || session.rol}</Text>

        <Card style={styles.card}>
          <Text style={styles.fieldLabel}>Correo</Text>
          <Text style={styles.fieldValue}>{session.correo}</Text>
        </Card>
        <Card style={styles.card}>
          <Text style={styles.fieldLabel}>Módulo asignado</Text>
          <Text style={styles.fieldValue}>{NOMBRE_ROL[session.rol] || session.rol}</Text>
        </Card>

        <Button title="Cerrar sesión" variant="danger" onPress={onLogout} style={styles.logout} />

        <Text style={styles.footer}>CoffeeCode v1.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
  },
  rol: { marginTop: 2, marginBottom: spacing.lg },
  card: { width: '100%' },
  fieldLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  fieldValue: { fontSize: 15, color: colors.text, fontWeight: '600' },
  logout: { marginTop: spacing.lg, width: '100%' },
  footer: { marginTop: 'auto', marginBottom: spacing.lg, fontSize: 12, color: colors.textMuted },
});
