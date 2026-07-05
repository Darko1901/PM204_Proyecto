import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { colors, spacing, radius, fontSize } from '../../theme/colors';
import { mockSuministros } from '../../data/mockData';

export default function AlertasStockScreen({ navigation }) {
  const isFocused = useIsFocused();
  const alertas = mockSuministros.filter(s => s.activo && s.stock_actual < s.stock_minimo);

  const deficit = (s) => (s.stock_minimo - s.stock_actual).toFixed(2);
  const urgencia = (s) => {
    if (s.stock_actual <= 0) return { nivel: 'crítico', color: colors.danger };
    const ratio = s.stock_actual / s.stock_minimo;
    if (ratio < 0.5) return { nivel: 'alto', color: colors.danger };
    return { nivel: 'moderado', color: colors.warning };
  };

  const renderAlerta = ({ item }) => {
    const urg = urgencia(item);
    return (
      <View style={[styles.card, { borderColor: urg.color + '55' }]}>
        <View style={[styles.urgIcon, { backgroundColor: urg.color + '22' }]}>
          <Ionicons name="warning" size={20} color={urg.color} />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <Text style={styles.nombre}>{item.nombre}</Text>
            <View style={[styles.urgBadge, { backgroundColor: urg.color + '22' }]}>
              <Text style={[styles.urgText, { color: urg.color }]}>
                {urg.nivel.charAt(0).toUpperCase() + urg.nivel.slice(1)}
              </Text>
            </View>
          </View>
          <View style={styles.stockRow}>
            <View style={styles.stockCol}>
              <Text style={[styles.stockNum, { color: urg.color }]}>
                {item.stock_actual} {item.unidad}
              </Text>
              <Text style={styles.stockLbl}>Actual</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
            <View style={styles.stockCol}>
              <Text style={[styles.stockNum, { color: colors.textSecondary }]}>
                {item.stock_minimo} {item.unidad}
              </Text>
              <Text style={styles.stockLbl}>Mínimo</Text>
            </View>
            <View style={[styles.deficitBadge, { backgroundColor: urg.color + '22' }]}>
              <Text style={[styles.deficitText, { color: urg.color }]}>
                −{deficit(item)} {item.unidad}
              </Text>
              <Text style={styles.deficitLbl}>déficit</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alertas de Stock</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{alertas.length}</Text>
        </View>
      </View>

      {alertas.length === 0 ? (
        <View style={styles.emptyFull}>
          <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          <Text style={styles.emptyTitle}>¡Todo en orden!</Text>
          <Text style={styles.emptyDesc}>No hay suministros bajo el nivel mínimo.</Text>
        </View>
      ) : (
        <>
          {/* Banner de aviso */}
          <View style={styles.banner}>
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={styles.bannerText}>
              {alertas.length} suministro{alertas.length > 1 ? 's' : ''} bajo el nivel mínimo. Notifica a Caja para reponer.
            </Text>
          </View>

          <FlatList
            data={alertas}
            keyExtractor={item => String(item.id)}
            renderItem={renderAlerta}
            contentContainerStyle={styles.lista}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  headerTitle: { flex: 1, fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary },
  countBadge: {
    backgroundColor: colors.danger,
    borderRadius: radius.full,
    minWidth: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  countText: { color: colors.white, fontSize: fontSize.sm, fontWeight: '700' },
  banner: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.danger + '11',
    borderWidth: 1,
    borderColor: colors.danger + '33',
    marginHorizontal: spacing.lg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  bannerText: { flex: 1, color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20 },
  lista: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  urgIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: { flex: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  nombre: { fontSize: fontSize.md, fontWeight: '600', color: colors.textPrimary },
  urgBadge: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  urgText: { fontSize: fontSize.xs, fontWeight: '700' },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stockCol: { alignItems: 'center' },
  stockNum: { fontSize: fontSize.sm, fontWeight: '700' },
  stockLbl: { fontSize: fontSize.xs, color: colors.textMuted },
  deficitBadge: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    alignItems: 'center',
    marginLeft: 'auto',
  },
  deficitText: { fontSize: fontSize.xs, fontWeight: '700' },
  deficitLbl: { fontSize: fontSize.xs - 1, color: colors.textMuted },
  emptyFull: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  emptyTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.textPrimary },
  emptyDesc: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center' },
});
