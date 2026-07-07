import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { colors, spacing, radius, fontSize } from '../../theme/colors';
import { mockCompras } from '../../data/mockData';

export default function HistorialComprasScreen({ route, navigation }) {
  const { usuario } = route.params || {};
  const isFocused = useIsFocused();

  const totalGastado = mockCompras.reduce((s, c) => s + c.total, 0);

  const formatFecha = (iso) => new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const formatHora = (iso) => new Date(iso).toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit',
  });

  const renderCompra = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.proveedor}>{item.proveedor ?? 'Sin proveedor'}</Text>
          <View style={styles.fechaRow}>
            <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
            <Text style={styles.fecha}>{formatFecha(item.comprado_en)} · {formatHora(item.comprado_en)}</Text>
          </View>
        </View>
        <Text style={styles.total}>${item.total.toFixed(2)}</Text>
      </View>

      <View style={styles.separator} />

      {/* Líneas */}
      {item.detalles.map((d, i) => (
        <View key={i} style={styles.lineaRow}>
          <Text style={styles.lineaNombre}>{d.suministro.nombre}</Text>
          <Text style={styles.lineaQty}>{d.cantidad}</Text>
          <Text style={styles.lineaCosto}>${d.costo_unitario}/u</Text>
          <Text style={styles.lineaSubtotal}>${(d.cantidad * d.costo_unitario).toFixed(2)}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial de Compras</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Resumen */}
      <View style={styles.resumenCard}>
        <View style={styles.resumenItem}>
          <Text style={styles.resumenNum}>{mockCompras.length}</Text>
          <Text style={styles.resumenLbl}>Compras</Text>
        </View>
        <View style={styles.resumenDivider} />
        <View style={styles.resumenItem}>
          <Text style={[styles.resumenNum, { color: colors.primary }]}>${totalGastado.toFixed(2)}</Text>
          <Text style={styles.resumenLbl}>Total gastado</Text>
        </View>
        <View style={styles.resumenDivider} />
        <View style={styles.resumenItem}>
          <Text style={styles.resumenNum}>
            ${(totalGastado / mockCompras.length).toFixed(2)}
          </Text>
          <Text style={styles.resumenLbl}>Promedio</Text>
        </View>
      </View>

      <FlatList
        data={mockCompras}
        keyExtractor={item => String(item.id)}
        renderItem={renderCompra}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<Text style={styles.listaLabel}>Registro reciente</Text>}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cart-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>Sin compras registradas</Text>
          </View>
        }
      />

      {/* FAB nueva compra */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('RegistrarCompra', { usuario })}
      >
        <Ionicons name="add" size={24} color={colors.bg} />
      </TouchableOpacity>
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
  resumenCard: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  resumenItem: { flex: 1, alignItems: 'center' },
  resumenNum: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary },
  resumenLbl: { fontSize: fontSize.xs, color: colors.textMuted },
  resumenDivider: { width: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  listaLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  lista: { paddingHorizontal: spacing.lg, paddingBottom: 80 },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  proveedor: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  fechaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fecha: { fontSize: fontSize.xs, color: colors.textMuted },
  total: { fontSize: fontSize.lg, fontWeight: '700', color: colors.primary },
  separator: { height: 1, backgroundColor: colors.border, marginBottom: spacing.sm },
  lineaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  lineaNombre: { flex: 1, fontSize: fontSize.sm, color: colors.textSecondary },
  lineaQty: { fontSize: fontSize.sm, color: colors.textMuted, width: 36, textAlign: 'center' },
  lineaCosto: { fontSize: fontSize.sm, color: colors.textMuted, width: 60, textAlign: 'right' },
  lineaSubtotal: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textPrimary, width: 60, textAlign: 'right' },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
  emptyText: { color: colors.textMuted, fontSize: fontSize.md },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});
