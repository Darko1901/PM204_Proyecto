import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import ScreenHeader from '../../components/ScreenHeader';
import { useMockData } from '../../data/MockDataContext';
import { colors, spacing, typography } from '../../theme';

export default function DetalleItemScreen({ params, navigate, goBack }) {
  const { cuentas, productos, recetas, suministros, cambiarEstadoItem, mesas } = useMockData();
  const cuenta = cuentas.find((c) => c.id === params.cuentaId);
  const item = cuenta?.detalles.find((d) => d.id === params.itemId);

  if (!cuenta || !item) {
    return (
      <View style={styles.flex}>
        <ScreenHeader title="Detalle del ítem" onBack={goBack} />
        <EmptyState title="Ítem no encontrado" />
      </View>
    );
  }

  const producto = productos.find((p) => p.id === item.producto_id);
  const nombreMesa = cuenta.tipo === 'para_llevar'
    ? 'Para llevar'
    : `Mesa ${mesas.find((m) => m.id === cuenta.mesa_id)?.numero ?? cuenta.mesa_id}`;

  const lineasReceta = recetas.filter((r) => r.producto_id === item.producto_id);

  const avanzar = (nuevoEstado) => {
    const ok = cambiarEstadoItem(cuenta.id, item.id, nuevoEstado);
    if (ok && nuevoEstado === 'listo') {
      Alert.alert('Ítem listo', 'Se descontó el inventario automáticamente según la receta.');
    }
    if (ok) goBack();
  };

  const cancelar = () => {
    Alert.alert('Cancelar ítem', '¿Confirmas cancelar este ítem?', [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, cancelar', style: 'destructive', onPress: () => { cambiarEstadoItem(cuenta.id, item.id, 'cancelado'); goBack(); } },
    ]);
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title={producto?.nombre || 'Ítem'} subtitle={`${nombreMesa} · Cuenta #${cuenta.id}`} onBack={goBack} />

      <View style={styles.content}>
        <Card>
          <View style={styles.headerRow}>
            <Text style={typography.h2}>
              {item.cantidad}x {producto?.nombre}
            </Text>
            <Badge estado={item.estado} />
          </View>
          {item.observaciones ? (
            <Text style={styles.obs}>Observaciones: {item.observaciones}</Text>
          ) : null}
        </Card>

        {lineasReceta.length > 0 ? (
          <Card>
            <Text style={styles.seccion}>Consumo de inventario al marcar "Listo"</Text>
            {lineasReceta.map((linea) => {
              const suministro = suministros.find((s) => s.id === linea.suministro_id);
              const requerido = linea.cantidad * item.cantidad;
              return (
                <View key={linea.suministro_id} style={styles.recetaRow}>
                  <Text style={typography.body}>{suministro?.nombre}</Text>
                  <Text style={typography.caption}>
                    -{requerido}
                    {suministro?.unidad} (stock: {suministro?.stock_actual}
                    {suministro?.unidad})
                  </Text>
                </View>
              );
            })}
          </Card>
        ) : null}

        <View style={styles.acciones}>
          {item.estado === 'pendiente' ? (
            <Button title="Iniciar preparación" onPress={() => avanzar('en_preparacion')} />
          ) : null}
          {item.estado === 'en_preparacion' ? (
            <Button title="Marcar como listo" onPress={() => avanzar('listo')} />
          ) : null}
          {item.estado === 'listo' ? (
            <Text style={styles.esperando}>Esperando que el mesero entregue este ítem.</Text>
          ) : null}
          {['pendiente', 'en_preparacion'].includes(item.estado) ? (
            <Button title="Cancelar ítem" variant="danger" onPress={cancelar} style={styles.cancelar} />
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  obs: { marginTop: spacing.sm, color: colors.textMuted },
  seccion: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: spacing.sm },
  recetaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  acciones: { marginTop: spacing.md },
  esperando: { textAlign: 'center', color: colors.textMuted, fontWeight: '600', marginBottom: spacing.sm },
  cancelar: { marginTop: spacing.sm },
});
