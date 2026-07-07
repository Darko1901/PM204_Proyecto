import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../../theme/colors';
import ScalePressable from '../../components/ScalePressable';

export default function PerfilScreen({ route, navigation }) {
  const { usuario } = route.params;

  const ROL_ICONS = { mesero: 'restaurant-outline', cocina: 'flame-outline', caja: 'cash-outline', administrador: 'settings-outline' };
  const ROL_COLORS = { mesero: '#5B9BD5', cocina: '#F0A500', caja: '#4CAF7D', administrador: colors.primary };

  const rolNombre = usuario.rol.nombre;
  const rolColor = ROL_COLORS[rolNombre] || ROL_COLORS.administrador;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Avatar */}
        <View style={styles.avatarArea}>
          <View style={[styles.avatarBig, { borderColor: rolColor }]}>
            <Ionicons
              name={ROL_ICONS[usuario.rol.nombre] || 'person-outline'}
              size={44}
              color={rolColor}
            />
          </View>
          <Text style={styles.nombre}>{usuario.nombre_completo}</Text>
          <View style={[styles.rolBadge, { backgroundColor: rolColor + '22', borderColor: rolColor + '44' }]}>
            <Text style={[styles.rolText, { color: rolColor }]}>
              {usuario.rol.nombre.charAt(0).toUpperCase() + usuario.rol.nombre.slice(1)}
            </Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoSectionTitle}>Información de cuenta</Text>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={18} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Nombre completo</Text>
              <Text style={styles.infoValor}>{usuario.nombre_completo}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={18} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Correo</Text>
              <Text style={styles.infoValor}>{usuario.correo}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark-outline" size={18} color={rolColor} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Rol asignado</Text>
              <Text style={styles.infoValor}>
                {usuario.rol.nombre.charAt(0).toUpperCase() + usuario.rol.nombre.slice(1)}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Ionicons name="ellipse" size={18} color={usuario.activo ? colors.success : colors.danger} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Estado</Text>
              <Text style={[styles.infoValor, { color: usuario.activo ? colors.success : colors.danger }]}>
                {usuario.activo ? 'Activo' : 'Inactivo'}
              </Text>
            </View>
          </View>
        </View>

        {/* Nota */}
        <View style={styles.noteCard}>
          <Ionicons name="information-circle-outline" size={18} color={colors.info} />
          <Text style={styles.noteText}>
            Para cambiar tu contraseña o rol, contacta al administrador del sistema.
          </Text>
        </View>

        {/* Estado del Turno */}
        <View style={styles.turnoCard}>
          <Text style={styles.turnoTitle}>Estado del Turno</Text>
          
          <View style={styles.turnoRow}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text style={styles.turnoLabel}>Turno iniciado</Text>
            <Text style={styles.turnoValor}>
              {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.turnoRow}>
            <Ionicons name="person-outline" size={18} color={colors.primary} />
            <Text style={styles.turnoLabel}>Empleado</Text>
            <Text style={styles.turnoValor}>{usuario.nombre_completo}</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.turnoRow}>
            <Ionicons name="shield-outline" size={18} color={rolColor} />
            <Text style={styles.turnoLabel}>Rol activo</Text>
            <Text style={[styles.turnoValor, { color: rolColor }]}>
              {rolNombre.charAt(0).toUpperCase() + rolNombre.slice(1)}
            </Text>
          </View>
        </View>

        <ScalePressable
          style={styles.logoutBtn}
          onPress={() => {
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </ScalePressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + spacing.md,
    paddingBottom: spacing.md,
  },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  avatarArea: { alignItems: 'center', paddingVertical: spacing.xl },
  avatarBig: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    backgroundColor: colors.bgCard,
    borderWidth: 3,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },

  nombre: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  rolBadge: {
    backgroundColor: colors.primary + '22',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary + '44',
  },
  rolText: { color: colors.primary, fontWeight: '600', fontSize: fontSize.sm },
  infoCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  infoSectionTitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: 2 },
  infoValor: { fontSize: fontSize.md, color: colors.textPrimary, fontWeight: '500' },
  divider: { height: 1, backgroundColor: colors.border },
  noteCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.info + '11',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.info + '33',
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  noteText: { flex: 1, fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20 },
  turnoCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  turnoTitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  turnoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  turnoLabel: { flex: 1, color: colors.textSecondary, fontSize: fontSize.sm },
  turnoValor: { color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: '600' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger + '44',
    backgroundColor: colors.danger + '11',
  },
  logoutText: { color: colors.danger, fontWeight: '600', fontSize: fontSize.md },
});
