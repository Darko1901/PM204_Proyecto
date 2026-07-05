import React from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import ScreenHeader from '../../components/ScreenHeader';
import { useMockData } from '../../data/MockDataContext';
import { colors, spacing, typography } from '../../theme';

export default function EstadoCuentaScreen({ params, navigate, goBack }) {
  const { cuentas, productos, mesas, cambiarEstadoItem, cambiarEstadoCuenta } = useMockData();
  const cuenta = cuentas.find((c) => c.id === params.cuentaId);

  if (!cuenta) {
    return (
      <View style={styles.flex}>
        <ScreenHeader title="Estado de cuenta" onBack={goBack} />
        <EmptyState title="Cuenta no encontrada" />
      </View>
    );
  }

  const nombreProducto = (id) => productos.find((p) => p.id === id)?.nombre || `Producto ${id}`;
  const nombreMesa = cuenta.mesa_id
    ? `Mesa ${mesas.find((m) => m.id === cuenta.mesa_id)?.numero ?? cuenta.mesa_id}`
    : 'Para llevar';

  const marcarEntregado = (itemId) => {
    cambiarEstadoItem(cuenta.id, itemId, 'entregado');
  };

  const pedirCuenta = () => {
    const ok = cambiarEstadoCuenta(cuenta.id, 'por_cobrar');
    if (ok) {
      Alert.alert('Cuenta solicitada', 'La cuenta pasó a "Por cobrar". Caja podrá procesarla.');
    }
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader
        title={`${nombreMesa} · #${cuenta.id}`}
        subtitle="Estado de la cuenta"
        onBack={goBack}
        right={<Badge estado={cuenta.estado} />}
      />

      <FlatList
        data={cuenta.detalles}
        keyExtractor={(d) => String(d.id)}
        contentContainerStyle={styles.lista}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.itemRow}>
              <View style={styles.flex1}>
                <Text style={typography.h3}>
                  {item.cantidad}x {nombreProducto(item.producto_id)}
                </Text>
                {item.observaciones ? (
                  <Text style={typography.caption}>Obs: {item.observaciones}</Text>
                ) : null}
                <Text style={styles.precio}>${(item.precio_unitario * item.cantidad).toFixed(2)}</Text>
              </View>
              <View style={styles.itemRight}>
                <Badge estado={item.estado} />
                {item.estado === 'listo' ? (
                  <Button
                    title="Entregar"
                    variant="secondary"
                    fullWidth={false}
                    style={styles.entregarBtn}
                    onPress={() => marcarEntregado(item.id)}
                  />
                ) : null}
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={<EmptyState title="Sin ítems todavía" />}
      />

      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <Text style={typography.body}>Total acumulado</Text>
          <Text style={styles.total}>${cuenta.total.toFixed(2)}</Text>
        </View>
        {cuenta.estado === 'abierta' ? (
          <Button title="Pedir la cuenta" onPress={pedirCuenta} />
        ) : (
          <Text style={styles.leyenda}>
            {cuenta.estado === 'por_cobrar'
              ? 'Esperando cobro en Caja'
              : cuenta.estado === 'pagada'
              ? 'Cuenta pagada'
              : 'Cuenta cancelada'}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  flex1: { flex: 1 },
  lista: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between' },
  itemRight: { alignItems: 'flex-end', gap: spacing.sm },
  precio: { marginTop: 4, fontWeight: '700', color: colors.primary },
  entregarBtn: { paddingVertical: 6, paddingHorizontal: spacing.md },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  total: { fontSize: 20, fontWeight: '800', color: colors.text },
  leyenda: { textAlign: 'center', color: colors.textMuted, fontWeight: '600' },
});
