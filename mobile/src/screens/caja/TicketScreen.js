import React from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import ScreenHeader from '../../components/ScreenHeader';
import { useMockData } from '../../data/MockDataContext';
import { colors, spacing, typography } from '../../theme';

export default function TicketScreen({ params, navigate }) {
  const { tickets, productos } = useMockData();
  const ticket = tickets.find((t) => t.id === params.ticketId);

  const nombreProducto = (id) => productos.find((p) => p.id === id)?.nombre || `Producto ${id}`;

  if (!ticket) {
    return (
      <View style={styles.flex}>
        <ScreenHeader title="Ticket" />
        <EmptyState title="Ticket no encontrado" />
      </View>
    );
  }

  const nuevaVenta = () => navigate('CuentasPorCobrar', {}, { reset: true });

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Ticket de venta" subtitle={ticket.folio} />
      <View style={styles.content}>
        <Card style={styles.headerCard}>
          <Text style={styles.brand}>CoffeeCode Cafetería</Text>
          <Text style={typography.caption}>Folio: {ticket.folio}</Text>
          <Text style={typography.caption}>
            Fecha: {new Date(ticket.emitido_en).toLocaleString()}
          </Text>
          <Text style={typography.caption}>Mesero: {ticket.mesero_nombre}</Text>
        </Card>

        <FlatList
          data={ticket.detalles}
          keyExtractor={(d) => String(d.id)}
          style={styles.detalleLista}
          renderItem={({ item }) => (
            <View style={styles.itemRow}>
              <Text style={typography.body}>
                {item.cantidad}x {nombreProducto(item.producto_id)}
              </Text>
              <Text style={styles.itemPrecio}>${(item.precio_unitario * item.cantidad).toFixed(2)}</Text>
            </View>
          )}
        />

        <View style={styles.resumen}>
          <View style={styles.resumenRow}>
            <Text style={typography.body}>Total</Text>
            <Text style={styles.total}>${ticket.total.toFixed(2)}</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={typography.caption}>Método</Text>
            <Text style={typography.caption}>{ticket.metodo}</Text>
          </View>
          {ticket.metodo === 'efectivo' ? (
            <>
              <View style={styles.resumenRow}>
                <Text style={typography.caption}>Recibido</Text>
                <Text style={typography.caption}>${ticket.monto_recibido.toFixed(2)}</Text>
              </View>
              <View style={styles.resumenRow}>
                <Text style={typography.caption}>Cambio</Text>
                <Text style={typography.caption}>${ticket.cambio.toFixed(2)}</Text>
              </View>
            </>
          ) : null}
        </View>

        <Button
          title="Compartir"
          variant="secondary"
          onPress={() => Alert.alert('Compartir', 'Ticket listo para compartir (demo)')}
          style={styles.btnCompartir}
        />
        <Button title="Nueva venta" onPress={nuevaVenta} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: spacing.md },
  headerCard: { alignItems: 'center' },
  brand: { fontSize: 17, fontWeight: '800', color: colors.primary, marginBottom: 4 },
  detalleLista: { flexGrow: 0, maxHeight: 220, marginBottom: spacing.sm },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemPrecio: { fontWeight: '700' },
  resumen: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  resumenRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  total: { fontSize: 20, fontWeight: '800', color: colors.primary },
  btnCompartir: { marginBottom: spacing.sm },
});
