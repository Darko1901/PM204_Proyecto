import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../../theme/colors';
import { mockCuentas } from '../../data/mockData';

const ESTADO_COCINA_COLORS = {
  pendiente: colors.textMuted,
  en_preparacion: colors.warning,
  listo: colors.success,
  entregado: colors.info,
  cancelado: colors.danger,
};

const ESTADO_COCINA_LABELS = {
  pendiente: 'Pendiente',
  en_preparacion: 'En preparación',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export default function DetalleCuentaScreen({ route, navigation }) {
  const { cuenta: cuentaParam, carrito: carritoParam, usuario } = route.params || {};

  // Usar cuenta mock o la construida desde el carrito o buscar por mesa
  const cuenta = cuentaParam?.detalles
    ? cuentaParam
    : route.params?.mesa
      ? (mockCuentas.find(c => c.mesa_id === route.params.mesa.id) || {
          id: 1000 + route.params.mesa.id,
          mesa_id: route.params.mesa.id,
          mesa: { numero: route.params.mesa.numero },
          mesero_id: usuario?.id || 1,
          tipo: 'en_mesa',
          estado: 'abierta',
          total: 0,
          detalles: [],
          abierta_en: new Date().toISOString(),
        })
      : mockCuentas[0];

  const detalles = carritoParam
    ? carritoParam.map((c, i) => ({
        id: i + 1,
        producto: { nombre: c.nombre },
        cantidad: c.cantidad,
        precio_unitario: c.precio,
        estado: 'pendiente',
        observaciones: null,
      }))
    : cuenta.detalles;

  const total = detalles.reduce((s, d) => s + d.precio_unitario * d.cantidad, 0);

  const handleCobrar = () => {
    Alert.alert(
      'Enviar a cobrar',
      `El total es $${total.toFixed(2)}. ¿Deseas pasar la cuenta a Caja?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, enviar',
          onPress: () => {
            // Actualizar estado en mockCuentas
            const idx = mockCuentas.findIndex(c => c.id === cuenta.id);
            if (idx !== -1) {
              mockCuentas[idx].estado = 'por_cobrar';
            }
            Alert.alert('Enviado a Caja', 'La cuenta fue marcada como "por cobrar".');
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home', params: { usuario } }],
            });
          },
        },
      ],
    );
  };

  const renderDetalle = ({ item }) => (
    <View style={styles.detalleRow}>
      <View style={styles.detalleMain}>
        <Text style={styles.detalleNombre}>{item.producto.nombre}</Text>
        {item.observaciones && (
          <View style={styles.obsRow}>
            <Ionicons name="chatbubble-outline" size={12} color={colors.textMuted} />
            <Text style={styles.detalleObs}>{item.observaciones}</Text>
          </View>
        )}
        <View style={[styles.estadoBadge, { backgroundColor: ESTADO_COCINA_COLORS[item.estado] + '22' }]}>
          <Text style={[styles.estadoText, { color: ESTADO_COCINA_COLORS[item.estado] }]}>
            {ESTADO_COCINA_LABELS[item.estado]}
          </Text>
        </View>
      </View>
      <View style={styles.detalleRight}>
        <Text style={styles.detalleCantidad}>×{item.cantidad}</Text>
        <Text style={styles.detallePrecio}>${(item.precio_unitario * item.cantidad).toFixed(2)}</Text>
        <Text style={styles.detallePrecioUnit}>${item.precio_unitario} c/u</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (route.params?.regresarAHome) {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home', params: { usuario } }],
            });
          } else {
            navigation.goBack();
          }
        }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {cuenta.tipo === 'en_mesa' ? `Mesa ${cuenta.mesa?.numero ?? '?'}` : 'Para Llevar'}
          </Text>
          <View style={[styles.estadoCuentaBadge, {
            backgroundColor: cuenta.estado === 'abierta' ? colors.success + '22' : colors.warning + '22',
          }]}>
            <Text style={[styles.estadoCuentaText, {
              color: cuenta.estado === 'abierta' ? colors.success : colors.warning,
            }]}>
              {cuenta.estado === 'abierta' ? 'Abierta' : 'Por cobrar'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Menu', { cuenta, usuario })}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Lista */}
      <FlatList
        data={detalles}
        keyExtractor={item => String(item.id)}
        renderItem={renderDetalle}
        contentContainerStyle={styles.lista}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Sin productos aún</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Menu', { cuenta, usuario })}>
              <Text style={styles.emptyLink}>+ Agregar del menú</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          detalles.length > 0 ? (
            <View style={styles.totalCard}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal ({detalles.length} productos)</Text>
                <Text style={styles.totalValor}>${total.toFixed(2)}</Text>
              </View>
              <View style={styles.totalDivider} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabelBig}>Total</Text>
                <Text style={styles.totalValorBig}>${total.toFixed(2)}</Text>
              </View>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Footer acciones */}
      {detalles.length > 0 && cuenta.estado === 'abierta' && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.btnCobrar} onPress={handleCobrar}>
            <Ionicons name="cash-outline" size={18} color={colors.bg} />
            <Text style={styles.btnCobrarText}>Solicitar Cobro — ${total.toFixed(2)}</Text>
          </TouchableOpacity>
        </View>
      )}
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
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary },
  estadoCuentaBadge: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2, marginTop: 2 },
  estadoCuentaText: { fontSize: fontSize.xs, fontWeight: '600' },
  lista: { paddingHorizontal: spacing.lg, paddingBottom: 90 },
  detalleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
  },
  detalleMain: { flex: 1, marginRight: spacing.md },
  detalleNombre: { fontSize: fontSize.md, fontWeight: '600', color: colors.textPrimary, marginBottom: 4 },
  obsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.xs },
  detalleObs: { fontSize: fontSize.xs, color: colors.textMuted, flex: 1 },
  estadoBadge: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2, alignSelf: 'flex-start' },
  estadoText: { fontSize: fontSize.xs, fontWeight: '600' },
  detalleRight: { alignItems: 'flex-end' },
  detalleCantidad: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: 2 },
  detallePrecio: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary },
  detallePrecioUnit: { fontSize: fontSize.xs, color: colors.textMuted },
  separator: { height: 1, backgroundColor: colors.border },
  totalCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  totalLabel: { color: colors.textSecondary, fontSize: fontSize.sm },
  totalValor: { color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: '600' },
  totalDivider: { height: 1, backgroundColor: colors.border, marginBottom: spacing.sm },
  totalLabelBig: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: '700' },
  totalValorBig: { color: colors.primary, fontSize: fontSize.xl, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyText: { color: colors.textMuted, fontSize: fontSize.md, marginBottom: spacing.sm },
  emptyLink: { color: colors.primary, fontSize: fontSize.md, fontWeight: '600' },
  footer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: spacing.lg,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  btnCobrar: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  btnCobrarText: { color: colors.bg, fontWeight: '700', fontSize: fontSize.md },
});
