import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import ScreenHeader from '../../components/ScreenHeader';
import { useMockData } from '../../data/MockDataContext';
import { colors, spacing, typography } from '../../theme';

function minutosTranscurridos(iso) {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

export default function ColaPedidosScreen({ navigate }) {
  const { cuentas, productos, mesas } = useMockData();

  const cola = useMemo(() => {
    const items = [];
    cuentas.forEach((cuenta) => {
      cuenta.detalles.forEach((d) => {
        if (['pendiente', 'en_preparacion'].includes(d.estado)) {
          items.push({ ...d, cuentaId: cuenta.id, mesaId: cuenta.mesa_id, tipo: cuenta.tipo });
        }
      });
    });
    return items.sort((a, b) => new Date(a.creado_en) - new Date(b.creado_en));
  }, [cuentas]);

  const nombreProducto = (id) => productos.find((p) => p.id === id)?.nombre || `Producto ${id}`;
  const nombreMesa = (mesaId, tipo) => {
    if (tipo === 'para_llevar') return 'Para llevar';
    const mesa = mesas.find((m) => m.id === mesaId);
    return mesa ? `Mesa ${mesa.numero}` : '—';
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Cola de pedidos" subtitle={`${cola.length} ítems activos`} />
      <FlatList
        data={cola}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={styles.lista}
        renderItem={({ item }) => {
          const minutos = minutosTranscurridos(item.creado_en);
          const demorado = minutos > 10;
          return (
            <Card onPress={() => navigate('DetalleItem', { cuentaId: item.cuentaId, itemId: item.id })}>
              <View style={styles.row}>
                <View style={styles.flex1}>
                  <Text style={typography.h3}>
                    {item.cantidad}x {nombreProducto(item.producto_id)}
                  </Text>
                  <Text style={typography.caption}>{nombreMesa(item.mesaId, item.tipo)}</Text>
                  {item.observaciones ? (
                    <Text style={typography.caption}>Obs: {item.observaciones}</Text>
                  ) : null}
                </View>
                <View style={styles.right}>
                  <Badge estado={item.estado} />
                  <Text style={[styles.tiempo, demorado && styles.tiempoDemorado]}>
                    {minutos} min
                  </Text>
                </View>
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          <EmptyState icon="flame-outline" title="Sin pedidos pendientes" subtitle="Cocina libre" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  flex1: { flex: 1 },
  lista: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  right: { alignItems: 'flex-end', gap: 6 },
  tiempo: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  tiempoDemorado: { color: colors.danger },
});
