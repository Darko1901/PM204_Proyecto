import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ScreenHeader from '../../components/ScreenHeader';
import TextField from '../../components/TextField';
import { useMockData } from '../../data/MockDataContext';
import { colors, radius, spacing, typography } from '../../theme';

export default function CompraSuministrosScreen() {
  const { suministros, compras, registrarCompra } = useMockData();
  const [proveedor, setProveedor] = useState('');
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [suministroId, setSuministroId] = useState(null);
  const [cantidadTexto, setCantidadTexto] = useState('');
  const [costoTexto, setCostoTexto] = useState('');
  const [lineas, setLineas] = useState([]);
  const [error, setError] = useState('');

  const suministroSeleccionado = suministros.find((s) => s.id === suministroId);
  const total = lineas.reduce((sum, l) => sum + l.cantidad * l.costo_unitario, 0);

  const agregarLinea = () => {
    const cantidad = parseFloat(cantidadTexto.replace(',', '.'));
    const costo = parseFloat(costoTexto.replace(',', '.'));
    if (!suministroId) {
      setError('Selecciona un suministro');
      return;
    }
    if (!cantidad || cantidad <= 0) {
      setError('La cantidad debe ser mayor a 0');
      return;
    }
    if (!costo || costo <= 0) {
      setError('El costo unitario debe ser mayor a 0');
      return;
    }
    setLineas((prev) => [...prev, { suministro_id: suministroId, cantidad, costo_unitario: costo }]);
    setSuministroId(null);
    setCantidadTexto('');
    setCostoTexto('');
    setError('');
  };

  const quitarLinea = (index) => {
    setLineas((prev) => prev.filter((_, i) => i !== index));
  };

  const confirmar = () => {
    if (lineas.length === 0) {
      setError('Agrega una línea a la compra');
      return;
    }
    registrarCompra({ proveedor: proveedor || 'Proveedor sin nombre', lineas });
    Alert.alert('Compra registrada', `Total: $${total.toFixed(2)}. El stock fue actualizado.`);
    setProveedor('');
    setLineas([]);
    setError('');
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Compra de suministros" subtitle="Registra entradas de inventario" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <TextField label="Proveedor" placeholder="Nombre del proveedor" value={proveedor} onChangeText={setProveedor} />

        <Text style={styles.seccion}>Agregar línea</Text>
        <Pressable style={styles.selector} onPress={() => setSelectorAbierto((v) => !v)}>
          <Text style={suministroSeleccionado ? styles.selectorTexto : styles.selectorPlaceholder}>
            {suministroSeleccionado ? suministroSeleccionado.nombre : 'Selecciona un suministro'}
          </Text>
          <Text style={styles.selectorChevron}>{selectorAbierto ? '▲' : '▼'}</Text>
        </Pressable>
        {selectorAbierto ? (
          <View style={styles.opciones}>
            {suministros.map((s) => (
              <Pressable
                key={s.id}
                style={styles.opcion}
                onPress={() => {
                  setSuministroId(s.id);
                  setSelectorAbierto(false);
                }}
              >
                <Text style={typography.body}>{s.nombre}</Text>
                <Text style={typography.caption}>
                  Stock: {s.stock_actual}
                  {s.unidad}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.filaCantidadCosto}>
          <TextField
            label={`Cantidad (${suministroSeleccionado?.unidad || 'u.'})`}
            keyboardType="decimal-pad"
            placeholder="0"
            value={cantidadTexto}
            onChangeText={setCantidadTexto}
            style={styles.mitad}
          />
          <TextField
            label="Costo unitario"
            keyboardType="decimal-pad"
            placeholder="0.00"
            value={costoTexto}
            onChangeText={setCostoTexto}
            style={styles.mitad}
          />
        </View>

        <Button title="+ Agregar línea" variant="secondary" onPress={agregarLinea} style={styles.btnAgregarLinea} />

        {lineas.length > 0 ? (
          <View style={styles.lineasWrap}>
            {lineas.map((l, index) => {
              const suministro = suministros.find((s) => s.id === l.suministro_id);
              return (
                <View key={index} style={styles.lineaRow}>
                  <View style={styles.flex1}>
                    <Text style={typography.body}>{suministro?.nombre}</Text>
                    <Text style={typography.caption}>
                      {l.cantidad}
                      {suministro?.unidad} × ${l.costo_unitario.toFixed(2)}
                    </Text>
                  </View>
                  <Text style={styles.lineaTotal}>${(l.cantidad * l.costo_unitario).toFixed(2)}</Text>
                  <Pressable onPress={() => quitarLinea(index)} hitSlop={8}>
                    <Text style={styles.quitar}>✕</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.totalRow}>
          <Text style={typography.h3}>Total de la compra</Text>
          <Text style={styles.totalValor}>${total.toFixed(2)}</Text>
        </View>

        <Button title="Registrar compra" onPress={confirmar} style={styles.confirmar} />

        <Text style={styles.seccionHistorial}>Historial reciente</Text>
        {compras.slice(0, 5).map((c) => (
          <Card key={c.id}>
            <View style={styles.historialRow}>
              <View>
                <Text style={typography.h3}>{c.proveedor}</Text>
                <Text style={typography.caption}>
                  {new Date(c.comprado_en).toLocaleDateString()} · {c.lineas.length} líneas
                </Text>
              </View>
              <Text style={styles.historialTotal}>${c.total.toFixed(2)}</Text>
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  seccion: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: spacing.sm },
  seccionHistorial: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  selectorTexto: { color: colors.text, fontWeight: '600' },
  selectorPlaceholder: { color: colors.mist },
  selectorChevron: { color: colors.textMuted },
  opciones: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginTop: 4,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  opcion: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filaCantidadCosto: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  mitad: { flex: 1 },
  btnAgregarLinea: { marginBottom: spacing.md },
  lineasWrap: { marginBottom: spacing.md },
  lineaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  flex1: { flex: 1 },
  lineaTotal: { fontWeight: '700', color: colors.text },
  quitar: { color: colors.danger, fontSize: 16, fontWeight: '700', paddingHorizontal: 4 },
  error: { color: colors.danger, marginBottom: spacing.sm, textAlign: 'center' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  totalValor: { fontSize: 20, fontWeight: '800', color: colors.primary },
  confirmar: { marginBottom: spacing.md },
  historialRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historialTotal: { fontWeight: '800', color: colors.text },
});
