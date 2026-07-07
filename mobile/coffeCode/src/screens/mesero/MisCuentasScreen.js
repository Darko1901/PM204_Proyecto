import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { colors, spacing, radius, fontSize } from '../../theme/colors';
import { mockCuentas } from '../../data/mockData';

const ESTADO_COLORS = {
  abierta: colors.success,
  por_cobrar: colors.warning,
  pagada: colors.info,
  cancelada: colors.danger,
};

const ESTADO_LABELS = {
  abierta: 'Abierta',
  por_cobrar: 'Por Cobrar',
  pagada: 'Pagada',
  cancelada: 'Cancelada',
};

export default function MisCuentasScreen({ route, navigation }) {
  const { usuario } = route.params || {};
  const isFocused = useIsFocused();

  const cuentas = mockCuentas;

  const renderCuenta = ({ item }) => {
    const estadoColor = ESTADO_COLORS[item.estado] || colors.textMuted;
    const tiempoAbierto = Math.floor(
      (new Date() - new Date(item.abierta_en)) / 60000
    );

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('DetalleCuenta', { cuenta: item, usuario })}
        activeOpacity={0.7}
      >
        {/* Indicador de color */}
        <View style={[styles.cardIndicator, { backgroundColor: estadoColor }]} />

        <View style={styles.cardContent}>
          {/* Top row */}
          <View style={styles.cardTop}>
            <View style={styles.cardTitulo}>
              <Ionicons
                name={item.tipo === 'en_mesa' ? 'restaurant' : 'bag'}
                size={16}
                color={colors.primary}
              />
              <Text style={styles.cardNombre}>
                {item.tipo === 'en_mesa' ? `Mesa ${item.mesa?.numero}` : 'Para Llevar'}
              </Text>
            </View>
            <View style={[styles.estadoBadge, { backgroundColor: estadoColor + '22' }]}>
              <Text style={[styles.estadoText, { color: estadoColor }]}>
                {ESTADO_LABELS[item.estado]}
              </Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.cardStats}>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{item.detalles.length}</Text>
              <Text style={styles.statLbl}>productos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statVal}>{tiempoAbierto} min</Text>
              <Text style={styles.statLbl}>abierta</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statVal, { color: colors.primary }]}>${item.total.toFixed(2)}</Text>
              <Text style={styles.statLbl}>total</Text>
            </View>
          </View>

          {/* Preview ítems */}
          <Text style={styles.previewText} numberOfLines={1}>
            {item.detalles.map(d => `${d.producto.nombre} ×${d.cantidad}`).join(' · ')}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Cuentas</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ListaMesas', { usuario })}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Resumen */}
      <View style={styles.resumenRow}>
        {Object.entries(ESTADO_COLORS).map(([estado, color]) => {
          const count = cuentas.filter(c => c.estado === estado).length;
          return (
            <View key={estado} style={styles.resumenItem}>
              <Text style={[styles.resumenNum, { color }]}>{count}</Text>
              <Text style={styles.resumenLbl}>{ESTADO_LABELS[estado]}</Text>
            </View>
          );
        })}
      </View>

      <FlatList
        data={cuentas}
        keyExtractor={item => String(item.id)}
        renderItem={renderCuenta}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No tienes cuentas activas</Text>
          </View>
        }
      />
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
  resumenRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.bgCard,
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  resumenItem: { alignItems: 'center' },
  resumenNum: { fontSize: fontSize.xl, fontWeight: '700' },
  resumenLbl: { fontSize: fontSize.xs, color: colors.textMuted },
  lista: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardIndicator: { width: 4, alignSelf: 'stretch' },
  cardContent: { flex: 1, padding: spacing.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  cardTitulo: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  cardNombre: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary },
  estadoBadge: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  estadoText: { fontSize: fontSize.xs, fontWeight: '600' },
  cardStats: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textPrimary },
  statLbl: { fontSize: fontSize.xs, color: colors.textMuted },
  statDivider: { width: 1, height: 24, backgroundColor: colors.border },
  previewText: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
  emptyText: { color: colors.textMuted, fontSize: fontSize.md },
});
