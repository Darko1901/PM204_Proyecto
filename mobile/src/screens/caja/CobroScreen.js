import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import ScreenHeader from '../../components/ScreenHeader';
import TextField from '../../components/TextField';
import { useMockData } from '../../data/MockDataContext';
import { colors, radius, spacing, typography } from '../../theme';

const METODOS = [
  { key: 'efectivo', label: 'Efectivo' },
  { key: 'tarjeta', label: 'Tarjeta' },
  { key: 'transferencia', label: 'Transferencia' },
  { key: 'otro', label: 'Otro' },
];

export default function CobroScreen({ params, navigate, goBack }) {
  const { cuentas, productos, mesas, cobrarCuenta } = useMockData();
  const cuenta = cuentas.find((c) => c.id === params.cuentaId);
  const [metodo, setMetodo] = useState('efectivo');
  const [montoTexto, setMontoTexto] = useState('');
  const [error, setError] = useState('');

  const nombreProducto = (id) => productos.find((p) => p.id === id)?.nombre || `Producto ${id}`;
  const nombreMesa = cuenta?.mesa_id
    ? `Mesa ${mesas.find((m) => m.id === cuenta.mesa_id)?.numero ?? cuenta.mesa_id}`
    : 'Para llevar';

  const monto = parseFloat(montoTexto.replace(',', '.')) || 0;
  const cambio = useMemo(() => (cuenta ? Math.max(0, monto - cuenta.total) : 0), [monto, cuenta]);

  if (!cuenta) {
    return (
      <View style={styles.flex}>
        <ScreenHeader title="Cobro" onBack={goBack} />
        <EmptyState title="Cuenta no encontrada" />
      </View>
    );
  }

  const confirmar = () => {
    const montoFinal = metodo === 'efectivo' ? monto : cuenta.total;
    if (metodo === 'efectivo' && monto < cuenta.total) {
      setError('El monto recibido debe ser mayor o igual al total');
      return;
    }
    const resultado = cobrarCuenta(cuenta.id, { metodo, monto: montoFinal });
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    navigate('Ticket', { ticketId: resultado.ticket.id }, { replace: true });
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title={`Cobro · ${nombreMesa}`} subtitle={`Cuenta #${cuenta.id}`} onBack={goBack} />

      <FlatList
        data={cuenta.detalles}
        keyExtractor={(d) => String(d.id)}
        contentContainerStyle={styles.lista}
        ListHeaderComponent={<Text style={styles.seccion}>Desglose</Text>}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Text style={typography.body}>
              {item.cantidad}x {nombreProducto(item.producto_id)}
            </Text>
            <Text style={styles.itemPrecio}>${(item.precio_unitario * item.cantidad).toFixed(2)}</Text>
          </View>
        )}
        ListFooterComponent={
          <>
            <View style={styles.totalRow}>
              <Text style={typography.h3}>Total a cobrar</Text>
              <Text style={styles.totalValor}>${cuenta.total.toFixed(2)}</Text>
            </View>

            <Text style={styles.seccion}>Método de pago</Text>
            <View style={styles.metodosRow}>
              {METODOS.map((m) => (
                <Pressable
                  key={m.key}
                  onPress={() => setMetodo(m.key)}
                  style={[styles.metodoChip, metodo === m.key && styles.metodoChipActive]}
                >
                  <Text style={[styles.metodoText, metodo === m.key && styles.metodoTextActive]}>
                    {m.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {metodo === 'efectivo' ? (
              <>
                <TextField
                  label="Monto recibido"
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  value={montoTexto}
                  onChangeText={setMontoTexto}
                />
                <View style={styles.cambioRow}>
                  <Text style={typography.body}>Cambio</Text>
                  <Text style={styles.cambioValor}>${cambio.toFixed(2)}</Text>
                </View>
              </>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button title="Confirmar cobro" onPress={confirmar} style={styles.confirmar} />
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  lista: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  seccion: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginTop: spacing.md, marginBottom: spacing.sm },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemPrecio: { fontWeight: '700', color: colors.text },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
  },
  totalValor: { fontSize: 22, fontWeight: '800', color: colors.primary },
  metodosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metodoChip: {
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  metodoChipActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}12` },
  metodoText: { fontWeight: '700', color: colors.textMuted, fontSize: 13 },
  metodoTextActive: { color: colors.primary },
  cambioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cambioValor: { fontWeight: '800', color: colors.success, fontSize: 16 },
  error: { color: colors.danger, marginBottom: spacing.sm, textAlign: 'center' },
  confirmar: { marginTop: spacing.sm },
});
