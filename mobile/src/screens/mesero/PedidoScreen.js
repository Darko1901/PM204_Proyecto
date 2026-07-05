import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import Button from '../../components/Button';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import ScreenHeader from '../../components/ScreenHeader';
import Stepper from '../../components/Stepper';
import { useMockData } from '../../data/MockDataContext';
import { colors, spacing, typography } from '../../theme';

export default function PedidoScreen({ params, navigate, goBack }) {
  const { productos, cuentas, agregarItem } = useMockData();
  const cuenta = cuentas.find((c) => c.id === params.cuentaId);
  const [busqueda, setBusqueda] = useState('');
  const [cantidades, setCantidades] = useState({});

  const disponibles = useMemo(
    () =>
      productos.filter(
        (p) => p.disponible && p.nombre.toLowerCase().includes(busqueda.toLowerCase())
      ),
    [productos, busqueda]
  );

  if (!cuenta) {
    return (
      <View style={styles.flex}>
        <ScreenHeader title="Pedido" onBack={goBack} />
        <EmptyState title="Cuenta no encontrada" />
      </View>
    );
  }

  const cantidadEnPedido = (productoId) =>
    cuenta.detalles.filter((d) => d.producto_id === productoId && d.estado !== 'cancelado').length
      ? cuenta.detalles
          .filter((d) => d.producto_id === productoId && d.estado !== 'cancelado')
          .reduce((s, d) => s + d.cantidad, 0)
      : 0;

  const agregar = (producto) => {
    const cantidad = cantidades[producto.id] || 1;
    agregarItem(cuenta.id, { producto_id: producto.id, cantidad, observaciones: '' });
    setCantidades((prev) => ({ ...prev, [producto.id]: 1 }));
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader
        title={cuenta.tipo === 'en_mesa' ? `Pedido · Mesa` : 'Pedido · Para llevar'}
        subtitle={`Cuenta #${cuenta.id} · Total: $${cuenta.total.toFixed(2)}`}
        onBack={goBack}
      />

      <TextInput
        placeholder="Buscar producto..."
        value={busqueda}
        onChangeText={setBusqueda}
        style={styles.buscador}
        placeholderTextColor={colors.mist}
      />

      <FlatList
        data={disponibles}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={styles.lista}
        renderItem={({ item }) => {
          const enPedido = cantidadEnPedido(item.id);
          return (
            <Card>
              <View style={styles.row}>
                <View style={styles.flex1}>
                  <Text style={typography.h3}>{item.nombre}</Text>
                  <Text style={typography.caption}>{item.descripcion}</Text>
                  <Text style={styles.precio}>${item.precio.toFixed(2)}</Text>
                  {enPedido > 0 ? (
                    <Text style={styles.enPedido}>{enPedido} en este pedido</Text>
                  ) : null}
                </View>
                <View style={styles.acciones}>
                  <Stepper
                    value={cantidades[item.id] || 1}
                    onChange={(v) => setCantidades((prev) => ({ ...prev, [item.id]: v }))}
                  />
                  <Button title="Agregar" onPress={() => agregar(item)} style={styles.btnAgregar} />
                </View>
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={<EmptyState title="Sin productos" subtitle="No hay coincidencias" />}
      />

      <View style={styles.footer}>
        <View>
          <Text style={typography.caption}>Total acumulado</Text>
          <Text style={styles.totalValor}>${cuenta.total.toFixed(2)}</Text>
        </View>
        <Button
          title="Ver estado de la cuenta"
          variant="secondary"
          fullWidth={false}
          onPress={() => navigate('EstadoCuenta', { cuentaId: cuenta.id })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  flex1: { flex: 1 },
  buscador: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  lista: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center' },
  precio: { marginTop: 4, fontWeight: '700', color: colors.primary },
  enPedido: { marginTop: 4, fontSize: 12, color: colors.success, fontWeight: '700' },
  acciones: { alignItems: 'flex-end', gap: spacing.sm },
  btnAgregar: { paddingVertical: 8, paddingHorizontal: spacing.md },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  totalValor: { fontSize: 20, fontWeight: '800', color: colors.text },
});
