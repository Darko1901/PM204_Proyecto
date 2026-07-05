import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { colors, spacing, radius, fontSize } from '../../theme/colors';
import { mockSuministros } from '../../data/mockData';
import ScalePressable from '../../components/ScalePressable';

export default function InventarioScreen({ route, navigation }) {
  const { usuario } = route.params || {};
  const isFocused = useIsFocused();
  const [busqueda, setBusqueda] = useState('');
  const suministros = mockSuministros.filter(s =>
    s.activo && s.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const getStockStatus = (s) => {
    const ratio = s.stock_actual / s.stock_minimo;
    if (ratio <= 0) return { color: colors.danger, label: 'Agotado', icon: 'close-circle' };
    if (ratio < 1) return { color: colors.warning, label: 'Bajo', icon: 'warning' };
    if (ratio < 1.5) return { color: colors.info, label: 'Suficiente', icon: 'checkmark-circle' };
    return { color: colors.success, label: 'Óptimo', icon: 'checkmark-circle' };
  };

  const renderSuministro = ({ item }) => {
    const status = getStockStatus(item);
    const porcentaje = Math.min((item.stock_actual / (item.stock_minimo * 2)) * 100, 100);

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <Text style={styles.nombre}>{item.nombre}</Text>
            <Text style={styles.unidad}>Unidad: {item.unidad}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '22' }]}>
            <Ionicons name={status.icon} size={12} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        {/* Barra de stock */}
        <View style={styles.barraContainer}>
          <View style={styles.barraFondo}>
            <View style={[styles.barraRelleno, {
              width: `${porcentaje}%`,
              backgroundColor: status.color,
            }]} />
            {/* Marcador de mínimo */}
            <View style={styles.minMarcador} />
          </View>
        </View>

        <View style={styles.stockRow}>
          <View style={styles.stockItem}>
            <Text style={[styles.stockNum, { color: status.color }]}>
              {item.stock_actual} {item.unidad}
            </Text>
            <Text style={styles.stockLbl}>Actual</Text>
          </View>
          <Ionicons name="remove" size={14} color={colors.textMuted} />
          <View style={styles.stockItem}>
            <Text style={[styles.stockNum, { color: colors.textMuted }]}>
              {item.stock_minimo} {item.unidad}
            </Text>
            <Text style={styles.stockLbl}>Mínimo</Text>
          </View>
        </View>
      </View>
    );
  };

  const agotados = suministros.filter(s => s.stock_actual <= 0).length;
  const bajos = suministros.filter(s => s.stock_actual > 0 && s.stock_actual < s.stock_minimo).length;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inventario</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Alertas */}
      {(agotados > 0 || bajos > 0) && (
        <View style={styles.alertaBanner}>
          <Ionicons name="warning" size={16} color={colors.warning} />
          <Text style={styles.alertaText}>
            {agotados > 0 && `${agotados} agotado${agotados > 1 ? 's' : ''} · `}
            {bajos > 0 && `${bajos} bajo mínimo`}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('AlertasStock')}>
            <Text style={styles.alertaLink}>Ver alertas</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Buscador */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar suministro..."
          placeholderTextColor={colors.textMuted}
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>

      <FlatList
        data={suministros}
        keyExtractor={item => String(item.id)}
        renderItem={renderSuministro}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
      />

      {/* Barra de Navegación Inferior para Cocina */}
      <View style={styles.bottomBar}>
        <ScalePressable
          style={styles.bottomBarTab}
          onPress={() => navigation.navigate('Home', { usuario })}
        >
          <Ionicons name="list-outline" size={22} color={colors.textSecondary} />
          <Text style={styles.bottomBarTabText}>Pedidos</Text>
        </ScalePressable>

        <ScalePressable
          style={styles.bottomBarTab}
          onPress={() => {}} // Ya se encuentra en inventario
        >
          <Ionicons name="cube" size={22} color={colors.primary} />
          <Text style={[styles.bottomBarTabText, { color: colors.primary }]}>Inventario</Text>
        </ScalePressable>

        <ScalePressable
          style={styles.bottomBarTab}
          onPress={() => navigation.navigate('AlertasStock', { usuario })}
        >
          <Ionicons name="warning-outline" size={22} color={colors.textSecondary} />
          <Text style={styles.bottomBarTabText}>Alertas</Text>
        </ScalePressable>
      </View>
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
  alertaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warning + '15',
    borderWidth: 1,
    borderColor: colors.warning + '33',
    marginHorizontal: spacing.lg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  alertaText: { flex: 1, color: colors.warning, fontSize: fontSize.sm },
  alertaLink: { color: colors.primary, fontWeight: '600', fontSize: fontSize.sm },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, color: colors.textPrimary, paddingVertical: spacing.sm, marginLeft: spacing.sm },
  lista: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 12,
    paddingHorizontal: spacing.lg,
  },
  bottomBarTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    width: 70,
    height: '100%',
  },
  bottomBarTabText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  cardLeft: { flex: 1 },
  nombre: { fontSize: fontSize.md, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
  unidad: { fontSize: fontSize.xs, color: colors.textMuted },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  statusText: { fontSize: fontSize.xs, fontWeight: '600' },
  barraContainer: { marginBottom: spacing.sm },
  barraFondo: {
    height: 6,
    backgroundColor: colors.bgCardLight,
    borderRadius: radius.full,
    overflow: 'hidden',
    position: 'relative',
  },
  barraRelleno: {
    height: '100%',
    borderRadius: radius.full,
  },
  minMarcador: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: colors.textMuted + '66',
  },
  stockRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  stockItem: { alignItems: 'center' },
  stockNum: { fontSize: fontSize.md, fontWeight: '700' },
  stockLbl: { fontSize: fontSize.xs, color: colors.textMuted },
});
