import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../../theme/colors';
import { mockColaCocina } from '../../data/mockData';

export default function DetalleItemScreen({ route, navigation }) {
  const { item } = route.params || { item: mockColaCocina[0] };

  const ESTADO_STEPS = ['pendiente', 'en_preparacion', 'listo', 'entregado'];
  const stepActual = ESTADO_STEPS.indexOf(item.estado);

  const STEP_LABELS = {
    pendiente: 'Pendiente',
    en_preparacion: 'En Preparación',
    listo: 'Listo',
    entregado: 'Entregado',
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle del Ítem</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Producto principal */}
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="fast-food-outline" size={38} color={colors.primary} />
          </View>
          <Text style={styles.heroNombre}>{item.producto.nombre}</Text>
          <Text style={styles.heroCategoria}>{item.producto.categoria}</Text>
          <View style={styles.heroCantidadBadge}>
            <Text style={styles.heroCantidadText}>Cantidad: {item.cantidad}</Text>
          </View>
        </View>

        {/* Origen */}
        <Text style={styles.sectionTitle}>Origen del pedido</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name={item.cuenta.tipo === 'en_mesa' ? 'restaurant-outline' : 'bag-outline'}
              size={18} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Mesa / Tipo</Text>
              <Text style={styles.infoValor}>
                {item.cuenta.tipo === 'en_mesa' ? `Mesa ${item.cuenta.mesa?.numero}` : 'Para Llevar'}
              </Text>
            </View>
          </View>
          <View style={styles.separator} />
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Hora de pedido</Text>
              <Text style={styles.infoValor}>
                {new Date(item.creado_en).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        </View>

        {/* Observaciones */}
        {item.observaciones && (
          <>
            <Text style={styles.sectionTitle}>Observaciones del mesero</Text>
            <View style={styles.obsCard}>
              <Ionicons name="chatbubble" size={16} color={colors.primary} />
              <Text style={styles.obsText}>{item.observaciones}</Text>
            </View>
          </>
        )}

        {/* Progreso del estado */}
        <Text style={styles.sectionTitle}>Progreso</Text>
        <View style={styles.progresoCard}>
          {ESTADO_STEPS.map((step, i) => (
            <View key={step} style={styles.progresoStep}>
              <View style={[
                styles.progresoCircle,
                i <= stepActual && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}>
                {i < stepActual
                  ? <Ionicons name="checkmark" size={14} color={colors.bg} />
                  : <Text style={[styles.progresoNum, i <= stepActual && { color: colors.bg }]}>{i + 1}</Text>
                }
              </View>
              <Text style={[styles.progresoLabel, i <= stepActual && { color: colors.primary }]}>
                {STEP_LABELS[step]}
              </Text>
              {i < ESTADO_STEPS.length - 1 && (
                <View style={[styles.progresoLinea, i < stepActual && { backgroundColor: colors.primary }]} />
              )}
            </View>
          ))}
        </View>
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
  heroCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },

  heroNombre: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs },
  heroCategoria: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.md },
  heroCantidadBadge: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  heroCantidadText: { color: colors.bg, fontWeight: '700', fontSize: fontSize.md },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  infoCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: 2 },
  infoValor: { fontSize: fontSize.md, color: colors.textPrimary, fontWeight: '600' },
  separator: { height: 1, backgroundColor: colors.border },
  obsCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.primary + '11',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary + '33',
    padding: spacing.md,
  },
  obsText: { flex: 1, color: colors.primaryLight, fontSize: fontSize.md, lineHeight: 22 },
  progresoCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progresoStep: { alignItems: 'center', flex: 1, position: 'relative' },
  progresoCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.bgCardLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  progresoNum: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '700' },
  progresoLabel: { fontSize: 9, color: colors.textMuted, textAlign: 'center' },
  progresoLinea: {
    position: 'absolute',
    top: 16,
    left: '55%',
    right: '-55%',
    height: 2,
    backgroundColor: colors.border,
    zIndex: -1,
  },
});
