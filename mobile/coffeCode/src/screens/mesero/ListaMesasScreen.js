import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { colors, spacing, radius, fontSize } from '../../theme/colors';
import { mockMesas, mockCuentas } from '../../data/mockData';
import ScalePressable from '../../components/ScalePressable';

export default function ListaMesasScreen({ route, navigation }) {
  const { usuario, soloDisponibles } = route.params || {};
  const isFocused = useIsFocused();
  const mesas = mockMesas;

  const libres = mesas.filter(m => m.activa && !m.ocupada).length;
  const ocupadas = mesas.filter(m => m.activa && m.ocupada).length;

  const mesasFiltradas = mesas.filter(m => {
    if (soloDisponibles) return m.activa && !m.ocupada;
    return m.activa;
  });

  const mesasMostradas = soloDisponibles
    ? [{ id: 'para_llevar', virtual: true }, ...mesasFiltradas]
    : mesasFiltradas;

  const renderMesa = ({ item }) => {
    if (item.virtual) {
      return (
        <ScalePressable
          style={[styles.mesaCard, { borderColor: colors.primary + '55' }]}
          onPress={() => {
            const cuentaNueva = {
              id: Date.now(),
              tipo: 'para_llevar',
              estado: 'abierta',
              total: 0,
              detalles: [],
              mesero_id: usuario?.id,
            };
            navigation.navigate('Menu', { cuenta: cuentaNueva, usuario });
          }}
        >
          <View style={[styles.mesaIndicator, { backgroundColor: colors.primary }]} />
          <Text style={styles.mesaNumero}>Para Llevar</Text>
          <View style={styles.mesaInfo}>
            <Ionicons name="bag-handle-outline" size={14} color={colors.textMuted} />
            <Text style={styles.mesaCapacidad}>Sin mesa física</Text>
          </View>
          <View style={[styles.estadoBadge, { backgroundColor: colors.primary + '22' }]}>
            <Text style={[styles.estadoText, { color: colors.primary }]}>Llevar</Text>
          </View>
          <Ionicons name="add-circle" size={20} color={colors.primary} style={styles.actionIcon} />
        </ScalePressable>
      );
    }

    const cuentaMesa = mockCuentas.find(c => c.mesa_id === item.id && c.estado === 'por_cobrar');
    const estado = !item.activa
      ? 'inactiva'
      : cuentaMesa
        ? 'por_cobrar'
        : item.ocupada
          ? 'ocupada'
          : 'libre';

    const estadoColors = {
      libre: colors.success,
      ocupada: colors.danger,
      por_cobrar: colors.warning,
      inactiva: colors.textMuted,
    };
    const estadoLabels = {
      libre: 'Libre',
      ocupada: 'Ocupada',
      por_cobrar: 'Por Cobrar',
      inactiva: 'Inactiva',
    };

    return (
      <ScalePressable
        style={[styles.mesaCard, { borderColor: estadoColors[estado] + '55' }]}
        onPress={() => {
          if (soloDisponibles) {
            navigation.navigate('Menu', {
              cuenta: { id: Date.now(), mesa: item, tipo: 'en_mesa', estado: 'abierta', total: 0, detalles: [], mesero_id: usuario?.id },
              usuario
            });
          } else {
            if (estado === 'libre') navigation.navigate('AbrirCuenta', { mesa: item, usuario });
            else if (estado === 'ocupada' || estado === 'por_cobrar') navigation.navigate('DetalleCuenta', { mesa: item, usuario });
          }
        }}
        disabled={estado === 'inactiva'}
      >
        <View style={[styles.mesaIndicator, { backgroundColor: estadoColors[estado] }]} />
        <Text style={styles.mesaNumero}>Mesa {item.numero}</Text>
        <View style={styles.mesaInfo}>
          <Ionicons name="people-outline" size={14} color={colors.textMuted} />
          <Text style={styles.mesaCapacidad}>{item.capacidad} personas</Text>
        </View>
        <View style={[styles.estadoBadge, { backgroundColor: estadoColors[estado] + '22' }]}>
          <Text style={[styles.estadoText, { color: estadoColors[estado] }]}>
            {estadoLabels[estado]}
          </Text>
        </View>
        {estado === 'libre' && (
          <Ionicons name="add-circle" size={20} color={colors.success} style={styles.actionIcon} />
        )}
        {estado === 'ocupada' && (
          <Ionicons name="eye" size={20} color={colors.info} style={styles.actionIcon} />
        )}
        {estado === 'por_cobrar' && (
          <Ionicons name="cash-outline" size={20} color={colors.warning} style={styles.actionIcon} />
        )}
      </ScalePressable>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{soloDisponibles ? "Seleccionar Mesa" : "Mesas"}</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.sectionTitle}>Mesas Disponibles</Text>



      <FlatList
        data={mesasMostradas}
        keyExtractor={item => String(item.id)}
        renderItem={renderMesa}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
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
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },

  grid: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  row: { gap: spacing.md, marginBottom: spacing.md },
  mesaCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 120,
  },
  mesaIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  mesaNumero: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  mesaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  mesaCapacidad: { fontSize: fontSize.xs, color: colors.textMuted },
  estadoBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  estadoText: { fontSize: 10, fontWeight: '600' },
  actionIcon: { position: 'absolute', bottom: spacing.md, right: spacing.md },
});
