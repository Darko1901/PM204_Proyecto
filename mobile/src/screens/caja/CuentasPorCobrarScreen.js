import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import ScreenHeader from '../../components/ScreenHeader';
import { useMockData } from '../../data/MockDataContext';
import { colors, spacing, typography } from '../../theme';

export default function CuentasPorCobrarScreen({ navigate }) {
  const { cuentas, mesas } = useMockData();
  const porCobrar = cuentas
    .filter((c) => c.estado === 'por_cobrar')
    .sort((a, b) => new Date(a.abierta_en) - new Date(b.abierta_en));

  const nombreMesa = (mesaId) => {
    const mesa = mesas.find((m) => m.id === mesaId);
    return mesa ? `Mesa ${mesa.numero}` : 'Para llevar';
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Cuentas por cobrar" subtitle={`${porCobrar.length} pendientes`} />
      <FlatList
        data={porCobrar}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={styles.lista}
        renderItem={({ item }) => (
          <Card onPress={() => navigate('Cobro', { cuentaId: item.id })}>
            <View style={styles.row}>
              <View>
                <Text style={typography.h3}>{nombreMesa(item.mesa_id)}</Text>
                <Text style={typography.caption}>
                  Mesero: {item.mesero_nombre} · {item.detalles.length} ítems
                </Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.total}>${item.total.toFixed(2)}</Text>
                <Badge estado={item.estado} />
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState icon="card-outline" title="Todo cobrado" subtitle="No hay cuentas pendientes por cobrar" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  lista: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  right: { alignItems: 'flex-end', gap: 6 },
  total: { fontSize: 16, fontWeight: '800', color: colors.text },
});
